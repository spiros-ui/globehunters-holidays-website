/**
 * Duffel Flight API Adapter
 * Documentation: https://duffel.com/docs
 */

import type { FlightOffer, FlightSlice, FlightSegment, Airport, Airline, Money, Currency, BaggageAllowance, PassengerPricing } from "@/types";

const DUFFEL_API_URL = process.env.DUFFEL_API_URL || "https://api.duffel.com";
const DUFFEL_ACCESS_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

interface DuffelSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
  currency?: Currency;
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  expires_at: string;
}

interface DuffelSlice {
  id: string;
  origin: DuffelPlace;
  destination: DuffelPlace;
  departure_datetime: string;
  arrival_datetime: string;
  duration: string;
  segments: DuffelSegment[];
}

interface DuffelSegment {
  id: string;
  operating_carrier: DuffelCarrier;
  marketing_carrier: DuffelCarrier;
  operating_carrier_flight_number: string;
  origin: DuffelPlace;
  destination: DuffelPlace;
  departing_at: string;
  arriving_at: string;
  duration: string;
  aircraft?: { name: string };
  passengers: { cabin_class: string; baggages: { type: string; quantity: number }[] }[];
}

interface DuffelPlace {
  iata_code: string;
  name: string;
  city_name: string;
  iata_country_code: string;
}

interface DuffelCarrier {
  iata_code: string;
  name: string;
  logo_symbol_url?: string;
}

interface DuffelPassenger {
  id: string;
  type: string;
}

