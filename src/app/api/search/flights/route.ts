import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@/types";

const DUFFEL_API = "https://api.duffel.com";
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const REQUEST_TIMEOUT_MS = 15 * 1000; // 15 seconds
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second base for exponential backoff

// In-memory cache
interface CacheEntry {
  data: TransformedFlight[];
  expiresAt: number;
}
const flightCache = new Map<string, CacheEntry>();

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calculate exponential backoff delay: 1s, 2s, 4s
function getBackoffDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

// Fetch with timeout using AbortController
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Fetch with retry logic and exponential backoff
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`[FlightSearch] API request attempt ${attempt + 1}/${MAX_RETRIES}`);
      const response = await fetchWithTimeout(url, options);

      // Don't retry on client errors (4xx) except for 429 (rate limiting)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on server errors (5xx) or rate limiting (429)
      if (response.status >= 500 || response.status === 429) {
        const errorMessage = `Server error: ${response.status}`;
        console.warn(`[FlightSearch] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errorMessage}`);
        lastError = new Error(errorMessage);

        if (attempt < MAX_RETRIES - 1) {
          const delay = getBackoffDelay(attempt);
          console.log(`[FlightSearch] Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      const errorType = isTimeout ? "timeout" : "network error";

      console.warn(
        `[FlightSearch] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${errorType}`,
        error instanceof Error ? error.message : error
      );

      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        const delay = getBackoffDelay(attempt);
        console.log(`[FlightSearch] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// Generate cache key from search parameters
function generateCacheKey(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string | null;
  adults: number;
  children: number;
  currency: string;
  cabinClass: string;
  directFlightsOnly: boolean;
}): string {
  return `flights:${params.origin}-${params.destination}-${params.departureDate}-${params.returnDate || "oneway"}-${params.adults}a${params.children}c-${params.currency}-${params.cabinClass}-${params.directFlightsOnly ? "direct" : "all"}`;
}

// Get from cache if valid
function getFromCache(key: string): TransformedFlight[] | null {
  const entry = flightCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    flightCache.delete(key);
    console.log(`[FlightSearch] Cache expired for key: ${key.substring(0, 50)}...`);
    return null;
  }

  console.log(`[FlightSearch] Cache hit for key: ${key.substring(0, 50)}...`);
  return entry.data;
}

// Set in cache with TTL
function setInCache(key: string, data: TransformedFlight[]): void {
  flightCache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  console.log(`[FlightSearch] Cached ${data.length} flights (TTL: ${CACHE_TTL_MS}ms)`);
}

interface DuffelSegment {
  id: string;
  origin: {
    iata_code: string;
    name: string;
    city_name: string;
  };
  destination: {
    iata_code: string;
    name: string;
    city_name: string;
  };
  departing_at: string;
  arriving_at: string;
  duration: string; // ISO 8601 duration e.g. "PT2H30M"
  marketing_carrier: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
    logo_lockup_url: string;
  };
  operating_carrier: {
    iata_code: string;
    name: string;
  };
  marketing_carrier_flight_number: string;
  aircraft: {
    name: string;
  };
  passengers: Array<{
    cabin_class: string;
    cabin_class_marketing_name: string;
    baggages: Array<{
      type: string;
      quantity: number;
    }>;
  }>;
}

interface DuffelSlice {
  id: string;
  origin: {
    iata_code: string;
    name: string;
    city_name: string;
  };
  destination: {
    iata_code: string;
    name: string;
    city_name: string;
  };
  duration: string;
  segments: DuffelSegment[];
}

interface DuffelPassenger {
  id: string;
  type: string;
  given_name?: string;
  family_name?: string;
  age?: number;
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount: string;
  slices: DuffelSlice[];
  owner: {
    iata_code: string;
    name: string;
    logo_symbol_url: string;
    logo_lockup_url: string;
  };
  passengers: DuffelPassenger[];
  payment_requirements: {
    requires_instant_payment: boolean;
    payment_required_by: string;
  };
}

interface TransformedSegment {
  departureAirport: string;
  departureAirportName: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalAirportName: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  operatingCarrier: string | undefined;
  duration: number;
  cabinClass: string;
  aircraft: string | undefined;
  baggageIncluded: boolean;
}

