/**
 * Viator Activities API Adapter
 * Documentation: https://docs.viator.com/partner-api/
 */

import type { ActivityOffer, ActivityImage, Money, Currency } from "@/types";

const VIATOR_API_URL = process.env.VIATOR_API_URL || "https://api.viator.com/partner";
const VIATOR_API_KEY = process.env.VIATOR_API_KEY;

// Viator destination IDs for common airports
const VIATOR_DESTINATIONS: Record<string, number> = {
  CDG: 479, // Paris
  PAR: 479, // Paris
  LON: 737, // London
  LHR: 737, // London
  DXB: 828, // Dubai
  MLE: 923, // Maldives
  DPS: 755, // Bali
  BKK: 343, // Bangkok
  SYD: 357, // Sydney
  FCO: 511, // Rome
  BCN: 562, // Barcelona
  NYC: 687, // New York
  JFK: 687, // New York
  LAX: 731, // Los Angeles
  TYO: 334, // Tokyo
  NRT: 334, // Tokyo
  SIN: 25, // Singapore
  HKG: 35, // Hong Kong
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

export async function searchActivities(params: ViatorSearchParams): Promise<ActivityOffer[]> {
  const destId = VIATOR_DESTINATIONS[params.destination.toUpperCase()];

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
