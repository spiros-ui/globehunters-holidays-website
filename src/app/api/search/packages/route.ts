import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@/types";
import { searchCityAttractions, getPrimaryCategory, generateTourPrice } from "@/lib/opentripmap";
import { applyAdminMarkup } from "@/lib/admin-settings";
import { generatePackageTheme, generateThemeDescription } from "@/lib/theme-generator";

const DUFFEL_API = "https://api.duffel.com";
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

const RATEHAWK_API = "https://api.worldota.net/api/b2b/v3";
const RATEHAWK_KEY_ID = process.env.RATEHAWK_KEY_ID;
const RATEHAWK_KEY = process.env.RATEHAWK_API_KEY;

// Map IATA airport codes to city/region names for hotel searches
const IATA_TO_CITY: Record<string, string> = {
  MLE: "Maldives", DXB: "Dubai", DPS: "Bali", BKK: "Bangkok",
  SIN: "Singapore", HKG: "Hong Kong", NRT: "Tokyo", HND: "Tokyo",
  JFK: "New York", LAX: "Los Angeles", SFO: "San Francisco",
  CDG: "Paris", ORY: "Paris", FCO: "Rome", BCN: "Barcelona",
  IST: "Istanbul", ATH: "Athens", LIS: "Lisbon", AMS: "Amsterdam",
  VIE: "Vienna", PRG: "Prague", ZRH: "Zurich", MUC: "Munich",
  FRA: "Frankfurt", CPH: "Copenhagen", ARN: "Stockholm", OSL: "Oslo",
  HEL: "Helsinki", WAW: "Warsaw", BUD: "Budapest", DUB: "Dublin",
  CPT: "Cape Town", JNB: "Johannesburg", NBO: "Nairobi", MRU: "Mauritius",
  CMB: "Colombo", DEL: "Delhi", BOM: "Mumbai", GOI: "Goa",
  GRU: "São Paulo", GIG: "Rio de Janeiro", MEX: "Mexico City",
  CUN: "Cancun", LIM: "Lima", BOG: "Bogota", SCL: "Santiago",
  LHR: "London", LON: "London", STN: "London", LGW: "London", LTN: "London",
  MAN: "Manchester", EDI: "Edinburgh", BHX: "Birmingham", GLA: "Glasgow",
  SYD: "Sydney", MEL: "Melbourne", AKL: "Auckland", PER: "Perth",
  PEK: "Beijing", PVG: "Shanghai", ICN: "Seoul", KUL: "Kuala Lumpur",
  HNL: "Honolulu", PMI: "Mallorca", TFS: "Tenerife", MIA: "Miami",
  ORD: "Chicago", SEA: "Seattle", BOS: "Boston", DEN: "Denver",
  PHU: "Phu Quoc", HAN: "Hanoi", SGN: "Ho Chi Minh City",
  KTM: "Kathmandu", DAD: "Da Nang", REP: "Siem Reap", RGN: "Yangon",
  MBA: "Mombasa", ZNZ: "Zanzibar", DSS: "Dakar", CMN: "Casablanca",
  CAI: "Cairo", AMM: "Amman", BAH: "Bahrain", DOH: "Doha",
  MCT: "Muscat", RUH: "Riyadh", JED: "Jeddah", TLV: "Tel Aviv",
  // Greece
  HER: "Crete", CHQ: "Crete", CRE: "Crete", SKG: "Thessaloniki",
  RHO: "Rhodes", CFU: "Corfu", KGS: "Kos", JMK: "Mykonos", JTR: "Santorini",
  // Cyprus
  LCA: "Larnaca", PFO: "Paphos",
  // Turkey
  AYT: "Antalya", DLM: "Dalaman", BJV: "Bodrum",
  // Spain
  AGP: "Malaga", ALC: "Alicante", IBZ: "Ibiza", MAH: "Menorca",
  // Portugal
  FAO: "Faro", FNC: "Madeira",
  // Italy
  NAP: "Naples", VCE: "Venice", MXP: "Milan", PSA: "Pisa",
  // Caribbean
  MBJ: "Jamaica", PUJ: "Punta Cana", SJU: "Puerto Rico", AUA: "Aruba",
  BGI: "Barbados", UVF: "St Lucia", GND: "Grenada",
  // Indian Ocean
  SEZ: "Seychelles",
  // Thailand
  HKT: "Phuket", USM: "Koh Samui", CNX: "Chiang Mai",
  // Indonesia
  LBJ: "Labuan Bajo", JOG: "Yogyakarta",
};

