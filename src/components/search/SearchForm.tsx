"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plane, Building, Package, Users, MapPin, Calendar, ChevronDown, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Import locked airport and destination data
import ukAirportsData from "@/data/uk-airports.json";
import packageDestinationsData from "@/data/package-destinations.json";

type SearchType = "packages" | "flights" | "hotels";

interface SearchFormProps {
  className?: string;
  defaultType?: SearchType;
}

// UK airports for packages (FROM field - locked to UK only)
const ukAirports = ukAirportsData.airports.map(airport => ({
  code: airport.code,
  name: airport.name,
  country: "United Kingdom",
  region: airport.region
}));

// Package destinations (DESTINATION field - locked to Top 50)
const packageDestinations = packageDestinationsData.destinations.map(dest => ({
  code: dest.code,
  name: dest.name,
  country: dest.country,
  region: dest.region
}));

// Validation helpers
function isValidUkAirport(code: string): boolean {
  return ukAirports.some(airport => airport.code === code.toUpperCase());
}

function isValidPackageDestination(nameOrCode: string): boolean {
  const normalized = nameOrCode.toLowerCase().trim();
  return packageDestinations.some(
    dest => dest.code.toLowerCase() === normalized || dest.name.toLowerCase() === normalized
  );
}

function normalizeDestination(value: string): string | null {
  const normalized = value.toLowerCase().trim();
  const found = packageDestinations.find(
    dest => dest.code.toLowerCase() === normalized || dest.name.toLowerCase() === normalized
  );
  return found ? found.name : null;
}

function normalizeUkAirport(value: string): string | null {
  const normalized = value.toUpperCase().trim();
  const found = ukAirports.find(airport => airport.code === normalized);
  return found ? found.code : null;
}

// Popular airports for flights (includes international)
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
  { code: "MLE", name: "Male (Maldives)", country: "Maldives" },
  { code: "MRU", name: "Mauritius", country: "Mauritius" },
  { code: "SYD", name: "Sydney", country: "Australia" },
  { code: "MEL", name: "Melbourne", country: "Australia" },
  { code: "DPS", name: "Bali Denpasar", country: "Indonesia" },
  { code: "HKT", name: "Phuket", country: "Thailand" },
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

// Popular destinations for flights/hotels (flexible - not locked)
const popularDestinations = [
  { code: "MLE", name: "Maldives", country: "Maldives" },
  { code: "DXB", name: "Dubai", country: "United Arab Emirates" },
  { code: "DPS", name: "Bali", country: "Indonesia" },
  { code: "HKT", name: "Phuket", country: "Thailand" },
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

// Export validation functions for use in other components (e.g., URL param validation)
export { isValidUkAirport, isValidPackageDestination, normalizeDestination, normalizeUkAirport, ukAirports, packageDestinations };

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

// Locked Select Input for packages - dropdown only, no free text
interface LockedSelectInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ code: string; name: string; country: string; region?: string }>;
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  useNameAsValue?: boolean; // For destinations, use name; for airports, use code
  validationError?: string | null;
}

