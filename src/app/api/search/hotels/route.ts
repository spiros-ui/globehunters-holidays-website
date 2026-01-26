import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@/types";
import {
  MemoryCache,
  generateCacheKey,
  withRetry,
  logError,
  logInfo,
  logWarn,
  ApiRequestError,
  TimeoutError,
  getUserFriendlyErrorMessage,
} from "@/lib/api/fetch-utils";

const RATEHAWK_API = "https://api.worldota.net/api/b2b/v3";
const RATEHAWK_KEY = process.env.RATEHAWK_API_KEY;
const RATEHAWK_KEY_ID = process.env.RATEHAWK_KEY_ID;

// Cache TTLs
const REGION_CACHE_TTL = 60 * 60 * 1000; // 1 hour for region lookups
const HOTEL_SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for hotel searches
const API_TIMEOUT_MS = 15000; // 15 seconds per request

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000, // 1s, 2s, 4s delays
  maxDelayMs: 10000,
};

// In-memory caches (module-level singletons)
const regionCache = new MemoryCache<{ id: string; name: string; country: string }>(REGION_CACHE_TTL);
const hotelSearchCache = new MemoryCache<{
  hotels: any[];
  searchId: string | null;
}>(HOTEL_SEARCH_CACHE_TTL);

// RateHawk uses Basic Auth with keyid:key format
function getAuthHeader(): string {
  let credentials: string;
  if (RATEHAWK_KEY_ID && RATEHAWK_KEY) {
    credentials = Buffer.from(`${RATEHAWK_KEY_ID}:${RATEHAWK_KEY}`).toString("base64");
  } else if (RATEHAWK_KEY) {
    credentials = Buffer.from(`${RATEHAWK_KEY}:${RATEHAWK_KEY}`).toString("base64");
  } else {
    credentials = "";
  }
  return `Basic ${credentials}`;
}

