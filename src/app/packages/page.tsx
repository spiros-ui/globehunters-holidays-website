"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface FlightLeg {
  origin: string;
  destination: string;
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
  stops: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
}

interface PackageHotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  mainImage: string | null;
  images: string[];
  price: number;
  pricePerNight: number;
  roomType: string;
  mealPlan: string;
  freeCancellation: boolean;
}

interface AlternativeFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  price: number;
  stops: number;
  priceDifference: number;
}

interface PackageResult {
  id: string;
  destination: string;
  destinationCountry: string;
  nights: number;
  days: number;
  flight: PackageFlight;
  hotel: PackageHotel;
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
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
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
  const [expanded, setExpanded] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<string>(pkg.flight.id);
  const [imageError, setImageError] = useState(false);

  const totalGuests = adults + childrenCount;

  // Calculate adjusted price if alternative flight selected
  const altFlight = pkg.alternativeFlights.find((f) => f.id === selectedFlight);
  const priceDiff = altFlight?.priceDifference || 0;
  const adjustedTotalPrice = pkg.totalPrice + priceDiff;
  const adjustedPricePerPerson = Math.round(adjustedTotalPrice / totalGuests);

  const currentFlight =
    selectedFlight === pkg.flight.id
      ? pkg.flight
      : pkg.alternativeFlights.find((f) => f.id === selectedFlight);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      {/* Hotel Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {pkg.hotel.mainImage && !imageError ? (
          <Image
            src={pkg.hotel.mainImage}
            alt={pkg.hotel.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-accent text-white">
            {pkg.nights} Nights Package
          </Badge>
        </div>
        {pkg.hotel.freeCancellation && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-green-500/90 text-white">
              <Check className="h-3 w-3 mr-1" />
              Free Cancellation
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Hotel Name & Stars */}
        <div className="mb-3">
          <h3 className="font-serif text-lg text-foreground mb-1 line-clamp-2">
            {pkg.hotel.name}
          </h3>
          <div className="flex items-center gap-3">
            <StarRating rating={pkg.hotel.starRating} />
            <span className="text-sm text-muted-foreground">
              {pkg.hotel.roomType}
            </span>
          </div>
        </div>

