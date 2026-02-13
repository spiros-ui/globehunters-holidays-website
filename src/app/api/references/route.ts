import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const REFERENCES_FILE = join(DATA_DIR, "references.json");

interface RefEntry {
  url: string;
  createdAt: number;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Read all references from file
function readReferences(): Record<string, RefEntry> {
  ensureDataDir();
  if (!existsSync(REFERENCES_FILE)) {
    return {};
  }
  try {
    const data = readFileSync(REFERENCES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Write references to file
function writeReferences(refs: Record<string, RefEntry>) {
  ensureDataDir();
  writeFileSync(REFERENCES_FILE, JSON.stringify(refs, null, 2));
}

// Clean old mappings (older than 24 hours) and cap at 1000
function cleanOldMappings(refs: Record<string, RefEntry>): Record<string, RefEntry> {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const cleaned: Record<string, RefEntry> = {};
  for (const [ref, data] of Object.entries(refs)) {
    if (now - data.createdAt <= maxAge) {
      cleaned[ref] = data;
    }
  }
  return cleaned;
}

// POST - Store a reference mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, url } = body;

    if (!reference || !url) {
      return NextResponse.json({ error: "Missing reference or url" }, { status: 400 });
    }

    let refs = readReferences();

    // Clean old mappings periodically
    if (Object.keys(refs).length > 1000) {
      refs = cleanOldMappings(refs);
    }

    // Store the mapping
    refs[reference.toUpperCase()] = {
      url,
      createdAt: Date.now(),
    };

    writeReferences(refs);

    return NextResponse.json({ success: true, reference });
  } catch (error) {
    console.error("Reference store error:", error);
    return NextResponse.json({ error: "Failed to store reference" }, { status: 500 });
  }
}

// GET - Retrieve URL by reference
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const refs = readReferences();
  const mapping = refs[ref.toUpperCase()];

  if (!mapping) {
    return NextResponse.json({
      error: "Reference not found. The customer may need to refresh their page to register the reference.",
      found: false
    }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    url: mapping.url,
    createdAt: new Date(mapping.createdAt).toISOString(),
  });
}
