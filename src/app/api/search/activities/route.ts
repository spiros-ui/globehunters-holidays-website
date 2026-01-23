import { NextRequest, NextResponse } from "next/server";
import { searchActivities, getMockActivities } from "@/lib/api/viator";
import { applyMarkup } from "@/lib/pricing/engine";
import type { Currency } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  if (!destination) {
    return NextResponse.json(
      { error: "Missing required parameter: destination" },
      { status: 400 }
    );
  }

  try {
    let activities;

    // Use real API if credentials are configured, otherwise use mock data
    if (process.env.VIATOR_API_KEY) {
      activities = await searchActivities({
        destination,
        startDate: startDate || "",
        endDate: endDate || "",
        currency,
      });
    } else {
      // Use mock data for development
      activities = getMockActivities({
        destination,
        startDate: startDate || "",
        endDate: endDate || "",
        currency,
      });
    }

    // Apply pricing rules (markup)
    const pricedActivities = activities.map((activity) => {
      const pricedAmount = applyMarkup(activity.price.amount, "activity", currency);
      return {
        ...activity,
        price: {
          ...activity.price,
          amount: pricedAmount,
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
        },
      },
    });
  } catch (error) {
    console.error("Activity search error:", error);
    return NextResponse.json(
      { error: "Failed to search activities" },
      { status: 500 }
    );
  }
}
