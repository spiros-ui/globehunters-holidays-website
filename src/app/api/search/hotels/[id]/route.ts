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

// Module-level cache singleton
const hotelDetailCache = new MemoryCache<HotelDetailInfo>(HOTEL_INFO_CACHE_TTL);

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
// GET handler
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: hotelId } = await params;

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
    return NextResponse.json({ status: true, data: cached });
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

    return NextResponse.json({ status: true, data: hotelDetail });
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
