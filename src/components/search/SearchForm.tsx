"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Building, Package, Users, MapPin, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SearchType = "packages" | "flights" | "hotels";

interface SearchFormProps {
  className?: string;
  defaultType?: SearchType;
}

// UK Airports
const airports = [
  { code: "LON", name: "London (All Airports)" },
  { code: "LHR", name: "London Heathrow" },
  { code: "LGW", name: "London Gatwick" },
  { code: "STN", name: "London Stansted" },
  { code: "LTN", name: "London Luton" },
  { code: "SEN", name: "London Southend" },
  { code: "MAN", name: "Manchester" },
  { code: "BHX", name: "Birmingham" },
  { code: "EDI", name: "Edinburgh" },
  { code: "GLA", name: "Glasgow" },
  { code: "BRS", name: "Bristol" },
  { code: "NCL", name: "Newcastle" },
  { code: "LPL", name: "Liverpool" },
  { code: "LBA", name: "Leeds Bradford" },
  { code: "EMA", name: "East Midlands" },
  { code: "BFS", name: "Belfast" },
  { code: "ABZ", name: "Aberdeen" },
  { code: "CWL", name: "Cardiff" },
  { code: "SOU", name: "Southampton" },
  { code: "EXT", name: "Exeter" },
];

// Popular Destinations
const destinations = [
  { code: "MLE", name: "Maldives" },
  { code: "DXB", name: "Dubai" },
  { code: "DPS", name: "Bali" },
  { code: "CDG", name: "Paris" },
  { code: "BKK", name: "Bangkok" },
  { code: "SYD", name: "Sydney" },
  { code: "FCO", name: "Rome" },
  { code: "BCN", name: "Barcelona" },
  { code: "NYC", name: "New York" },
  { code: "LAX", name: "Los Angeles" },
  { code: "MIA", name: "Miami" },
  { code: "CUN", name: "Cancun" },
  { code: "PHU", name: "Phuket" },
  { code: "MRU", name: "Mauritius" },
  { code: "SIN", name: "Singapore" },
  { code: "TYO", name: "Tokyo" },
  { code: "HKG", name: "Hong Kong" },
  { code: "CPT", name: "Cape Town" },
  { code: "NBO", name: "Kenya" },
  { code: "IST", name: "Istanbul" },
  { code: "ATH", name: "Athens" },
  { code: "LIS", name: "Lisbon" },
  { code: "AMS", name: "Amsterdam" },
  { code: "MAD", name: "Madrid" },
  { code: "VCE", name: "Venice" },
  { code: "ZRH", name: "Zurich" },
  { code: "VIE", name: "Vienna" },
  { code: "PRG", name: "Prague" },
  { code: "DUB", name: "Dublin" },
  { code: "REK", name: "Iceland" },
];

export function SearchForm({ className, defaultType = "packages" }: SearchFormProps) {
  const router = useRouter();
  const [searchType, setSearchType] = useState<SearchType>(defaultType);
  const [origin, setOrigin] = useState("LON");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [directFlightsOnly, setDirectFlightsOnly] = useState(false);
  const [currency, setCurrency] = useState("GBP");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: adults.toString(),
      children: children.toString(),
      rooms: rooms.toString(),
      currency,
    });

    if (directFlightsOnly) {
      params.set("directOnly", "true");
    }

    const route = searchType === "packages" ? "/packages" : searchType === "flights" ? "/flights" : "/hotels";
    router.push(`${route}?${params.toString()}`);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={cn("bg-white rounded-2xl shadow-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 text-foreground mb-4">
          <Search className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-serif font-semibold">Find Your Perfect Escape</h2>
        </div>

        {/* Search Type Tabs */}
        <div className="flex items-center gap-6 border-b border-border">
          <button
            type="button"
            onClick={() => setSearchType("packages")}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              searchType === "packages"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Package className="h-4 w-4" />
            Packages
          </button>
          <button
            type="button"
            onClick={() => setSearchType("flights")}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              searchType === "flights"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Plane className="h-4 w-4" />
            Flights
          </button>
          <button
            type="button"
            onClick={() => setSearchType("hotels")}
            className={cn(
              "flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              searchType === "hotels"
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Building className="h-4 w-4" />
            Hotels
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="px-6 pb-6">
        {/* Options Row */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          {searchType === "flights" && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={directFlightsOnly}
                onChange={(e) => setDirectFlightsOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
              />
              Direct flights only
            </label>
          )}
          {searchType !== "flights" && <div />}

          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="appearance-none bg-transparent text-sm font-medium pr-6 cursor-pointer focus:outline-none"
            >
              <option value="GBP">£ GBP</option>
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="AUD">$ AUD</option>
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Origin */}
          {searchType !== "hotels" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                From
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full h-12 pl-10 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none cursor-pointer"
                >
                  <option value="">Departure airport</option>
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Destination
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full h-12 pl-10 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none cursor-pointer"
                required
              >
                <option value="">City or destination</option>
                {destinations.map((dest) => (
                  <option key={dest.code} value={dest.code}>
                    {dest.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Departure Date */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {searchType === "hotels" ? "Check-in" : "Depart"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={today}
                  required
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
                />
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {searchType === "hotels" ? "Check-out" : "Return"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || today}
                  required
                  className="w-full h-12 pl-10 pr-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Guests & Rooms
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full h-12 pl-10 pr-10 rounded-lg border border-border bg-background text-sm text-left focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent flex items-center"
              >
                {adults} Adults{children > 0 ? `, ${children} Children` : ""}{searchType !== "flights" ? `, ${rooms} Room${rooms > 1 ? 's' : ''}` : ""}
              </button>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

              {/* Guest Picker Dropdown */}
              {showGuestPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-lg border border-border shadow-lg z-10">
                  <div className="space-y-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Adults</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-medium">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(Math.min(9, adults + 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Children</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-medium">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(Math.min(8, children + 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Rooms (for packages and hotels) */}
                    {searchType !== "flights" && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rooms</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-medium">{rooms}</span>
                          <button
                            type="button"
                            onClick={() => setRooms(Math.min(5, rooms + 1))}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      onClick={() => setShowGuestPicker(false)}
                      className="w-full"
                      size="sm"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <Button type="submit" size="lg" className="w-full h-12 text-base">
            <Search className="h-4 w-4 mr-2" />
            Search {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
          </Button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
            <Users className="h-4 w-4" />
            <span>Trusted by 50,000+ travelers</span>
          </div>
        </div>
      </form>
    </div>
  );
}

export default SearchForm;
