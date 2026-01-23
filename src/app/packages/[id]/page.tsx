"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Calendar,
  Users,
  Star,
  Plane,
  Building,
  Camera,
  Check,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

// Mock package data - in production this would come from API
const mockPackageDetails = {
  "paris-swiss-alps": {
    id: "paris-swiss-alps",
    title: "Romantic Paris & Swiss Alps Getaway",
    subtitle: "Experience the magic of two iconic European destinations",
    images: [
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
      "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    ],
    destination: "Paris & Geneva",
    duration: { nights: 6, days: 7 },
    price: 2499,
    originalPrice: 2899,
    pricePerPerson: 1249,
    rating: 4.8,
    reviewCount: 124,
    includes: [
      "Return flights from London",
      "3 nights in Paris (4-star hotel)",
      "3 nights in Geneva (4-star hotel)",
      "Daily breakfast",
      "Airport transfers",
      "Eiffel Tower skip-the-line tickets",
      "Swiss Alps day tour",
      "City walking tours",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Paris",
        description:
          "Arrive at Paris Charles de Gaulle Airport. Private transfer to your 4-star hotel in the heart of Paris. Evening at leisure to explore the neighborhood.",
      },
      {
        day: 2,
        title: "Paris Highlights",
        description:
          "Skip-the-line access to the Eiffel Tower. Walking tour of the Champs-Élysées, Arc de Triomphe, and Tuileries Garden. Evening Seine river cruise.",
      },
      {
        day: 3,
        title: "Montmartre & Museums",
        description:
          "Morning visit to Montmartre and Sacré-Cœur. Afternoon at the Louvre or Musée d'Orsay. Optional evening cabaret show.",
      },
      {
        day: 4,
        title: "Paris to Geneva",
        description:
          "Morning TGV train to Geneva (3 hours). Check in to your lakeside hotel. Afternoon exploring Geneva's Old Town and the Jet d'Eau fountain.",
      },
      {
        day: 5,
        title: "Swiss Alps Adventure",
        description:
          "Full-day excursion to the Swiss Alps. Visit Chamonix and take the cable car for stunning Mont Blanc views. Traditional Swiss lunch included.",
      },
      {
        day: 6,
        title: "Lake Geneva & Chocolate",
        description:
          "Morning boat cruise on Lake Geneva. Visit a Swiss chocolate factory. Afternoon free for shopping or spa.",
      },
      {
        day: 7,
        title: "Departure",
        description:
          "Private transfer to Geneva Airport for your return flight to London.",
      },
    ],
    hotels: [
      {
        name: "Le Marais Boutique Hotel",
        location: "Paris, France",
        rating: 4,
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
      },
      {
        name: "Hotel Beau-Rivage",
        location: "Geneva, Switzerland",
        rating: 4,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
      },
    ],
    flights: {
      outbound: {
        airline: "British Airways",
        departure: "08:00",
        arrival: "10:30",
        route: "London Heathrow → Paris CDG",
      },
      return: {
        airline: "Swiss Air",
        departure: "14:00",
        arrival: "14:45",
        route: "Geneva → London Heathrow",
      },
    },
    highlights: [
      "Skip-the-line Eiffel Tower access",
      "Scenic TGV train journey",
      "Mont Blanc cable car experience",
      "Swiss chocolate tasting",
      "Lake Geneva cruise",
    ],
    terms: [
      "Package price is per person based on 2 adults sharing",
      "Single supplement available at additional cost",
      "Prices subject to availability",
      "Full payment required at time of booking",
      "Cancellation fees may apply",
    ],
  },
  "maldives-water-villa": {
    id: "maldives-water-villa",
    title: "Luxury Maldives Water Villa Escape",
    subtitle: "Ultimate tropical paradise with overwater luxury",
    images: [
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80",
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
    ],
    destination: "Maldives",
    duration: { nights: 5, days: 6 },
    price: 3299,
    originalPrice: 3799,
    pricePerPerson: 1649,
    rating: 4.9,
    reviewCount: 89,
    includes: [
      "Return flights from London",
      "5 nights in overwater villa",
      "All-inclusive meal plan",
      "Speedboat transfers",
      "Snorkeling equipment",
      "Sunset dolphin cruise",
      "Couples spa treatment",
      "Water sports activities",
    ],
    itinerary: [
      {
        day: 1,
        title: "Arrival in Paradise",
        description:
          "Arrive at Malé International Airport. Scenic speedboat transfer to your private island resort. Welcome drinks and villa orientation.",
      },
      {
        day: 2,
        title: "Island Discovery",
        description:
          "Morning snorkeling on the house reef. Afternoon spa treatment. Sunset dolphin watching cruise.",
      },
      {
        day: 3,
        title: "Water Activities",
        description:
          "Choose from kayaking, paddleboarding, or jet skiing. Private picnic on a sandbank. Night fishing experience.",
      },
      {
        day: 4,
        title: "Relaxation Day",
        description:
          "Full day at leisure. Enjoy your private villa deck, infinity pool, or beach. Optional diving excursion available.",
      },
      {
        day: 5,
        title: "Final Paradise Day",
        description:
          "Morning yoga session. Final snorkeling adventure. Romantic beach dinner under the stars.",
      },
      {
        day: 6,
        title: "Departure",
        description:
          "Leisurely breakfast in your villa. Speedboat transfer to Malé for your return flight.",
      },
    ],
    hotels: [
      {
        name: "Soneva Fushi Water Villa",
        location: "Baa Atoll, Maldives",
        rating: 5,
        image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&q=80",
      },
    ],
    flights: {
      outbound: {
        airline: "Emirates",
        departure: "21:00",
        arrival: "13:30+1",
        route: "London Heathrow → Malé (via Dubai)",
      },
      return: {
        airline: "Emirates",
        departure: "16:00",
        arrival: "06:30+1",
        route: "Malé → London Heathrow (via Dubai)",
      },
    },
    highlights: [
      "Private overwater villa with glass floor",
      "All-inclusive dining",
      "House reef snorkeling",
      "Dolphin watching cruise",
      "Complimentary water sports",
    ],
    terms: [
      "Package price is per person based on 2 adults sharing",
      "Peak season supplements may apply",
      "Prices subject to availability",
      "Full payment required at time of booking",
      "Travel insurance recommended",
    ],
  },
};

