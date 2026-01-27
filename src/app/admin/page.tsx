"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plane,
  Building,
  Phone,
  DollarSign,
  Compass,
  AlertCircle,
  Lock,
  Loader2,
} from "lucide-react";

interface MarkupSettings {
  flights: number;
  hotels: number;
  tours: number;
  packages: number;
}

export default function AdminDashboard() {
  const [markup, setMarkup] = useState<MarkupSettings | null>(null);

  useEffect(() => {
    const pwd = sessionStorage.getItem("admin-password");
    if (pwd) {
      fetch("/api/admin/settings", {
        headers: { "x-admin-password": pwd },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => data && setMarkup(data.markup))
        .catch(() => {});
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <Plane className="w-8 h-8 text-[#003580]" />
            {markup && (
              <span className={`text-sm font-medium ${markup.flights !== 0 ? (markup.flights > 0 ? "text-red-500" : "text-green-500") : "text-gray-400"}`}>
                {markup.flights > 0 ? "+" : ""}{markup.flights}%
              </span>
            )}
          </div>
          <div className="text-lg font-semibold mb-1">Flights Markup</div>
          <div className="text-sm text-muted-foreground">Duffel API</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <Building className="w-8 h-8 text-[#003580]" />
            {markup && (
              <span className={`text-sm font-medium ${markup.hotels !== 0 ? (markup.hotels > 0 ? "text-red-500" : "text-green-500") : "text-gray-400"}`}>
                {markup.hotels > 0 ? "+" : ""}{markup.hotels}%
              </span>
            )}
          </div>
          <div className="text-lg font-semibold mb-1">Hotels Markup</div>
          <div className="text-sm text-muted-foreground">RateHawk API</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <Compass className="w-8 h-8 text-[#f97316]" />
            {markup && (
              <span className={`text-sm font-medium ${markup.tours !== 0 ? (markup.tours > 0 ? "text-red-500" : "text-green-500") : "text-gray-400"}`}>
                {markup.tours > 0 ? "+" : ""}{markup.tours}%
              </span>
            )}
          </div>
          <div className="text-lg font-semibold mb-1">Tours Markup</div>
          <div className="text-sm text-muted-foreground">OpenTripMap API</div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <Package className="w-8 h-8 text-[#f97316]" />
            {markup && (
              <span className={`text-sm font-medium ${markup.packages !== 0 ? (markup.packages > 0 ? "text-red-500" : "text-green-500") : "text-gray-400"}`}>
                {markup.packages > 0 ? "+" : ""}{markup.packages}%
              </span>
            )}
          </div>
          <div className="text-lg font-semibold mb-1">Packages Markup</div>
          <div className="text-sm text-muted-foreground">Overall package</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/pricing"
            className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
          >
            <DollarSign className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">Update Pricing</div>
            <div className="text-sm text-muted-foreground">
              Manage markup rules
            </div>
          </Link>
          <Link
            href="/packages"
            target="_blank"
            className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
          >
            <Package className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">View Packages</div>
            <div className="text-sm text-muted-foreground">
              See packages page
            </div>
          </Link>
          <Link
            href="/flights"
            target="_blank"
            className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
          >
            <Plane className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">View Flights</div>
            <div className="text-sm text-muted-foreground">
              See flights page
            </div>
          </Link>
          <Link
            href="/hotels"
            target="_blank"
            className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-left"
          >
            <Building className="w-6 h-6 text-primary mb-2" />
            <div className="font-medium">View Hotels</div>
            <div className="text-sm text-muted-foreground">
              See hotels page
            </div>
          </Link>
        </div>
      </div>

      {/* Auth Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Admin Authentication</h3>
            <p className="text-sm text-blue-700">
              The pricing API is protected by password authentication.
              Default password: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">globehunters2024</code>.
              You can change it in <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">data/admin-settings.json</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
