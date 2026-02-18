import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// On Vercel, the project filesystem is read-only — use /tmp for writes.
// Locally, use the project's data/ directory.
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel
  ? join("/tmp", "data")
  : join(process.cwd(), "data");
const SETTINGS_PATH = join(DATA_DIR, "admin-settings.json");

// Also check the bundled (read-only) copy for initial defaults on Vercel
const BUNDLED_SETTINGS_PATH = join(process.cwd(), "data", "admin-settings.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

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
    // PRIORITY 1: Environment variable (works reliably across all Vercel Lambdas)
    const envMarkup = process.env.ADMIN_MARKUP;
    if (envMarkup) {
      try {
        const markup = JSON.parse(envMarkup);
        return { ...DEFAULT_SETTINGS, markup: { ...DEFAULT_SETTINGS.markup, ...markup } };
      } catch {
        // Invalid JSON in env var, fall through
      }
    }

    ensureDataDir();
    // PRIORITY 2: Writable /tmp path (same Lambda instance only)
    if (existsSync(SETTINGS_PATH)) {
      const data = readFileSync(SETTINGS_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    // PRIORITY 3: Bundled read-only copy (committed to repo)
    if (existsSync(BUNDLED_SETTINGS_PATH)) {
      const data = readFileSync(BUNDLED_SETTINGS_PATH, "utf-8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
    // Create default file
    writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAdminSettings(settings: Partial<AdminSettings>): AdminSettings {
  ensureDataDir();
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
