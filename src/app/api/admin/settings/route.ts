import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, saveAdminSettings, verifyPassword } from "@/lib/admin-settings";

function checkAuth(request: NextRequest): boolean {
  const password = request.headers.get("x-admin-password");
  if (!password) return false;
  return verifyPassword(password);
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

    const updated = saveAdminSettings(body);

    return NextResponse.json({
      markup: updated.markup,
      message: "Settings updated successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
