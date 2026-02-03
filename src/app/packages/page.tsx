"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  SortAsc,
  Loader2,
  Plane,
  Building,
  Star,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Check,
  ArrowRight,
  Search,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/SearchForm";
import { ReferenceNumber } from "@/components/ui/ReferenceNumber";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

// Format date string (YYYY-MM-DD) to human-readable "25 Jan" format
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

interface FlightLeg {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  departureDate?: string;
  arrivalDate?: string;
}

interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
}

interface PackageFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  price: number;
  basePrice?: number;
  stops: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  segments?: FlightSegment[];
  returnSegments?: FlightSegment[];
}

interface PackageHotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  mainImage: string | null;
  images: string[];
  price: number;
  basePrice?: number;
  pricePerNight: number;
  roomType: string;
  mealPlan: string;
  freeCancellation: boolean;
}

interface Attraction {
  id: string;
  name: string;
  category: string;
  kinds: string;
  description: string;
  image: string | null;
  rating: string;
  price: number;
  currency: string;
}

interface AlternativeFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo?: string;
  price: number;
  stops: number;
  priceDifference: number;
  outbound?: FlightLeg;
  inbound?: FlightLeg | null;
}

interface PackageResult {
  id: string;
  name: string;
  theme: string;
  tagline: string;
  description: string;
  destination: string;
  destinationCountry: string;
  nights: number;
  days: number;
  flight: PackageFlight;
  hotel: PackageHotel;
  attractions: Attraction[];
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
  alternativeFlights: AlternativeFlight[];
}

interface Filters {
  maxPrice: number;
  minStars: number;
  maxStops: number;
  freeCancellation: boolean;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// Default hotel placeholder image
const PACKAGE_HOTEL_PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80";

function ImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  // Use placeholder if no images
  const displayImages = images.length > 0 ? images : [PACKAGE_HOTEL_PLACEHOLDER];

