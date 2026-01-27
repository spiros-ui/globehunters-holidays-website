/**
 * Attractions API using free, keyless services:
 * - Nominatim (OpenStreetMap) for geocoding
 * - Overpass API (OpenStreetMap) for tourist attractions
 * - Wikipedia API for descriptions and images
 *
 * No API keys required.
 */

const USER_AGENT = "GlobeHunters/1.0 (travel website)";

export interface AttractionDetail {
  xid: string;
  name: string;
  kinds: string;
  rate: string;
  point: { lon: number; lat: number };
  image?: string;
  preview?: { source: string; width: number; height: number };
  wikipedia?: string;
  wikipedia_extracts?: { title: string; text: string; html: string };
  url?: string;
  info?: { descr?: string; image?: string; src?: string };
}

// ─── Nominatim Geocoding ───

async function geocodeCity(
  cityName: string
): Promise<{ lat: number; lon: number; name: string; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      cityName
    )}&format=json&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.length === 0) return null;

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.address?.city || result.address?.town || result.name || cityName,
      country: result.address?.country || "",
    };
  } catch (error) {
    console.error("Nominatim geocode error:", error);
    return null;
  }
}

// ─── Overpass API (OpenStreetMap) ───

interface OSMElement {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

async function getOSMAttractions(
  lat: number,
  lon: number,
  radius: number = 10000,
  limit: number = 20
): Promise<OSMElement[]> {
  try {
    // Query for tourism-tagged nodes with names
    const query = `[out:json][timeout:15];(
      node["tourism"~"attraction|museum|artwork|gallery|viewpoint"]["name"](around:${radius},${lat},${lon});
      node["historic"~"monument|memorial|castle|ruins"]["name"](around:${radius},${lat},${lon});
      node["amenity"~"theatre|arts_centre"]["name"](around:${radius},${lat},${lon});
    );out body ${limit * 2};`;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return [];

    const data = await response.json();
    const elements: OSMElement[] = data.elements || [];

    // Filter out duplicates and unnamed, keep top results
    const seen = new Set<string>();
    return elements
      .filter((el) => {
        const name = el.tags?.name;
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    console.error("Overpass API error:", error);
    return [];
  }
}

// ─── Wikipedia API ───

interface WikiPageInfo {
  title: string;
  extract: string;
  thumbnail?: string;
}

async function getWikipediaInfo(
  names: string[]
): Promise<Map<string, WikiPageInfo>> {
  const result = new Map<string, WikiPageInfo>();
  if (names.length === 0) return result;

  try {
    // Batch up to 20 titles per request
    const titles = names.slice(0, 20).join("|");
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      titles
    )}&prop=extracts|pageimages&exintro=true&explaintext=true&exlimit=20&pithumbsize=400&pilimit=20&format=json&redirects=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!response.ok) return result;

    const data = await response.json();
    const pages = data.query?.pages || {};
    const redirects = new Map<string, string>();

    // Build redirect map
    for (const r of data.query?.redirects || []) {
      redirects.set(r.to, r.from);
    }
    for (const r of data.query?.normalized || []) {
      redirects.set(r.to, r.from);
    }

    for (const [, page] of Object.entries(pages) as [string, any][]) {
      if (!page.title || page.missing !== undefined) continue;

      const info: WikiPageInfo = {
        title: page.title,
        extract: page.extract || "",
        thumbnail: page.thumbnail?.source || undefined,
      };

      // Map back to original name
      result.set(page.title, info);
      const originalName = redirects.get(page.title);
      if (originalName) {
        result.set(originalName, info);
      }
    }
  } catch (error) {
    console.error("Wikipedia API error:", error);
  }

  return result;
}

// ─── Map OSM tourism tags to categories ───

function getOSMCategory(tags: Record<string, string>): string {
  const tourism = tags.tourism || "";
  const historic = tags.historic || "";
  const amenity = tags.amenity || "";

  if (tourism === "museum") return "museum";
  if (tourism === "gallery" || tourism === "artwork") return "cultural";
  if (tourism === "viewpoint") return "natural";
  if (tourism === "attraction") {
    // Try to refine based on other tags
    if (tags.historic) return "historic";
    return "cultural";
  }
  if (historic === "monument" || historic === "memorial") return "historic";
  if (historic === "castle" || historic === "ruins") return "historic";
  if (amenity === "theatre") return "cultural";
  if (amenity === "arts_centre") return "cultural";

  return "cultural";
}

