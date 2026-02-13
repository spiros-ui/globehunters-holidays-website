import { NextRequest, NextResponse } from "next/server";
import { getHotelContent } from "@/lib/hotelbeds";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codeParam = searchParams.get("code");

  if (!codeParam) {
    return NextResponse.json(
      { status: false, error: "Missing required parameter: code" },
      { status: 400 }
    );
  }

  const code = parseInt(codeParam, 10);
  if (isNaN(code)) {
    return NextResponse.json(
      { status: false, error: "Invalid hotel code" },
      { status: 400 }
    );
  }

  try {
    const contentMap = await getHotelContent([code]);
    const content = contentMap.get(code);

    if (!content) {
      return NextResponse.json(
        { status: false, error: "Hotel content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      data: {
        code,
        name: content.name || "",
        images: content.images,
        description: content.description,
        address: content.address,
        city: content.city,
        country: content.country,
        postalCode: content.postalCode || "",
        email: content.email || "",
        phones: content.phones || [],
        facilities: content.facilities,
        reviewScore: content.reviewScore,
        reviewCount: content.reviewCount,
      },
    });
  } catch (error: any) {
    console.error("Hotel content error:", error.message);
    return NextResponse.json(
      { status: false, error: "Failed to fetch hotel content" },
      { status: 500 }
    );
  }
}
