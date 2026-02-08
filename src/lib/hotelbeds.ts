/**
 * HotelBeds API Integration
 * Documentation: https://developer.hotelbeds.com/documentation/hotels/
 */

import { createHash } from "crypto";

// Rate limiting: 4 QPS in production
const API_TIMEOUT_MS = 20000;

// Get credentials at runtime (not module load time)
function getCredentials() {
  // Trim whitespace/newlines from credentials (common issue with env vars)
  const apiKey = (process.env.HOTELBEDS_API_KEY || "").trim();
  const secret = (process.env.HOTELBEDS_SECRET || "").trim();
  const apiUrl = (process.env.HOTELBEDS_API_URL || "https://api.hotelbeds.com/hotel-api/1.0").trim();

  return { apiKey, secret, apiUrl };
}

export interface HotelBedsHotel {
  code: number;
  name: string;
  categoryCode: string;
  categoryName: string;
  destinationCode: string;
  destinationName: string;
  zoneCode: number;
  zoneName: string;
  latitude: string;
  longitude: string;
  minRate: string;
  maxRate: string;
  currency: string;
  rooms: HotelBedsRoom[];
}

export interface HotelBedsRoom {
  code: string;
  name: string;
  rates: HotelBedsRate[];
}

export interface HotelBedsRate {
  rateKey: string;
  rateClass: string;
  rateType: string;
  net: string;
  allotment: number;
  paymentType: string;
  packaging: boolean;
  boardCode: string;
  boardName: string;
  cancellationPolicies?: {
    amount: string;
    from: string;
  }[];
  rooms: number;
  adults: number;
  children: number;
}

/**
 * Generate X-Signature for HotelBeds API authentication
 * SHA256(apiKey + secret + timestamp)
 */
function generateSignature(apiKey: string, secret: string): { signature: string; debug: any } {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = apiKey + secret + timestamp;

  const signature = createHash("sha256")
    .update(signatureString)
    .digest("hex");

  // Debug info for troubleshooting
  const debug = {
    timestamp,
    apiKeyLength: apiKey.length,
    secretLength: secret.length,
  };

  return { signature, debug };
}

/**
 * Get authentication headers for HotelBeds API
 */
function getAuthHeaders(): { headers: Record<string, string>; signatureDebug: any } | null {
  const { apiKey, secret } = getCredentials();

  if (!apiKey || !secret) {
    console.log("HotelBeds API credentials not configured");
    return null;
  }

  const { signature, debug: signatureDebug } = generateSignature(apiKey, secret);

  return {
    headers: {
      "Api-key": apiKey,
      "X-Signature": signature,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Accept-Encoding": "gzip",
    },
    signatureDebug,
  };
}

// ============================================================================
// HotelBeds Content API - Static hotel data (images, facilities, descriptions)
// ============================================================================

const CONTENT_API_URL = "https://api.hotelbeds.com/hotel-content-api/1.0";

// Simple in-memory cache for content data (24h TTL)
const contentCache = new Map<number, { data: HotelBedsContent; expiry: number }>();
const CONTENT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface HotelBedsContent {
  name?: string;
  images: string[];
  description: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  email?: string;
  phones?: { phoneNumber: string; phoneType: string }[];
  facilities: string[];
  reviewScore?: number;
  reviewCount?: number;
}

/**
 * Fetch hotel content (images, description, facilities) from HotelBeds Content API
 */
