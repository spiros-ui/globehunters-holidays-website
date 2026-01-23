/**
 * Amadeus Hotel API Adapter
 * Documentation: https://developers.amadeus.com/self-service/category/hotels
 */

import type { HotelOffer, RoomOffer, HotelImage, Address, CancellationPolicy, Money, Currency } from "@/types";

const AMADEUS_API_URL = process.env.AMADEUS_API_URL || "https://test.api.amadeus.com";
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiry: number = 0;

interface AmadeusSearchParams {
  destination: string; // City code
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  currency?: Currency;
}

interface AmadeusHotelOffer {
  type: string;
  hotel: {
    hotelId: string;
    name: string;
    rating?: number;
    address?: {
      lines?: string[];
      cityName?: string;
      countryCode?: string;
      postalCode?: string;
    };
    latitude?: number;
    longitude?: number;
    amenities?: string[];
  };
  offers: AmadeusRoomOffer[];
}

interface AmadeusRoomOffer {
  id: string;
  room: {
    type?: string;
    description?: { text?: string };
    typeEstimated?: {
      category?: string;
      beds?: number;
      bedType?: string;
    };
  };
  guests?: { adults?: number };
  price: {
    currency: string;
    total: string;
    base?: string;
    variations?: {
      average?: { total?: string };
    };
  };
  policies?: {
    cancellations?: Array<{
      deadline?: string;
      amount?: string;
      description?: { text?: string };
    }>;
    paymentType?: string;
  };
  boardType?: string;
}

