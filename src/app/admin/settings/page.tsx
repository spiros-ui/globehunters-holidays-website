"use client";

import { useState } from "react";
import { Save, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "GlobeHunters Holidays",
    siteTagline: "Your Gateway to Amazing Holidays",
    defaultCurrency: "GBP",
    supportedCurrencies: ["GBP", "EUR", "USD", "AUD"],
    defaultPhone: "+442089444555",
    defaultEmail: "info@globehuntersholidays.com",
    googleAnalyticsId: "G-XXXXXXXXXX",
    metaPixelId: "XXXXXXXXXX",
    gtmId: "GTM-XXXXXXX",
    voipStudioEnabled: true,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure global site settings and integrations
          </p>
        </div>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* General Settings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">General Settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Site Name</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tagline</label>
            <input
              type="text"
              value={settings.siteTagline}
              onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default Phone</label>
            <input
              type="text"
              value={settings.defaultPhone}
              onChange={(e) => setSettings({ ...settings, defaultPhone: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Default Email</label>
            <input
              type="email"
              value={settings.defaultEmail}
              onChange={(e) => setSettings({ ...settings, defaultEmail: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">Currency Settings</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Default Currency</label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="GBP">GBP - British Pound</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Supported Currencies</label>
            <div className="flex flex-wrap gap-2">
              {["GBP", "EUR", "USD", "AUD"].map((currency) => (
                <Badge
                  key={currency}
                  variant={settings.supportedCurrencies.includes(currency) ? "default" : "secondary"}
                  className="cursor-pointer"
                >
                  {currency}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Exchange Rates
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: 2024-01-22 10:00 UTC
          </p>
        </div>
      </div>

      {/* Analytics & Tracking */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">Analytics & Tracking</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Google Analytics ID</label>
            <input
              type="text"
              value={settings.googleAnalyticsId}
              onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Google Tag Manager ID</label>
            <input
              type="text"
              value={settings.gtmId}
              onChange={(e) => setSettings({ ...settings, gtmId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono"
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Meta Pixel ID</label>
            <input
              type="text"
              value={settings.metaPixelId}
              onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono"
              placeholder="XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">VoIPStudio Integration</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.voipStudioEnabled}
                  onChange={(e) => setSettings({ ...settings, voipStudioEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Enabled</span>
              </label>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* API Integrations */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">API Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Duffel Flights API</div>
              <div className="text-sm text-muted-foreground">Flight search and booking</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Amadeus Hotels API</div>
              <div className="text-sm text-muted-foreground">Hotel search and availability</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <div className="font-medium">Activities API</div>
              <div className="text-sm text-muted-foreground">Tours and activities</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Connected</Badge>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Clear Cache</div>
            <div className="text-sm text-muted-foreground">
              Clear all cached data including API responses and exchange rates
            </div>
          </div>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
            Clear Cache
          </Button>
        </div>
      </div>
    </div>
  );
}
