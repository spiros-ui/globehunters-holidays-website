import { NextRequest, NextResponse } from "next/server";

const RATEHAWK_API = "https://api.worldota.net/api/b2b/v3";
const RATEHAWK_KEY_ID = process.env.RATEHAWK_KEY_ID;
const RATEHAWK_KEY = process.env.RATEHAWK_API_KEY;

function getAuthHeader(): string {
  const credentials = Buffer.from(`${RATEHAWK_KEY_ID}:${RATEHAWK_KEY}`).toString("base64");
  return `Basic ${credentials}`;
}

interface AutocompleteResult {
  id: string;
  name: string;
  type: "region" | "hotel";
  country?: string;
  city?: string;
  starRating?: number;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!RATEHAWK_KEY || !RATEHAWK_KEY_ID) {
    return NextResponse.json({ results: [], error: "API not configured" });
  }

  try {
    const response = await fetch(`${RATEHAWK_API}/search/multicomplete/`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        language: "en",
      }),
    });

    if (!response.ok) {
      console.error("RateHawk autocomplete failed:", response.status);
      return NextResponse.json({ results: [] });
    }

    const data = await response.json();
    const results: AutocompleteResult[] = [];

    // Add regions (cities/destinations)
    const regions = data.data?.regions || [];
    for (const region of regions.slice(0, 5)) {
      results.push({
        id: `region-${region.id}`,
        name: region.name,
        type: "region",
        country: region.country_code || region.country || "",
      });
    }

    // Add hotels
    const hotels = data.data?.hotels || [];
    for (const hotel of hotels.slice(0, 10)) {
      results.push({
        id: `hotel-${hotel.id}`,
        name: hotel.name,
        type: "hotel",
        city: hotel.region_name || "",
        country: hotel.country_code || "",
        starRating: hotel.star_rating || 0,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Autocomplete error:", error);
    return NextResponse.json({ results: [] });
  }
}
