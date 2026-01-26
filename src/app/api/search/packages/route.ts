import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "@/types";

const DUFFEL_API = "https://api.duffel.com";
const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;

const RATEHAWK_API = "https://api.worldota.net/api/b2b/v3";
const RATEHAWK_KEY = process.env.RATEHAWK_API_KEY;

// Helper functions
function getDuffelAuthHeader(): string {
  return `Bearer ${DUFFEL_TOKEN}`;
}

function getRateHawkAuthHeader(): string {
  const credentials = Buffer.from(`${RATEHAWK_KEY}:`).toString("base64");
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

function formatDate(dateTime: string): string {
  return new Date(dateTime).toISOString().split("T")[0];
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
  currency: string
) {
  if (!DUFFEL_TOKEN) return [];

  try {
    const passengers: Array<{ type: string }> = [];
    for (let i = 0; i < adults; i++) passengers.push({ type: "adult" });
    for (let i = 0; i < children; i++) passengers.push({ type: "child" });

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

    // Transform and return top 5 cheapest flights
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
          },
          inbound: inboundSlice ? {
            origin: inboundSlice?.origin?.iata_code,
            destination: inboundSlice?.destination?.iata_code,
            departureTime: formatTime(inboundSlice?.segments[0]?.departing_at),
            arrivalTime: formatTime(inboundSlice?.segments[inboundSlice.segments.length - 1]?.arriving_at),
            duration: parseDuration(inboundSlice?.duration || "PT0H"),
          } : null,
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

// Search RateHawk for hotels
async function searchHotels(
  regionId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  rooms: number,
  currency: string
) {
  if (!RATEHAWK_KEY) return [];

  try {
    const adultsPerRoom = Math.ceil(adults / rooms);
    const guests: Array<{ adults: number; children: number[] }> = [];
    for (let i = 0; i < rooms; i++) {
      guests.push({ adults: adultsPerRoom, children: [] });
    }

    const response = await fetch(`${RATEHAWK_API}/search/hp/`, {
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
        currency: currency.toLowerCase(),
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const hotels = data.data?.hotels || [];
    const nights = calculateNights(checkIn, checkOut);

    // Transform and return hotels
    return hotels
      .map((hotel: any) => {
        const rates = hotel.rates || [];
        const cheapestRate = rates[0];

        let totalPrice = 0;
        if (cheapestRate?.payment_options?.payment_types?.[0]?.amount) {
          totalPrice = parseFloat(cheapestRate.payment_options.payment_types[0].amount);
        } else if (cheapestRate?.daily_prices) {
          totalPrice = cheapestRate.daily_prices.reduce((a: number, b: number) => a + b, 0);
        }

        if (totalPrice <= 0) return null;

        const imageIds = hotel.images || [];
        const getImageUrl = (id: string | number) =>
          `https://photos.hotellook.com/image_v2/limit/${id}/800/520.auto`;

        return {
          id: String(hotel.id),
          name: hotel.name || "Hotel",
          starRating: hotel.star_rating || hotel.stars || 0,
          address: hotel.address || "",
          mainImage: imageIds[0] ? getImageUrl(imageIds[0]) : null,
          images: imageIds.slice(0, 5).map(getImageUrl),
          price: totalPrice,
          pricePerNight: nights > 0 ? Math.round(totalPrice / nights) : totalPrice,
          nights,
          roomType: cheapestRate?.room_name || "Standard Room",
          mealPlan: cheapestRate?.meal === "breakfast" ? "Breakfast Included" : "Room Only",
          freeCancellation: !!cheapestRate?.payment_options?.payment_types?.[0]?.cancellation_penalties?.free_cancellation_before,
        };
      })
      .filter((h: any) => h !== null)
      .sort((a: any, b: any) => a.price - b.price);
  } catch (error) {
    console.error("RateHawk hotel search error:", error);
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

  if (!destination || !departureDate || !returnDate) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, departureDate, returnDate" },
      { status: 400 }
    );
  }

  try {
    const nights = calculateNights(departureDate, returnDate);

    // Search region first
    const region = await searchRegion(destination);

    if (!region) {
      return NextResponse.json({
        status: true,
        data: [],
        totalResults: 0,
        message: "Destination not found",
      });
    }

    // Search flights and hotels in parallel
    const [flights, hotels] = await Promise.all([
      searchFlights(origin, destination, departureDate, returnDate, adults, children, currency),
      searchHotels(region.id, departureDate, returnDate, adults, rooms, currency),
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

    // Create packages by combining cheapest flight with each hotel
    const packages = hotels.slice(0, 30).map((hotel: any, index: number) => {
      const totalPrice = cheapestFlight.price + hotel.price;
      const pricePerPerson = Math.round(totalPrice / (adults + children || 1));

      return {
        id: `pkg-${hotel.id}-${cheapestFlight.id.slice(-8)}`,
        destination: region.name,
        destinationCountry: region.country,
        nights,
        days: nights + 1,
        flight: {
          id: cheapestFlight.id,
          airlineCode: cheapestFlight.airlineCode,
          airlineName: cheapestFlight.airlineName,
          airlineLogo: cheapestFlight.airlineLogo,
          price: cheapestFlight.price,
          stops: cheapestFlight.stops,
          outbound: cheapestFlight.outbound,
          inbound: cheapestFlight.inbound,
        },
        hotel: {
          id: hotel.id,
          name: hotel.name,
          starRating: hotel.starRating,
          address: hotel.address,
          mainImage: hotel.mainImage,
          images: hotel.images,
          price: hotel.price,
          pricePerNight: hotel.pricePerNight,
          roomType: hotel.roomType,
          mealPlan: hotel.mealPlan,
          freeCancellation: hotel.freeCancellation,
        },
        totalPrice,
        pricePerPerson,
        currency,
        includes: [
          "Return flights",
          `${nights} nights accommodation`,
          hotel.mealPlan !== "Room Only" ? hotel.mealPlan : null,
          hotel.freeCancellation ? "Free cancellation" : null,
        ].filter(Boolean),
        alternativeFlights: alternativeFlights.map((f: any) => ({
          id: f.id,
          airlineCode: f.airlineCode,
          airlineName: f.airlineName,
          price: f.price,
          stops: f.stops,
          priceDifference: f.price - cheapestFlight.price,
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
