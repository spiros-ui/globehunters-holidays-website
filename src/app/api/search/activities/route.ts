import { NextRequest, NextResponse } from "next/server";
import { searchActivities, getTopActivitiesForDestination, isKlookAvailable, KLOOK_BOOKING_PHONE } from "@/lib/api/klook";
import { applyMarkup } from "@/lib/pricing/engine";
import type { Currency } from "@/types";

/**
 * Activities API - Fetches tours and experiences from Klook
 *
 * Query Parameters:
 * - destination: Airport code or city name (required)
 * - startDate: Start date for availability (optional)
 * - endDate: End date for availability (optional)
 * - adults: Number of adults (optional, default 2)
 * - currency: Currency code (optional, default GBP)
 * - limit: Maximum number of results (optional, default 10)
 * - mode: "search" for date-specific search, "top" for top-rated (optional, default "search")
 *
 * Note: Users should call to book activities, not book online
 * Phone: 020 8944 4555
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const limit = parseInt(searchParams.get("limit") || "10");
  const mode = searchParams.get("mode") || "search";

  if (!destination) {
    return NextResponse.json(
      { error: "Missing required parameter: destination" },
      { status: 400 }
    );
  }

  try {
    // Check if Klook is available
    if (!isKlookAvailable()) {
      return NextResponse.json({
        data: [],
        meta: {
          total: 0,
          currency,
          searchParams: { destination, startDate, endDate, adults, limit, mode },
          message: "Activities service unavailable",
          available: false,
        },
      });
    }

    let activities;

    if (mode === "top") {
      // Get top-rated activities (no date filtering)
      activities = await getTopActivitiesForDestination(destination, currency, limit);
    } else {
      // Search with date range
      activities = await searchActivities({
        destination,
        startDate: startDate || "",
        endDate: endDate || "",
        currency,
        limit,
      });
    }

    // Apply pricing rules (markup)
    const pricedActivities = activities.map((activity) => {
      const pricedAmount = applyMarkup(activity.price.amount, "activity", currency);
      return {
        ...activity,
        price: {
          ...activity.price,
          amount: Math.round(pricedAmount),
        },
        pricePerPerson: {
          ...activity.pricePerPerson,
          amount: Math.round(pricedAmount),
        },
      };
    });

    return NextResponse.json({
      data: pricedActivities,
      meta: {
        total: pricedActivities.length,
        currency,
        searchParams: {
          destination,
          startDate,
          endDate,
          adults,
          limit,
          mode,
        },
        available: true,
        provider: "klook",
        bookingPhone: KLOOK_BOOKING_PHONE,
        bookingMessage: "Call to book: " + KLOOK_BOOKING_PHONE,
      },
    });
  } catch (error) {
    console.error("Activity search error:", error);
    return NextResponse.json(
      {
        error: "Failed to search activities",
        data: [],
        meta: {
          total: 0,
          currency,
          available: false,
        },
      },
      { status: 500 }
    );
  }
}
