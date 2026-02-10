/**
 * Klook Activities API Adapter
 * Fetches activities directly from Klook website via web scraping
 *
 * Affiliate Link: https://www.klook.com/?aid=api|13694|af4ba6d625384320be87e2877-701824|pid|701824&aff_pid=701824
 * Users should call to book: 020 8944 4555
 */

import type { ActivityOffer, ActivityImage, Currency } from "@/types";

// Klook affiliate parameters
const KLOOK_AFFILIATE_ID = "api|13694|af4ba6d625384320be87e2877-701824|pid|701824";
const KLOOK_AFF_PID = "701824";

const KLOOK_BASE_URL = "https://www.klook.com";

// Phone number for booking
export const KLOOK_BOOKING_PHONE = "020 8944 4555";

interface KlookSearchParams {
  destination: string;
  startDate?: string;
  endDate?: string;
  currency?: Currency;
  limit?: number;
}

interface KlookActivity {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  currency: string;
  duration: string;
  rating: number;
  reviewCount: number;
  categories: string[];
  url: string;
}

/**
 * Build Klook URL with affiliate tracking
 */
export function buildKlookAffiliateUrl(path: string): string {
  const url = new URL(path.startsWith("http") ? path : `${KLOOK_BASE_URL}${path}`);
  url.searchParams.set("aid", KLOOK_AFFILIATE_ID);
  url.searchParams.set("aff_pid", KLOOK_AFF_PID);
  return url.toString();
}

/**
 * Search URL for Klook
 */
function buildSearchUrl(query: string): string {
  return `${KLOOK_BASE_URL}/search/?query=${encodeURIComponent(query)}`;
}

/**
 * Extract activities from Klook HTML response
 * Klook uses JSON-LD and data attributes for SEO-friendly content
 */
function parseKlookHtml(html: string, currency: Currency): KlookActivity[] {
  const activities: KlookActivity[] = [];

  try {
    // Try to extract JSON-LD data first (more reliable)
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);

    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, "").trim();
          const data = JSON.parse(jsonContent);

          // Handle ItemList schema
          if (data["@type"] === "ItemList" && data.itemListElement) {
            for (const item of data.itemListElement) {
              if (item.item || item["@type"] === "Product") {
                const product = item.item || item;
                const activity: KlookActivity = {
                  id: product.productID || product.sku || `klook-${Date.now()}-${Math.random()}`,
                  title: product.name || "",
                  description: product.description || "",
                  imageUrl: product.image || "",
                  price: parseFloat(product.offers?.price || "0"),
                  currency: product.offers?.priceCurrency || currency,
                  duration: extractDuration(product.description || ""),
                  rating: parseFloat(product.aggregateRating?.ratingValue || "0"),
                  reviewCount: parseInt(product.aggregateRating?.reviewCount || "0"),
                  categories: [],
                  url: product.url || "",
                };
                if (activity.title && activity.price > 0) {
                  activities.push(activity);
                }
              }
            }
          }

          // Handle Product schema directly
          if (data["@type"] === "Product") {
            const activity: KlookActivity = {
              id: data.productID || data.sku || `klook-${Date.now()}-${Math.random()}`,
              title: data.name || "",
              description: data.description || "",
              imageUrl: data.image || "",
              price: parseFloat(data.offers?.price || "0"),
              currency: data.offers?.priceCurrency || currency,
              duration: extractDuration(data.description || ""),
              rating: parseFloat(data.aggregateRating?.ratingValue || "0"),
              reviewCount: parseInt(data.aggregateRating?.reviewCount || "0"),
              categories: [],
              url: data.url || "",
            };
            if (activity.title && activity.price > 0) {
              activities.push(activity);
            }
          }
        } catch {
          // Ignore JSON parse errors for individual script tags
        }
      }
    }

    // If JSON-LD didn't yield results, try HTML parsing
    if (activities.length === 0) {
      // Look for activity cards in various Klook HTML patterns
      const cardPatterns = [
        // Pattern 1: data-card-activity or similar
        /<div[^>]*data-activity-id="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi,
        // Pattern 2: activity card links
        /<a[^>]*href="\/activity\/(\d+)[^"]*"[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
      ];

      // Extract from meta tags and title patterns
      const titleMatches = html.match(/<h[1-6][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h[1-6]>/gi) || [];
      const priceMatches = html.match(/(?:GBP|EUR|USD|\$|\u00A3|\u20AC)\s*[\d,]+(?:\.\d{2})?/gi) || [];
      const imageMatches = html.match(/https:\/\/res\.klook\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi) || [];
      const ratingMatches = html.match(/(\d+\.?\d*)\s*(?:stars?|rating|\/\s*5)/gi) || [];

      // Build activities from extracted data
      for (let i = 0; i < Math.min(titleMatches.length, 20); i++) {
        const title = titleMatches[i]?.replace(/<[^>]+>/g, "").trim();
        if (title) {
          activities.push({
            id: `klook-${i}-${Date.now()}`,
            title,
            description: "",
            imageUrl: imageMatches[i] || "",
            price: parsePrice(priceMatches[i] || "0"),
            currency: currency,
            duration: "Varies",
            rating: parseRating(ratingMatches[i] || "0"),
            reviewCount: 0,
            categories: [],
            url: "",
          });
        }
      }
    }

    // Parse __NEXT_DATA__ if available (Next.js SSR data)
    const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch && activities.length === 0) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;

        // Look for activities in various locations of pageProps
        const activityLists = [
          pageProps?.searchResult?.activities,
          pageProps?.activities,
          pageProps?.data?.activities,
          pageProps?.initialData?.activities,
        ];

        for (const list of activityLists) {
          if (Array.isArray(list)) {
            for (const item of list) {
              const activity: KlookActivity = {
                id: String(item.id || item.activityId || `klook-${Date.now()}-${Math.random()}`),
                title: item.title || item.name || "",
                description: item.description || item.shortDescription || "",
                imageUrl: item.imageUrl || item.image || item.coverImage || "",
                price: parseFloat(item.price || item.salePrice || item.fromPrice || "0"),
                originalPrice: parseFloat(item.originalPrice || item.marketPrice || "0") || undefined,
                currency: item.currency || currency,
                duration: item.duration || extractDuration(item.description || ""),
                rating: parseFloat(item.rating || item.score || "0"),
                reviewCount: parseInt(item.reviewCount || item.reviewsCount || "0"),
                categories: item.categories || item.tags || [],
                url: item.url || (item.id ? `/activity/${item.id}` : ""),
              };
              if (activity.title) {
                activities.push(activity);
              }
            }
            break;
          }
        }
      } catch {
        // Ignore __NEXT_DATA__ parse errors
      }
    }
  } catch (error) {
    console.error("Error parsing Klook HTML:", error);
  }

  return activities;
}

/**
 * Extract duration from description text
 */
function extractDuration(text: string): string {
  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/i);
  const minMatch = text.match(/(\d+)\s*(?:minute|min|m)/i);
  const dayMatch = text.match(/(\d+)\s*(?:day|d)/i);

  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    return days === 1 ? "Full day" : `${days} days`;
  }
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1]);
    if (minMatch) {
      return `${hours}h ${minMatch[1]}m`;
    }
    return `${hours} hours`;
  }
  if (minMatch) {
    return `${minMatch[1]} minutes`;
  }
  return "Varies";
}

/**
 * Parse price from various formats
 */
function parsePrice(priceStr: string): number {
  const numericStr = priceStr.replace(/[^\d.,]/g, "").replace(",", "");
  return parseFloat(numericStr) || 0;
}

/**
 * Parse rating from various formats
 */
