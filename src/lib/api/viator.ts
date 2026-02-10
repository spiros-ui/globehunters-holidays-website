/**
 * Viator Activities API Adapter
 * Documentation: https://docs.viator.com/partner-api/
 *
 * Viator Partner API provides access to tours, activities and experiences.
 * This adapter uses the /products/search endpoint to find activities by destination.
 */

import type { ActivityOffer, ActivityImage, Currency } from "@/types";

const VIATOR_API_URL = process.env.VIATOR_API_URL || "https://api.viator.com/partner";
const VIATOR_API_KEY = process.env.VIATOR_API_KEY;

// Viator destination IDs for common airports and city names
// These IDs are used with the /products/search endpoint
const VIATOR_DESTINATIONS: Record<string, number> = {
  // Europe
  CDG: 479, PAR: 479, PARIS: 479,
  LON: 737, LHR: 737, LGW: 737, STN: 737, LONDON: 737,
  FCO: 511, ROM: 511, ROME: 511,
  BCN: 562, BARCELONA: 562,
  AMS: 1044, AMSTERDAM: 1044,
  ATH: 496, ATHENS: 496,
  LIS: 538, LISBON: 538,
  PRG: 530, PRAGUE: 530,
  VIE: 909, VIENNA: 909,
  VCE: 534, VENICE: 534,
  MXP: 512, MIL: 512, MILAN: 512,
  MAD: 566, MADRID: 566,
  BER: 486, BERLIN: 486,
  MUC: 490, MUNICH: 490,
  ZRH: 918, ZURICH: 918,
  GVA: 919, GENEVA: 919,
  CPH: 553, COPENHAGEN: 553,
  OSL: 556, OSLO: 556,
  ARN: 570, STOCKHOLM: 570,
  HEL: 549, HELSINKI: 549,
  DUB: 547, DUBLIN: 547,
  EDI: 548, EDINBURGH: 548,
  BUD: 529, BUDAPEST: 529,
  WAW: 546, WARSAW: 546,
  IST: 585, ISTANBUL: 585,
  // Greece Islands
  JTR: 4959, SANTORINI: 4959,
  JMK: 4934, MYKONOS: 4934,
  HER: 4920, CHQ: 4920, CRETE: 4920,
  RHO: 4943, RHODES: 4943,
  CFU: 4907, CORFU: 4907,
  // Middle East
  DXB: 828, DUBAI: 828,
  AUH: 830, "ABU DHABI": 830,
  DOH: 826, DOHA: 826,
  TLV: 723, "TEL AVIV": 723,
  AMM: 725, JORDAN: 725, AMMAN: 725,
  // Asia
  BKK: 343, BANGKOK: 343,
  SIN: 25, SINGAPORE: 25,
  HKG: 35, "HONG KONG": 35,
  TYO: 334, NRT: 334, HND: 334, TOKYO: 334,
  KIX: 332, OSAKA: 332,
  ICN: 973, SEOUL: 973,
  PEK: 307, BEIJING: 307,
  PVG: 309, SHA: 309, SHANGHAI: 309,
  KUL: 366, "KUALA LUMPUR": 366,
  HKT: 349, PHUKET: 349,
  CNX: 356, "CHIANG MAI": 356,
  HAN: 383, HANOI: 383,
  SGN: 386, "HO CHI MINH": 386,
  REP: 4086, "SIEM REAP": 4086,
  // Indonesia
  DPS: 755, BALI: 755,
  CGK: 4099, JAKARTA: 4099,
  // Indian Ocean
  MLE: 923, MALDIVES: 923,
  MRU: 922, MAURITIUS: 922,
  SEZ: 924, SEYCHELLES: 924,
  CMB: 855, "SRI LANKA": 855, COLOMBO: 855,
  // India
  DEL: 804, DELHI: 804, "NEW DELHI": 804,
  BOM: 805, MUMBAI: 805,
  GOI: 806, GOA: 806,
  JAI: 807, JAIPUR: 807,
  AGR: 808, AGRA: 808,
  // Oceania
  SYD: 357, SYDNEY: 357,
  MEL: 362, MELBOURNE: 362,
  BNE: 363, BRISBANE: 363,
  CNS: 364, CAIRNS: 364,
  PER: 365, PERTH: 365,
  AKL: 402, AUCKLAND: 402,
  ZQN: 403, QUEENSTOWN: 403,
  // Americas - North
  NYC: 687, JFK: 687, EWR: 687, "NEW YORK": 687,
  LAX: 731, "LOS ANGELES": 731,
  SFO: 651, "SAN FRANCISCO": 651,
  LAS: 684, "LAS VEGAS": 684,
  MIA: 662, MIAMI: 662,
  ORL: 672, MCO: 672, ORLANDO: 672,
  CHI: 669, ORD: 669, CHICAGO: 669,
  BOS: 679, BOSTON: 679,
  SEA: 653, SEATTLE: 653,
  DEN: 660, DENVER: 660,
  PHX: 663, PHOENIX: 663,
  SAN: 680, "SAN DIEGO": 680,
  HNL: 693, HAWAII: 693, HONOLULU: 693,
  YVR: 616, VANCOUVER: 616,
  YYZ: 618, TORONTO: 618,
  // Americas - Caribbean & Central
  CUN: 631, CANCUN: 631,
  SJU: 727, "PUERTO RICO": 727,
  NAS: 728, BAHAMAS: 728,
  PUJ: 5549, "PUNTA CANA": 5549,
  MBJ: 730, JAMAICA: 730,
  // Americas - South
  GRU: 757, GIG: 758, "SAO PAULO": 757, "RIO DE JANEIRO": 758, RIO: 758,
  BOG: 761, BOGOTA: 761,
  LIM: 762, LIMA: 762,
  SCL: 763, SANTIAGO: 763,
  EZE: 759, "BUENOS AIRES": 759,
  CUZ: 5586, CUSCO: 5586, "MACHU PICCHU": 5586,
  // Africa
  CPT: 910, "CAPE TOWN": 910,
  JNB: 911, JOHANNESBURG: 911,
  NBO: 912, NAIROBI: 912,
  ZNZ: 913, ZANZIBAR: 913,
  CMN: 914, MARRAKECH: 914, RAK: 914,
  CAI: 720, CAIRO: 720,
  LXR: 721, LUXOR: 721,
  // Portugal
  FAO: 541, FARO: 541, ALGARVE: 541,
  FNC: 542, MADEIRA: 542,
  // Spain
  PMI: 567, MALLORCA: 567,
  IBZ: 568, IBIZA: 568,
  TFS: 569, TFN: 569, TENERIFE: 569,
  AGP: 4482, MALAGA: 4482, "COSTA DEL SOL": 4482,
  // Turkey
  AYT: 588, ANTALYA: 588,
  DLM: 589, DALAMAN: 589,
  BJV: 590, BODRUM: 590,
  // Cyprus
  LCA: 591, PFO: 591, CYPRUS: 591, PAPHOS: 591,
};