interface TransformedSlice {
  origin: string;
  originName: string;
  originCity: string;
  destination: string;
  destinationName: string;
  destinationCity: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  stops: number;
  duration: number;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  segments: TransformedSegment[];
}

interface PassengerFareBreakdown {
  type: "adult" | "child" | "infant";
  count: number;
  pricePerPerson: number;
  totalPrice: number;
}

interface TransformedFlight {
  id: string;
  price: number;
  basePrice: number;
  taxAmount: number;
  currency: string;
  ownerCode: string;
  ownerName: string;
  ownerLogo: string;
  outbound: TransformedSlice;
  inbound: TransformedSlice | null;
  passengers: {
    adults: number;
    children: number;
    infants: number;
    total: number;
  };
  passengerFareBreakdown: PassengerFareBreakdown[];
  cabinBaggage: string;
  checkedBaggage: string;
  paymentDeadline: string | undefined;
  instantPaymentRequired: boolean | undefined;
}

// Parse ISO 8601 duration to minutes
function parseDuration(duration: string | null | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  return hours * 60 + minutes;
}

// Compute duration in minutes from departure/arrival timestamps as fallback
function computeDurationFromTimes(departingAt: string, arrivingAt: string): number {
  try {
    const dep = new Date(departingAt).getTime();
    const arr = new Date(arrivingAt).getTime();
    if (isNaN(dep) || isNaN(arr)) return 0;
    return Math.round((arr - dep) / 60000);
  } catch {
    return 0;
  }
}

// Format datetime to time string
function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Format datetime to date string
function formatDate(dateTime: string): string {
  return new Date(dateTime).toISOString().split("T")[0];
}

// Transform a single Duffel slice to our format
function transformSlice(slice: DuffelSlice): TransformedSlice {
  const firstSegment = slice.segments[0];
  const lastSegment = slice.segments[slice.segments.length - 1];

  return {
    origin: slice.origin.iata_code,
    originName: slice.origin.name,
    originCity: slice.origin.city_name,
    destination: slice.destination.iata_code,
    destinationName: slice.destination.name,
    destinationCity: slice.destination.city_name,
    airlineCode: firstSegment.marketing_carrier.iata_code,
    airlineName: firstSegment.marketing_carrier.name,
    airlineLogo: firstSegment.marketing_carrier.logo_symbol_url,
    stops: slice.segments.length - 1,
    duration: parseDuration(slice.duration) || computeDurationFromTimes(firstSegment.departing_at, lastSegment.arriving_at),
    departureTime: formatTime(firstSegment.departing_at),
    arrivalTime: formatTime(lastSegment.arriving_at),
    departureDate: formatDate(firstSegment.departing_at),
    arrivalDate: formatDate(lastSegment.arriving_at),
    segments: slice.segments.map((seg) => ({
      departureAirport: seg.origin.iata_code,
      departureAirportName: seg.origin.name,
      departureCity: seg.origin.city_name,
      arrivalAirport: seg.destination.iata_code,
      arrivalAirportName: seg.destination.name,
      arrivalCity: seg.destination.city_name,
      departureTime: formatTime(seg.departing_at),
      arrivalTime: formatTime(seg.arriving_at),
      departureDate: formatDate(seg.departing_at),
      arrivalDate: formatDate(seg.arriving_at),
      flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
      airlineCode: seg.marketing_carrier.iata_code,
      airlineName: seg.marketing_carrier.name,
      airlineLogo: seg.marketing_carrier.logo_symbol_url,
      operatingCarrier: seg.operating_carrier?.name,
      duration: parseDuration(seg.duration),
      cabinClass: seg.passengers?.[0]?.cabin_class_marketing_name || "Economy",
      aircraft: seg.aircraft?.name,
      baggageIncluded: seg.passengers?.[0]?.baggages?.some(b => b.type === "checked" && b.quantity > 0) || false,
    })),
  };
}

