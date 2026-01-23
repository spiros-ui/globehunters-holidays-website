"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, Star, ArrowLeft, Loader2, Check, Wifi, Coffee, Car, Waves, Dumbbell, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  breakfast: <Coffee className="w-5 h-5" />,
  parking: <Car className="w-5 h-5" />,
  pool: <Waves className="w-5 h-5" />,
  gym: <Dumbbell className="w-5 h-5" />,
  restaurant: <Utensils className="w-5 h-5" />,
};

// Common hotel amenities
const commonAmenities = [
  { id: "wifi", name: "Free WiFi" },
  { id: "breakfast", name: "Breakfast Included" },
  { id: "parking", name: "Free Parking" },
  { id: "pool", name: "Swimming Pool" },
  { id: "gym", name: "Fitness Center" },
  { id: "restaurant", name: "On-site Restaurant" },
];

function HotelDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();

  // Get hotel data from query params
  const name = searchParams.get("name") || "Hotel";
  const thumbnail = searchParams.get("thumbnail") || "";
  const address = searchParams.get("address") || "";
  const cityName = searchParams.get("cityName") || "";
  const destination = searchParams.get("destination") || "";
  const starRating = parseInt(searchParams.get("starRating") || "0");
  const reviewScore = parseFloat(searchParams.get("reviewScore") || "0");
  const reviewScoreWord = searchParams.get("reviewScoreWord") || "";
  const pricePerNight = parseFloat(searchParams.get("pricePerNight") || "0");
  const boardType = searchParams.get("boardType") || "Room Only";
  const refundable = searchParams.get("refundable") === "true";
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const nights = parseInt(searchParams.get("nights") || "7");
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const rooms = parseInt(searchParams.get("rooms") || "1");
  const adults = parseInt(searchParams.get("adults") || "2");

  const totalPrice = pricePerNight * nights;

  return (
    <>
      {/* Back Navigation */}
      <div className="bg-muted py-4">
        <div className="container-wide">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hotel Search
          </Link>
        </div>
      </div>

      {/* Hero Section with Hotel Image */}
      <section className="relative h-[40vh] md:h-[50vh] min-h-[300px]">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No image available</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Hotel Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="container-wide">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {starRating > 0 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: starRating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
              {refundable && (
                <Badge className="bg-green-500 text-white">Free Cancellation</Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-2">
              {name}
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <MapPin className="w-5 h-5" />
              <span>{cityName}{destination && `, ${destination}`}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Hotel Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Review Score */}
              {reviewScore > 0 && (
                <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
                  <div className="bg-primary text-white text-2xl font-bold px-4 py-2 rounded-lg">
                    {reviewScore}
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{reviewScoreWord}</div>
                    <div className="text-sm text-muted-foreground">Based on guest reviews</div>
                  </div>
                </div>
              )}

              {/* Address */}
              {address && (
                <div>
                  <h2 className="text-xl font-serif mb-3">Location</h2>
                  <p className="text-muted-foreground">{address}</p>
                </div>
              )}

              {/* Board Type */}
              <div>
                <h2 className="text-xl font-serif mb-3">Board Type</h2>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {boardType}
                </Badge>
              </div>

              {/* Amenities */}
              <div>
                <h2 className="text-xl font-serif mb-4">Popular Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {commonAmenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      {amenityIcons[amenity.id]}
                      <span className="text-sm">{amenity.name}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  * Amenities may vary. Please call to confirm specific facilities.
                </p>
              </div>

              {/* Booking Details */}
              {(checkIn || checkOut) && (
                <div>
                  <h2 className="text-xl font-serif mb-3">Your Stay</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {checkIn && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Check-in</div>
                        <div className="font-semibold">{checkIn}</div>
                      </div>
                    )}
                    {checkOut && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Check-out</div>
                        <div className="font-semibold">{checkOut}</div>
                      </div>
                    )}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Nights</div>
                      <div className="font-semibold">{nights}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Guests</div>
                      <div className="font-semibold">{adults} Adults, {rooms} Room{rooms > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-border rounded-xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    {nights} nights, per room
                  </div>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {formatPrice(totalPrice, currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(pricePerNight, currency)} per night
                  </div>
                </div>

                {refundable && (
                  <div className="flex items-center gap-2 text-green-600 mb-6 justify-center">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Free cancellation available</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Button size="lg" className="w-full" asChild>
                    <a href="tel:+442089444555" className="flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" />
                      Call to Book
                    </a>
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    020 8944 4555
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-3">Why Book With Us?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Personalized service from travel experts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Best price guarantee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>ATOL protected holidays</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>24/7 customer support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-12">
        <div className="container-wide text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">
            Ready to Book Your Stay at {name}?
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our accommodation specialists are ready to help you secure the best rates
            and customize your booking to your preferences.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

export default function HotelDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <HotelDetailContent id={params.id} />
    </Suspense>
  );
}
