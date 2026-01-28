import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/admin-auth";
import { createHash, randomBytes } from "crypto";

// Simple session store (in production, use Redis or database)
const sessions = new Map<string, { userId: string; username: string; name: string; role: string; expiresAt: number }>();

// Generate session token
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Clean expired sessions
function cleanSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
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

    const user = verifyCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Clean old sessions
    cleanSessions();

    // Create session
    const token = generateToken();
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours

    sessions.set(token, {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    // Set secure cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
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

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  cleanSessions();
  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      userId: session.userId,
      username: session.username,
      name: session.name,
      role: session.role,
    },
  });
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;

  if (token) {
    sessions.delete(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_session");

  return response;
}

// Export for use in other routes
export function getSession(token: string) {
  cleanSessions();
  return sessions.get(token);
}