async function duffelRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  if (!DUFFEL_ACCESS_TOKEN) {
    throw new Error("DUFFEL_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(`${DUFFEL_API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Duffel-Version": "v2",
      "Authorization": `Bearer ${DUFFEL_ACCESS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Duffel API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (e.g., "PT2H30M")
  const match = duration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return 0;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;

  return hours * 60 + minutes;
}

function normalizeAirport(place: DuffelPlace): Airport {
  return {
    code: place.iata_code,
    name: place.name,
    city: place.city_name,
    country: place.iata_country_code,
  };
}

function normalizeAirline(carrier: DuffelCarrier): Airline {
  return {
    code: carrier.iata_code,
    name: carrier.name,
    logo: carrier.logo_symbol_url,
  };
}

function normalizeSegment(segment: DuffelSegment): FlightSegment {
  const passengerInfo = segment.passengers[0];

  return {
    airline: normalizeAirline(segment.marketing_carrier),
    flightNumber: `${segment.marketing_carrier.iata_code}${segment.operating_carrier_flight_number}`,
    aircraft: segment.aircraft?.name,
    origin: normalizeAirport(segment.origin),
    destination: normalizeAirport(segment.destination),
    departureTime: segment.departing_at,
    arrivalTime: segment.arriving_at,
    duration: parseDuration(segment.duration),
    cabinClass: passengerInfo?.cabin_class || "economy",
  };
}

function normalizeSlice(slice: DuffelSlice): FlightSlice {
  return {
    origin: normalizeAirport(slice.origin),
    destination: normalizeAirport(slice.destination),
    departureTime: slice.departure_datetime,
    arrivalTime: slice.arrival_datetime,
    duration: parseDuration(slice.duration),
    segments: slice.segments.map(normalizeSegment),
    stops: slice.segments.length - 1,
  };
}

function normalizeBaggage(segments: DuffelSegment[]): BaggageAllowance {
  const firstSegment = segments[0];
  const passenger = firstSegment?.passengers[0];
  const baggages = passenger?.baggages || [];

  const cabin = baggages.find((b) => b.type === "carry_on");
  const checked = baggages.find((b) => b.type === "checked");

  return {
    cabin: cabin ? `${cabin.quantity} x Cabin bag` : "No cabin bag included",
    checked: checked ? `${checked.quantity} x Checked bag` : "No checked bag included",
  };
}

function normalizeOffer(offer: DuffelOffer, currency: Currency): FlightOffer {
  const outbound = offer.slices[0];
  const inbound = offer.slices.length > 1 ? offer.slices[1] : undefined;

  const passengerPricing: PassengerPricing[] = offer.passengers.map((p) => ({
    type: p.type as "adult" | "child" | "infant",
    price: {
      amount: parseFloat(offer.total_amount) / offer.passengers.length,
      currency,
    },
  }));

  return {
    id: offer.id,
    provider: "duffel",
    providerOfferId: offer.id,
    outbound: normalizeSlice(outbound),
    inbound: inbound ? normalizeSlice(inbound) : undefined,
    totalPrice: {
      amount: parseFloat(offer.total_amount),
      currency,
    },
    basePrice: {
      amount: parseFloat(offer.base_amount),
      currency,
    },
    taxes: {
      amount: parseFloat(offer.tax_amount),
      currency,
    },
    passengers: passengerPricing,
    cabinClass: outbound.segments[0]?.passengers[0]?.cabin_class || "economy",
    baggageIncluded: normalizeBaggage(outbound.segments),
    expiresAt: new Date(offer.expires_at),
  };
}

export async function searchFlights(params: DuffelSearchParams): Promise<FlightOffer[]> {
  const slices = [
    {
      origin: params.origin,
      destination: params.destination,
      departure_date: params.departureDate,
    },
  ];

  if (params.returnDate) {
    slices.push({
      origin: params.destination,
      destination: params.origin,
      departure_date: params.returnDate,
    });
  }

  const passengers = [
    ...Array(params.adults).fill({ type: "adult" }),
    ...Array(params.children).fill({ type: "child" }),
    ...Array(params.infants || 0).fill({ type: "infant_without_seat" }),
  ];

  const response = await duffelRequest<{ data: { offers: DuffelOffer[] } }>(
    "/air/offer_requests",
    "POST",
    {
      data: {
        slices,
        passengers,
        cabin_class: params.cabinClass || "economy",
        return_offers: true,
        currency: params.currency || "GBP",
      },
    }
  );

  const currency = params.currency || "GBP";
  return response.data.offers.map((offer) => normalizeOffer(offer, currency));
}

export async function getFlightOffer(offerId: string): Promise<FlightOffer | null> {
  try {
    const response = await duffelRequest<{ data: DuffelOffer }>(
      `/air/offers/${offerId}`
    );

    return normalizeOffer(response.data, "GBP");
  } catch (error) {
    console.error("Error fetching flight offer:", error);
    return null;
  }
}

// Mock data for development/testing when API is not available
export function getMockFlightOffers(params: DuffelSearchParams): FlightOffer[] {
  const mockOffers: FlightOffer[] = [
    {
      id: "mock-offer-1",
      provider: "duffel",
      providerOfferId: "mock-offer-1",
      outbound: {
        origin: { code: params.origin, name: "London", city: "London", country: "GB" },
        destination: { code: params.destination, name: "Destination", city: "Destination City", country: "XX" },
        departureTime: `${params.departureDate}T09:00:00Z`,
        arrivalTime: `${params.departureDate}T14:00:00Z`,
        duration: 300,
        segments: [
          {
            airline: { code: "BA", name: "British Airways", logo: undefined },
            flightNumber: "BA123",
            origin: { code: params.origin, name: "London", city: "London", country: "GB" },
            destination: { code: params.destination, name: "Destination", city: "Destination City", country: "XX" },
            departureTime: `${params.departureDate}T09:00:00Z`,
            arrivalTime: `${params.departureDate}T14:00:00Z`,
            duration: 300,
            cabinClass: "economy",
          },
        ],
        stops: 0,
      },
      inbound: params.returnDate
        ? {
            origin: { code: params.destination, name: "Destination", city: "Destination City", country: "XX" },
            destination: { code: params.origin, name: "London", city: "London", country: "GB" },
            departureTime: `${params.returnDate}T10:00:00Z`,
            arrivalTime: `${params.returnDate}T15:00:00Z`,
            duration: 300,
            segments: [
              {
                airline: { code: "BA", name: "British Airways", logo: undefined },
                flightNumber: "BA456",
                origin: { code: params.destination, name: "Destination", city: "Destination City", country: "XX" },
                destination: { code: params.origin, name: "London", city: "London", country: "GB" },
                departureTime: `${params.returnDate}T10:00:00Z`,
                arrivalTime: `${params.returnDate}T15:00:00Z`,
                duration: 300,
                cabinClass: "economy",
              },
            ],
            stops: 0,
          }
        : undefined,
      totalPrice: { amount: 450, currency: params.currency || "GBP" },
      basePrice: { amount: 380, currency: params.currency || "GBP" },
      taxes: { amount: 70, currency: params.currency || "GBP" },
      passengers: [
        { type: "adult", price: { amount: 225, currency: params.currency || "GBP" } },
      ],
      cabinClass: "economy",
      baggageIncluded: { cabin: "1 x Cabin bag", checked: "1 x Checked bag (23kg)" },
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  ];

  return mockOffers;
}
