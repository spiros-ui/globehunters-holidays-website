"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Phone, MapPin, Star, SortAsc, Loader2, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface HotelResult {
  id: string;
  name: string;
  thumbnail: string;
  images: string[];
  address: string;
  cityName: string;
  starRating: number;
  reviewScore: number;
  reviewScoreWord: string;
  pricePerNight: number;
  totalPrice: number;
  boardType: string;
  refundable: boolean;
  destination: string;
}

function HotelCard({ hotel, currency, nights }: { hotel: HotelResult; currency: Currency; nights: number }) {
  return (
    <div className="card-hover flex flex-col md:flex-row overflow-hidden">
      {/* Image */}
      <div className="relative w-full md:w-80 h-56 md:h-auto flex-shrink-0">
        <Image
          src={hotel.thumbnail}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        {hotel.refundable && (
          <Badge className="absolute top-3 left-3 bg-green-500 text-white">
            Free Cancellation
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-serif text-xl mb-1">{hotel.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{hotel.cityName}, {hotel.destination}</span>
              </div>
            </div>
            {hotel.starRating > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            )}
          </div>

          {/* Review Score */}
          {hotel.reviewScore > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary text-white text-sm font-semibold px-2 py-1 rounded">
                {hotel.reviewScore}
              </span>
              <span className="text-sm text-muted-foreground">
                {hotel.reviewScoreWord}
              </span>
            </div>
          )}

          {/* Board Type */}
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{hotel.boardType}</Badge>
          </div>

          {/* Address */}
          <p className="text-sm text-muted-foreground">{hotel.address}</p>
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border mt-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {nights} nights, per room
            </div>
            <div className="text-2xl font-semibold text-accent">
              {formatPrice(hotel.pricePerNight * nights, currency)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatPrice(hotel.pricePerNight, currency)} per night
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

function HotelsContent() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<HotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");

  const origin = searchParams.get("origin") || "LON";
  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("departureDate");
  const checkOut = searchParams.get("returnDate");
  const adults = parseInt(searchParams.get("adults") || "2");
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const currency = (searchParams.get("currency") || "GBP") as Currency;

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 7;

  useEffect(() => {
    if (!destination || !checkIn || !checkOut) {
      setHotels([]);
      setLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      setError(null);

      try {
        // Use packages API and extract unique hotels
        const params = new URLSearchParams({
          origin,
          destination,
          departureDate: checkIn,
          returnDate: checkOut,
          adults: adults.toString(),
          children: "0",
          rooms: rooms.toString(),
          currency,
        });

        const response = await fetch(`/api/search/packages?${params}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch hotels");
        }

        // Extract unique hotels from packages
        const hotelMap = new Map<string, HotelResult>();

        (data.data || []).forEach((pkg: any) => {
          if (pkg.hotel && !hotelMap.has(pkg.hotel.id)) {
            hotelMap.set(pkg.hotel.id, {
              id: pkg.hotel.id,
              name: pkg.hotel.name,
              thumbnail: pkg.hotel.thumbnail,
              images: pkg.hotel.images || [pkg.hotel.thumbnail],
              address: pkg.hotel.address,
              cityName: pkg.hotel.cityName,
              starRating: pkg.hotel.starRating,
              reviewScore: pkg.hotel.reviewScore,
              reviewScoreWord: pkg.hotel.reviewScoreWord,
              pricePerNight: pkg.hotel.pricePerNight,
              totalPrice: pkg.hotel.pricePerNight * nights,
              boardType: pkg.hotel.boardType,
              refundable: pkg.hotel.refundable,
              destination: pkg.destination,
            });
          }
        });

        let results = Array.from(hotelMap.values());

        // Sort hotels
        if (sortBy === "price") {
          results.sort((a, b) => a.pricePerNight - b.pricePerNight);
        } else {
          results.sort((a, b) => (b.reviewScore || 0) - (a.reviewScore || 0));
        }

        setHotels(results);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch hotels");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [destination, checkIn, checkOut, adults, rooms, origin, currency, sortBy, nights]);

  const hasSearchParams = destination && checkIn && checkOut;

  return (
    <>
      {/* Search Form */}
      <section className="bg-primary py-8">
        <div className="container-wide">
          <SearchForm defaultType="hotels" />
        </div>
      </section>

      {/* Results */}
      <section className="section">
        <div className="container-wide">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-serif mb-2">
                {destination ? `Hotels in ${destination}` : "Search Hotels"}
              </h1>
              <p className="text-muted-foreground">
                {!hasSearchParams && "Enter your travel details to find available hotels"}
                {hasSearchParams && loading && "Searching for hotels..."}
                {hasSearchParams && !loading && `${hotels.length} hotels found`}
                {checkIn && ` • ${checkIn}`}
                {checkOut && ` - ${checkOut}`}
                {` • ${rooms} room${rooms > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {hotels.length > 0 && (
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
              <h2 className="text-2xl font-serif mb-4">Start Your Hotel Search</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Use the search form above to find hotels. Select your destination,
                check-in and check-out dates to see available options.
              </p>
            </div>
          )}

          {/* Loading */}
          {hasSearchParams && loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Searching for hotels...</span>
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
          {hasSearchParams && !loading && !error && hotels.length > 0 && (
            <div className="space-y-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} currency={currency} nights={nights} />
              ))}
            </div>
          )}

          {/* No Results */}
          {hasSearchParams && !loading && !error && hotels.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4">No hotels found</h2>
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
            <h2 className="text-2xl font-serif mb-4">Need Help Finding the Perfect Hotel?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our accommodation specialists can help you find hotels that match your preferences
              and budget. Call us for exclusive rates and personalized recommendations.
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

export default function HotelsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <HotelsContent />
    </Suspense>
  );
}