interface ViatorSearchParams {
  destination: string; // Airport code
  startDate: string;
  endDate: string;
  currency?: Currency;
  limit?: number;
}

interface ViatorProduct {
  productCode: string;
  title: string;
  description: string;
  shortDescription?: string;
  thumbnailURL?: string;
  thumbnailHiResURL?: string;
  images?: Array<{
    imageURL: string;
    caption?: string;
  }>;
  duration?: string;
  durationRange?: {
    min?: number;
    max?: number;
  };
  price: {
    currencyCode: string;
    amount: number;
    priceFormatted: string;
  };
  rating?: number;
  reviewCount?: number;
  categories?: Array<{
    id: number;
    name: string;
  }>;
  tags?: string[];
  inclusions?: string[];
  exclusions?: string[];
  meetingPoint?: string;
  webURL?: string;
}

interface ViatorResponse {
  products: ViatorProduct[];
  totalCount: number;
}

async function viatorRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  if (!VIATOR_API_KEY) {
    throw new Error("VIATOR_API_KEY is not configured");
  }

  const url = `${VIATOR_API_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "exp-api-key": VIATOR_API_KEY,
      "Accept-Language": "en-US",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Viator API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

function normalizeImages(product: ViatorProduct): ActivityImage[] {
  const images: ActivityImage[] = [];

  if (product.thumbnailHiResURL) {
    images.push({
      url: product.thumbnailHiResURL,
      caption: product.title,
    });
  } else if (product.thumbnailURL) {
    images.push({
      url: product.thumbnailURL,
      caption: product.title,
    });
  }

  if (product.images) {
    product.images.forEach((img) => {
      images.push({
        url: img.imageURL,
        caption: img.caption,
      });
    });
  }

  // Fallback image if none provided
  if (images.length === 0) {
    images.push({
      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
      caption: product.title,
    });
  }

  return images;
}

function normalizeDuration(product: ViatorProduct): string {
  if (product.duration) {
    return product.duration;
  }

  if (product.durationRange) {
    const min = product.durationRange.min || 0;
    const max = product.durationRange.max || 0;

    if (min === max) {
      return `${min} hours`;
    }

    return `${min}-${max} hours`;
  }

  return "Varies";
}

function normalizeActivity(product: ViatorProduct, currency: Currency): ActivityOffer {
  return {
    id: product.productCode,
    provider: "viator",
    providerProductCode: product.productCode,
    title: product.title,
    description: product.description,
    shortDescription: product.shortDescription,
    images: normalizeImages(product),
    duration: normalizeDuration(product),
    price: {
      amount: product.price.amount,
      currency,
    },
    pricePerPerson: {
      amount: product.price.amount,
      currency,
    },
    rating: product.rating,
    reviewCount: product.reviewCount,
    categories: product.categories?.map((c) => c.name) || [],
    tags: product.tags || [],
    includes: product.inclusions || [],
    excludes: product.exclusions || [],
    meetingPoint: product.meetingPoint,
    bookingUrl: product.webURL,
  };
}

/**
 * Look up Viator destination ID from airport code or city name
 */
function lookupDestinationId(destination: string): number | null {
  const normalized = destination.toUpperCase().trim();

  // Direct lookup
  if (VIATOR_DESTINATIONS[normalized]) {
    return VIATOR_DESTINATIONS[normalized];
  }

  // Try partial match for city names
  for (const [key, id] of Object.entries(VIATOR_DESTINATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return id;
    }
  }

  return null;
}

export async function searchActivities(params: ViatorSearchParams): Promise<ActivityOffer[]> {
  const destId = lookupDestinationId(params.destination);

  if (!destId) {
    console.warn(`No Viator destination ID found for: ${params.destination}`);
    return [];
  }

  const currency = params.currency || "GBP";

  const response = await viatorRequest<ViatorResponse>(
    "/products/search",
    "POST",
    {
      destId,
      startDate: params.startDate,
      endDate: params.endDate,
      topX: params.limit ? `1-${params.limit}` : "1-10",
      currencyCode: currency,
      sortOrder: "REVIEW_AVG_RATING_D",
    }
  );

  if (!response.products) {
    return [];
  }

  return response.products.map((product) => normalizeActivity(product, currency));
}

export async function getActivity(productCode: string): Promise<ActivityOffer | null> {
  try {
    const response = await viatorRequest<ViatorProduct>(
      `/product/${productCode}`
    );

    return normalizeActivity(response, "GBP");
  } catch (error) {
    console.error("Error fetching activity:", error);
    return null;
  }
}

// Returns empty array - no mock/fake data
export function getMockActivities(_params: ViatorSearchParams): ActivityOffer[] {
  return [];
}

/**
 * Get top-rated activities for a destination (for package display)
 */
export async function getTopActivitiesForDestination(
  destination: string,
  currency: Currency = "GBP",
  limit: number = 8
): Promise<ActivityOffer[]> {
  const destId = lookupDestinationId(destination);

  if (!destId) {
    console.warn(`No Viator destination ID found for: ${destination}`);
    return [];
  }

  try {
    const response = await viatorRequest<ViatorResponse>(
      "/products/search",
      "POST",
      {
        destId,
        topX: `1-${limit}`,
        currencyCode: currency,
        sortOrder: "REVIEW_AVG_RATING_D", // Sort by rating descending
      }
    );

    if (!response.products) {
      return [];
    }

    return response.products.map((product) => normalizeActivity(product, currency));
  } catch (error) {
    console.error("Error fetching top activities:", error);
    return [];
  }
}

/**
 * Check if Viator API is configured and available
 */
export function isViatorAvailable(): boolean {
  return !!VIATOR_API_KEY;
}

/**
 * Get the destination ID for a given location (for debugging)
 */
export function getDestinationId(destination: string): number | null {
  return lookupDestinationId(destination);
}
