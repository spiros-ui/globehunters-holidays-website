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

interface SessionDetails {
  packageId?: string;
  packageName?: string;
  selectedHotelTier?: string;
  selectedAirline?: string;
  selectedBoardBasis?: string;
  selectedActivities?: string[];
}

interface SessionData {
  referenceNumber: string;
  createdAt: string;
  searchType: "flights" | "hotels" | "packages";
  searchParams: Record<string, string>;
  selectedItemId?: string;
  url: string;
  session?: SessionDetails;
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
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

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
        // Load pricing settings now that auth cookies are set
        loadPricingSettings();
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
        const errorData = await res.json().catch(() => null);
        setPricingMessage({ type: "error", text: errorData?.error || "Failed to save settings" });
      }
    } catch {
      setPricingMessage({ type: "error", text: "Connection error" });
    } finally {
      setPricingSaving(false);
      setTimeout(() => setPricingMessage(null), 3000);
    }
  }

  async function lookupReference() {
    const input = referenceNumber.trim().toUpperCase();
    if (!input) {
      setMirrorError("Please enter a reference number (e.g., GH-ABC123)");
      return;
    }

    setMirrorLoading(true);
    setMirrorError("");
    setSessionData(null);
    setIframeUrl(null);

    // Check if input is a URL (starts with http:// or https://)
    if (input.startsWith("HTTP://") || input.startsWith("HTTPS://")) {
      // Show URL in iframe
      const url = input.toLowerCase();
      setIframeUrl(url);
      setMirrorLoading(false);
      setSessionData({
        referenceNumber: "URL Opened",
        createdAt: new Date().toISOString(),
        searchType: "packages",
        searchParams: {},
        url: url,
      });
      return;
    }

    // It's a reference number - look it up via API
    try {
      const res = await fetch(`/api/references?ref=${encodeURIComponent(input)}`);
      const data = await res.json();

      if (data.found && data.url) {
        // Show the customer's page in iframe
        setIframeUrl(data.url);
        setSessionData({
          referenceNumber: input,
          createdAt: data.createdAt,
          searchType: "packages",
          searchParams: {},
          url: data.url,
          session: data.session || undefined,
        });
      } else {
        setMirrorError(data.error || "Reference not found. Ask the customer to refresh their page and give you the new reference.");
      }
    } catch {
      setMirrorError("Connection error. Please try again.");
    } finally {
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
              Enter the customer's web reference number to see exactly what they're viewing.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
              <strong>How it works:</strong> Ask the customer for the <span className="font-semibold">Web Reference</span> shown on their screen (e.g., GH-ABC123). Enter it below to open their exact page.
            </div>

            <div className="flex gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                  placeholder="Enter reference (e.g., GH-ABC123)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003580]/20 focus:border-[#003580] outline-none uppercase"
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
                    <Eye className="h-4 w-4 mr-2" />
                    View
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

            {/* Customer View Iframe */}
            {iframeUrl && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">Viewing Customer&apos;s Screen</span>
                    {sessionData?.referenceNumber && sessionData.referenceNumber !== "URL Opened" && (
                      <span className="text-sm text-gray-500">({sessionData.referenceNumber})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(iframeUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open in New Tab
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIframeUrl(null);
                        setSessionData(null);
                        setReferenceNumber("");
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                {/* Session details panel */}
                {sessionData?.session && (
                  <div className="bg-gray-50 border rounded-lg p-4 mb-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {sessionData.session.packageName && (
                      <div>
                        <span className="text-gray-500 block text-xs">Package</span>
                        <span className="font-medium text-gray-900">{sessionData.session.packageName}</span>
                      </div>
                    )}
                    {sessionData.session.selectedHotelTier && (
                      <div>
                        <span className="text-gray-500 block text-xs">Hotel Tier</span>
                        <span className="font-medium text-gray-900 capitalize">{sessionData.session.selectedHotelTier}</span>
                      </div>
                    )}
                    {sessionData.session.selectedAirline && (
                      <div>
                        <span className="text-gray-500 block text-xs">Airline</span>
                        <span className="font-medium text-gray-900">{sessionData.session.selectedAirline}</span>
                      </div>
                    )}
                    {sessionData.session.selectedBoardBasis && (
                      <div>
                        <span className="text-gray-500 block text-xs">Board Basis</span>
                        <span className="font-medium text-gray-900">{sessionData.session.selectedBoardBasis}</span>
                      </div>
                    )}
                    {sessionData.session.selectedActivities && sessionData.session.selectedActivities.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-gray-500 block text-xs">Activities</span>
                        <span className="font-medium text-gray-900">{sessionData.session.selectedActivities.length} selected</span>
                      </div>
                    )}
                    {sessionData.createdAt && (
                      <div>
                        <span className="text-gray-500 block text-xs">Session Started</span>
                        <span className="font-medium text-gray-900">{new Date(sessionData.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="border-2 border-[#003580] rounded-lg overflow-hidden bg-white" style={{ height: "70vh" }}>
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full"
                    title="Customer View"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 font-mono break-all">
                  {iframeUrl}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
