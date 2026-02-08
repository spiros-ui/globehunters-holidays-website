/**
 * Travelpayouts (Hotellook) Hotels API Integration
 * Documentation: https://travelpayouts.github.io/slate/
 */

const HOTELLOOK_API = "https://engine.hotellook.com/api/v2";
const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN;
const TRAVELPAYOUTS_MARKER = process.env.TRAVELPAYOUTS_MARKER;

export interface TravelpayoutsHotel {
  hotelId: number;
  hotelName: string;
  stars: number;
  priceFrom: number;
  priceAvg: number;
  pricePercentile: Record<string, number>;
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  locationId: number;
  locationName: string;
  photoCount: number;
  photosByRoomType: Record<string, number>;
  rooms: Record<string, {
    agencyId: string;
    agencyName: string;
    bookingURL: string;
    fullBookingURL: string;
    options: Record<string, any>;
    price: number;
    tax: number;
    total: number;
  }>;
}

export interface TravelpayoutsLocation {
  id: string;
  type: string;
  countryCode: string;
  countryName: string;
  cityName: string;
  fullName: string;
  iata?: string[];
  location?: {
    lat: number;
    lon: number;
  };
  hotelsCount: number;
}

/**
 * Search for locations (cities, regions) by query
 */
export async function searchLocations(query: string, lang = "en"): Promise<TravelpayoutsLocation[]> {
  if (!TRAVELPAYOUTS_TOKEN) {
    console.error("Travelpayouts API token not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      query,
      lang,
      lookFor: "both", // Search both cities and hotels
      limit: "10",
      token: TRAVELPAYOUTS_TOKEN,
    });

    const response = await fetch(`${HOTELLOOK_API}/lookup.json?${params}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Travelpayouts location search failed:", response.status);
      return [];
    }

    const data = await response.json();

    // Results include cities and hotels
    const results: TravelpayoutsLocation[] = [];

    if (data.results?.locations) {
      for (const loc of data.results.locations) {
        results.push({
          id: String(loc.id),
          type: loc.type || "city",
          countryCode: loc.countryCode || "",
          countryName: loc.countryName || "",
          cityName: loc.cityName || loc.name || "",
          fullName: loc.fullName || loc.name || "",
          iata: loc.iata || [],
          location: loc.location,
          hotelsCount: loc.hotelsCount || 0,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Travelpayouts location search error:", error);
    return [];
  }
}

/**
 * Search for hotels with prices using the cache API
 * Note: Uses city name (location) parameter, not locationId
 */
export async function searchHotels(
  location: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  currency: string = "GBP",
  limit: number = 30
): Promise<TravelpayoutsHotel[]> {
  if (!TRAVELPAYOUTS_TOKEN) {
    console.error("Travelpayouts API token not configured");
    return [];
  }

  try {
    const params = new URLSearchParams({
      location, // City name or IATA code, not locationId
      checkIn,
      checkOut,
      adults: String(adults),
      currency: currency.toLowerCase(),
      limit: String(limit),
      token: TRAVELPAYOUTS_TOKEN,
    });

    const response = await fetch(`${HOTELLOOK_API}/cache.json?${params}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Travelpayouts hotel search failed:", response.status);
      return [];
    }

    const data = await response.json();

    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((hotel: any) => ({
      hotelId: hotel.hotelId,
      hotelName: hotel.hotelName,
      stars: hotel.stars || 0,
      priceFrom: hotel.priceFrom || 0,
      priceAvg: hotel.priceAvg || 0,
      pricePercentile: hotel.pricePercentile || {},
      location: hotel.location || { lat: 0, lon: 0, name: "" },
      locationId: hotel.locationId,
      locationName: hotel.locationName || "",
      photoCount: hotel.photoCount || 0,
      photosByRoomType: hotel.photosByRoomType || {},
      rooms: hotel.rooms || {},
    }));
  } catch (error) {
    console.error("Travelpayouts hotel search error:", error);
    return [];
  }
}

/**
 * Get hotel details by ID
 */
export async function getHotelInfo(hotelId: number, lang = "en"): Promise<{
  id: number;
  name: string;
  stars: number;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  description: string;
} | null> {
  if (!TRAVELPAYOUTS_TOKEN) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      id: String(hotelId),
      lang,
      token: TRAVELPAYOUTS_TOKEN,
    });

    const response = await fetch(`${HOTELLOOK_API}/static/hotels.json?${params}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const hotel = data[hotelId] || data;

    if (!hotel) return null;

    // Build image URLs
    const images: string[] = [];
    if (hotel.photoCount && hotel.photoCount > 0) {
      for (let i = 0; i < Math.min(hotel.photoCount, 10); i++) {
        // Hotellook image URL pattern
        images.push(`https://photo.hotellook.com/image_v2/limit/${hotelId}/${i}/640/480.jpg`);
      }
    }

    return {
      id: hotel.id || hotelId,
      name: hotel.name || "",
      stars: hotel.stars || 0,
      address: hotel.address || "",
      city: hotel.city || "",
      country: hotel.country || "",
      latitude: hotel.location?.lat || 0,
      longitude: hotel.location?.lon || 0,
      images,
      amenities: hotel.amenities || [],
      description: hotel.description || "",
    };
  } catch (error) {
    console.error("Travelpayouts hotel info error:", error);
    return null;
  }
}

/**
 * Search hotels by city name
 * The cache.json API accepts city names directly, no location ID lookup needed
 */
export async function searchHotelsByCity(
  cityName: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  currency: string = "GBP",
  limit: number = 30
): Promise<{
  locationId: string;
  locationName: string;
  hotels: TravelpayoutsHotel[];
}> {
  // Search for hotels directly using city name
  const hotels = await searchHotels(
    cityName,
    checkIn,
    checkOut,
    adults,
    currency,
    limit
  );

  return {
    locationId: "",
    locationName: cityName,
    hotels,
  };
}

/**
 * Convert Travelpayouts hotel to standard format for merging with RateHawk
 */
export function convertToStandardFormat(
  hotel: TravelpayoutsHotel,
  checkIn: string,
  checkOut: string,
  nights: number,
  currency: string,
  adults: number,
  children: number,
  rooms: number
): {
  id: string;
  source: "travelpayouts";
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
} {
  // Generate image URLs
  const images: string[] = [];
  if (hotel.photoCount && hotel.photoCount > 0) {
    for (let i = 0; i < Math.min(hotel.photoCount, 10); i++) {
      images.push(`https://photo.hotellook.com/image_v2/limit/${hotel.hotelId}/${i}/640/480.jpg`);
    }
  }

  const totalPrice = hotel.priceFrom || hotel.priceAvg || 0;

  return {
    id: `tp_${hotel.hotelId}`,
    source: "travelpayouts",
    name: hotel.hotelName,
    starRating: hotel.stars || 0,
    address: "",
    city: hotel.locationName || hotel.location?.name || "",
    country: "",
    latitude: hotel.location?.lat || 0,
    longitude: hotel.location?.lon || 0,
    images,
    mainImage: images[0] || null,
    amenities: [],
    price: totalPrice,
    pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
    currency,
    nights,
    roomType: "Standard Room",
    mealPlan: "Room Only",
    freeCancellation: false,
    guests: { adults, children, rooms },
  };
}
