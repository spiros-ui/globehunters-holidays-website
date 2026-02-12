import { NextRequest, NextResponse } from "next/server";
import { findHotelByName, getHotelContent } from "@/lib/hotelbeds";

/**
 * Resolve a hotel name to real images via HotelBeds Content API.
 *
 * GET /api/hotels/content-by-name?name=Grace+Santorini&country=GR
 * Optionally: &code=12345 (skip name search, use code directly)
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const countryCode = request.nextUrl.searchParams.get("country");
  const directCode = request.nextUrl.searchParams.get("code");

  // If a direct HotelBeds code is provided, skip name resolution
  if (directCode) {
    const code = parseInt(directCode, 10);
    if (isNaN(code)) {
      return NextResponse.json({ error: "Invalid hotel code" }, { status: 400 });
    }

    const contentMap = await getHotelContent([code]);
    const content = contentMap.get(code);

    if (!content || content.images.length === 0) {
      return NextResponse.json({ error: "Hotel content not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const images = content.images;
    const imagesLarge = images.map(img => img.replace("/giata/", "/giata/bigger/"));

    return NextResponse.json({
      status: true,
      data: {
        hotelBedsCode: code,
        name: content.name || name || "Hotel",
        images,
        images_large: imagesLarge,
        description: content.description || "",
        address: content.address || "",
        city: content.city || "",
        facilities: content.facilities || [],
      },
    });
  }

  // Name-based resolution
  if (!name || !countryCode) {
    return NextResponse.json(
      { error: "Missing required params: name and country (or code)" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Find hotel by name in the country
    const match = await findHotelByName(name, countryCode);

    if (!match) {
      return NextResponse.json(
        { error: "Hotel not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Step 2: Fetch content (images, description, facilities)
    const contentMap = await getHotelContent([match.code]);
    const content = contentMap.get(match.code);

    if (!content || content.images.length === 0) {
      return NextResponse.json(
        { error: "Hotel content not available", code: "NO_CONTENT" },
        { status: 404 }
      );
    }

    const images = content.images;
    const imagesLarge = images.map(img => img.replace("/giata/", "/giata/bigger/"));

    return NextResponse.json({
      status: true,
      data: {
        hotelBedsCode: match.code,
        matchedName: match.name,
        name: content.name || match.name,
        images,
        images_large: imagesLarge,
        description: content.description || "",
        address: content.address || "",
        city: content.city || "",
        facilities: content.facilities || [],
      },
    });
  } catch (error) {
    console.error("Hotel content-by-name error:", error);
    return NextResponse.json(
      { error: "Failed to resolve hotel", code: "RESOLVE_FAILED" },
      { status: 500 }
    );
  }
}
