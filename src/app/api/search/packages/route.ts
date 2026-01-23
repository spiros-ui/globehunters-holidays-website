import { NextRequest, NextResponse } from "next/server";
import { searchPackages, type GHPackage } from "@/lib/api/globehunters";
import type { Currency } from "@/types";

// Package result type for the frontend
interface PackageResult {
  id: string;
  title: string;
  icon: string;
  themeActivity: string;
  destination: string;
  nights: number;
  days: number;
  flight: {
    id: string;
    airlineCode: string;
    airlineName: string;
    totalFare: number;
    stops: number;
    cabinType: string;
    refundable: boolean;
  };
  hotel: {
    id: string;
    name: string;
    starRating: number;
    reviewScore: number;
    reviewScoreWord: string;
    thumbnail: string;
    images: string[];
    address: string;
    cityName: string;
    pricePerNight: number;
    boardType: string;
    refundable: boolean;
  };
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
  alternativeFlights: {
    id: string;
    airlineCode: string;
    airlineName: string;
    totalFare: number;
    stops: number;
  }[];
}

function transformPackage(pkg: GHPackage): PackageResult {
  return {
    id: pkg.package_id,
    title: pkg.package_title,
    icon: pkg.package_icon,
    themeActivity: pkg.theme_activity,
    destination: pkg.destination,
    nights: pkg.nights,
    days: pkg.nights + 1,
    flight: {
      id: pkg.flight.Result_id,
      airlineCode: pkg.flight.airline_code,
      airlineName: pkg.flight.airline_name,
      totalFare: pkg.flight.total_fare,
      stops: pkg.flight.stops,
      cabinType: pkg.flight.cabin_type,
      refundable: pkg.flight.refundable,
    },
    hotel: {
      id: pkg.hotel.hotel_id,
      name: pkg.hotel.hotel_name || pkg.hotel.name,
      starRating: pkg.hotel.star_rating,
      reviewScore: pkg.hotel.review_score,
      reviewScoreWord: pkg.hotel.review_score_word,
      thumbnail: pkg.hotel.thumbnail,
      images: pkg.hotel.images || [pkg.hotel.thumbnail],
      address: pkg.hotel.address,
      cityName: pkg.hotel.city_name,
      pricePerNight: pkg.hotel.price_per_night,
      boardType: pkg.hotel.board_type,
      refundable: pkg.hotel.refundable,
    },
    totalPrice: pkg.total_price,
    pricePerPerson: pkg.price_per_person,
    currency: pkg.currency,
    includes: pkg.includes,
    alternativeFlights: (pkg.alternative_flights || []).map((f) => ({
      id: f.Result_id,
      airlineCode: f.airline_code,
      airlineName: f.airline_name,
      totalFare: f.total_fare,
      stops: f.stops,
    })),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const origin = searchParams.get("origin") || "LON";

  if (!destination || !departureDate || !returnDate) {
    return NextResponse.json(
      { error: "Missing required parameters: destination, departureDate, returnDate" },
      { status: 400 }
    );
  }

  try {
    // Call the Globehunters API
    const response = await searchPackages({
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      rooms,
      currency,
    });

    if (!response.status || !response.packages) {
      return NextResponse.json(
        { error: "No packages found" },
        { status: 404 }
      );
    }

    // Transform the packages to our frontend format
    const packages = response.packages.map(transformPackage);

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
          children,
          rooms,
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