function parseRating(ratingStr: string): number {
  const match = ratingStr.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * Convert Klook currency to target currency (simplified)
 */
function convertCurrency(amount: number, fromCurrency: string, toCurrency: Currency): number {
  // Simplified conversion rates (in production, use real FX API)
  const rates: Record<string, Record<Currency, number>> = {
    USD: { GBP: 0.79, EUR: 0.92, USD: 1, AUD: 1.54 },
    GBP: { GBP: 1, EUR: 1.16, USD: 1.27, AUD: 1.95 },
    EUR: { GBP: 0.86, EUR: 1, USD: 1.09, AUD: 1.68 },
    AUD: { GBP: 0.51, EUR: 0.60, USD: 0.65, AUD: 1 },
  };

  const fromUpper = fromCurrency.toUpperCase();
  if (rates[fromUpper] && rates[fromUpper][toCurrency]) {
    return amount * rates[fromUpper][toCurrency];
  }
  return amount; // Return original if conversion not available
}

/**
 * Remove Klook branding from activity titles
 */
function cleanActivityTitle(title: string): string {
  // Remove variations of "Klook" from titles
  return title
    .replace(/\[?Klook\s*(?:Exclusive|Special|Deal)?\]?:?\s*/gi, "")
    .replace(/\s*-\s*Klook$/gi, "")
    .replace(/\s*\|\s*Klook$/gi, "")
    .replace(/\s*by\s+Klook$/gi, "")
    .replace(/\s*on\s+Klook$/gi, "")
    .replace(/\(Klook\)/gi, "")
    .replace(/Klook\s*/gi, "")
    .trim();
}

/**
 * Normalize Klook activity to ActivityOffer format
 */
function normalizeActivity(activity: KlookActivity, currency: Currency): ActivityOffer {
  const price = convertCurrency(activity.price, activity.currency, currency);

  const images: ActivityImage[] = [];
  if (activity.imageUrl) {
    images.push({
      url: activity.imageUrl,
      caption: cleanActivityTitle(activity.title),
    });
  }

  // Return null-like indicator if no valid image (we'll filter these out later)
  // For now, we mark activities without images by not adding a fallback
  // The ActivitiesSection will filter these out

  return {
    id: activity.id,
    provider: "klook",
    providerProductCode: activity.id,
    title: cleanActivityTitle(activity.title),
    description: activity.description,
    shortDescription: activity.description?.substring(0, 150) + (activity.description?.length > 150 ? "..." : ""),
    images,
    duration: activity.duration,
    price: {
      amount: Math.round(price),
      currency,
    },
    pricePerPerson: {
      amount: Math.round(price),
      currency,
    },
    rating: activity.rating || undefined,
    reviewCount: activity.reviewCount || undefined,
    categories: activity.categories,
    tags: [],
    includes: [],
    excludes: [],
    meetingPoint: undefined,
    // Add affiliate URL - but users should call to book
    bookingUrl: activity.url ? buildKlookAffiliateUrl(activity.url) : undefined,
  };
}

/**
 * Fetch activities from Klook for a destination
 */
export async function searchActivities(params: KlookSearchParams): Promise<ActivityOffer[]> {
  const { destination, currency = "GBP", limit = 10 } = params;

  try {
    const searchUrl = buildSearchUrl(destination);

    const response = await fetch(searchUrl, {
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.error(`Klook fetch failed: ${response.status} ${response.statusText}`);
      return getFallbackActivities(destination, currency, limit);
    }

    const html = await response.text();
    const activities = parseKlookHtml(html, currency);

    if (activities.length === 0) {
      console.warn(`No activities parsed from Klook for: ${destination}`);
      return getFallbackActivities(destination, currency, limit);
    }

    return activities
      .slice(0, limit)
      .map((a) => normalizeActivity(a, currency));
  } catch (error) {
    console.error("Error fetching from Klook:", error);
    return getFallbackActivities(destination, currency, limit);
  }
}

/**
 * Get top activities for a destination (same as search for now)
 */
export async function getTopActivitiesForDestination(
  destination: string,
  currency: Currency = "GBP",
  limit: number = 8
): Promise<ActivityOffer[]> {
  return searchActivities({ destination, currency, limit });
}

/**
 * Fallback activities when Klook fetch fails
 * These are curated popular activities for common destinations
 */
function getFallbackActivities(destination: string, currency: Currency, limit: number): ActivityOffer[] {
  const destLower = destination.toLowerCase();

  // Destination-specific fallback activities
  const fallbackData: Record<string, Array<{ title: string; desc: string; price: number; duration: string; rating: number; reviews: number; category: string; image: string }>> = {
    // EUROPE
    london: [
      { title: "Tower of London & Crown Jewels Tour", desc: "Explore 1000 years of royal history and see the dazzling Crown Jewels.", price: 45, duration: "3 hours", rating: 4.8, reviews: 15200, category: "Landmarks", image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=800&q=80" },
      { title: "British Museum Guided Tour", desc: "Discover world treasures including the Rosetta Stone with an expert guide.", price: 35, duration: "2.5 hours", rating: 4.7, reviews: 8900, category: "Museums", image: "https://images.unsplash.com/photo-1590099033615-be195f8d575c?w=800&q=80" },
      { title: "Harry Potter Warner Bros Studio Tour", desc: "Step into the magical world of Harry Potter at the original film studios.", price: 95, duration: "4 hours", rating: 4.9, reviews: 22000, category: "Entertainment", image: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800&q=80" },
      { title: "Thames River Cruise with Afternoon Tea", desc: "Cruise past iconic landmarks while enjoying traditional afternoon tea.", price: 55, duration: "1.5 hours", rating: 4.6, reviews: 4500, category: "Cruises", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80" },
      { title: "Westminster Abbey & Changing of the Guard", desc: "See the Changing of the Guard and explore historic Westminster Abbey.", price: 25, duration: "3 hours", rating: 4.5, reviews: 6200, category: "Tours", image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800&q=80" },
      { title: "Stonehenge & Bath Day Trip", desc: "Visit the mysterious Stonehenge and beautiful Georgian city of Bath.", price: 89, duration: "Full day", rating: 4.7, reviews: 9800, category: "Day Trips", image: "https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=800&q=80" },
      { title: "Jack the Ripper Walking Tour", desc: "Explore the dark streets of Whitechapel on this thrilling evening tour.", price: 18, duration: "2 hours", rating: 4.6, reviews: 5100, category: "Tours", image: "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&q=80" },
      { title: "London Eye Skip-the-Line Ticket", desc: "Soar above London for 360-degree views from the iconic observation wheel.", price: 35, duration: "30 minutes", rating: 4.5, reviews: 18000, category: "Landmarks", image: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&q=80" },
    ],
    paris: [
      { title: "Eiffel Tower Summit Access with Skip-the-Line", desc: "Skip the long queues and ascend to the summit of the iconic Eiffel Tower for breathtaking views of Paris.", price: 75, duration: "2-3 hours", rating: 4.7, reviews: 12500, category: "Landmarks", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800&q=80" },
      { title: "Louvre Museum Guided Tour with Skip-the-Line", desc: "Discover masterpieces including the Mona Lisa with an expert guide at the world's largest art museum.", price: 65, duration: "3 hours", rating: 4.8, reviews: 8900, category: "Museums", image: "https://images.unsplash.com/photo-1499426600726-7f7f1b6d2d70?w=800&q=80" },
      { title: "Seine River Cruise with Dinner", desc: "Enjoy a romantic dinner cruise along the Seine, passing illuminated monuments of Paris.", price: 95, duration: "2.5 hours", rating: 4.6, reviews: 5600, category: "Cruises", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80" },
      { title: "Versailles Palace Day Trip from Paris", desc: "Explore the opulent Palace of Versailles and its stunning gardens on a guided day trip.", price: 89, duration: "Full day", rating: 4.7, reviews: 7200, category: "Day Trips", image: "https://images.unsplash.com/photo-1551410224-699683e15636?w=800&q=80" },
      { title: "Montmartre Walking Tour with Wine Tasting", desc: "Discover the artistic heart of Paris in Montmartre with a local guide and French wine tasting.", price: 55, duration: "3 hours", rating: 4.9, reviews: 3400, category: "Food & Drink", image: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800&q=80" },
      { title: "Paris Catacombs Skip-the-Line Tour", desc: "Explore the mysterious underground tunnels housing millions of Parisians from centuries past.", price: 45, duration: "2 hours", rating: 4.5, reviews: 4100, category: "Tours", image: "https://images.unsplash.com/photo-1604154737395-ff16a4f45b14?w=800&q=80" },
      { title: "Moulin Rouge Show with Champagne", desc: "Experience the world-famous cabaret show at Moulin Rouge with a glass of champagne.", price: 115, duration: "2.5 hours", rating: 4.6, reviews: 6800, category: "Entertainment", image: "https://images.unsplash.com/photo-1549456404-20e0ad7a7e17?w=800&q=80" },
      { title: "Paris Food Tour: Cheese, Chocolate & Wine", desc: "Taste your way through Paris sampling the best cheese, chocolate, and wine with a local expert.", price: 85, duration: "3.5 hours", rating: 4.9, reviews: 2900, category: "Food & Drink", image: "https://images.unsplash.com/photo-1486427944544-d2c6128c5432?w=800&q=80" },
    ],
    dubai: [
      { title: "Burj Khalifa At The Top Observation Deck", desc: "Visit the observation deck of the world's tallest building for panoramic views of Dubai.", price: 55, duration: "1-2 hours", rating: 4.8, reviews: 15000, category: "Landmarks", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80" },
      { title: "Desert Safari with BBQ Dinner", desc: "Experience dune bashing, camel rides, and a traditional BBQ dinner under the stars.", price: 75, duration: "6 hours", rating: 4.7, reviews: 12000, category: "Adventure", image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80" },
      { title: "Dubai Marina Luxury Yacht Cruise", desc: "Cruise along Dubai Marina on a luxury yacht with stunning skyline views.", price: 95, duration: "2-3 hours", rating: 4.6, reviews: 4500, category: "Cruises", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80" },
      { title: "Aquaventure Waterpark Admission", desc: "Enjoy thrilling water slides and marine encounters at Atlantis The Palm's waterpark.", price: 85, duration: "Full day", rating: 4.7, reviews: 8900, category: "Theme Parks", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80" },
      { title: "Dubai Frame Entrance Ticket", desc: "Step inside the iconic Dubai Frame for unique views of old and new Dubai.", price: 25, duration: "1 hour", rating: 4.5, reviews: 6200, category: "Landmarks", image: "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=800&q=80" },
      { title: "Old Dubai Walking Tour with Abra Ride", desc: "Explore the historic districts of Al Fahidi and Deira with a traditional abra boat crossing.", price: 45, duration: "3 hours", rating: 4.8, reviews: 3100, category: "Tours", image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80" },
      { title: "Dhow Dinner Cruise Dubai Creek", desc: "Enjoy a buffet dinner aboard a traditional dhow boat cruising Dubai Creek.", price: 65, duration: "2 hours", rating: 4.4, reviews: 5400, category: "Cruises", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&q=80" },
      { title: "Abu Dhabi Day Trip from Dubai", desc: "Visit Abu Dhabi's highlights including Sheikh Zayed Mosque and Emirates Palace.", price: 75, duration: "10 hours", rating: 4.6, reviews: 4800, category: "Day Trips", image: "https://images.unsplash.com/photo-1548430395-ec39eaf2aa1a?w=800&q=80" },
    ],
    bangkok: [
      { title: "Grand Palace and Wat Pho Walking Tour", desc: "Explore Thailand's most sacred landmarks with an expert guide.", price: 45, duration: "4 hours", rating: 4.7, reviews: 9800, category: "Cultural", image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80" },
      { title: "Floating Market and Railway Market Tour", desc: "Visit the famous Damnoen Saduak floating market and Maeklong railway market.", price: 55, duration: "7 hours", rating: 4.6, reviews: 7200, category: "Tours", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80" },
      { title: "Thai Cooking Class with Market Tour", desc: "Learn to cook authentic Thai dishes after visiting a local market.", price: 65, duration: "4 hours", rating: 4.9, reviews: 5100, category: "Food & Drink", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80" },
      { title: "Ayutthaya Ancient City Day Trip", desc: "Explore the UNESCO World Heritage ruins of Thailand's ancient capital.", price: 65, duration: "Full day", rating: 4.7, reviews: 6400, category: "Day Trips", image: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=80" },
      { title: "Chao Phraya Dinner Cruise", desc: "Enjoy Thai cuisine while cruising past illuminated temples and palaces.", price: 55, duration: "2.5 hours", rating: 4.5, reviews: 4200, category: "Cruises", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80" },
      { title: "Muay Thai Boxing Show", desc: "Watch authentic Thai boxing at Rajadamnern Stadium with ringside seats.", price: 45, duration: "3 hours", rating: 4.4, reviews: 2800, category: "Entertainment", image: "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800&q=80" },
      { title: "Bangkok Street Food Night Tour", desc: "Taste your way through Bangkok's best street food with a local guide.", price: 50, duration: "4 hours", rating: 4.8, reviews: 3600, category: "Food & Drink", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80" },
      { title: "Temple and Canal Long-tail Boat Tour", desc: "Discover hidden temples and local life along Bangkok's historic canals.", price: 40, duration: "3 hours", rating: 4.6, reviews: 2900, category: "Tours", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80" },
    ],
    bali: [
      { title: "Ubud Rice Terrace and Temple Tour", desc: "Visit the stunning Tegallalang rice terraces and ancient temples around Ubud.", price: 45, duration: "8 hours", rating: 4.7, reviews: 8500, category: "Tours", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80" },
      { title: "Mount Batur Sunrise Trek with Breakfast", desc: "Hike an active volcano at dawn for spectacular sunrise views and breakfast.", price: 55, duration: "10 hours", rating: 4.8, reviews: 6200, category: "Adventure", image: "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?w=800&q=80" },
      { title: "Balinese Cooking Class in Ubud", desc: "Learn traditional Balinese recipes in a beautiful garden setting.", price: 40, duration: "4 hours", rating: 4.9, reviews: 4100, category: "Food & Drink", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80" },
      { title: "Nusa Penida Island Day Trip", desc: "Explore dramatic cliffs, pristine beaches and Crystal Bay snorkeling.", price: 75, duration: "Full day", rating: 4.6, reviews: 5800, category: "Day Trips", image: "https://images.unsplash.com/photo-1570789210967-2cac24f04c51?w=800&q=80" },
      { title: "Balinese Spa and Wellness Retreat", desc: "Indulge in traditional Balinese massage and flower bath treatment.", price: 50, duration: "3 hours", rating: 4.8, reviews: 3200, category: "Wellness", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80" },
      { title: "Uluwatu Temple and Kecak Fire Dance", desc: "Watch the mesmerizing Kecak fire dance at clifftop Uluwatu Temple.", price: 35, duration: "5 hours", rating: 4.7, reviews: 4500, category: "Cultural", image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80" },
      { title: "White Water Rafting on Ayung River", desc: "Navigate exciting rapids through stunning jungle scenery.", price: 45, duration: "5 hours", rating: 4.6, reviews: 3800, category: "Adventure", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80" },
      { title: "Tanah Lot Sunset Tour", desc: "Visit Bali's most iconic sea temple during golden hour.", price: 30, duration: "4 hours", rating: 4.5, reviews: 2900, category: "Tours", image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=80" },
    ],
    maldives: [
      { title: "Sunset Dolphin Cruise", desc: "Spot dolphins in their natural habitat during a magical sunset cruise.", price: 85, duration: "2 hours", rating: 4.8, reviews: 3200, category: "Wildlife", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80" },
      { title: "Snorkeling Safari to Multiple Reefs", desc: "Explore vibrant coral reefs and tropical marine life at multiple sites.", price: 75, duration: "4 hours", rating: 4.7, reviews: 2800, category: "Water Sports", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Private Sandbank Picnic Experience", desc: "Escape to a secluded sandbank for a romantic gourmet picnic.", price: 195, duration: "4 hours", rating: 4.9, reviews: 1800, category: "Romantic", image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80" },
      { title: "Scuba Diving Introduction Course", desc: "Discover the underwater world with certified PADI instructors.", price: 125, duration: "4 hours", rating: 4.8, reviews: 2100, category: "Water Sports", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&q=80" },
      { title: "Night Fishing Traditional Experience", desc: "Try traditional Maldivian line fishing under the starlit sky.", price: 75, duration: "3 hours", rating: 4.5, reviews: 1500, category: "Adventure", image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80" },
      { title: "Male City and Island Hopping Tour", desc: "Explore the capital Male and nearby local islands.", price: 95, duration: "Full day", rating: 4.4, reviews: 1200, category: "Tours", image: "https://images.unsplash.com/photo-1512100356356-de1b84283e18?w=800&q=80" },
      { title: "Luxury Spa Overwater Treatment", desc: "Indulge in a rejuvenating spa experience in an overwater pavilion.", price: 150, duration: "2 hours", rating: 4.9, reviews: 980, category: "Wellness", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80" },
      { title: "Submarine Underwater Adventure", desc: "Explore the ocean depths in a real submarine without getting wet.", price: 145, duration: "1.5 hours", rating: 4.6, reviews: 890, category: "Adventure", image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80" },
    ],
    barcelona: [
      { title: "Sagrada Familia Skip-the-Line Tour", desc: "Marvel at Gaudi's masterpiece basilica with priority access and expert guide.", price: 55, duration: "1.5 hours", rating: 4.9, reviews: 18500, category: "Landmarks", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80" },
      { title: "Park Guell Guided Tour", desc: "Explore Gaudi's whimsical park with its colorful mosaics and city views.", price: 35, duration: "1.5 hours", rating: 4.7, reviews: 9200, category: "Landmarks", image: "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800&q=80" },
      { title: "Gothic Quarter Walking Tour", desc: "Discover medieval Barcelona's hidden squares, Roman ruins and local legends.", price: 25, duration: "2.5 hours", rating: 4.8, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=800&q=80" },
      { title: "Tapas and Wine Evening Tour", desc: "Sample authentic Spanish tapas and local wines at hidden local bars.", price: 75, duration: "3 hours", rating: 4.8, reviews: 5400, category: "Food & Drink", image: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&q=80" },
      { title: "Montserrat Half-Day Trip", desc: "Visit the sacred mountain monastery and enjoy stunning views.", price: 55, duration: "5 hours", rating: 4.7, reviews: 7100, category: "Day Trips", image: "https://images.unsplash.com/photo-1561632669-7f55f7975606?w=800&q=80" },
      { title: "Camp Nou Stadium Tour", desc: "Go behind the scenes at FC Barcelona's legendary home stadium.", price: 30, duration: "1.5 hours", rating: 4.6, reviews: 11000, category: "Tours", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80" },
      { title: "Flamenco Show with Dinner", desc: "Experience passionate flamenco dancing with traditional Spanish dinner.", price: 65, duration: "2 hours", rating: 4.5, reviews: 4200, category: "Entertainment", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80" },
      { title: "Barcelona Sailing Experience", desc: "Sail along the Mediterranean coast with stunning city skyline views.", price: 85, duration: "2 hours", rating: 4.7, reviews: 3100, category: "Adventure", image: "https://images.unsplash.com/photo-1509070016581-915335454d19?w=800&q=80" },
    ],
    rome: [
      { title: "Colosseum Skip-the-Line Tour", desc: "Explore the iconic amphitheater with priority access and expert historian guide.", price: 55, duration: "3 hours", rating: 4.8, reviews: 22000, category: "Landmarks", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
      { title: "Vatican Museums & Sistine Chapel Tour", desc: "Discover masterpieces of the Vatican including Michelangelo's famous ceiling.", price: 65, duration: "3 hours", rating: 4.9, reviews: 19500, category: "Museums", image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=800&q=80" },
      { title: "Trevi Fountain & Spanish Steps Walk", desc: "Evening walking tour of Rome's most romantic landmarks and piazzas.", price: 25, duration: "2 hours", rating: 4.6, reviews: 8900, category: "Tours", image: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&q=80" },
      { title: "Roman Forum & Palatine Hill Tour", desc: "Walk through the heart of ancient Rome with an archaeologist guide.", price: 45, duration: "2.5 hours", rating: 4.7, reviews: 7200, category: "Landmarks", image: "https://images.unsplash.com/photo-1555992828-ca4dbe41d294?w=800&q=80" },
      { title: "Pasta Making Class with Lunch", desc: "Learn to make fresh pasta from scratch with a local Italian chef.", price: 70, duration: "3 hours", rating: 4.9, reviews: 4800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80" },
      { title: "Pompeii Day Trip from Rome", desc: "Explore the ancient city preserved by volcanic ash on a full-day excursion.", price: 125, duration: "Full day", rating: 4.6, reviews: 5600, category: "Day Trips", image: "https://images.unsplash.com/photo-1586185392773-1db9d5c36f8d?w=800&q=80" },
      { title: "Trastevere Food Tour", desc: "Taste authentic Roman cuisine in the charming Trastevere neighborhood.", price: 75, duration: "3 hours", rating: 4.8, reviews: 3900, category: "Food & Drink", image: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800&q=80" },
      { title: "Borghese Gallery Guided Tour", desc: "Admire Bernini sculptures and Caravaggio paintings in this stunning villa.", price: 55, duration: "2 hours", rating: 4.8, reviews: 3200, category: "Museums", image: "https://images.unsplash.com/photo-1545147986-a9d6f2ab03b5?w=800&q=80" },
    ],
    amsterdam: [
      { title: "Anne Frank House Tour", desc: "Visit the hiding place where Anne Frank wrote her famous diary.", price: 45, duration: "1.5 hours", rating: 4.8, reviews: 12500, category: "Museums", image: "https://images.unsplash.com/photo-1558551649-e44c8f992010?w=800&q=80" },
      { title: "Van Gogh Museum Guided Tour", desc: "Explore the world's largest Van Gogh collection with an art expert.", price: 40, duration: "2 hours", rating: 4.9, reviews: 9800, category: "Museums", image: "https://images.unsplash.com/photo-1580995858132-4f77cb6a4e9b?w=800&q=80" },
      { title: "Canal Cruise with Drinks", desc: "Glide through Amsterdam's UNESCO-listed canals with unlimited drinks.", price: 25, duration: "1 hour", rating: 4.6, reviews: 15200, category: "Cruises", image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80" },
      { title: "Rijksmuseum Skip-the-Line Tour", desc: "See Rembrandt's Night Watch and Dutch Golden Age masterpieces.", price: 50, duration: "2.5 hours", rating: 4.8, reviews: 7600, category: "Museums", image: "https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=800&q=80" },
      { title: "Bike Tour of Amsterdam", desc: "Explore the city like a local on this guided cycling adventure.", price: 35, duration: "3 hours", rating: 4.7, reviews: 5400, category: "Tours", image: "https://images.unsplash.com/photo-1468078809804-f5e46d32d6cd?w=800&q=80" },
      { title: "Keukenhof Gardens Day Trip", desc: "Visit the world's largest flower garden with millions of tulips.", price: 55, duration: "5 hours", rating: 4.8, reviews: 8200, category: "Day Trips", image: "https://images.unsplash.com/photo-1584627486850-5f01a726a5d2?w=800&q=80" },
      { title: "Heineken Experience Tour", desc: "Discover the history of Heineken with tastings at the original brewery.", price: 25, duration: "1.5 hours", rating: 4.5, reviews: 11000, category: "Food & Drink", image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80" },
      { title: "Red Light District Walking Tour", desc: "Explore Amsterdam's famous district with a knowledgeable local guide.", price: 20, duration: "2 hours", rating: 4.4, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=800&q=80" },
    ],
    athens: [
      { title: "Acropolis Skip-the-Line Tour", desc: "Explore the Parthenon and ancient citadel with priority access.", price: 55, duration: "2 hours", rating: 4.9, reviews: 16800, category: "Landmarks", image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80" },
      { title: "Acropolis Museum Guided Tour", desc: "Discover ancient Greek artifacts in this stunning modern museum.", price: 40, duration: "2 hours", rating: 4.8, reviews: 7200, category: "Museums", image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=800&q=80" },
      { title: "Athens Food Tour in Monastiraki", desc: "Taste authentic Greek cuisine from souvlaki to baklava.", price: 65, duration: "3.5 hours", rating: 4.8, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=800&q=80" },
      { title: "Delphi Full-Day Trip", desc: "Visit the ancient Oracle of Delphi, center of the ancient world.", price: 95, duration: "Full day", rating: 4.7, reviews: 5800, category: "Day Trips", image: "https://images.unsplash.com/photo-1594738559741-90e28cec9607?w=800&q=80" },
      { title: "Greek Cooking Class", desc: "Learn to cook traditional Greek dishes with a local chef.", price: 75, duration: "4 hours", rating: 4.9, reviews: 2900, category: "Food & Drink", image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80" },
      { title: "Cape Sounion Sunset Tour", desc: "Watch the sunset at the Temple of Poseidon on the Aegean coast.", price: 55, duration: "5 hours", rating: 4.7, reviews: 3600, category: "Tours", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80" },
      { title: "Plaka Walking Tour", desc: "Explore the charming old neighborhood at the foot of the Acropolis.", price: 25, duration: "2.5 hours", rating: 4.6, reviews: 4100, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Meteora Day Trip from Athens", desc: "Visit the stunning clifftop monasteries of Meteora.", price: 110, duration: "Full day", rating: 4.8, reviews: 4200, category: "Day Trips", image: "https://images.unsplash.com/photo-1574092303062-a62d7e3e2a52?w=800&q=80" },
    ],
    santorini: [
      { title: "Santorini Caldera Sunset Cruise", desc: "Sail around the volcanic caldera and watch the famous Santorini sunset.", price: 95, duration: "5 hours", rating: 4.9, reviews: 8500, category: "Cruises", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80" },
      { title: "Oia Walking Tour at Sunset", desc: "Explore the iconic blue-domed village and find the perfect sunset spot.", price: 35, duration: "2.5 hours", rating: 4.8, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80" },
      { title: "Wine Tasting Tour", desc: "Sample unique Santorini wines at traditional clifftop wineries.", price: 85, duration: "4 hours", rating: 4.8, reviews: 4100, category: "Food & Drink", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80" },
      { title: "Volcano & Hot Springs Tour", desc: "Hike the volcanic crater and swim in natural hot springs.", price: 45, duration: "5 hours", rating: 4.6, reviews: 6200, category: "Adventure", image: "https://images.unsplash.com/photo-1557489225-4a1e1e3d0aec?w=800&q=80" },
      { title: "Akrotiri Archaeological Site Tour", desc: "Explore the 'Pompeii of the Aegean' - an ancient Minoan city.", price: 55, duration: "2 hours", rating: 4.7, reviews: 3100, category: "Tours", image: "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800&q=80" },
      { title: "Private Photography Tour", desc: "Capture stunning photos at secret spots with a professional guide.", price: 125, duration: "3 hours", rating: 4.9, reviews: 1800, category: "Tours", image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&q=80" },
      { title: "Traditional Greek Cooking Class", desc: "Learn to cook authentic Greek dishes with caldera views.", price: 95, duration: "4 hours", rating: 4.8, reviews: 2400, category: "Food & Drink", image: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=800&q=80" },
      { title: "ATV Island Exploration", desc: "Explore hidden beaches and villages on an ATV adventure.", price: 75, duration: "4 hours", rating: 4.5, reviews: 2900, category: "Adventure", image: "https://images.unsplash.com/photo-1604537466573-5e94508fd243?w=800&q=80" },
    ],
    milan: [
      { title: "Last Supper Skip-the-Line Tour", desc: "See Leonardo da Vinci's masterpiece with guaranteed entry and expert guide.", price: 55, duration: "1 hour", rating: 4.9, reviews: 12500, category: "Museums", image: "https://images.unsplash.com/photo-1566909069038-96c64b84a950?w=800&q=80" },
      { title: "Duomo Rooftop & Cathedral Tour", desc: "Climb to the rooftop terraces for panoramic views of Milan.", price: 35, duration: "1.5 hours", rating: 4.8, reviews: 9800, category: "Landmarks", image: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=800&q=80" },
      { title: "Milan Fashion District Walking Tour", desc: "Explore the Quadrilatero della Moda with a fashion insider.", price: 45, duration: "2.5 hours", rating: 4.6, reviews: 3200, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Lake Como Day Trip", desc: "Visit the stunning lakeside villas and charming villages of Lake Como.", price: 95, duration: "Full day", rating: 4.7, reviews: 6800, category: "Day Trips", image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?w=800&q=80" },
      { title: "Italian Cooking Class", desc: "Learn to make risotto and other Milanese specialties.", price: 85, duration: "3 hours", rating: 4.8, reviews: 2900, category: "Food & Drink", image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80" },
      { title: "La Scala Opera House Tour", desc: "Go behind the scenes at one of the world's most famous opera houses.", price: 30, duration: "1.5 hours", rating: 4.7, reviews: 4100, category: "Tours", image: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&q=80" },
    ],
    istanbul: [
      { title: "Hagia Sophia & Blue Mosque Tour", desc: "Explore Istanbul's two most iconic religious monuments.", price: 45, duration: "3 hours", rating: 4.8, reviews: 14200, category: "Landmarks", image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80" },
      { title: "Topkapi Palace Skip-the-Line", desc: "Discover the Ottoman sultans' magnificent palace with priority access.", price: 55, duration: "2.5 hours", rating: 4.7, reviews: 9800, category: "Museums", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80" },
      { title: "Bosphorus Cruise with Dinner", desc: "Cruise between Europe and Asia with traditional Turkish dinner.", price: 65, duration: "3 hours", rating: 4.6, reviews: 7500, category: "Cruises", image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80" },
      { title: "Grand Bazaar Shopping Tour", desc: "Navigate the world's oldest covered market with a local guide.", price: 35, duration: "2.5 hours", rating: 4.7, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=800&q=80" },
      { title: "Turkish Cooking Class", desc: "Learn to cook authentic Turkish dishes in a traditional kitchen.", price: 75, duration: "4 hours", rating: 4.9, reviews: 3800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
      { title: "Cappadocia 2-Day Trip with Hot Air Balloon", desc: "Fly over fairy chimneys and explore underground cities.", price: 295, duration: "2 days", rating: 4.9, reviews: 4500, category: "Day Trips", image: "https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80" },
      { title: "Turkish Bath Experience", desc: "Enjoy a traditional hammam experience with scrub and massage.", price: 55, duration: "2 hours", rating: 4.6, reviews: 6200, category: "Wellness", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80" },
      { title: "Whirling Dervishes Show", desc: "Watch the mesmerizing Sufi ceremony at a historic venue.", price: 35, duration: "1.5 hours", rating: 4.5, reviews: 4100, category: "Entertainment", image: "https://images.unsplash.com/photo-1596309569929-57b1d8ded8a1?w=800&q=80" },
    ],
    lisbon: [
      { title: "Sintra & Pena Palace Day Trip", desc: "Visit the fairytale palaces and gardens of romantic Sintra.", price: 75, duration: "Full day", rating: 4.8, reviews: 11200, category: "Day Trips", image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80" },
      { title: "Belem Tower & Jeronimos Monastery", desc: "Explore Lisbon's UNESCO World Heritage monuments.", price: 35, duration: "3 hours", rating: 4.7, reviews: 7500, category: "Landmarks", image: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=800&q=80" },
      { title: "Alfama Walking Tour with Fado", desc: "Explore the oldest neighborhood and enjoy live Fado music.", price: 55, duration: "3.5 hours", rating: 4.8, reviews: 5800, category: "Tours", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80" },
      { title: "Portuguese Food & Wine Tour", desc: "Taste pasteis de nata, port wine and local delicacies.", price: 65, duration: "3 hours", rating: 4.9, reviews: 4200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1589227365533-cee630bd59bd?w=800&q=80" },
      { title: "Tram 28 & Lisbon Highlights", desc: "Ride the iconic yellow tram through historic neighborhoods.", price: 45, duration: "4 hours", rating: 4.6, reviews: 6500, category: "Tours", image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=80" },
      { title: "Cascais & Estoril Coast Trip", desc: "Visit charming coastal towns and dramatic cliffs.", price: 55, duration: "5 hours", rating: 4.7, reviews: 3900, category: "Day Trips", image: "https://images.unsplash.com/photo-1580323256145-c53e3b7b0151?w=800&q=80" },
    ],
    prague: [
      { title: "Prague Castle & St. Vitus Cathedral", desc: "Explore the world's largest ancient castle complex.", price: 45, duration: "3 hours", rating: 4.8, reviews: 12800, category: "Landmarks", image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80" },
      { title: "Old Town & Charles Bridge Walk", desc: "Discover Prague's medieval heart and iconic Gothic bridge.", price: 25, duration: "2.5 hours", rating: 4.7, reviews: 8900, category: "Tours", image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80" },
      { title: "Czech Beer Tasting Tour", desc: "Sample the world's best beers in historic Czech pubs.", price: 45, duration: "3 hours", rating: 4.8, reviews: 6200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=800&q=80" },
      { title: "Jewish Quarter Walking Tour", desc: "Explore the historic synagogues and cemetery of Josefov.", price: 35, duration: "2.5 hours", rating: 4.7, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1562742269-70eace0a2970?w=800&q=80" },
      { title: "Cesky Krumlov Day Trip", desc: "Visit the fairytale UNESCO town in South Bohemia.", price: 75, duration: "Full day", rating: 4.8, reviews: 5800, category: "Day Trips", image: "https://images.unsplash.com/photo-1560093159-4cd3ab32f9e5?w=800&q=80" },
      { title: "River Cruise with Dinner", desc: "Cruise the Vltava River with views of illuminated Prague.", price: 55, duration: "3 hours", rating: 4.6, reviews: 4100, category: "Cruises", image: "https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=800&q=80" },
    ],
    vienna: [
      { title: "Schonbrunn Palace Tour", desc: "Explore the magnificent imperial summer residence and gardens.", price: 55, duration: "3 hours", rating: 4.8, reviews: 11500, category: "Landmarks", image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80" },
      { title: "Vienna State Opera Tour", desc: "Go behind the scenes at one of the world's leading opera houses.", price: 25, duration: "1 hour", rating: 4.7, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=800&q=80" },
      { title: "Viennese Coffee House Tour", desc: "Experience Vienna's legendary cafe culture and pastries.", price: 45, duration: "3 hours", rating: 4.8, reviews: 4800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80" },
      { title: "Belvedere Palace & Klimt", desc: "See Klimt's 'The Kiss' and Austrian art masterpieces.", price: 35, duration: "2 hours", rating: 4.7, reviews: 6200, category: "Museums", image: "https://images.unsplash.com/photo-1609348217428-b4d734c1c5e9?w=800&q=80" },
      { title: "Classical Concert at Musikverein", desc: "Enjoy Mozart and Strauss in Vienna's golden concert hall.", price: 75, duration: "2 hours", rating: 4.9, reviews: 3800, category: "Entertainment", image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&q=80" },
      { title: "Wachau Valley Wine Tour", desc: "Taste wines in the scenic Danube Valley vineyards.", price: 95, duration: "Full day", rating: 4.7, reviews: 2900, category: "Day Trips", image: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=800&q=80" },
    ],
    venice: [
      { title: "St. Mark's Basilica Skip-the-Line", desc: "Admire Byzantine mosaics with priority access to the basilica.", price: 35, duration: "1 hour", rating: 4.8, reviews: 14200, category: "Landmarks", image: "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800&q=80" },
      { title: "Doge's Palace & Bridge of Sighs", desc: "Explore the Gothic palace and notorious prison cells.", price: 45, duration: "2 hours", rating: 4.7, reviews: 9800, category: "Museums", image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80" },
      { title: "Grand Canal Gondola Ride", desc: "Glide through Venice's main waterway in a traditional gondola.", price: 35, duration: "30 minutes", rating: 4.6, reviews: 18500, category: "Tours", image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&q=80" },
      { title: "Murano & Burano Island Tour", desc: "Visit the glass-making and lace-making islands of the lagoon.", price: 55, duration: "5 hours", rating: 4.7, reviews: 7200, category: "Day Trips", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80" },
      { title: "Venetian Cicchetti Food Tour", desc: "Taste local bar snacks and wines like a Venetian.", price: 75, duration: "3 hours", rating: 4.8, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800&q=80" },
      { title: "Evening Legends Walking Tour", desc: "Discover Venice's ghost stories and hidden squares at night.", price: 25, duration: "2 hours", rating: 4.6, reviews: 3200, category: "Tours", image: "https://images.unsplash.com/photo-1569880153113-76e33fc52d5f?w=800&q=80" },
    ],
    madrid: [
      { title: "Prado Museum Skip-the-Line", desc: "See masterpieces by Velazquez, Goya and El Greco.", price: 45, duration: "2.5 hours", rating: 4.8, reviews: 11200, category: "Museums", image: "https://images.unsplash.com/photo-1509339022327-1e1e25360a41?w=800&q=80" },
      { title: "Royal Palace Guided Tour", desc: "Explore Europe's largest functioning royal palace.", price: 35, duration: "1.5 hours", rating: 4.7, reviews: 8500, category: "Landmarks", image: "https://images.unsplash.com/photo-1559592432-d1e3e9b6b9a7?w=800&q=80" },
      { title: "Tapas & Wine Evening Tour", desc: "Bar hop through Madrid's best tapas spots.", price: 75, duration: "3.5 hours", rating: 4.9, reviews: 6200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&q=80" },
      { title: "Flamenco Show in Taberna", desc: "Experience authentic flamenco in an intimate venue.", price: 45, duration: "1.5 hours", rating: 4.7, reviews: 5100, category: "Entertainment", image: "https://images.unsplash.com/photo-1509339022327-1e1e25360a41?w=800&q=80" },
      { title: "Toledo Day Trip", desc: "Visit the medieval 'City of Three Cultures'.", price: 65, duration: "Full day", rating: 4.7, reviews: 7800, category: "Day Trips", image: "https://images.unsplash.com/photo-1569324039923-2045bc50ad36?w=800&q=80" },
      { title: "Bernabeu Stadium Tour", desc: "Go behind the scenes at Real Madrid's legendary stadium.", price: 30, duration: "1.5 hours", rating: 4.6, reviews: 9200, category: "Tours", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80" },
    ],
    berlin: [
      { title: "Berlin Wall & Cold War Tour", desc: "Explore the history of divided Berlin and see remaining Wall sections.", price: 25, duration: "3 hours", rating: 4.8, reviews: 9800, category: "Tours", image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80" },
      { title: "Brandenburg Gate & Reichstag", desc: "Visit Berlin's iconic landmarks with a historian guide.", price: 35, duration: "2.5 hours", rating: 4.7, reviews: 7200, category: "Landmarks", image: "https://images.unsplash.com/photo-1566404791232-af9fe0ae8f8b?w=800&q=80" },
      { title: "Museum Island Tour", desc: "Explore five world-renowned museums on a UNESCO island.", price: 55, duration: "4 hours", rating: 4.8, reviews: 5400, category: "Museums", image: "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=800&q=80" },
      { title: "Alternative Berlin Street Art Tour", desc: "Discover Berlin's vibrant street art and counterculture.", price: 20, duration: "3 hours", rating: 4.7, reviews: 4800, category: "Tours", image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&q=80" },
      { title: "Sachsenhausen Concentration Camp", desc: "A sobering memorial tour with expert historian guide.", price: 35, duration: "6 hours", rating: 4.9, reviews: 6100, category: "Tours", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "Berlin Food Tour", desc: "Taste currywurst, doner kebab and Berlin's multicultural cuisine.", price: 55, duration: "3.5 hours", rating: 4.6, reviews: 3200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?w=800&q=80" },
    ],
    munich: [
      { title: "Neuschwanstein Castle Day Trip", desc: "Visit the fairytale castle that inspired Disney.", price: 65, duration: "Full day", rating: 4.8, reviews: 12500, category: "Day Trips", image: "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&q=80" },
      { title: "Marienplatz & Old Town Tour", desc: "See the Glockenspiel and explore Munich's historic center.", price: 25, duration: "2.5 hours", rating: 4.7, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1577462469402-1c3e4a29d51c?w=800&q=80" },
      { title: "Bavarian Beer Hall Experience", desc: "Enjoy traditional beer and food in an authentic beer hall.", price: 45, duration: "3 hours", rating: 4.6, reviews: 5400, category: "Food & Drink", image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80" },
      { title: "Dachau Memorial Tour", desc: "A thoughtful tour of the first Nazi concentration camp.", price: 35, duration: "5 hours", rating: 4.9, reviews: 7200, category: "Tours", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "BMW World & Museum", desc: "Explore the history of BMW with interactive exhibits.", price: 25, duration: "2 hours", rating: 4.5, reviews: 4100, category: "Museums", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&q=80" },
      { title: "Salzburg Day Trip", desc: "Visit Mozart's birthplace and Sound of Music locations.", price: 75, duration: "Full day", rating: 4.7, reviews: 5800, category: "Day Trips", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80" },
    ],
    dublin: [
      { title: "Guinness Storehouse Experience", desc: "Discover the history of Ireland's famous stout with tastings.", price: 30, duration: "2 hours", rating: 4.7, reviews: 18500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80" },
      { title: "Trinity College & Book of Kells", desc: "See the illuminated medieval manuscript and Long Room library.", price: 25, duration: "1.5 hours", rating: 4.8, reviews: 11200, category: "Museums", image: "https://images.unsplash.com/photo-1590574899820-b8ce853a8a03?w=800&q=80" },
      { title: "Traditional Irish Pub Crawl", desc: "Experience Dublin's legendary pub culture with live music.", price: 25, duration: "3 hours", rating: 4.6, reviews: 7800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80" },
      { title: "Cliffs of Moher Day Trip", desc: "Visit Ireland's most spectacular coastal cliffs.", price: 65, duration: "Full day", rating: 4.8, reviews: 9500, category: "Day Trips", image: "https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=800&q=80" },
      { title: "Whiskey Distillery Tour", desc: "Learn about Irish whiskey with tastings at a working distillery.", price: 35, duration: "1.5 hours", rating: 4.7, reviews: 5200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80" },
      { title: "Giant's Causeway Day Trip", desc: "Explore the unique hexagonal basalt columns of the Causeway Coast.", price: 75, duration: "Full day", rating: 4.8, reviews: 6800, category: "Day Trips", image: "https://images.unsplash.com/photo-1596825205398-d34a3d47b6bb?w=800&q=80" },
    ],
    edinburgh: [
      { title: "Edinburgh Castle Skip-the-Line", desc: "Explore Scotland's most famous castle with priority access.", price: 35, duration: "2 hours", rating: 4.8, reviews: 14200, category: "Landmarks", image: "https://images.unsplash.com/photo-1506377585622-bedcbb5f3789?w=800&q=80" },
      { title: "Royal Mile Walking Tour", desc: "Discover the history of Edinburgh's famous medieval street.", price: 20, duration: "2 hours", rating: 4.7, reviews: 8900, category: "Tours", image: "https://images.unsplash.com/photo-1596476629088-6f4c88c9e5a0?w=800&q=80" },
      { title: "Underground Vaults Ghost Tour", desc: "Explore Edinburgh's haunted underground chambers.", price: 25, duration: "1.5 hours", rating: 4.6, reviews: 7200, category: "Tours", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "Scottish Highlands Day Trip", desc: "See Loch Ness, Glencoe and stunning Highland scenery.", price: 65, duration: "Full day", rating: 4.8, reviews: 11500, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Scotch Whisky Experience", desc: "Learn about whisky-making with tastings on the Royal Mile.", price: 30, duration: "1 hour", rating: 4.7, reviews: 6500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&q=80" },
      { title: "Arthur's Seat Hiking Tour", desc: "Climb the ancient volcano for panoramic city views.", price: 25, duration: "3 hours", rating: 4.6, reviews: 3800, category: "Adventure", image: "https://images.unsplash.com/photo-1508966421229-c8a5d28f4cb0?w=800&q=80" },
    ],
    budapest: [
      { title: "Parliament Building Tour", desc: "Tour Hungary's stunning neo-Gothic parliament building.", price: 35, duration: "1 hour", rating: 4.8, reviews: 11200, category: "Landmarks", image: "https://images.unsplash.com/photo-1541343672885-9be56236302a?w=800&q=80" },
      { title: "Buda Castle & Fisherman's Bastion", desc: "Explore the castle district and enjoy panoramic views.", price: 30, duration: "2.5 hours", rating: 4.7, reviews: 8500, category: "Tours", image: "https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&q=80" },
      { title: "Thermal Bath Experience", desc: "Relax in Budapest's famous Szechenyi thermal baths.", price: 25, duration: "3 hours", rating: 4.6, reviews: 9800, category: "Wellness", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80" },
      { title: "Danube River Cruise", desc: "Cruise past illuminated landmarks with drinks included.", price: 25, duration: "1 hour", rating: 4.7, reviews: 7200, category: "Cruises", image: "https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&q=80" },
      { title: "Ruin Bar & Pub Crawl", desc: "Experience Budapest's unique ruin bar scene.", price: 30, duration: "4 hours", rating: 4.5, reviews: 5400, category: "Entertainment", image: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=80" },
      { title: "Hungarian Food Tour", desc: "Taste goulash, chimney cake and local wine.", price: 65, duration: "3.5 hours", rating: 4.8, reviews: 4100, category: "Food & Drink", image: "https://images.unsplash.com/photo-1615719413546-198b25453f85?w=800&q=80" },
    ],
    // MIDDLE EAST
    "abu dhabi": [
      { title: "Sheikh Zayed Grand Mosque Tour", desc: "Visit one of the world's largest and most beautiful mosques.", price: 35, duration: "2 hours", rating: 4.9, reviews: 15200, category: "Landmarks", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&q=80" },
      { title: "Louvre Abu Dhabi Guided Tour", desc: "Explore the stunning museum with its floating dome architecture.", price: 45, duration: "2.5 hours", rating: 4.8, reviews: 8500, category: "Museums", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80" },
      { title: "Ferrari World Theme Park", desc: "Experience the world's fastest roller coaster and Ferrari attractions.", price: 85, duration: "Full day", rating: 4.7, reviews: 9200, category: "Theme Parks", image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80" },
      { title: "Desert Safari with BBQ", desc: "Dune bashing, camel rides and BBQ dinner under the stars.", price: 75, duration: "6 hours", rating: 4.6, reviews: 6800, category: "Adventure", image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80" },
      { title: "Yas Island Water Park", desc: "Cool off at the exciting Yas Waterworld.", price: 75, duration: "Full day", rating: 4.7, reviews: 5400, category: "Theme Parks", image: "https://images.unsplash.com/photo-1590166223826-a4b2e8af4b7a?w=800&q=80" },
      { title: "Mangrove Kayaking Tour", desc: "Paddle through peaceful mangrove forests.", price: 55, duration: "3 hours", rating: 4.6, reviews: 2900, category: "Adventure", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
    ],
    doha: [
      { title: "Museum of Islamic Art Tour", desc: "Explore the stunning I.M. Pei-designed museum and its collection.", price: 35, duration: "2 hours", rating: 4.8, reviews: 5200, category: "Museums", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80" },
      { title: "Souq Waqif Walking Tour", desc: "Explore the traditional market with spices, textiles and local food.", price: 25, duration: "2.5 hours", rating: 4.7, reviews: 4100, category: "Tours", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80" },
      { title: "Desert Safari & Inland Sea", desc: "4x4 adventure to the stunning Khor Al Adaid inland sea.", price: 95, duration: "6 hours", rating: 4.8, reviews: 6200, category: "Adventure", image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80" },
      { title: "Pearl-Qatar & Katara Tour", desc: "Visit the luxury island and cultural village.", price: 45, duration: "4 hours", rating: 4.6, reviews: 3500, category: "Tours", image: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=800&q=80" },
      { title: "Traditional Dhow Cruise", desc: "Cruise the Doha skyline on a traditional wooden boat.", price: 55, duration: "2 hours", rating: 4.5, reviews: 2800, category: "Cruises", image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800&q=80" },
      { title: "Camel Racing Experience", desc: "Watch traditional camel racing at Al Shahaniya.", price: 65, duration: "4 hours", rating: 4.6, reviews: 1800, category: "Cultural", image: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&q=80" },
    ],
    "tel aviv": [
      { title: "Jerusalem Full-Day Tour", desc: "Visit the Old City, Western Wall, and Mount of Olives.", price: 95, duration: "Full day", rating: 4.9, reviews: 8500, category: "Day Trips", image: "https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800&q=80" },
      { title: "Old Jaffa Walking Tour", desc: "Explore the ancient port city's winding streets and markets.", price: 35, duration: "2.5 hours", rating: 4.7, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80" },
      { title: "Tel Aviv Food Tour", desc: "Taste the best of Israeli cuisine at Carmel Market.", price: 75, duration: "3.5 hours", rating: 4.8, reviews: 3800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Dead Sea Day Trip", desc: "Float in the world's saltiest body of water and visit Masada.", price: 115, duration: "Full day", rating: 4.8, reviews: 6200, category: "Day Trips", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Bauhaus Architecture Tour", desc: "Discover Tel Aviv's UNESCO White City architecture.", price: 30, duration: "2 hours", rating: 4.6, reviews: 2400, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Bethlehem & Jericho Tour", desc: "Visit the birthplace of Jesus and the ancient city of Jericho.", price: 85, duration: "Full day", rating: 4.7, reviews: 4100, category: "Day Trips", image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80" },
    ],
    jordan: [
      { title: "Petra Full-Day Tour", desc: "Explore the ancient rose-red city carved into rock.", price: 125, duration: "Full day", rating: 4.9, reviews: 12500, category: "Landmarks", image: "https://images.unsplash.com/photo-1579606032821-4e6161c81571?w=800&q=80" },
      { title: "Wadi Rum Desert Experience", desc: "4x4 tour and overnight camping in the Martian landscape.", price: 145, duration: "2 days", rating: 4.8, reviews: 7800, category: "Adventure", image: "https://images.unsplash.com/photo-1553899017-a2a8eebc87ab?w=800&q=80" },
      { title: "Dead Sea Float Experience", desc: "Float in the mineral-rich waters with spa treatments.", price: 65, duration: "4 hours", rating: 4.7, reviews: 5400, category: "Wellness", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Jerash Roman Ruins Tour", desc: "Visit one of the best-preserved Roman cities outside Italy.", price: 55, duration: "4 hours", rating: 4.7, reviews: 4200, category: "Tours", image: "https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800&q=80" },
      { title: "Amman City Tour", desc: "Explore the Citadel, Roman Theatre and local markets.", price: 45, duration: "4 hours", rating: 4.6, reviews: 3100, category: "Tours", image: "https://images.unsplash.com/photo-1589276699773-45d8d25b2c92?w=800&q=80" },
      { title: "Jordanian Cooking Class", desc: "Learn to make mansaf and other traditional dishes.", price: 65, duration: "4 hours", rating: 4.8, reviews: 1800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
    ],
    // ASIA
    singapore: [
      { title: "Gardens by the Bay & Cloud Forest", desc: "Explore the futuristic Supertree Grove and misty Cloud Forest dome.", price: 35, duration: "3 hours", rating: 4.8, reviews: 22000, category: "Landmarks", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80" },
      { title: "Marina Bay Sands SkyPark", desc: "Enjoy panoramic city views from the iconic rooftop observation deck.", price: 25, duration: "1 hour", rating: 4.6, reviews: 15200, category: "Landmarks", image: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=800&q=80" },
      { title: "Singapore Food Tour", desc: "Taste hawker center favorites from chicken rice to chili crab.", price: 75, duration: "3.5 hours", rating: 4.9, reviews: 6800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Universal Studios Singapore", desc: "Full day of thrilling rides and attractions.", price: 85, duration: "Full day", rating: 4.7, reviews: 18500, category: "Theme Parks", image: "https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=800&q=80" },
      { title: "Sentosa Island Day Pass", desc: "Beach, attractions and cable car access.", price: 45, duration: "Full day", rating: 4.5, reviews: 9200, category: "Adventure", image: "https://images.unsplash.com/photo-1566451753748-2b25b5dd9c11?w=800&q=80" },
      { title: "Night Safari Experience", desc: "Explore the world's first nocturnal wildlife park.", price: 55, duration: "4 hours", rating: 4.7, reviews: 11500, category: "Wildlife", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef3?w=800&q=80" },
    ],
    "hong kong": [
      { title: "Victoria Peak Tram & Sky Terrace", desc: "Ride the historic Peak Tram for stunning harbor views.", price: 25, duration: "2 hours", rating: 4.7, reviews: 18500, category: "Landmarks", image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80" },
      { title: "Big Buddha & Lantau Island", desc: "Visit the giant Tian Tan Buddha and Po Lin Monastery.", price: 55, duration: "Full day", rating: 4.8, reviews: 12200, category: "Day Trips", image: "https://images.unsplash.com/photo-1537498425277-c283d32ef9db?w=800&q=80" },
      { title: "Dim Sum Food Tour", desc: "Sample authentic Cantonese dim sum at local favorites.", price: 65, duration: "3 hours", rating: 4.9, reviews: 5800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&q=80" },
      { title: "Hong Kong Disneyland", desc: "Full day of Disney magic in Asia.", price: 95, duration: "Full day", rating: 4.6, reviews: 14200, category: "Theme Parks", image: "https://images.unsplash.com/photo-1575389819108-6a2bd4c14f3f?w=800&q=80" },
      { title: "Symphony of Lights Cruise", desc: "Watch the nightly light show from Victoria Harbour.", price: 35, duration: "1.5 hours", rating: 4.5, reviews: 7500, category: "Cruises", image: "https://images.unsplash.com/photo-1519832979-6fa011b87667?w=800&q=80" },
      { title: "Macau Day Trip", desc: "Visit the Vegas of Asia with ferry and guided tour.", price: 85, duration: "Full day", rating: 4.6, reviews: 6200, category: "Day Trips", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
    ],
    tokyo: [
      { title: "Tokyo Skytree Observation Deck", desc: "See the city from Japan's tallest tower.", price: 25, duration: "1.5 hours", rating: 4.7, reviews: 21000, category: "Landmarks", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80" },
      { title: "Tsukiji Outer Market Food Tour", desc: "Taste the freshest sushi and Japanese street food.", price: 85, duration: "3 hours", rating: 4.9, reviews: 8500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80" },
      { title: "Mount Fuji Day Trip", desc: "Visit the iconic mountain with stops at Hakone.", price: 95, duration: "Full day", rating: 4.8, reviews: 15200, category: "Day Trips", image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80" },
      { title: "Shibuya & Harajuku Walking Tour", desc: "Explore Tokyo's trendy fashion and pop culture districts.", price: 45, duration: "3 hours", rating: 4.7, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80" },
      { title: "TeamLab Digital Art Museum", desc: "Immerse yourself in stunning digital art installations.", price: 35, duration: "2 hours", rating: 4.8, reviews: 12500, category: "Museums", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80" },
      { title: "Sumo Wrestling Tournament", desc: "Watch authentic sumo wrestling with English guide.", price: 125, duration: "4 hours", rating: 4.6, reviews: 3200, category: "Entertainment", image: "https://images.unsplash.com/photo-1554797589-7241bb691973?w=800&q=80" },
    ],
    osaka: [
      { title: "Osaka Castle Park Tour", desc: "Explore the historic castle and its beautiful grounds.", price: 25, duration: "2 hours", rating: 4.7, reviews: 11200, category: "Landmarks", image: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80" },
      { title: "Dotonbori Street Food Tour", desc: "Taste takoyaki, okonomiyaki and Osaka's best street food.", price: 75, duration: "3 hours", rating: 4.9, reviews: 7500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Universal Studios Japan", desc: "Experience Harry Potter, Nintendo World and more.", price: 95, duration: "Full day", rating: 4.8, reviews: 22000, category: "Theme Parks", image: "https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=800&q=80" },
      { title: "Kyoto Day Trip", desc: "Visit ancient temples, geisha districts and bamboo groves.", price: 85, duration: "Full day", rating: 4.8, reviews: 9800, category: "Day Trips", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80" },
      { title: "Nara Deer Park & Temple", desc: "Feed friendly deer and visit the giant Buddha.", price: 55, duration: "5 hours", rating: 4.7, reviews: 8200, category: "Day Trips", image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80" },
      { title: "Osaka Night Tour", desc: "See the neon lights and vibrant nightlife.", price: 45, duration: "3 hours", rating: 4.6, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80" },
    ],
    seoul: [
      { title: "Gyeongbokgung Palace & Hanbok Rental", desc: "Explore the grand palace wearing traditional Korean dress.", price: 45, duration: "4 hours", rating: 4.8, reviews: 14500, category: "Cultural", image: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80" },
      { title: "DMZ Tour from Seoul", desc: "Visit the border between North and South Korea.", price: 65, duration: "6 hours", rating: 4.7, reviews: 11200, category: "Tours", image: "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=800&q=80" },
      { title: "Korean BBQ & Street Food Tour", desc: "Taste the best Korean cuisine from BBQ to tteokbokki.", price: 75, duration: "3.5 hours", rating: 4.9, reviews: 6800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80" },
      { title: "Bukchon Hanok Village Walk", desc: "Stroll through traditional Korean houses and tea shops.", price: 25, duration: "2 hours", rating: 4.6, reviews: 5400, category: "Tours", image: "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=800&q=80" },
      { title: "K-Pop Dance Class", desc: "Learn choreography from K-Pop hits with professional dancers.", price: 45, duration: "2 hours", rating: 4.7, reviews: 3800, category: "Entertainment", image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80" },
      { title: "N Seoul Tower & Namsan", desc: "Take the cable car up for city views and love lock bridge.", price: 25, duration: "2 hours", rating: 4.5, reviews: 8900, category: "Landmarks", image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&q=80" },
    ],
    phuket: [
      { title: "Phi Phi Islands Day Trip", desc: "Snorkel crystal waters and visit Maya Bay.", price: 65, duration: "Full day", rating: 4.7, reviews: 18500, category: "Day Trips", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80" },
      { title: "James Bond Island Tour", desc: "Visit the famous Phang Nga Bay film location.", price: 55, duration: "Full day", rating: 4.6, reviews: 12200, category: "Day Trips", image: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&q=80" },
      { title: "Thai Cooking Class", desc: "Learn to cook authentic Thai dishes with market visit.", price: 55, duration: "4 hours", rating: 4.9, reviews: 5800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80" },
      { title: "Big Buddha & Phuket Town", desc: "Visit the iconic statue and explore Old Phuket Town.", price: 35, duration: "4 hours", rating: 4.5, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1597476817120-6e28f41c4103?w=800&q=80" },
      { title: "Elephant Sanctuary Visit", desc: "Ethical elephant experience with feeding and bathing.", price: 85, duration: "4 hours", rating: 4.8, reviews: 6200, category: "Wildlife", image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80" },
      { title: "Sunset Dinner Cruise", desc: "Sail past islands with fresh seafood dinner.", price: 75, duration: "4 hours", rating: 4.6, reviews: 3800, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
    ],
    "chiang mai": [
      { title: "Elephant Nature Park Visit", desc: "Ethical elephant sanctuary with feeding and walking.", price: 85, duration: "Full day", rating: 4.9, reviews: 9800, category: "Wildlife", image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80" },
      { title: "Doi Suthep Temple Tour", desc: "Visit the sacred mountain temple with city views.", price: 25, duration: "3 hours", rating: 4.7, reviews: 7500, category: "Tours", image: "https://images.unsplash.com/photo-1558005530-a7958896ec60?w=800&q=80" },
      { title: "Thai Cooking Class", desc: "Learn Northern Thai cuisine in a traditional setting.", price: 45, duration: "4 hours", rating: 4.9, reviews: 8200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80" },
      { title: "Night Market & Food Tour", desc: "Explore the famous Sunday Walking Street.", price: 35, duration: "3 hours", rating: 4.7, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80" },
      { title: "Doi Inthanon National Park", desc: "Visit Thailand's highest peak and stunning waterfalls.", price: 55, duration: "Full day", rating: 4.8, reviews: 5200, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "White Temple Day Trip", desc: "Visit the stunning Wat Rong Khun in Chiang Rai.", price: 65, duration: "Full day", rating: 4.7, reviews: 6800, category: "Day Trips", image: "https://images.unsplash.com/photo-1512553311684-8b9d90cdd5fb?w=800&q=80" },
    ],
    hanoi: [
      { title: "Halong Bay Overnight Cruise", desc: "Cruise through limestone islands on a traditional junk boat.", price: 145, duration: "2 days", rating: 4.8, reviews: 15200, category: "Cruises", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80" },
      { title: "Old Quarter Walking Tour", desc: "Explore the 36 ancient streets of Hanoi.", price: 25, duration: "3 hours", rating: 4.7, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80" },
      { title: "Vietnamese Street Food Tour", desc: "Taste pho, banh mi and local favorites.", price: 45, duration: "3 hours", rating: 4.9, reviews: 8500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800&q=80" },
      { title: "Water Puppet Show", desc: "Watch traditional Vietnamese water puppetry.", price: 15, duration: "1 hour", rating: 4.5, reviews: 4200, category: "Entertainment", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80" },
      { title: "Ho Chi Minh Mausoleum Tour", desc: "Visit the historic mausoleum and museum complex.", price: 35, duration: "3 hours", rating: 4.6, reviews: 5100, category: "Tours", image: "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=800&q=80" },
      { title: "Ninh Binh Day Trip", desc: "Visit the 'Halong Bay on land' with boat and bike.", price: 55, duration: "Full day", rating: 4.8, reviews: 6200, category: "Day Trips", image: "https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=800&q=80" },
    ],
    "ho chi minh": [
      { title: "Cu Chi Tunnels Tour", desc: "Explore the underground tunnel network from the Vietnam War.", price: 45, duration: "5 hours", rating: 4.8, reviews: 12500, category: "Tours", image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80" },
      { title: "Mekong Delta Day Trip", desc: "Cruise through floating markets and coconut villages.", price: 55, duration: "Full day", rating: 4.7, reviews: 9800, category: "Day Trips", image: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&q=80" },
      { title: "Saigon Street Food Tour", desc: "Taste banh mi, pho and local street delicacies.", price: 45, duration: "3.5 hours", rating: 4.9, reviews: 7200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800&q=80" },
      { title: "War Remnants Museum Tour", desc: "Learn about the Vietnam War at this powerful museum.", price: 25, duration: "2 hours", rating: 4.7, reviews: 5400, category: "Museums", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "Notre Dame & Central Post Office", desc: "See French colonial architecture in the city center.", price: 20, duration: "2 hours", rating: 4.5, reviews: 3800, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Cooking Class with Market Visit", desc: "Learn Vietnamese cooking with fresh market ingredients.", price: 55, duration: "4 hours", rating: 4.8, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80" },
    ],
    "siem reap": [
      { title: "Angkor Wat Sunrise Tour", desc: "Watch the sunrise over the world's largest religious monument.", price: 35, duration: "5 hours", rating: 4.9, reviews: 18500, category: "Landmarks", image: "https://images.unsplash.com/photo-1569580693643-b3b4c0bcb0c8?w=800&q=80" },
      { title: "Angkor Archaeological Park Full Day", desc: "Explore Angkor Wat, Bayon and Ta Prohm temples.", price: 55, duration: "Full day", rating: 4.8, reviews: 15200, category: "Tours", image: "https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=800&q=80" },
      { title: "Cambodian Cooking Class", desc: "Learn to cook amok and other Khmer dishes.", price: 35, duration: "4 hours", rating: 4.8, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=800&q=80" },
      { title: "Floating Village Tour", desc: "Visit the stilted homes of Tonle Sap Lake.", price: 45, duration: "4 hours", rating: 4.6, reviews: 5800, category: "Tours", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "Phare Circus Show", desc: "Watch amazing Cambodian acrobatics and storytelling.", price: 25, duration: "1.5 hours", rating: 4.9, reviews: 6200, category: "Entertainment", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80" },
      { title: "Countryside Bike Tour", desc: "Cycle through rice paddies and local villages.", price: 35, duration: "4 hours", rating: 4.7, reviews: 3100, category: "Adventure", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80" },
    ],
    jakarta: [
      { title: "Old Batavia Walking Tour", desc: "Explore Dutch colonial architecture in Kota Tua.", price: 25, duration: "3 hours", rating: 4.6, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&q=80" },
      { title: "Jakarta Food Tour", desc: "Taste sate, nasi goreng and local street food.", price: 45, duration: "3.5 hours", rating: 4.8, reviews: 3200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Thousand Islands Day Trip", desc: "Escape to tropical islands north of Jakarta.", price: 75, duration: "Full day", rating: 4.5, reviews: 2800, category: "Day Trips", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "National Monument & Museum", desc: "Visit Monas and learn about Indonesian history.", price: 20, duration: "2.5 hours", rating: 4.4, reviews: 3500, category: "Landmarks", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Istiqlal Mosque Tour", desc: "Explore Southeast Asia's largest mosque.", price: 15, duration: "1.5 hours", rating: 4.6, reviews: 2100, category: "Cultural", image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=800&q=80" },
      { title: "Bandung Highland Day Trip", desc: "Visit tea plantations and volcanic craters.", price: 65, duration: "Full day", rating: 4.7, reviews: 3800, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
    ],
    // INDIAN OCEAN
    mauritius: [
      { title: "Ile aux Cerfs Island Day Trip", desc: "Visit the stunning island with beach and water sports.", price: 75, duration: "Full day", rating: 4.7, reviews: 6800, category: "Day Trips", image: "https://images.unsplash.com/photo-1589979481223-deb893043163?w=800&q=80" },
      { title: "Chamarel Seven Colored Earth", desc: "See the unique geological formation and Chamarel Waterfall.", price: 55, duration: "5 hours", rating: 4.6, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80" },
      { title: "Catamaran Cruise with BBQ", desc: "Sail to islands with snorkeling and barbecue lunch.", price: 95, duration: "Full day", rating: 4.8, reviews: 4500, category: "Cruises", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Dolphin Watching & Snorkeling", desc: "Swim with dolphins in their natural habitat.", price: 65, duration: "4 hours", rating: 4.7, reviews: 3800, category: "Wildlife", image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80" },
      { title: "Black River Gorges Hiking", desc: "Hike through the national park's rainforest.", price: 45, duration: "5 hours", rating: 4.6, reviews: 2900, category: "Adventure", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Mauritian Cooking Class", desc: "Learn to cook creole cuisine with local chef.", price: 65, duration: "4 hours", rating: 4.8, reviews: 1800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
    ],
    seychelles: [
      { title: "Island Hopping Tour", desc: "Visit Praslin, La Digue and pristine beaches.", price: 145, duration: "Full day", rating: 4.8, reviews: 4500, category: "Day Trips", image: "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=800&q=80" },
      { title: "Vallee de Mai Nature Reserve", desc: "See the unique coco de mer palms in UNESCO forest.", price: 45, duration: "3 hours", rating: 4.7, reviews: 3200, category: "Nature", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Snorkeling & Beach Tour", desc: "Snorkel crystal waters and visit top beaches.", price: 85, duration: "Full day", rating: 4.6, reviews: 2800, category: "Adventure", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Victoria City Tour", desc: "Explore the world's smallest capital city.", price: 35, duration: "3 hours", rating: 4.5, reviews: 1800, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Sunset Catamaran Cruise", desc: "Sail along the coast with drinks at sunset.", price: 75, duration: "3 hours", rating: 4.8, reviews: 2100, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
      { title: "Giant Tortoise Experience", desc: "Visit and interact with giant Aldabra tortoises.", price: 45, duration: "2 hours", rating: 4.7, reviews: 2500, category: "Wildlife", image: "https://images.unsplash.com/photo-1559399690-02ad78a5f4c8?w=800&q=80" },
    ],
    "sri lanka": [
      { title: "Sigiriya Lion Rock Climb", desc: "Climb the ancient rock fortress with stunning views.", price: 55, duration: "4 hours", rating: 4.8, reviews: 8500, category: "Landmarks", image: "https://images.unsplash.com/photo-1588598198321-9735fd52dc68?w=800&q=80" },
      { title: "Kandy Temple & City Tour", desc: "Visit the Temple of the Tooth and explore Kandy.", price: 45, duration: "5 hours", rating: 4.7, reviews: 6200, category: "Tours", image: "https://images.unsplash.com/photo-1552423314-cf29ab68ad73?w=800&q=80" },
      { title: "Yala National Park Safari", desc: "Spot leopards and elephants on a wildlife safari.", price: 85, duration: "Full day", rating: 4.8, reviews: 5800, category: "Wildlife", image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80" },
      { title: "Train to Ella Scenic Journey", desc: "Take the famous scenic train through tea country.", price: 25, duration: "7 hours", rating: 4.9, reviews: 7200, category: "Adventure", image: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&q=80" },
      { title: "Tea Plantation & Factory Tour", desc: "Visit Ceylon tea estates and learn the process.", price: 35, duration: "3 hours", rating: 4.6, reviews: 4100, category: "Tours", image: "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?w=800&q=80" },
      { title: "Whale Watching in Mirissa", desc: "Spot blue whales and dolphins in the ocean.", price: 55, duration: "5 hours", rating: 4.5, reviews: 3500, category: "Wildlife", image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80" },
    ],
    // INDIA
    delhi: [
      { title: "Old & New Delhi Full Day Tour", desc: "Visit Red Fort, Jama Masjid, India Gate and more.", price: 45, duration: "Full day", rating: 4.7, reviews: 9800, category: "Tours", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80" },
      { title: "Taj Mahal Day Trip from Delhi", desc: "Visit the world's most beautiful monument.", price: 95, duration: "Full day", rating: 4.9, reviews: 15200, category: "Day Trips", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80" },
      { title: "Delhi Street Food Walk", desc: "Taste chaat, paranthas and Old Delhi specialties.", price: 35, duration: "3 hours", rating: 4.8, reviews: 5800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Qutub Minar & Mehrauli", desc: "Explore the medieval ruins and iconic tower.", price: 25, duration: "3 hours", rating: 4.6, reviews: 4200, category: "Landmarks", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80" },
      { title: "Humayun's Tomb & Lodhi Gardens", desc: "Visit the precursor to the Taj Mahal.", price: 25, duration: "3 hours", rating: 4.7, reviews: 3500, category: "Tours", image: "https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=800&q=80" },
      { title: "Cooking Class with Delhi Family", desc: "Learn authentic North Indian recipes.", price: 55, duration: "4 hours", rating: 4.9, reviews: 2800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
    ],
    mumbai: [
      { title: "Gateway of India & Elephanta Caves", desc: "See Mumbai's icon and ancient cave temples.", price: 55, duration: "6 hours", rating: 4.7, reviews: 7500, category: "Tours", image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80" },
      { title: "Dharavi Slum Tour", desc: "Respectful walking tour of Asia's largest slum.", price: 25, duration: "2.5 hours", rating: 4.8, reviews: 6200, category: "Tours", image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80" },
      { title: "Mumbai Street Food Tour", desc: "Taste vada pav, pav bhaji and local favorites.", price: 35, duration: "3 hours", rating: 4.9, reviews: 4800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Bollywood Studio Tour", desc: "Go behind the scenes of Indian cinema.", price: 45, duration: "4 hours", rating: 4.5, reviews: 3500, category: "Entertainment", image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80" },
      { title: "Dhobi Ghat & Local Markets", desc: "Visit the world's largest outdoor laundry.", price: 20, duration: "2 hours", rating: 4.4, reviews: 2800, category: "Tours", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80" },
      { title: "Marine Drive & Colonial Mumbai", desc: "Walk along the Queen's Necklace and heritage buildings.", price: 25, duration: "3 hours", rating: 4.6, reviews: 3200, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
    ],
    goa: [
      { title: "Old Goa Churches Tour", desc: "Visit UNESCO World Heritage Portuguese churches.", price: 35, duration: "4 hours", rating: 4.6, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1587922546307-776227941871?w=800&q=80" },
      { title: "Dudhsagar Waterfall Trip", desc: "Visit the spectacular four-tiered waterfall.", price: 55, duration: "Full day", rating: 4.7, reviews: 5200, category: "Adventure", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80" },
      { title: "Spice Plantation Tour", desc: "Explore a working spice farm with lunch.", price: 35, duration: "4 hours", rating: 4.5, reviews: 3800, category: "Tours", image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80" },
      { title: "Sunset Cruise on Mandovi", desc: "Cruise with live music and entertainment.", price: 25, duration: "2 hours", rating: 4.4, reviews: 4100, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
      { title: "Goan Cooking Class", desc: "Learn to cook fish curry and vindaloo.", price: 45, duration: "4 hours", rating: 4.8, reviews: 2500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
      { title: "Dolphin Spotting Cruise", desc: "Early morning cruise to see dolphins.", price: 25, duration: "2 hours", rating: 4.5, reviews: 3200, category: "Wildlife", image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80" },
    ],
    jaipur: [
      { title: "Amber Fort & Jaipur City Tour", desc: "Explore the magnificent fort and Pink City landmarks.", price: 45, duration: "Full day", rating: 4.8, reviews: 8500, category: "Tours", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80" },
      { title: "City Palace & Hawa Mahal", desc: "Visit the royal palace and Palace of Winds.", price: 25, duration: "3 hours", rating: 4.7, reviews: 6200, category: "Landmarks", image: "https://images.unsplash.com/photo-1557479915-92b9b3e3b7e2?w=800&q=80" },
      { title: "Elephant Ride at Amber Fort", desc: "Ride an elephant up to the hilltop fort.", price: 55, duration: "2 hours", rating: 4.4, reviews: 4500, category: "Adventure", image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80" },
      { title: "Jaipur Bazaar & Craft Tour", desc: "Shop for textiles, jewelry and handicrafts.", price: 35, duration: "4 hours", rating: 4.6, reviews: 3200, category: "Tours", image: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80" },
      { title: "Rajasthani Cooking Class", desc: "Learn traditional Rajasthani recipes.", price: 45, duration: "4 hours", rating: 4.8, reviews: 2100, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
      { title: "Block Printing Workshop", desc: "Learn the traditional art of block printing.", price: 35, duration: "3 hours", rating: 4.7, reviews: 1800, category: "Cultural", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
    ],
    agra: [
      { title: "Taj Mahal Sunrise Tour", desc: "Watch the sunrise over the world's most beautiful monument.", price: 45, duration: "3 hours", rating: 4.9, reviews: 22000, category: "Landmarks", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80" },
      { title: "Taj Mahal & Agra Fort", desc: "Visit both UNESCO sites with expert guide.", price: 55, duration: "5 hours", rating: 4.8, reviews: 18500, category: "Tours", image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80" },
      { title: "Fatehpur Sikri Day Trip", desc: "Explore the abandoned Mughal capital.", price: 45, duration: "4 hours", rating: 4.6, reviews: 4500, category: "Day Trips", image: "https://images.unsplash.com/photo-1553697388-94e804e2f0f6?w=800&q=80" },
      { title: "Mehtab Bagh Sunset View", desc: "Watch the Taj Mahal at sunset from across the river.", price: 25, duration: "2 hours", rating: 4.7, reviews: 3800, category: "Tours", image: "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=800&q=80" },
      { title: "Agra Food Walk", desc: "Taste Mughlai cuisine and local specialties.", price: 35, duration: "3 hours", rating: 4.7, reviews: 2500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Marble Inlay Workshop", desc: "Learn the art of pietra dura marble inlay.", price: 35, duration: "2 hours", rating: 4.5, reviews: 1800, category: "Cultural", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
    ],
    // OCEANIA
    sydney: [
      { title: "Sydney Opera House Tour", desc: "Go behind the scenes of Australia's most iconic building.", price: 35, duration: "1 hour", rating: 4.8, reviews: 15200, category: "Landmarks", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80" },
      { title: "Harbour Bridge Climb", desc: "Climb to the top of the Sydney Harbour Bridge.", price: 195, duration: "3.5 hours", rating: 4.9, reviews: 8500, category: "Adventure", image: "https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=800&q=80" },
      { title: "Blue Mountains Day Trip", desc: "See the Three Sisters and explore ancient rainforest.", price: 95, duration: "Full day", rating: 4.7, reviews: 11200, category: "Day Trips", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" },
      { title: "Sydney Harbour Cruise", desc: "Cruise past the Opera House and Harbour Bridge.", price: 45, duration: "2 hours", rating: 4.6, reviews: 9800, category: "Cruises", image: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80" },
      { title: "Bondi to Coogee Coastal Walk", desc: "Guided walk along Sydney's famous coastal path.", price: 35, duration: "3 hours", rating: 4.7, reviews: 5400, category: "Tours", image: "https://images.unsplash.com/photo-1591019052241-e4d95a7a4df0?w=800&q=80" },
      { title: "Taronga Zoo with Ferry", desc: "Visit the zoo with stunning harbour views.", price: 55, duration: "4 hours", rating: 4.6, reviews: 7200, category: "Wildlife", image: "https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800&q=80" },
    ],
    melbourne: [
      { title: "Great Ocean Road Day Trip", desc: "See the 12 Apostles and stunning coastal scenery.", price: 95, duration: "Full day", rating: 4.8, reviews: 14500, category: "Day Trips", image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80" },
      { title: "Melbourne Laneways & Street Art", desc: "Explore the famous graffiti-covered laneways.", price: 35, duration: "3 hours", rating: 4.7, reviews: 8200, category: "Tours", image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&q=80" },
      { title: "Yarra Valley Wine Tour", desc: "Taste wines at premium wineries with lunch.", price: 125, duration: "Full day", rating: 4.8, reviews: 6500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80" },
      { title: "Phillip Island Penguin Parade", desc: "Watch little penguins come ashore at sunset.", price: 95, duration: "6 hours", rating: 4.7, reviews: 9800, category: "Wildlife", image: "https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800&q=80" },
      { title: "Melbourne Food & Coffee Tour", desc: "Explore the city's world-famous coffee and food scene.", price: 75, duration: "3.5 hours", rating: 4.9, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80" },
      { title: "Queen Victoria Market Tour", desc: "Explore Melbourne's iconic historic market.", price: 35, duration: "2 hours", rating: 4.6, reviews: 3800, category: "Tours", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    brisbane: [
      { title: "Lone Pine Koala Sanctuary", desc: "Cuddle koalas and feed kangaroos.", price: 45, duration: "3 hours", rating: 4.8, reviews: 9200, category: "Wildlife", image: "https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800&q=80" },
      { title: "Gold Coast Day Trip", desc: "Visit beaches, theme parks and Surfers Paradise.", price: 75, duration: "Full day", rating: 4.6, reviews: 5800, category: "Day Trips", image: "https://images.unsplash.com/photo-1524820197278-540916411e20?w=800&q=80" },
      { title: "Brisbane River Cruise", desc: "Cruise past the city's landmarks and Story Bridge.", price: 35, duration: "1.5 hours", rating: 4.5, reviews: 3500, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
      { title: "Australia Zoo Day Trip", desc: "Visit the Irwin family's famous wildlife park.", price: 95, duration: "Full day", rating: 4.9, reviews: 7500, category: "Wildlife", image: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef3?w=800&q=80" },
      { title: "Mount Tamborine Rainforest", desc: "Explore rainforest, galleries and wineries.", price: 85, duration: "Full day", rating: 4.6, reviews: 4200, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Brisbane Food Tour", desc: "Taste multicultural cuisine and craft beer.", price: 75, duration: "3.5 hours", rating: 4.7, reviews: 2800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    cairns: [
      { title: "Great Barrier Reef Snorkel & Dive", desc: "Explore the world's largest coral reef system.", price: 185, duration: "Full day", rating: 4.9, reviews: 22000, category: "Adventure", image: "https://images.unsplash.com/photo-1587139223877-04cb899fa3e8?w=800&q=80" },
      { title: "Daintree Rainforest Day Trip", desc: "Explore the world's oldest tropical rainforest.", price: 145, duration: "Full day", rating: 4.8, reviews: 8500, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Kuranda Scenic Railway", desc: "Travel through rainforest on the historic railway.", price: 55, duration: "4 hours", rating: 4.7, reviews: 6200, category: "Tours", image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80" },
      { title: "Reef & Rainforest Combo", desc: "See both the reef and rainforest in one day.", price: 245, duration: "Full day", rating: 4.8, reviews: 4500, category: "Adventure", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Atherton Tablelands Tour", desc: "Visit waterfalls, volcanic lakes and wildlife.", price: 125, duration: "Full day", rating: 4.7, reviews: 3800, category: "Day Trips", image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80" },
      { title: "Sunset Sailing Cruise", desc: "Sail the Trinity Inlet at golden hour.", price: 85, duration: "3 hours", rating: 4.6, reviews: 2500, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
    ],
    auckland: [
      { title: "Hobbiton Movie Set Tour", desc: "Visit the real Shire from Lord of the Rings.", price: 145, duration: "Full day", rating: 4.9, reviews: 15200, category: "Tours", image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80" },
      { title: "Sky Tower & SkyWalk", desc: "Walk around the outside of the iconic tower.", price: 85, duration: "1.5 hours", rating: 4.7, reviews: 6800, category: "Adventure", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "Waitomo Glowworm Caves", desc: "Boat through caves lit by thousands of glowworms.", price: 125, duration: "Full day", rating: 4.8, reviews: 9500, category: "Day Trips", image: "https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80" },
      { title: "Waiheke Island Wine Tour", desc: "Taste wines on Auckland's beautiful wine island.", price: 145, duration: "Full day", rating: 4.8, reviews: 5200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80" },
      { title: "Harbour Sailing Experience", desc: "Sail Auckland's stunning harbour.", price: 95, duration: "3 hours", rating: 4.6, reviews: 3800, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
      { title: "Auckland Food Tour", desc: "Taste the city's multicultural food scene.", price: 85, duration: "3.5 hours", rating: 4.7, reviews: 2500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    queenstown: [
      { title: "Milford Sound Day Cruise", desc: "Cruise through New Zealand's most stunning fiord.", price: 195, duration: "Full day", rating: 4.9, reviews: 18500, category: "Day Trips", image: "https://images.unsplash.com/photo-1589871973318-9ca1258faa5d?w=800&q=80" },
      { title: "Bungy Jump Original", desc: "Jump from the world's first commercial bungy site.", price: 175, duration: "2 hours", rating: 4.8, reviews: 8200, category: "Adventure", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Skyline Gondola & Luge", desc: "Ride up for views and race down on luge carts.", price: 55, duration: "2 hours", rating: 4.7, reviews: 11500, category: "Adventure", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "Jet Boat Shotover Canyon", desc: "High-speed jet boat through narrow canyon.", price: 125, duration: "1 hour", rating: 4.8, reviews: 7500, category: "Adventure", image: "https://images.unsplash.com/photo-1517236837996-341737c5b5bc?w=800&q=80" },
      { title: "Wine & Cheese Tour", desc: "Visit Central Otago wineries and artisan cheese.", price: 145, duration: "4 hours", rating: 4.7, reviews: 4200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80" },
      { title: "Lord of the Rings Tour", desc: "Visit film locations around Queenstown.", price: 175, duration: "Full day", rating: 4.8, reviews: 5800, category: "Tours", image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80" },
    ],
    // AMERICAS
    "new york": [
      { title: "Statue of Liberty & Ellis Island", desc: "Visit Lady Liberty with pedestal access.", price: 45, duration: "4 hours", rating: 4.8, reviews: 28500, category: "Landmarks", image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=800&q=80" },
      { title: "Empire State Building Observatory", desc: "See NYC from the iconic 86th floor observatory.", price: 45, duration: "1.5 hours", rating: 4.7, reviews: 22000, category: "Landmarks", image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80" },
      { title: "Broadway Show Tickets", desc: "See a hit Broadway musical on the Great White Way.", price: 125, duration: "3 hours", rating: 4.9, reviews: 15200, category: "Entertainment", image: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=800&q=80" },
      { title: "Central Park Bike Tour", desc: "Cycle through Manhattan's iconic green space.", price: 45, duration: "2 hours", rating: 4.6, reviews: 8500, category: "Tours", image: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80" },
      { title: "NYC Pizza Walking Tour", desc: "Taste the best pizza in Brooklyn and Manhattan.", price: 65, duration: "3 hours", rating: 4.8, reviews: 6200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80" },
      { title: "9/11 Memorial & Museum", desc: "Visit the moving tribute to September 11.", price: 35, duration: "2 hours", rating: 4.9, reviews: 18500, category: "Museums", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
    ],
    "los angeles": [
      { title: "Hollywood Sign & Griffith Tour", desc: "Hike to the best views of the Hollywood Sign.", price: 55, duration: "3 hours", rating: 4.7, reviews: 9800, category: "Tours", image: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800&q=80" },
      { title: "Universal Studios Hollywood", desc: "Full day of movie magic and thrilling rides.", price: 125, duration: "Full day", rating: 4.8, reviews: 22000, category: "Theme Parks", image: "https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=800&q=80" },
      { title: "Celebrity Homes & Hollywood", desc: "See where the stars live in Beverly Hills.", price: 55, duration: "2 hours", rating: 4.5, reviews: 8200, category: "Tours", image: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&q=80" },
      { title: "Santa Monica & Venice Beach", desc: "Explore the iconic beaches and boardwalks.", price: 45, duration: "4 hours", rating: 4.6, reviews: 5500, category: "Tours", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "Warner Bros Studio Tour", desc: "Go behind the scenes of movies and TV shows.", price: 75, duration: "3 hours", rating: 4.8, reviews: 7500, category: "Tours", image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80" },
      { title: "LA Food Truck Tour", desc: "Taste the best of LA's famous food truck scene.", price: 85, duration: "3.5 hours", rating: 4.7, reviews: 3200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    "san francisco": [
      { title: "Alcatraz Island Tour", desc: "Visit the infamous former prison with audio tour.", price: 45, duration: "3 hours", rating: 4.9, reviews: 25000, category: "Tours", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80" },
      { title: "Golden Gate Bridge Bike Tour", desc: "Cycle across the iconic bridge to Sausalito.", price: 55, duration: "3 hours", rating: 4.8, reviews: 12200, category: "Tours", image: "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&q=80" },
      { title: "Napa Valley Wine Tour", desc: "Taste world-class wines in California wine country.", price: 145, duration: "Full day", rating: 4.8, reviews: 8500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80" },
      { title: "Chinatown Walking Tour", desc: "Explore America's oldest Chinatown.", price: 35, duration: "2 hours", rating: 4.6, reviews: 4800, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Muir Woods & Sausalito", desc: "See giant redwoods and charming waterfront town.", price: 85, duration: "4 hours", rating: 4.7, reviews: 6500, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
      { title: "SF Food Tour: Mission District", desc: "Taste tacos, burritos and SF specialties.", price: 75, duration: "3 hours", rating: 4.8, reviews: 3800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    "las vegas": [
      { title: "Grand Canyon South Rim Day Trip", desc: "Visit one of the world's greatest natural wonders.", price: 95, duration: "Full day", rating: 4.8, reviews: 18500, category: "Day Trips", image: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800&q=80" },
      { title: "Grand Canyon Helicopter Tour", desc: "Fly over the canyon with champagne landing.", price: 395, duration: "4 hours", rating: 4.9, reviews: 9200, category: "Adventure", image: "https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=800&q=80" },
      { title: "Cirque du Soleil Show", desc: "See a world-famous Cirque production.", price: 125, duration: "2 hours", rating: 4.8, reviews: 12500, category: "Entertainment", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80" },
      { title: "High Roller Observation Wheel", desc: "See Vegas from the world's tallest wheel.", price: 35, duration: "30 minutes", rating: 4.5, reviews: 8500, category: "Landmarks", image: "https://images.unsplash.com/photo-1581351721010-8cf859cb14a4?w=800&q=80" },
      { title: "Hoover Dam Tour", desc: "Visit the engineering marvel on the Colorado River.", price: 65, duration: "4 hours", rating: 4.6, reviews: 7200, category: "Tours", image: "https://images.unsplash.com/photo-1544944379-824f9847e37e?w=800&q=80" },
      { title: "Vegas Strip Food Tour", desc: "Taste celebrity chef restaurants and hidden gems.", price: 125, duration: "3.5 hours", rating: 4.7, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
    ],
    miami: [
      { title: "Everglades Airboat Adventure", desc: "Speed through the Everglades and spot gators.", price: 55, duration: "4 hours", rating: 4.7, reviews: 11500, category: "Adventure", image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=800&q=80" },
      { title: "Art Deco Walking Tour", desc: "Explore the colorful architecture of South Beach.", price: 35, duration: "2 hours", rating: 4.6, reviews: 5800, category: "Tours", image: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&q=80" },
      { title: "Key West Day Trip", desc: "Visit the southernmost point of the USA.", price: 75, duration: "Full day", rating: 4.5, reviews: 7200, category: "Day Trips", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "Little Havana Food Tour", desc: "Taste Cuban cuisine and experience Cuban culture.", price: 65, duration: "2.5 hours", rating: 4.8, reviews: 4500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Wynwood Walls & Art District", desc: "See world-famous street art and galleries.", price: 35, duration: "2 hours", rating: 4.7, reviews: 6200, category: "Tours", image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&q=80" },
      { title: "Miami Beach Cruise", desc: "Cruise past celebrity mansions and Star Island.", price: 35, duration: "1.5 hours", rating: 4.5, reviews: 8500, category: "Cruises", image: "https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80" },
    ],
    orlando: [
      { title: "Walt Disney World Tickets", desc: "Experience the magic at the most magical place on earth.", price: 125, duration: "Full day", rating: 4.9, reviews: 45000, category: "Theme Parks", image: "https://images.unsplash.com/photo-1575389819108-6a2bd4c14f3f?w=800&q=80" },
      { title: "Universal Orlando Tickets", desc: "Visit Wizarding World and amazing attractions.", price: 125, duration: "Full day", rating: 4.8, reviews: 28500, category: "Theme Parks", image: "https://images.unsplash.com/photo-1598153346810-860daa814c4b?w=800&q=80" },
      { title: "Kennedy Space Center", desc: "Explore NASA's launch headquarters.", price: 75, duration: "Full day", rating: 4.8, reviews: 15200, category: "Museums", image: "https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=800&q=80" },
      { title: "SeaWorld Orlando", desc: "Marine life encounters and thrilling rides.", price: 95, duration: "Full day", rating: 4.5, reviews: 12500, category: "Theme Parks", image: "https://images.unsplash.com/photo-1568430462989-44163eb1752f?w=800&q=80" },
      { title: "Airboat Ride & Gator Park", desc: "Ride through wetlands and hold a baby gator.", price: 55, duration: "4 hours", rating: 4.6, reviews: 6800, category: "Adventure", image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=800&q=80" },
      { title: "Disney Springs Evening", desc: "Dining, shopping and entertainment at Disney Springs.", price: 25, duration: "4 hours", rating: 4.4, reviews: 5200, category: "Entertainment", image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80" },
    ],
    chicago: [
      { title: "Architecture River Cruise", desc: "Learn about Chicago's famous architecture from the water.", price: 55, duration: "1.5 hours", rating: 4.9, reviews: 18500, category: "Cruises", image: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80" },
      { title: "Skydeck Ledge Experience", desc: "Step onto the glass floor 103 stories up.", price: 35, duration: "1 hour", rating: 4.7, reviews: 12200, category: "Landmarks", image: "https://images.unsplash.com/photo-1581373449483-37449f962b6c?w=800&q=80" },
      { title: "Chicago Deep Dish Pizza Tour", desc: "Taste the best deep dish pizzas in the city.", price: 65, duration: "3 hours", rating: 4.8, reviews: 5800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80" },
      { title: "Art Institute of Chicago Tour", desc: "See masterpieces with an expert art guide.", price: 45, duration: "2.5 hours", rating: 4.8, reviews: 6500, category: "Museums", image: "https://images.unsplash.com/photo-1580995858132-4f77cb6a4e9b?w=800&q=80" },
      { title: "Millennium Park & Bean Tour", desc: "Explore the park and iconic Cloud Gate sculpture.", price: 25, duration: "2 hours", rating: 4.6, reviews: 8200, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Gangster & Crime Tour", desc: "Learn about Capone and Chicago's mob history.", price: 35, duration: "2 hours", rating: 4.5, reviews: 4500, category: "Tours", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
    ],
    cancun: [
      { title: "Chichen Itza Day Trip", desc: "Visit the ancient Mayan pyramid and wonder of the world.", price: 75, duration: "Full day", rating: 4.8, reviews: 22000, category: "Day Trips", image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800&q=80" },
      { title: "Xcaret Eco Park", desc: "Snorkel underground rivers and see cultural shows.", price: 125, duration: "Full day", rating: 4.9, reviews: 15200, category: "Theme Parks", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80" },
      { title: "Isla Mujeres Catamaran", desc: "Sail to the island with snorkeling and open bar.", price: 85, duration: "Full day", rating: 4.7, reviews: 9800, category: "Cruises", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "Cenote Snorkeling Adventure", desc: "Swim in crystal-clear underground sinkholes.", price: 65, duration: "5 hours", rating: 4.8, reviews: 7500, category: "Adventure", image: "https://images.unsplash.com/photo-1562979314-bee7453e911c?w=800&q=80" },
      { title: "Tulum Ruins & Beach", desc: "Explore clifftop Mayan ruins and swim below.", price: 75, duration: "Full day", rating: 4.7, reviews: 11500, category: "Day Trips", image: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=800&q=80" },
      { title: "Mexican Cooking Class", desc: "Learn to make tacos, mole and Mexican classics.", price: 75, duration: "4 hours", rating: 4.8, reviews: 3200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
    ],
    "rio de janeiro": [
      { title: "Christ the Redeemer Tour", desc: "Visit the iconic statue atop Corcovado mountain.", price: 55, duration: "4 hours", rating: 4.9, reviews: 18500, category: "Landmarks", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80" },
      { title: "Sugarloaf Mountain Cable Car", desc: "Take the iconic cable car for panoramic views.", price: 45, duration: "3 hours", rating: 4.8, reviews: 14200, category: "Landmarks", image: "https://images.unsplash.com/photo-1516834474-48c0abc2a902?w=800&q=80" },
      { title: "Favela Tour with Local Guide", desc: "Experience favela life with a community guide.", price: 45, duration: "3 hours", rating: 4.7, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80" },
      { title: "Copacabana & Ipanema Walk", desc: "Explore Rio's famous beaches and neighborhoods.", price: 35, duration: "3 hours", rating: 4.5, reviews: 5200, category: "Tours", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80" },
      { title: "Brazilian BBQ & Caipirinha", desc: "Feast on churrasco and learn to make caipirinhas.", price: 85, duration: "4 hours", rating: 4.8, reviews: 3500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Tijuca Rainforest Hike", desc: "Hike through the world's largest urban forest.", price: 55, duration: "5 hours", rating: 4.6, reviews: 2800, category: "Adventure", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
    ],
    "buenos aires": [
      { title: "Tango Show with Dinner", desc: "Experience passionate tango with Argentine dinner.", price: 95, duration: "4 hours", rating: 4.8, reviews: 11200, category: "Entertainment", image: "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800&q=80" },
      { title: "San Telmo & La Boca Walking Tour", desc: "Explore colorful neighborhoods and street markets.", price: 35, duration: "3.5 hours", rating: 4.7, reviews: 7500, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Tango Dance Class", desc: "Learn the basics of Argentine tango.", price: 45, duration: "2 hours", rating: 4.6, reviews: 4800, category: "Cultural", image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80" },
      { title: "Argentine Steak & Wine Tour", desc: "Taste the best beef and Malbec in the city.", price: 85, duration: "4 hours", rating: 4.9, reviews: 5200, category: "Food & Drink", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80" },
      { title: "Recoleta Cemetery Tour", desc: "Visit the ornate cemetery with famous graves.", price: 25, duration: "2 hours", rating: 4.5, reviews: 6800, category: "Tours", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80" },
      { title: "Tigre Delta Day Trip", desc: "Cruise through the beautiful river delta.", price: 65, duration: "Full day", rating: 4.6, reviews: 3800, category: "Day Trips", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80" },
    ],
    cusco: [
      { title: "Machu Picchu Full Day Tour", desc: "Visit the ancient Incan citadel with expert guide.", price: 195, duration: "Full day", rating: 4.9, reviews: 28500, category: "Landmarks", image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80" },
      { title: "Sacred Valley Tour", desc: "Explore Incan ruins, markets and villages.", price: 65, duration: "Full day", rating: 4.8, reviews: 12200, category: "Day Trips", image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&q=80" },
      { title: "Rainbow Mountain Hike", desc: "Trek to the colorful Vinicunca mountain.", price: 55, duration: "Full day", rating: 4.6, reviews: 8500, category: "Adventure", image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80" },
      { title: "Cusco City Walking Tour", desc: "Explore Incan walls, colonial churches and plazas.", price: 25, duration: "3 hours", rating: 4.7, reviews: 5800, category: "Tours", image: "https://images.unsplash.com/photo-1558618107-5e92ea04c03f?w=800&q=80" },
      { title: "Peruvian Cooking Class", desc: "Learn to make ceviche and pisco sour.", price: 55, duration: "4 hours", rating: 4.8, reviews: 3500, category: "Food & Drink", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80" },
      { title: "Moray & Salt Mines Tour", desc: "Visit the circular terraces and ancient salt mines.", price: 45, duration: "5 hours", rating: 4.7, reviews: 4200, category: "Tours", image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=800&q=80" },
    ],
  };

  // Generic fallback for unknown destinations
  const genericActivities = [
    { title: `${destination} City Highlights Tour`, desc: `Discover the main attractions and landmarks of ${destination} with an expert local guide.`, price: 55, duration: "4 hours", rating: 4.6, reviews: 2500, category: "Tours", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80" },
    { title: `${destination} Food and Culture Experience`, desc: `Taste authentic local cuisine and learn about the culture and traditions.`, price: 65, duration: "3 hours", rating: 4.7, reviews: 1800, category: "Food & Drink", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" },
    { title: `${destination} Hidden Gems Walking Tour`, desc: `Explore off-the-beaten-path locations with a knowledgeable local guide.`, price: 45, duration: "3 hours", rating: 4.8, reviews: 1200, category: "Tours", image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80" },
    { title: `${destination} Day Trip Adventure`, desc: `Full-day excursion to the most scenic spots around ${destination}.`, price: 85, duration: "Full day", rating: 4.5, reviews: 980, category: "Day Trips", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80" },
    { title: `${destination} Sunset Experience`, desc: `Enjoy spectacular sunset views at the best vantage point in ${destination}.`, price: 40, duration: "2 hours", rating: 4.6, reviews: 1500, category: "Tours", image: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=800&q=80" },
    { title: `${destination} Local Market Tour`, desc: `Immerse yourself in local life at traditional markets with a guide.`, price: 35, duration: "2.5 hours", rating: 4.7, reviews: 890, category: "Cultural", image: "https://images.unsplash.com/photo-1555529669-2269763671c0?w=800&q=80" },
    { title: `${destination} Photography Tour`, desc: `Capture the best shots of ${destination} with a professional photographer guide.`, price: 75, duration: "3 hours", rating: 4.8, reviews: 650, category: "Tours", image: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&q=80" },
    { title: `${destination} Evening Entertainment`, desc: `Experience the best nightlife and entertainment ${destination} has to offer.`, price: 60, duration: "3 hours", rating: 4.4, reviews: 720, category: "Entertainment", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80" },
  ];

  // Find matching destination data
  let activities = genericActivities;
  for (const [key, data] of Object.entries(fallbackData)) {
    if (destLower.includes(key)) {
      activities = data;
      break;
    }
  }

  // Convert to ActivityOffer format
  return activities.slice(0, limit).map((a, idx) => ({
    id: `klook-fallback-${destLower}-${idx}`,
    provider: "klook",
    providerProductCode: `klook-${destLower}-${idx}`,
    title: cleanActivityTitle(a.title),
    description: a.desc,
    shortDescription: a.desc,
    images: [{ url: a.image, caption: a.title }],
    duration: a.duration,
    price: { amount: a.price, currency },
    pricePerPerson: { amount: a.price, currency },
    rating: a.rating,
    reviewCount: a.reviews,
    categories: [a.category],
    tags: [],
    includes: [],
    excludes: [],
    meetingPoint: undefined,
    bookingUrl: buildKlookAffiliateUrl(`/search/?query=${encodeURIComponent(destination)}`),
  }));
}

/**
 * Check if Klook is available (always true for web scraping approach)
 */
export function isKlookAvailable(): boolean {
  return true;
}

/**
 * Get single activity (not supported via scraping - returns null)
 */
export async function getActivity(_productCode: string): Promise<ActivityOffer | null> {
  // Single activity fetch not supported via web scraping
  return null;
}
