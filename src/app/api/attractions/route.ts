import { NextRequest, NextResponse } from "next/server";
import { searchCityAttractions, getPrimaryCategory, generateTourPrice } from "@/lib/opentripmap";
import { applyAdminMarkup } from "@/lib/admin-settings";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get("city");
  const limit = parseInt(searchParams.get("limit") || "10");

  if (!city) {
    return NextResponse.json(
      { error: "Missing required parameter: city" },
      { status: 400 }
    );
  }

  try {
    const attractions = await searchCityAttractions(city, limit);

    const formatted = attractions.map((attraction) => {
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
        wikipedia: attraction.wikipedia || null,
        url: attraction.url || null,
        location: attraction.point,
        rating: attraction.rate || "2",
        basePrice,
        price,
        currency: "GBP",
      };
    });

    return NextResponse.json({
      status: true,
      data: formatted,
      city,
      totalResults: formatted.length,
    });
  } catch (error) {
    console.error("Attractions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attractions" },
      { status: 500 }
    );
  }
}
