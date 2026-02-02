"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Phone,
  MapPin,
  Calendar,
  Star,
  Plane,
  Building,
  Camera,
  Check,
  Clock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Compass,
  Plus,
  Loader2,
  Sunrise,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Users,
  Map,
} from "lucide-react";

// Dynamic import for map component to avoid SSR issues
const HotelMap = dynamic(() => import("@/components/hotels/HotelMap").then(mod => mod.HotelMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  ),
});
import { formatPrice } from "@/lib/utils";
import { ReferenceNumber } from "@/components/ui/ReferenceNumber";
import type { Currency } from "@/types";

// Format date string (YYYY-MM-DD) to human-readable "25 Jan" format
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
}

interface FlightLeg {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  departureDate?: string;
}

interface PackageFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  price: number;
  basePrice?: number;
  stops: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
}

interface PackageHotel {
  id: string;
  name: string;
  starRating: number;
  address: string;
  mainImage: string | null;
  images: string[];
  price: number;
  basePrice?: number;
  pricePerNight: number;
  roomType: string;
  mealPlan: string;
  freeCancellation: boolean;
}

interface Attraction {
  id: string;
  name: string;
  category: string;
  kinds: string;
  description: string;
  image: string | null;
  rating: string;
  price: number;
  currency: string;
}

interface PackageData {
  id: string;
  name: string;
  theme: string;
  tagline: string;
  description: string;
  destination: string;
  destinationCountry: string;
  nights: number;
  days: number;
  flight: PackageFlight;
  hotel: PackageHotel;
  attractions: Attraction[];
  alternativeHotels?: PackageHotel[];
  alternativeFlights?: PackageFlight[];
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
}

