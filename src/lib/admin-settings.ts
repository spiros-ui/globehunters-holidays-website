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
    // PRIORITY 1: Environment variable (persistent across all Vercel Lambdas)
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

/**
 * Persist markup settings to Vercel env var so they survive across Lambda instances.
 * Also updates the in-process env var for immediate effect in the current instance.
 */
export async function persistMarkupToVercel(markup: AdminSettings["markup"]): Promise<boolean> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token || !projectId) return false;

  const markupJson = JSON.stringify(markup);

  // Update in-process env var for immediate reads on this Lambda
  process.env.ADMIN_MARKUP = markupJson;

  try {
    const teamQuery = teamId ? `?teamId=${teamId}` : "";

    // Check if ADMIN_MARKUP env var already exists
    const listRes = await fetch(
      `https://api.vercel.com/v9/projects/${projectId}/env${teamQuery}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();
    const existing = listData.envs?.find((e: { key: string }) => e.key === "ADMIN_MARKUP");

    if (existing) {
      // Update existing env var
      await fetch(
        `https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}${teamQuery}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: markupJson }),
        }
      );
    } else {
      // Create new env var
      await fetch(
        `https://api.vercel.com/v10/projects/${projectId}/env${teamQuery}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "ADMIN_MARKUP",
            value: markupJson,
            type: "plain",
            target: ["production"],
          }),
        }
      );
    }

    // Trigger a redeployment so all new Lambdas pick up the env var
    const deploymentsRes = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&target=production${teamId ? `&teamId=${teamId}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const deploymentsData = await deploymentsRes.json();
    const latestDeployment = deploymentsData.deployments?.[0];

    if (latestDeployment) {
      await fetch(
        `https://api.vercel.com/v13/deployments${teamQuery}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "globehunters-holidays-website",
            deploymentId: latestDeployment.uid,
            target: "production",
          }),
        }
      );
    }

    return true;
  } catch (err) {
    console.error("Failed to persist markup to Vercel:", err);
    return false;
  }
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