// Calculate passenger fare breakdown from Duffel offer
function calculatePassengerFareBreakdown(
  offer: DuffelOffer,
  adults: number,
  children: number,
  infants: number
): PassengerFareBreakdown[] {
  const totalAmount = parseFloat(offer.total_amount);
  const breakdown: PassengerFareBreakdown[] = [];

  // Count actual passenger types from offer
  const adultCount = offer.passengers.filter(p => p.type === "adult").length || adults;
  const childCount = offer.passengers.filter(p => p.type === "child").length || children;
  const infantCount = offer.passengers.filter(p =>
    p.type === "infant_without_seat" || p.type === "infant_with_seat"
  ).length || infants;

  const totalPassengers = adultCount + childCount + infantCount;

  // Duffel doesn't provide per-passenger pricing, so we estimate:
  // - Adults pay full price
  // - Children typically pay ~75-90% of adult fare
  // - Infants typically pay ~10% of adult fare (or free on lap)

  if (totalPassengers === 0) {
    return breakdown;
  }

  // Weight-based calculation
  const adultWeight = 1.0;
  const childWeight = 0.85; // Children ~85% of adult fare
  const infantWeight = 0.10; // Infants ~10% of adult fare

  const totalWeight =
    (adultCount * adultWeight) +
    (childCount * childWeight) +
    (infantCount * infantWeight);

  const pricePerWeight = totalAmount / totalWeight;

  if (adultCount > 0) {
    const adultPricePerPerson = Math.round(pricePerWeight * adultWeight * 100) / 100;
    breakdown.push({
      type: "adult",
      count: adultCount,
      pricePerPerson: adultPricePerPerson,
      totalPrice: Math.round(adultPricePerPerson * adultCount * 100) / 100,
    });
  }

  if (childCount > 0) {
    const childPricePerPerson = Math.round(pricePerWeight * childWeight * 100) / 100;
    breakdown.push({
      type: "child",
      count: childCount,
      pricePerPerson: childPricePerPerson,
      totalPrice: Math.round(childPricePerPerson * childCount * 100) / 100,
    });
  }

  if (infantCount > 0) {
    const infantPricePerPerson = Math.round(pricePerWeight * infantWeight * 100) / 100;
    breakdown.push({
      type: "infant",
      count: infantCount,
      pricePerPerson: infantPricePerPerson,
      totalPrice: Math.round(infantPricePerPerson * infantCount * 100) / 100,
    });
  }

  return breakdown;
}

