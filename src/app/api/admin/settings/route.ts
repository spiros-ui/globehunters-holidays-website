import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, saveAdminSettings, persistMarkupToVercel, verifyPassword } from "@/lib/admin-settings";

function checkAuth(request: NextRequest): boolean {
  // Accept x-admin-password header (used by /admin/pricing page)
  const password = request.headers.get("x-admin-password");
  if (password) return verifyPassword(password);

  // Accept cookie-based auth (used by /backoffice page)
  const sessionToken = request.cookies.get("admin_session")?.value;
  const userData = request.cookies.get("admin_user")?.value;
  if (sessionToken && userData) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = getAdminSettings();
  // Don't expose password in GET response
  return NextResponse.json({
    markup: settings.markup,
  });
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate markup values are numbers between -100 and 500
    if (body.markup) {
      for (const [key, value] of Object.entries(body.markup)) {
        if (!["flights", "hotels", "tours", "packages"].includes(key)) {
          return NextResponse.json(
            { error: `Invalid category: ${key}` },
            { status: 400 }
          );
        }
        if (typeof value !== "number" || value < -100 || value > 500) {
          return NextResponse.json(
            { error: `Invalid markup value for ${key}: must be between -100 and 500` },
            { status: 400 }
          );
        }
      }
    }

    // Validate password change if provided
    if (body.password && (typeof body.password !== "string" || body.password.length < 6)) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Save to local filesystem (/tmp on Vercel)
    const updated = saveAdminSettings(body);

    // Persist markup to Vercel env var for cross-Lambda consistency
    let redeploying = false;
    if (body.markup) {
      redeploying = await persistMarkupToVercel(updated.markup);
    }

    return NextResponse.json({
      markup: updated.markup,
      message: redeploying
        ? "Settings saved. Redeploying to apply changes across all pages (~60s)."
        : "Settings updated successfully",
    });
  } catch (error) {
    console.error("Settings save error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to save settings: ${message}` },
      { status: 500 }
    );
  }
}