// Destination-specific attractions database
const DESTINATION_ATTRACTIONS: Record<string, Array<{
  name: string;
  category: string;
  description: string;
  price: number;
  duration: string;
}>> = {
  maldives: [
    { name: "Sunset Dolphin Cruise", category: "Wildlife", description: "Spot dolphins in their natural habitat during golden hour", price: 85, duration: "2 hours" },
    { name: "Snorkeling Safari", category: "Water Sports", description: "Explore vibrant coral reefs and tropical fish", price: 65, duration: "3 hours" },
    { name: "Private Sandbank Picnic", category: "Romantic", description: "Secluded beach experience with gourmet lunch", price: 150, duration: "4 hours" },
    { name: "Night Fishing Trip", category: "Adventure", description: "Traditional Maldivian fishing under the stars", price: 75, duration: "3 hours" },
    { name: "Spa & Wellness Treatment", category: "Relaxation", description: "Oceanview massage and wellness therapy", price: 120, duration: "2 hours" },
    { name: "Scuba Diving Introduction", category: "Water Sports", description: "Discover underwater world with certified instructors", price: 110, duration: "3 hours" },
    { name: "Island Hopping Tour", category: "Cultural", description: "Visit local villages and experience Maldivian culture", price: 95, duration: "5 hours" },
  ],
  dubai: [
    { name: "Burj Khalifa At The Top", category: "Landmark", description: "Visit the world's tallest building observation deck", price: 45, duration: "2 hours" },
    { name: "Desert Safari with BBQ", category: "Adventure", description: "Dune bashing, camel ride, and traditional dinner", price: 85, duration: "6 hours" },
    { name: "Dubai Marina Yacht Cruise", category: "Luxury", description: "Private yacht experience along the stunning Marina", price: 120, duration: "3 hours" },
    { name: "Old Dubai Walking Tour", category: "Cultural", description: "Explore historic souks, museums and Creek", price: 35, duration: "4 hours" },
    { name: "Aquaventure Waterpark", category: "Family", description: "World-class waterpark at Atlantis The Palm", price: 75, duration: "Full day" },
    { name: "Dubai Frame Experience", category: "Landmark", description: "Iconic landmark with panoramic city views", price: 25, duration: "1.5 hours" },
    { name: "Dhow Dinner Cruise", category: "Dining", description: "Traditional boat cruise with buffet dinner", price: 65, duration: "2.5 hours" },
  ],
  bali: [
    { name: "Ubud Rice Terrace Trek", category: "Nature", description: "Walk through stunning Tegallalang rice terraces", price: 45, duration: "4 hours" },
    { name: "Sacred Temple Tour", category: "Cultural", description: "Visit Uluwatu and Tanah Lot temples", price: 55, duration: "6 hours" },
    { name: "Balinese Cooking Class", category: "Culinary", description: "Learn traditional recipes at a local home", price: 65, duration: "4 hours" },
    { name: "Mount Batur Sunrise Trek", category: "Adventure", description: "Hike an active volcano for spectacular sunrise", price: 75, duration: "8 hours" },
    { name: "Spa & Wellness Retreat", category: "Relaxation", description: "Traditional Balinese massage and flower bath", price: 50, duration: "3 hours" },
    { name: "Nusa Penida Day Trip", category: "Island", description: "Visit dramatic cliffs and pristine beaches", price: 85, duration: "Full day" },
    { name: "White Water Rafting", category: "Adventure", description: "Navigate the Ayung River rapids", price: 55, duration: "4 hours" },
  ],
  bangkok: [
    { name: "Grand Palace & Wat Pho", category: "Cultural", description: "Explore Thailand's most sacred landmarks", price: 35, duration: "4 hours" },
    { name: "Floating Market Tour", category: "Cultural", description: "Experience Damnoen Saduak's iconic market", price: 45, duration: "5 hours" },
    { name: "Thai Cooking Class", category: "Culinary", description: "Master Thai cuisine with market visit", price: 55, duration: "4 hours" },
    { name: "Chao Phraya Dinner Cruise", category: "Dining", description: "River cruise with Thai buffet and entertainment", price: 65, duration: "2.5 hours" },
    { name: "Ayutthaya Ancient City", category: "Historical", description: "Day trip to UNESCO World Heritage ruins", price: 75, duration: "Full day" },
    { name: "Muay Thai Experience", category: "Sports", description: "Watch authentic Thai boxing match", price: 40, duration: "3 hours" },
    { name: "Street Food Night Tour", category: "Culinary", description: "Guided tour of Bangkok's best street eats", price: 50, duration: "4 hours" },
  ],
  general: [
    { name: "City Highlights Tour", category: "Sightseeing", description: "Discover the main attractions and landmarks", price: 45, duration: "4 hours" },
    { name: "Local Food Experience", category: "Culinary", description: "Taste authentic local cuisine and specialties", price: 55, duration: "3 hours" },
    { name: "Cultural Heritage Walk", category: "Cultural", description: "Explore historic sites and local traditions", price: 35, duration: "3 hours" },
    { name: "Nature & Scenic Tour", category: "Nature", description: "Visit natural landscapes and viewpoints", price: 65, duration: "5 hours" },
    { name: "Adventure Activity", category: "Adventure", description: "Exciting outdoor experience and thrills", price: 75, duration: "4 hours" },
    { name: "Relaxation & Spa", category: "Wellness", description: "Unwind with local wellness treatments", price: 60, duration: "2 hours" },
    { name: "Sunset Experience", category: "Romantic", description: "Enjoy spectacular sunset views", price: 50, duration: "2 hours" },
  ],
};

function getDestinationAttractions(destination: string): typeof DESTINATION_ATTRACTIONS.general {
  const key = destination.toLowerCase();
  for (const [destKey, attractions] of Object.entries(DESTINATION_ATTRACTIONS)) {
    if (key.includes(destKey)) return attractions;
  }
  return DESTINATION_ATTRACTIONS.general;
}

