import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const SETTINGS_PATH = join(process.cwd(), "data", "admin-settings.json");

export interface AdminSettings {
  markup: {
    flights: number;
    hotels: number;
    tours: number;
    packages: number;
  };
  password: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  markup: {
    flights: 0,
    hotels: 0,
    tours: 0,
    packages: 0,
  },
  password: "globehunters2024",
};

export function getAdminSettings(): AdminSettings {
  try {
    if (!existsSync(SETTINGS_PATH)) {
      writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
      return DEFAULT_SETTINGS;
    }
    const data = readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAdminSettings(settings: Partial<AdminSettings>): AdminSettings {
  const current = getAdminSettings();
  const updated: AdminSettings = {
    ...current,
    ...settings,
    markup: {
      ...current.markup,
      ...(settings.markup || {}),
    },
  };
  writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2));
  return updated;
}

export function verifyPassword(password: string): boolean {
  const settings = getAdminSettings();
  return password === settings.password;
}

/**
 * Apply admin markup percentage to a base price.
 * Positive values = markup, negative values = markdown.
 * Returns the adjusted price.
 */
export function applyAdminMarkup(
  basePrice: number,
  category: "flights" | "hotels" | "tours" | "packages"
): number {
  const settings = getAdminSettings();
  const markupPercent = settings.markup[category] || 0;
  return Math.round((basePrice * (1 + markupPercent / 100)) * 100) / 100;
}