type PackageId = keyof typeof mockPackageDetails;

export default function PackageDetailPage() {
  const params = useParams();
  const packageId = params.id as string;

  const pkg = mockPackageDetails[packageId as PackageId];
  const currency: Currency = "GBP";

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif mb-4">Package Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The package you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/packages">Browse All Packages</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh]">
        <Image
          src={pkg.images[0]}
          alt={pkg.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-wide">
            <Link
              href="/packages"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Packages
            </Link>
            <h1 className="text-3xl md:text-5xl font-serif text-white mb-2">
              {pkg.title}
            </h1>
            <p className="text-xl text-white/80 mb-4">{pkg.subtitle}</p>
            <div className="flex flex-wrap items-center gap-4 text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{pkg.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>
                  {pkg.duration.nights} nights / {pkg.duration.days} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span>
                  {pkg.rating} ({pkg.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image Gallery */}
              <div className="grid grid-cols-3 gap-4">
                {pkg.images.slice(1, 4).map((image, index) => (
                  <div key={index} className="relative aspect-[4/3] rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${pkg.title} ${index + 2}`}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>

              {/* What's Included */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-serif mb-4">What&apos;s Included</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {pkg.includes.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itinerary */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-serif mb-6">Itinerary</h2>
                <div className="space-y-6">
                  {pkg.itinerary.map((day, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{day.title}</h3>
                        <p className="text-muted-foreground">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hotels */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-serif mb-4 flex items-center gap-2">
                  <Building className="w-6 h-6" />
                  Your Accommodation
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {pkg.hotels.map((hotel, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={hotel.image}
                          alt={hotel.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">{hotel.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {hotel.location}
                        </p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: hotel.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flights */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h2 className="text-2xl font-serif mb-4 flex items-center gap-2">
                  <Plane className="w-6 h-6" />
                  Flight Details
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Badge className="mb-2">Outbound</Badge>
                    <p className="font-semibold">{pkg.flights.outbound.airline}</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.flights.outbound.route}
                    </p>
                    <p className="text-sm">
                      {pkg.flights.outbound.departure} → {pkg.flights.outbound.arrival}
                    </p>
                  </div>
                  <div>
                    <Badge className="mb-2">Return</Badge>
                    <p className="font-semibold">{pkg.flights.return.airline}</p>
                    <p className="text-sm text-muted-foreground">
                      {pkg.flights.return.route}
                    </p>
                    <p className="text-sm">
                      {pkg.flights.return.departure} → {pkg.flights.return.arrival}
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground mb-2">Terms & Conditions</h3>
                <ul className="list-disc list-inside space-y-1">
                  {pkg.terms.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-xl p-6 border border-border shadow-lg">
                {/* Price */}
                <div className="mb-6">
                  {pkg.originalPrice && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatPrice(pkg.originalPrice, currency)}
                    </div>
                  )}
                  <div className="text-3xl font-semibold text-primary">
                    {formatPrice(pkg.price, currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(pkg.pricePerPerson, currency)} per person
                  </div>
                </div>

                {/* Highlights */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Package Highlights</h3>
                  <div className="space-y-2">
                    {pkg.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Star className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Button size="lg" className="w-full mb-3" asChild>
                  <a href="tel:+442089444555" className="flex items-center justify-center gap-2">
                    <Phone className="h-5 w-5" />
                    Call to Book
                  </a>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Call us at <strong>020 8944 4555</strong>
                </p>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <div className="font-semibold">ATOL Protected</div>
                      <div className="text-muted-foreground">Your money is safe</div>
                    </div>
                    <div>
                      <div className="font-semibold">24/7 Support</div>
                      <div className="text-muted-foreground">We&apos;re here to help</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="section bg-muted">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">Need Help Planning Your Trip?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our travel experts can customize this package to your preferences or create
            a completely bespoke itinerary just for you.
          </p>
          <Button size="lg" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
