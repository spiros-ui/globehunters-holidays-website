import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    duffel: !!process.env.DUFFEL_ACCESS_TOKEN,
    ratehawkKeyId: !!process.env.RATEHAWK_KEY_ID,
    ratehawkKey: !!process.env.RATEHAWK_API_KEY,
    ratehawkKeyIdValue: process.env.RATEHAWK_KEY_ID ? process.env.RATEHAWK_KEY_ID.substring(0, 4) + "..." : "not set",
  });
}
