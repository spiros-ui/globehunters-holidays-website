"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  MapPin,
  Calendar,
  Sun,
  Plane,
  Building,
  Camera,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageCard } from "@/components/results/PackageCard";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

// Mock destination data
const destinations: Record<string, {
  slug: string;
  name: string;
  country: string;
  heroImage: string;
  description: string;
  highlights: string[];
  bestTimeToVisit: string;
  averageTemp: string;
  flightTime: string;
  currency: string;
  language: string;
  gallery: string[];
  topAttractions: Array<{ name: string; description: string; image: string }>;
  packages: Array<{
    id: string;
    title: string;
    image: string;
    destination: string;
    nights: number;
    price: number;
    originalPrice?: number;
    includes: string[];
    rating?: number;
  }>;
}> = {
  maldives: {
    slug: "maldives",
    name: "Maldives",
    country: "Republic of Maldives",
    heroImage: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1600&q=80",
    description:
      "The Maldives is a tropical paradise consisting of 26 atolls and over 1,000 coral islands in the Indian Ocean. Known for its crystal-clear waters, white sandy beaches, and luxurious overwater villas, it's the ultimate destination for romance, relaxation, and underwater adventures.",
    highlights: [
      "Overwater villa experiences",
      "World-class snorkeling and diving",
      "Private island resorts",
      "Bioluminescent beaches",
      "Sunset dolphin cruises",
    ],
    bestTimeToVisit: "November - April",
    averageTemp: "28°C",
    flightTime: "10h from London",
    currency: "MVR (USD widely accepted)",
    language: "Dhivehi, English",
    gallery: [
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
      "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&q=80",
      "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80",
    ],
    topAttractions: [
      {
        name: "Underwater Restaurant",
        description: "Dine beneath the waves at one of the world's most unique restaurants",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
      },
      {
        name: "Male Fish Market",
        description: "Experience local culture at the bustling capital city market",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
      },
      {
        name: "Banana Reef",
        description: "One of the best diving sites with colorful coral and marine life",
        image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=600&q=80",
      },
    ],
    packages: [
      {
        id: "maldives-water-villa",
        title: "Luxury Maldives Water Villa Escape",
        image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
        destination: "Maldives",
        nights: 5,
        price: 3299,
        originalPrice: 3799,
        includes: ["Flights", "Hotel", "All-Inclusive"],
        rating: 4.9,
      },
      {
        id: "maldives-romantic",
        title: "Romantic Maldives Honeymoon",
        image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
        destination: "Maldives",
        nights: 7,
        price: 4299,
        originalPrice: 4899,
        includes: ["Flights", "Hotel", "Transfers", "Spa"],
        rating: 4.8,
      },
    ],
  },
  bali: {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    heroImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80",
    description:
      "Bali, the Island of the Gods, offers a perfect blend of stunning beaches, lush rice terraces, ancient temples, and vibrant culture. From surfing in Kuta to yoga retreats in Ubud, this Indonesian paradise caters to every type of traveler.",
    highlights: [
      "Iconic rice terrace landscapes",
      "Ancient Hindu temples",
      "World-class surf breaks",
      "Traditional Balinese culture",
      "Luxury spa retreats",
    ],
    bestTimeToVisit: "April - October",
    averageTemp: "27°C",
    flightTime: "16h from London",
    currency: "IDR",
    language: "Balinese, Indonesian, English",
    gallery: [
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
      "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&q=80",
      "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80",
    ],
    topAttractions: [
      {
        name: "Tegallalang Rice Terraces",
        description: "Stunning green rice paddies with traditional irrigation",
        image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&q=80",
      },
      {
        name: "Tanah Lot Temple",
        description: "Iconic sea temple perched on a rocky outcrop",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80",
      },
      {
        name: "Ubud Monkey Forest",
        description: "Sacred sanctuary home to hundreds of macaques",
        image: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600&q=80",
      },
    ],
    packages: [
      {
        id: "bali-retreat",
        title: "Bali Jungle & Beach Retreat",
        image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
        destination: "Bali",
        nights: 7,
        price: 1899,
        originalPrice: 2299,
        includes: ["Flights", "Hotel", "Tours"],
        rating: 4.7,
      },
      {
        id: "bali-wellness",
        title: "Bali Wellness & Yoga Escape",
        image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
        destination: "Bali",
        nights: 10,
        price: 2499,
        originalPrice: 2899,
        includes: ["Flights", "Hotel", "Yoga", "Spa"],
        rating: 4.8,
      },
    ],
  },
  dubai: {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80",
    description:
      "Dubai is a city of superlatives - home to the world's tallest building, largest shopping mall, and most luxurious hotels. This modern metropolis in the desert offers incredible architecture, world-class dining, endless shopping, and thrilling desert adventures.",
    highlights: [
      "Burj Khalifa observation deck",
      "World-class shopping",
      "Desert safari adventures",
      "Palm Jumeirah beaches",
      "Luxury hotel experiences",
    ],
    bestTimeToVisit: "November - March",
    averageTemp: "25°C (winter)",
    flightTime: "7h from London",
    currency: "AED",
    language: "Arabic, English",
    gallery: [
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
      "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&q=80",
      "https://images.unsplash.com/photo-1597659840241-37e2b9c2f55f?w=800&q=80",
    ],
    topAttractions: [
      {
        name: "Burj Khalifa",
        description: "The world's tallest building with stunning city views",
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80",
      },
      {
        name: "Dubai Mall",
        description: "Massive shopping and entertainment destination",
        image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80",
      },
      {
        name: "Palm Jumeirah",
        description: "Iconic man-made island with luxury resorts",
        image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&q=80",
      },
    ],
    packages: [
      {
        id: "dubai-luxury",
        title: "Dubai Luxury Experience",
        image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        destination: "Dubai",
        nights: 5,
        price: 1599,
        originalPrice: 1899,
        includes: ["Flights", "Hotel", "Tours"],
        rating: 4.6,
      },
      {
        id: "dubai-desert",
        title: "Dubai City & Desert Adventure",
        image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80",
        destination: "Dubai",
        nights: 6,
        price: 1899,
        originalPrice: 2199,
        includes: ["Flights", "Hotel", "Safari", "Tours"],
        rating: 4.7,
      },
    ],
  },
  thailand: {
    slug: "thailand",
    name: "Thailand",
    country: "Kingdom of Thailand",
    heroImage: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&q=80",
    description:
      "Thailand offers an incredible mix of ancient temples, bustling cities, pristine beaches, and mouthwatering cuisine. From the vibrant streets of Bangkok to the tranquil islands of the south, the Land of Smiles welcomes travelers with open arms.",
    highlights: [
      "Ornate Buddhist temples",
      "Tropical island hopping",
      "World-famous street food",
      "Elephant sanctuaries",
      "Full Moon Party experiences",
    ],
    bestTimeToVisit: "November - February",
    averageTemp: "28°C",
    flightTime: "11h from London",
    currency: "THB",
    language: "Thai, English",
    gallery: [
      "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&q=80",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
      "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&q=80",
    ],
    topAttractions: [
      {
        name: "Grand Palace, Bangkok",
        description: "Stunning royal palace complex with Emerald Buddha",
        image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80",
      },
      {
        name: "Phi Phi Islands",
        description: "Paradise islands with crystal-clear waters",
        image: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&q=80",
      },
      {
        name: "Chiang Mai Temples",
        description: "Ancient temples nestled in the northern mountains",
        image: "https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=600&q=80",
      },
    ],
    packages: [
      {
        id: "thailand-adventure",
        title: "Thailand Adventure & Relaxation",
        image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
        destination: "Bangkok & Phuket",
        nights: 8,
        price: 1299,
        originalPrice: 1599,
        includes: ["Flights", "Hotels", "Tours"],
        rating: 4.5,
      },
      {
        id: "thailand-islands",
        title: "Thai Island Paradise",
        image: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&q=80",
        destination: "Phuket & Koh Samui",
        nights: 10,
        price: 1799,
        originalPrice: 2099,
        includes: ["Flights", "Hotels", "Island Hopping"],
        rating: 4.7,
      },
    ],
  },
};

