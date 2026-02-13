import { NextRequest, NextResponse } from "next/server";
import {
  searchHotelsByCity,
  getHotelContent,
  getStarRating,
  getBoardName,
  type HotelBedsHotel,
} from "@/lib/hotelbeds";

// In-memory cache for tier search results (12 hour TTL)
const tierCache = new Map<string, { data: any; expiry: number }>();
const TIER_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface TierHotel {
  code: number;
  name: string;
  stars: number;
  images: string[];
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  cheapestBoardCode: string;
  cheapestBoardName: string;
  latitude: string;
  longitude: string;
}

interface TierResult {
  tier: "budget" | "standard" | "deluxe" | "luxury";
  available: boolean;
  hotel: TierHotel | null;
  hotelCount: number;
}

function categorizeTier(stars: number): "budget" | "standard" | "deluxe" | "luxury" | null {
  if (stars >= 1 && stars <= 2) return "budget";
  if (stars === 3) return "standard";
  if (stars === 4) return "deluxe";
  if (stars === 5) return "luxury";
  return null;
}

function getBestHotelForTier(hotels: HotelBedsHotel[], nights: number): TierHotel | null {
  if (hotels.length === 0) return null;

  // Pick the hotel with the lowest minRate (best value)
  let bestHotel: HotelBedsHotel | null = null;
  let bestPrice = Infinity;

  for (const hotel of hotels) {
    const price = parseFloat(hotel.minRate);
    if (price > 0 && price < bestPrice) {
      bestPrice = price;
      bestHotel = hotel;
    }
  }

  if (!bestHotel) return null;

  // Get cheapest rate details
  let cheapestBoardCode = "RO";
  let cheapestRate = Infinity;

  for (const room of bestHotel.rooms) {
    for (const rate of room.rates) {
      const ratePrice = parseFloat(rate.net);
      if (ratePrice > 0 && ratePrice < cheapestRate) {
        cheapestRate = ratePrice;
        cheapestBoardCode = rate.boardCode || "RO";
      }
    }
  }

  const totalPrice = cheapestRate < Infinity ? cheapestRate : parseFloat(bestHotel.minRate);
  const pricePerNight = nights > 0 ? Math.round((totalPrice / nights) * 100) / 100 : totalPrice;

  return {
    code: bestHotel.code,
    name: bestHotel.name,
    stars: getStarRating(bestHotel.categoryCode),
    images: [], // Will be enriched by content API
    pricePerNight,
    totalPrice: Math.round(totalPrice * 100) / 100,
    currency: bestHotel.currency || "GBP",
    cheapestBoardCode,
    cheapestBoardName: getBoardName(cheapestBoardCode),
    latitude: bestHotel.latitude,
    longitude: bestHotel.longitude,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = searchParams.get("currency") || "GBP";

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      { status: false, error: "Missing required parameters: destination, checkIn, checkOut" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = `${destination}:${checkIn}:${checkOut}:${adults}:${rooms}:${currency}`;
  const cached = tierCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return NextResponse.json({ status: true, ...cached.data, cached: true });
  }

  try {
    // Search hotels by city
    const searchResult = await searchHotelsByCity(
      destination,
      checkIn,
      checkOut,
      adults,
      0, // children
      rooms,
      currency
    );

    if (searchResult.error === "no_credentials") {
      return NextResponse.json(
        { status: false, error: "Hotel API not configured" },
        { status: 503 }
      );
    }

    if (!searchResult.hotels || searchResult.hotels.length === 0) {
      return NextResponse.json({
        status: true,
        tiers: {
          budget: { tier: "budget", available: false, hotel: null, hotelCount: 0 },
          standard: { tier: "standard", available: false, hotel: null, hotelCount: 0 },
          deluxe: { tier: "deluxe", available: false, hotel: null, hotelCount: 0 },
          luxury: { tier: "luxury", available: false, hotel: null, hotelCount: 0 },
        },
        totalHotels: 0,
        destination,
      });
    }

    // Calculate nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Group hotels by star rating into tiers
    const tierBuckets: Record<string, HotelBedsHotel[]> = {
      budget: [],
      standard: [],
      deluxe: [],
      luxury: [],
    };

    for (const hotel of searchResult.hotels) {
      const stars = getStarRating(hotel.categoryCode);
      const tier = categorizeTier(stars);
      if (tier) {
        tierBuckets[tier].push(hotel);
      }
    }

    // Get best hotel from each tier
    const tierResults: Record<string, TierResult> = {};
    const hotelCodesToEnrich: number[] = [];

    for (const tierName of ["budget", "standard", "deluxe", "luxury"] as const) {
      const bestHotel = getBestHotelForTier(tierBuckets[tierName], nights);
      tierResults[tierName] = {
        tier: tierName,
        available: bestHotel !== null,
        hotel: bestHotel,
        hotelCount: tierBuckets[tierName].length,
      };
      if (bestHotel) {
        hotelCodesToEnrich.push(bestHotel.code);
      }
    }

    // Enrich with content (images, facilities) for all tier best hotels
    if (hotelCodesToEnrich.length > 0) {
      const contentMap = await getHotelContent(hotelCodesToEnrich);

      for (const tierName of ["budget", "standard", "deluxe", "luxury"] as const) {
        const tier = tierResults[tierName];
        if (tier.hotel) {
          const content = contentMap.get(tier.hotel.code);
          if (content) {
            tier.hotel.images = content.images;
            if (content.name) {
              tier.hotel.name = content.name;
            }
          }
        }
      }
    }

    const responseData = {
      tiers: tierResults,
      totalHotels: searchResult.hotels.length,
      destination,
      nights,
      coordinates: searchResult.coordinates,
    };

    // Cache the result
    tierCache.set(cacheKey, { data: responseData, expiry: Date.now() + TIER_CACHE_TTL });

    return NextResponse.json({ status: true, ...responseData });
  } catch (error: any) {
    console.error("Hotel tier search error:", error.message);
    return NextResponse.json(
      { status: false, error: "Failed to search hotels" },
      { status: 500 }
    );
  }
}
