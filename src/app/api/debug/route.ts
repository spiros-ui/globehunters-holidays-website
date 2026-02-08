import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    duffel: !!process.env.DUFFEL_ACCESS_TOKEN,
    ratehawkKeyId: !!process.env.RATEHAWK_KEY_ID,
    ratehawkKey: !!process.env.RATEHAWK_API_KEY,
    ratehawkKeyIdValue: process.env.RATEHAWK_KEY_ID ? process.env.RATEHAWK_KEY_ID.substring(0, 4) + "..." : "not set",
    hotelbedsApiKey: !!process.env.HOTELBEDS_API_KEY,
    hotelbedsSecret: !!process.env.HOTELBEDS_SECRET,
    hotelbedsApiKeyValue: process.env.HOTELBEDS_API_KEY ? process.env.HOTELBEDS_API_KEY.substring(0, 4) + "..." : "not set",
    hotelbedsSecretLength: process.env.HOTELBEDS_SECRET?.length || 0,
  });
}
