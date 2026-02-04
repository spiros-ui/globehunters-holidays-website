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
const HOTEL_INFO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours for hotel info (rarely changes)
const API_TIMEOUT_MS = 15000; // 15 seconds per request

// Max hotels to fetch details for per page — /hotel/info/ is limited to 30 req per 60s
const PAGE_SIZE = 30;

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

// In-memory caches (module-level singletons)
const regionCache = new MemoryCache<{ id: string; name: string; country: string }>(REGION_CACHE_TTL);
const hotelSearchCache = new MemoryCache<{
  hotels: RawHotelResult[];
  totalHotels: number;
}>(HOTEL_SEARCH_CACHE_TTL);

interface HotelInfo {
  name: string;
  address: string;
  city: string;
  starRating: number;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  description: string;
  checkInTime: string;
  checkOutTime: string;
  hotelChain: string;
}

const hotelInfoCache = new MemoryCache<HotelInfo>(HOTEL_INFO_CACHE_TTL);

// Cache for combined, deduplicated, sorted results across all regions for a search
const combinedResultsCache = new MemoryCache<RawHotelResult[]>(HOTEL_SEARCH_CACHE_TTL);

interface RawHotelResult {
  id: string;
  hid: number;
  rates: any[];
  bar_price_data?: any;
}

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

// Search for regions by query — returns the primary match plus nearby city regions in the same country
async function searchRegions(query: string): Promise<{ id: string; name: string; country: string }[]> {
  const cacheKey = generateCacheKey("region", { query: query.toLowerCase() });
  const logContext = { service: "RateHawk", operation: "searchRegions", query };

  const cached = regionCache.get(cacheKey);
  if (cached) {
    logInfo("Region cache hit", logContext);
    return [cached];
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

    const rawRegions = result.data?.regions || [];
    if (rawRegions.length === 0) {
      logWarn("No region found for query", logContext);
      return [];
    }

    const primary = rawRegions[0];
    const primaryCountry = primary.country_code || primary.country || "";

    // Collect all city-type regions from the same country (e.g. Miami + Miami Beach)
    const regions: { id: string; name: string; country: string }[] = [];
    for (const r of rawRegions) {
      const rCountry = r.country_code || r.country || "";
      const rType = (r.type || "").toLowerCase();
      if (rCountry === primaryCountry && (rType === "city" || rType === "")) {
        regions.push({
          id: String(r.id),
          name: r.name,
          country: rCountry,
        });
      }
    }

    // Ensure at least the primary region is included
    if (regions.length === 0) {
      regions.push({
        id: String(primary.id),
        name: primary.name,
        country: primaryCountry,
      });
    }

    // Cache the primary region for backward compatibility
    regionCache.set(cacheKey, regions[0]);
    logInfo(`Found ${regions.length} region(s) for query`, { ...logContext, regionIds: regions.map(r => r.id) });
    return regions;
  } catch (error) {
    logError("Region search failed", error, logContext);
    throw error;
  }
}