async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    throw new Error("Amadeus credentials not configured");
  }

  const response = await fetch(`${AMADEUS_API_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth error: ${response.status}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return accessToken!;
}

async function amadeusRequest<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();

  const url = new URL(`${AMADEUS_API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Amadeus API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

function normalizeAddress(address?: AmadeusHotelOffer["hotel"]["address"]): Address {
  return {
    line1: address?.lines?.[0] || "",
    line2: address?.lines?.[1],
    city: address?.cityName || "",
    country: address?.countryCode || "",
    postalCode: address?.postalCode,
  };
}

function normalizeCancellationPolicy(
  policies?: AmadeusRoomOffer["policies"]
): CancellationPolicy {
  const cancellation = policies?.cancellations?.[0];

  if (!cancellation) {
    return {
      type: "non_refundable",
      description: "Non-refundable",
    };
  }

  if (cancellation.amount === "0" || cancellation.description?.text?.toLowerCase().includes("free")) {
    return {
      type: "free",
      deadline: cancellation.deadline,
      description: cancellation.description?.text || "Free cancellation",
    };
  }

  return {
    type: "partial",
    deadline: cancellation.deadline,
    description: cancellation.description?.text || "Partial refund available",
  };
}

function normalizeRoomOffer(
  offer: AmadeusRoomOffer,
  nights: number,
  currency: Currency
): RoomOffer {
  const totalPrice = parseFloat(offer.price.total);
  const pricePerNight = totalPrice / nights;

  return {
    id: offer.id,
    name: offer.room.typeEstimated?.category || offer.room.type || "Standard Room",
    description: offer.room.description?.text,
    bedType: offer.room.typeEstimated?.bedType,
    maxOccupancy: offer.guests?.adults || 2,
    price: {
      amount: totalPrice,
      currency,
    },
    pricePerNight: {
      amount: pricePerNight,
      currency,
    },
    cancellationPolicy: normalizeCancellationPolicy(offer.policies),
    mealPlan: offer.boardType,
    available: true,
  };
}

function normalizeHotelOffer(
  hotelOffer: AmadeusHotelOffer,
  nights: number,
  currency: Currency
): HotelOffer {
  const hotel = hotelOffer.hotel;
  const offers = hotelOffer.offers;

  const lowestPrice = Math.min(
    ...offers.map((o) => parseFloat(o.price.total))
  );

  // Note: Amadeus Self-Service doesn't provide hotel images
  // You would need to use a separate service like Leonardo
  const images: HotelImage[] = [
    {
      url: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80`,
      category: "exterior",
      alt: hotel.name,
    },
  ];

  return {
    id: hotel.hotelId,
    provider: "amadeus",
    providerHotelId: hotel.hotelId,
    name: hotel.name,
    starRating: hotel.rating || 4,
    address: normalizeAddress(hotel.address),
    coordinates: hotel.latitude && hotel.longitude
      ? { latitude: hotel.latitude, longitude: hotel.longitude }
      : undefined,
    images,
    amenities: hotel.amenities || [],
    rooms: offers.map((o) => normalizeRoomOffer(o, nights, currency)),
    checkIn: "", // Set by caller
    checkOut: "", // Set by caller
    lowestPrice: {
      amount: lowestPrice,
      currency,
    },
  };
}

export async function searchHotels(params: AmadeusSearchParams): Promise<HotelOffer[]> {
  const currency = params.currency || "GBP";

  // First, get hotel IDs for the city
  const hotelListResponse = await amadeusRequest<{ data: Array<{ hotelId: string }> }>(
    "/v1/reference-data/locations/hotels/by-city",
    {
      cityCode: params.destination,
      radius: "10",
      radiusUnit: "KM",
    }
  );

  if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
    return [];
  }

  // Get top 20 hotel IDs
  const hotelIds = hotelListResponse.data
    .slice(0, 20)
    .map((h) => h.hotelId)
    .join(",");

  // Search for offers
  const offersResponse = await amadeusRequest<{ data: AmadeusHotelOffer[] }>(
    "/v3/shopping/hotel-offers",
    {
      hotelIds,
      adults: params.adults.toString(),
      checkInDate: params.checkIn,
      checkOutDate: params.checkOut,
      roomQuantity: params.rooms.toString(),
      currency,
    }
  );

  if (!offersResponse.data) {
    return [];
  }

  // Calculate nights
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return offersResponse.data.map((offer) => {
    const normalized = normalizeHotelOffer(offer, nights, currency);
    normalized.checkIn = params.checkIn;
    normalized.checkOut = params.checkOut;
    return normalized;
  });
}

export async function getHotelOffer(hotelId: string, offerId: string): Promise<HotelOffer | null> {
  try {
    const response = await amadeusRequest<{ data: AmadeusHotelOffer }>(
      `/v3/shopping/hotel-offers/${offerId}`
    );

    return normalizeHotelOffer(response.data, 1, "GBP");
  } catch (error) {
    console.error("Error fetching hotel offer:", error);
    return null;
  }
}

// Mock data for development/testing when API is not available
export function getMockHotelOffers(params: AmadeusSearchParams): HotelOffer[] {
  const checkIn = new Date(params.checkIn);
  const checkOut = new Date(params.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const currency = params.currency || "GBP";

  const mockHotels: HotelOffer[] = [
    {
      id: "mock-hotel-1",
      provider: "amadeus",
      providerHotelId: "mock-hotel-1",
      name: "Grand Luxury Resort & Spa",
      starRating: 5,
      address: {
        line1: "123 Beach Road",
        city: "Destination City",
        country: "XX",
      },
      images: [
        { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80", category: "exterior", alt: "Hotel exterior" },
        { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80", category: "room", alt: "Room view" },
      ],
      amenities: ["Pool", "Spa", "Restaurant", "WiFi", "Gym", "Beach Access"],
      rooms: [
        {
          id: "room-1",
          name: "Deluxe Ocean View",
          description: "Spacious room with stunning ocean views",
          bedType: "King",
          maxOccupancy: 2,
          price: { amount: 250 * nights, currency },
          pricePerNight: { amount: 250, currency },
          cancellationPolicy: { type: "free", deadline: params.checkIn, description: "Free cancellation until check-in" },
          mealPlan: "Breakfast included",
          available: true,
        },
      ],
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      lowestPrice: { amount: 250 * nights, currency },
      reviewScore: 9.2,
      reviewCount: 1250,
    },
    {
      id: "mock-hotel-2",
      provider: "amadeus",
      providerHotelId: "mock-hotel-2",
      name: "City Center Boutique Hotel",
      starRating: 4,
      address: {
        line1: "456 Main Street",
        city: "Destination City",
        country: "XX",
      },
      images: [
        { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80", category: "exterior", alt: "Hotel exterior" },
      ],
      amenities: ["WiFi", "Restaurant", "Bar", "Room Service"],
      rooms: [
        {
          id: "room-2",
          name: "Superior Double",
          description: "Modern room in the heart of the city",
          bedType: "Queen",
          maxOccupancy: 2,
          price: { amount: 150 * nights, currency },
          pricePerNight: { amount: 150, currency },
          cancellationPolicy: { type: "partial", description: "50% refund if cancelled 48h before" },
          available: true,
        },
      ],
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      lowestPrice: { amount: 150 * nights, currency },
      reviewScore: 8.5,
      reviewCount: 890,
    },
  ];

  return mockHotels;
}
