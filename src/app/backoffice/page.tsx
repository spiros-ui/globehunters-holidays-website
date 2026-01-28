"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  LogOut,
  Settings,
  Search,
  Eye,
  Plane,
  Building,
  Package,
  Percent,
  Save,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserInfo {
  userId: string;
  username: string;
  name: string;
  role: string;
}

interface PricingSettings {
  flights: number;
  hotels: number;
  packages: number;
  tours: number;
}

interface SessionData {
  referenceNumber: string;
  createdAt: string;
  searchType: "flights" | "hotels" | "packages";
  searchParams: Record<string, string>;
  selectedItemId?: string;
  url: string;
}

export default function BackOfficePage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"pricing" | "mirror">("pricing");

  // Login form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Pricing form
  const [pricing, setPricing] = useState<PricingSettings>({
    flights: 0,
    hotels: 0,
    packages: 0,
    tours: 0,
  });
  const [pricingSaving, setPricingSaving] = useState(false);
  const [pricingMessage, setPricingMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mirroring
  const [referenceNumber, setReferenceNumber] = useState("");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [mirrorError, setMirrorError] = useState("");
  const [mirrorLoading, setMirrorLoading] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    loadPricingSettings();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/login");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        setUser(data.user);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        setUsername("");
        setPassword("");
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      setIsAuthenticated(false);
      setUser(null);
    } catch {
      // Still logout locally
      setIsAuthenticated(false);
      setUser(null);
    }
  }

  async function loadPricingSettings() {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.markup) {
          setPricing(data.markup);
        }
      }
    } catch {
      // Use defaults
    }
  }

  async function savePricingSettings() {
    setPricingSaving(true);
    setPricingMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markup: pricing }),
      });

      if (res.ok) {
        setPricingMessage({ type: "success", text: "Pricing settings saved successfully!" });
      } else {
        setPricingMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch {
      setPricingMessage({ type: "error", text: "Connection error" });
    } finally {
      setPricingSaving(false);
      setTimeout(() => setPricingMessage(null), 3000);
    }
  }

  function lookupReference() {
    const input = referenceNumber.trim();
    if (!input) {
      setMirrorError("Please enter a session link or reference number");
      return;
    }

    setMirrorLoading(true);
    setMirrorError("");
    setSessionData(null);

    // Check if input is a URL (starts with http:// or https://)
    if (input.startsWith("http://") || input.startsWith("https://")) {
      // Validate it's from our domain
      try {
        const url = new URL(input);
        if (url.hostname.includes("globehunters") || url.hostname.includes("vercel.app") || url.hostname === "localhost") {
          // Open the URL in a new tab
          window.open(input, "_blank");
          setMirrorLoading(false);
          setSessionData({
            referenceNumber: "URL Opened",
            createdAt: new Date().toISOString(),
            searchType: "packages",
            searchParams: {},
            url: input,
          });
        } else {
          setMirrorError("URL must be from the GlobeHunters website");
          setMirrorLoading(false);
        }
      } catch {
        setMirrorError("Invalid URL format");
        setMirrorLoading(false);
      }
    } else {
      // It's a reference number - show helpful message
      setMirrorError("Reference numbers are for display only. Please ask the customer to click 'Copy Session Link' and share the URL with you.");
      setMirrorLoading(false);
    }
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#003580]" />
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#003580] to-[#00224f] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#003580] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Back Office Login</h1>
            <p className="text-gray-500 mt-1">GlobeHunters Staff Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 bg-[#003580] hover:bg-[#002a66] text-white"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Contact IT support if you need access credentials
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - Show back office
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#003580] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">Back Office</h1>
              <p className="text-blue-200 text-sm">GlobeHunters Staff Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Welcome, <strong>{user?.name}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("pricing")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "pricing"
                  ? "border-[#003580] text-[#003580]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Percent className="h-4 w-4 inline mr-2" />
              Pricing Controls
            </button>
            <button
              onClick={() => setActiveTab("mirror")}
              className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "mirror"
                  ? "border-[#003580] text-[#003580]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Customer Mirror
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "pricing" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Pricing Markup/Markdown</h2>
            <p className="text-gray-500 text-sm mb-6">
              Adjust the percentage markup or markdown applied to prices. Positive values increase prices, negative values decrease them.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Flights */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="h-5 w-5 text-[#003580]" />
                  <h3 className="font-semibold text-gray-900">Flights</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pricing.flights}
                    onChange={(e) => setPricing({ ...pricing, flights: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                    step="0.5"
                    min="-50"
                    max="100"
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Current: {pricing.flights >= 0 ? "+" : ""}{pricing.flights}% {pricing.flights >= 0 ? "markup" : "markdown"}
                </p>
              </div>

              {/* Hotels */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building className="h-5 w-5 text-[#003580]" />
                  <h3 className="font-semibold text-gray-900">Hotels</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pricing.hotels}
                    onChange={(e) => setPricing({ ...pricing, hotels: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                    step="0.5"
                    min="-50"
                    max="100"
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Current: {pricing.hotels >= 0 ? "+" : ""}{pricing.hotels}% {pricing.hotels >= 0 ? "markup" : "markdown"}
                </p>
              </div>

              {/* Packages */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-[#003580]" />
                  <h3 className="font-semibold text-gray-900">Packages</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pricing.packages}
                    onChange={(e) => setPricing({ ...pricing, packages: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                    step="0.5"
                    min="-50"
                    max="100"
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Current: {pricing.packages >= 0 ? "+" : ""}{pricing.packages}% {pricing.packages >= 0 ? "markup" : "markdown"}
                </p>
              </div>

              {/* Tours */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-5 w-5 text-[#003580]" />
                  <h3 className="font-semibold text-gray-900">Tours & Activities</h3>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={pricing.tours}
                    onChange={(e) => setPricing({ ...pricing, tours: Number(e.target.value) })}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                    step="0.5"
                    min="-50"
                    max="100"
                  />
                  <span className="text-gray-500 font-medium">%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Current: {pricing.tours >= 0 ? "+" : ""}{pricing.tours}% {pricing.tours >= 0 ? "markup" : "markdown"}
                </p>
              </div>
            </div>

            {pricingMessage && (
              <div
                className={`mt-6 px-4 py-3 rounded-lg flex items-center gap-2 ${
                  pricingMessage.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {pricingMessage.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {pricingMessage.text}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button
                onClick={savePricingSettings}
                className="bg-[#f97316] hover:bg-[#ea580c] text-white"
                disabled={pricingSaving}
              >
                {pricingSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "mirror" && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Customer Session Mirror</h2>
            <p className="text-gray-500 text-sm mb-4">
              Paste a customer's session link to see exactly what they're viewing on the website.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
              <strong>How it works:</strong> Ask the customer to click the <span className="font-semibold">"Copy Session Link"</span> button on their screen and share the link with you.
            </div>

            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Paste session link (e.g., https://globehunters...)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none"
                  onKeyDown={(e) => e.key === "Enter" && lookupReference()}
                />
              </div>
              <Button
                onClick={lookupReference}
                className="bg-[#003580] hover:bg-[#002a66] text-white"
                disabled={mirrorLoading}
              >
                {mirrorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </>
                )}
              </Button>
            </div>

            {mirrorError && (
              <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {mirrorError}
              </div>
            )}

            {sessionData && (
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Session Found</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Reference:</span>
                      <span className="ml-2 font-bold text-[#003580]">{sessionData.referenceNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-2 font-medium capitalize">{sessionData.searchType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{new Date(sessionData.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Search Parameters</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono">
                      {Object.entries(sessionData.searchParams).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-gray-500">{key}:</span>
                          <span className="text-gray-900">{value || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Customer's View</h4>
                    <a
                      href={sessionData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#003580] text-white rounded-lg hover:bg-[#002a66] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Customer View
                    </a>
                    <p className="text-xs text-gray-500 mt-2">
                      Opens in a new tab showing exactly what the customer sees
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