export default function DestinationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const destination = destinations[slug];
  const currency: Currency = "GBP";

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif mb-4">Destination Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The destination you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/">Browse All Destinations</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh]">
        <Image
          src={destination.heroImage}
          alt={destination.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container-wide">
            <Badge className="mb-4">{destination.country}</Badge>
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">
              {destination.name}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl">
              {destination.description}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-primary text-white py-4">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-sm text-white/70">Best Time</div>
              <div className="font-semibold">{destination.bestTimeToVisit}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Temperature</div>
              <div className="font-semibold">{destination.averageTemp}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Flight Time</div>
              <div className="font-semibold">{destination.flightTime}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Currency</div>
              <div className="font-semibold">{destination.currency}</div>
            </div>
            <div>
              <div className="text-sm text-white/70">Language</div>
              <div className="font-semibold">{destination.language}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="py-8 bg-muted">
        <div className="container-wide">
          <h2 className="text-2xl font-serif text-center mb-6">
            Search Holidays to {destination.name}
          </h2>
          <SearchForm defaultType="packages" />
        </div>
      </section>

      {/* Highlights */}
      <section className="section">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-8">
            Why Visit {destination.name}?
          </h2>
          <div className="grid md:grid-cols-5 gap-6">
            {destination.highlights.map((highlight, index) => (
              <div
                key={index}
                className="text-center p-4 bg-card rounded-xl border border-border"
              >
                <Star className="w-8 h-8 text-accent mx-auto mb-3" />
                <p className="font-medium">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-8">
            Discover {destination.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {destination.gallery.map((image, index) => (
              <div
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                <Image
                  src={image}
                  alt={`${destination.name} ${index + 1}`}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Attractions */}
      <section className="section">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-8">
            Top Attractions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {destination.topAttractions.map((attraction, index) => (
              <div
                key={index}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className="relative aspect-[16/9]">
                  <Image
                    src={attraction.image}
                    alt={attraction.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{attraction.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {attraction.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-8">
            Holiday Packages to {destination.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destination.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                id={pkg.id}
                title={pkg.title}
                image={pkg.image}
                destination={pkg.destination}
                nights={pkg.nights}
                price={pkg.price}
                originalPrice={pkg.originalPrice}
                currency={currency}
                includes={pkg.includes}
                rating={pkg.rating}
              />
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href={`/packages?destination=${destination.name}`}>
                View All {destination.name} Packages
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary text-white">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">
            Ready to Explore {destination.name}?
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our travel experts specialize in {destination.name} holidays and can
            create the perfect itinerary for you. Call now for exclusive deals
            and personalized recommendations.
          </p>
          <Button size="lg" variant="secondary" asChild>
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