export async function getHotelContent(hotelCodes: number[]): Promise<Map<number, HotelBedsContent>> {
  const results = new Map<number, HotelBedsContent>();
  const uncachedCodes: number[] = [];

  // Check cache first
  const now = Date.now();
  for (const code of hotelCodes) {
    const cached = contentCache.get(code);
    if (cached && cached.expiry > now) {
      results.set(code, cached.data);
    } else {
      uncachedCodes.push(code);
    }
  }

  if (uncachedCodes.length === 0) return results;

  const authResult = getAuthHeaders();
  if (!authResult) return results;

  const { headers } = authResult;

  try {
    // Content API accepts up to 100 hotel codes per request
    // Run all batches in PARALLEL for speed
    const batchSize = 100;
    const batches: number[][] = [];
    for (let i = 0; i < uncachedCodes.length; i += batchSize) {
      batches.push(uncachedCodes.slice(i, i + batchSize));
    }

    // Fetch all batches in parallel
    const batchPromises = batches.map(async (batch) => {
      const codesParam = batch.join(",");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const response = await fetch(
          `${CONTENT_API_URL}/hotels/${codesParam}/details?language=ENG&useSecondaryLanguage=false`,
          {
            method: "GET",
            headers: {
              "Api-key": headers["Api-key"],
              "X-Signature": headers["X-Signature"],
              "Accept": "application/json",
              "Accept-Encoding": "gzip",
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`HotelBeds Content API error: ${response.status}`);
          return [];
        }

        const data = await response.json();
        return data.hotels || (data.hotel ? [data.hotel] : []);
      } catch (e) {
        clearTimeout(timeoutId);
        return [];
      }
    });

    const batchResults = await Promise.all(batchPromises);

    // Process all results
    for (const hotels of batchResults) {

      for (const hotel of hotels) {
        // Build images as full URL strings
        const images: string[] = [];
        if (hotel.images && Array.isArray(hotel.images)) {
          for (const img of hotel.images.slice(0, 15)) {
            if (img.path) {
              images.push(`https://photos.hotelbeds.com/giata/${img.path}`);
            }
          }
        }

        // Extract facilities as simple strings
        const facilities: string[] = [];
        if (hotel.facilities && Array.isArray(hotel.facilities)) {
          for (const facility of hotel.facilities) {
            if (facility.description?.content) {
              facilities.push(facility.description.content);
            }
          }
        }

        // Extract description
        let description = "";
        if (hotel.description?.content) {
          description = hotel.description.content;
        }

        // Extract address info
        const address = hotel.address?.content || "";
        const city = hotel.city?.content || hotel.zone?.name || "";
        const country = hotel.country?.description?.content || "";

        // Extract review data
        const reviewScore = hotel.ranking ? parseFloat(hotel.ranking) / 10 : undefined;
        const reviewCount = hotel.reviews?.total || undefined;

        const content: HotelBedsContent = {
          name: hotel.name?.content || "",
          images,
          description,
          address,
          city,
          country,
          postalCode: hotel.postalCode || "",
          email: hotel.email || "",
          phones: hotel.phones || [],
          facilities,
          reviewScore: reviewScore && reviewScore > 0 ? Math.min(reviewScore, 10) : undefined,
          reviewCount,
        };

        results.set(hotel.code, content);
        contentCache.set(hotel.code, { data: content, expiry: now + CONTENT_CACHE_TTL });
      }
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("HotelBeds Content API timeout");
    } else {
      console.error("HotelBeds Content API error:", error.message);
    }
  }

  return results;
}

/**
 * Search hotels by geolocation
 */