  return (
    <div className="relative w-full h-full group">
      {!imgErrors.has(currentIndex) ? (
        <Image
          src={displayImages[currentIndex]}
          alt={`${alt} - Photo ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 280px"
          onError={() => setImgErrors((prev) => new Set(prev).add(currentIndex))}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Camera className="h-8 w-8 text-gray-300" />
        </div>
      )}
      {displayImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {displayImages.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  currency,
  adults,
  children: childrenCount,
}: {
  pkg: PackageResult;
  currency: Currency;
  adults: number;
  children: number;
}) {
  const totalGuests = adults + childrenCount;

  // Build query params for the detail page
  const detailParams = new URLSearchParams({
    data: JSON.stringify({
      id: pkg.id,
      name: pkg.name,
      theme: pkg.theme,
      tagline: pkg.tagline,
      description: pkg.description,
      destination: pkg.destination,
      destinationCountry: pkg.destinationCountry,
      nights: String(pkg.nights),
      days: String(pkg.days),
      flight: pkg.flight,
      hotel: pkg.hotel,
      attractions: pkg.attractions,
      totalPrice: pkg.totalPrice,
      pricePerPerson: pkg.pricePerPerson,
      currency: pkg.currency,
      includes: pkg.includes,
      alternativeFlights: pkg.alternativeFlights,
    } as any),
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Hotel Image - Left side */}
        <div className="relative w-full md:w-[280px] h-[200px] md:h-auto md:min-h-[280px] flex-shrink-0">
          <ImageCarousel images={pkg.hotel.images} alt={pkg.hotel.name} />
          {pkg.hotel.freeCancellation && (
            <div className="absolute top-2 left-2">
              <span className="bg-green-600 text-white text-[11px] font-medium px-2 py-0.5 rounded">
                Free cancellation
              </span>
            </div>
          )}
        </div>

        {/* Content - Middle */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Package name & theme */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              {pkg.theme && pkg.theme !== "general" && (
                <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {pkg.theme}
                </span>
              )}
              <span className="text-[11px] text-gray-500">
                {pkg.nights} nights / {pkg.days} days
              </span>
            </div>
            <h3 className="text-base font-bold text-[#003580] leading-tight">
              {pkg.name}
            </h3>
            <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-1">
              {pkg.tagline}
            </p>
          </div>

          {/* Hotel info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-gray-900">{pkg.hotel.name}</span>
              <StarRating rating={pkg.hotel.starRating} />
            </div>
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{pkg.destination}, {pkg.destinationCountry}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[12px] text-gray-600">
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {pkg.hotel.roomType}
              </span>
              {pkg.hotel.mealPlan !== "Room Only" && (
                <span className="flex items-center gap-1 text-green-700">
                  <Check className="h-3 w-3" />
                  {pkg.hotel.mealPlan}
                </span>
              )}
            </div>
          </div>

          {/* Flight info */}
          <div className="bg-gray-50 rounded-lg p-2.5 mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-4 relative flex-shrink-0">
                <Image
                  src={`https://pics.avs.io/80/32/${pkg.flight.airlineCode}.png`}
                  alt={pkg.flight.airlineName}
                  width={80}
                  height={32}
                  className="object-contain w-full h-full"
                />
              </div>
              <span className="text-[12px] font-medium text-gray-700">
                {pkg.flight.airlineName}
              </span>
              <span className="text-[11px] text-gray-500">
                {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop${pkg.flight.stops > 1 ? "s" : ""}`}
              </span>
            </div>
            {pkg.flight.outbound && (
              <div className="flex items-center gap-2 text-[12px] text-gray-600">
                <Plane className="h-3 w-3 text-gray-400" />
                {pkg.flight.outbound.departureDate && (
                  <span className="text-gray-600 text-xs">{formatDateDisplay(pkg.flight.outbound.departureDate)}</span>
                )}
                <span className="font-medium">{pkg.flight.outbound.departureTime}</span>
                <span className="text-gray-400">{pkg.flight.outbound.origin}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                {pkg.flight.outbound.arrivalDate && pkg.flight.outbound.arrivalDate !== pkg.flight.outbound.departureDate && (
                  <span className="text-gray-600 text-xs">{formatDateDisplay(pkg.flight.outbound.arrivalDate)}</span>
                )}
                <span className="font-medium">{pkg.flight.outbound.arrivalTime}</span>
                <span className="text-gray-400">{pkg.flight.outbound.destination}</span>
                <span className="text-gray-400 ml-auto">{formatDuration(pkg.flight.outbound.duration)}</span>
              </div>
            )}
            {pkg.flight.inbound && (
              <div className="flex items-center gap-2 text-[12px] text-gray-600 mt-1">
                <Plane className="h-3 w-3 text-gray-400 rotate-180" />
                {pkg.flight.inbound.departureDate && (
                  <span className="text-gray-600 text-xs">{formatDateDisplay(pkg.flight.inbound.departureDate)}</span>
                )}
                <span className="font-medium">{pkg.flight.inbound.departureTime}</span>
                <span className="text-gray-400">{pkg.flight.inbound.origin}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                {pkg.flight.inbound.arrivalDate && pkg.flight.inbound.arrivalDate !== pkg.flight.inbound.departureDate && (
                  <span className="text-gray-600 text-xs">{formatDateDisplay(pkg.flight.inbound.arrivalDate)}</span>
                )}
                <span className="font-medium">{pkg.flight.inbound.arrivalTime}</span>
                <span className="text-gray-400">{pkg.flight.inbound.destination}</span>
                <span className="text-gray-400 ml-auto">{formatDuration(pkg.flight.inbound.duration)}</span>
              </div>
            )}
          </div>

          {/* Tours preview */}
          {pkg.attractions && pkg.attractions.length > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-gray-600 mb-2">
              <Compass className="h-3.5 w-3.5 text-orange-500" />
              <span className="font-medium text-gray-700">
                {pkg.attractions.length} tours available
              </span>
              <span className="text-gray-400">from {formatPrice(Math.min(...pkg.attractions.map(a => a.price)), currency)} pp</span>
            </div>
          )}

          {/* Includes tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {pkg.includes.map((item) => (
              <span
                key={item as string}
                className="inline-flex items-center text-[11px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded"
              >
                <Check className="h-3 w-3 mr-0.5" />
                {item as string}
              </span>
            ))}
          </div>
        </div>

        {/* Price & CTA - Right side */}
        <div className="w-full md:w-[180px] p-4 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50/50">
          <div>
            <div className="text-right md:text-left">
              <div className="text-[12px] text-gray-500 mb-1">
                {pkg.nights} nights, {totalGuests} guest{totalGuests > 1 ? "s" : ""}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(pkg.totalPrice, currency)}
              </div>
              <div className="text-[12px] text-gray-500">
                {formatPrice(pkg.pricePerPerson, currency)} per person
              </div>
            </div>
            <div className="text-[11px] text-gray-400 mt-2">
              Includes flights + hotel
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              href={`/packages/${encodeURIComponent(pkg.id)}?${detailParams.toString()}`}
              className="block w-full text-center py-2.5 rounded-md text-white font-semibold text-sm transition-colors"
              style={{ backgroundColor: "#f97316" }}
            >
              View Package
            </Link>
            <a
              href="tel:+442089444555"
              className="block w-full text-center py-2 rounded-md text-[#003580] font-medium text-[12px] border border-[#003580] hover:bg-[#003580]/5 transition-colors"
            >
              <Phone className="h-3 w-3 inline mr-1" />
              020 8944 4555
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function FiltersPanel({
  filters,
  setFilters,
  maxPriceInResults,
  onClose,
}: {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  maxPriceInResults: number;
  onClose?: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm text-gray-900">Filter by:</h3>
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <label className="text-[13px] font-semibold text-gray-900 mb-2 block">
          Your budget (per person)
        </label>
        <input
          type="range"
          min={0}
          max={maxPriceInResults}
          step={50}
          value={filters.maxPrice || maxPriceInResults}
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: parseInt(e.target.value) })
          }
          className="w-full accent-[#f97316]"
        />
        <div className="flex justify-between text-[12px] text-gray-500 mt-1">
          <span>£0</span>
          <span className="font-medium text-gray-900">
            Up to £{filters.maxPrice || maxPriceInResults}
          </span>
          <span>£{maxPriceInResults}</span>
        </div>
      </div>

      {/* Hotel Stars */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <label className="text-[13px] font-semibold text-gray-900 mb-2 block">
          Property rating
        </label>
        <div className="flex gap-2">
          {[0, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              onClick={() => setFilters({ ...filters, minStars: stars })}
              className={`px-3 py-1.5 rounded text-[12px] border transition-colors ${
                filters.minStars === stars
                  ? "bg-[#003580] text-white border-[#003580]"
                  : "border-gray-300 hover:border-[#003580] text-gray-700"
              }`}
            >
              {stars === 0 ? "Any" : `${stars}★`}
            </button>
          ))}
        </div>
      </div>

      {/* Stops */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <label className="text-[13px] font-semibold text-gray-900 mb-2 block">
          Flight stops
        </label>
        <div className="space-y-1.5">
          {[
            { value: 99, label: "Any number of stops" },
            { value: 0, label: "Direct only" },
            { value: 1, label: "1 stop max" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer text-[13px] text-gray-700"
            >
              <input
                type="radio"
                name="stops"
                checked={filters.maxStops === option.value}
                onChange={() => setFilters({ ...filters, maxStops: option.value })}
                className="accent-[#f97316]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* Free Cancellation */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.freeCancellation}
            onChange={(e) =>
              setFilters({ ...filters, freeCancellation: e.target.checked })
            }
            className="accent-[#f97316] w-4 h-4 rounded"
          />
          <span className="text-[13px] text-gray-700">Free cancellation</span>
        </label>
      </div>

      {/* Reset */}
      <button
        className="w-full py-2 text-[13px] text-[#003580] font-medium border border-[#003580] rounded hover:bg-[#003580]/5 transition-colors"
        onClick={() =>
          setFilters({
            maxPrice: maxPriceInResults,
            minStars: 0,
            maxStops: 99,
            freeCancellation: false,
          })
        }
      >
        Clear all filters
      </button>
    </div>
  );
}

function PackagesContent() {
  const searchParams = useSearchParams();
  const resultsRef = useRef<HTMLDivElement>(null);
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "stars">("price");
  const [showFilters, setShowFilters] = useState(false);
  const [searchFormOpen, setSearchFormOpen] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    maxPrice: 0,
    minStars: 0,
    maxStops: 99,
    freeCancellation: false,
  });

  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const origin = searchParams.get("origin") || "LON";
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  const hasSearchParams = destination && departureDate && returnDate;

  useEffect(() => {
    if (!destination || !departureDate || !returnDate) {
      setPackages([]);
      setLoading(false);
      return;
    }

    const fetchPackages = async () => {
      setLoading(true);
      setError(null);
      setSearchFormOpen(false);

      try {
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

        const response = await fetch(`/api/search/packages?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch packages");
        }

        const results = data.data || [];
        setPackages(results);

        if (results.length > 0) {
          const maxPrice = Math.max(
            ...results.map((p: PackageResult) => p.pricePerPerson)
          );
          setFilters((prev) => ({ ...prev, maxPrice }));
        }
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch packages"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [
    destination,
    departureDate,
    returnDate,
    adults,
    children,
    rooms,
    origin,
    currency,
  ]);

  // Auto-scroll to results when search completes
  useEffect(() => {
    if (!loading && packages.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, packages.length]);

  // Filter and sort packages
  const maxPriceInResults =
    packages.length > 0
      ? Math.max(...packages.map((p) => p.pricePerPerson))
      : 5000;

  const filteredPackages = packages
    .filter((pkg) => {
      // Keep all packages (images will use placeholder if missing)
      if (filters.maxPrice > 0 && pkg.pricePerPerson > filters.maxPrice)
        return false;
      // Filter by exact star rating (0 = any)
      if (filters.minStars > 0 && pkg.hotel.starRating !== filters.minStars)
        return false;
      if (filters.maxStops < 99 && pkg.flight.stops > filters.maxStops)
        return false;
      if (filters.freeCancellation && !pkg.hotel.freeCancellation) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        return a.pricePerPerson - b.pricePerPerson;
      } else {
        return b.hotel.starRating - a.hotel.starRating;
      }
    });

  return (
    <>
      {/* Search Form - Collapsible */}
      <section className="bg-[#003580]">
        <div className="container-wide">
          {hasSearchParams ? (
            <>
              <button
                onClick={() => setSearchFormOpen(!searchFormOpen)}
                className="w-full flex items-center justify-between py-4 text-white"
              >
                <span className="font-semibold flex items-center gap-2 text-base">
                  <Search className="w-5 h-5" />
                  {searchFormOpen ? "Hide Search" : "Modify Search"}
                </span>
                {searchFormOpen ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
              {searchFormOpen && (
                <div className="pb-6">
                  <SearchForm defaultType="packages" />
                </div>
              )}
            </>
          ) : (
            <div className="py-6">
              <SearchForm defaultType="packages" />
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section ref={resultsRef} className="py-6 bg-[#F2F6FA] min-h-[60vh]">
        <div className="container-wide">
          {/* Results Header */}
          <div className="mb-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {destination
                    ? `Holiday Packages to ${destination}`
                    : "Search Holiday Packages"}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {!hasSearchParams &&
                    "Enter your travel details to find the perfect package"}
                  {hasSearchParams &&
                    loading &&
                    "Searching flights, hotels and attractions..."}
                  {hasSearchParams && !loading && !error && (
                    <>
                      {filteredPackages.length === packages.length ? (
                        <span>{packages.length} packages found</span>
                      ) : (
                        <span>Showing {filteredPackages.length} of {packages.length} packages</span>
                      )}
                      {departureDate && <span className="mx-2">|</span>}
                      {departureDate && <span>{departureDate}</span>}
                      {returnDate && <span> — {returnDate}</span>}
                      <span className="mx-2">|</span>
                      <span>{adults + children} guest{(adults + children) > 1 ? "s" : ""}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {packages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setShowFilters(true)}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                  </Button>
                )}

                {packages.length > 0 && (
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "price" | "stars")
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-[13px] bg-white"
                  >
                    <option value="price">Sort: Lowest price</option>
                    <option value="stars">Sort: Hotel rating</option>
                  </select>
                )}
              </div>
            </div>

            {/* Web Reference Number */}
            {hasSearchParams && !loading && packages.length > 0 && (
              <div className="mt-4">
                <ReferenceNumber
                  searchType="packages"
                  searchParams={{
                    origin: origin || "",
                    destination: destination || "",
                    departureDate: departureDate || "",
                    returnDate: returnDate || "",
                    adults: String(adults),
                    children: String(children),
                    rooms: String(rooms),
                  }}
                />
              </div>
            )}
          </div>

          {/* No search yet */}
          {!hasSearchParams && (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <Plane className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Find Your Perfect Package</h2>
              <p className="text-gray-500 mb-6 max-w-xl mx-auto text-sm">
                Search for holiday packages including flights, hotels, and optional tours.
                Enter your destination and dates above to get started.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchParams && loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#f97316] mb-4" />
              <p className="text-gray-600 font-medium">Searching flights, hotels & attractions...</p>
              <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-500 mb-6 text-sm">{error}</p>
              <a
                href="tel:+442089444555"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold text-sm"
                style={{ backgroundColor: "#f97316" }}
              >
                <Phone className="h-4 w-4" />
                Call for Assistance
              </a>
            </div>
          )}

          {/* Results Layout */}
          {hasSearchParams && !loading && !error && packages.length > 0 && (
            <div className="flex gap-6">
              {/* Filters Sidebar - Desktop */}
              <div className="hidden lg:block w-[260px] flex-shrink-0">
                <FiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  maxPriceInResults={maxPriceInResults}
                />
              </div>

              {/* Results List */}
              <div className="flex-1">
                {filteredPackages.length > 0 ? (
                  <div className="space-y-4">
                    {filteredPackages.map((pkg) => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        currency={currency}
                        adults={adults}
                        children={children}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                      No packages match your filters
                    </h2>
                    <p className="text-gray-500 text-sm mb-4">
                      Try adjusting your filter criteria
                    </p>
                    <button
                      className="text-[#003580] text-sm font-medium underline"
                      onClick={() =>
                        setFilters({
                          maxPrice: maxPriceInResults,
                          minStars: 0,
                          maxStops: 99,
                          freeCancellation: false,
                        })
                      }
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Results */}
          {hasSearchParams && !loading && !error && packages.length === 0 && (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-2">No packages found</h2>
              <p className="text-gray-500 mb-6 text-sm">
                We couldn&apos;t find packages for this route and dates.
                Try different dates or contact us for a custom quote.
              </p>
              <a
                href="tel:+442089444555"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold text-sm"
                style={{ backgroundColor: "#f97316" }}
              >
                <Phone className="h-4 w-4" />
                Call 020 8944 4555
              </a>
            </div>
          )}

          {/* Bottom CTA */}
          {hasSearchParams && !loading && packages.length > 0 && (
            <div className="mt-8 bg-[#003580] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white text-center md:text-left">
                <h2 className="text-lg font-bold">Need help choosing?</h2>
                <p className="text-blue-200 text-sm">
                  Our travel experts are available to help you find the perfect holiday package.
                </p>
              </div>
              <a
                href="tel:+442089444555"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-md text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: "#f97316" }}
              >
                <Phone className="h-4 w-4" />
                Call 020 8944 4555
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-auto">
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              maxPriceInResults={maxPriceInResults}
              onClose={() => setShowFilters(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function PackagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
        </div>
      }
    >
      <PackagesContent />
    </Suspense>
  );
}