        {/* Destination & Duration */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {pkg.destination}, {pkg.destinationCountry}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {pkg.nights} nights / {pkg.days} days
          </span>
        </div>

        {/* Flight Summary */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Plane className="h-4 w-4 text-accent" />
              <span className="font-medium">
                {currentFlight?.airlineName || pkg.flight.airlineName}
              </span>
              <span className="text-muted-foreground">
                •{" "}
                {(currentFlight?.stops ?? pkg.flight.stops) === 0
                  ? "Direct"
                  : `${currentFlight?.stops ?? pkg.flight.stops} stop${(currentFlight?.stops ?? pkg.flight.stops) > 1 ? "s" : ""}`}
              </span>
            </div>
            {priceDiff > 0 && (
              <Badge variant="outline" className="text-xs">
                +{formatPrice(priceDiff, currency)}
              </Badge>
            )}
          </div>
          {pkg.flight.outbound && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <span>
                {pkg.flight.outbound.origin} {pkg.flight.outbound.departureTime}
              </span>
              <ArrowRight className="h-3 w-3" />
              <span>
                {pkg.flight.outbound.destination}{" "}
                {pkg.flight.outbound.arrivalTime}
              </span>
              <span className="ml-auto">
                {formatDuration(pkg.flight.outbound.duration)}
              </span>
            </div>
          )}
        </div>

        {/* Hotel Summary */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-accent" />
            <span className="font-medium">{pkg.hotel.mealPlan}</span>
            <span className="text-muted-foreground">
              • {formatPrice(pkg.hotel.pricePerNight, currency)}/night
            </span>
          </div>
          {pkg.hotel.address && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {pkg.hotel.address}
            </div>
          )}
        </div>

        {/* Includes */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pkg.includes.map((item) => (
            <span
              key={item}
              className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
            >
              <Check className="h-3 w-3 mr-1 text-green-500" />
              {item}
            </span>
          ))}
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 py-2 border-t border-border"
        >
          {expanded ? (
            <>
              Less details <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              More details <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-4 border-t border-border space-y-4">
            {/* Flight Details */}
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Plane className="h-4 w-4" /> Flight Details
              </h4>
              <div className="space-y-3 text-sm">
                {/* Outbound */}
                {pkg.flight.outbound && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="font-medium mb-1">Outbound Flight</div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {pkg.flight.outbound.departureTime}
                        </span>{" "}
                        {pkg.flight.outbound.origin}
                      </div>
                      <ArrowRight className="h-4 w-4" />
                      <div>
                        <span className="font-medium text-foreground">
                          {pkg.flight.outbound.arrivalTime}
                        </span>{" "}
                        {pkg.flight.outbound.destination}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Duration: {formatDuration(pkg.flight.outbound.duration)} •{" "}
                      {pkg.flight.stops === 0
                        ? "Direct"
                        : `${pkg.flight.stops} stop(s)`}
                    </div>
                  </div>
                )}

                {/* Inbound */}
                {pkg.flight.inbound && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="font-medium mb-1">Return Flight</div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div>
                        <span className="font-medium text-foreground">
                          {pkg.flight.inbound.departureTime}
                        </span>{" "}
                        {pkg.flight.inbound.origin}
                      </div>
                      <ArrowRight className="h-4 w-4" />
                      <div>
                        <span className="font-medium text-foreground">
                          {pkg.flight.inbound.arrivalTime}
                        </span>{" "}
                        {pkg.flight.inbound.destination}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Duration: {formatDuration(pkg.flight.inbound.duration)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alternative Flights */}
            {pkg.alternativeFlights.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">
                  Choose Different Flight
                </h4>
                <div className="space-y-2">
                  {/* Default flight option */}
                  <label
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFlight === pkg.flight.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`flight-${pkg.id}`}
                        value={pkg.flight.id}
                        checked={selectedFlight === pkg.flight.id}
                        onChange={() => setSelectedFlight(pkg.flight.id)}
                        className="accent-accent"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {pkg.flight.airlineName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pkg.flight.stops === 0
                            ? "Direct"
                            : `${pkg.flight.stops} stop(s)`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">
                      Included
                    </Badge>
                  </label>

                  {/* Alternative flights */}
                  {pkg.alternativeFlights.map((alt) => (
                    <label
                      key={alt.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFlight === alt.id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`flight-${pkg.id}`}
                          value={alt.id}
                          checked={selectedFlight === alt.id}
                          onChange={() => setSelectedFlight(alt.id)}
                          className="accent-accent"
                        />
                        <div>
                          <div className="font-medium text-sm">
                            {alt.airlineName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alt.stops === 0
                              ? "Direct"
                              : `${alt.stops} stop(s)`}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          alt.priceDifference > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }
                      >
                        {alt.priceDifference > 0 ? "+" : ""}
                        {formatPrice(alt.priceDifference, currency)}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Hotel Images */}
            {pkg.hotel.images.length > 1 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Hotel Photos
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {pkg.hotel.images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <Image
                        src={img}
                        alt={`${pkg.hotel.name} photo ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border mt-4">
          <div>
            <div className="text-2xl font-semibold text-foreground">
              {formatPrice(adjustedPricePerPerson, currency)}
            </div>
            <span className="text-xs text-muted-foreground">per person</span>
            <div className="text-sm text-muted-foreground">
              Total: {formatPrice(adjustedTotalPrice, currency)} for{" "}
              {totalGuests} guest{totalGuests > 1 ? "s" : ""}
            </div>
          </div>
          <Button asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Book Now
            </a>
          </Button>
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
    <div className="bg-white rounded-xl border border-border p-5 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {onClose && (
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          Max Price per Person
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
          className="w-full accent-accent"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>£0</span>
          <span className="font-medium text-foreground">
            Up to £{filters.maxPrice || maxPriceInResults}
          </span>
          <span>£{maxPriceInResults}</span>
        </div>
      </div>

      {/* Hotel Stars */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          Minimum Hotel Stars
        </label>
        <div className="flex gap-2">
          {[0, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              onClick={() => setFilters({ ...filters, minStars: stars })}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filters.minStars === stars
                  ? "bg-accent text-white border-accent"
                  : "border-border hover:border-accent"
              }`}
            >
              {stars === 0 ? "Any" : `${stars}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Stops */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Maximum Stops</label>
        <div className="flex gap-2">
          {[
            { value: 99, label: "Any" },
            { value: 0, label: "Direct" },
            { value: 1, label: "1 Stop" },
            { value: 2, label: "2 Stops" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilters({ ...filters, maxStops: option.value })}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filters.maxStops === option.value
                  ? "bg-accent text-white border-accent"
                  : "border-border hover:border-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Free Cancellation */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.freeCancellation}
            onChange={(e) =>
              setFilters({ ...filters, freeCancellation: e.target.checked })
            }
            className="accent-accent w-4 h-4"
          />
          <span className="text-sm">Free Cancellation Only</span>
        </label>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() =>
          setFilters({
            maxPrice: maxPriceInResults,
            minStars: 0,
            maxStops: 99,
            freeCancellation: false,
          })
        }
      >
        Reset Filters
      </Button>
    </div>
  );
}

function PackagesContent() {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "stars">("price");
  const [showFilters, setShowFilters] = useState(false);
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

  useEffect(() => {
    if (!destination || !departureDate || !returnDate) {
      setPackages([]);
      setLoading(false);
      return;
    }

    const fetchPackages = async () => {
      setLoading(true);
      setError(null);

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

        // Set initial max price filter
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

  // Filter and sort packages
  const maxPriceInResults =
    packages.length > 0
      ? Math.max(...packages.map((p) => p.pricePerPerson))
      : 5000;

  const filteredPackages = packages
    .filter((pkg) => {
      if (filters.maxPrice > 0 && pkg.pricePerPerson > filters.maxPrice)
        return false;
      if (filters.minStars > 0 && pkg.hotel.starRating < filters.minStars)
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

  const hasSearchParams = destination && departureDate && returnDate;

  return (
    <>
      {/* Search Form */}
      <section className="bg-primary py-8">
        <div className="container-wide">
          <SearchForm defaultType="packages" />
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container-wide">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif mb-2">
                {destination
                  ? `Holiday Packages to ${destination}`
                  : "Search Holiday Packages"}
              </h1>
              <p className="text-muted-foreground">
                {!hasSearchParams &&
                  "Enter your travel details to find the perfect package"}
                {hasSearchParams &&
                  loading &&
                  "Searching for the best packages..."}
                {hasSearchParams &&
                  !loading &&
                  `${filteredPackages.length} packages found`}
                {departureDate && ` • ${departureDate}`}
                {returnDate && ` - ${returnDate}`}
                {adults && ` • ${adults + children} guests`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Mobile Filter Toggle */}
              {packages.length > 0 && (
                <Button
                  variant="outline"
                  className="lg:hidden"
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              )}

              {/* Sort */}
              {packages.length > 0 && (
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "price" | "stars")
                    }
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="price">Sort by Price</option>
                    <option value="stars">Sort by Stars</option>
                  </select>
                </div>
              )}

              {/* Phone CTA */}
              <Button asChild className="hidden md:flex">
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call to Book
                </a>
              </Button>
            </div>
          </div>

          {/* No Search Yet */}
          {!hasSearchParams && (
            <div className="text-center py-20 bg-muted/50 rounded-xl">
              <h2 className="text-2xl font-serif mb-4">Start Your Search</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Use the search form above to find holiday packages. Select your
                destination, travel dates, and number of guests to see available
                options.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchParams && loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">
                Searching flights and hotels...
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4 text-destructive">
                Something went wrong
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call for Assistance
                </a>
              </Button>
            </div>
          )}

          {/* Results Layout */}
          {hasSearchParams && !loading && !error && packages.length > 0 && (
            <div className="flex gap-8">
              {/* Filters Sidebar - Desktop */}
              <div className="hidden lg:block w-72 flex-shrink-0">
                <FiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  maxPriceInResults={maxPriceInResults}
                />
              </div>

              {/* Results Grid */}
              <div className="flex-1">
                {filteredPackages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="text-center py-20 bg-muted/50 rounded-xl">
                    <h2 className="text-xl font-serif mb-4">
                      No packages match your filters
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your filter criteria
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setFilters({
                          maxPrice: maxPriceInResults,
                          minStars: 0,
                          maxStops: 99,
                          freeCancellation: false,
                        })
                      }
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Results */}
          {hasSearchParams && !loading && !error && packages.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4">No packages found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn&apos;t find packages for this destination and dates.
                Try adjusting your search or contact us for a custom quote.
              </p>
              <Button asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call 020 8944 4555
                </a>
              </Button>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-12 bg-muted rounded-xl p-8 text-center">
            <h2 className="text-2xl font-serif mb-4">Need Help Choosing?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our travel experts are available 24/7 to help you find the perfect
              holiday package. Call us now for personalized recommendations and
              exclusive deals.
            </p>
            <Button size="lg" asChild>
              <a href="tel:+442089444555" className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Call 020 8944 4555
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background p-4 overflow-auto">
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
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <PackagesContent />
    </Suspense>
  );
}
