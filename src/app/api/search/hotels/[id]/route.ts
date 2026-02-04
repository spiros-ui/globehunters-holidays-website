import { NextRequest, NextResponse } from "next/server";
import {
  MemoryCache,
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

const HOTEL_INFO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const API_TIMEOUT_MS = 15000;

// ============================================================================
// Types
// ============================================================================

interface AmenityGroup {
  group_name: string;
  amenities: string[];
}

interface DescriptionSection {
  title: string;
  paragraphs: string[];
}

interface HotelDetailInfo {
  id: string;
  name: string;
  address: string;
  star_rating: number;
  latitude: number;
  longitude: number;
  images: string[];
  images_large: string[];
  amenity_groups: AmenityGroup[];
  description_struct: DescriptionSection[];
  check_in_time: string;
  check_out_time: string;
  hotel_chain: string;
  phone: string;
  email: string;
  front_desk_time_start: string;
  front_desk_time_end: string;
  postal_code: string;
  kind: string;
  region_name: string;
}

interface RateInfo {
  roomName: string;
  mealPlan: string;
  totalPrice: number;
  pricePerNight: number;
  freeCancellation: boolean;
  cancellationDeadline: string | null;
  paymentType: string;
}

// Module-level cache singleton
const hotelDetailCache = new MemoryCache<HotelDetailInfo>(HOTEL_INFO_CACHE_TTL);
const RATES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes for rates
const ratesCache = new MemoryCache<RateInfo[]>(RATES_CACHE_TTL);

// ============================================================================
// Auth
// ============================================================================

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

// ============================================================================
// Fetch with timeout
// ============================================================================

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

// ============================================================================
// Fetch rates for a specific hotel
// ============================================================================

const MEAL_MAP: Record<string, string> = {
  nomeal: "Room Only",
  breakfast: "Breakfast Included",
  halfboard: "Half Board",
  fullboard: "Full Board",
  allinclusive: "All Inclusive",
};

async function fetchHotelRates(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  childAges: number[],
  rooms: number,
  currency: string
): Promise<RateInfo[]> {
  const cacheKey = `rates:${hotelId}:${checkIn}:${checkOut}:${adults}:${children}:${rooms}:${currency}`;
  const cached = ratesCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Build guests array
    const guests: Array<{ adults: number; children: number[] }> = [];
    let remainingAdults = adults;
    for (let i = 0; i < rooms; i++) {
      const adultsThisRoom = Math.ceil(remainingAdults / (rooms - i));
      remainingAdults -= adultsThisRoom;
      guests.push({ adults: adultsThisRoom, children: [] });
    }
    for (const age of childAges) {
      guests[0].children.push(age);
    }

    const response = await fetchWithTimeout(
      `${RATEHAWK_API}/search/hp/`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hotelId,
          checkin: checkIn,
          checkout: checkOut,
          residency: "gb",
          language: "en",
          guests,
          currency: currency.toUpperCase(),
        }),
      },
      20000 // slightly longer timeout for rate search
    );

    if (!response.ok) {
      logWarn(`Rate search failed for hotel ${hotelId}: ${response.status}`, { service: "RateHawk" });
      return [];
    }

    const result = await response.json();
    if (result.status === "error" || !result.data) return [];

    const rawRates = result.data.hotels?.[0]?.rates || [];
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Parse each rate into a clean format
    const rates: RateInfo[] = [];
    const seenCombinations = new Set<string>();

    for (const rate of rawRates) {
      const roomName = rate.room_name || "Standard Room";
      const meal = rate.meal || "nomeal";
      const mealPlan = MEAL_MAP[meal] || meal;

      // Deduplicate by room name + meal plan (show cheapest of each combination)
      const comboKey = `${roomName}|${mealPlan}`;
      if (seenCombinations.has(comboKey)) continue;
      seenCombinations.add(comboKey);

      let totalPrice = 0;
      const pt = rate.payment_options?.payment_types?.[0];
      if (pt) {
        totalPrice = parseFloat(pt.show_amount || pt.amount || "0");
      } else if (rate.daily_prices) {
        totalPrice = rate.daily_prices.reduce((sum: number, p: string) => sum + parseFloat(p), 0);
      }

      if (totalPrice <= 0) continue;

      let freeCancellation = false;
      let cancellationDeadline: string | null = null;
      const penalties = pt?.cancellation_penalties;
      if (penalties?.free_cancellation_before) {
        freeCancellation = true;
        cancellationDeadline = penalties.free_cancellation_before;
      } else if (penalties?.policies) {
        const freePolicy = penalties.policies.find(
          (p: any) => p.amount_charge === "0.00" && p.end_at
        );
        if (freePolicy) {
          freeCancellation = true;
          cancellationDeadline = freePolicy.end_at;
        }
      }

      rates.push({
        roomName,
        mealPlan,
        totalPrice,
        pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
        freeCancellation,
        cancellationDeadline,
        paymentType: pt?.type || "now",
      });
    }

    // Sort by price
    rates.sort((a, b) => a.totalPrice - b.totalPrice);

    ratesCache.set(cacheKey, rates);
    return rates;
  } catch (error) {
    logWarn(`Failed to fetch rates for hotel ${hotelId}`, { service: "RateHawk" });
    return [];
  }
}