// Fetch with timeout using AbortController
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(`Request timed out after ${timeoutMs}ms`, { url });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Search for region by query (city name, IATA code, etc.)
async function searchRegion(query: string): Promise<{ id: string; name: string; country: string } | null> {
  const cacheKey = generateCacheKey("region", { query: query.toLowerCase() });
  const logContext = { service: "RateHawk", operation: "searchRegion", query };

  // Check cache first
  const cached = regionCache.get(cacheKey);
  if (cached) {
    logInfo("Region cache hit", logContext);
    return cached;
  }

  logInfo("Region cache miss, fetching from API", logContext);

  try {
    const result = await withRetry(
      async () => {
        const response = await fetchWithTimeout(
          `${RATEHAWK_API}/search/multicomplete/`,
          {
            method: "POST",
            headers: {
              "Authorization": getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              language: "en",
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new ApiRequestError(
            `RateHawk region search failed: ${response.status}`,
            {
              status: response.status,
              context: { query, responseBody: errorText.slice(0, 500) },
            }
          );
        }

        return response.json();
      },
      RETRY_CONFIG,
      logContext
    );

    // Find first city/region result
    const regions = result.data?.regions || [];
    if (regions.length > 0) {
      const region = {
        id: String(regions[0].id),
        name: regions[0].name,
        country: regions[0].country || "",
      };

      // Cache the result
      regionCache.set(cacheKey, region);
      logInfo("Region found and cached", { ...logContext, regionId: region.id });

      return region;
    }

    logWarn("No region found for query", logContext);
    return null;
  } catch (error) {
    logError("Region search failed", error, logContext);
    throw error;
  }
}

// Search hotels in a region
async function searchHotels(
  regionId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  rooms: number,
  currency: string
): Promise<{ hotels: any[]; searchId: string | null }> {
  const cacheKey = generateCacheKey("hotels", {
    regionId,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    currency,
  });
  const logContext = {
    service: "RateHawk",
    operation: "searchHotels",
    regionId,
    checkIn,
    checkOut,
  };

  // Check cache first
  const cached = hotelSearchCache.get(cacheKey);
  if (cached) {
    logInfo("Hotel search cache hit", logContext);
    return cached;
  }

  logInfo("Hotel search cache miss, fetching from API", logContext);

  try {
    // Build guests array - distribute adults across rooms
    const adultsPerRoom = Math.ceil(adults / rooms);
    const guests: Array<{ adults: number; children: number[] }> = [];

    for (let i = 0; i < rooms; i++) {
      guests.push({
        adults: adultsPerRoom,
        children: [],
      });
    }

    const result = await withRetry(
      async () => {
        const response = await fetchWithTimeout(
          `${RATEHAWK_API}/search/hp/`,
          {
            method: "POST",
            headers: {
              "Authorization": getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              checkin: checkIn,
              checkout: checkOut,
              residency: "gb",
              language: "en",
              guests,
              region_id: parseInt(regionId),
              currency: currency.toLowerCase(),
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new ApiRequestError(
            `RateHawk hotel search failed: ${response.status}`,
            {
              status: response.status,
              context: { regionId, responseBody: errorText.slice(0, 500) },
            }
          );
        }

        return response.json();
      },
      RETRY_CONFIG,
      logContext
    );

    const searchResult = {
      hotels: result.data?.hotels || [],
      searchId: result.data?.search_id || null,
    };

    // Cache the result
    hotelSearchCache.set(cacheKey, searchResult);
    logInfo("Hotel search completed and cached", {
      ...logContext,
      hotelCount: searchResult.hotels.length,
    });

    return searchResult;
  } catch (error) {
    logError("Hotel search failed", error, logContext);
    throw error;
  }
}

// Calculate number of nights
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Map amenity codes to readable names
function mapAmenities(amenities: string[] | number[]): string[] {
  const amenityMap: Record<string, string> = {
    "has_wifi": "Free WiFi",
    "wifi": "Free WiFi",
    "internet": "Internet",
    "parking": "Parking",
    "has_parking": "Parking",
    "pool": "Swimming Pool",
    "has_pool": "Swimming Pool",
    "gym": "Fitness Center",
    "fitness": "Fitness Center",
    "has_fitness": "Fitness Center",
    "spa": "Spa & Wellness",
    "has_spa": "Spa & Wellness",
    "restaurant": "Restaurant",
    "has_restaurant": "Restaurant",
    "bar": "Bar/Lounge",
    "room_service": "Room Service",
    "breakfast": "Breakfast Available",
    "has_breakfast": "Breakfast",
    "air_conditioning": "Air Conditioning",
    "has_air_conditioning": "Air Conditioning",
    "laundry": "Laundry Service",
    "concierge": "Concierge",
    "business_center": "Business Center",
    "has_business_center": "Business Center",
    "meeting_rooms": "Meeting Rooms",
    "pet_friendly": "Pet Friendly",
    "has_pets": "Pet Friendly",
    "kids_friendly": "Family Friendly",
    "beach": "Beach Access",
    "has_beach": "Beach Access",
    "airport_shuttle": "Airport Shuttle",
    "has_airport_shuttle": "Airport Shuttle",
    "24_hour_front_desk": "24-Hour Front Desk",
  };

  if (!amenities || !Array.isArray(amenities)) return [];

  return amenities
    .map(a => {
      const key = String(a).toLowerCase();
      return amenityMap[key] || null;
    })
    .filter((a): a is string => a !== null)
    .slice(0, 8);
}

// Get hotel image URL from RateHawk
function getImageUrl(imageId: string | number, size: "small" | "medium" | "large" = "large"): string {
  const sizes = {
    small: "240/240",
    medium: "640/400",
    large: "800/520",
  };
  return `https://photos.hotellook.com/image_v2/limit/${imageId}/${sizes[size]}.auto`;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  const logContext = {
    service: "HotelSearchAPI",
    operation: "GET",
    destination,
    checkIn,
    checkOut,
  };

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      {
        error: "Missing required parameters: destination, checkIn, checkOut",
        code: "INVALID_REQUEST",
      },
      { status: 400 }
    );
  }

  if (!RATEHAWK_KEY) {
    logError("RateHawk API key not configured", new Error("Missing API key"), logContext);
    return NextResponse.json(
      {
        error: "Hotel search service is currently unavailable",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 500 }
    );
  }

  try {
    // Step 1: Search for region with retry and caching
    let region: { id: string; name: string; country: string } | null;
    try {
      region = await searchRegion(destination);
    } catch (error) {
      logError("Region lookup failed", error, logContext);
      const userMessage = getUserFriendlyErrorMessage(error);
      return NextResponse.json(
        {
          error: userMessage,
          code: error instanceof TimeoutError ? "TIMEOUT" : "REGION_LOOKUP_FAILED",
          details: process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: 503 }
      );
    }

    if (!region) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        currency,
        message: `No hotels found for destination: ${destination}. Please try a different search term.`,
      });
    }

    // Step 2: Search hotels in region with retry and caching
    let rawHotels: any[];
    let searchId: string | null;
    try {
      const result = await searchHotels(
        region.id,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        currency
      );
      rawHotels = result.hotels;
      searchId = result.searchId;
    } catch (error) {
      logError("Hotel search failed", error, logContext);
      const userMessage = getUserFriendlyErrorMessage(error);
      return NextResponse.json(
        {
          error: userMessage,
          code: error instanceof TimeoutError ? "TIMEOUT" : "HOTEL_SEARCH_FAILED",
          details: process.env.NODE_ENV === "development" ? String(error) : undefined,
        },
        { status: 503 }
      );
    }

    const nights = calculateNights(checkIn, checkOut);

    // Step 3: Transform results
    const hotels = rawHotels.map((hotel: any) => {
      // Get the cheapest rate
      const rates = hotel.rates || [];
      const cheapestRate = rates[0];

      // Calculate total price
      let totalPrice = 0;
      if (cheapestRate?.payment_options?.payment_types?.[0]?.amount) {
        totalPrice = parseFloat(cheapestRate.payment_options.payment_types[0].amount);
      } else if (cheapestRate?.daily_prices) {
        totalPrice = cheapestRate.daily_prices.reduce((a: number, b: number) => a + b, 0);
      }

      // Get images
      const imageIds = hotel.images || [];
      const images = imageIds.slice(0, 10).map((id: string | number) => getImageUrl(id, "large"));
      const thumbnails = imageIds.slice(0, 5).map((id: string | number) => getImageUrl(id, "small"));

      // Determine meal plan
      let mealPlan = "Room Only";
      if (cheapestRate?.meal) {
        const mealMap: Record<string, string> = {
          "nomeal": "Room Only",
          "breakfast": "Breakfast Included",
          "halfboard": "Half Board",
          "fullboard": "Full Board",
          "allinclusive": "All Inclusive",
        };
        mealPlan = mealMap[cheapestRate.meal] || cheapestRate.meal;
      }

      // Determine cancellation policy
      let cancellationPolicy = "Non-refundable";
      let freeCancellation = false;
      if (cheapestRate?.payment_options?.payment_types?.[0]?.cancellation_penalties) {
        const penalties = cheapestRate.payment_options.payment_types[0].cancellation_penalties;
        if (penalties.free_cancellation_before) {
          freeCancellation = true;
          cancellationPolicy = `Free cancellation until ${penalties.free_cancellation_before}`;
        }
      }

      return {
        id: String(hotel.id),
        name: hotel.name || "Hotel",
        starRating: hotel.star_rating || hotel.stars || 0,
        address: hotel.address || "",
        city: region.name,
        country: region.country,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        images,
        thumbnails,
        mainImage: images[0] || null,
        amenities: mapAmenities(hotel.amenity_groups?.flatMap((g: any) => g.amenities) || []),
        description: hotel.description_struct?.map((s: any) => s.paragraphs?.join(" ")).join(" ") || "",
        price: totalPrice,
        pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
        currency,
        nights,
        roomType: cheapestRate?.room_name || "Standard Room",
        mealPlan,
        cancellationPolicy,
        freeCancellation,
        searchId,
        hotelId: hotel.id,
        guests: {
          adults,
          children,
          rooms,
        },
      };
    });

    // Filter out hotels with no price and sort by price
    const validHotels = hotels.filter((h: any) => h.price > 0);
    validHotels.sort((a: any, b: any) => a.price - b.price);

    logInfo("Hotel search completed successfully", {
      ...logContext,
      totalResults: validHotels.length,
      regionId: region.id,
    });

    return NextResponse.json({
      status: true,
      data: validHotels,
      totalResults: validHotels.length,
      currency,
      destination: {
        id: region.id,
        name: region.name,
        country: region.country,
      },
      searchId,
      checkIn,
      checkOut,
      nights,
      guests: {
        adults,
        children,
        rooms,
      },
    });
  } catch (error) {
    logError("Unexpected error in hotel search", error, logContext);
    const userMessage = getUserFriendlyErrorMessage(error);
    return NextResponse.json(
      {
        error: userMessage,
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
