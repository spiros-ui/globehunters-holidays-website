"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plane, Building, Package, Users, MapPin, Calendar, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SearchType = "packages" | "flights" | "hotels";

interface SearchFormProps {
  className?: string;
  defaultType?: SearchType;
}

// Popular airports for suggestions
const popularAirports = [
  { code: "LON", name: "London (All Airports)", country: "United Kingdom" },
  { code: "LHR", name: "London Heathrow", country: "United Kingdom" },
  { code: "LGW", name: "London Gatwick", country: "United Kingdom" },
  { code: "STN", name: "London Stansted", country: "United Kingdom" },
  { code: "LTN", name: "London Luton", country: "United Kingdom" },
  { code: "MAN", name: "Manchester", country: "United Kingdom" },
  { code: "BHX", name: "Birmingham", country: "United Kingdom" },
  { code: "EDI", name: "Edinburgh", country: "United Kingdom" },
  { code: "GLA", name: "Glasgow", country: "United Kingdom" },
  { code: "BRS", name: "Bristol", country: "United Kingdom" },
  { code: "NCL", name: "Newcastle", country: "United Kingdom" },
  { code: "LPL", name: "Liverpool", country: "United Kingdom" },
  { code: "BFS", name: "Belfast", country: "United Kingdom" },
  { code: "JFK", name: "New York JFK", country: "United States" },
  { code: "LAX", name: "Los Angeles", country: "United States" },
  { code: "MIA", name: "Miami", country: "United States" },
  { code: "ORD", name: "Chicago O'Hare", country: "United States" },
  { code: "DXB", name: "Dubai", country: "United Arab Emirates" },
  { code: "SIN", name: "Singapore Changi", country: "Singapore" },
  { code: "HKG", name: "Hong Kong", country: "Hong Kong" },
  { code: "BKK", name: "Bangkok", country: "Thailand" },
  { code: "CDG", name: "Paris Charles de Gaulle", country: "France" },
  { code: "AMS", name: "Amsterdam Schiphol", country: "Netherlands" },
  { code: "FRA", name: "Frankfurt", country: "Germany" },
  { code: "MAD", name: "Madrid", country: "Spain" },
  { code: "BCN", name: "Barcelona", country: "Spain" },
  { code: "FCO", name: "Rome Fiumicino", country: "Italy" },
  { code: "MLE", name: "Malé (Maldives)", country: "Maldives" },
  { code: "MRU", name: "Mauritius", country: "Mauritius" },
  { code: "SYD", name: "Sydney", country: "Australia" },
  { code: "MEL", name: "Melbourne", country: "Australia" },
  { code: "DPS", name: "Bali Denpasar", country: "Indonesia" },
  { code: "PHU", name: "Phuket", country: "Thailand" },
  { code: "CUN", name: "Cancun", country: "Mexico" },
  { code: "IST", name: "Istanbul", country: "Turkey" },
  { code: "ATH", name: "Athens", country: "Greece" },
  { code: "LIS", name: "Lisbon", country: "Portugal" },
  { code: "CPT", name: "Cape Town", country: "South Africa" },
  { code: "NBO", name: "Nairobi", country: "Kenya" },
  { code: "TYO", name: "Tokyo (All Airports)", country: "Japan" },
  { code: "NRT", name: "Tokyo Narita", country: "Japan" },
  { code: "ICN", name: "Seoul Incheon", country: "South Korea" },
  { code: "DEL", name: "New Delhi", country: "India" },
  { code: "BOM", name: "Mumbai", country: "India" },
  { code: "DOH", name: "Doha", country: "Qatar" },
  { code: "AUH", name: "Abu Dhabi", country: "United Arab Emirates" },
  { code: "ZRH", name: "Zurich", country: "Switzerland" },
  { code: "VIE", name: "Vienna", country: "Austria" },
  { code: "PRG", name: "Prague", country: "Czech Republic" },
  { code: "DUB", name: "Dublin", country: "Ireland" },
  { code: "KEF", name: "Reykjavik", country: "Iceland" },
];