// Transform Duffel offers to our format and optionally filter direct flights
function transformOffers(
  offers: DuffelOffer[],
  adults: number,
  children: number,
  infants: number,
  passengerCount: number,
  directFlightsOnly: boolean
): TransformedFlight[] {
  let flights = offers.map((offer) => {
    const outboundSlice = offer.slices[0];
    const inboundSlice = offer.slices[1];

    // Extract baggage info from first segment
    const firstSegment = outboundSlice.segments[0];
    const passengerBaggages = firstSegment?.passengers?.[0]?.baggages || [];
    const cabinBag = passengerBaggages.find((b: { type: string; quantity: number }) => b.type === "carry_on");
    const checkedBag = passengerBaggages.find((b: { type: string; quantity: number }) => b.type === "checked");

    // Calculate passenger fare breakdown
    const passengerFareBreakdown = calculatePassengerFareBreakdown(offer, adults, children, infants);

    return {
      id: offer.id,
      price: parseFloat(offer.total_amount),
      basePrice: parseFloat(offer.base_amount),
      taxAmount: parseFloat(offer.tax_amount),
      currency: offer.total_currency,
      ownerCode: offer.owner.iata_code,
      ownerName: offer.owner.name,
      ownerLogo: offer.owner.logo_lockup_url || offer.owner.logo_symbol_url,
      outbound: transformSlice(outboundSlice),
      inbound: inboundSlice ? transformSlice(inboundSlice) : null,
      passengers: {
        adults,
        children,
        infants,
        total: passengerCount,
      },
      passengerFareBreakdown,
      cabinBaggage: cabinBag && cabinBag.quantity > 0
        ? `${cabinBag.quantity} × Cabin bag (up to 10kg)`
        : "Personal item only (40×30×15cm)",
      checkedBaggage: checkedBag && checkedBag.quantity > 0
        ? `${checkedBag.quantity} × Checked bag (23kg each)`
        : "Not included – available to purchase",
      paymentDeadline: offer.payment_requirements?.payment_required_by,
      instantPaymentRequired: offer.payment_requirements?.requires_instant_payment,
    };
  });

  // Filter for direct flights only if requested
  if (directFlightsOnly) {
    flights = flights.filter((flight) => {
      const outboundDirect = flight.outbound.stops === 0;
      const inboundDirect = flight.inbound ? flight.inbound.stops === 0 : true;
      return outboundDirect && inboundDirect;
    });
    console.log(`[FlightSearch] Filtered to ${flights.length} direct flights`);
  }

  // Sort by price by default
  flights.sort((a, b) => a.price - b.price);

  return flights;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "1");
  const children = parseInt(searchParams.get("children") || "0");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const cabinClass = searchParams.get("cabinClass") || "economy";
  const directFlightsOnly = searchParams.get("directFlightsOnly") === "true";

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: "Missing required parameters: origin, destination, departureDate" },
      { status: 400 }
    );
  }

  // Return error if Duffel API token is not configured
  if (!DUFFEL_TOKEN) {
    console.error("[FlightSearch] Duffel API token not configured");
    return NextResponse.json({
      status: true,
      data: [],
      totalResults: 0,
      currency,
      message: "Flight search service unavailable",
    });
  }

  // Check cache first
  const cacheKey = generateCacheKey({
    origin,
    destination,
    departureDate,
    returnDate,
    adults,
    children,
    currency,
    cabinClass,
    directFlightsOnly,
  });

  const cachedFlights = getFromCache(cacheKey);
  if (cachedFlights) {
    return NextResponse.json({
      status: true,
      data: cachedFlights,
      totalResults: cachedFlights.length,
      currency,
      fromCache: true,
    });
  }

  try {
    // Build passengers array with proper infant/child distinction
    const childAgesParam = searchParams.get("childAges");
    const childAges = childAgesParam
      ? childAgesParam.split(",").map(Number)
      : Array(children).fill(7); // default age 7 if not specified

    const passengers: Array<{ type?: string; age?: number }> = [];
    let infantCount = 0;
    let childCount = 0;

    for (let i = 0; i < adults; i++) {
      passengers.push({ type: "adult" });
    }
    for (let i = 0; i < children; i++) {
      const age = childAges[i] ?? 7;
      // Duffel API v2: use `age` only for non-adults — Duffel infers the passenger type
      // Infants are typically under 2 years old
      if (age < 2) {
        infantCount++;
      } else {
        childCount++;
      }
      passengers.push({ age });
    }

    // Build slices (outbound + optional return)
    const slices: Array<{
      origin: string;
      destination: string;
      departure_date: string;
    }> = [
      {
        origin,
        destination,
        departure_date: departureDate,
      },
    ];

    if (returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate,
      });
    }

    console.log(`[FlightSearch] Searching flights: ${origin} -> ${destination}, ${departureDate}${returnDate ? ` - ${returnDate}` : ""}, ${adults}a ${children}c, direct=${directFlightsOnly}`);

    // Create offer request with retry logic and timeout
    const response = await fetchWithRetry(`${DUFFEL_API}/air/offer_requests`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_TOKEN}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
        "Accept-Encoding": "gzip",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers,
          cabin_class: cabinClass,
          return_offers: true,
          currency,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ errors: [{ message: "Unknown error" }] }));
      console.error("[FlightSearch] Duffel API error:", errorData);

      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        currency,
        message: errorData.errors?.[0]?.message || "Flight search failed",
      });
    }

    const data = await response.json();
    const offers: DuffelOffer[] = data.data?.offers || [];

    console.log(`[FlightSearch] Received ${offers.length} offers from Duffel API`);

    // Transform to our format and apply direct flights filter
    const flights = transformOffers(offers, adults, childCount, infantCount, passengers.length, directFlightsOnly);

    // Cache the results
    setInCache(cacheKey, flights);

    return NextResponse.json({
      status: true,
      data: flights,
      totalResults: flights.length,
      currency,
    });
  } catch (error) {
    console.error("[FlightSearch] Flight search error after all retries:", error);

    return NextResponse.json({
      status: true,
      data: [],
      totalResults: 0,
      currency,
      message: error instanceof Error ? error.message : "Flight search failed",
    });
  }
}
