const API_BASE = "https://api.opentripmap.com/0.1";
const API_KEY = process.env.OPENTRIPMAP_API_KEY || "";

export interface GeonameResult {
  name: string;
  country: string;
  lon: number;
  lat: number;
  timezone: string;
  population: number;
}

export interface AttractionBasic {
  xid: string;
  name: string;
  kinds: string;
  dist?: number;
  rate?: number;
  point: { lon: number; lat: number };
}

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

/**
 * Get geographic coordinates for a city name
 */
export async function getGeoname(cityName: string): Promise<GeonameResult | null> {
  if (!API_KEY) return null;

  try {
    const url = `${API_BASE}/en/places/geoname?name=${encodeURIComponent(cityName)}&apikey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.lat || !data.lon) return null;
    return data;
  } catch (error) {
    console.error("OpenTripMap geoname error:", error);
    return null;
  }
}

/**
 * Get attractions near a point within a radius
 */
export async function getAttractionsNearby(
  lat: number,
  lon: number,
  radius: number = 10000,
  limit: number = 20
): Promise<AttractionBasic[]> {
  if (!API_KEY) return [];

  try {
    const url = `${API_BASE}/en/places/radius?lat=${lat}&lon=${lon}&radius=${radius}&kinds=interesting_places,cultural,historic,architecture,natural,religion,amusements&rate=2&format=json&limit=${limit}&apikey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    // Filter out unnamed attractions
    return (data || []).filter((a: AttractionBasic) => a.name && a.name.trim() !== "");
  } catch (error) {
    console.error("OpenTripMap radius search error:", error);
    return [];
  }
}

/**
 * Get detailed info about a specific attraction
 */
export async function getAttractionDetails(xid: string): Promise<AttractionDetail | null> {
  if (!API_KEY) return null;

  try {
    const url = `${API_BASE}/en/places/xid/${xid}?apikey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error("OpenTripMap detail error:", error);
    return null;
  }
}

/**
 * Search attractions for a city - combines geoname + radius search + details
 * Returns top attractions with full details
 */
export async function searchCityAttractions(
  cityName: string,
  limit: number = 10
): Promise<AttractionDetail[]> {
  // Step 1: Get city coordinates
  const geo = await getGeoname(cityName);
  if (!geo) return [];

  // Step 2: Get nearby attractions
  const attractions = await getAttractionsNearby(geo.lat, geo.lon, 15000, limit * 2);
  if (attractions.length === 0) return [];

  // Step 3: Get details for top attractions (in parallel, batched)
  const topAttractions = attractions.slice(0, limit);
  const details = await Promise.all(
    topAttractions.map((a) => getAttractionDetails(a.xid))
  );

  return details.filter((d): d is AttractionDetail => d !== null && !!d.name);
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
    museums: "Museums",
    theatres_and_entertainments: "Theatre & Entertainment",
    urban_environment: "City Landmarks",
  };

  const kindList = kinds.split(",");
  for (const kind of kindList) {
    const trimmed = kind.trim();
    if (categories[trimmed]) return categories[trimmed];
  }

  // Try partial match
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

  // Base price depends on category
  let basePrice = 25;
  if (kinds.includes("museum")) basePrice = 20;
  if (kinds.includes("amusement")) basePrice = 45;
  if (kinds.includes("natural")) basePrice = 35;
  if (kinds.includes("historic") || kinds.includes("cultural")) basePrice = 30;
  if (kinds.includes("theatre")) basePrice = 50;
  if (kinds.includes("sport")) basePrice = 40;

  // Adjust by rating (higher rated = higher price)
  const multiplier = 0.8 + rateNum * 0.2;

  return Math.round(basePrice * multiplier);
}
