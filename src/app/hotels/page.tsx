"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin, Star, Wifi, Car, Coffee, Dumbbell, SortAsc, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface HotelResult {
  id: string;
  name: string;
  image: string;
  location: string;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  pricePerNight: number;
  totalPrice: number;
  amenities: string[];
  freeCancellation: boolean;
}

// Mock data for hotels
const mockHotels: HotelResult[] = [
  {
    id: "hotel-1",
    name: "Grand Luxury Resort & Spa",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    location: "Beachfront, Maldives",
    starRating: 5,
    reviewScore: 9.4,
    reviewCount: 1250,
    pricePerNight: 450,
    totalPrice: 3150,
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    freeCancellation: true,
  },
  {
    id: "hotel-2",
    name: "City Center Boutique Hotel",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    location: "Downtown, Paris",
    starRating: 4,
    reviewScore: 8.8,
    reviewCount: 890,
    pricePerNight: 180,
    totalPrice: 1260,
    amenities: ["WiFi", "Restaurant", "Bar", "Room Service"],
    freeCancellation: true,
  },
  {
    id: "hotel-3",
    name: "Beachside Paradise Resort",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    location: "Kuta Beach, Bali",
    starRating: 5,
    reviewScore: 9.2,
    reviewCount: 2100,
    pricePerNight: 220,
    totalPrice: 1540,
    amenities: ["WiFi", "Pool", "Beach Access", "Spa", "Restaurant"],
    freeCancellation: true,
  },
  {
    id: "hotel-4",
    name: "Marina Bay Suites",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    location: "Marina, Dubai",
    starRating: 5,
    reviewScore: 9.0,
    reviewCount: 1800,
    pricePerNight: 320,
    totalPrice: 2240,
    amenities: ["WiFi", "Pool", "Gym", "Restaurant", "Parking"],
    freeCancellation: false,
  },
  {
    id: "hotel-5",
    name: "Historic Town Hotel",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    location: "Old Town, Bangkok",
    starRating: 4,
    reviewScore: 8.5,
    reviewCount: 650,
    pricePerNight: 85,
    totalPrice: 595,
    amenities: ["WiFi", "Restaurant", "Bar", "Spa"],
    freeCancellation: true,
  },
];

function HotelCard({ hotel, currency, nights }: { hotel: HotelResult; currency: Currency; nights: number }) {
  return (
    <div className="card-hover flex flex-col md:flex-row overflow-hidden">
      {/* Image */}
      <div className="relative w-full md:w-72 h-48 md:h-auto flex-shrink-0">
        <Image
          src={hotel.image}
          alt={hotel.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 288px"
        />
        {hotel.freeCancellation && (
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
                <span>{hotel.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>

          {/* Review Score */}
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-primary text-white text-sm font-semibold px-2 py-1 rounded">
              {hotel.reviewScore}
            </span>
            <span className="text-sm text-muted-foreground">
              {hotel.reviewScore >= 9 ? "Exceptional" : hotel.reviewScore >= 8 ? "Excellent" : "Very Good"}
              {" • "}
              {hotel.reviewCount.toLocaleString()} reviews
            </span>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
              >
                {amenity === "WiFi" && <Wifi className="w-3 h-3" />}
                {amenity === "Parking" && <Car className="w-3 h-3" />}
                {amenity === "Restaurant" && <Coffee className="w-3 h-3" />}
                {amenity === "Gym" && <Dumbbell className="w-3 h-3" />}
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            <div className="text-sm text-muted-foreground">
              {nights} nights, per room
            </div>
            <div className="text-2xl font-semibold">{formatPrice(hotel.totalPrice, currency)}</div>
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
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");

  const destination = searchParams.get("destination");
  const checkIn = searchParams.get("departureDate");
  const checkOut = searchParams.get("returnDate");
  const adults = searchParams.get("adults") || "2";
  const rooms = searchParams.get("rooms") || "1";

  // Calculate nights
  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 7;

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockHotels];

      // Sort
      if (sortBy === "price") {
        filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
      } else {
        filtered.sort((a, b) => b.reviewScore - a.reviewScore);
      }

      setHotels(filtered);
      setLoading(false);
    }, 1000);
  }, [destination, sortBy]);

  const currency: Currency = "GBP";

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
                {destination ? `Hotels in ${destination}` : "All Hotels"}
              </h1>
              <p className="text-muted-foreground">
                {loading ? "Searching..." : `${hotels.length} hotels found`}
                {checkIn && ` • ${checkIn}`}
                {checkOut && ` - ${checkOut}`}
                {` • ${rooms} room${parseInt(rooms) > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-4">
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
              <span className="ml-3 text-muted-foreground">Searching for hotels...</span>
            </div>
          )}

          {/* Results List */}
          {!loading && hotels.length > 0 && (
            <div className="space-y-6">
              {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} currency={currency} nights={nights} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && hotels.length === 0 && (
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