// Search hotels in a region using the correct SERP endpoint
async function searchHotelsInRegion(
  regionId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  childAges: number[],
  rooms: number,
  currency: string
): Promise<{ hotels: RawHotelResult[]; totalHotels: number }> {
  const cacheKey = generateCacheKey("hotel-search", {
    regionId,
    checkIn,
    checkOut,
    adults,
    childAges: childAges.join(","),
    rooms,
    currency,
  });
  const logContext = {
    service: "RateHawk",
    operation: "searchHotelsInRegion",
    regionId,
    checkIn,
    checkOut,
  };

  const cached = hotelSearchCache.get(cacheKey);
  if (cached) {
    logInfo("Hotel search cache hit", logContext);
    return cached;
  }

  logInfo("Hotel search cache miss, fetching from API", logContext);

  try {
    // Build guests array - distribute adults and children across rooms
    const guests: Array<{ adults: number; children: number[] }> = [];
    let remainingAdults = adults;
    for (let i = 0; i < rooms; i++) {
      const adultsThisRoom = Math.ceil(remainingAdults / (rooms - i));
      remainingAdults -= adultsThisRoom;
      guests.push({ adults: adultsThisRoom, children: [] });
    }
    // Distribute children into first room (most common booking pattern)
    // RateHawk expects children as an array of ages per room
    for (const age of childAges) {
      guests[0].children.push(age);
    }

    const result = await withRetry(
      async () => {
        const response = await fetchWithTimeout(
          `${RATEHAWK_API}/search/serp/region/`,
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
              currency: currency.toUpperCase(),
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

    // Check for API-level errors
    if (result.status === "error") {
      throw new ApiRequestError(
        `RateHawk API error: ${result.error} - ${result.debug?.validation_error || ""}`,
        { context: { regionId, error: result.error, validation: result.debug?.validation_error } }
      );
    }

    const searchResult = {
      hotels: (result.data?.hotels || []) as RawHotelResult[],
      totalHotels: result.data?.total_hotels || result.data?.hotels?.length || 0,
    };

    hotelSearchCache.set(cacheKey, searchResult);
    logInfo("Hotel search completed and cached", {
      ...logContext,
      hotelCount: searchResult.hotels.length,
      totalHotels: searchResult.totalHotels,
    });

    return searchResult;
  } catch (error) {
    logError("Hotel search failed", error, logContext);
    throw error;
  }
}

// Fetch hotel info (name, images, amenities, etc.) with caching
async function fetchHotelInfo(hotelId: string): Promise<HotelInfo | null> {
  const cacheKey = `hotel-info:${hotelId}`;
  const cached = hotelInfoCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(
      `${RATEHAWK_API}/hotel/info/`,
      {
        method: "POST",
        headers: {
          "Authorization": getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hotelId,
          language: "en",
        }),
      }
    );

    if (!response.ok) return null;

    const result = await response.json();
    if (!result.data) return null;

    const h = result.data;

    // Extract amenities from amenity_groups
    const allAmenities: string[] = [];
    if (h.amenity_groups && Array.isArray(h.amenity_groups)) {
      for (const group of h.amenity_groups) {
        if (group.amenities && Array.isArray(group.amenities)) {
          allAmenities.push(...group.amenities);
        }
      }
    }

    // Build image URLs (replace {size} placeholder)
    const images: string[] = [];
    if (h.images && Array.isArray(h.images)) {
      for (const img of h.images.slice(0, 15)) {
        if (typeof img === "string") {
          images.push(img.replace("{size}", "640x400"));
        }
      }
    }
    // Also check images_ext format
    if (images.length === 0 && h.images_ext && Array.isArray(h.images_ext)) {
      for (const img of h.images_ext.slice(0, 15)) {
        if (img.url) {
          images.push(img.url.replace("{size}", "640x400"));
        }
      }
    }
    // Check main_photo_url as final fallback
    if (images.length === 0 && h.main_photo_url) {
      const mainPhoto = typeof h.main_photo_url === "string"
        ? h.main_photo_url.replace("{size}", "640x400")
        : null;
      if (mainPhoto) images.push(mainPhoto);
    }

    // Build description from structured data
    let description = "";
    if (h.description_struct && Array.isArray(h.description_struct)) {
      description = h.description_struct
        .map((section: any) => {
          if (section.paragraphs && Array.isArray(section.paragraphs)) {
            return section.paragraphs.join(" ");
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");
    }

    // Map amenities to user-friendly names (pick key ones)
    const keyAmenities = filterKeyAmenities(allAmenities);

    // Extract city from region data or address
    let city = "";
    if (h.region && h.region.name) {
      city = h.region.name;
    } else if (h.city) {
      city = h.city;
    }

    const info: HotelInfo = {
      name: h.name || "Hotel",
      address: h.address || "",
      city,
      starRating: h.star_rating || 0,
      latitude: h.latitude || 0,
      longitude: h.longitude || 0,
      images,
      amenities: keyAmenities,
      description,
      checkInTime: h.check_in_time || "",
      checkOutTime: h.check_out_time || "",
      hotelChain: h.hotel_chain || "",
    };

    hotelInfoCache.set(cacheKey, info);
    return info;
  } catch (error) {
    logWarn(`Failed to fetch info for hotel ${hotelId}`, { service: "RateHawk" });
    return null;
  }
}

// Filter amenities to key user-facing ones, returning normalized category names
function filterKeyAmenities(amenities: string[]): string[] {
  const AMENITY_CATEGORIES: Record<string, string[]> = {
    "Free WiFi": ["wifi", "wi-fi", "internet", "wireless"],
    "Swimming pool": ["pool", "swimming"],
    "Parking": ["parking"],
    "Restaurant": ["restaurant"],
    "Bar": ["bar", "lounge bar"],
    "Gym": ["gym", "fitness"],
    "Spa": ["spa", "sauna", "wellness"],
    "Air conditioning": ["air conditioning", "air-conditioning", "a/c", "ac unit", "climate control"],
    "Room service": ["room service"],
    "Breakfast": ["breakfast", "buffet breakfast"],
    "Airport shuttle": ["airport shuttle", "airport transfer"],
    "Pet friendly": ["pet", "pets"],
    "Laundry": ["laundry"],
    "Business center": ["business center", "business centre"],
    "24-hour reception": ["24-hour", "24 hour", "front desk"],
    "Elevator": ["elevator", "lift"],
    "Beach": ["beach", "beachfront", "beach access"],
    "Wheelchair accessible": ["wheelchair"],
    "Family rooms": ["family"],
    "Balcony": ["balcony", "terrace"],
    "Private bathroom": ["private bathroom", "en-suite", "ensuite"],
    "Kitchen": ["kitchen", "kitchenette"],
    "Garden": ["garden"],
  };

  const matched: string[] = [];
  const seen = new Set<string>();

  for (const amenity of amenities) {
    const lower = amenity.toLowerCase();
    for (const [normalized, terms] of Object.entries(AMENITY_CATEGORIES)) {
      if (!seen.has(normalized) && terms.some(term => lower.includes(term))) {
        seen.add(normalized);
        matched.push(normalized);
        break;
      }
    }
    if (matched.length >= 15) break;
  }

  return matched;
}

// Fetch hotel details in controlled batches to respect rate limits
async function fetchHotelDetailsBatch(hotelIds: string[]): Promise<Map<string, HotelInfo>> {
  const results = new Map<string, HotelInfo>();
  const uncachedIds: string[] = [];

  // First pass: collect cached results
  for (const id of hotelIds) {
    const cached = hotelInfoCache.get(`hotel-info:${id}`);
    if (cached) {
      results.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  }

  if (uncachedIds.length === 0) {
    logInfo(`All ${hotelIds.length} hotel infos served from cache`, { service: "RateHawk" });
    return results;
  }

  logInfo(`Fetching ${uncachedIds.length} hotel infos (${results.size} from cache)`, { service: "RateHawk" });

  // Fetch all uncached hotels concurrently (PAGE_SIZE <= 30 fits within rate limit)
  const batchResults = await Promise.allSettled(
    uncachedIds.map(id => fetchHotelInfo(id))
  );

  for (let j = 0; j < uncachedIds.length; j++) {
    const result = batchResults[j];
    if (result.status === "fulfilled" && result.value) {
      results.set(uncachedIds[j], result.value);
    }
  }

  logInfo(`Fetched ${results.size - (hotelIds.length - uncachedIds.length)} of ${uncachedIds.length} uncached hotel infos`, { service: "RateHawk" });

  return results;
}

// Calculate number of nights
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const childAges = searchParams.get("childAges")
    ? searchParams.get("childAges")!.split(",").map(a => parseInt(a)).filter(a => !isNaN(a))
    : Array.from({ length: children }, () => 7); // Default age 7 if not specified
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

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
    // Step 1: Search for all related regions (e.g. Miami + Miami Beach)
    let regions: { id: string; name: string; country: string }[];
    try {
      regions = await searchRegions(destination);
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

    if (regions.length === 0) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        currency,
        message: `No hotels found for destination: ${destination}. Please try a different search term.`,
      });
    }

    const region = regions[0]; // Primary region for display name

    // Step 2: Search hotels across all related regions and combine
    let rawHotels: RawHotelResult[] = [];
    let totalHotels = 0;
    try {
      // Search all regions concurrently
      const searchPromises = regions.map(r =>
        searchHotelsInRegion(r.id, checkIn, checkOut, adults, childAges, rooms, currency)
          .catch(err => {
            logWarn(`Hotel search failed for region ${r.id} (${r.name}), skipping`, { service: "RateHawk" });
            return { hotels: [] as RawHotelResult[], totalHotels: 0 };
          })
      );
      const results = await Promise.all(searchPromises);

      // Combine and deduplicate by hotel ID
      const seen = new Set<string>();
      for (const result of results) {
        totalHotels += result.totalHotels;
        for (const hotel of result.hotels) {
          if (!seen.has(hotel.id)) {
            seen.add(hotel.id);
            rawHotels.push(hotel);
          }
        }
      }

      logInfo(`Combined ${rawHotels.length} hotels from ${regions.length} region(s)`, {
        ...logContext,
        regions: regions.map(r => r.name),
      });
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

    if (rawHotels.length === 0) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        currency,
        destination: { id: region.id, name: region.name, country: region.country },
        message: `No hotels available for the selected dates in ${region.name}.`,
      });
    }

    const nights = calculateNights(checkIn, checkOut);

    // Step 3: Build or retrieve the full sorted list of hotels with rates
    const combinedCacheKey = generateCacheKey("combined-hotels", {
      destination,
      checkIn,
      checkOut,
      adults,
      childAges: childAges.join(","),
      rooms,
      currency,
    });

    let allHotelsWithRates: RawHotelResult[];
    const cachedCombined = combinedResultsCache.get(combinedCacheKey);
    if (cachedCombined) {
      allHotelsWithRates = cachedCombined;
      logInfo("Combined results cache hit", { ...logContext, totalHotels: allHotelsWithRates.length });
    } else {
      allHotelsWithRates = rawHotels
        .filter(h => h.rates && h.rates.length > 0)
        .sort((a, b) => getLowestPrice(a.rates) - getLowestPrice(b.rates));
      combinedResultsCache.set(combinedCacheKey, allHotelsWithRates);
      logInfo("Combined results cached", { ...logContext, totalHotels: allHotelsWithRates.length });
    }

    // Step 4: Paginate — pick the slice for this page
    const totalAvailable = allHotelsWithRates.length;
    const totalPages = Math.ceil(totalAvailable / PAGE_SIZE);
    const startIndex = (page - 1) * PAGE_SIZE;
    const pageHotels = allHotelsWithRates.slice(startIndex, startIndex + PAGE_SIZE);

    if (pageHotels.length === 0) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        totalAvailable,
        page,
        pageSize: PAGE_SIZE,
        totalPages,
        hasMore: false,
        currency,
        destination: { id: region.id, name: region.name, country: region.country },
      });
    }

    // Step 5: Fetch hotel details (name, images, amenities) for this page
    const hotelIds = pageHotels.map(h => h.id);
    const hotelInfoMap = await fetchHotelDetailsBatch(hotelIds);

    // Step 6: Combine rate data with hotel info
    const hotels = pageHotels.map((rawHotel) => {
      const info = hotelInfoMap.get(rawHotel.id);
      const cheapestRate = rawHotel.rates[0];

      // Calculate total price from payment options
      let totalPrice = 0;
      let showPrice = 0;
      if (cheapestRate?.payment_options?.payment_types?.[0]) {
        const pt = cheapestRate.payment_options.payment_types[0];
        totalPrice = parseFloat(pt.show_amount || pt.amount || "0");
        showPrice = parseFloat(pt.show_amount || "0");
      } else if (cheapestRate?.daily_prices) {
        totalPrice = cheapestRate.daily_prices.reduce(
          (sum: number, p: string) => sum + parseFloat(p), 0
        );
        showPrice = totalPrice;
      }

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
      const penalties = cheapestRate?.payment_options?.payment_types?.[0]?.cancellation_penalties;
      if (penalties?.free_cancellation_before) {
        freeCancellation = true;
        const cancelDate = new Date(penalties.free_cancellation_before);
        cancellationPolicy = `Free cancellation until ${cancelDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`;
      } else if (penalties?.policies) {
        // Check if any policy has zero charge (meaning free cancellation period exists)
        const freePolicy = penalties.policies.find(
          (p: any) => p.amount_charge === "0.00" && p.end_at
        );
        if (freePolicy) {
          freeCancellation = true;
          const cancelDate = new Date(freePolicy.end_at);
          cancellationPolicy = `Free cancellation until ${cancelDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`;
        }
      }

      return {
        id: rawHotel.id,
        hid: rawHotel.hid,
        name: info?.name || rawHotel.id.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        starRating: info?.starRating || 0,
        address: info?.address || "",
        city: info?.city || region.name,
        country: region.country,
        latitude: info?.latitude || 0,
        longitude: info?.longitude || 0,
        images: info?.images || [],
        mainImage: info?.images?.[0] || null,
        amenities: info?.amenities || [],
        description: info?.description || "",
        hotelChain: info?.hotelChain || "",
        checkInTime: info?.checkInTime || "",
        checkOutTime: info?.checkOutTime || "",
        price: totalPrice,
        pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
        currency,
        nights,
        roomType: cheapestRate?.room_name || "Standard Room",
        mealPlan,
        cancellationPolicy,
        freeCancellation,
        totalRates: rawHotel.rates.length,
        guests: {
          adults,
          children,
          rooms,
        },
      };
    });

    // Filter out hotels with no price, keep hotels even without images (will use placeholder)
    const validHotels = hotels.filter(h => h.price > 0);

    logInfo("Hotel search completed successfully", {
      ...logContext,
      totalResults: validHotels.length,
      totalAvailable,
      page,
      regionId: region.id,
    });

    return NextResponse.json({
      status: true,
      data: validHotels,
      totalResults: validHotels.length,
      totalAvailable,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
      hasMore: page < totalPages,
      currency,
      destination: {
        id: region.id,
        name: region.name,
        country: region.country,
      },
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

// Helper to extract lowest price from rates array
function getLowestPrice(rates: any[]): number {
  let lowest = Infinity;
  for (const rate of rates) {
    const pt = rate?.payment_options?.payment_types?.[0];
    if (pt) {
      const price = parseFloat(pt.show_amount || pt.amount || "Infinity");
      if (price < lowest) lowest = price;
    } else if (rate?.daily_prices) {
      const price = rate.daily_prices.reduce((s: number, p: string) => s + parseFloat(p), 0);
      if (price < lowest) lowest = price;
    }
  }
  return lowest === Infinity ? 0 : lowest;
}
