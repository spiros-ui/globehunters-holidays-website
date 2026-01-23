"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { Phone, Filter, SortAsc, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/components/results/PackageCard";
import { SearchForm } from "@/components/search/SearchForm";
import type { Currency } from "@/types";

interface PackageResult {
  id: string;
  title: string;
  image: string;
  destination: string;
  nights: number;
  price: number;
  originalPrice?: number;
  includes: string[];
  rating?: number;
}

// Mock data for packages
const mockPackages: PackageResult[] = [
  {
    id: "paris-swiss-alps",
    title: "Romantic Paris & Swiss Alps Getaway",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    destination: "Paris & Geneva",
    nights: 6,
    price: 2499,
    originalPrice: 2899,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.8,
  },
  {
    id: "maldives-water-villa",
    title: "Luxury Maldives Water Villa Escape",
    image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
    destination: "Maldives",
    nights: 5,
    price: 3299,
    originalPrice: 3799,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.9,
  },
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
    id: "thailand-adventure",
    title: "Thailand Adventure & Relaxation",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    destination: "Bangkok & Phuket",
    nights: 8,
    price: 1299,
    originalPrice: 1599,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.5,
  },
  {
    id: "australia-explorer",
    title: "Australia Explorer Package",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
    destination: "Sydney & Melbourne",
    nights: 10,
    price: 3999,
    originalPrice: 4499,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.8,
  },
];

function PackagesContent() {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<PackageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");

  const destination = searchParams.get("destination");
  const departureDate = searchParams.get("departureDate");
  const returnDate = searchParams.get("returnDate");
  const adults = searchParams.get("adults") || "2";

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      // Filter packages by destination if provided
      let filtered = [...mockPackages];
      if (destination) {
        // In real implementation, filter by actual destination code
        filtered = mockPackages;
      }

      // Sort packages
      if (sortBy === "price") {
        filtered.sort((a, b) => a.price - b.price);
      } else {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      setPackages(filtered);
      setLoading(false);
    }, 1000);
  }, [destination, sortBy]);

  const currency: Currency = "GBP";

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
                {destination ? `Holiday Packages to ${destination}` : "All Holiday Packages"}
              </h1>
              <p className="text-muted-foreground">
                {loading ? "Searching..." : `${packages.length} packages found`}
                {departureDate && ` • ${departureDate}`}
                {returnDate && ` - ${returnDate}`}
                {adults && ` • ${adults} adults`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
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

              {/* Phone CTA */}
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
              <span className="ml-3 text-muted-foreground">Searching for the best packages...</span>
            </div>
          )}

          {/* Results Grid */}
          {!loading && packages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
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
          )}

          {/* No Results */}
          {!loading && packages.length === 0 && (
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
