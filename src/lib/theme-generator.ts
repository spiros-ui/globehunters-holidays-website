import type { AttractionDetail } from "./opentripmap";
import { getPrimaryCategory } from "./opentripmap";

interface ThemeResult {
  name: string;
  theme: string;
  tagline: string;
}

const THEME_TEMPLATES: Record<string, { names: string[]; taglines: string[] }> = {
  "Culture & Arts": {
    names: ["{city} Art & Culture Escape", "{city} Cultural Discovery", "{city} Heritage Journey"],
    taglines: [
      "Immerse yourself in world-class art and culture",
      "Discover centuries of cultural heritage",
      "Experience the artistic soul of {city}",
    ],
  },
  "Historic Sites": {
    names: ["{city} History Explorer", "{city} Heritage Trail", "{city} Ancient Wonders"],
    taglines: [
      "Walk through centuries of history",
      "Discover the stories behind the landmarks",
      "Explore {city}'s fascinating past",
    ],
  },
  Architecture: {
    names: ["{city} Architectural Marvels", "{city} Skyline & Landmarks", "{city} Grand Tour"],
    taglines: [
      "Marvel at iconic architectural masterpieces",
      "From ancient to modern — stunning design awaits",
      "Discover {city}'s most impressive structures",
    ],
  },
  "Nature & Parks": {
    names: ["{city} Nature & Adventure", "{city} Green Escape", "{city} Outdoor Explorer"],
    taglines: [
      "Escape into nature's beauty",
      "Discover breathtaking natural landscapes",
      "Adventure awaits in {city}'s great outdoors",
    ],
  },
  "Religious Sites": {
    names: ["{city} Sacred Heritage", "{city} Spiritual Journey", "{city} Temple & Church Trail"],
    taglines: [
      "Visit stunning sacred monuments",
      "A journey through spiritual heritage",
      "Discover architectural and spiritual wonders",
    ],
  },
  Entertainment: {
    names: ["{city} Fun & Entertainment", "{city} Thrill Seeker", "{city} City Vibes"],
    taglines: [
      "Non-stop fun and entertainment",
      "Experience the best of {city}'s nightlife and attractions",
      "Thrills, laughs, and unforgettable moments",
    ],
  },
  Museums: {
    names: ["{city} Museum Discovery", "{city} Knowledge Quest", "{city} Art & Museum Trail"],
    taglines: [
      "Explore world-renowned collections",
      "A treasure trove of knowledge and art",
      "From ancient artifacts to modern masterpieces",
    ],
  },
  default: {
    names: ["{city} Explorer", "{city} Discovery Package", "{city} All-Inclusive Experience"],
    taglines: [
      "Discover the best of {city}",
      "Your perfect {city} getaway",
      "Everything you need for an unforgettable trip",
    ],
  },
};

/**
 * Generate a themed package name based on attractions available at the destination
 */
export function generatePackageTheme(
  city: string,
  attractions: AttractionDetail[],
  packageIndex: number = 0
): ThemeResult {
  // Count categories
  const categoryCounts: Record<string, number> = {};
  for (const attraction of attractions) {
    const category = getPrimaryCategory(attraction.kinds);
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  }

  // Find dominant category
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedCategories[0]?.[0] || "default";

  // Get templates
  const templates = THEME_TEMPLATES[topCategory] || THEME_TEMPLATES.default;

  // Use packageIndex to vary names across packages for the same destination
  const nameIdx = packageIndex % templates.names.length;
  const taglineIdx = packageIndex % templates.taglines.length;

  const name = templates.names[nameIdx].replace("{city}", city);
  const tagline = templates.taglines[taglineIdx].replace("{city}", city);

  return {
    name,
    theme: topCategory,
    tagline,
  };
}

/**
 * Generate a short description based on top attraction
 */
export function generateThemeDescription(
  city: string,
  attractions: AttractionDetail[]
): string {
  if (attractions.length === 0) {
    return `Explore the best of ${city} with flights, hotel, and optional tours.`;
  }

  const topAttractionNames = attractions
    .slice(0, 3)
    .map((a) => a.name)
    .filter(Boolean);

  if (topAttractionNames.length === 0) {
    return `Discover ${city} with hand-picked accommodation and flights.`;
  }

  if (topAttractionNames.length === 1) {
    return `Experience ${city} including visits to ${topAttractionNames[0]} and more.`;
  }

  const last = topAttractionNames.pop();
  return `Discover ${city} — visit ${topAttractionNames.join(", ")} and ${last}.`;
}
