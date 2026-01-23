"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/SearchForm";

const destinations = [
  {
    slug: "maldives",
    name: "Maldives",
    image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
    description: "Luxury overwater villas and pristine beaches",
    startingPrice: 2299,
  },
  {
    slug: "bali",
    name: "Bali",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    description: "Ancient temples and tropical paradise",
    startingPrice: 1299,
  },
  {
    slug: "dubai",
    name: "Dubai",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    description: "Modern luxury and desert adventures",
    startingPrice: 899,
  },
  {
    slug: "thailand",
    name: "Thailand",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    description: "Golden temples and island hopping",
    startingPrice: 999,
  },
  {
    slug: "paris",
    name: "Paris",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    description: "City of lights and romance",
    startingPrice: 599,
  },
  {
    slug: "australia",
    name: "Australia",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
    description: "Great Barrier Reef and iconic cities",
    startingPrice: 2499,
  },
  {
    slug: "japan",
    name: "Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    description: "Ancient tradition meets modern innovation",
    startingPrice: 1899,
  },
  {
    slug: "new-york",
    name: "New York",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    description: "The city that never sleeps",
    startingPrice: 799,
  },
  {
    slug: "caribbean",
    name: "Caribbean",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800&q=80",
    description: "Crystal waters and island vibes",
    startingPrice: 1499,
  },
  {
    slug: "mauritius",
    name: "Mauritius",
    image: "https://images.unsplash.com/photo-1586861203927-800a5acdcc4d?w=800&q=80",
    description: "Tropical paradise in the Indian Ocean",
    startingPrice: 1799,
  },
  {
    slug: "south-africa",
    name: "South Africa",
    image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80",
    description: "Safari adventures and stunning landscapes",
    startingPrice: 2199,
  },
  {
    slug: "greece",
    name: "Greece",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
    description: "Ancient history and island paradise",
    startingPrice: 699,
  },
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[40vh] bg-primary">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">
              Explore Our Destinations
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              From tropical beaches to vibrant cities, discover your next adventure
            </p>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 bg-muted">
        <div className="container-wide">
          <SearchForm defaultType="packages" />
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="section">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {destinations.map((destination) => (
              <Link
                key={destination.slug}
                href={`/destinations/${destination.slug}`}
                className="group"
              >
                <div className="card-hover overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif text-xl mb-1">{destination.name}</h3>
                      <p className="text-sm text-white/80 mb-2">
                        {destination.description}
                      </p>
                      <p className="text-sm">
                        From <span className="font-semibold">£{destination.startingPrice}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-muted">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">
            Can&apos;t Find Your Dream Destination?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We offer holidays to hundreds of destinations worldwide. Call our travel
            experts to discuss your perfect getaway.
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