// ─── Public API (compatible interface) ───

/**
 * Search attractions for a city.
 * Uses Nominatim + Overpass API + Wikipedia. No API keys needed.
 */
export async function searchCityAttractions(
  cityName: string,
  limit: number = 10
): Promise<AttractionDetail[]> {
  // Step 1: Geocode the city
  const geo = await geocodeCity(cityName);
  if (!geo) return [];

  // Step 2: Get attractions from OpenStreetMap
  const osmAttractions = await getOSMAttractions(geo.lat, geo.lon, 15000, limit);
  if (osmAttractions.length === 0) return [];

  // Step 3: Get Wikipedia info for all attractions (batch request)
  const names = osmAttractions.map((a) => a.tags.name);
  // Also try with wikipedia tag if available
  const wikiTitles = osmAttractions
    .map((a) => {
      const wiki = a.tags.wikipedia || a.tags["wikipedia:en"] || "";
      if (wiki.startsWith("en:")) return wiki.slice(3);
      if (wiki && !wiki.includes(":")) return wiki;
      return a.tags.name;
    })
    .filter(Boolean);

  const wikiInfo = await getWikipediaInfo([...new Set(wikiTitles)]);

  // Step 4: Combine into AttractionDetail objects
  return osmAttractions.map((osm) => {
    const name = osm.tags.name;
    const wikiTitle = (() => {
      const wiki = osm.tags.wikipedia || osm.tags["wikipedia:en"] || "";
      if (wiki.startsWith("en:")) return wiki.slice(3);
      if (wiki && !wiki.includes(":")) return wiki;
      return name;
    })();

    const wiki = wikiInfo.get(wikiTitle) || wikiInfo.get(name);
    const category = getOSMCategory(osm.tags);

    return {
      xid: `osm-${osm.id}`,
      name,
      kinds: category,
      rate: "3",
      point: { lon: osm.lon, lat: osm.lat },
      image: wiki?.thumbnail || undefined,
      preview: wiki?.thumbnail
        ? { source: wiki.thumbnail, width: 400, height: 300 }
        : undefined,
      wikipedia: wikiTitle,
      wikipedia_extracts: wiki
        ? { title: wiki.title, text: wiki.extract, html: "" }
        : undefined,
      info: { descr: wiki?.extract || osm.tags.description || "" },
    };
  });
}

/**
 * Extract primary category from kinds string
 */
export function getPrimaryCategory(kinds: string): string {
  const categories: Record<string, string> = {
    cultural: "Culture & Arts",
    historic: "Historic Sites",
    architecture: "Architecture",
    natural: "Nature & Parks",
    religion: "Religious Sites",
    amusements: "Entertainment",
    foods: "Food & Dining",
    shops: "Shopping",
    sport: "Sports & Activities",
    museum: "Museums",
    museums: "Museums",
    theatres_and_entertainments: "Theatre & Entertainment",
    urban_environment: "City Landmarks",
  };

  const kindList = kinds.split(",");
  for (const kind of kindList) {
    const trimmed = kind.trim();
    if (categories[trimmed]) return categories[trimmed];
  }

  for (const [key, label] of Object.entries(categories)) {
    if (kinds.includes(key)) return label;
  }

  return "Attraction";
}

/**
 * Generate a tour price based on category and rating
 */
export function generateTourPrice(kinds: string, rate: string): number {
  const rateNum = parseInt(rate) || 2;

  let basePrice = 25;
  if (kinds.includes("museum")) basePrice = 20;
  if (kinds.includes("amusement")) basePrice = 45;
  if (kinds.includes("natural")) basePrice = 35;
  if (kinds.includes("historic") || kinds.includes("cultural")) basePrice = 30;
  if (kinds.includes("theatre")) basePrice = 50;
  if (kinds.includes("sport")) basePrice = 40;

  const multiplier = 0.8 + rateNum * 0.2;
  return Math.round(basePrice * multiplier);
}
