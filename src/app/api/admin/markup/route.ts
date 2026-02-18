import { NextResponse } from "next/server";
import { getAdminSettings } from "@/lib/admin-settings";

// Public read-only endpoint — returns markup percentages for client-side pricing
export async function GET() {
  const settings = getAdminSettings();
  return NextResponse.json({ markup: settings.markup });
}
