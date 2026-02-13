"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useState, Suspense, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// Import static package data
import top50PackagesData from "@/data/top50-packages.json";
import destinationActivitiesData from "@/data/destination-activities.json";
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
  Wifi,
  Coffee,
  Waves,
  Dumbbell,
  Utensils,
  X,
  Info,
  ArrowRight,
  Briefcase,
  ParkingCircle,
  AirVent,
  ConciergeBell,
  Dog,
  ShowerHead,
  Building2,
  Accessibility,
  Palmtree,
  Bed,
  Shield,
  ThumbsUp,
  Headphones,
  Eye,
  Car,
  Globe,
  FileText,
  AlertTriangle,
  Bath,
  Tv,
  Wine,
  Baby,
  PartyPopper,
  CreditCard,
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
import { ActivitiesSection } from "@/components/activities";
import type { Currency } from "@/types";
import type {
  HotelAPIResult,
  HotelDetails,
  LiveFlightOffer,
  LiveActivity,
  PriceBreakdown,
  CalculateTotalPriceParams,
} from "./types";

// Extracted config imports
import { type AirlineOption, AIRLINE_OPTIONS, type BoardType, type BoardOption, BOARD_OPTIONS } from "@/config/airline-options";
import { type HotelOption, HOTEL_TIER_OPTIONS, type ComprehensiveHotelDetails, TIER_HOTEL_DETAILS, DESTINATION_HOTEL_NAMES, TIER_PLACEHOLDER_IMAGES } from "@/config/hotel-tiers";
import { DESTINATION_HERO_IMAGES, DESTINATION_DESCRIPTIONS, DESTINATION_ATTRACTIONS } from "@/config/destination-content";
import { DESTINATION_DAY_THEMES } from "@/config/itinerary-themes";
import { THEME_SELLING_POINTS, THEME_DESCRIPTIONS } from "@/config/theme-content";

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

interface FlightSegment {
  departureAirport: string;
  departureAirportName?: string;
  departureCity?: string;
  arrivalAirport: string;
  arrivalAirportName?: string;
  arrivalCity?: string;
  departureTime: string;
  arrivalTime: string;
  departureDate?: string;
  arrivalDate?: string;
  flightNumber?: string;
  airlineCode?: string;
  airlineName?: string;
  airlineLogo?: string;
  operatingCarrier?: string;
  duration?: number;
  cabinClass?: string;
  aircraft?: string;
}

interface FlightLeg {
  origin: string;
  originName?: string;
  originCity?: string;
  destination: string;
  destinationName?: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  departureDate?: string;
  arrivalDate?: string;
  segments?: FlightSegment[];
}