export async function searchHotelsByGeolocation(
  latitude: number,
  longitude: number,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number = 0,
  rooms: number = 1,
  radiusKm: number = 30,
  currency: string = "GBP"
): Promise<{
  hotels: HotelBedsHotel[];
  total: number;
  rawResponseSample?: string;
  error?: string;
  signatureDebug?: any;
}> {
  const { apiKey, secret, apiUrl } = getCredentials();

  if (!apiKey || !secret) {
    console.log("HotelBeds API credentials not configured, skipping");
    return { hotels: [], total: 0, error: "no_credentials" };
  }

  const authResult = getAuthHeaders();
  if (!authResult) {
    return { hotels: [], total: 0, error: "no_headers" };
  }

  const { headers, signatureDebug } = authResult;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    // Build occupancies array
    const occupancies = [];
    for (let i = 0; i < rooms; i++) {
      occupancies.push({
        rooms: 1,
        adults: Math.ceil(adults / rooms),
        children: Math.floor(children / rooms),
      });
    }

    const requestBody = {
      stay: {
        checkIn,
        checkOut,
      },
      occupancies,
      geolocation: {
        latitude,
        longitude,
        radius: radiusKm,
        unit: "km",
      },
      filter: {
        maxRooms: 10,
        maxRatesPerRoom: 3,
      },
    };

    console.log(`HotelBeds search: ${latitude}, ${longitude} (${radiusKm}km radius)`);

    const response = await fetch(`${apiUrl}/hotels`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    console.log(`HotelBeds response status: ${response.status}`);

    clearTimeout(timeoutId);

    const rawText = await response.text();

    if (!response.ok) {
      console.error("HotelBeds API error:", response.status);
      return { hotels: [], total: 0, rawResponseSample: rawText.slice(0, 200), error: `http_${response.status}`, signatureDebug };
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("HotelBeds: Failed to parse response JSON");
      return { hotels: [], total: 0, rawResponseSample: rawText.slice(0, 200), error: "json_parse_error", signatureDebug };
    }

    if (!data.hotels?.hotels) {
      return { hotels: [], total: 0, rawResponseSample: rawText.slice(0, 200), error: "no_hotels_in_response", signatureDebug };
    }

    const hotels: HotelBedsHotel[] = data.hotels.hotels.map((hotel: any) => ({
      code: hotel.code,
      name: hotel.name,
      categoryCode: hotel.categoryCode || "",
      categoryName: hotel.categoryName || "",
      destinationCode: hotel.destinationCode || "",
      destinationName: hotel.destinationName || "",
      zoneCode: hotel.zoneCode || 0,
      zoneName: hotel.zoneName || "",
      latitude: hotel.latitude || "0",
      longitude: hotel.longitude || "0",
      minRate: hotel.minRate || "0",
      maxRate: hotel.maxRate || "0",
      currency: hotel.currency || currency,
      rooms: (hotel.rooms || []).map((room: any) => ({
        code: room.code,
        name: room.name,
        rates: (room.rates || []).map((rate: any) => ({
          rateKey: rate.rateKey,
          rateClass: rate.rateClass || "",
          rateType: rate.rateType || "",
          net: rate.net || "0",
          allotment: rate.allotment || 0,
          paymentType: rate.paymentType || "",
          packaging: rate.packaging || false,
          boardCode: rate.boardCode || "",
          boardName: rate.boardName || "",
          cancellationPolicies: rate.cancellationPolicies || [],
          rooms: rate.rooms || 1,
          adults: rate.adults || adults,
          children: rate.children || children,
        })),
      })),
    }));

    return {
      hotels,
      total: data.hotels.total || hotels.length,
      rawResponseSample: rawText.slice(0, 200),
      signatureDebug,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("HotelBeds API timeout");
      return { hotels: [], total: 0, error: "timeout", signatureDebug };
    } else {
      console.error("HotelBeds API error:", error.message);
      return { hotels: [], total: 0, error: error.message, signatureDebug };
    }
  }
}

/**
 * Map HotelBeds category code to star rating
 */
