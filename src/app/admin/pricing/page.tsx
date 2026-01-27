"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Plane,
  Building,
  Compass,
  Package,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";

interface MarkupSettings {
  flights: number;
  hotels: number;
  tours: number;
  packages: number;
}

export default function PricingPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [markup, setMarkup] = useState<MarkupSettings>({
    flights: 0,
    hotels: 0,
    tours: 0,
    packages: 0,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-password");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
      loadSettings(stored);
    }
  }, []);

  const loadSettings = async (pwd: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { "x-admin-password": pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setMarkup(data.markup);
      }
    } catch {
      // Use defaults
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        sessionStorage.setItem("admin-password", password);
        setAuthenticated(true);
        await loadSettings(password);
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ markup }),
      });

      if (res.ok) {
        setSuccess("Settings saved successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Connection error");
    } finally {
      setSaving(false);
    }
  };

  // Login gate
  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-12">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter the admin password to manage pricing
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Admin password"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mb-3 flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Authenticate"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const categories = [
    {
      key: "flights" as const,
      label: "Flights",
      icon: Plane,
      description: "Applied to all flight prices from Duffel API",
      color: "#003580",
    },
    {
      key: "hotels" as const,
      label: "Hotels",
      icon: Building,
      description: "Applied to all hotel prices from RateHawk API",
      color: "#003580",
    },
    {
      key: "tours" as const,
      label: "Tours & Activities",
      icon: Compass,
      description: "Applied to tour prices from OpenTripMap",
      color: "#f97316",
    },
    {
      key: "packages" as const,
      label: "Packages (Overall)",
      icon: Package,
      description: "Additional markup on combined flight + hotel total",
      color: "#f97316",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif mb-2">Pricing Rules</h1>
        <p className="text-muted-foreground">
          Set markup or markdown percentages for each product category. Changes apply immediately.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Positive values = price increase (markup). Negative values = price decrease (markdown).
          For packages, the overall markup is applied on top of individual flight + hotel markups.
        </p>
      </div>

      {/* Markup Controls */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const value = markup[cat.key];

          return (
            <div
              key={cat.key}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + "15", color: cat.color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{cat.label}</h3>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={-50}
                  max={100}
                  step={1}
                  value={value}
                  onChange={(e) =>
                    setMarkup((prev) => ({
                      ...prev,
                      [cat.key]: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1 accent-primary"
                />
                <div className="flex items-center gap-1 w-24">
                  <input
                    type="number"
                    min={-100}
                    max={500}
                    value={value}
                    onChange={(e) =>
                      setMarkup((prev) => ({
                        ...prev,
                        [cat.key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-16 px-2 py-1 border border-border rounded text-sm text-center"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>-50% markdown</span>
                <span
                  className={`font-medium ${
                    value > 0
                      ? "text-red-500"
                      : value < 0
                      ? "text-green-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {value > 0 ? `+${value}% markup` : value < 0 ? `${value}% markdown` : "No change"}
                </span>
                <span>+100% markup</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>

        {success && (
          <span className="text-green-600 text-sm flex items-center gap-1">
            <Check className="h-4 w-4" />
            {success}
          </span>
        )}

        {error && authenticated && (
          <span className="text-red-500 text-sm flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>

      {/* Price Preview */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-3">Price Impact Preview</h3>
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flight base price: £500</span>
            <span className="font-medium">
              → £{Math.round(500 * (1 + markup.flights / 100))}
              {markup.flights !== 0 && (
                <span className={markup.flights > 0 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                  ({markup.flights > 0 ? "+" : ""}{markup.flights}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hotel base price: £800</span>
            <span className="font-medium">
              → £{Math.round(800 * (1 + markup.hotels / 100))}
              {markup.hotels !== 0 && (
                <span className={markup.hotels > 0 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                  ({markup.hotels > 0 ? "+" : ""}{markup.hotels}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tour base price: £30</span>
            <span className="font-medium">
              → £{Math.round(30 * (1 + markup.tours / 100))}
              {markup.tours !== 0 && (
                <span className={markup.tours > 0 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                  ({markup.tours > 0 ? "+" : ""}{markup.tours}%)
                </span>
              )}
            </span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between font-semibold">
            <span>Package total:</span>
            <span>
              £{Math.round(
                (500 * (1 + markup.flights / 100) + 800 * (1 + markup.hotels / 100)) *
                  (1 + markup.packages / 100)
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
