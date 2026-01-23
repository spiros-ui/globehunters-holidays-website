"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { Phone, Clock, Users, Star, MapPin, SortAsc, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchForm } from "@/components/search/SearchForm";
import { formatPrice, formatDuration } from "@/lib/utils";
import type { Currency } from "@/types";

interface ActivityResult {
  id: string;
  name: string;
  image: string;
  destination: string;
  description: string;
  duration: number;
  price: number;
  rating: number;
  reviewCount: number;
  category: string;
  highlights: string[];
}

// Mock data for activities
const mockActivities: ActivityResult[] = [
  {
    id: "activity-1",
    name: "Sunset Dolphin Cruise",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    destination: "Maldives",
    description: "Sail into the sunset while watching playful dolphins in their natural habitat.",
    duration: 180,
    price: 85,
    rating: 4.9,
    reviewCount: 456,
    category: "Water Activities",
    highlights: ["Dolphin watching", "Sunset views", "Snacks included"],
  },
  {
    id: "activity-2",
    name: "Burj Khalifa At The Top",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    destination: "Dubai",
    description: "Experience breathtaking views from the world's tallest building observation deck.",
    duration: 90,
    price: 45,
    rating: 4.7,
    reviewCount: 2340,
    category: "Sightseeing",
    highlights: ["Skip-the-line", "Level 124 & 125", "Multimedia presentation"],
  },
  {
    id: "activity-3",
    name: "Bali Rice Terrace Trek",
    image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
    destination: "Bali",
    description: "Guided trek through the famous Tegallalang rice terraces with a local expert.",
    duration: 240,
    price: 55,
    rating: 4.8,
    reviewCount: 892,
    category: "Nature & Adventure",
    highlights: ["Expert guide", "Traditional lunch", "Photo opportunities"],
  },
  {
    id: "activity-4",
    name: "Thai Cooking Class",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    destination: "Bangkok",
    description: "Learn to cook authentic Thai dishes with a professional chef in Bangkok.",
    duration: 300,
    price: 65,
    rating: 4.9,
    reviewCount: 678,
    category: "Food & Culture",
    highlights: ["Market visit", "5 dishes", "Recipe book"],
  },
  {
    id: "activity-5",
    name: "Desert Safari with BBQ Dinner",
    image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=800&q=80",
    destination: "Dubai",
    description: "Thrilling dune bashing followed by a traditional Bedouin camp experience.",
    duration: 360,
    price: 75,
    rating: 4.6,
    reviewCount: 3120,
    category: "Adventure",
    highlights: ["Dune bashing", "Camel riding", "BBQ dinner", "Entertainment"],
  },
  {
    id: "activity-6",
    name: "Phi Phi Islands Day Trip",
    image: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=800&q=80",
    destination: "Phuket",
    description: "Full-day speedboat tour to the stunning Phi Phi Islands with snorkeling.",
    duration: 540,
    price: 95,
    rating: 4.7,
    reviewCount: 1890,
    category: "Island Tours",
    highlights: ["Maya Bay", "Snorkeling", "Lunch included", "Hotel pickup"],
  },
  {
    id: "activity-7",
    name: "Snorkeling with Manta Rays",
    image: "https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c?w=800&q=80",
    destination: "Maldives",
    description: "Swim alongside majestic manta rays at one of the world's best spots.",
    duration: 240,
    price: 150,
    rating: 4.9,
    reviewCount: 234,
    category: "Water Activities",
    highlights: ["Equipment provided", "Marine biologist guide", "Small groups"],
  },
  {
    id: "activity-8",
    name: "Ubud Monkey Forest & Temples",
    image: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=80",
    destination: "Bali",
    description: "Explore Bali's sacred monkey forest and ancient temples with a local guide.",
    duration: 480,
    price: 45,
    rating: 4.5,
    reviewCount: 1567,
    category: "Culture & Heritage",
    highlights: ["Monkey Forest", "Tirta Empul", "Local lunch"],
  },
];

function ActivityCard({ activity, currency }: { activity: ActivityResult; currency: Currency }) {
  return (
    <div className="card-hover overflow-hidden">
      <div className="relative aspect-[16/9]">
        <Image
          src={activity.image}
          alt={activity.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <Badge className="absolute top-3 left-3">{activity.category}</Badge>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4" />
          <span>{activity.destination}</span>
        </div>
        <h3 className="font-serif text-xl mb-2">{activity.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {activity.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {activity.highlights.slice(0, 3).map((highlight, index) => (
            <span
              key={index}
              className="text-xs bg-muted px-2 py-1 rounded"
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(activity.duration)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{activity.rating} ({activity.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <div className="text-2xl font-semibold">{formatPrice(activity.price, currency)}</div>
            <div className="text-xs text-muted-foreground">per person</div>
          </div>
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

function ActivitiesContent() {
  const searchParams = useSearchParams();
  const [activities, setActivities] = useState<ActivityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"price" | "rating">("rating");

  const destination = searchParams.get("destination");

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = [...mockActivities];

      // Filter by destination if provided
      if (destination) {
        filtered = filtered.filter(
          (a) => a.destination.toLowerCase().includes(destination.toLowerCase())
        );
      }

      // Sort
      if (sortBy === "price") {
        filtered.sort((a, b) => a.price - b.price);
      } else {
        filtered.sort((a, b) => b.rating - a.rating);
      }

      setActivities(filtered);
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
                {destination ? `Activities in ${destination}` : "All Activities & Experiences"}
              </h1>
              <p className="text-muted-foreground">
                {loading ? "Searching..." : `${activities.length} activities found`}
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
                  <option value="rating">Sort by Rating</option>
                  <option value="price">Sort by Price</option>
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
              <span className="ml-3 text-muted-foreground">Searching for activities...</span>
            </div>
          )}

          {/* Results Grid */}
          {!loading && activities.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} currency={currency} />
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && activities.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-serif mb-4">No activities found</h2>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or contact us for recommendations.
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
            <h2 className="text-2xl font-serif mb-4">Looking for Something Special?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our travel experts can help you find unique experiences and book
              exclusive activities at your destination.
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

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <ActivitiesContent />
    </Suspense>
  );
}
