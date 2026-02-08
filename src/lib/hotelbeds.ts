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
function categoryToStars(categoryCode: string): number {
  // HotelBeds uses codes like "1EST" (1 star), "2EST" (2 star), etc.
  // Also "4LUX" for 4-star luxury, "5LUX" for 5-star luxury
  const match = categoryCode.match(/^(\d)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Common category mappings
  const categoryMap: Record<string, number> = {
    "1EST": 1,
    "2EST": 2,
    "3EST": 3,
    "4EST": 4,
    "5EST": 5,
    "1LL": 1,
    "2LL": 2,
    "3LL": 3,
    "4LL": 4,
    "5LL": 5,
    "4LUX": 4,
    "5LUX": 5,
    "AG": 3, // Apartment
    "APTH": 3, // Apart-hotel
    "AT1": 1,
    "AT2": 2,
    "AT3": 3,
    "BB": 3, // B&B
    "H1S": 1,
    "H2S": 2,
    "H3S": 3,
    "H4S": 4,
    "H5S": 5,
    "HR1": 1,
    "HR2": 2,
    "HR3": 3,
    "HR4": 4,
    "HR5": 5,
    "HS": 0, // Hostel
    "PENS": 2, // Pension
    "RSRT": 4, // Resort
    "SPC": 4, // Spa
    "SUP": 4, // Superior
    "VTV": 3, // Vacation rental
  };

  return categoryMap[categoryCode] || 0;
}

/**
 * Map board code to meal plan name
 */
function boardCodeToMealPlan(boardCode: string): string {
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

/**
 * Generate HotelBeds image URL
 * HotelBeds images follow the pattern: https://photos.hotelbeds.com/giata/{size}/{hotelCode}.jpg
 */
function generateImageUrl(hotelCode: number, index: number = 0): string {
  // HotelBeds uses GIATA codes for images, but we can try the hotel code
  // Common sizes: small, medium, large, xl, xxl, original
  const sizes = ["xl", "large", "medium"];
  const size = sizes[index % sizes.length];
  return `https://photos.hotelbeds.com/giata/${size}/${hotelCode}.jpg`;
}

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
  guests: { adults: number; children: number; rooms: number };
  rateKey?: string;
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

  // Check if free cancellation is available
  const hasCancellation = cheapestRate?.cancellationPolicies &&
    cheapestRate.cancellationPolicies.length > 0;

  // Generate image URLs
  const images = [
    generateImageUrl(hotel.code, 0),
    generateImageUrl(hotel.code, 1),
    generateImageUrl(hotel.code, 2),
  ];

  return {
    id: `hb_${hotel.code}`,
    source: "hotelbeds",
    name: hotel.name,
    starRating: categoryToStars(hotel.categoryCode),
    address: "",
    city: hotel.destinationName || hotel.zoneName || "",
    country: "",
    latitude: parseFloat(hotel.latitude) || 0,
    longitude: parseFloat(hotel.longitude) || 0,
    images,
    mainImage: images[0],
    amenities: [],
    price: Math.round(price * 100) / 100,
    pricePerNight,
    currency: hotel.currency || currency,
    nights,
    roomType: cheapestRoomName,
    mealPlan: boardCodeToMealPlan(cheapestRate?.boardCode || ""),
    freeCancellation: hasCancellation || false,
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
 * Search hotels by coordinates (when coordinates are already known)
 */
export async function searchHotels(
  latitude: number,
  longitude: number,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number = 0,
  rooms: number = 1,
  currency: string = "GBP"
): Promise<HotelBedsHotel[]> {
  const result = await searchHotelsByGeolocation(
    latitude,
    longitude,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    30, // 30km radius
    currency
  );

  return result.hotels;
}
