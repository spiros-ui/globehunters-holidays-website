"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plane, Building, Package, Users, Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchType = "packages" | "flights" | "hotels";

interface SearchFormProps {
  className?: string;
  defaultType?: SearchType;
}

const airports = [
  { code: "LON", name: "London (All Airports)" },
  { code: "LHR", name: "London Heathrow" },
  { code: "LGW", name: "London Gatwick" },
  { code: "MAN", name: "Manchester" },
  { code: "BHX", name: "Birmingham" },
  { code: "EDI", name: "Edinburgh" },
];

const destinations = [
  { code: "MLE", name: "Maldives" },
  { code: "DXB", name: "Dubai" },
  { code: "DPS", name: "Bali" },
  { code: "CDG", name: "Paris" },
  { code: "BKK", name: "Bangkok" },
  { code: "SYD", name: "Sydney" },
  { code: "FCO", name: "Rome" },
  { code: "BCN", name: "Barcelona" },
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
    });

    const route = searchType === "packages" ? "/packages" : searchType === "flights" ? "/flights" : "/hotels";
    router.push(`${route}?${params.toString()}`);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={cn("bg-white rounded-xl shadow-search p-6", className)}>
      {/* Search Type Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        <button
          type="button"
          onClick={() => setSearchType("packages")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
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
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
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
            "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
            searchType === "hotels"
              ? "border-accent text-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Building className="h-4 w-4" />
          Hotels
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Origin */}
          {searchType !== "hotels" && (
            <div className="relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                From
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                {airports.map((airport) => (
                  <option key={airport.code} value={airport.code}>
                    {airport.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[34px] h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* Destination */}
          <div className="relative">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {searchType === "hotels" ? "City or destination" : "To"}
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              required
            >
              <option value="">Select destination</option>
              {destinations.map((dest) => (
                <option key={dest.code} value={dest.code}>
                  {dest.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-[34px] h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {/* Departure Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {searchType === "hotels" ? "Check-in" : "Departure"}
            </label>
            <Input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={today}
              required
              className="cursor-pointer"
            />
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              {searchType === "hotels" ? "Check-out" : "Return"}
            </label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || today}
              required
              className="cursor-pointer"
            />
          </div>

          {/* Guests */}
          <div className="relative">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Guests
            </label>
            <button
              type="button"
              onClick={() => setShowGuestPicker(!showGuestPicker)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-background text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {adults} Adults{children > 0 ? `, ${children} Children` : ""}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

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
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
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
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                      >
                        -
                      </button>
                      <span className="w-6 text-center">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(8, children + 1))}
                        className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Rooms (for hotels) */}
                  {searchType === "hotels" && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Rooms</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRooms(Math.max(1, rooms - 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        >
                          -
                        </button>
                        <span className="w-6 text-center">{rooms}</span>
                        <button
                          type="button"
                          onClick={() => setRooms(Math.min(5, rooms + 1))}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
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
        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" className="min-w-[180px]">
            <Search className="h-4 w-4 mr-2" />
            Search {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SearchForm;
