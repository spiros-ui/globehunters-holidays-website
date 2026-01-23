import { NextRequest, NextResponse } from "next/server";
import { getMockFlightOffers } from "@/lib/api/duffel";
import { getMockHotelOffers } from "@/lib/api/amadeus";
import { getMockActivities } from "@/lib/api/viator";
import { applyMarkup } from "@/lib/pricing/engine";
import type { Currency, FlightOffer, HotelOffer, ActivityOffer, HotelImage } from "@/types";

// API response package type (simplified for search results)
interface SearchPackageResult {
  id: string;
  name: string;
  description: string;
  destination: string;
  duration: { nights: number; days: number };
  flight?: FlightOffer;
  hotel: HotelOffer;
  activities: ActivityOffer[];
  totalPrice: { amount: number; currency: Currency };
  pricePerPerson: { amount: number; currency: Currency };
  includes: string[];
  images: HotelImage[];
  highlights: string[];
  terms: string;
}

// Package composition logic - combines flights, hotels, and activities
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const origin = searchParams.get("origin") || "LON";

  if (!destination || !departureDate || !returnDate) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, departureDate, returnDate" },
      { status: 400 }
    );
  }

  try {
    // Fetch all components in parallel
    const [flights, hotels, activities] = await Promise.all([
      getMockFlightOffers({
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children: 0,
        cabinClass: "economy",
        currency,
      }),
      getMockHotelOffers({
        destination,
        checkIn: departureDate,
        checkOut: returnDate,
        adults,
        rooms: 1,
        currency,
      }),
      getMockActivities({
        destination,
        startDate: departureDate,
        endDate: returnDate,
        currency,
      }),
    ]);

    // Compose packages from components
    const packages: SearchPackageResult[] = [];

    // Create package combinations
    for (const hotel of hotels) {
      // Find best flight for this destination
      const flight = flights[0]; // Use cheapest flight

      // Pick 1-2 activities
      const selectedActivities = activities.slice(0, 2);

      // Calculate total price
      const flightPrice = flight?.totalPrice.amount || 0;
      const hotelPrice = hotel.lowestPrice.amount;
      const activitiesPrice = selectedActivities.reduce(
        (sum, a) => sum + a.price.amount * adults,
        0
      );

      const basePrice = flightPrice + hotelPrice + activitiesPrice;

      // Apply package markup (usually slightly discounted vs booking separately)
      const packagePrice = applyMarkup(basePrice, "package", currency) * 0.95; // 5% package discount

      // Calculate nights
      const checkIn = new Date(departureDate);
      const checkOut = new Date(returnDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      const pkg: SearchPackageResult = {
        id: `pkg-${hotel.id}`,
        name: `${destination} Holiday Package`,
        description: `Experience the best of ${destination} with this all-inclusive package featuring quality accommodation, return flights, and exciting activities.`,
        destination,
        duration: {
          nights,
          days: nights + 1,
        },
        flight: flight || undefined,
        hotel,
        activities: selectedActivities,
        totalPrice: {
          amount: packagePrice,
          currency,
        },
        pricePerPerson: {
          amount: packagePrice / adults,
          currency,
        },
        includes: [
          "Return flights",
          `${nights} nights accommodation`,
          ...(selectedActivities.length > 0 ? ["Selected activities"] : []),
          "All taxes and fees",
        ],
        images: hotel.images,
        highlights: [
          `${hotel.starRating}-star accommodation`,
          flight ? `Direct flights with ${flight.outbound?.segments[0]?.airline?.name || "major airline"}` : "Flexible flight options",
          "24/7 customer support",
        ],
        terms: "Package subject to availability. Prices may vary based on travel dates.",
      };

      packages.push(pkg);
    }

    // Sort by price
    packages.sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);

    return NextResponse.json({
      data: packages,
      meta: {
        total: packages.length,
        currency,
        searchParams: {
          destination,
          departureDate,
          returnDate,
          adults,
          origin,
        },
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
