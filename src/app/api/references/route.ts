import { NextRequest, NextResponse } from "next/server";

// In-memory storage for reference -> URL mappings
// Note: This resets on cold start but works for active sessions
const refMappings = new Map<string, { url: string; createdAt: number }>();

// Clean old mappings (older than 24 hours)
function cleanOldMappings() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [ref, data] of refMappings) {
    if (now - data.createdAt > maxAge) {
      refMappings.delete(ref);
    }
  }
}

// POST - Store a reference mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, url } = body;

    if (!reference || !url) {
      return NextResponse.json({ error: "Missing reference or url" }, { status: 400 });
    }

    // Clean old mappings periodically
    if (refMappings.size > 1000) {
      cleanOldMappings();
    }

    // Store the mapping
    refMappings.set(reference.toUpperCase(), {
      url,
      createdAt: Date.now(),
    });

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

  const mapping = refMappings.get(ref.toUpperCase());

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
