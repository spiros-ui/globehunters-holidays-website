import { NextRequest, NextResponse } from "next/server";
import { searchFlights, getMockFlightOffers } from "@/lib/api/duffel";
import { applyMarkup } from "@/lib/pricing/engine";
import type { Currency } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "1");
  const cabinClass = searchParams.get("cabinClass") || "economy";
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: "Missing required parameters: origin, destination, departureDate" },
      { status: 400 }
    );
  }

  try {
    let flights;

    // Use real API if credentials are configured, otherwise use mock data
    if (process.env.DUFFEL_ACCESS_TOKEN) {
      flights = await searchFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults,
        children: 0,
        cabinClass: cabinClass as "economy" | "premium_economy" | "business" | "first",
        currency,
      });
    } else {
      // Use mock data for development
      flights = getMockFlightOffers({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        adults,
        children: 0,
        cabinClass: cabinClass as "economy" | "premium_economy" | "business" | "first",
        currency,
      });
    }

    // Apply pricing rules (markup)
    const pricedFlights = flights.map((flight) => {
      const pricedAmount = applyMarkup(flight.totalPrice.amount, "flight", currency);
      return {
        ...flight,
        totalPrice: {
          ...flight.totalPrice,
          amount: pricedAmount,
        },
      };
    });

    return NextResponse.json({
      data: pricedFlights,
      meta: {
        total: pricedFlights.length,
        currency,
        searchParams: {
          origin,
          destination,
          departureDate,
          returnDate,
          adults,
          cabinClass,
        },
      },
    });
  } catch (error) {
    console.error("Flight search error:", error);
    return NextResponse.json(
      { error: "Failed to search flights" },
      { status: 500 }
    );
  }
}