// Map non-standard codes to valid IATA codes for flight searches
const CODE_TO_IATA: Record<string, string> = {
  CRE: "HER", // Crete -> Heraklion
  PHU: "HKT", // Phuket (PHU is actually Phu Quoc, Vietnam)
};

// Build reverse mapping: city name -> IATA code (for when users search by city name)
const CITY_TO_IATA: Record<string, string> = {};
for (const [iata, city] of Object.entries(IATA_TO_CITY)) {
  const key = city.toLowerCase();
  // Skip non-standard codes that are mapped elsewhere (e.g. CRE)
  if (CODE_TO_IATA[iata]) continue;
  if (!CITY_TO_IATA[key]) {
    CITY_TO_IATA[key] = iata;
  }
}

// Helper functions
function getDuffelAuthHeader(): string {
  return `Bearer ${DUFFEL_TOKEN}`;
}

function getRateHawkAuthHeader(): string {
  const credentials = Buffer.from(`${RATEHAWK_KEY_ID}:${RATEHAWK_KEY}`).toString("base64");
  return `Basic ${credentials}`;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  return hours * 60 + minutes;
}

function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Search Duffel for flights
async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  adults: number,
  children: number,
  currency: string,
  childAges: number[] = []
) {
  // Return empty if no token configured
  if (!DUFFEL_TOKEN) {
    console.error("Duffel API token not configured");
    return [];
  }

  try {
    const passengers: Array<{ type: string; age?: number }> = [];
    for (let i = 0; i < adults; i++) passengers.push({ type: "adult" });
    for (let i = 0; i < children; i++) {
      const age = childAges[i] ?? 7;
      if (age < 2) {
        passengers.push({ type: "infant_without_seat" });
      } else {
        passengers.push({ type: "child", age });
      }
    }

    const slices = [
      { origin, destination, departure_date: departureDate },
      { origin: destination, destination: origin, departure_date: returnDate },
    ];

    const response = await fetch(`${DUFFEL_API}/air/offer_requests`, {
      method: "POST",
      headers: {
        "Authorization": getDuffelAuthHeader(),
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers,
          cabin_class: "economy",
          return_offers: true,
          currency: currency.toUpperCase(),
        },
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const offers = data.data?.offers || [];

    return offers
      .slice(0, 10)
      .map((offer: any) => {
        const outboundSlice = offer.slices[0];
        const inboundSlice = offer.slices[1];
        const firstSeg = outboundSlice?.segments[0];
        const lastSeg = outboundSlice?.segments[outboundSlice.segments.length - 1];

        return {
          id: offer.id,
          price: parseFloat(offer.total_amount),
          currency: offer.total_currency,
          airlineCode: firstSeg?.marketing_carrier?.iata_code || "",
          airlineName: firstSeg?.marketing_carrier?.name || "",
          airlineLogo: firstSeg?.marketing_carrier?.logo_symbol_url || "",
          stops: outboundSlice?.segments?.length - 1 || 0,
          outbound: {
            origin: outboundSlice?.origin?.iata_code,
            destination: outboundSlice?.destination?.iata_code,
            departureTime: formatTime(firstSeg?.departing_at),
            arrivalTime: formatTime(lastSeg?.arriving_at),
            duration: parseDuration(outboundSlice?.duration || "PT0H"),
            departureDate: firstSeg?.departing_at?.split("T")[0],
          },
          inbound: inboundSlice ? {
            origin: inboundSlice?.origin?.iata_code,
            destination: inboundSlice?.destination?.iata_code,
            departureTime: formatTime(inboundSlice?.segments[0]?.departing_at),
            arrivalTime: formatTime(inboundSlice?.segments[inboundSlice.segments.length - 1]?.arriving_at),
            duration: parseDuration(inboundSlice?.duration || "PT0H"),
            departureDate: inboundSlice?.segments[0]?.departing_at?.split("T")[0],
          } : null,
          segments: outboundSlice?.segments?.map((seg: any) => ({
            airline: seg.marketing_carrier?.name || "",
            airlineCode: seg.marketing_carrier?.iata_code || "",
            flightNumber: `${seg.marketing_carrier?.iata_code || ""}${seg.marketing_carrier_flight_number || ""}`,
            origin: seg.origin?.iata_code || "",
            originName: seg.origin?.name || "",
            destination: seg.destination?.iata_code || "",
            destinationName: seg.destination?.name || "",
            departureTime: formatTime(seg.departing_at),
            arrivalTime: formatTime(seg.arriving_at),
            duration: parseDuration(seg.duration || "PT0H"),
          })) || [],
          returnSegments: inboundSlice?.segments?.map((seg: any) => ({
            airline: seg.marketing_carrier?.name || "",
            airlineCode: seg.marketing_carrier?.iata_code || "",
            flightNumber: `${seg.marketing_carrier?.iata_code || ""}${seg.marketing_carrier_flight_number || ""}`,
            origin: seg.origin?.iata_code || "",
            originName: seg.origin?.name || "",
            destination: seg.destination?.iata_code || "",
            destinationName: seg.destination?.name || "",
            departureTime: formatTime(seg.departing_at),
            arrivalTime: formatTime(seg.arriving_at),
            duration: parseDuration(seg.duration || "PT0H"),
          })) || [],
        };
      })
      .sort((a: any, b: any) => a.price - b.price);
  } catch (error) {
    console.error("Duffel flight search error:", error);
    return [];
  }
}

// Search RateHawk for region
async function searchRegion(query: string): Promise<{ id: string; name: string; country: string } | null> {
  if (!RATEHAWK_KEY) return null;

  try {
    const response = await fetch(`${RATEHAWK_API}/search/multicomplete/`, {
      method: "POST",
      headers: {
        "Authorization": getRateHawkAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, language: "en" }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const regions = data.data?.regions || [];

    if (regions.length > 0) {
      return {
        id: String(regions[0].id),
        name: regions[0].name,
        country: regions[0].country || "",
      };
    }
    return null;
  } catch (error) {
    console.error("RateHawk region search error:", error);
    return null;
  }
}

// Fetch hotel info from RateHawk
async function fetchHotelInfo(hotelId: string): Promise<{
  name: string; starRating: number; address: string;
  images: string[]; amenities: string[];
} | null> {
  try {
    const response = await fetch(`${RATEHAWK_API}/hotel/info/`, {
      method: "POST",
      headers: {
        "Authorization": getRateHawkAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: hotelId, language: "en" }),
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (!result.data) return null;
    const h = result.data;

    // Extract images
    const images: string[] = [];
    if (h.images && Array.isArray(h.images)) {
      for (const img of h.images.slice(0, 8)) {
        if (typeof img === "string") images.push(img.replace("{size}", "640x400"));
      }
    }

    // Extract amenities
    const amenities: string[] = [];
    if (h.amenity_groups && Array.isArray(h.amenity_groups)) {
      for (const group of h.amenity_groups) {
        if (group.amenities) amenities.push(...group.amenities);
      }
    }

    return {
      name: h.name || "Hotel",
      starRating: h.star_rating || 0,
      address: h.address || "",
      images,
      amenities: amenities.slice(0, 10),
    };
  } catch {
    return null;
  }
}

// Search RateHawk for hotels (uses serp/region endpoint like the hotels API)
async function searchHotels(
  regionId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  rooms: number,
  currency: string
) {
  if (!RATEHAWK_KEY || !RATEHAWK_KEY_ID) return [];

  try {
    const adultsPerRoom = Math.ceil(adults / rooms);
    const guests: Array<{ adults: number; children: number[] }> = [];
    for (let i = 0; i < rooms; i++) {
      guests.push({ adults: adultsPerRoom, children: [] });
    }

    const response = await fetch(`${RATEHAWK_API}/search/serp/region/`, {
      method: "POST",
      headers: {
        "Authorization": getRateHawkAuthHeader(),
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
    });

    if (!response.ok) {
      console.error("RateHawk hotel search failed:", response.status);
      return [];
    }

    const data = await response.json();
    if (data.status === "error") {
      console.error("RateHawk API error:", data.error);
      return [];
    }

    const rawHotels = data.data?.hotels || [];
    const nights = calculateNights(checkIn, checkOut);

    // Filter hotels with rates and sort by price
    const sortedHotels = rawHotels
      .filter((h: any) => h.rates && h.rates.length > 0)
      .sort((a: any, b: any) => {
        const priceA = parseFloat(a.rates[0]?.payment_options?.payment_types?.[0]?.show_amount || a.rates[0]?.payment_options?.payment_types?.[0]?.amount || "999999");
        const priceB = parseFloat(b.rates[0]?.payment_options?.payment_types?.[0]?.show_amount || b.rates[0]?.payment_options?.payment_types?.[0]?.amount || "999999");
        return priceA - priceB;
      })
      .slice(0, 30);

    // Fetch hotel info in batches (up to 10 at a time)
    const hotelInfoMap = new Map<string, Awaited<ReturnType<typeof fetchHotelInfo>>>();
    for (let i = 0; i < sortedHotels.length; i += 10) {
      const batch = sortedHotels.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map((h: any) => fetchHotelInfo(h.id))
      );
      for (let j = 0; j < batch.length; j++) {
        const r = results[j];
        if (r.status === "fulfilled" && r.value) {
          hotelInfoMap.set(batch[j].id, r.value);
        }
      }
    }

    return sortedHotels
      .map((hotel: any) => {
        const cheapestRate = hotel.rates[0];
        const info = hotelInfoMap.get(hotel.id);

        let totalPrice = 0;
        if (cheapestRate?.payment_options?.payment_types?.[0]) {
          const pt = cheapestRate.payment_options.payment_types[0];
          totalPrice = parseFloat(pt.show_amount || pt.amount || "0");
        } else if (cheapestRate?.daily_prices) {
          totalPrice = cheapestRate.daily_prices.reduce(
            (sum: number, p: string) => sum + parseFloat(p), 0
          );
        }

        if (totalPrice <= 0) return null;

        // Determine meal plan
        let mealPlan = "Room Only";
        if (cheapestRate?.meal) {
          const mealMap: Record<string, string> = {
            nomeal: "Room Only", breakfast: "Breakfast Included",
            halfboard: "Half Board", fullboard: "Full Board",
            allinclusive: "All Inclusive",
          };
          mealPlan = mealMap[cheapestRate.meal] || cheapestRate.meal;
        }

        // Determine cancellation
        let freeCancellation = false;
        const penalties = cheapestRate?.payment_options?.payment_types?.[0]?.cancellation_penalties;
        if (penalties?.free_cancellation_before) {
          freeCancellation = true;
        }

        return {
          id: String(hotel.id),
          name: info?.name || hotel.id.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          starRating: info?.starRating || 0,
          address: info?.address || "",
          mainImage: info?.images?.[0] || null,
          images: info?.images || [],
          price: totalPrice,
          pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
          nights,
          roomType: cheapestRate?.room_name || "Standard Room",
          mealPlan,
          freeCancellation,
        };
      })
      .filter((h: any) => h !== null)
      .sort((a: any, b: any) => a.price - b.price);
  } catch (error) {
    console.error("RateHawk hotel search error:", error);
    return [];
  }
}

// Fetch attractions for destination
async function fetchAttractions(cityName: string) {
  try {
    const attractions = await searchCityAttractions(cityName, 10);
    return attractions.map((attraction) => {
      const category = getPrimaryCategory(attraction.kinds);
      const basePrice = generateTourPrice(attraction.kinds, attraction.rate || "2");
      const price = applyAdminMarkup(basePrice, "tours");

      return {
        id: attraction.xid,
        name: attraction.name,
        category,
        kinds: attraction.kinds,
        description: attraction.wikipedia_extracts?.text || attraction.info?.descr || "",
        image: attraction.preview?.source || attraction.image || null,
        location: attraction.point,
        rating: attraction.rate || "2",
        basePrice,
        price: Math.round(price),
        currency: "GBP",
      };
    });
  } catch (error) {
    console.error("Attractions fetch error:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get("origin") || "LHR";
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const childAgesParam = searchParams.get("childAges");
  const childAges = childAgesParam
    ? childAgesParam.split(",").map(Number)
    : Array(children).fill(7);

  if (!destination || !departureDate || !returnDate) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, departureDate, returnDate" },
      { status: 400 }
    );
  }

  try {
    const nights = calculateNights(departureDate, returnDate);

    // Resolve destination to a city name for hotel/attraction searches
    // The destination may be an IATA code (e.g. "MLE") or a city name (e.g. "Maldives")
    const isIataCode = /^[A-Z]{3}$/.test(destination);
    const cityName = isIataCode ? (IATA_TO_CITY[destination] || destination) : destination;
    // Resolve IATA code for flight search:
    // 1. Check non-standard code mapping (CRE -> HER)
    // 2. If city name, look up IATA code from reverse map (Phuket -> HKT)
    // 3. Fall back to the raw destination
    let flightDestination: string;
    if (CODE_TO_IATA[destination]) {
      flightDestination = CODE_TO_IATA[destination];
    } else if (!isIataCode && CITY_TO_IATA[destination.toLowerCase()]) {
      flightDestination = CITY_TO_IATA[destination.toLowerCase()];
    } else {
      flightDestination = destination;
    }

    // Search region using city name
    let region = await searchRegion(cityName);

    // If city name lookup failed and we have an IATA code, try the code directly as fallback
    if (!region && isIataCode && cityName !== destination) {
      region = await searchRegion(destination);
    }

    if (!region) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        message: "Destination not found",
      });
    }

    // Search flights, hotels, and attractions in parallel
    // Use IATA code for flights, region ID for hotels, city name for attractions
    const [flights, hotels, attractions] = await Promise.all([
      searchFlights(origin, flightDestination, departureDate, returnDate, adults, children, currency, childAges),
      searchHotels(region.id, departureDate, returnDate, adults, rooms, currency),
      fetchAttractions(region.name),
    ]);

    // If no flights or hotels found, return empty
    if (flights.length === 0 || hotels.length === 0) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        message: flights.length === 0 ? "No flights available" : "No hotels available",
      });
    }

    // Get the cheapest flight
    const cheapestFlight = flights[0];
    const alternativeFlights = flights.slice(1, 5);

    // Generate theme from attractions
    const attractionDetails = attractions.length > 0
      ? await searchCityAttractions(region.name, 5).catch(() => [])
      : [];

    // Create packages by combining cheapest flight with each hotel
    const packages = hotels.slice(0, 30).map((hotel: any, index: number) => {
      // Apply admin markup to flight and hotel prices
      const flightPrice = applyAdminMarkup(cheapestFlight.price, "flights");
      const hotelPrice = applyAdminMarkup(hotel.price, "hotels");
      const baseTotal = flightPrice + hotelPrice;
      const totalPrice = applyAdminMarkup(baseTotal, "packages");
      const pricePerPerson = Math.round(totalPrice / (adults + children || 1));

      // Generate themed name
      const theme = generatePackageTheme(region.name, attractionDetails, index);
      const description = generateThemeDescription(region.name, attractionDetails);

      return {
        id: `pkg-${hotel.id}-${cheapestFlight.id.slice(-8)}`,
        name: theme.name,
        theme: theme.theme,
        tagline: theme.tagline,
        description,
        destination: region.name,
        destinationCountry: region.country,
        nights,
        days: nights + 1,
        flight: {
          id: cheapestFlight.id,
          airlineCode: cheapestFlight.airlineCode,
          airlineName: cheapestFlight.airlineName,
          airlineLogo: cheapestFlight.airlineLogo,
          price: Math.round(flightPrice),
          basePrice: cheapestFlight.price,
          stops: cheapestFlight.stops,
          outbound: cheapestFlight.outbound,
          inbound: cheapestFlight.inbound,
          segments: cheapestFlight.segments,
          returnSegments: cheapestFlight.returnSegments,
        },
        hotel: {
          id: hotel.id,
          name: hotel.name,
          starRating: hotel.starRating,
          address: hotel.address,
          mainImage: hotel.mainImage,
          images: hotel.images,
          price: Math.round(hotelPrice),
          basePrice: hotel.price,
          pricePerNight: Math.round(applyAdminMarkup(hotel.pricePerNight, "hotels")),
          roomType: hotel.roomType,
          mealPlan: hotel.mealPlan,
          freeCancellation: hotel.freeCancellation,
        },
        attractions: attractions.slice(0, 8),
        totalPrice: Math.round(totalPrice),
        pricePerPerson,
        currency,
        includes: [
          "Return flights",
          `${nights} nights accommodation`,
          hotel.mealPlan !== "Room Only" ? hotel.mealPlan : null,
          hotel.freeCancellation ? "Free cancellation" : null,
          attractions.length > 0 ? "Optional tours & activities" : null,
        ].filter(Boolean),
        alternativeFlights: alternativeFlights.map((f: any) => ({
          id: f.id,
          airlineCode: f.airlineCode,
          airlineName: f.airlineName,
          airlineLogo: f.airlineLogo,
          price: Math.round(applyAdminMarkup(f.price, "flights")),
          stops: f.stops,
          priceDifference: Math.round(applyAdminMarkup(f.price, "flights") - flightPrice),
          outbound: f.outbound,
          inbound: f.inbound,
          segments: f.segments,
          returnSegments: f.returnSegments,
        })),
      };
    });

    // Sort by total price
    packages.sort((a: any, b: any) => a.totalPrice - b.totalPrice);

    return NextResponse.json({
      status: true,
      data: packages,
      totalResults: packages.length,
      currency,
      destination: {
        id: region.id,
        name: region.name,
        country: region.country,
      },
      attractions,
      searchParams: {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        rooms,
        nights,
      },
    });
  } catch (error) {
    console.error("Package search error:", error);
    return NextResponse.json(
      { error: "Failed to search packages" },
      { status: 500 }
    );
  }
}
