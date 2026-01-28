"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Sun,
  Sunset,
  Coffee,
  Utensils,
  Waves,
  Mountain,
  Palmtree,
  ShoppingBag,
  Music,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

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
  totalPrice: number;
  pricePerPerson: number;
  currency: string;
  includes: string[];
}

// Activity categories with icons
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  cultural: <Sparkles className="h-4 w-4" />,
  historic: <Building className="h-4 w-4" />,
  natural: <Mountain className="h-4 w-4" />,
  beach: <Waves className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  entertainment: <Music className="h-4 w-4" />,
  relaxation: <Palmtree className="h-4 w-4" />,
  default: <Compass className="h-4 w-4" />,
};

function getActivityIcon(category: string): React.ReactNode {
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(ACTIVITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return ACTIVITY_ICONS.default;
}

// Generate theme description based on destination
function generateThemeDescription(destination: string, theme: string): string {
  const descriptions: Record<string, string> = {
    maldives: "Experience paradise on earth with crystal-clear waters, pristine white sand beaches, and world-class underwater adventures. Your Maldives escape promises unforgettable sunsets, luxurious overwater living, and the serenity of island life.",
    dubai: "Discover the city of superlatives where ancient Arabian heritage meets futuristic innovation. From towering skyscrapers to golden desert dunes, Dubai offers a blend of luxury, adventure, and cultural richness.",
    bali: "Immerse yourself in the Island of Gods with its lush rice terraces, ancient temples, and vibrant culture. Bali weaves together spiritual tranquility, natural beauty, and warm Balinese hospitality.",
    bangkok: "Dive into the heart of Thailand's bustling capital where ornate temples stand alongside modern malls. Experience the perfect blend of traditional culture, street food paradise, and urban excitement.",
    paris: "Fall in love with the City of Light, where art, romance, and culinary excellence come together. From iconic landmarks to charming cafes, Paris promises an unforgettable European escape.",
    rome: "Walk through millennia of history in the Eternal City. From ancient ruins to Renaissance masterpieces, Rome offers a journey through time paired with world-famous cuisine.",
    tokyo: "Experience the fascinating contrast of ultra-modern technology and ancient traditions. Tokyo captivates with its neon-lit streets, serene gardens, and culinary excellence.",
    london: "Explore the historic capital where royal palaces meet contemporary culture. London offers world-class museums, iconic landmarks, and a vibrant multicultural atmosphere.",
  };

  const key = destination.toLowerCase();
  for (const [destKey, desc] of Object.entries(descriptions)) {
    if (key.includes(destKey)) return desc;
  }

  return `Discover the wonders of ${destination} with this carefully curated package. Experience local culture, breathtaking sights, and create memories that will last a lifetime.`;
}

// Generate day-by-day itinerary
function generateItinerary(
  destination: string,
  nights: number,
  attractions: Attraction[]
): Array<{
  day: number;
  title: string;
  description: string;
  highlights: string[];
  suggestedActivities: Attraction[];
  timeOfDay: "morning" | "afternoon" | "evening";
}> {
  const itinerary = [];
  const days = nights + 1;

  // Distribute attractions across days
  const attractionsPerDay = Math.ceil(attractions.length / Math.max(days - 2, 1));

  // Day 1 - Arrival
  itinerary.push({
    day: 1,
    title: "Arrival & Welcome",
    description: `Arrive at your destination and transfer to your hotel. Take time to settle in, explore the immediate surroundings, and acclimatise to your new environment.`,
    highlights: [
      "Airport pickup and hotel transfer",
      "Hotel check-in and welcome",
      "Explore hotel facilities and nearby area",
      "Evening at leisure to rest or explore",
    ],
    suggestedActivities: [],
    timeOfDay: "afternoon" as const,
  });

  // Middle days with activities
  for (let d = 2; d < days; d++) {
    const dayAttractions = attractions.slice(
      (d - 2) * attractionsPerDay,
      (d - 1) * attractionsPerDay
    );

    const dayThemes = [
      { title: "Exploration Day", desc: "Discover iconic landmarks and hidden gems" },
      { title: "Cultural Immersion", desc: "Experience local traditions and heritage" },
      { title: "Adventure & Discovery", desc: "Exciting activities and new experiences" },
      { title: "Leisure & Relaxation", desc: "Take it easy and enjoy at your own pace" },
      { title: "Local Experience", desc: "Connect with the destination's authentic charm" },
    ];

    const theme = dayThemes[(d - 2) % dayThemes.length];

    itinerary.push({
      day: d,
      title: theme.title,
      description: theme.desc,
      highlights: generateDayHighlights(destination, d, dayAttractions),
      suggestedActivities: dayAttractions,
      timeOfDay: "morning" as const,
    });
  }

  // Last day - Departure
  itinerary.push({
    day: days,
    title: "Departure",
    description: "Make the most of your final morning before your transfer to the airport. Safe travels home with wonderful memories!",
    highlights: [
      "Final breakfast at the hotel",
      "Last-minute souvenir shopping",
      "Hotel checkout",
      "Transfer to airport for departure",
    ],
    suggestedActivities: [],
    timeOfDay: "morning" as const,
  });

  return itinerary;
}

function generateDayHighlights(destination: string, day: number, attractions: Attraction[]): string[] {
  const baseHighlights = [
    "Breakfast at your hotel",
  ];

  if (attractions.length > 0) {
    attractions.forEach((a) => {
      baseHighlights.push(`Visit ${a.name}`);
    });
  } else {
    // Generic highlights based on destination
    const genericActivities = [
      "Explore local markets and shops",
      "Enjoy authentic local cuisine",
      "Discover scenic viewpoints",
      "Relax and unwind",
      "Photo opportunities at landmarks",
    ];
    baseHighlights.push(...genericActivities.slice(0, 3));
  }

  baseHighlights.push("Evening at leisure");

  return baseHighlights;
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
    return (
      <div className="w-full h-[250px] bg-gray-100 flex items-center justify-center rounded-lg">
        <Camera className="h-16 w-16 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative h-[250px] rounded-lg overflow-hidden">
        {!errors.has(current) ? (
          <Image
            src={images[current]}
            alt={`${name} - Photo ${current + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            onError={() => setErrors((prev) => new Set(prev).add(current))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Camera className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {current + 1} / {images.length}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`relative w-14 h-10 rounded overflow-hidden flex-shrink-0 border-2 ${
                idx === current ? "border-[#f97316]" : "border-transparent"
              }`}
            >
              {!errors.has(idx) ? (
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="56px"
                  onError={() => setErrors((prev) => new Set(prev).add(idx))}
                />
              ) : (
                <div className="w-full h-full bg-gray-100" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Itinerary Day Component
function ItineraryDay({
  day,
  title,
  description,
  highlights,
  suggestedActivities,
  currency,
  selectedTours,
  onToggleTour,
  isExpanded,
  onToggleExpand,
}: {
  day: number;
  title: string;
  description: string;
  highlights: string[];
  suggestedActivities: Attraction[];
  currency: Currency;
  selectedTours: Set<string>;
  onToggleTour: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const TimeIcon = day === 1 ? Sunset : day > 1 ? Sunrise : Sun;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#003580] text-white flex items-center justify-center font-bold text-sm">
            {day}
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {suggestedActivities.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              {suggestedActivities.length} optional {suggestedActivities.length === 1 ? "activity" : "activities"}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          {/* Day highlights */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <TimeIcon className="h-4 w-4 text-[#003580]" />
              Day Highlights
            </h5>
            <ul className="space-y-1">
              {highlights.map((highlight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          {/* Optional activities for this day */}
          {suggestedActivities.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Compass className="h-4 w-4 text-orange-500" />
                Optional Activities
              </h5>
              <div className="space-y-2">
                {suggestedActivities.map((activity) => {
                  const isSelected = selectedTours.has(activity.id);
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => onToggleTour(activity.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          {activity.image ? (
                            <Image
                              src={activity.image}
                              alt={activity.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {getActivityIcon(activity.category)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h6 className="font-medium text-sm text-gray-900">{activity.name}</h6>
                          <span className="text-xs text-gray-500">{activity.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-sm text-gray-900">
                            {formatPrice(activity.price, currency)}
                          </div>
                          <div className="text-[10px] text-gray-500">per person</div>
                        </div>
                        <button
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
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

function PackageDetailContent() {
  const searchParams = useSearchParams();
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2]));
  const [showChangeHotel, setShowChangeHotel] = useState(false);
  const [showChangeFlight, setShowChangeFlight] = useState(false);

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

  // Generate itinerary
  const itinerary = useMemo(() => {
    if (!pkg) return [];
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
  const attractions = pkg.attractions || [];
  const themeDescription = generateThemeDescription(pkg.destination, pkg.theme);

  // Calculate tour add-on total
  const tourTotal = attractions
    .filter((a) => selectedTours.has(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  const grandTotal = pkg.totalPrice + tourTotal;

  const toggleTour = (id: string) => {
    setSelectedTours((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
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
            <span className="text-[12px] text-gray-500">
              {pkg.nights} nights / {pkg.days} days
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {pkg.name}
          </h1>
          <p className="text-gray-500">{pkg.tagline}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {pkg.destination}{pkg.destinationCountry ? `, ${pkg.destinationCountry}` : ""}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {pkg.nights} nights
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Overview / Theme Description */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                About This Package
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {themeDescription}
              </p>
            </div>

            {/* Day-by-Day Itinerary */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#003580]" />
                Your Itinerary
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                A suggested day-by-day guide with optional activities you can add
              </p>

              <div className="space-y-3">
                {itinerary.map((day) => (
                  <ItineraryDay
                    key={day.day}
                    {...day}
                    currency={currency}
                    selectedTours={selectedTours}
                    onToggleTour={toggleTour}
                    isExpanded={expandedDays.has(day.day)}
                    onToggleExpand={() => toggleDayExpanded(day.day)}
                  />
                ))}
              </div>
            </div>

            {/* Hotel Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#003580]" />
                  Your Hotel
                </h2>
                <button
                  onClick={() => setShowChangeHotel(!showChangeHotel)}
                  className="text-sm text-[#0071c2] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change Hotel
                </button>
              </div>

              {showChangeHotel && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Want a different hotel? Call our travel experts to explore other options for your dates.
                  </p>
                  <a
                    href="tel:+442089444555"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#003580] hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call 020 8944 4555
                  </a>
                </div>
              )}

              <ImageGallery images={pkg.hotel.images} name={pkg.hotel.name} />
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.hotel.name}</h3>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: pkg.hotel.starRating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                {pkg.hotel.address && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {pkg.hotel.address}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <Building className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {pkg.hotel.roomType}
                  </span>
                  {pkg.hotel.mealPlan !== "Room Only" && (
                    <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {pkg.hotel.mealPlan}
                    </span>
                  )}
                  {pkg.hotel.freeCancellation && (
                    <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Free cancellation
                    </span>
                  )}
                  <span className="inline-flex items-center text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {pkg.nights} nights
                  </span>
                </div>
              </div>
            </div>

            {/* Flight Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Plane className="h-5 w-5 text-[#003580]" />
                  Your Flights
                </h2>
                <button
                  onClick={() => setShowChangeFlight(!showChangeFlight)}
                  className="text-sm text-[#0071c2] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Change Flight
                </button>
              </div>

              {showChangeFlight && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Looking for a different flight? Our team can check alternative airlines and times.
                  </p>
                  <a
                    href="tel:+442089444555"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#003580] hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Call 020 8944 4555
                  </a>
                </div>
              )}

              {/* Outbound */}
              {pkg.flight.outbound && (
                <div className="border border-gray-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white bg-[#003580] px-2 py-0.5 rounded">
                      OUTBOUND
                    </span>
                    {pkg.flight.outbound.departureDate && (
                      <span className="text-xs text-gray-500">
                        {pkg.flight.outbound.departureDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 relative flex-shrink-0">
                      <Image
                        src={`https://pics.avs.io/120/48/${pkg.flight.airlineCode}.png`}
                        alt={pkg.flight.airlineName}
                        width={120}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.outbound.departureTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.outbound.origin}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[11px] text-gray-400">
                            {formatDuration(pkg.flight.outbound.duration)}
                          </div>
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 h-[1px] bg-gray-300" />
                            <Plane className="h-3.5 w-3.5 text-gray-400" />
                            <div className="flex-1 h-[1px] bg-gray-300" />
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.outbound.arrivalTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.outbound.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pkg.flight.airlineName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Return */}
              {pkg.flight.inbound && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-white bg-gray-600 px-2 py-0.5 rounded">
                      RETURN
                    </span>
                    {pkg.flight.inbound.departureDate && (
                      <span className="text-xs text-gray-500">
                        {pkg.flight.inbound.departureDate}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 relative flex-shrink-0">
                      <Image
                        src={`https://pics.avs.io/120/48/${pkg.flight.airlineCode}.png`}
                        alt={pkg.flight.airlineName}
                        width={120}
                        height={48}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.inbound.departureTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.inbound.origin}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                          <div className="text-[11px] text-gray-400">
                            {formatDuration(pkg.flight.inbound.duration)}
                          </div>
                          <div className="w-full flex items-center gap-1">
                            <div className="flex-1 h-[1px] bg-gray-300" />
                            <Plane className="h-3.5 w-3.5 text-gray-400 rotate-180" />
                            <div className="flex-1 h-[1px] bg-gray-300" />
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {pkg.flight.stops === 0 ? "Direct" : `${pkg.flight.stops} stop`}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {pkg.flight.inbound.arrivalTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pkg.flight.inbound.destination}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pkg.flight.airlineName}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* What's Included */}
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-3">What&apos;s Included</h2>
              <div className="grid md:grid-cols-2 gap-2">
                {pkg.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {item as string}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-400 px-1">
              <p>Package price is per person based on 2 adults sharing. Prices subject to availability. Call to confirm booking.</p>
            </div>
          </div>

          {/* Right Column - Price Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Price Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-3">Price Summary</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Plane className="h-3.5 w-3.5 inline mr-1" />
                      Flights
                    </span>
                    <span className="font-medium">{formatPrice(pkg.flight.price, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Building className="h-3.5 w-3.5 inline mr-1" />
                      Hotel ({pkg.nights} nights)
                    </span>
                    <span className="font-medium">{formatPrice(pkg.hotel.price, currency)}</span>
                  </div>
                </div>

                {/* Optional activities section in price summary */}
                {selectedTours.size > 0 && (
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Optional Activities
                    </div>
                    <div className="space-y-1.5">
                      {attractions
                        .filter((a) => selectedTours.has(a.id))
                        .map((activity) => (
                          <div key={activity.id} className="flex justify-between text-sm">
                            <span className="text-orange-600 truncate pr-2">
                              {activity.name}
                            </span>
                            <span className="font-medium text-orange-600 flex-shrink-0">
                              +{formatPrice(activity.price, currency)}
                            </span>
                          </div>
                        ))}
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
                  {selectedTours.size > 0 && (
                    <div className="text-right text-xs text-orange-600 mt-1">
                      Includes {selectedTours.size} optional {selectedTours.size === 1 ? "activity" : "activities"}
                    </div>
                  )}
                </div>

                <a
                  href="tel:+442089444555"
                  className="mt-4 block w-full text-center py-3 rounded-md text-white font-bold text-sm transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  Call to Book
                </a>

                <p className="text-center text-xs text-gray-500 mt-2">
                  or call <strong>020 8944 4555</strong>
                </p>
              </div>

              {/* Trust Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="space-y-3 text-sm">
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
        <div className="container-wide py-6 flex flex-col md:flex-row items-center justify-between gap-4">
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