// Generate unique day-by-day itinerary with attractions
function generateItinerary(
  destination: string,
  nights: number,
  packageAttractions: Attraction[]
): Array<{
  day: number;
  title: string;
  description: string;
  highlights: string[];
  activities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }>;
}> {
  const days = nights + 1;
  const destinationAttractions = getDestinationAttractions(destination);
  const itinerary = [];

  // Day titles and themes - unique for each day
  const dayThemes = [
    { title: "Arrival & First Impressions", desc: "Settle in and get your first taste of the destination" },
    { title: "Iconic Landmarks", desc: "Discover the must-see sights and famous attractions" },
    { title: "Cultural Immersion", desc: "Dive deep into local traditions and heritage" },
    { title: "Adventure Day", desc: "Exciting activities and outdoor experiences" },
    { title: "Hidden Gems", desc: "Explore off-the-beaten-path treasures" },
    { title: "Relaxation & Wellness", desc: "Slow down and rejuvenate" },
    { title: "Local Life", desc: "Experience authentic daily life and cuisine" },
    { title: "Departure", desc: "Final moments and farewell" },
  ];

  // Track used attractions to avoid repetition
  const usedAttractionIndices = new Set<number>();

  for (let d = 1; d <= days; d++) {
    const isArrival = d === 1;
    const isDeparture = d === days;

    let theme;
    if (isArrival) {
      theme = dayThemes[0];
    } else if (isDeparture) {
      theme = dayThemes[7];
    } else {
      // Rotate through middle themes
      theme = dayThemes[((d - 2) % 6) + 1];
    }

    // Generate unique highlights for this day
    const highlights: string[] = [];
    if (isArrival) {
      highlights.push("Airport arrival and transfer to hotel");
      highlights.push("Hotel check-in and welcome refreshments");
      highlights.push("Explore hotel amenities and surroundings");
      highlights.push("Evening at leisure - rest or light exploration");
    } else if (isDeparture) {
      highlights.push("Enjoy final breakfast at your hotel");
      highlights.push("Last chance for souvenir shopping");
      highlights.push("Hotel checkout and luggage preparation");
      highlights.push("Transfer to airport for departure");
    } else {
      highlights.push("Breakfast at your hotel");
      // Add day-specific activities
      const daySpecificHighlights = [
        ["Morning exploration of nearby area", "Lunch at recommended local restaurant", "Afternoon sightseeing"],
        ["Visit cultural landmarks", "Traditional lunch experience", "Evening entertainment"],
        ["Active morning adventure", "Scenic lunch spot", "Relaxing afternoon"],
        ["Off-the-beaten-path discovery", "Authentic local dining", "Sunset viewing"],
        ["Wellness and relaxation time", "Light healthy lunch", "Optional afternoon activity"],
        ["Local market visit", "Street food sampling", "Cultural evening experience"],
      ];
      const dayHighlights = daySpecificHighlights[(d - 2) % daySpecificHighlights.length];
      highlights.push(...dayHighlights);
    }

    // Get unique attractions for this day (1-2 per day, none for arrival/departure)
    const dayActivities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }> = [];

    if (!isArrival && !isDeparture) {
      // First try to use package attractions
      const availablePackageAttractions = packageAttractions.filter((_, idx) => !usedAttractionIndices.has(idx));

      // Then use destination-specific attractions
      const numActivities = Math.min(2, destinationAttractions.length);
      for (let i = 0; i < numActivities; i++) {
        // Find an unused attraction
        let attractionIdx = -1;
        for (let j = 0; j < destinationAttractions.length; j++) {
          const uniqueIdx = (d - 2) * 2 + i + j;
          if (!usedAttractionIndices.has(uniqueIdx) && uniqueIdx < destinationAttractions.length) {
            attractionIdx = uniqueIdx;
            break;
          }
        }

        if (attractionIdx >= 0 && attractionIdx < destinationAttractions.length) {
          usedAttractionIndices.add(attractionIdx);
          const attr = destinationAttractions[attractionIdx];
          dayActivities.push({
            ...attr,
            id: `day${d}-activity${i}`,
          });
        }
      }
    }

    itinerary.push({
      day: d,
      title: theme.title,
      description: theme.desc,
      highlights,
      activities: dayActivities,
    });
  }

  return itinerary;
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return "--";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="relative h-[200px] rounded-lg overflow-hidden">
        {!errors.has(current) ? (
          <Image
            src={images[current]}
            alt={`${name} - Photo ${current + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            onError={() => setErrors((prev) => new Set(prev).add(current))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Camera className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {current + 1}/{images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Itinerary Day Component
function ItineraryDay({
  day,
  title,
  description,
  highlights,
  activities,
  currency,
  selectedActivities,
  onToggleActivity,
  isExpanded,
  onToggleExpand,
}: {
  day: number;
  title: string;
  description: string;
  highlights: string[];
  activities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }>;
  currency: Currency;
  selectedActivities: Set<string>;
  onToggleActivity: (id: string, price: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-sm">
            {day}
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activities.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {activities.length} {activities.length === 1 ? "activity" : "activities"}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {/* Day highlights */}
          <div className="mb-4">
            <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Sunrise className="h-3.5 w-3.5 text-[#003580]" />
              Day Schedule
            </h5>
            <ul className="space-y-1">
              {highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* Optional activities for this day */}
          {activities.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-orange-500" />
                Optional Activities (add to your package)
              </h5>
              <div className="space-y-2">
                {activities.map((activity) => {
                  const isSelected = selectedActivities.has(activity.id);
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-orange-400 bg-orange-50 shadow-sm"
                          : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/30"
                      }`}
                      onClick={() => onToggleActivity(activity.id, activity.price)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h6 className="font-medium text-sm text-gray-900">{activity.name}</h6>
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {activity.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                        <span className="text-[10px] text-gray-400">{activity.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="text-right">
                          <div className="font-bold text-sm text-gray-900">
                            {formatPrice(activity.price, currency)}
                          </div>
                          <div className="text-[10px] text-gray-500">per person</div>
                        </div>
                        <button
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hotel Selection Card
function HotelOption({
  hotel,
  isSelected,
  onSelect,
  currency,
  nights,
}: {
  hotel: PackageHotel;
  isSelected: boolean;
  onSelect: () => void;
  currency: Currency;
  nights: number;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? "border-[#003580] bg-blue-50/50 ring-1 ring-[#003580]"
          : "border-gray-200 hover:border-[#003580]/50"
      }`}
    >
      <div className="flex gap-3">
        <div className="w-20 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
          {hotel.mainImage || hotel.images[0] ? (
            <Image
              src={hotel.mainImage || hotel.images[0]}
              alt={hotel.name}
              width={80}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building className="h-6 w-6 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">{hotel.name}</h4>
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold text-sm text-gray-900">{formatPrice(hotel.price, currency)}</div>
              <div className="text-[10px] text-gray-500">{nights} nights</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">{hotel.roomType}</span>
            {hotel.mealPlan !== "Room Only" && (
              <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{hotel.mealPlan}</span>
            )}
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected ? "border-[#003580] bg-[#003580]" : "border-gray-300"
        }`}>
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  );
}

// Flight Selection Card
function FlightOption({
  flight,
  isSelected,
  onSelect,
  currency,
}: {
  flight: PackageFlight;
  isSelected: boolean;
  onSelect: () => void;
  currency: Currency;
}) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isSelected
          ? "border-[#003580] bg-blue-50/50 ring-1 ring-[#003580]"
          : "border-gray-200 hover:border-[#003580]/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-8 flex-shrink-0">
          <Image
            src={`https://pics.avs.io/80/32/${flight.airlineCode}.png`}
            alt={flight.airlineName}
            width={80}
            height={32}
            className="object-contain w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{flight.outbound.departureTime}</span>
            <span className="text-gray-400">→</span>
            <span className="font-semibold">{flight.outbound.arrivalTime}</span>
            <span className="text-xs text-gray-500">
              ({flight.stops === 0 ? "Direct" : `${flight.stops} stop`})
            </span>
          </div>
          <div className="text-xs text-gray-500">{flight.airlineName}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-sm text-gray-900">{formatPrice(flight.price, currency)}</div>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected ? "border-[#003580] bg-[#003580]" : "border-gray-300"
        }`}>
          {isSelected && <Check className="h-3 w-3 text-white" />}
        </div>
      </div>
    </div>
  );
}

function PackageDetailContent() {
  const searchParams = useSearchParams();
  const [selectedActivities, setSelectedActivities] = useState<Record<string, number>>({});
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2]));
  const [showHotelOptions, setShowHotelOptions] = useState(false);
  const [showFlightOptions, setShowFlightOptions] = useState(false);
  const [showHotelMap, setShowHotelMap] = useState(false);
  const [selectedHotelIdx, setSelectedHotelIdx] = useState(0);
  const [selectedFlightIdx, setSelectedFlightIdx] = useState(0);

  // Parse package data from URL
  const dataParam = searchParams.get("data");
  let pkg: PackageData | null = null;

  try {
    if (dataParam) {
      const parsed = JSON.parse(dataParam);
      pkg = {
        ...parsed,
        nights: parseInt(parsed.nights) || parsed.nights,
        days: parseInt(parsed.days) || parsed.days,
        totalPrice: typeof parsed.totalPrice === "string" ? parseInt(parsed.totalPrice) : parsed.totalPrice,
        pricePerPerson: typeof parsed.pricePerPerson === "string" ? parseInt(parsed.pricePerPerson) : parsed.pricePerPerson,
      };
    }
  } catch {
    pkg = null;
  }

  // Only real hotel/flight data — no fake alternatives
  const alternativeHotels = useMemo(() => {
    if (!pkg || !pkg.hotel) return [];
    const hotel = pkg.hotel;
    const hotelPricePerNight = hotel.pricePerNight || Math.round((hotel.price || 0) / Math.max(1, pkg.nights));
    return [{ ...hotel, pricePerNight: hotelPricePerNight }];
  }, [pkg]);

  const alternativeFlights = useMemo(() => {
    if (!pkg || !pkg.flight) return [];
    return [pkg.flight];
  }, [pkg]);

  // Generate itinerary only for trips up to 7 days
  const itinerary = useMemo(() => {
    if (!pkg || pkg.nights > 7) return [];
    return generateItinerary(pkg.destination, pkg.nights, pkg.attractions || []);
  }, [pkg]);

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F6FA]">
        <div className="text-center bg-white p-8 rounded-lg border border-gray-200 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Package Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">
            This package may have expired. Please search again for available packages.
          </p>
          <Link
            href="/packages"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-white font-semibold text-sm"
            style={{ backgroundColor: "#f97316" }}
          >
            Search Packages
          </Link>
        </div>
      </div>
    );
  }

  const currency = (pkg.currency || "GBP") as Currency;

  // Get selected hotel and flight
  const selectedHotel = alternativeHotels[selectedHotelIdx] || pkg.hotel;
  const selectedFlight = alternativeFlights[selectedFlightIdx] || pkg.flight;

  // Calculate activity total
  const activityTotal = Object.values(selectedActivities).reduce((sum, price) => sum + price, 0);

  // Calculate total with selected options
  const baseTotal = selectedHotel.price + selectedFlight.price;
  const grandTotal = baseTotal + activityTotal;

  const toggleActivity = (id: string, price: number) => {
    setSelectedActivities((prev) => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        next[id] = price;
      }
      return next;
    });
  };

  const toggleDayExpanded = (day: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F2F6FA]">
      {/* Top bar */}
      <div className="bg-[#003580] text-white">
        <div className="container-wide py-2">
          <Link
            href="/packages"
            className="flex items-center gap-1.5 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to packages
          </Link>
        </div>
      </div>

      <div className="container-wide py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">
              {pkg.nights} nights / {pkg.days} days
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {pkg.name}
          </h1>
          <p className="text-gray-500 text-sm">{pkg.tagline}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {pkg.destination}{pkg.destinationCountry ? `, ${pkg.destinationCountry}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {pkg.nights} nights
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              2 adults
            </span>
          </div>

          {/* Web Reference Number */}
          <div className="mt-4">
            <ReferenceNumber searchType="packages" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Hotel Section (First) */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#003580]" />
                  Your Hotel
                </h2>
                <a
                  href="tel:+442089444555"
                  className="text-xs text-[#0071c2] hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  Call to change hotel
                </a>
              </div>

              {!showHotelOptions ? (
                <div className="flex gap-4">
                  <div className="w-1/3 flex-shrink-0">
                    <ImageGallery images={selectedHotel.images} name={selectedHotel.name} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{selectedHotel.name}</h3>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    {selectedHotel.address && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />
                        {selectedHotel.address}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="inline-flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {selectedHotel.roomType}
                      </span>
                      {selectedHotel.mealPlan !== "Room Only" && (
                        <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          <Check className="h-3 w-3 mr-1" />
                          {selectedHotel.mealPlan}
                        </span>
                      )}
                      {selectedHotel.freeCancellation && (
                        <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                          <Check className="h-3 w-3 mr-1" />
                          Free cancellation
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(selectedHotel.price, currency)} <span className="font-normal text-xs text-gray-500">for {pkg.nights} nights</span>
                      </div>
                      <button
                        onClick={() => setShowHotelMap(!showHotelMap)}
                        className="flex items-center gap-1 text-xs text-[#0071c2] hover:underline"
                      >
                        <Map className="h-3.5 w-3.5" />
                        {showHotelMap ? "Hide map" : "Show on map"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Select a different hotel for your stay:</p>
                  {alternativeHotels.map((hotel, idx) => (
                    <HotelOption
                      key={hotel.id}
                      hotel={hotel}
                      isSelected={selectedHotelIdx === idx}
                      onSelect={() => setSelectedHotelIdx(idx)}
                      currency={currency}
                      nights={pkg.nights}
                    />
                  ))}
                </div>
              )}

              {/* Hotel Map */}
              {showHotelMap && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <HotelMap
                    hotels={[{
                      id: selectedHotel.id,
                      name: selectedHotel.name,
                      starRating: selectedHotel.starRating,
                      price: selectedHotel.pricePerNight,
                      currency: currency,
                      mainImage: selectedHotel.mainImage,
                      address: selectedHotel.address,
                    }]}
                    destination={pkg.destination}
                    singleHotel={true}
                    showCloseButton={false}
                    height="300px"
                  />
                </div>
              )}
            </div>

            {/* 2. Flight Section (Second) */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#003580]" />
                  Your Flights
                </h2>
                <a
                  href="tel:+442089444555"
                  className="text-xs text-[#0071c2] hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  Call to change flight
                </a>
              </div>

              {!showFlightOptions ? (
                <div className="space-y-3">
                  {/* Outbound */}
                  {selectedFlight.outbound && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-white bg-[#003580] px-1.5 py-0.5 rounded">
                          OUTBOUND
                        </span>
                        {selectedFlight.outbound.departureDate && (
                          <span className="text-xs text-gray-600">
                            {formatDateDisplay(selectedFlight.outbound.departureDate)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 flex-shrink-0">
                          <Image
                            src={`https://pics.avs.io/80/32/${selectedFlight.airlineCode}.png`}
                            alt={selectedFlight.airlineName}
                            width={80}
                            height={32}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {selectedFlight.outbound.departureTime}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.outbound.origin}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center px-2">
                              <div className="text-[10px] text-gray-400">
                                {formatDuration(selectedFlight.outbound.duration)}
                              </div>
                              <div className="w-full flex items-center gap-1">
                                <div className="flex-1 h-[1px] bg-gray-300" />
                                <Plane className="h-3 w-3 text-gray-400" />
                                <div className="flex-1 h-[1px] bg-gray-300" />
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop`}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {selectedFlight.outbound.arrivalTime}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.outbound.destination}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Return */}
                  {selectedFlight.inbound && (
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-white bg-gray-600 px-1.5 py-0.5 rounded">
                          RETURN
                        </span>
                        {selectedFlight.inbound.departureDate && (
                          <span className="text-[10px] text-gray-500">
                            {selectedFlight.inbound.departureDate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 flex-shrink-0">
                          <Image
                            src={`https://pics.avs.io/80/32/${selectedFlight.airlineCode}.png`}
                            alt={selectedFlight.airlineName}
                            width={80}
                            height={32}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {selectedFlight.inbound.departureTime}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.inbound.origin}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center px-2">
                              <div className="text-[10px] text-gray-400">
                                {formatDuration(selectedFlight.inbound.duration)}
                              </div>
                              <div className="w-full flex items-center gap-1">
                                <div className="flex-1 h-[1px] bg-gray-300" />
                                <Plane className="h-3 w-3 text-gray-400 rotate-180" />
                                <div className="flex-1 h-[1px] bg-gray-300" />
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop`}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {selectedFlight.inbound.arrivalTime}
                              </div>
                              <div className="text-[10px] text-gray-500">
                                {selectedFlight.inbound.destination}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-3">Select a different flight:</p>
                  {alternativeFlights.map((flight, idx) => (
                    <FlightOption
                      key={flight.id}
                      flight={flight}
                      isSelected={selectedFlightIdx === idx}
                      onSelect={() => setSelectedFlightIdx(idx)}
                      currency={currency}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 3. Package Summary / About */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                What&apos;s Included
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {pkg.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {item as string}
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Day-by-Day Itinerary (Only for trips up to 7 days) */}
            {/* Custom itinerary CTA */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#003580]" />
                Personalise Your Trip
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Our travel experts can create a personalised day-by-day itinerary with activities and tours tailored to your interests.
              </p>
              <a
                href="tel:+442089444555"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#003580] hover:underline"
              >
                <Phone className="h-4 w-4" />
                Call 020 8944 4555 to customise your package
              </a>
            </div>

            {/* Terms */}
            <div className="text-[10px] text-gray-400 px-1">
              <p>Package price is per person based on 2 adults sharing. Prices subject to availability. Call to confirm booking.</p>
            </div>
          </div>

          {/* Right Column - Price Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900 mb-3">Price Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Plane className="h-3.5 w-3.5 inline mr-1" />
                      Flights
                    </span>
                    <span className="font-medium">{formatPrice(selectedFlight.price, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Building className="h-3.5 w-3.5 inline mr-1" />
                      Hotel ({pkg.nights} nights)
                    </span>
                    <span className="font-medium">{formatPrice(selectedHotel.price, currency)}</span>
                  </div>
                </div>

                {/* Selected activities */}
                {Object.keys(selectedActivities).length > 0 && (
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                      Optional Activities
                    </div>
                    <div className="space-y-1">
                      {Object.entries(selectedActivities).map(([id, price]) => {
                        // Find activity name from itinerary
                        const activity = itinerary
                          .flatMap(d => d.activities)
                          .find(a => a.id === id);
                        return (
                          <div key={id} className="flex justify-between text-xs">
                            <span className="text-orange-600 truncate pr-2">
                              {activity?.name || "Activity"}
                            </span>
                            <span className="font-medium text-orange-600 flex-shrink-0">
                              +{formatPrice(price, currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 mt-3 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-600">Total package</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(grandTotal, currency)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {formatPrice(Math.round(grandTotal / 2), currency)} per person
                  </div>
                </div>

                <a
                  href="tel:+442089444555"
                  className="mt-4 block w-full text-center py-3 rounded-md text-white font-bold text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Call to Book
                </a>

                <p className="text-center text-[10px] text-gray-500 mt-2">
                  or call <strong>020 8944 4555</strong>
                </p>
              </div>

              {/* Trust Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">ATOL Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">24/7 Customer Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">Best Price Guarantee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">No Hidden Fees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="bg-[#003580] mt-8">
        <div className="container-wide py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white text-center md:text-left">
            <h2 className="text-lg font-bold">Ready to book this package?</h2>
            <p className="text-blue-200 text-sm">
              Call our travel experts to secure the best price.
            </p>
          </div>
          <a
            href="tel:+442089444555"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-md text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: "#f97316" }}
          >
            <Phone className="h-4 w-4" />
            Call 020 8944 4555
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PackageDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
        </div>
      }
    >
      <PackageDetailContent />
    </Suspense>
  );
}