interface PackageFlight {
  id: string;
  airlineCode: string;
  airlineName: string;
  airlineLogo: string;
  price: number;
  basePrice?: number;
  taxAmount?: number;
  stops: number;
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  cabinBaggage?: string;
  checkedBaggage?: string;
  cabinClass?: string;
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

// Type for static package data from JSON
interface StaticPackage {
  id: string;
  destinationId: string;
  destinationName: string;
  country: string;
  region: string;
  airportCode: string;
  title: string;
  tagline: string;
  nights: number;
  startingPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  featuredOrder?: number;
  top50Rank: number;
  theme: string;
  heroImage: string;
  images: string[];
  highlights: string[];
  includes: string[];
  activities: string[];
}

// Type for activity data from JSON
interface StaticActivity {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  duration: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  includes: string[];
  highlights: string[];
}

// Helper function to find and transform static package data to PackageData format
function getStaticPackageById(packageId: string): PackageData | null {
  const packages = (top50PackagesData as { packages: StaticPackage[] }).packages;
  const staticPkg = packages.find((p) => p.id === packageId);

  if (!staticPkg) {
    return null;
  }

  // Get activities for this destination from the activities JSON
  const activitiesMap = (destinationActivitiesData as { activities: Record<string, StaticActivity[]> }).activities;
  const destActivities = activitiesMap[staticPkg.destinationId] || [];

  // Map activity IDs to full activity data
  const packageAttractions: Attraction[] = staticPkg.activities
    .map((actId): Attraction | null => {
      const activity = destActivities.find((a) => a.id === actId);
      if (!activity) return null;
      return {
        id: activity.id,
        name: activity.title,
        category: activity.category,
        kinds: activity.category.toLowerCase(),
        description: activity.shortDescription || activity.description,
        image: activity.image || null,
        rating: String(activity.rating),
        price: activity.price,
        currency: activity.currency,
      };
    })
    .filter((a): a is Attraction => a !== null);

  // Create placeholder flight data for static packages
  // In a real implementation, this would come from an API or be pre-populated
  const placeholderFlight: PackageFlight = {
    id: `flight-${staticPkg.id}`,
    airlineCode: "BA", // British Airways as default
    airlineName: "British Airways",
    airlineLogo: "https://pics.avs.io/400/160/BA.png",
    price: Math.round(staticPkg.startingPrice * 0.4), // Estimate 40% of package price for flights
    basePrice: Math.round(staticPkg.startingPrice * 0.35),
    taxAmount: Math.round(staticPkg.startingPrice * 0.05),
    stops: staticPkg.region === "europe" ? 0 : 1,
    outbound: {
      origin: "LHR",
      originName: "Heathrow Airport",
      originCity: "London",
      destination: staticPkg.airportCode,
      destinationName: `${staticPkg.destinationName} International Airport`,
      destinationCity: staticPkg.destinationName,
      departureTime: "09:00",
      arrivalTime: staticPkg.region === "europe" ? "12:00" : "18:00",
      duration: staticPkg.region === "europe" ? 180 : 540,
    },
    inbound: {
      origin: staticPkg.airportCode,
      originName: `${staticPkg.destinationName} International Airport`,
      originCity: staticPkg.destinationName,
      destination: "LHR",
      destinationName: "Heathrow Airport",
      destinationCity: "London",
      departureTime: "14:00",
      arrivalTime: staticPkg.region === "europe" ? "17:00" : "22:00",
      duration: staticPkg.region === "europe" ? 180 : 540,
    },
    cabinBaggage: "1 x 8kg",
    checkedBaggage: "1 x 23kg",
    cabinClass: "Economy",
  };

  // Create placeholder hotel data
  const placeholderHotel: PackageHotel = {
    id: `hotel-${staticPkg.id}`,
    name: `${staticPkg.destinationName} Premium Resort`,
    starRating: staticPkg.theme === "luxury" ? 5 : 4,
    address: `${staticPkg.destinationName}, ${staticPkg.country}`,
    mainImage: staticPkg.images[0] || null,
    images: staticPkg.images,
    price: Math.round(staticPkg.startingPrice * 0.6), // Estimate 60% of package price for hotel
    basePrice: Math.round(staticPkg.startingPrice * 0.55),
    pricePerNight: Math.round((staticPkg.startingPrice * 0.6) / staticPkg.nights),
    roomType: staticPkg.theme === "luxury" ? "Deluxe Suite" : "Superior Room",
    mealPlan: staticPkg.includes.some(i => i.toLowerCase().includes("breakfast")) ? "Breakfast Included" : "Room Only",
    freeCancellation: true,
  };

  // Calculate total price
  const totalPrice = placeholderFlight.price + placeholderHotel.price;

  return {
    id: staticPkg.id,
    name: staticPkg.title,
    theme: staticPkg.theme,
    tagline: staticPkg.tagline,
    description: staticPkg.highlights.join(". ") + ".",
    destination: staticPkg.destinationName,
    destinationCountry: staticPkg.country,
    nights: staticPkg.nights,
    days: staticPkg.nights + 1,
    flight: placeholderFlight,
    hotel: placeholderHotel,
    attractions: packageAttractions,
    totalPrice: totalPrice,
    pricePerPerson: Math.round(totalPrice / 2),
    currency: staticPkg.currency,
    includes: staticPkg.includes,
  };
}



function getComprehensiveHotelDetails(tier: string): ComprehensiveHotelDetails {
  return TIER_HOTEL_DETAILS[tier] || TIER_HOTEL_DETAILS.standard;
}

// Generate hotel options based on destination and base hotel
function generateHotelOptions(
  destination: string,
  baseHotel: PackageHotel,
  nights: number
): (PackageHotel & { tier: string; highlights: string[]; defaultBoardType: BoardType })[] {
  const destKey = destination.toLowerCase().replace(/\s+/g, "_");
  const destNames = DESTINATION_HOTEL_NAMES[destKey];

  return HOTEL_TIER_OPTIONS.map((option) => {
    // Calculate price based on modifier
    const basePrice = baseHotel.price;
    const adjustedPrice = Math.round(basePrice * (1 + option.priceModifier / 100));
    const pricePerNight = Math.round(adjustedPrice / nights);

    // Get hotel name - either from destination-specific names or generate
    let hotelName: string;
    if (destNames) {
      hotelName = destNames[option.tier];
    } else {
      hotelName = option.namePrefix
        ? `${option.namePrefix} ${destination} ${option.nameSuffix}`
        : `${destination} ${option.nameSuffix}`;
    }

    // Use tier-specific placeholder images instead of always copying the base hotel images
    const tierImages = TIER_PLACEHOLDER_IMAGES[option.tier] || TIER_PLACEHOLDER_IMAGES.standard;

    return {
      id: `hotel-${option.id}`,
      name: hotelName,
      starRating: option.stars,
      address: baseHotel.address || `${destination} City Centre`,
      mainImage: tierImages[0],
      images: tierImages,
      price: adjustedPrice,
      basePrice: Math.round(adjustedPrice * 0.9),
      pricePerNight: pricePerNight,
      roomType: option.roomType,
      mealPlan: option.defaultBoardType,
      freeCancellation: option.tier !== "budget",
      tier: option.tier,
      highlights: option.highlights,
      defaultBoardType: option.defaultBoardType,
    };
  });
}

// Generate flight option based on airline and base price
function generateFlightForAirline(
  basePrice: number,
  airline: AirlineOption,
  origin: string,
  destination: string,
  destinationName: string,
  region: string
): PackageFlight {
  const adjustedPrice = Math.round(basePrice * (1 + airline.priceModifier / 100));
  const baseFare = Math.round(adjustedPrice * 0.85);
  const taxAmount = adjustedPrice - baseFare;

  // Adjust duration based on stops and region
  const baseDuration = region === "europe" ? 180 : 540;
  const durationWithStops = airline.stops > 0 ? baseDuration + 180 : baseDuration; // Add 3 hours for connection

  return {
    id: `flight-${airline.code}`,
    airlineCode: airline.code,
    airlineName: airline.name,
    airlineLogo: airline.logo,
    price: adjustedPrice,
    basePrice: baseFare,
    taxAmount: taxAmount,
    stops: airline.stops,
    outbound: {
      origin: origin,
      originName: "Heathrow Airport",
      originCity: "London",
      destination: destination,
      destinationName: `${destinationName} International Airport`,
      destinationCity: destinationName,
      departureTime: airline.outboundDepartureTime,
      arrivalTime: airline.outboundArrivalTime,
      duration: durationWithStops,
    },
    inbound: {
      origin: destination,
      originName: `${destinationName} International Airport`,
      originCity: destinationName,
      destination: origin,
      destinationName: "Heathrow Airport",
      destinationCity: "London",
      departureTime: airline.inboundDepartureTime,
      arrivalTime: airline.inboundArrivalTime,
      duration: durationWithStops,
    },
    cabinBaggage: airline.cabinBaggage,
    checkedBaggage: airline.checkedBaggage,
    cabinClass: "Economy",
  };
}


// Helper function to get destination hero image
function getDestinationHeroImage(destination: string): string {
  if (DESTINATION_HERO_IMAGES[destination]) {
    return DESTINATION_HERO_IMAGES[destination];
  }
  const destLower = destination.toLowerCase();
  for (const [key, value] of Object.entries(DESTINATION_HERO_IMAGES)) {
    if (destLower.includes(key.toLowerCase()) || key.toLowerCase().includes(destLower)) {
      return value;
    }
  }
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=800&fit=crop&q=80";
}



// Generate package description with theme-focused selling content
function generatePackageDescription(destination: string, theme: string, nights: number): {
  about: string;
  highlights: string[];
  bestFor: string[];
  themeDescription: string;
  themeHeadline: string;
  themeSellingDescription: string;
  themeSellingPoints: string[];
} {
  const destKey = destination.toLowerCase().replace(/\s+/g, "_");
  const destInfo = DESTINATION_DESCRIPTIONS[destKey] || DESTINATION_DESCRIPTIONS[destination.toLowerCase()] || {
    about: `Discover the wonders of ${destination}, a captivating destination that offers unique experiences, rich culture, and memorable adventures. Whether you're seeking relaxation, adventure, or cultural immersion, ${destination} promises to exceed your expectations with its warm hospitality and stunning scenery.`,
    highlights: ["Local landmarks and attractions", "Authentic cuisine experiences", "Cultural discoveries", "Scenic viewpoints", "Shopping and entertainment", "Natural beauty"],
    bestFor: ["All travelers", "Adventure seekers", "Culture enthusiasts", "Relaxation"],
  };

  const themeDesc = THEME_DESCRIPTIONS[theme.toLowerCase()] || THEME_DESCRIPTIONS.cultural;
  const themeSelling = THEME_SELLING_POINTS[theme.toLowerCase()] || THEME_SELLING_POINTS.cultural;

  // Replace {destination} placeholder in selling content
  const themeHeadline = themeSelling.headline.replace(/{destination}/g, destination);
  const themeSellingDescription = themeSelling.description.replace(/{destination}/g, destination);

  return {
    about: destInfo.about,
    highlights: destInfo.highlights,
    bestFor: destInfo.bestFor,
    themeDescription: themeDesc,
    themeHeadline,
    themeSellingDescription,
    themeSellingPoints: themeSelling.sellingPoints,
  };
}


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
  theme: string,
  packageAttractions: Attraction[]
): Array<{
  day: number;
  title: string;
  description: string;
  highlights: string[];
  image: string;
  activities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }>;
}> | null {
  // Only generate itinerary for trips of 10 days or less
  if (nights > 10) {
    return null;
  }

  const days = nights + 1;
  const destinationAttractions = getDestinationAttractions(destination);
  const destKey = destination.toLowerCase();
  const specificThemes = DESTINATION_DAY_THEMES[destKey];
  const itinerary = [];

  // Generic day themes for destinations without specific themes
  const genericDayThemes = [
    { title: "Arrival & Welcome", desc: "Settle in and get your first taste of the destination", schedule: ["Airport arrival and transfer", "Hotel check-in", "Explore hotel area", "Welcome dinner"], image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&q=80" },
    { title: "Iconic Landmarks", desc: "Discover the must-see sights and famous attractions", schedule: ["Breakfast at hotel", "Morning sightseeing", "Local lunch", "Afternoon exploration", "Evening entertainment"], image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop&q=80" },
    { title: "Cultural Immersion", desc: "Dive deep into local traditions and heritage", schedule: ["Breakfast at hotel", "Visit cultural sites", "Traditional lunch", "Art or history museum", "Cultural evening activity"], image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop&q=80" },
    { title: "Adventure & Nature", desc: "Exciting activities and outdoor experiences", schedule: ["Early breakfast", "Morning adventure activity", "Scenic lunch spot", "Nature exploration", "Relaxed evening"], image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=600&h=400&fit=crop&q=80" },
    { title: "Hidden Gems", desc: "Explore off-the-beaten-path treasures", schedule: ["Breakfast at hotel", "Local neighborhood walk", "Authentic local lunch", "Unique attractions", "Sunset viewpoint"], image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=400&fit=crop&q=80" },
    { title: "Relaxation & Wellness", desc: "Slow down and rejuvenate", schedule: ["Late breakfast", "Spa or wellness activity", "Light lunch", "Beach or pool time", "Special dinner"], image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=400&fit=crop&q=80" },
    { title: "Local Life & Markets", desc: "Experience authentic daily life and cuisine", schedule: ["Early market visit", "Street food breakfast", "Local shopping", "Cooking class or food tour", "Farewell dinner"], image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop&q=80" },
    { title: "Free Exploration", desc: "Create your own adventure", schedule: ["Breakfast at hotel", "Personal exploration", "Lunch of choice", "Revisit favorites or new discoveries", "Evening at leisure"], image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&h=400&fit=crop&q=80" },
    { title: "Day Trip", desc: "Venture beyond the city", schedule: ["Early departure", "Full day excursion", "Lunch included", "Return in evening", "Rest and dinner"], image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Final moments and farewell", schedule: ["Final breakfast", "Last-minute shopping", "Hotel checkout", "Transfer to airport"], image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop&q=80" },
  ];

  // Track used attractions to avoid repetition
  const usedAttractionIndices = new Set<number>();

  for (let d = 1; d <= days; d++) {
    const isArrival = d === 1;
    const isDeparture = d === days;

    let dayTheme;
    if (specificThemes && d <= specificThemes.length) {
      dayTheme = specificThemes[d - 1];
    } else if (isArrival) {
      dayTheme = genericDayThemes[0];
    } else if (isDeparture) {
      dayTheme = genericDayThemes[9]; // Departure theme
    } else {
      // Rotate through middle themes for longer trips
      const themeIndex = ((d - 2) % 7) + 1;
      dayTheme = genericDayThemes[themeIndex];
    }

    // Use schedule from theme or generate based on day type
    const highlights = dayTheme.schedule || [];

    // Get unique attractions for this day (1-2 per day, none for arrival/departure)
    const dayActivities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }> = [];

    if (!isArrival && !isDeparture) {
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
      title: dayTheme.title,
      description: dayTheme.desc,
      highlights,
      image: dayTheme.image,
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

// Default hotel placeholder image
const HOTEL_PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80";

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const [errors, setErrors] = useState<Set<number>>(new Set());

  // Use placeholder if no images provided
  const displayImages = images && images.length > 0 ? images : [HOTEL_PLACEHOLDER];

  return (
    <div className="relative">
      <div className="relative h-[200px] rounded-lg overflow-hidden">
        {!errors.has(current) ? (
          <Image
            src={displayImages[current]}
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
        {displayImages.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {current + 1}/{displayImages.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Hotel Detail Types for expanded view
interface HotelAmenityGroup {
  group_name: string;
  amenities: string[];
}

interface HotelDescriptionSection {
  title: string;
  paragraphs: string[];
}

interface HotelDetailData {
  id: string;
  name: string;
  address: string;
  star_rating: number;
  latitude: number;
  longitude: number;
  images: string[];
  images_large: string[];
  amenity_groups: HotelAmenityGroup[];
  description_struct: HotelDescriptionSection[];
  check_in_time: string;
  check_out_time: string;
  hotel_chain: string;
  phone: string;
  email: string;
  front_desk_time_start: string;
  front_desk_time_end: string;
  postal_code: string;
  kind: string;
  region_name: string;
}

// Amenity icon mapping for hotel details (matching hotel detail page)
const amenityIconMap: Record<string, React.ReactNode> = {
  "wi-fi": <Wifi className="w-4 h-4" />,
  wifi: <Wifi className="w-4 h-4" />,
  internet: <Wifi className="w-4 h-4" />,
  breakfast: <Coffee className="w-4 h-4" />,
  buffet: <Coffee className="w-4 h-4" />,
  parking: <ParkingCircle className="w-4 h-4" />,
  pool: <Waves className="w-4 h-4" />,
  swimming: <Waves className="w-4 h-4" />,
  gym: <Dumbbell className="w-4 h-4" />,
  fitness: <Dumbbell className="w-4 h-4" />,
  restaurant: <Utensils className="w-4 h-4" />,
  bar: <Utensils className="w-4 h-4" />,
  spa: <Sparkles className="w-4 h-4" />,
  sauna: <Sparkles className="w-4 h-4" />,
  "air conditioning": <AirVent className="w-4 h-4" />,
  "room service": <ConciergeBell className="w-4 h-4" />,
  "airport shuttle": <Plane className="w-4 h-4" />,
  pet: <Dog className="w-4 h-4" />,
  laundry: <ShowerHead className="w-4 h-4" />,
  "business center": <Building2 className="w-4 h-4" />,
  "24-hour": <Clock className="w-4 h-4" />,
  reception: <Clock className="w-4 h-4" />,
  beach: <Palmtree className="w-4 h-4" />,
  wheelchair: <Accessibility className="w-4 h-4" />,
  family: <Bed className="w-4 h-4" />,
};

// Format time to HH:MM
function formatTimeDisplay(time: string): string {
  if (!time) return "--:--";
  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  // Try to parse and format
  try {
    const date = new Date(time);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
}

// Get airline logo URL
function getAirlineLogo(airlineCode: string, duffelLogo?: string): string {
  if (duffelLogo) return duffelLogo;
  return `https://pics.avs.io/400/160/${airlineCode}.png`;
}

function getAmenityIcon(amenityName: string): React.ReactNode {
  const lower = amenityName.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIconMap)) {
    if (lower.includes(key)) return icon;
  }
  return <Check className="w-4 h-4" />;
}

// Expanded Hotel Details Component
function ExpandedHotelDetails({
  hotelId,
  hotelName,
  currency,
  nights,
  onClose,
}: {
  hotelId: string;
  hotelName: string;
  currency: Currency;
  nights: number;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [hotelData, setHotelData] = useState<HotelDetailData | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function fetchHotelDetails() {
      try {
        const params = new URLSearchParams();
        params.set("currency", currency);

        const res = await fetch(`/api/search/hotels/${encodeURIComponent(hotelId)}?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status && json.data) {
            setHotelData(json.data);
          }
        }
      } catch (error) {
        console.error("Error fetching hotel details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHotelDetails();
  }, [hotelId, currency]);

  if (loading) {
    return (
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#003580]" />
          <span className="ml-2 text-sm text-gray-500">Loading hotel details...</span>
        </div>
      </div>
    );
  }

  if (!hotelData) {
    return (
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="text-center py-4 text-sm text-gray-500">
          Unable to load hotel details. Please try again.
        </div>
      </div>
    );
  }

  const images = hotelData.images || [];
  const amenityGroups = hotelData.amenity_groups || [];
  const descriptionStruct = hotelData.description_struct || [];

  // Build flat amenities list
  const allAmenities: string[] = [];
  for (const group of amenityGroups) {
    allAmenities.push(...group.amenities);
  }
  const popularAmenities = allAmenities.slice(0, 12);

  // Build description text
  const descriptions = descriptionStruct
    .filter(s => s.paragraphs.length > 0)
    .map(s => ({ title: s.title, text: s.paragraphs.join(" ") }));

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      {/* Close button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Info className="h-4 w-4 text-[#003580]" />
          Full Hotel Details
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ChevronUp className="h-3 w-3" />
          Hide details
        </button>
      </div>

      {/* Large Image Gallery */}
      {images.length > 0 && (
        <div className="mb-4">
          <div className="relative h-[250px] rounded-lg overflow-hidden mb-2">
            <Image
              src={images[activeImageIndex]}
              alt={`${hotelName} - Photo ${activeImageIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {activeImageIndex + 1}/{images.length}
                </div>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {images.slice(0, 10).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-10 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                    idx === activeImageIndex ? "border-[#003580]" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" sizes="56px" />
                </button>
              ))}
              {images.length > 10 && (
                <div className="flex items-center justify-center w-14 h-10 bg-gray-100 rounded text-xs text-gray-500">
                  +{images.length - 10}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hotel Description */}
      {descriptions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">About This Property</h4>
          <div className="space-y-2 text-xs text-gray-600 leading-relaxed max-h-[200px] overflow-y-auto">
            {descriptions.map((desc, idx) => (
              <div key={idx}>
                {desc.title && <strong className="text-gray-700">{desc.title}: </strong>}
                {desc.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Amenities */}
      {popularAmenities.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Most Popular Facilities</h4>
          <div className="flex flex-wrap gap-2">
            {popularAmenities.map((amenity, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
              >
                <span className="text-[#0071c2]">{getAmenityIcon(amenity)}</span>
                {amenity}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Amenity Groups */}
      {amenityGroups.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">All Property Amenities</h4>
          <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto">
            {amenityGroups.map((group, idx) => (
              <div key={idx}>
                <h5 className="text-xs font-medium text-gray-800 mb-1">{group.group_name}</h5>
                <ul className="space-y-0.5">
                  {group.amenities.slice(0, 6).map((amenity, aidx) => (
                    <li key={aidx} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {amenity}
                    </li>
                  ))}
                  {group.amenities.length > 6 && (
                    <li className="text-[11px] text-gray-400">+{group.amenities.length - 6} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in/Check-out Times */}
      {(hotelData.check_in_time || hotelData.check_out_time) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#003580]" />
            House Rules
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {hotelData.check_in_time && (
              <div>
                <div className="text-xs font-medium text-gray-700">Check-in</div>
                <div className="text-sm text-gray-900">From {hotelData.check_in_time}</div>
              </div>
            )}
            {hotelData.check_out_time && (
              <div>
                <div className="text-xs font-medium text-gray-700">Check-out</div>
                <div className="text-sm text-gray-900">Until {hotelData.check_out_time}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hotel Chain & Property Type */}
      <div className="flex flex-wrap gap-2 text-xs mb-4">
        {hotelData.hotel_chain && (
          <span className="bg-[#003580]/10 text-[#003580] px-2 py-1 rounded">{hotelData.hotel_chain}</span>
        )}
        {hotelData.kind && (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">{hotelData.kind}</span>
        )}
      </div>

      {/* Why book with us - matching hotel detail page */}
      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-green-600" />
          Why Book This Hotel?
        </h4>
        <ul className="space-y-1.5">
          <li className="flex items-start gap-2 text-xs">
            <Shield className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-600">Best price guarantee</span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <Plane className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-600">ATOL protected holidays</span>
          </li>
          <li className="flex items-start gap-2 text-xs">
            <Headphones className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-600">24/7 customer support</span>
          </li>
        </ul>
      </div>

      {/* Hotel contact information if available */}
      {(hotelData.phone || hotelData.email) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Hotel Contact</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {hotelData.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-gray-400" />
                {hotelData.phone}
              </div>
            )}
            {hotelData.email && (
              <div className="flex items-center gap-1.5">
                <Info className="w-3 h-3 text-gray-400" />
                {hotelData.email}
              </div>
            )}
          </div>
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
  image,
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
  image: string;
  activities: Array<{ name: string; category: string; description: string; price: number; duration: string; id: string }>;
  currency: Currency;
  selectedActivities: Set<string>;
  onToggleActivity: (id: string, price: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [imageError, setImageError] = useState(false);

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
          {/* Day image */}
          {image && !imageError && (
            <div className="relative h-[160px] rounded-lg overflow-hidden mb-4">
              <Image
                src={image}
                alt={`Day ${day}: ${title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-2 left-3 text-white text-sm font-medium drop-shadow-lg">
                Day {day}: {title}
              </div>
            </div>
          )}

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

/**
 * Calculate total price using live API data.
 * Returns null for total/perPerson if either core price is unavailable.
 * NEVER falls back to fake/estimated prices.
 */
function calculateTotalPrice({
  liveFlightPrice,
  liveHotelPrice,
  liveActivityTotal,
  nights,
  adults,
}: CalculateTotalPriceParams): PriceBreakdown {
  const flightPrice = liveFlightPrice;
  const hotelPrice = liveHotelPrice;
  const activityTotal = liveActivityTotal;

  // If either core price is null, we can't calculate a total
  if (flightPrice === null || hotelPrice === null) {
    return { flightPrice, hotelPrice, activityTotal, total: null, perPerson: null };
  }

  const total = flightPrice + hotelPrice + activityTotal;
  const perPerson = Math.round(total / adults);
  return { flightPrice, hotelPrice, activityTotal, total, perPerson };
}

// === Loading Skeleton Components ===

/** Skeleton for hotel tier selector cards (matches 2x4 grid of hotel buttons) */
function HotelSkeleton() {
  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="h-4 w-32 bg-gray-200 animate-pulse rounded mb-2" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center p-3 rounded-lg border-2 border-transparent bg-white/50">
            {/* Star rating placeholder */}
            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 w-3 bg-gray-200 animate-pulse rounded-full" />
              ))}
            </div>
            {/* Tier badge */}
            <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mb-1" />
            {/* Hotel name */}
            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded mb-1" />
            <div className="h-3 w-20 bg-gray-100 animate-pulse rounded mb-1" />
            {/* Board type */}
            <div className="h-3 w-16 bg-gray-100 animate-pulse rounded mt-0.5" />
            {/* Price */}
            <div className="h-5 w-14 bg-gray-200 animate-pulse rounded mt-1" />
            <div className="h-3 w-16 bg-gray-100 animate-pulse rounded mt-0.5" />
          </div>
        ))}
      </div>
      <div className="h-3 w-64 bg-gray-100 animate-pulse rounded mx-auto mt-2" />
    </div>
  );
}

/** Skeleton for airline/flight option cards (matches 4 airline selection buttons) */
function FlightSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="border rounded-lg p-3 border-gray-200">
          <div className="flex items-center gap-3">
            {/* Airline logo */}
            <div className="w-10 h-8 bg-gray-200 animate-pulse rounded flex-shrink-0" />
            {/* Flight info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-4 bg-gray-100 animate-pulse rounded" />
                <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                <div className="h-3 w-14 bg-gray-100 animate-pulse rounded" />
              </div>
              <div className="h-3 w-24 bg-gray-100 animate-pulse rounded mt-1" />
            </div>
            {/* Price */}
            <div className="h-5 w-16 bg-gray-200 animate-pulse rounded flex-shrink-0" />
            {/* Radio button */}
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 animate-pulse flex-shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for activity cards in the Things to Do grid */
function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="border rounded-lg overflow-hidden border-gray-200">
          {/* Image placeholder */}
          <div className="h-36 bg-gray-200 animate-pulse" />
          <div className="p-3">
            {/* Title */}
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
            {/* Description */}
            <div className="h-3 w-full bg-gray-100 animate-pulse rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-100 animate-pulse rounded mb-2" />
            {/* Duration + price row */}
            <div className="flex justify-between items-center">
              <div className="h-3 w-16 bg-gray-100 animate-pulse rounded" />
              <div className="h-5 w-14 bg-gray-200 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PackageDetailContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const [selectedActivities, setSelectedActivities] = useState<Record<string, number>>({});
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 2]));
  const [showHotelOptions, setShowHotelOptions] = useState(false);
  // showFlightOptions removed - airline selection is now inline
  const [showHotelMap, setShowHotelMap] = useState(false);
  const [showHotelDetails, setShowHotelDetails] = useState(true);
  const [showFlightDetails, setShowFlightDetails] = useState(false);
  const [selectedHotelIdx, setSelectedHotelIdx] = useState(1); // Default to "standard" tier (index 1)
  const [selectedBoardType, setSelectedBoardType] = useState<BoardType>("Bed & Breakfast");
  // selectedFlightIdx removed - now using selectedAirlineIdx
  const [selectedAirlineIdx, setSelectedAirlineIdx] = useState(0);
  const [hotelDetailData, setHotelDetailData] = useState<HotelDetailData | null>(null);
  const [hotelDetailLoading, setHotelDetailLoading] = useState(true);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  // === Live API data state (for Agents 2 & 3 to populate) ===
  // Hotel state
  const [liveHotelData, setLiveHotelData] = useState<HotelAPIResult | null>(null);
  const [liveHotelLoading, setLiveHotelLoading] = useState(false);
  const [liveHotelImages, setLiveHotelImages] = useState<string[]>([]);
  const [liveHotelDetails, setLiveHotelDetails] = useState<HotelDetails | null>(null);

  // Flight state
  const [liveFlightOffers, setLiveFlightOffers] = useState<LiveFlightOffer[]>([]);
  const [liveFlightLoading, setLiveFlightLoading] = useState(true);
  const [liveSelectedFlight, setLiveSelectedFlight] = useState<LiveFlightOffer | null>(null);
  // Raw API flight data for richer segment details (airport names, operating carrier, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawApiFlights, setRawApiFlights] = useState<any[]>([]);

  // Activity state
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [liveActivitiesLoading, setLiveActivitiesLoading] = useState(false);
  const [liveSelectedActivities, setLiveSelectedActivities] = useState<LiveActivity[]>([]);

  // Pricing state — null means "not yet loaded from API"
  const [liveHotelPrice, setLiveHotelPrice] = useState<number | null>(null);
  const [liveFlightPrice, setLiveFlightPrice] = useState<number | null>(null);
  const [liveActivityTotal, setLiveActivityTotal] = useState(0);

  // === HotelBeds live tier data ===
  const [liveTierData, setLiveTierData] = useState<Record<string, {
    tier: string;
    available: boolean;
    hotel: {
      code: number;
      name: string;
      stars: number;
      images: string[];
      pricePerNight: number;
      totalPrice: number;
      currency: string;
      cheapestBoardCode: string;
      cheapestBoardName: string;
      latitude: string;
      longitude: string;
    } | null;
    hotelCount: number;
  }> | null>(null);
  const [liveTierLoading, setLiveTierLoading] = useState(true);
  const [liveRoomRates, setLiveRoomRates] = useState<Array<{
    roomName: string;
    boardCode: string;
    boardName: string;
    totalPrice: number;
    pricePerNight: number;
    currency: string;
    freeCancellation: boolean;
    rateKey: string;
  }>>([]);
  const [liveRatesLoading, setLiveRatesLoading] = useState(false);
  const [liveHotelContentData, setLiveHotelContentData] = useState<{
    code: number;
    name: string;
    images: string[];
    description: string;
    address: string;
    city: string;
    country: string;
    facilities: string[];
    phones: { phoneNumber: string; phoneType: string }[];
    email: string;
    reviewScore?: number;
    reviewCount?: number;
  } | null>(null);
  const [liveContentLoading, setLiveContentLoading] = useState(false);
  const [packageDates, setPackageDates] = useState<{ checkIn: string; checkOut: string }>({ checkIn: "", checkOut: "" });

  // Get package ID from URL path params
  const packageId = params?.id as string | undefined;

  // First, try to load package from static JSON data
  let pkg: PackageData | null = null;

  // Step 1: Try to load from static JSON using the package ID
  if (packageId) {
    pkg = getStaticPackageById(packageId);
  }

  // Step 2: If not found in static JSON, fall back to URL query parameter (for dynamic searches)
  if (!pkg) {
    const dataParam = searchParams.get("data");
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
  }

  // Generate hotel options for selection (4 tiers)
  const hotelOptions = useMemo(() => {
    if (!pkg || !pkg.hotel) return [];
    return generateHotelOptions(pkg.destination, pkg.hotel, pkg.nights);
  }, [pkg]);

  // For backwards compatibility
  const alternativeHotels = hotelOptions;

  // Generate static airline options (fallback only)
  const staticAirlineFlightOptions = useMemo(() => {
    if (!pkg || !pkg.flight) return [];
    const baseFlight = pkg.flight;
    const basePrice = baseFlight.price;

    const packages = (top50PackagesData as { packages: StaticPackage[] }).packages;
    const staticPkg = packages.find((p) => p.id === packageId);
    const region = staticPkg?.region || "worldwide";
    const airportCode = staticPkg?.airportCode || baseFlight.outbound.destination;
    const destinationName = pkg.destination;

    return AIRLINE_OPTIONS.map((airline) =>
      generateFlightForAirline(basePrice, airline, "LHR", airportCode, destinationName, region)
    );
  }, [pkg, packageId]);

  // Convert raw API flight data directly to PackageFlight format for the UI
  // Uses rawApiFlights for richer segment details (airport names, operating carrier, etc.)
  const liveAirlineFlightOptions: PackageFlight[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rawApiFlights.map((f: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapSegments = (segments: any[]) => segments?.map((s: any) => ({
        departureAirport: s.departureAirport,
        departureAirportName: s.departureAirportName,
        departureCity: s.departureCity,
        arrivalAirport: s.arrivalAirport,
        arrivalAirportName: s.arrivalAirportName,
        arrivalCity: s.arrivalCity,
        departureTime: s.departureTime,
        arrivalTime: s.arrivalTime,
        departureDate: s.departureDate,
        arrivalDate: s.arrivalDate,
        flightNumber: s.flightNumber,
        airlineCode: s.airlineCode,
        airlineName: s.airlineName,
        airlineLogo: s.airlineLogo || `https://pics.avs.io/400/160/${s.airlineCode}.png`,
        operatingCarrier: s.operatingCarrier,
        duration: s.duration,
        cabinClass: s.cabinClass,
        aircraft: s.aircraft,
        baggageIncluded: s.baggageIncluded,
      })) || [];

      return {
        id: f.id,
        airlineCode: f.outbound.airlineCode,
        airlineName: f.outbound.airlineName,
        airlineLogo: f.outbound.airlineLogo || `https://pics.avs.io/400/160/${f.outbound.airlineCode}.png`,
        price: f.price,
        basePrice: f.basePrice,
        taxAmount: f.taxAmount,
        stops: f.outbound.stops,
        outbound: {
          origin: f.outbound.origin,
          originName: f.outbound.originName,
          originCity: f.outbound.originCity,
          destination: f.outbound.destination,
          destinationName: f.outbound.destinationName,
          destinationCity: f.outbound.destinationCity,
          departureTime: f.outbound.departureTime,
          arrivalTime: f.outbound.arrivalTime,
          duration: f.outbound.duration,
          departureDate: f.outbound.departureDate,
          arrivalDate: f.outbound.arrivalDate,
          segments: mapSegments(f.outbound.segments),
        },
        inbound: f.inbound ? {
          origin: f.inbound.origin,
          originName: f.inbound.originName,
          originCity: f.inbound.originCity,
          destination: f.inbound.destination,
          destinationName: f.inbound.destinationName,
          destinationCity: f.inbound.destinationCity,
          departureTime: f.inbound.departureTime,
          arrivalTime: f.inbound.arrivalTime,
          duration: f.inbound.duration,
          departureDate: f.inbound.departureDate,
          arrivalDate: f.inbound.arrivalDate,
          segments: mapSegments(f.inbound.segments),
        } : null,
        cabinBaggage: f.cabinBaggage,
        checkedBaggage: f.checkedBaggage,
        cabinClass: f.outbound.segments?.[0]?.cabinClass || "Economy",
      };
    });
  }, [rawApiFlights]);

  // Only show live flight options — never fall back to static/fake data
  const hasLiveFlights = liveAirlineFlightOptions.length > 0;
  const airlineFlightOptions = liveAirlineFlightOptions;

  // Use selected airline flight or default
  const selectedAirlineFlight = airlineFlightOptions[selectedAirlineIdx] || pkg?.flight;

  // === HotelBeds: Fetch hotel tiers on page load ===
  useEffect(() => {
    if (!pkg) {
      setLiveTierLoading(false);
      return;
    }

    // Generate check-in/check-out dates (2 weeks from now)
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 14);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + pkg.nights);

    const ciStr = checkIn.toISOString().split("T")[0];
    const coStr = checkOut.toISOString().split("T")[0];
    setPackageDates({ checkIn: ciStr, checkOut: coStr });

    let cancelled = false;
    setLiveTierLoading(true);

    const cur = pkg.currency || "GBP";
    fetch(`/api/hotels/search?destination=${encodeURIComponent(pkg.destination)}&checkIn=${ciStr}&checkOut=${coStr}&adults=2&currency=${cur}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.status && json.tiers) {
          setLiveTierData(json.tiers);
        }
      })
      .catch((err) => {
        console.error("Hotel tier search failed:", err);
      })
      .finally(() => {
        if (!cancelled) setLiveTierLoading(false);
      });

    return () => { cancelled = true; };
  }, [pkg?.destination, pkg?.nights, pkg?.currency]);

  // === Duffel: Fetch live flight offers on page load ===
  useEffect(() => {
    if (!pkg) return;

    // Determine airport code from static package data
    const packages = (top50PackagesData as { packages: StaticPackage[] }).packages;
    const staticPkg = packages.find((p) => p.id === packageId);
    const destinationAirport = staticPkg?.airportCode || pkg.flight?.outbound?.destination;

    if (!destinationAirport) return;

    // Generate travel dates (2 weeks from now, matching hotel dates)
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + pkg.nights);

    const depStr = departureDate.toISOString().split("T")[0];
    const retStr = returnDate.toISOString().split("T")[0];
    const cur = pkg.currency || "GBP";

    let cancelled = false;
    setLiveFlightLoading(true);

    fetch(`/api/search/flights?origin=LHR&destination=${destinationAirport}&departureDate=${depStr}&returnDate=${retStr}&adults=2&currency=${cur}&cabinClass=economy`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.status || !json.data || json.data.length === 0) {
          setLiveFlightOffers([]);
          setLiveFlightLoading(false);
          return;
        }

        // Group by airline and pick cheapest per airline, then top 8
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const byAirline: Record<string, any> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const flight of json.data as any[]) {
          const key = flight.outbound.airlineCode as string;
          if (!byAirline[key] || flight.price < byAirline[key].price) {
            byAirline[key] = flight;
          }
        }

        // Sort by price and take top 8
        const bestPerAirline = Object.values(byAirline)
          .sort((a: { price: number }, b: { price: number }) => a.price - b.price)
          .slice(0, 8);

        // Transform API flights to LiveFlightOffer format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveOffers: LiveFlightOffer[] = bestPerAirline.map((f: any) => ({
          id: f.id,
          provider: "duffel" as const,
          providerOfferId: f.id,
          airlineCode: f.outbound.airlineCode,
          airlineName: f.outbound.airlineName,
          airlineLogo: f.outbound.airlineLogo,
          outbound: {
            origin: f.outbound.origin,
            originName: f.outbound.originName,
            originCity: f.outbound.originCity,
            destination: f.outbound.destination,
            destinationName: f.outbound.destinationName,
            destinationCity: f.outbound.destinationCity,
            departureTime: f.outbound.departureTime,
            arrivalTime: f.outbound.arrivalTime,
            departureDate: f.outbound.departureDate,
            arrivalDate: f.outbound.arrivalDate,
            duration: f.outbound.duration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            segments: f.outbound.segments?.map((s: any) => ({
              airlineCode: s.airlineCode,
              airlineName: s.airlineName,
              flightNumber: s.flightNumber,
              aircraft: s.aircraft,
              origin: s.departureAirport,
              destination: s.arrivalAirport,
              departureTime: s.departureTime,
              arrivalTime: s.arrivalTime,
              duration: s.duration,
              cabinClass: s.cabinClass,
            })),
          },
          inbound: f.inbound ? {
            origin: f.inbound.origin,
            originName: f.inbound.originName,
            originCity: f.inbound.originCity,
            destination: f.inbound.destination,
            destinationName: f.inbound.destinationName,
            destinationCity: f.inbound.destinationCity,
            departureTime: f.inbound.departureTime,
            arrivalTime: f.inbound.arrivalTime,
            departureDate: f.inbound.departureDate,
            arrivalDate: f.inbound.arrivalDate,
            duration: f.inbound.duration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            segments: f.inbound.segments?.map((s: any) => ({
              airlineCode: s.airlineCode,
              airlineName: s.airlineName,
              flightNumber: s.flightNumber,
              aircraft: s.aircraft,
              origin: s.departureAirport,
              destination: s.arrivalAirport,
              departureTime: s.departureTime,
              arrivalTime: s.arrivalTime,
              duration: s.duration,
              cabinClass: s.cabinClass,
            })),
          } : null,
          totalPrice: f.price,
          basePrice: f.basePrice,
          taxes: f.taxAmount,
          currency: (f.currency || cur) as Currency,
          cabinClass: f.outbound.segments?.[0]?.cabinClass || "Economy",
          cabinBaggage: f.cabinBaggage,
          checkedBaggage: f.checkedBaggage,
          stops: f.outbound.stops,
        }));

        setLiveFlightOffers(liveOffers);
        setRawApiFlights(bestPerAirline);

        // Auto-select cheapest flight and set live pricing
        if (liveOffers.length > 0) {
          setLiveSelectedFlight(liveOffers[0]);
          setLiveFlightPrice(liveOffers[0].totalPrice);
          setSelectedAirlineIdx(0);
        }
      })
      .catch((err) => {
        console.error("Flight search failed:", err);
        setLiveFlightOffers([]);
      })
      .finally(() => {
        if (!cancelled) setLiveFlightLoading(false);
      });

    return () => { cancelled = true; };
  }, [pkg?.destination, pkg?.nights, pkg?.currency, packageId]);

  // === HotelBeds: Fetch content + rates when tier changes ===
  useEffect(() => {
    const tierNames = ["budget", "standard", "deluxe", "luxury"];
    const tierName = tierNames[selectedHotelIdx];

    if (!liveTierData || !liveTierData[tierName]?.available || !liveTierData[tierName]?.hotel) {
      // No live data for this tier — clear live content
      setLiveHotelContentData(null);
      setLiveRoomRates([]);
      setHotelDetailData(null);
      setHotelDetailLoading(false);
      return;
    }

    const hotel = liveTierData[tierName].hotel!;
    let cancelled = false;

    // Set live hotel price from tier data immediately
    setLiveHotelPrice(hotel.totalPrice);

    // Fetch content (images, description, facilities)
    setLiveContentLoading(true);
    setHotelDetailLoading(true);

    fetch(`/api/hotels/content?code=${hotel.code}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.status && json.data) {
          setLiveHotelContentData(json.data);
          setLiveHotelImages(json.data.images || []);
          // Also set hotelDetailData for the existing accommodation section display
          setHotelDetailData({
            id: `hb_${hotel.code}`,
            name: json.data.name || hotel.name,
            address: json.data.address || "",
            star_rating: hotel.stars,
            latitude: parseFloat(hotel.latitude) || 0,
            longitude: parseFloat(hotel.longitude) || 0,
            images: json.data.images || [],
            images_large: json.data.images || [],
            amenity_groups: json.data.facilities?.length > 0
              ? [{ group_name: "Hotel Facilities", amenities: json.data.facilities }]
              : [],
            description_struct: json.data.description
              ? [{ title: "About This Property", paragraphs: [json.data.description] }]
              : [],
            check_in_time: "",
            check_out_time: "",
            hotel_chain: "",
            phone: json.data.phones?.[0]?.phoneNumber || "",
            email: json.data.email || "",
            front_desk_time_start: "",
            front_desk_time_end: "",
            postal_code: json.data.postalCode || "",
            kind: "",
            region_name: json.data.city || "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveHotelContentData(null);
          setHotelDetailData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLiveContentLoading(false);
          setHotelDetailLoading(false);
        }
      });

    // Fetch rates (room options with board basis)
    if (packageDates.checkIn && packageDates.checkOut) {
      setLiveRatesLoading(true);
      const cur = liveTierData[tierName]?.hotel?.currency || "GBP";

      fetch(`/api/hotels/rates?code=${hotel.code}&checkIn=${packageDates.checkIn}&checkOut=${packageDates.checkOut}&adults=2&currency=${cur}`)
        .then((res) => res.json())
        .then((json) => {
          if (!cancelled && json.status && json.data?.rates) {
            setLiveRoomRates(json.data.rates);
            // Update live hotel price from the rate matching current board selection
            const boardCodeMap: Record<string, string> = {
              "Room Only": "RO",
              "Bed & Breakfast": "BB",
              "Half Board": "HB",
              "All Inclusive": "AI",
            };
            const currentBoardCode = boardCodeMap[selectedBoardType] || "RO";
            const matchingRate = json.data.rates.find((r: any) => r.boardCode === currentBoardCode);
            if (matchingRate) {
              setLiveHotelPrice(matchingRate.totalPrice);
            } else if (json.data.rates.length > 0) {
              setLiveHotelPrice(json.data.rates[0].totalPrice);
            }
          }
        })
        .catch(() => {
          if (!cancelled) setLiveRoomRates([]);
        })
        .finally(() => {
          if (!cancelled) setLiveRatesLoading(false);
        });
    }

    return () => { cancelled = true; };
  }, [selectedHotelIdx, liveTierData, packageDates.checkIn, packageDates.checkOut]);

  // === Update liveHotelPrice when board type changes and rates are available ===
  useEffect(() => {
    if (liveRoomRates.length === 0) return;

    const boardCodeMap: Record<string, string> = {
      "Room Only": "RO",
      "Bed & Breakfast": "BB",
      "Half Board": "HB",
      "All Inclusive": "AI",
    };
    const currentBoardCode = boardCodeMap[selectedBoardType] || "RO";
    const matchingRate = liveRoomRates.find((r) => r.boardCode === currentBoardCode);
    if (matchingRate) {
      setLiveHotelPrice(matchingRate.totalPrice);
    }
  }, [selectedBoardType, liveRoomRates]);

  // Generate itinerary only for trips up to 10 days
  const itinerary = useMemo(() => {
    if (!pkg || pkg.nights > 10) return null;
    return generateItinerary(pkg.destination, pkg.nights, pkg.theme || "cultural", pkg.attractions || []);
  }, [pkg]);

  // Generate package description
  const packageDescription = useMemo(() => {
    if (!pkg) return null;
    return generatePackageDescription(pkg.destination, pkg.theme || "cultural", pkg.nights);
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

  // Get selected hotel and flight (now uses airline selection)
  const selectedHotel = alternativeHotels[selectedHotelIdx] || pkg.hotel;
  const selectedFlight = selectedAirlineFlight || pkg.flight;

  // Calculate board type price modifier
  const selectedBoardOption = BOARD_OPTIONS.find(b => b.type === selectedBoardType) || BOARD_OPTIONS[0];
  const boardTypeModifier = selectedBoardOption.priceModifier;

  // Static hotel price with board type (used for display when live data is not available)
  const hotelPriceWithBoard = Math.round(selectedHotel.price * (1 + boardTypeModifier / 100));
  const hotelPricePerNightWithBoard = Math.round(hotelPriceWithBoard / pkg.nights);

  // Static activity total
  const activityTotal = Object.values(selectedActivities).reduce((sum, price) => sum + price, 0);

  // === Live pricing engine ===
  // When live API data is connected (by Agents 2 & 3), liveFlightPrice and liveHotelPrice
  // will be non-null and the sidebar will display real prices.
  // Until then, total/perPerson will be null → "Call for pricing".
  const livePricing = calculateTotalPrice({
    liveFlightPrice,
    liveHotelPrice,
    liveActivityTotal: liveActivityTotal + activityTotal,
    nights: pkg.nights,
    adults: 2,
  });

  // For display: use live prices if available, otherwise static placeholder prices
  const displayFlightPrice = livePricing.flightPrice ?? selectedFlight.price;
  const displayHotelPrice = livePricing.hotelPrice ?? hotelPriceWithBoard;
  const displayTotal = livePricing.total;
  const displayPerPerson = livePricing.perPerson;

  // Flag: are we showing live or static data?
  const hasLivePricing = livePricing.total !== null;

  // Hotel detail data for enhanced display
  const hotelImages = hotelDetailData?.images || selectedHotel.images || [];
  const hotelImagesLarge = hotelDetailData?.images_large || hotelImages;
  const hotelAmenityGroups = hotelDetailData?.amenity_groups || [];
  const hotelDescriptionStruct = hotelDetailData?.description_struct || [];

  // Build flat amenities list
  const allHotelAmenities: string[] = [];
  for (const group of hotelAmenityGroups) {
    allHotelAmenities.push(...group.amenities);
  }
  const popularHotelAmenities = allHotelAmenities.slice(0, 12);

  // Build description paragraphs
  const hotelDescriptions = hotelDescriptionStruct
    .filter(s => s.paragraphs.length > 0)
    .map(s => ({ title: s.title, text: s.paragraphs.join(" ") }));

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
            {/* 1. Your Experience - Theme-focused selling section */}
            {packageDescription && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Theme headline banner */}
                <div className="bg-gradient-to-r from-[#003580] to-[#0066cc] px-4 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-orange-300 bg-white/10 px-2 py-0.5 rounded capitalize">
                      {pkg.theme || "Cultural"} Experience
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white">
                    {packageDescription.themeHeadline}
                  </h2>
                </div>

                {/* Destination Hero Image */}
                <div className="relative w-full h-64 md:h-80 overflow-hidden">
                  <Image
                    src={getDestinationHeroImage(pkg.destination)}
                    alt={`${pkg.destination} destination`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="p-4">
                  {/* Theme-focused selling description */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {packageDescription.themeSellingDescription}
                  </p>

                  {/* Theme selling points */}
                  <div className="mb-4 bg-orange-50 rounded-lg p-3">
                    <h3 className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Why This Package?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {packageDescription.themeSellingPoints.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-orange-900">
                          <Check className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination info (collapsed) */}
                  <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#003580]" />
                      About {pkg.destination}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {packageDescription.about}
                    </p>

                    {/* Highlights */}
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-700 mb-2">
                        Destination Highlights
                      </h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {packageDescription.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Best For */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs font-medium text-gray-600">Perfect for:</span>
                      {packageDescription.bestFor.map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Hotel Section - Enhanced with hotel selector and board options */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#003580]" />
                    Your Accommodation
                  </h2>
                </div>

                {/* Hotel Selector - 4 tiers with real HotelBeds data */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your hotel:
                  </label>
                  {liveTierLoading ? (
                    <HotelSkeleton />
                  ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(["budget", "standard", "deluxe", "luxury"] as const).map((tierName, idx) => {
                      const liveTier = liveTierData?.[tierName];
                      const staticHotel = hotelOptions[idx];
                      const hasLiveData = liveTier?.available && liveTier.hotel;
                      const liveHotel = liveTier?.hotel;

                      // Tier is unavailable if we have live data but this tier has no hotels
                      const isUnavailable = liveTierData && !hasLiveData;

                      // Use live data when available, fallback to static
                      const displayName = hasLiveData ? liveHotel!.name : staticHotel?.name || tierName;
                      const displayStars = hasLiveData ? liveHotel!.stars : (staticHotel?.starRating || 3);
                      const displayPrice = hasLiveData ? liveHotel!.totalPrice : staticHotel?.price;
                      const displayPricePerNight = hasLiveData ? liveHotel!.pricePerNight : staticHotel?.pricePerNight;
                      const displayBoard = hasLiveData ? liveHotel!.cheapestBoardName : staticHotel?.mealPlan;

                      return (
                      <button
                        key={tierName}
                        onClick={() => {
                          if (isUnavailable) return;
                          setSelectedHotelIdx(idx);
                          if (hasLiveData && liveHotel) {
                            // Map HotelBeds board code to BoardType
                            const boardMap: Record<string, BoardType> = {
                              "Room Only": "Room Only",
                              "Bed & Breakfast": "Bed & Breakfast",
                              "Half Board": "Half Board",
                              "All Inclusive": "All Inclusive",
                            };
                            const mappedBoard = boardMap[liveHotel.cheapestBoardName];
                            if (mappedBoard) setSelectedBoardType(mappedBoard);
                          } else if (staticHotel && 'defaultBoardType' in staticHotel) {
                            setSelectedBoardType(staticHotel.defaultBoardType as BoardType);
                          }
                        }}
                        disabled={!!isUnavailable}
                        className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                          isUnavailable
                            ? "border-transparent bg-gray-100 opacity-60 cursor-not-allowed"
                            : selectedHotelIdx === idx
                              ? "border-[#003580] bg-white shadow-sm"
                              : "border-transparent bg-white/50 hover:border-gray-300 hover:bg-white"
                        }`}
                      >
                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5 mb-1">
                          {Array.from({ length: displayStars }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#feba02] text-[#feba02]" />
                          ))}
                        </div>
                        {/* Hotel Tier Badge */}
                        <div className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${
                          tierName === 'luxury' ? 'bg-amber-100 text-amber-800' :
                          tierName === 'deluxe' ? 'bg-purple-100 text-purple-800' :
                          tierName === 'standard' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {tierName}
                        </div>

                        {isUnavailable ? (
                          <>
                            <div className="text-xs font-medium text-gray-500 text-center min-h-[32px] flex items-center">
                              Unavailable
                            </div>
                            <div className="text-[10px] text-orange-600 text-center mt-1">
                              Call us on<br />020 8944 4555
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Hotel Name */}
                            <div className="text-xs font-medium text-gray-900 text-center line-clamp-2 min-h-[32px]">
                              {displayName}
                            </div>
                            {/* Board Type */}
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {displayBoard}
                            </div>
                            {/* Price */}
                            {displayPrice != null && (
                              <>
                                <div className="text-sm font-bold text-[#003580] mt-1">
                                  {formatPrice(displayPrice, currency)}
                                </div>
                                <div className="text-[10px] text-gray-400">
                                  {displayPricePerNight != null && `${formatPrice(displayPricePerNight, currency)}/night`}
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* Selected checkmark */}
                        {selectedHotelIdx === idx && !isUnavailable && (
                          <div className="absolute top-1 right-1">
                            <Check className="w-4 h-4 text-[#003580]" />
                          </div>
                        )}
                      </button>
                      );
                    })}
                  </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {liveTierData
                      ? "Real-time hotel prices. Select your preferred tier."
                      : "Select your preferred hotel tier above. Prices vary by hotel category."}
                  </p>
                </div>

                {/* Board Type Options — real prices from HotelBeds when available */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-green-600" />
                    Board basis:
                  </label>
                  {liveRatesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                      <span className="ml-2 text-xs text-gray-500">Loading meal plans...</span>
                    </div>
                  ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(() => {
                      // Map board options to HotelBeds board codes
                      const boardCodeMap: Record<string, string> = {
                        "Room Only": "RO",
                        "Bed & Breakfast": "BB",
                        "Half Board": "HB",
                        "All Inclusive": "AI",
                      };

                      // Find the cheapest rate as baseline for "Included" display
                      const cheapestRate = liveRoomRates.length > 0
                        ? liveRoomRates.reduce((min, r) => r.totalPrice < min.totalPrice ? r : min, liveRoomRates[0])
                        : null;

                      return BOARD_OPTIONS.map((option) => {
                        const boardCode = boardCodeMap[option.type] || "RO";
                        const liveRate = liveRoomRates.find((r) => r.boardCode === boardCode);
                        const hasLiveRates = liveRoomRates.length > 0;
                        const isAvailable = !hasLiveRates || !!liveRate;

                        // Use real price diff when live rates available
                        let priceDiff: number;
                        if (hasLiveRates && liveRate && cheapestRate) {
                          priceDiff = Math.round(liveRate.totalPrice - cheapestRate.totalPrice);
                        } else {
                          // Fallback to percentage-based
                          const boardPrice = Math.round(selectedHotel.price * (1 + option.priceModifier / 100));
                          priceDiff = boardPrice - selectedHotel.price;
                        }

                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              if (!isAvailable) return;
                              setSelectedBoardType(option.type);
                            }}
                            disabled={!isAvailable}
                            className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                              !isAvailable
                                ? "border-transparent bg-gray-100 opacity-50 cursor-not-allowed"
                                : selectedBoardType === option.type
                                  ? "border-green-600 bg-white shadow-sm"
                                  : "border-transparent bg-white/50 hover:border-gray-300 hover:bg-white"
                            }`}
                          >
                            <div className="text-xs font-medium text-gray-900 text-center">
                              {option.type}
                            </div>
                            <div className="text-[10px] text-gray-500 text-center">
                              {option.description}
                            </div>
                            {!isAvailable ? (
                              <div className="text-[10px] text-gray-400 mt-1">Not available</div>
                            ) : (
                              <div className={`text-xs font-semibold mt-1 ${
                                priceDiff > 0 ? "text-orange-600" : "text-green-600"
                              }`}>
                                {priceDiff > 0 ? `+${formatPrice(priceDiff, currency)}` : "Included"}
                              </div>
                            )}
                            {selectedBoardType === option.type && isAvailable && (
                              <Check className="w-3 h-3 text-green-600 mt-0.5" />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  )}
                </div>
              </div>

              {/* Hotel Header Info */}
              <div className="px-4 pb-2 border-b border-gray-100">
                {/* Star rating + property badges */}
                <div className="flex items-center gap-2 mb-1">
                  {selectedHotel.starRating > 0 && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: selectedHotel.starRating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#feba02] text-[#feba02]" />
                      ))}
                    </div>
                  )}
                  {'tier' in selectedHotel && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      selectedHotel.tier === 'luxury' ? 'bg-amber-100 text-amber-800' :
                      selectedHotel.tier === 'deluxe' ? 'bg-purple-100 text-purple-800' :
                      selectedHotel.tier === 'standard' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {(selectedHotel.tier as string).charAt(0).toUpperCase() + (selectedHotel.tier as string).slice(1)}
                    </span>
                  )}
                  {hotelDetailData?.kind && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {hotelDetailData.kind}
                    </span>
                  )}
                  {hotelDetailData?.hotel_chain && (
                    <span className="text-xs bg-[#003580]/10 text-[#003580] px-2 py-0.5 rounded">
                      {hotelDetailData.hotel_chain}
                    </span>
                  )}
                </div>

                {/* Hotel name — use live API name when available */}
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-1">
                  {(() => {
                    const tierNames = ["budget", "standard", "deluxe", "luxury"] as const;
                    const tierName = tierNames[selectedHotelIdx];
                    const liveTier = liveTierData?.[tierName];
                    return (liveTier?.available && liveTier.hotel)
                      ? (liveHotelContentData?.name || liveTier.hotel.name)
                      : selectedHotel.name;
                  })()}
                </h3>

                {/* Address — use live content address when available */}
                {(liveHotelContentData?.address || selectedHotel.address) && (
                  <div className="flex items-center gap-1 text-[#0071c2] text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{liveHotelContentData?.address || selectedHotel.address}</span>
                  </div>
                )}

                {/* Hotel Highlights — use real facilities from HotelBeds when available */}
                {(() => {
                  const facilitiesToShow = liveHotelContentData?.facilities?.slice(0, 6);
                  const highlights = facilitiesToShow && facilitiesToShow.length > 0
                    ? facilitiesToShow
                    : ('highlights' in selectedHotel && selectedHotel.highlights) ? (selectedHotel.highlights as string[]) : [];
                  return highlights.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {highlights.map((highlight: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" />
                          {highlight}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Hero Image Gallery - Booking.com style */}
              {hotelDetailLoading ? (
                <div className="h-[280px] bg-gray-100 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#003580]" />
                </div>
              ) : hotelImages.length > 0 ? (
                <div className="relative">
                  <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[280px]">
                    {/* Large main image */}
                    <button
                      onClick={() => { setHeroImageIndex(0); setShowFullGallery(true); }}
                      className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden"
                    >
                      <Image
                        src={hotelImages[0]}
                        alt={`${selectedHotel.name} - Main photo`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, 400px"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>

                    {/* 4 smaller thumbnails */}
                    {[1, 2, 3, 4].map((idx) => {
                      const img = hotelImages[idx];
                      const isLast = idx === 4;
                      const remainingPhotos = hotelImages.length - 5;
                      const showOverlay = isLast && remainingPhotos > 0;

                      if (!img) {
                        return (
                          <div key={idx} className="relative bg-gray-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-300" />
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => { setHeroImageIndex(idx); setShowFullGallery(true); }}
                          className="relative group cursor-pointer overflow-hidden"
                        >
                          <Image
                            src={img}
                            alt={`${selectedHotel.name} - Photo ${idx + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 25vw, 200px"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          {showOverlay && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                +{remainingPhotos} photos
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] bg-gray-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-300" />
                </div>
              )}

              {/* Full screen gallery modal */}
              {showFullGallery && hotelImagesLarge.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 text-white">
                    <span className="text-sm font-medium">
                      {heroImageIndex + 1} / {hotelImagesLarge.length} - {selectedHotel.name}
                    </span>
                    <button
                      onClick={() => setShowFullGallery(false)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center relative px-16">
                    <button
                      onClick={() => setHeroImageIndex(prev => prev === 0 ? hotelImagesLarge.length - 1 : prev - 1)}
                      className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="relative w-full max-w-4xl aspect-[16/10]">
                      <Image
                        src={hotelImagesLarge[heroImageIndex]}
                        alt={`${selectedHotel.name} - Photo ${heroImageIndex + 1}`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 1280px) 100vw, 1280px"
                      />
                    </div>
                    <button
                      onClick={() => setHeroImageIndex(prev => prev === hotelImagesLarge.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="px-4 py-3 overflow-x-auto">
                    <div className="flex gap-2 justify-center">
                      {hotelImagesLarge.slice(0, 15).map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHeroImageIndex(idx)}
                          className={`relative w-14 h-10 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                            idx === heroImageIndex ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                          }`}
                        >
                          <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-cover" sizes="56px" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Hotel Details Content - Comprehensive Booking.com Style */}
              <div className="p-4 space-y-4">
                {/* Room Type & Booking Info Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                    <Bed className="h-3 w-3 mr-1" />
                    {selectedHotel.roomType}
                  </span>
                  {selectedHotel.mealPlan !== "Room Only" && (
                    <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                      <Coffee className="h-3 w-3 mr-1" />
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

                {/* Property Highlights - Key selling points */}
                {(() => {
                  const tierDetails = 'tier' in selectedHotel ? getComprehensiveHotelDetails(selectedHotel.tier as string) : getComprehensiveHotelDetails('standard');
                  return (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#003580]" />
                        Property Highlights
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {tierDetails.propertyHighlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                            <Check className="w-3.5 h-3.5 text-[#008009] flex-shrink-0" />
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Property Description - Full paragraphs */}
                {(() => {
                  const tierDetails = 'tier' in selectedHotel ? getComprehensiveHotelDetails(selectedHotel.tier as string) : getComprehensiveHotelDetails('standard');
                  const descriptions = hotelDescriptions.length > 0 ? hotelDescriptions : tierDetails.propertyDescription.map((p, i) => ({ title: i === 0 ? 'About' : '', text: p }));
                  return (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4 text-[#003580]" />
                        Property Description
                      </h4>
                      <div className="text-sm text-gray-600 leading-relaxed space-y-2">
                        {descriptions.slice(0, showHotelDetails ? descriptions.length : 2).map((desc, idx) => (
                          <p key={idx}>{typeof desc === 'string' ? desc : desc.text}</p>
                        ))}
                      </div>
                      {descriptions.length > 2 && !showHotelDetails && (
                        <button
                          onClick={() => setShowHotelDetails(true)}
                          className="text-xs text-[#0071c2] hover:underline mt-2"
                        >
                          Read more...
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Most Popular Facilities - Icon Grid */}
                {(() => {
                  const tierDetails = 'tier' in selectedHotel ? getComprehensiveHotelDetails(selectedHotel.tier as string) : getComprehensiveHotelDetails('standard');
                  const facilities = popularHotelAmenities.length > 0 ? popularHotelAmenities : tierDetails.mostPopularFacilities;
                  return (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-[#003580]" />
                        Most Popular Facilities
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {facilities.slice(0, showHotelDetails ? facilities.length : 8).map((amenity, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-[#f5f5f5] rounded text-xs text-[#1a1a2e]"
                          >
                            <span className="text-[#0071c2]">{getAmenityIcon(amenity)}</span>
                            {amenity}
                          </div>
                        ))}
                      </div>
                      {facilities.length > 8 && !showHotelDetails && (
                        <button
                          onClick={() => setShowHotelDetails(true)}
                          className="text-xs text-[#0071c2] hover:underline mt-2"
                        >
                          +{facilities.length - 8} more facilities
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Expanded Details Section - Comprehensive Booking.com Style */}
                {showHotelDetails && (() => {
                  const tierDetails = 'tier' in selectedHotel ? getComprehensiveHotelDetails(selectedHotel.tier as string) : getComprehensiveHotelDetails('standard');
                  return (
                    <div className="space-y-4 border-t border-gray-100 pt-4">
                      {/* Room Amenities & Bathroom - Side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Bed className="h-4 w-4 text-[#003580]" />
                            Room Amenities
                          </h4>
                          <ul className="space-y-1">
                            {tierDetails.roomAmenities.map((amenity, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Check className="w-3 h-3 text-[#008009] flex-shrink-0" />
                                {amenity}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Bath className="h-4 w-4 text-[#003580]" />
                            Bathroom
                          </h4>
                          <ul className="space-y-1">
                            {tierDetails.bathroomAmenities.map((amenity, idx) => (
                              <li key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <Check className="w-3 h-3 text-[#008009] flex-shrink-0" />
                                {amenity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* View Options */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-[#003580]" />
                          View
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tierDetails.viewOptions.map((view, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                              <Check className="w-3 h-3 text-[#008009]" />
                              {view}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Food & Drink */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-[#003580]" />
                          Food & Drink
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                          {tierDetails.foodAndDrink.restaurants > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Utensils className="w-3 h-3 text-[#008009]" />
                              {tierDetails.foodAndDrink.restaurants} Restaurant{tierDetails.foodAndDrink.restaurants > 1 ? 's' : ''}
                            </div>
                          )}
                          {tierDetails.foodAndDrink.bars > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Wine className="w-3 h-3 text-[#008009]" />
                              {tierDetails.foodAndDrink.bars} Bar{tierDetails.foodAndDrink.bars > 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 col-span-2">
                            <ConciergeBell className="w-3 h-3 text-[#008009]" />
                            Room service: {tierDetails.foodAndDrink.roomService}
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-700 mb-1">Breakfast options:</div>
                          <div className="flex flex-wrap gap-1">
                            {tierDetails.foodAndDrink.breakfastOptions.map((option, idx) => (
                              <span key={idx} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Internet & Parking - Side by side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-[#003580]" />
                            Internet
                          </h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-[#008009]" />
                              {tierDetails.internet.type} - {tierDetails.internet.availability}
                            </div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${tierDetails.internet.cost === 'Free' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {tierDetails.internet.cost}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Car className="h-4 w-4 text-[#003580]" />
                            Parking
                          </h4>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1.5">
                              {tierDetails.parking.available ? (
                                <Check className="w-3 h-3 text-[#008009]" />
                              ) : (
                                <X className="w-3 h-3 text-red-500" />
                              )}
                              {tierDetails.parking.type}
                            </div>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${tierDetails.parking.cost.toLowerCase().includes('free') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {tierDetails.parking.cost}
                            </span>
                            {tierDetails.parking.valet && (
                              <div className="flex items-center gap-1.5">
                                <Check className="w-3 h-3 text-[#008009]" />
                                Valet parking available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <ConciergeBell className="h-4 w-4 text-[#003580]" />
                          Services
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {tierDetails.services.map((service, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Check className="w-3 h-3 text-[#008009] flex-shrink-0" />
                              {service}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* General Facilities */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#003580]" />
                          General
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {tierDetails.generalFacilities.map((facility, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Check className="w-3 h-3 text-[#008009] flex-shrink-0" />
                              {facility}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Languages Spoken */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-[#003580]" />
                          Languages Spoken
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {tierDetails.languagesSpoken.map((lang, idx) => (
                            <span key={idx} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* House Rules - Comprehensive */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#003580]" />
                          House Rules
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="font-medium text-gray-700 mb-0.5">Check-in</div>
                            <div className="text-gray-600">{hotelDetailData?.check_in_time ? `From ${hotelDetailData.check_in_time}` : tierDetails.houseRules.checkIn}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-0.5">Check-out</div>
                            <div className="text-gray-600">{hotelDetailData?.check_out_time ? `Until ${hotelDetailData.check_out_time}` : tierDetails.houseRules.checkOut}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                              <Baby className="w-3 h-3" /> Children
                            </div>
                            <div className="text-gray-600">{tierDetails.houseRules.childrenPolicy}</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                              <Dog className="w-3 h-3" /> Pets
                            </div>
                            <div className="text-gray-600">{tierDetails.houseRules.petsPolicy}</div>
                          </div>
                          <div className="sm:col-span-2">
                            <div className="font-medium text-gray-700 mb-0.5 flex items-center gap-1">
                              <PartyPopper className="w-3 h-3" /> Parties
                            </div>
                            <div className="text-gray-600">{tierDetails.houseRules.partiesPolicy}</div>
                          </div>
                        </div>
                      </div>

                      {/* The Fine Print */}
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          The Fine Print
                        </h4>
                        <ul className="space-y-1.5">
                          {tierDetails.finePrint.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                              <CreditCard className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* All Amenity Groups from API - if available */}
                      {hotelAmenityGroups.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">All Property Amenities (from hotel)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto">
                            {hotelAmenityGroups.map((group, idx) => (
                              <div key={idx}>
                                <h5 className="text-xs font-medium text-gray-800 mb-1.5">{group.group_name}</h5>
                                <ul className="space-y-1">
                                  {group.amenities.slice(0, 8).map((amenity, aidx) => (
                                    <li key={aidx} className="flex items-center gap-1.5 text-xs text-gray-600">
                                      <Check className="w-3 h-3 text-[#008009] flex-shrink-0" />
                                      {amenity}
                                    </li>
                                  ))}
                                  {group.amenities.length > 8 && (
                                    <li className="text-xs text-gray-400">+{group.amenities.length - 8} more</li>
                                  )}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Location Map */}
                {showHotelMap && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#003580]" />
                      Location
                    </h4>
                    <HotelMap
                      hotels={[{
                        id: selectedHotel.id,
                        name: selectedHotel.name,
                        lat: hotelDetailData?.latitude,
                        lng: hotelDetailData?.longitude,
                        starRating: selectedHotel.starRating,
                        price: selectedHotel.pricePerNight,
                        currency: currency,
                        mainImage: selectedHotel.mainImage,
                        address: selectedHotel.address,
                      }]}
                      destination={pkg.destination}
                      singleHotel={true}
                      showCloseButton={false}
                      height="250px"
                    />
                  </div>
                )}

                {/* Why Book This Hotel - Trust Section */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    Why Book This Hotel?
                  </h4>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2 text-xs">
                      <Shield className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">Best price guarantee</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Plane className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">ATOL protected holidays</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs">
                      <Headphones className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">24/7 customer support</span>
                    </li>
                  </ul>
                </div>

                {/* Hotel Contact Info */}
                {hotelDetailData && (hotelDetailData.phone || hotelDetailData.email) && (
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-medium text-gray-700 mb-1">Hotel Contact</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      {hotelDetailData.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {hotelDetailData.phone}
                        </div>
                      )}
                      {hotelDetailData.email && (
                        <div className="flex items-center gap-1.5">
                          <Info className="w-3 h-3 text-gray-400" />
                          {hotelDetailData.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price and Actions — use live HotelBeds price when available */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    {(() => {
                      // Use live rate price when available
                      const boardCodeMap: Record<string, string> = {
                        "Room Only": "RO", "Bed & Breakfast": "BB", "Half Board": "HB", "All Inclusive": "AI",
                      };
                      const currentBoardCode = boardCodeMap[selectedBoardType] || "RO";
                      const matchingRate = liveRoomRates.find((r) => r.boardCode === currentBoardCode);
                      const displayTotal = matchingRate ? matchingRate.totalPrice : (liveHotelPrice || hotelPriceWithBoard);
                      const displayPerNight = matchingRate ? matchingRate.pricePerNight : (liveHotelPrice ? Math.round(liveHotelPrice / pkg.nights) : hotelPricePerNightWithBoard);
                      return (
                        <>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(displayTotal, currency)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(displayPerNight, currency)} per night for {pkg.nights} nights
                          </div>
                        </>
                      );
                    })()}
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                      <Coffee className="w-3 h-3" />
                      {selectedBoardType}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHotelMap(!showHotelMap)}
                      className="flex items-center gap-1 text-xs text-[#0071c2] hover:underline px-2 py-1 rounded border border-[#0071c2]/30 hover:bg-blue-50"
                    >
                      <Map className="h-3.5 w-3.5" />
                      {showHotelMap ? "Hide map" : "Map"}
                    </button>
                    <button
                      onClick={() => setShowHotelDetails(!showHotelDetails)}
                      className="flex items-center gap-1 text-xs text-white font-medium px-3 py-1.5 rounded bg-[#003580] hover:bg-[#00265c]"
                    >
                      <Info className="h-3.5 w-3.5" />
                      {showHotelDetails ? "Less details" : "Full hotel details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Flight Section - Enhanced with airline selection */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-[#003580]" />
                    Your Flights
                  </h2>
                </div>

                {/* Airline Selector */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your airline:
                  </label>
                  {liveFlightLoading ? (
                    <FlightSkeleton />
                  ) : airlineFlightOptions.length === 0 ? (
                    <div className="text-center py-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-700 font-medium">Flight prices unavailable</p>
                      <a href="tel:+442089444555" className="text-[#003580] font-bold hover:underline">
                        Call 020 8944 4555 for options
                      </a>
                    </div>
                  ) : (
                    <div className={`grid gap-2 ${airlineFlightOptions.length <= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
                      {airlineFlightOptions.map((flight, idx) => (
                        <button
                          key={flight.id}
                          onClick={() => {
                            setSelectedAirlineIdx(idx);
                            // Wire live pricing when a live flight is selected
                            if (hasLiveFlights && liveFlightOffers[idx]) {
                              setLiveSelectedFlight(liveFlightOffers[idx]);
                              setLiveFlightPrice(liveFlightOffers[idx].totalPrice);
                            }
                          }}
                          className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            selectedAirlineIdx === idx
                              ? "border-[#003580] bg-white shadow-sm"
                              : "border-transparent bg-white/50 hover:border-gray-300 hover:bg-white"
                          }`}
                        >
                          <div className="w-14 h-8 flex items-center justify-center mb-1">
                            <Image
                              src={getAirlineLogo(flight.airlineCode, flight.airlineLogo)}
                              alt={flight.airlineName}
                              width={80}
                              height={32}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div className="text-xs font-medium text-gray-900 text-center">{flight.airlineName}</div>
                          <div className={`text-xs mt-0.5 ${flight.stops === 0 ? "text-[#008009]" : "text-orange-600"}`}>
                            {flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                          </div>
                          <div className="text-sm font-bold text-[#003580] mt-1">
                            {formatPrice(flight.price, currency)}
                          </div>
                          {selectedAirlineIdx === idx && (
                            <div className="absolute top-1 right-1">
                              <Check className="w-4 h-4 text-[#003580]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {airlineFlightOptions.length > 0 && !liveFlightLoading && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {hasLiveFlights ? "Live flight prices. Select your preferred airline." : "Prices vary by airline. Select your preferred carrier above."}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Airline info bar */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-16 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden">
                      <Image
                        src={getAirlineLogo(selectedFlight.airlineCode, selectedFlight.airlineLogo)}
                        alt={selectedFlight.airlineName}
                        width={120}
                        height={48}
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{selectedFlight.airlineName}</div>
                      <div className="text-xs text-gray-500">{selectedFlight.airlineCode}</div>
                    </div>
                    {selectedFlight.cabinClass && (
                      <span className="ml-auto text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {selectedFlight.cabinClass}
                      </span>
                    )}
                  </div>

                    {/* Outbound Flight */}
                    {selectedFlight.outbound && (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-3">
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
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold text-gray-900">
                              {formatTimeDisplay(selectedFlight.outbound.departureTime)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {selectedFlight.outbound.origin}
                            </div>
                            {selectedFlight.outbound.originName && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {selectedFlight.outbound.originName}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col items-center px-2">
                            <div className="text-xs text-gray-500 mb-1">
                              {formatDuration(selectedFlight.outbound.duration)}
                            </div>
                            <div className="relative w-full flex items-center">
                              <div className="flex-1 h-[2px] bg-gray-300"></div>
                              <ChevronRight className="w-3 h-3 text-gray-400 -ml-1" />
                            </div>
                            <div className={`text-xs font-medium mt-1 ${
                              selectedFlight.stops === 0 ? "text-[#008009]" : "text-orange-600"
                            }`}>
                              {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold text-gray-900">
                              {formatTimeDisplay(selectedFlight.outbound.arrivalTime)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {selectedFlight.outbound.destination}
                            </div>
                            {selectedFlight.outbound.destinationName && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {selectedFlight.outbound.destinationName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Return Flight */}
                    {selectedFlight.inbound && (
                      <div className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-semibold text-white bg-gray-600 px-1.5 py-0.5 rounded">
                            RETURN
                          </span>
                          {selectedFlight.inbound.departureDate && (
                            <span className="text-xs text-gray-600">
                              {formatDateDisplay(selectedFlight.inbound.departureDate)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold text-gray-900">
                              {formatTimeDisplay(selectedFlight.inbound.departureTime)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {selectedFlight.inbound.origin}
                            </div>
                            {selectedFlight.inbound.originName && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {selectedFlight.inbound.originName}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col items-center px-2">
                            <div className="text-xs text-gray-500 mb-1">
                              {formatDuration(selectedFlight.inbound.duration)}
                            </div>
                            <div className="relative w-full flex items-center">
                              <div className="flex-1 h-[2px] bg-gray-300"></div>
                              <ChevronRight className="w-3 h-3 text-gray-400 -ml-1" />
                            </div>
                            <div className={`text-xs font-medium mt-1 ${
                              selectedFlight.stops === 0 ? "text-[#008009]" : "text-orange-600"
                            }`}>
                              {selectedFlight.stops === 0 ? "Direct" : `${selectedFlight.stops} stop${selectedFlight.stops > 1 ? "s" : ""}`}
                            </div>
                          </div>
                          <div className="text-center min-w-[60px]">
                            <div className="text-lg font-bold text-gray-900">
                              {formatTimeDisplay(selectedFlight.inbound.arrivalTime)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {selectedFlight.inbound.destination}
                            </div>
                            {selectedFlight.inbound.destinationName && (
                              <div className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                {selectedFlight.inbound.destinationName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Baggage Info - Matching flights page style */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedFlight.cabinBaggage && !selectedFlight.cabinBaggage.toLowerCase().includes("no") ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-[#008009] rounded">
                          <Briefcase className="w-3 h-3" />
                          {selectedFlight.cabinBaggage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                          <Briefcase className="w-3 h-3" />
                          Personal item only
                        </span>
                      )}
                      {selectedFlight.checkedBaggage && !selectedFlight.checkedBaggage.toLowerCase().includes("no") ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-[#008009] rounded">
                          <Check className="w-3 h-3" />
                          {selectedFlight.checkedBaggage}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded">
                          <X className="w-3 h-3" />
                          No checked bag
                        </span>
                      )}
                    </div>

                    {/* Price display */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Flight price <span className="text-xs text-gray-400">(return)</span>
                      </div>
                      <div className="text-lg font-bold text-[#003580]">
                        {formatPrice(selectedFlight.price, currency)}
                      </div>
                    </div>
                  </div>
              </div>

              {/* View Details Toggle - Matching flights page style */}
              <button
                onClick={() => setShowFlightDetails(!showFlightDetails)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-sm text-[#003580] font-medium transition-colors border-t border-gray-100"
              >
                {showFlightDetails ? (
                  <>Hide flight details <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>View flight details <ChevronDown className="w-4 h-4" /></>
                )}
              </button>

              {/* Expanded Flight Details - Matching flights page */}
              {showFlightDetails && (
                <div className="border-t border-gray-200 bg-[#F2F6FA] p-4 space-y-4">
                  {/* Outbound Segments */}
                  {selectedFlight.outbound && selectedFlight.outbound.segments && selectedFlight.outbound.segments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="w-4 h-4 text-[#003580]" />
                        <span className="font-semibold text-gray-900 text-sm">Outbound Flight</span>
                        {selectedFlight.outbound.departureDate && (
                          <span className="text-xs text-gray-500">{selectedFlight.outbound.departureDate}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {selectedFlight.outbound.segments.map((seg, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-8 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 border border-gray-100">
                                <Image
                                  src={getAirlineLogo(seg.airlineCode || selectedFlight.airlineCode, seg.airlineLogo)}
                                  alt={seg.airlineName || selectedFlight.airlineName}
                                  width={60}
                                  height={24}
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {seg.flightNumber && (
                                    <span className="font-semibold text-[#003580] text-sm">{seg.flightNumber}</span>
                                  )}
                                  <span className="text-xs text-gray-600">{seg.airlineName || selectedFlight.airlineName}</span>
                                  {seg.operatingCarrier && seg.operatingCarrier !== seg.airlineName && (
                                    <span className="text-[10px] text-gray-400">(Operated by {seg.operatingCarrier})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <div>
                                    <span className="font-bold text-gray-900">{formatTimeDisplay(seg.departureTime)}</span>
                                    <span className="text-gray-500 ml-1">{seg.departureAirport}</span>
                                    {seg.departureAirportName && (
                                      <span className="text-gray-400 ml-1 text-xs hidden sm:inline">{seg.departureAirportName}</span>
                                    )}
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <span className="font-bold text-gray-900">{formatTimeDisplay(seg.arrivalTime)}</span>
                                    <span className="text-gray-500 ml-1">{seg.arrivalAirport}</span>
                                    {seg.arrivalAirportName && (
                                      <span className="text-gray-400 ml-1 text-xs hidden sm:inline">{seg.arrivalAirportName}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                                  {seg.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(seg.duration)}
                                    </span>
                                  )}
                                  {seg.cabinClass && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">{seg.cabinClass}</span>
                                  )}
                                  {seg.aircraft && (
                                    <span className="text-gray-400">{seg.aircraft}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inbound Segments */}
                  {selectedFlight.inbound && selectedFlight.inbound.segments && selectedFlight.inbound.segments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Plane className="w-4 h-4 text-[#003580] rotate-180" />
                        <span className="font-semibold text-gray-900 text-sm">Return Flight</span>
                        {selectedFlight.inbound.departureDate && (
                          <span className="text-xs text-gray-500">{selectedFlight.inbound.departureDate}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {selectedFlight.inbound.segments.map((seg, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-8 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 border border-gray-100">
                                <Image
                                  src={getAirlineLogo(seg.airlineCode || selectedFlight.airlineCode, seg.airlineLogo)}
                                  alt={seg.airlineName || selectedFlight.airlineName}
                                  width={60}
                                  height={24}
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {seg.flightNumber && (
                                    <span className="font-semibold text-[#003580] text-sm">{seg.flightNumber}</span>
                                  )}
                                  <span className="text-xs text-gray-600">{seg.airlineName || selectedFlight.airlineName}</span>
                                  {seg.operatingCarrier && seg.operatingCarrier !== seg.airlineName && (
                                    <span className="text-[10px] text-gray-400">(Operated by {seg.operatingCarrier})</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <div>
                                    <span className="font-bold text-gray-900">{formatTimeDisplay(seg.departureTime)}</span>
                                    <span className="text-gray-500 ml-1">{seg.departureAirport}</span>
                                    {seg.departureAirportName && (
                                      <span className="text-gray-400 ml-1 text-xs hidden sm:inline">{seg.departureAirportName}</span>
                                    )}
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <span className="font-bold text-gray-900">{formatTimeDisplay(seg.arrivalTime)}</span>
                                    <span className="text-gray-500 ml-1">{seg.arrivalAirport}</span>
                                    {seg.arrivalAirportName && (
                                      <span className="text-gray-400 ml-1 text-xs hidden sm:inline">{seg.arrivalAirportName}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                                  {seg.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(seg.duration)}
                                    </span>
                                  )}
                                  {seg.cabinClass && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">{seg.cabinClass}</span>
                                  )}
                                  {seg.aircraft && (
                                    <span className="text-gray-400">{seg.aircraft}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Baggage Information Panel */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="font-semibold mb-2 flex items-center gap-2 text-gray-900 text-sm">
                      <Briefcase className="w-4 h-4 text-[#003580]" />
                      Baggage Allowance
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-24 text-xs text-gray-500">Cabin baggage</div>
                        <div className={selectedFlight.cabinBaggage && !selectedFlight.cabinBaggage.toLowerCase().includes("no")
                          ? "text-[#008009] font-medium text-xs"
                          : "text-gray-600 text-xs"
                        }>
                          {selectedFlight.cabinBaggage || "1 x Personal item"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 text-xs text-gray-500">Checked baggage</div>
                        <div className={selectedFlight.checkedBaggage && !selectedFlight.checkedBaggage.toLowerCase().includes("no")
                          ? "text-[#008009] font-medium text-xs"
                          : "text-orange-600 text-xs"
                        }>
                          {selectedFlight.checkedBaggage || "Not included - available for purchase"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {(selectedFlight.basePrice || selectedFlight.taxAmount) && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="font-semibold mb-2 text-gray-900 text-sm">Price Breakdown</div>
                      <div className="space-y-1.5 text-sm">
                        {selectedFlight.basePrice && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Flight fare</span>
                            <span className="text-gray-900">{formatPrice(selectedFlight.basePrice, currency)}</span>
                          </div>
                        )}
                        {selectedFlight.taxAmount && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Taxes & fees</span>
                            <span className="text-gray-900">{formatPrice(selectedFlight.taxAmount, currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-1.5 border-t border-gray-200 text-xs">
                          <span className="text-gray-900">Total (return)</span>
                          <span className="text-[#003580]">{formatPrice(selectedFlight.price, currency)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Day-by-Day Itinerary (only for trips 10 days or less) */}
            {itinerary && itinerary.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#003580]" />
                  Suggested Itinerary
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  A day-by-day guide to make the most of your {pkg.nights}-night {pkg.theme || ""} adventure in {pkg.destination}.
                </p>
                <div className="space-y-2">
                  {itinerary.map((day) => (
                    <ItineraryDay
                      key={day.day}
                      day={day.day}
                      title={day.title}
                      description={day.description}
                      highlights={day.highlights}
                      image={day.image}
                      activities={day.activities}
                      currency={currency}
                      selectedActivities={new Set(Object.keys(selectedActivities))}
                      onToggleActivity={toggleActivity}
                      isExpanded={expandedDays.has(day.day)}
                      onToggleExpand={() => toggleDayExpanded(day.day)}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 italic">
                  This is a suggested itinerary. Our travel experts can customize your trip to match your interests and pace.
                </p>
              </div>
            )}

            {/* 5. Package Summary / What's Included */}
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

            {/* 6. Things to Do - Activities Section */}
            <ActivitiesSection
              destination={pkg.destination}
              currency={currency}
              selectedActivities={selectedActivities}
              onToggleActivity={toggleActivity}
              maxItems={8}
            />

            {/* 7. Personalise Your Trip CTA */}
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
                    <span className="font-medium">
                      {hasLivePricing
                        ? formatPrice(displayFlightPrice, currency)
                        : <span className="text-xs text-gray-400 italic">Call for pricing</span>
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Building className="h-3.5 w-3.5 inline mr-1" />
                      Hotel ({pkg.nights} nights)
                    </span>
                    <span className="font-medium">
                      {hasLivePricing
                        ? formatPrice(displayHotelPrice, currency)
                        : <span className="text-xs text-gray-400 italic">Call for pricing</span>
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 ml-5">
                      <Coffee className="h-3 w-3 inline mr-1" />
                      {selectedBoardType}
                    </span>
                    <span className="text-gray-500">
                      {boardTypeModifier > 0 ? `+${boardTypeModifier}%` : "included"}
                    </span>
                  </div>
                </div>

                {/* Selected activities */}
                {Object.keys(selectedActivities).length > 0 && (
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Compass className="h-3 w-3" />
                      Things to Do ({Object.keys(selectedActivities).length})
                    </div>
                    <div className="space-y-1">
                      {Object.entries(selectedActivities).map(([id, price], idx) => (
                        <div key={id} className="flex justify-between text-xs">
                          <span className="text-orange-600 truncate pr-2">
                            Activity {idx + 1}
                          </span>
                          <span className="font-medium text-orange-600 flex-shrink-0">
                            +{formatPrice(price, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 mt-3 pt-3">
                  {displayTotal !== null && displayPerPerson !== null ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-600">Total package</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatPrice(displayTotal, currency)}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {formatPrice(displayPerPerson, currency)} per person
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Call for pricing
                      </div>
                      <a
                        href="tel:+442089444555"
                        className="text-[#003580] font-bold text-lg hover:underline"
                      >
                        020 8944 4555
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        Prices subject to live availability
                      </p>
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