// Popular destinations for suggestions
const popularDestinations = [
  { code: "MLE", name: "Maldives", country: "Maldives" },
  { code: "DXB", name: "Dubai", country: "United Arab Emirates" },
  { code: "DPS", name: "Bali", country: "Indonesia" },
  { code: "PHU", name: "Phuket", country: "Thailand" },
  { code: "BKK", name: "Bangkok", country: "Thailand" },
  { code: "MRU", name: "Mauritius", country: "Mauritius" },
  { code: "CUN", name: "Cancun", country: "Mexico" },
  { code: "CDG", name: "Paris", country: "France" },
  { code: "FCO", name: "Rome", country: "Italy" },
  { code: "BCN", name: "Barcelona", country: "Spain" },
  { code: "NYC", name: "New York", country: "United States" },
  { code: "LAX", name: "Los Angeles", country: "United States" },
  { code: "MIA", name: "Miami", country: "United States" },
  { code: "SYD", name: "Sydney", country: "Australia" },
  { code: "SIN", name: "Singapore", country: "Singapore" },
  { code: "HKG", name: "Hong Kong", country: "Hong Kong" },
  { code: "TYO", name: "Tokyo", country: "Japan" },
  { code: "IST", name: "Istanbul", country: "Turkey" },
  { code: "ATH", name: "Athens", country: "Greece" },
  { code: "LIS", name: "Lisbon", country: "Portugal" },
  { code: "AMS", name: "Amsterdam", country: "Netherlands" },
  { code: "MAD", name: "Madrid", country: "Spain" },
  { code: "VCE", name: "Venice", country: "Italy" },
  { code: "ZRH", name: "Zurich", country: "Switzerland" },
  { code: "VIE", name: "Vienna", country: "Austria" },
  { code: "PRG", name: "Prague", country: "Czech Republic" },
  { code: "DUB", name: "Dublin", country: "Ireland" },
  { code: "KEF", name: "Iceland", country: "Iceland" },
  { code: "CPT", name: "Cape Town", country: "South Africa" },
  { code: "NBO", name: "Kenya", country: "Kenya" },
  { code: "SEZ", name: "Seychelles", country: "Seychelles" },
  { code: "CMB", name: "Sri Lanka", country: "Sri Lanka" },
  { code: "GIG", name: "Rio de Janeiro", country: "Brazil" },
  { code: "LIM", name: "Peru", country: "Peru" },
  { code: "BOG", name: "Colombia", country: "Colombia" },
  { code: "HNL", name: "Hawaii", country: "United States" },
  { code: "FJI", name: "Fiji", country: "Fiji" },
  { code: "PPT", name: "Tahiti", country: "French Polynesia" },
];

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestions: typeof popularAirports;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  hideCode?: boolean;
}

function AutocompleteInput({ value, onChange, placeholder, suggestions, icon, label, required, hideCode }: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState(suggestions);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hideCode) {
      // For hotels: match by name (value is a city name) or by code (legacy URLs)
      const foundByName = suggestions.find(s => s.name.toLowerCase() === value.toLowerCase());
      const foundByCode = suggestions.find(s => s.code === value);
      const found = foundByName || foundByCode;
      if (found) {
        setInputValue(found.name);
      } else if (value) {
        setInputValue(value);
      }
    } else {
      const found = suggestions.find(s => s.code === value);
      if (found) {
        setInputValue(`${found.name} (${found.code})`);
      } else if (value) {
        setInputValue(value);
      }
    }
  }, [value, suggestions, hideCode]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setIsOpen(true);

    if (val.length === 0) {
      setFilteredSuggestions(suggestions);
    } else {
      const filtered = suggestions.filter(s =>
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        (!hideCode && s.code.toLowerCase().includes(val.toLowerCase())) ||
        s.country.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    }

    // If user types a 3-letter code, accept it directly (only for flights/packages)
    if (!hideCode && val.length === 3 && /^[A-Za-z]{3}$/.test(val)) {
      onChange(val.toUpperCase());
    }
  };

  const handleSelect = (suggestion: typeof suggestions[0]) => {
    if (hideCode) {
      setInputValue(suggestion.name);
      onChange(suggestion.name);
    } else {
      setInputValue(`${suggestion.name} (${suggestion.code})`);
      onChange(suggestion.code);
    }
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setFilteredSuggestions(suggestions);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className="w-full h-12 pl-10 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {filteredSuggestions.slice(0, 15).map((suggestion) => (
            <button
              key={suggestion.code}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{suggestion.name}</div>
                <div className="text-xs text-muted-foreground">{suggestion.country}</div>
              </div>
              {!hideCode && (
                <span className="text-sm font-mono text-muted-foreground">{suggestion.code}</span>
              )}
            </button>
          ))}
          {filteredSuggestions.length === 0 && inputValue && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              {hideCode ? "No matches found. Try a different city name." : "No matches found. You can enter any airport code directly."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchFormInner({ className, defaultType = "packages" }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params if available
  const [searchType, setSearchType] = useState<SearchType>(defaultType);
  const [origin, setOrigin] = useState(searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [departureDate, setDepartureDate] = useState(searchParams.get("departureDate") || "");
  const [returnDate, setReturnDate] = useState(searchParams.get("returnDate") || "");
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "2"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
  const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms") || "1"));
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [directFlightsOnly, setDirectFlightsOnly] = useState(searchParams.get("directOnly") === "true");
  const [currency, setCurrency] = useState(searchParams.get("currency") || "GBP");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!destination) {
      alert("Please enter a destination");
      return;
    }

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
    <div className={cn("bg-white rounded-2xl shadow-xl", className)}>
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
            <AutocompleteInput
              value={origin}
              onChange={setOrigin}
              placeholder="Enter city or airport code"
              suggestions={popularAirports}
              icon={<MapPin className="h-5 w-5" />}
              label="From"
            />
          )}

          {/* Destination */}
          <AutocompleteInput
            value={destination}
            onChange={setDestination}
            placeholder={searchType === "hotels" ? "Enter city or destination" : "Enter city or airport code"}
            suggestions={searchType === "hotels" ? popularDestinations : [...popularDestinations, ...popularAirports.filter(a => !popularDestinations.find(d => d.code === a.code))]}
            icon={<Building className="h-5 w-5" />}
            label="Destination"
            required
            hideCode={searchType === "hotels"}
          />

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

// Wrapper with Suspense boundary for useSearchParams
export function SearchForm(props: SearchFormProps) {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl shadow-xl p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <SearchFormInner {...props} />
    </Suspense>
  );
}

export default SearchForm;
