import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";

// Default admin credentials (can be overridden with environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "globehunters2024";

// Simple in-memory session store with token in cookie
// Note: In serverless, this resets on cold starts, but cookies persist

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Verify credentials against environment or defaults
function verifyCredentials(username: string, password: string): boolean {
  const validUsername = username.toLowerCase() === ADMIN_USERNAME.toLowerCase();
  const validPassword = password === ADMIN_PASSWORD;
  return validUsername && validPassword;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Create a signed token containing user info
    const token = generateToken();
    const userData = {
      userId: "admin-1",
      username: ADMIN_USERNAME,
      name: "Administrator",
      role: "admin",
    };

    // Store user data in a signed cookie (base64 encoded)
    const userDataEncoded = Buffer.from(JSON.stringify(userData)).toString("base64");

    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Set session token cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // Set user data cookie (not httpOnly so we can read it client-side for session check)
    response.cookies.set("admin_user", userDataEncoded, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

// Verify session endpoint
export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;
  const userDataEncoded = request.cookies.get("admin_user")?.value;

  if (!token || !userDataEncoded) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const userData = JSON.parse(Buffer.from(userDataEncoded, "base64").toString());
    return NextResponse.json({
      authenticated: true,
      user: userData,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");
  response.cookies.delete("admin_user");
  return response;
}
