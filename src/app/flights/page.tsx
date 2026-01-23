"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Phone, Plane, Clock, Luggage, SortAsc, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Currency } from "@/types";

interface FlightResult {
  id: string;
  airlineCode: string;
  airlineName: string;
  totalFare: number;
  stops: number;
  cabinType: string;
  refundable: boolean;
  destination: string;
}

function FlightCard({ flight, currency }: { flight: FlightResult; currency: Currency }) {
  return (
    <div className="card-hover p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Airline */}
        <div className="lg:w-48 flex items-center gap-3">
          <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
            <Plane className="w-6 h-6 text-accent" />
          </div>
          <div>
            <div className="font-semibold">{flight.airlineName}</div>
            <div className="text-sm text-muted-foreground">{flight.airlineCode}</div>
          </div>
        </div>

        {/* Flight Info */}
        <div className="flex-1 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{flight.cabinType}</Badge>
            <span className="text-muted-foreground">
              {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
            </span>
            {flight.refundable && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Refundable
              </Badge>
            )}
          </div>
        </div>

        {/* Destination */}
        <div className="lg:w-32 text-center">
          <div className="text-sm text-muted-foreground">To</div>
          <div className="font-semibold">{flight.destination}</div>
        </div>

        {/* Price & CTA */}
        <div className="lg:w-48 flex flex-col items-end gap-2">
          <div className="text-2xl font-semibold text-accent">{formatPrice(flight.totalFare, currency)}</div>
          <div className="text-xs text-muted-foreground">per person, return</div>
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

function FlightsContent() {
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "stops">("price");

  const origin = searchParams.get("origin") || "LON";
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  useEffect(() => {
    if (!destination || !departureDate || !returnDate) {
      setFlights([]);
      setLoading(false);
      return;
    }

    const fetchFlights = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use packages API and extract unique flights
        const params = new URLSearchParams({
          origin,
          destination,
          departureDate,
          returnDate,
          adults: adults.toString(),
          children: children.toString(),
          rooms: "1",
          currency,
        });

        const response = await fetch(`/api/search/packages?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch flights");
        }

        // Extract unique flights from packages
        const flightMap = new Map<string, FlightResult>();

        (data.data || []).forEach((pkg: any) => {
          // Add main flight
          if (pkg.flight && !flightMap.has(pkg.flight.id)) {
            flightMap.set(pkg.flight.id, {
              id: pkg.flight.id,
              airlineCode: pkg.flight.airlineCode,
              airlineName: pkg.flight.airlineName,
              totalFare: pkg.flight.totalFare,
              stops: pkg.flight.stops,
              cabinType: pkg.flight.cabinType,
              refundable: pkg.flight.refundable,
              destination: pkg.destination,
            });
          }

          // Add alternative flights
          (pkg.alternativeFlights || []).forEach((alt: any) => {
            if (!flightMap.has(alt.id)) {
              flightMap.set(alt.id, {
                id: alt.id,
                airlineCode: alt.airlineCode,
                airlineName: alt.airlineName,
                totalFare: alt.totalFare,
                stops: alt.stops,
                cabinType: "Economy",
                refundable: false,
                destination: pkg.destination,
              });
            }
          });
        });

        let results = Array.from(flightMap.values());

        // Sort flights
        if (sortBy === "price") {
          results.sort((a, b) => a.totalFare - b.totalFare);
        } else {
          results.sort((a, b) => a.stops - b.stops);
        }

        setFlights(results);
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch flights");
      } finally {
        setLoading(false);
      }
    };

    fetchFlights();
  }, [destination, departureDate, returnDate, adults, children, origin, currency, sortBy]);

  const hasSearchParams = destination && departureDate && returnDate;

  return (
    <>
      {/* Search Form */}
      <section className="bg-primary py-8">
        <div className="container-wide">
          <SearchForm defaultType="flights" />
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container-wide">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif mb-2">
                {destination ? `Flights to ${destination}` : "Search Flights"}
              </h1>
              <p className="text-muted-foreground">
                {!hasSearchParams && "Enter your travel details to find available flights"}
                {hasSearchParams && loading && "Searching for flights..."}
                {hasSearchParams && !loading && `${flights.length} flight options found`}
                {departureDate && ` • ${departureDate}`}
                {returnDate && ` - ${returnDate}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {flights.length > 0 && (
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "price" | "stops")}
                    className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  >
                    <option value="price">Sort by Price</option>
                    <option value="stops">Sort by Stops</option>
                  </select>
                </div>
              )}

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
              <h2 className="text-2xl font-serif mb-4">Start Your Flight Search</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Use the search form above to find flights. Select your destination,
                travel dates, and number of passengers to see available options.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchParams && loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Searching for flights...</span>
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

          {/* Results List */}
          {hasSearchParams && !loading && !error && flights.length > 0 && (
            <div className="space-y-4">
              {flights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} currency={currency} />
              ))}
            </div>
          )}

          {/* No Results */}
          {hasSearchParams && !loading && !error && flights.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4">No flights found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or contact us for assistance.
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
            <h2 className="text-2xl font-serif mb-4">Looking for the Best Flight Deal?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our flight specialists can find you exclusive fares and help you book complex itineraries.
              Call us for personalized service and access to deals not available online.
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

export default function FlightsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <FlightsContent />
    </Suspense>
  );
}