export function getStarRating(categoryCode: string): number {
  const match = categoryCode.match(/^(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  const categoryMap: Record<string, number> = {
    "1EST": 1, "2EST": 2, "3EST": 3, "4EST": 4, "5EST": 5,
    "1LL": 1, "2LL": 2, "3LL": 3, "4LL": 4, "5LL": 5,
    "4LUX": 4, "5LUX": 5,
    "AG": 3, "APTH": 3, "AT1": 1, "AT2": 2, "AT3": 3,
    "BB": 3, "H1S": 1, "H2S": 2, "H3S": 3, "H4S": 4, "H5S": 5,
    "HR1": 1, "HR2": 2, "HR3": 3, "HR4": 4, "HR5": 5,
    "HS": 0, "PENS": 2, "RSRT": 4, "SPC": 4, "SUP": 4, "VTV": 3,
  };

  return categoryMap[categoryCode] || 0;
}

/**
 * Map board code to meal plan name
 */
export function getBoardName(boardCode: string): string {
  const mealPlanMap: Record<string, string> = {
    "RO": "Room Only",
    "BB": "Bed & Breakfast",
    "HB": "Half Board",
    "FB": "Full Board",
    "AI": "All Inclusive",
    "TI": "All Inclusive",
    "SC": "Self Catering",
  };

  return mealPlanMap[boardCode] || boardCode || "Room Only";
}

// HotelBeds Booking API doesn't include images - they require Content API
// For now, we'll use placeholder images on the frontend
// Max reasonable price per night in GBP to filter out data errors
const MAX_PRICE_PER_NIGHT = 10000;

/**
 * Convert HotelBeds hotel to standard format for merging with RateHawk
 */
export function convertToStandardFormat(
  hotel: HotelBedsHotel,
  checkIn: string,
  checkOut: string,
  nights: number,
  currency: string,
  adults: number,
  children: number,
  rooms: number
): {
  id: string;
  source: "hotelbeds";
  name: string;
  starRating: number;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  images: string[];
  mainImage: string | null;
  amenities: string[];
  price: number;
  pricePerNight: number;
  currency: string;
  nights: number;
  roomType: string;
  mealPlan: string;
  freeCancellation: boolean;
  allotment?: number;
  guests: { adults: number; children: number; rooms: number };
  rateKey?: string;
  priceValid: boolean;
} {
  // Get the cheapest rate
  let cheapestRate: HotelBedsRate | null = null;
  let cheapestRoomName = "Standard Room";

  for (const room of hotel.rooms) {
    for (const rate of room.rates) {
      const ratePrice = parseFloat(rate.net);
      if (!cheapestRate || ratePrice < parseFloat(cheapestRate.net)) {
        cheapestRate = rate;
        cheapestRoomName = room.name;
      }
    }
  }

  const price = cheapestRate ? parseFloat(cheapestRate.net) : parseFloat(hotel.minRate);
  const pricePerNight = nights > 0 ? Math.round(price / nights) : price;

  // Check if free cancellation is available (amount must be "0" or "0.00")
  const hasCancellation = cheapestRate?.cancellationPolicies &&
    cheapestRate.cancellationPolicies.length > 0 &&
    parseFloat(cheapestRate.cancellationPolicies[0].amount) === 0;

  // HotelBeds Booking API doesn't return images - use empty array for placeholder
  const images: string[] = [];

  return {
    id: `hb_${hotel.code}`,
    source: "hotelbeds",
    name: hotel.name,
    starRating: getStarRating(hotel.categoryCode),
    address: "",
    city: hotel.destinationName || hotel.zoneName || "",
    country: "",
    latitude: parseFloat(hotel.latitude) || 0,
    longitude: parseFloat(hotel.longitude) || 0,
    images,
    mainImage: null,
    amenities: [],
    price: Math.round(price * 100) / 100,
    pricePerNight,
    currency: hotel.currency || currency,
    // Flag if price seems unrealistic (likely data error)
    priceValid: pricePerNight <= MAX_PRICE_PER_NIGHT,
    nights,
    roomType: cheapestRoomName,
    mealPlan: getBoardName(cheapestRate?.boardCode || ""),
    freeCancellation: hasCancellation || false,
    allotment: cheapestRate?.allotment && cheapestRate.allotment > 0 && cheapestRate.allotment <= 5
      ? cheapestRate.allotment : undefined,
    guests: { adults, children, rooms },
    rateKey: cheapestRate?.rateKey,
  };
}

/**
 * Common tourist destination coordinates cache
 * Used to avoid geocoding errors for major cities
 */
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "athens": { lat: 37.9838, lon: 23.7275 },
  "london": { lat: 51.5074, lon: -0.1278 },
  "paris": { lat: 48.8566, lon: 2.3522 },
  "rome": { lat: 41.9028, lon: 12.4964 },
  "barcelona": { lat: 41.3851, lon: 2.1734 },
  "madrid": { lat: 40.4168, lon: -3.7038 },
  "berlin": { lat: 52.5200, lon: 13.4050 },
  "amsterdam": { lat: 52.3676, lon: 4.9041 },
  "prague": { lat: 50.0755, lon: 14.4378 },
  "vienna": { lat: 48.2082, lon: 16.3738 },
  "lisbon": { lat: 38.7223, lon: -9.1393 },
  "dublin": { lat: 53.3498, lon: -6.2603 },
  "milan": { lat: 45.4642, lon: 9.1900 },
  "venice": { lat: 45.4408, lon: 12.3155 },
  "florence": { lat: 43.7696, lon: 11.2558 },
  "santorini": { lat: 36.3932, lon: 25.4615 },
  "mykonos": { lat: 37.4467, lon: 25.3289 },
  "crete": { lat: 35.2401, lon: 24.8093 },
  "dubai": { lat: 25.2048, lon: 55.2708 },
  "bangkok": { lat: 13.7563, lon: 100.5018 },
  "tokyo": { lat: 35.6762, lon: 139.6503 },
  "singapore": { lat: 1.3521, lon: 103.8198 },
  "bali": { lat: -8.3405, lon: 115.0920 },
  "maldives": { lat: 3.2028, lon: 73.2207 },
  "new york": { lat: 40.7128, lon: -74.0060 },
  "los angeles": { lat: 34.0522, lon: -118.2437 },
  "miami": { lat: 25.7617, lon: -80.1918 },
  "cancun": { lat: 21.1619, lon: -86.8515 },
  "phuket": { lat: 7.8804, lon: 98.3923 },
  "istanbul": { lat: 41.0082, lon: 28.9784 },
  "cairo": { lat: 30.0444, lon: 31.2357 },
  "marrakech": { lat: 31.6295, lon: -7.9811 },
  "sydney": { lat: -33.8688, lon: 151.2093 },
  "melbourne": { lat: -37.8136, lon: 144.9631 },
  "hong kong": { lat: 22.3193, lon: 114.1694 },
  "seoul": { lat: 37.5665, lon: 126.9780 },
  "buenos aires": { lat: -34.6037, lon: -58.3816 },
  "rio de janeiro": { lat: -22.9068, lon: -43.1729 },
};

/**
 * Geocode a city name to coordinates
 * First checks the cache, then falls back to OpenStreetMap Nominatim
 */
async function geocodeCity(cityName: string): Promise<{ lat: number; lon: number } | null> {
  // Check cache first (case-insensitive)
  const normalized = cityName.toLowerCase().trim();
  if (CITY_COORDINATES[normalized]) {
    return CITY_COORDINATES[normalized];
  }

  // Also check if any cache key is contained in the search
  for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  try {
    // Fetch multiple results and pick the one with highest importance
    const params = new URLSearchParams({
      q: cityName,
      format: "json",
      limit: "5",
      addressdetails: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "GlobehuntersHolidays/1.0",
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Geocoding failed:", response.status);
      return null;
    }

    const data = await response.json();
    if (data.length === 0) {
      return null;
    }

    // Sort by importance (higher is better) and pick the best match
    // Prefer non-US results for ambiguous city names (Athens, Paris, etc.)
    const sorted = data.sort((a: any, b: any) => {
      // Deprioritize US results for common European city names
      const aIsUS = a.address?.country_code === "us";
      const bIsUS = b.address?.country_code === "us";
      if (aIsUS && !bIsUS) return 1;
      if (!aIsUS && bIsUS) return -1;

      // Sort by importance
      return (b.importance || 0) - (a.importance || 0);
    });

    const best = sorted[0];
    console.log(`Geocoded "${cityName}" to: ${best.display_name} (${best.lat}, ${best.lon})`);

    return {
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Search hotels by city name
 * First geocodes the city, then searches by geolocation
 */
export async function searchHotelsByCity(
  cityName: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number = 0,
  rooms: number = 1,
  currency: string = "GBP"
): Promise<{
  hotels: HotelBedsHotel[];
  total: number;
  coordinates: { lat: number; lon: number } | null;
  rawResponseSample?: string;
  error?: string;
  signatureDebug?: any;
}> {
  // Check if credentials are available
  const { apiKey, secret } = getCredentials();
  if (!apiKey || !secret) {
    return { hotels: [], total: 0, coordinates: null, error: "no_credentials" };
  }

  // Geocode the city
  const coords = await geocodeCity(cityName);

  if (!coords) {
    return { hotels: [], total: 0, coordinates: null };
  }

  // Search hotels by geolocation
  const result = await searchHotelsByGeolocation(
    coords.lat,
    coords.lon,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    30, // 30km radius
    currency
  );

  return {
    ...result,
    coordinates: coords,
  };
}

/**
 * Get hotel details and rates by hotel code
 * Uses the availability endpoint with hotel filter
 */
export async function getHotelDetails(
  hotelCode: number,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number = 0,
  rooms: number = 1,
  currency: string = "GBP"
): Promise<{
  hotel: HotelBedsHotel | null;
  error?: string;
}> {
  const { apiKey, secret, apiUrl } = getCredentials();

  if (!apiKey || !secret) {
    return { hotel: null, error: "no_credentials" };
  }

  const authResult = getAuthHeaders();
  if (!authResult) {
    return { hotel: null, error: "no_headers" };
  }

  const { headers } = authResult;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    // Build occupancies array
    const occupancies = [];
    for (let i = 0; i < rooms; i++) {
      occupancies.push({
        rooms: 1,
        adults: Math.ceil(adults / rooms),
        children: Math.floor(children / rooms),
      });
    }

    const requestBody = {
      stay: {
        checkIn,
        checkOut,
      },
      occupancies,
      hotels: {
        hotel: [hotelCode],
      },
    };

    console.log(`HotelBeds getHotelDetails: code ${hotelCode}`);

    const response = await fetch(`${apiUrl}/hotels`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();

    if (!response.ok) {
      console.error("HotelBeds API error:", response.status);
      return { hotel: null, error: `http_${response.status}` };
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      console.error("HotelBeds: Failed to parse response JSON");
      return { hotel: null, error: "json_parse_error" };
    }

    if (!data.hotels?.hotels || data.hotels.hotels.length === 0) {
      return { hotel: null, error: "hotel_not_found" };
    }

    const hotelData = data.hotels.hotels[0];
    const hotel: HotelBedsHotel = {
      code: hotelData.code,
      name: hotelData.name,
      categoryCode: hotelData.categoryCode || "",
      categoryName: hotelData.categoryName || "",
      destinationCode: hotelData.destinationCode || "",
      destinationName: hotelData.destinationName || "",
      zoneCode: hotelData.zoneCode || 0,
      zoneName: hotelData.zoneName || "",
      latitude: hotelData.latitude || "0",
      longitude: hotelData.longitude || "0",
      minRate: hotelData.minRate || "0",
      maxRate: hotelData.maxRate || "0",
      currency: hotelData.currency || currency,
      rooms: (hotelData.rooms || []).map((room: any) => ({
        code: room.code,
        name: room.name,
        rates: (room.rates || []).map((rate: any) => ({
          rateKey: rate.rateKey,
          rateClass: rate.rateClass || "",
          rateType: rate.rateType || "",
          net: rate.net || "0",
          allotment: rate.allotment || 0,
          paymentType: rate.paymentType || "",
          packaging: rate.packaging || false,
          boardCode: rate.boardCode || "",
          boardName: rate.boardName || "",
          cancellationPolicies: rate.cancellationPolicies || [],
          rooms: rate.rooms || 1,
          adults: rate.adults || adults,
          children: rate.children || children,
        })),
      })),
    };

    return { hotel };
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("HotelBeds API timeout");
      return { hotel: null, error: "timeout" };
    } else {
      console.error("HotelBeds API error:", error.message);
      return { hotel: null, error: error.message };
    }
  }
}


