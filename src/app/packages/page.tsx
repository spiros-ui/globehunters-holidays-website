"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, SortAsc, Loader2, Plane, Building, Star, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface PackageResult {
  id: string;
  title: string;
  icon: string;
  themeActivity: string;
  destination: string;
  nights: number;
  days: number;
  flight: {
    id: string;
    airlineCode: string;
    airlineName: string;
    totalFare: number;
    stops: number;
    cabinType: string;
    refundable: boolean;
  };
  hotel: {
    id: string;
    name: string;
    starRating: number;
    reviewScore: number;
    reviewScoreWord: string;
    thumbnail: string;
    images: string[];
    address: string;
    cityName: string;
    pricePerNight: number;
    boardType: string;
    refundable: boolean;
  };
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
  alternativeFlights: {
    id: string;
    airlineCode: string;
    airlineName: string;
    totalFare: number;
    stops: number;
  }[];
}

function PackageResultCard({
  pkg,
  currency,
  adults,
}: {
  pkg: PackageResult;
  currency: Currency;
  adults: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow">
      {/* Hotel Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={pkg.hotel.thumbnail}
          alt={pkg.hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-accent text-white">
            {pkg.icon} {pkg.themeActivity}
          </Badge>
        </div>
        {pkg.hotel.reviewScore > 0 && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              {pkg.hotel.reviewScore} {pkg.hotel.reviewScoreWord}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-serif text-lg text-foreground mb-2 line-clamp-2">
          {pkg.title}
        </h3>

        {/* Destination & Duration */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {pkg.destination}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {pkg.nights} nights
          </span>
        </div>

        {/* Flight Info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Plane className="h-4 w-4 text-accent" />
            <span className="font-medium">{pkg.flight.airlineName}</span>
            <span className="text-muted-foreground">
              • {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop${pkg.flight.stops > 1 ? "s" : ""}`}
              • {pkg.flight.cabinType}
            </span>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-accent" />
            <span className="font-medium line-clamp-1">{pkg.hotel.name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {pkg.hotel.boardType} • {pkg.hotel.cityName}
          </div>
        </div>

        {/* Includes */}
        <div className="flex flex-wrap gap-2 mb-4">
          {pkg.includes.slice(0, 3).map((item) => (
            <span
              key={item}
              className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            <div className="text-2xl font-semibold text-foreground">
              {formatPrice(pkg.pricePerPerson, currency as Currency)}
            </div>
            <span className="text-xs text-muted-foreground">per person</span>
            <div className="text-sm text-muted-foreground">
              Total: {formatPrice(pkg.totalPrice, currency as Currency)} for {adults} guests
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

function PackagesContent() {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");

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

        let results = data.data || [];

        // Sort packages
        if (sortBy === "price") {
          results.sort((a: PackageResult, b: PackageResult) => a.pricePerPerson - b.pricePerPerson);
        } else {
          results.sort((a: PackageResult, b: PackageResult) => (b.hotel.reviewScore || 0) - (a.hotel.reviewScore || 0));
        }

        setPackages(results);
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [destination, departureDate, returnDate, adults, children, rooms, origin, currency, sortBy]);

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
                {destination ? `Holiday Packages to ${destination}` : "Search Holiday Packages"}
              </h1>
              <p className="text-muted-foreground">
                {!hasSearchParams && "Enter your travel details to find the perfect package"}
                {hasSearchParams && loading && "Searching for the best packages..."}
                {hasSearchParams && !loading && `${packages.length} packages found`}
                {departureDate && ` • ${departureDate}`}
                {returnDate && ` - ${returnDate}`}
                {adults && ` • ${adults} adults`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              {packages.length > 0 && (
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "price" | "rating")}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="price">Sort by Price</option>
                    <option value="rating">Sort by Rating</option>
                  </select>
                </div>
              )}

              {/* Phone CTA */}
              <Button asChild>
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
                Use the search form above to find holiday packages. Select your destination,
                travel dates, and number of guests to see available options.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchParams && loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Searching for the best packages...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4 text-destructive">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call for Assistance
                </a>
              </Button>
            </div>
          )}

          {/* Results Grid */}
          {hasSearchParams && !loading && !error && packages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <PackageResultCard
                  key={pkg.id}
                  pkg={pkg}
                  currency={currency}
                  adults={adults}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {hasSearchParams && !loading && !error && packages.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4">No packages found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or contact us for a custom quote.
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
              Our travel experts are available 24/7 to help you find the perfect holiday package.
              Call us now for personalized recommendations and exclusive deals.
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
    </>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <PackagesContent />
    </Suspense>
  );
}
