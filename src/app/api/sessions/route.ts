import { NextRequest, NextResponse } from "next/server";
import { generateReferenceNumber, isValidReferenceNumber, type SessionData } from "@/lib/reference-number";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read all sessions from file
function readSessions(): Record<string, SessionData> {
  ensureDataDir();
  if (!existsSync(SESSIONS_FILE)) {
    return {};
  }
  try {
    const data = readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Write sessions to file
function writeSessions(sessions: Record<string, SessionData>) {
  ensureDataDir();
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

// Clean up old sessions (older than 7 days)
function cleanOldSessions(sessions: Record<string, SessionData>): Record<string, SessionData> {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cleaned: Record<string, SessionData> = {};
  for (const [ref, session] of Object.entries(sessions)) {
    if (new Date(session.createdAt).getTime() > sevenDaysAgo) {
      cleaned[ref] = session;
    }
  }
  return cleaned;
}

/**
 * POST /api/sessions - Create a new session with reference number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchType, searchParams, selectedItemId, selectedItemData, url } = body;

    if (!searchType || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const referenceNumber = generateReferenceNumber();
    const sessions = readSessions();

    // Clean old sessions periodically
    const cleanedSessions = cleanOldSessions(sessions);

    const sessionData: SessionData = {
      referenceNumber,
      createdAt: new Date().toISOString(),
      searchType,
      searchParams: searchParams || {},
      selectedItemId,
      selectedItemData,
      url,
    };

    cleanedSessions[referenceNumber] = sessionData;
    writeSessions(cleanedSessions);

    return NextResponse.json({ referenceNumber, session: sessionData });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

/**
 * GET /api/sessions?ref=GH-XXXXXX - Get session by reference number
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ error: "Missing reference number" }, { status: 400 });
  }

  if (!isValidReferenceNumber(ref)) {
    return NextResponse.json({ error: "Invalid reference number format" }, { status: 400 });
  }

  const sessions = readSessions();
  const session = sessions[ref.toUpperCase()];

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

/**
 * PUT /api/sessions - Update an existing session
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { referenceNumber, selectedItemId, selectedItemData, url } = body;

    if (!referenceNumber || !isValidReferenceNumber(referenceNumber)) {
      return NextResponse.json({ error: "Invalid reference number" }, { status: 400 });
    }

    const sessions = readSessions();
    const session = sessions[referenceNumber.toUpperCase()];

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update session data
    if (selectedItemId !== undefined) session.selectedItemId = selectedItemId;
    if (selectedItemData !== undefined) session.selectedItemData = selectedItemData;
    if (url !== undefined) session.url = url;

    sessions[referenceNumber.toUpperCase()] = session;
    writeSessions(sessions);

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
