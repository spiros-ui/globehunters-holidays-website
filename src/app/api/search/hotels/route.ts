import { NextRequest, NextResponse } from "next/server";
import { searchHotels, getMockHotelOffers } from "@/lib/api/amadeus";
import { applyMarkup } from "@/lib/pricing/engine";
import type { Currency } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const adults = parseInt(searchParams.get("adults") || "2");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  if (!destination || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, checkIn, checkOut" },
      { status: 400 }
    );
  }

  try {
    let hotels;

    // Use real API if credentials are configured, otherwise use mock data
    if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
      hotels = await searchHotels({
        destination,
        checkIn,
        checkOut,
        adults,
        rooms,
        currency,
      });
    } else {
      // Use mock data for development
      hotels = getMockHotelOffers({
        destination,
        checkIn,
        checkOut,
        adults,
        rooms,
        currency,
      });
    }

    // Apply pricing rules (markup)
    const pricedHotels = hotels.map((hotel) => {
      const pricedAmount = applyMarkup(hotel.lowestPrice.amount, "hotel", currency);
      return {
        ...hotel,
        lowestPrice: {
          ...hotel.lowestPrice,
          amount: pricedAmount,
        },
        rooms: hotel.rooms.map((room) => ({
          ...room,
          price: {
            ...room.price,
            amount: applyMarkup(room.price.amount, "hotel", currency),
          },
          pricePerNight: {
            ...room.pricePerNight,
            amount: applyMarkup(room.pricePerNight.amount, "hotel", currency),
          },
        })),
      };
    });

    return NextResponse.json({
      data: pricedHotels,
      meta: {
        total: pricedHotels.length,
        currency,
        searchParams: {
          destination,
          checkIn,
          checkOut,
          adults,
          rooms,
        },
      },
    });
  } catch (error) {
    console.error("Hotel search error:", error);
    return NextResponse.json(
      { error: "Failed to search hotels" },
      { status: 500 }
    );
  }
}