// ============================================================================
// GET handler
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params;
  const searchParams = request.nextUrl.searchParams;

  // Optional search params for fetching rates
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const childAges = searchParams.get("childAges")
    ? searchParams.get("childAges")!.split(",").map(a => parseInt(a)).filter(a => !isNaN(a))
    : [];
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = searchParams.get("currency") || "GBP";

  const logContext = {
    service: "HotelDetailAPI",
    operation: "GET",
    hotelId,
  };

  if (!hotelId) {
    return NextResponse.json(
      { error: "Missing hotel ID", code: "INVALID_REQUEST" },
      { status: 400 }
    );
  }

  if (!RATEHAWK_KEY) {
    logError("RateHawk API key not configured", new Error("Missing API key"), logContext);
    return NextResponse.json(
      { error: "Hotel detail service is currently unavailable", code: "SERVICE_UNAVAILABLE" },
      { status: 500 }
    );
  }

  // Check cache first
  const cacheKey = `hotel-detail:${hotelId}`;
  const cached = hotelDetailCache.get(cacheKey);
  if (cached) {
    logInfo("Hotel detail cache hit", logContext);
    // Also fetch rates if search params provided
    let rates: RateInfo[] = [];
    if (checkIn && checkOut) {
      rates = await fetchHotelRates(hotelId, checkIn, checkOut, adults, children, childAges, rooms, currency);
    }
    return NextResponse.json({ status: true, data: cached, rates });
  }

  logInfo("Hotel detail cache miss, fetching from API", logContext);

  try {
    const response = await fetchWithTimeout(
      `${RATEHAWK_API}/hotel/info/`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: hotelId,
          language: "en",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new ApiRequestError(
        `RateHawk hotel info failed: ${response.status}`,
        {
          status: response.status,
          context: { hotelId, responseBody: errorText.slice(0, 500) },
        }
      );
    }

    const result = await response.json();

    if (result.status === "error" || !result.data) {
      logWarn("RateHawk returned no data for hotel", logContext);
      return NextResponse.json(
        { error: "Hotel not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const h = result.data;

    // Build image URLs (replace {size} placeholder)
    const images: string[] = [];
    const imagesLarge: string[] = [];
    if (h.images && Array.isArray(h.images)) {
      for (const img of h.images) {
        if (typeof img === "string") {
          images.push(img.replace("{size}", "640x400"));
          imagesLarge.push(img.replace("{size}", "1024x768"));
        }
      }
    }
    // Fallback to images_ext format
    if (images.length === 0 && h.images_ext && Array.isArray(h.images_ext)) {
      for (const img of h.images_ext) {
        if (img.url) {
          images.push(img.url.replace("{size}", "640x400"));
          imagesLarge.push(img.url.replace("{size}", "1024x768"));
        }
      }
    }

    // Parse amenity_groups
    const amenityGroups: AmenityGroup[] = [];
    if (h.amenity_groups && Array.isArray(h.amenity_groups)) {
      for (const group of h.amenity_groups) {
        amenityGroups.push({
          group_name: group.group_name || "Other",
          amenities: Array.isArray(group.amenities) ? group.amenities : [],
        });
      }
    }

    // Parse description_struct
    const descriptionStruct: DescriptionSection[] = [];
    if (h.description_struct && Array.isArray(h.description_struct)) {
      for (const section of h.description_struct) {
        descriptionStruct.push({
          title: section.title || "",
          paragraphs: Array.isArray(section.paragraphs) ? section.paragraphs : [],
        });
      }
    }

    const hotelDetail: HotelDetailInfo = {
      id: hotelId,
      name: h.name || "Hotel",
      address: h.address || "",
      star_rating: h.star_rating || 0,
      latitude: h.latitude || 0,
      longitude: h.longitude || 0,
      images,
      images_large: imagesLarge,
      amenity_groups: amenityGroups,
      description_struct: descriptionStruct,
      check_in_time: h.check_in_time || "",
      check_out_time: h.check_out_time || "",
      hotel_chain: h.hotel_chain || "",
      phone: h.phone || "",
      email: h.email || "",
      front_desk_time_start: h.front_desk_time_start || "",
      front_desk_time_end: h.front_desk_time_end || "",
      postal_code: h.postal_code || "",
      kind: h.kind || "",
      region_name: h.region?.name || "",
    };

    // Cache the result
    hotelDetailCache.set(cacheKey, hotelDetail);
    logInfo("Hotel detail fetched and cached", logContext);

    // Also fetch rates if search params provided
    let rates: RateInfo[] = [];
    if (checkIn && checkOut) {
      rates = await fetchHotelRates(hotelId, checkIn, checkOut, adults, children, childAges, rooms, currency);
    }

    return NextResponse.json({ status: true, data: hotelDetail, rates });
  } catch (error) {
    logError("Failed to fetch hotel detail", error, logContext);
    const userMessage = getUserFriendlyErrorMessage(error);
    return NextResponse.json(
      {
        error: userMessage,
        code: error instanceof TimeoutError ? "TIMEOUT" : "FETCH_FAILED",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 503 }
    );
  }
}
