"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Plane, Clock, Luggage, SortAsc, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Currency } from "@/types";

interface FlightResult {
  id: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  price: number;
  cabinClass: string;
  baggage: string;
}

// Mock data for flights
const mockFlights: FlightResult[] = [
  {
    id: "flight-1",
    airline: "British Airways",
    flightNumber: "BA123",
    origin: "LHR",
    destination: "CDG",
    departureTime: "09:00",
    arrivalTime: "11:30",
    duration: 150,
    stops: 0,
    price: 189,
    cabinClass: "Economy",
    baggage: "23kg checked bag included",
  },
  {
    id: "flight-2",
    airline: "Emirates",
    flightNumber: "EK456",
    origin: "LHR",
    destination: "DXB",
    departureTime: "14:30",
    arrivalTime: "23:45",
    duration: 435,
    stops: 0,
    price: 449,
    cabinClass: "Economy",
    baggage: "30kg checked bag included",
  },
  {
    id: "flight-3",
    airline: "Singapore Airlines",
    flightNumber: "SQ789",
    origin: "LHR",
    destination: "SIN",
    departureTime: "22:00",
    arrivalTime: "18:30+1",
    duration: 780,
    stops: 0,
    price: 599,
    cabinClass: "Economy",
    baggage: "30kg checked bag included",
  },
  {
    id: "flight-4",
    airline: "Qatar Airways",
    flightNumber: "QR012",
    origin: "LHR",
    destination: "MLE",
    departureTime: "20:15",
    arrivalTime: "11:45+1",
    duration: 630,
    stops: 1,
    price: 689,
    cabinClass: "Economy",
    baggage: "30kg checked bag included",
  },
  {
    id: "flight-5",
    airline: "Qantas",
    flightNumber: "QF001",
    origin: "LHR",
    destination: "SYD",
    departureTime: "18:00",
    arrivalTime: "22:30+1",
    duration: 1350,
    stops: 1,
    price: 899,
    cabinClass: "Economy",
    baggage: "23kg checked bag included",
  },
];

function FlightCard({ flight, currency }: { flight: FlightResult; currency: Currency }) {
  return (
    <div className="card-hover p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        {/* Airline & Flight */}
        <div className="lg:w-32 flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm">{flight.airline}</div>
            <div className="text-xs text-muted-foreground">{flight.flightNumber}</div>
          </div>
        </div>

        {/* Times & Route */}
        <div className="flex-1 flex items-center justify-between lg:justify-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-semibold">{flight.departureTime}</div>
            <div className="text-sm text-muted-foreground">{flight.origin}</div>
          </div>

          <div className="flex-1 max-w-[200px] flex flex-col items-center gap-1">
            <div className="text-xs text-muted-foreground">{formatDuration(flight.duration)}</div>
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-px bg-border"></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground">
              {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">{flight.arrivalTime}</div>
            <div className="text-sm text-muted-foreground">{flight.destination}</div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:w-40 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Luggage className="w-4 h-4" />
            <span>{flight.baggage}</span>
          </div>
          <Badge variant="secondary" className="w-fit">{flight.cabinClass}</Badge>
        </div>

        {/* Price & CTA */}
        <div className="lg:w-40 flex flex-col items-end gap-2">
          <div className="text-2xl font-semibold">{formatPrice(flight.price, currency)}</div>
          <div className="text-xs text-muted-foreground">per person</div>
          <Button size="sm" asChild>
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
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "duration">("price");

  const origin = searchParams.get("origin") || "LON";
  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = searchParams.get("adults") || "1";

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockFlights];

      // Sort
      if (sortBy === "price") {
        filtered.sort((a, b) => a.price - b.price);
      } else {
        filtered.sort((a, b) => a.duration - b.duration);
      }

      setFlights(filtered);
      setLoading(false);
    }, 1000);
  }, [destination, sortBy]);

  const currency: Currency = "GBP";

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
                Flights {origin && destination ? `from ${origin} to ${destination}` : ""}
              </h1>
              <p className="text-muted-foreground">
                {loading ? "Searching..." : `${flights.length} flights found`}
                {departureDate && ` • ${departureDate}`}
                {returnDate && ` - ${returnDate}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "price" | "duration")}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="price">Sort by Price</option>
                  <option value="duration">Sort by Duration</option>
                </select>
              </div>

              <Button asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call to Book
                </a>
              </Button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Searching for flights...</span>
            </div>
          )}

          {/* Results List */}
          {!loading && flights.length > 0 && (
            <div className="space-y-4">
              {flights.map((flight) => (
                <FlightCard key={flight.id} flight={flight} currency={currency} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && flights.length === 0 && (
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
            <h2 className="text-2xl font-serif mb-4">Looking for the Best Deal?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our flight specialists can find you exclusive fares and help you book complex itineraries.
              Call us for personalized service.
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