function LockedSelectInput({
  value,
  onChange,
  placeholder,
  options,
  icon,
  label,
  required,
  useNameAsValue,
  validationError
}: LockedSelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get display value
  const getDisplayValue = () => {
    if (!value) return "";
    if (useNameAsValue) {
      const found = options.find(o => o.name.toLowerCase() === value.toLowerCase());
      return found ? found.name : value;
    } else {
      const found = options.find(o => o.code === value);
      return found ? `${found.name} (${found.code})` : value;
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: typeof options[0]) => {
    if (useNameAsValue) {
      onChange(option.name);
    } else {
      onChange(option.code);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent any typing
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      return;
    }

    const maxIndex = Math.min(options.length - 1, 19); // Max 20 items shown

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex]);
        } else {
          setIsOpen(true);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex(prev => Math.min(prev + 1, maxIndex));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
      case "Tab":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        // Prevent all other keys from affecting the input
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
        break;
    }
  };

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const displayValue = getDisplayValue();

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
          value={displayValue}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          readOnly
          className={cn(
            "w-full h-12 pl-10 pr-10 rounded-xl border bg-white text-sm focus:outline-none focus:ring-2 focus:shadow-md cursor-pointer caret-transparent select-none transition-all duration-200",
            validationError
              ? "border-red-500 focus:ring-red-200 focus:border-red-500"
              : "border-border focus:ring-accent/20 focus:border-accent"
          )}
        />
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Validation error message */}
      {validationError && (
        <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{validationError}</span>
        </div>
      )}

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {options.slice(0, 20).map((option, index) => (
            <button
              key={`${option.code}-${option.name}`}
              type="button"
              onClick={() => handleSelect(option)}
              className={cn(
                "w-full px-4 py-3 text-left transition-colors flex items-center justify-between",
                highlightedIndex === index ? "bg-accent/10" : "hover:bg-muted"
              )}
            >
              <div>
                <div className="font-medium">{option.name}</div>
                <div className="text-xs text-muted-foreground">
                  {option.country}{option.region ? ` - ${option.region}` : ""}
                </div>
              </div>
              <span className="text-sm font-mono text-muted-foreground">{option.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

    // For hotels (hideCode mode): always propagate typed text so any city can be searched
    if (hideCode) {
      onChange(val);
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
          className="w-full h-12 pl-10 pr-10 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:shadow-md transition-all duration-200"
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

      {isOpen && (filteredSuggestions.length > 0 || (hideCode && inputValue.length > 0)) && (
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
              {hideCode
                ? `Search for "${inputValue}" — click Search to find hotels`
                : "No matches found. You can enter any airport code directly."}
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

  // Validate and normalize URL params for packages
  const validateAndNormalizeOrigin = (originParam: string | null): string => {
    if (!originParam) return "";
    const normalized = normalizeUkAirport(originParam);
    return normalized || "";
  };

  const validateAndNormalizeDestination = (destParam: string | null, type: SearchType): string => {
    if (!destParam) return "";
    if (type === "packages") {
      const normalized = normalizeDestination(destParam);
      return normalized || "";
    }
    return destParam;
  };

  // Initialize state from URL params if available
  const [searchType, setSearchType] = useState<SearchType>(defaultType);

  // For packages, validate origin/destination from URL params
  const urlOrigin = searchParams.get("origin");
  const urlDestination = searchParams.get("destination");

  const [origin, setOrigin] = useState(() => {
    if (defaultType === "packages") {
      return validateAndNormalizeOrigin(urlOrigin);
    }
    return urlOrigin || "";
  });

  const [destination, setDestination] = useState(() => {
    if (defaultType === "packages") {
      return validateAndNormalizeDestination(urlDestination, "packages");
    }
    return urlDestination || "";
  });

  // Track validation errors for display
  const [originError, setOriginError] = useState<string | null>(() => {
    if (defaultType === "packages" && urlOrigin && !validateAndNormalizeOrigin(urlOrigin)) {
      return `"${urlOrigin}" is not a valid UK airport. Please select from the list.`;
    }
    return null;
  });

  const [destinationError, setDestinationError] = useState<string | null>(() => {
    if (defaultType === "packages" && urlDestination && !validateAndNormalizeDestination(urlDestination, "packages")) {
      return `"${urlDestination}" is not available as a package destination. Please select from our Top 50 destinations.`;
    }
    return null;
  });

  const [departureDate, setDepartureDate] = useState(searchParams.get("departureDate") || "");
  const [returnDate, setReturnDate] = useState(searchParams.get("returnDate") || "");
  const [adults, setAdults] = useState(parseInt(searchParams.get("adults") || "2"));
  const [children, setChildren] = useState(parseInt(searchParams.get("children") || "0"));
  const [rooms, setRooms] = useState(parseInt(searchParams.get("rooms") || "1"));
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [directFlightsOnly, setDirectFlightsOnly] = useState(searchParams.get("directOnly") === "true");
  const [cabinClass, setCabinClass] = useState(searchParams.get("cabinClass") || "economy");
  const [childAges, setChildAges] = useState<number[]>(() => {
    const ages = searchParams.get("childAges");
    return ages ? ages.split(",").map(Number) : Array(parseInt(searchParams.get("children") || "0")).fill(7);
  });
  const [currency, setCurrency] = useState(searchParams.get("currency") || "GBP");

  // Clear validation errors when user makes a valid selection
  const handleOriginChange = (value: string) => {
    setOrigin(value);
    if (searchType === "packages") {
      if (value && !isValidUkAirport(value)) {
        setOriginError("Please select a valid UK airport from the list.");
      } else {
        setOriginError(null);
      }
    } else {
      setOriginError(null);
    }
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    if (searchType === "packages") {
      if (value && !isValidPackageDestination(value)) {
        setDestinationError("Please select a destination from our Top 50 list.");
      } else {
        setDestinationError(null);
      }
    } else {
      setDestinationError(null);
    }
  };

  // Reset errors when switching search types
  useEffect(() => {
    setOriginError(null);
    setDestinationError(null);
  }, [searchType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate for packages
    if (searchType === "packages") {
      let hasError = false;

      if (!origin) {
        setOriginError("Please select a UK departure airport.");
        hasError = true;
      } else if (!isValidUkAirport(origin)) {
        setOriginError("Please select a valid UK airport from the list.");
        hasError = true;
      }

      if (!destination) {
        setDestinationError("Please select a destination.");
        hasError = true;
      } else if (!isValidPackageDestination(destination)) {
        setDestinationError("Please select a destination from our Top 50 list.");
        hasError = true;
      }

      if (hasError) return;
    } else if (!destination) {
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

    if (searchType === "flights" || searchType === "packages") {
      params.set("cabinClass", cabinClass);
    }

    if (children > 0 && childAges.length > 0) {
      params.set("childAges", childAges.join(","));
    }

    const route = searchType === "packages" ? "/packages" : searchType === "flights" ? "/flights" : "/hotels";
    router.push(`${route}?${params.toString()}`);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={cn("rounded-2xl shadow-2xl overflow-visible", className)}>
      {/* Premium Tabbed Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7a] rounded-t-2xl px-6 pt-5 pb-4">
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-xl p-1">
          {(["packages", "flights", "hotels"] as SearchType[]).map((type) => {
            const icons = { packages: Package, flights: Plane, hotels: Building };
            const Icon = icons[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                  searchType === type
                    ? "bg-white text-[#1e3a5f] shadow-md"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4" />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-b-2xl px-6 pb-6">
        {/* Options Row */}
        <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
          {searchType === "flights" && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-gray-600 hover:text-gray-900 transition-colors">
                <input
                  type="checkbox"
                  checked={directFlightsOnly}
                  onChange={(e) => setDirectFlightsOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                />
                Direct flights only
              </label>
              <div className="relative">
                <select
                  value={cabinClass}
                  onChange={(e) => setCabinClass(e.target.value)}
                  className="appearance-none bg-transparent text-sm font-semibold text-[#1e3a5f] pr-6 cursor-pointer focus:outline-none"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First</option>
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
          {searchType !== "flights" && <div />}

          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="appearance-none bg-gray-50 text-sm font-semibold text-[#1e3a5f] pl-3 pr-7 py-1.5 rounded-lg cursor-pointer focus:outline-none border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <option value="GBP">£ GBP</option>
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="AUD">$ AUD</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          {/* Origin - Locked for packages, flexible for flights */}
          {searchType !== "hotels" && (
            searchType === "packages" ? (
              <LockedSelectInput
                value={origin}
                onChange={handleOriginChange}
                placeholder="Select UK departure airport"
                options={ukAirports}
                icon={<MapPin className="h-5 w-5" />}
                label="From (UK Airports Only)"
                required
                useNameAsValue={false}
                validationError={originError}
              />
            ) : (
              <AutocompleteInput
                value={origin}
                onChange={handleOriginChange}
                placeholder="Enter city or airport code"
                suggestions={popularAirports}
                icon={<MapPin className="h-5 w-5" />}
                label="From"
              />
            )
          )}

          {/* Destination - Locked for packages, flexible for flights/hotels */}
          {searchType === "packages" ? (
            <LockedSelectInput
              value={destination}
              onChange={handleDestinationChange}
              placeholder="Select destination"
              options={packageDestinations}
              icon={<Building className="h-5 w-5" />}
              label="Destination"
              required
              useNameAsValue={true}
              validationError={destinationError}
            />
          ) : (
            <AutocompleteInput
              value={destination}
              onChange={handleDestinationChange}
              placeholder={searchType === "hotels" ? "Enter city or destination" : "Enter city or airport code"}
              suggestions={searchType === "hotels" ? popularDestinations : [...popularDestinations, ...popularAirports.filter(a => !popularDestinations.find(d => d.code === a.code))]}
              icon={<Building className="h-5 w-5" />}
              label="Destination"
              required
              hideCode={searchType === "hotels"}
            />
          )}

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Departure Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1e3a5f] uppercase tracking-[0.12em] mb-1.5">
                {searchType === "hotels" ? "Check-in" : "Depart"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1e3a5f]/40 pointer-events-none" />
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={today}
                  required
                  className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] focus:bg-white focus:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                />
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#1e3a5f] uppercase tracking-[0.12em] mb-1.5">
                {searchType === "hotels" ? "Check-out" : "Return"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1e3a5f]/40 pointer-events-none" />
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={departureDate || today}
                  required
                  className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] focus:bg-white focus:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1e3a5f] uppercase tracking-[0.12em] mb-1.5">
              Guests & Rooms
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1e3a5f]/40" />
              <button
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full h-12 pl-10 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-900 text-left focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] focus:bg-white focus:shadow-md transition-all duration-200 flex items-center hover:border-gray-300"
              >
                {adults} Adults{children > 0 ? `, ${children} Children` : ""}{searchType !== "flights" ? `, ${rooms} Room${rooms > 1 ? 's' : ''}` : ""}
              </button>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Guest Picker — inline flow so it's never clipped by backdrop-blur */}
            {showGuestPicker && (
              <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7a]">
                    <h4 className="text-white text-sm font-semibold">Travellers & Rooms</h4>
                  </div>
                  <div className="p-4 space-y-0 divide-y divide-gray-100">
                    {/* Adults */}
                    <div className="flex items-center justify-between py-3 first:pt-0">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Adults</span>
                        <p className="text-[11px] text-gray-400">Ages 18+</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-[#1e3a5f] text-base">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(Math.min(9, adults + 1))}
                          className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <span className="text-sm font-semibold text-gray-900">Children</span>
                        <p className="text-[11px] text-gray-400">Ages 0–17</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newCount = Math.max(0, children - 1);
                            setChildren(newCount);
                            setChildAges(prev => prev.slice(0, newCount));
                          }}
                          className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold text-[#1e3a5f] text-base">{children}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newCount = Math.min(8, children + 1);
                            setChildren(newCount);
                            setChildAges(prev => [...prev, 7]);
                          }}
                          className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Child Age Selectors */}
                    {children > 0 && (
                      <div className="py-3 space-y-2.5">
                        <span className="text-[11px] font-semibold text-[#1e3a5f] uppercase tracking-wider">Age at time of travel</span>
                        <div className="flex flex-wrap gap-2">
                          {childAges.map((age, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
                              <label className="text-xs text-gray-500 font-medium">Child {idx + 1}</label>
                              <select
                                value={age}
                                onChange={(e) => {
                                  const newAges = [...childAges];
                                  newAges[idx] = parseInt(e.target.value);
                                  setChildAges(newAges);
                                }}
                                className="h-7 px-2 rounded-md border border-gray-200 bg-white text-xs font-medium text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316]"
                              >
                                {Array.from({ length: 18 }, (_, i) => (
                                  <option key={i} value={i}>{i} {i < 2 ? "infant" : "yrs"}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rooms (for packages and hotels) */}
                    {searchType !== "flights" && (
                      <div className="flex items-center justify-between py-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">Rooms</span>
                          <p className="text-[11px] text-gray-400">Max 5 rooms</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setRooms(Math.max(1, rooms - 1))}
                            className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-bold text-[#1e3a5f] text-base">{rooms}</span>
                          <button
                            type="button"
                            onClick={() => setRooms(Math.min(5, rooms + 1))}
                            className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#f97316] hover:text-[#f97316] hover:bg-orange-50 transition-all duration-200 font-medium text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4">
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

          {/* Search Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] text-white shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-300/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] rounded-xl"
          >
            <Search className="h-5 w-5 mr-2" />
            Search {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
          </Button>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              ATOL Protected
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
              ABTA Bonded
            </div>
            <div className="w-px h-3 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="h-3.5 w-3.5 text-[#1e3a5f]/40" />
              50,000+ travellers
            </div>
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
