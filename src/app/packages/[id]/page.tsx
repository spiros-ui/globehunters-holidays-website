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

// Airline options for flight selection
interface AirlineOption {
  code: string;
  name: string;
  logo: string;
  priceModifier: number; // Percentage price change from base
  stops: number;
  outboundDepartureTime: string;
  outboundArrivalTime: string;
  inboundDepartureTime: string;
  inboundArrivalTime: string;
  cabinBaggage: string;
  checkedBaggage: string;
}

const AIRLINE_OPTIONS: AirlineOption[] = [
  {
    code: "BA",
    name: "British Airways",
    logo: "https://pics.avs.io/400/160/BA.png",
    priceModifier: 0,
    stops: 0,
    outboundDepartureTime: "09:00",
    outboundArrivalTime: "12:30",
    inboundDepartureTime: "14:00",
    inboundArrivalTime: "17:30",
    cabinBaggage: "1 x 23kg",
    checkedBaggage: "1 x 23kg",
  },
  {
    code: "EK",
    name: "Emirates",
    logo: "https://pics.avs.io/400/160/EK.png",
    priceModifier: 15, // 15% more expensive
    stops: 1,
    outboundDepartureTime: "07:30",
    outboundArrivalTime: "18:45",
    inboundDepartureTime: "21:00",
    inboundArrivalTime: "06:30",
    cabinBaggage: "1 x 7kg",
    checkedBaggage: "2 x 23kg",
  },
  {
    code: "QR",
    name: "Qatar Airways",
    logo: "https://pics.avs.io/400/160/QR.png",
    priceModifier: 10, // 10% more expensive
    stops: 1,
    outboundDepartureTime: "08:00",
    outboundArrivalTime: "17:30",
    inboundDepartureTime: "22:30",
    inboundArrivalTime: "07:15",
    cabinBaggage: "1 x 7kg",
    checkedBaggage: "2 x 23kg",
  },
  {
    code: "TK",
    name: "Turkish Airlines",
    logo: "https://pics.avs.io/400/160/TK.png",
    priceModifier: -5, // 5% cheaper
    stops: 1,
    outboundDepartureTime: "06:30",
    outboundArrivalTime: "16:00",
    inboundDepartureTime: "19:30",
    inboundArrivalTime: "23:45",
    cabinBaggage: "1 x 8kg",
    checkedBaggage: "1 x 23kg",
  },
];

// Board type options with price modifiers
type BoardType = "Room Only" | "Bed & Breakfast" | "Half Board" | "All Inclusive";

interface BoardOption {
  id: string;
  type: BoardType;
  description: string;
  priceModifier: number; // Percentage modifier on hotel price
}

const BOARD_OPTIONS: BoardOption[] = [
  {
    id: "room-only",
    type: "Room Only",
    description: "Accommodation only",
    priceModifier: 0,
  },
  {
    id: "bb",
    type: "Bed & Breakfast",
    description: "Breakfast included daily",
    priceModifier: 15,
  },
  {
    id: "hb",
    type: "Half Board",
    description: "Breakfast & dinner included",
    priceModifier: 35,
  },
  {
    id: "ai",
    type: "All Inclusive",
    description: "All meals & selected drinks",
    priceModifier: 60,
  },
];

// Hotel options configuration - generates 4 hotel choices per destination
interface HotelOption {
  id: string;
  tier: "budget" | "standard" | "deluxe" | "luxury";
  namePrefix: string;
  nameSuffix: string;
  stars: number;
  defaultBoardType: BoardType;
  priceModifier: number; // Percentage modifier on base hotel price
  roomType: string;
  highlights: string[];
}

const HOTEL_TIER_OPTIONS: HotelOption[] = [
  {
    id: "budget",
    tier: "budget",
    namePrefix: "",
    nameSuffix: "City Hotel",
    stars: 3,
    defaultBoardType: "Room Only",
    priceModifier: -30, // 30% cheaper
    roomType: "Standard Room",
    highlights: ["Great location", "Free WiFi", "24-hour reception"],
  },
  {
    id: "standard",
    tier: "standard",
    namePrefix: "",
    nameSuffix: "Premium Resort",
    stars: 4,
    defaultBoardType: "Bed & Breakfast",
    priceModifier: 0, // Base price
    roomType: "Superior Room",
    highlights: ["Swimming pool", "Spa", "Restaurant", "Fitness centre"],
  },
  {
    id: "deluxe",
    tier: "deluxe",
    namePrefix: "",
    nameSuffix: "Grand Palace",
    stars: 5,
    defaultBoardType: "Half Board",
    priceModifier: 40, // 40% more expensive
    roomType: "Deluxe Suite",
    highlights: ["Butler service", "Premium dining", "Exclusive lounge", "Spa treatments"],
  },
  {
    id: "luxury",
    tier: "luxury",
    namePrefix: "The",
    nameSuffix: "Royal Collection",
    stars: 5,
    defaultBoardType: "All Inclusive",
    priceModifier: 90, // 90% more expensive
    roomType: "Presidential Suite",
    highlights: ["Private beach", "Michelin dining", "Chauffeur service", "VIP experiences"],
  },
];

// Comprehensive hotel details - Booking.com style data
interface ComprehensiveHotelDetails {
  propertyHighlights: string[];
  propertyDescription: string[];
  mostPopularFacilities: string[];
  roomAmenities: string[];
  bathroomAmenities: string[];
  viewOptions: string[];
  foodAndDrink: {
    restaurants: number;
    bars: number;
    roomService: string;
    breakfastOptions: string[];
  };
  internet: {
    type: string;
    availability: string;
    cost: string;
  };
  parking: {
    available: boolean;
    type: string;
    cost: string;
    valet: boolean;
  };
  services: string[];
  generalFacilities: string[];
  languagesSpoken: string[];
  houseRules: {
    checkIn: string;
    checkOut: string;
    childrenPolicy: string;
    petsPolicy: string;
    partiesPolicy: string;
  };
  finePrint: string[];
}

// Tier-based comprehensive hotel details
const TIER_HOTEL_DETAILS: Record<string, ComprehensiveHotelDetails> = {
  budget: {
    propertyHighlights: [
      "City centre location",
      "Free WiFi throughout",
      "24-hour front desk",
      "Budget-friendly rates"
    ],
    propertyDescription: [
      "This well-located city hotel offers comfortable accommodation at great value. Perfect for travellers who want to explore the destination without breaking the bank.",
      "The property features modern rooms with essential amenities, making it an ideal base for sightseeing. Guests appreciate the convenient location near public transport and local attractions."
    ],
    mostPopularFacilities: [
      "Free WiFi", "24-hour front desk", "Non-smoking rooms", "Lift", "Heating", "Air conditioning", "Daily housekeeping", "Luggage storage"
    ],
    roomAmenities: [
      "Air conditioning", "Flat-screen TV", "Telephone", "Desk", "Wardrobe", "Linens"
    ],
    bathroomAmenities: [
      "Private bathroom", "Shower", "Free toiletries", "Hairdryer"
    ],
    viewOptions: ["City view"],
    foodAndDrink: {
      restaurants: 0,
      bars: 0,
      roomService: "Not available",
      breakfastOptions: ["Continental breakfast available for extra charge"]
    },
    internet: {
      type: "WiFi",
      availability: "Available in all areas",
      cost: "Free"
    },
    parking: {
      available: false,
      type: "Not available on-site",
      cost: "Public parking nearby",
      valet: false
    },
    services: [
      "24-hour front desk", "Luggage storage", "Express check-in/check-out", "Tour desk", "Ticket service"
    ],
    generalFacilities: [
      "Air conditioning", "Heating", "Lift", "Non-smoking throughout", "Family rooms"
    ],
    languagesSpoken: ["English", "Local language"],
    houseRules: {
      checkIn: "2:00 PM - 11:00 PM",
      checkOut: "Until 11:00 AM",
      childrenPolicy: "Children of all ages are welcome",
      petsPolicy: "Pets are not allowed",
      partiesPolicy: "Parties/events are not allowed"
    },
    finePrint: [
      "Valid ID required at check-in",
      "Credit card required for incidentals"
    ]
  },
  standard: {
    propertyHighlights: [
      "Swimming pool",
      "Spa and wellness centre",
      "Multiple restaurants",
      "Fitness centre",
      "Free WiFi"
    ],
    propertyDescription: [
      "This premium resort offers the perfect blend of comfort and convenience for discerning travellers. With its excellent facilities and attentive service, guests can expect a memorable stay.",
      "The property features beautifully appointed rooms, a refreshing swimming pool, rejuvenating spa, and multiple dining options. The central location provides easy access to major attractions and shopping areas.",
      "Whether you're here for business or leisure, the resort caters to all your needs with professional service and modern amenities."
    ],
    mostPopularFacilities: [
      "Swimming pool", "Spa", "Fitness centre", "Restaurant", "Bar", "Free WiFi", "Room service", "Airport shuttle", "Non-smoking rooms", "Family rooms", "Business centre", "Concierge"
    ],
    roomAmenities: [
      "Air conditioning", "Flat-screen TV", "Minibar", "Safe", "Tea/coffee maker", "Desk", "Seating area", "Wardrobe", "Blackout curtains", "Iron"
    ],
    bathroomAmenities: [
      "Private bathroom", "Shower", "Bathtub", "Free toiletries", "Hairdryer", "Bathrobes", "Slippers"
    ],
    viewOptions: ["Pool view", "City view", "Garden view"],
    foodAndDrink: {
      restaurants: 2,
      bars: 1,
      roomService: "Available (6:00 AM - 11:00 PM)",
      breakfastOptions: ["Continental", "Full English", "Buffet"]
    },
    internet: {
      type: "WiFi",
      availability: "Available in all areas",
      cost: "Free"
    },
    parking: {
      available: true,
      type: "Private parking on-site",
      cost: "Charges may apply",
      valet: false
    },
    services: [
      "24-hour front desk", "Concierge service", "Currency exchange", "Luggage storage", "Laundry/Dry cleaning", "Express check-in/check-out", "Tour desk", "Ticket service", "Shuttle service"
    ],
    generalFacilities: [
      "Air conditioning", "Heating", "Lift", "Non-smoking throughout", "Designated smoking area", "Family rooms", "Facilities for disabled guests", "Soundproof rooms"
    ],
    languagesSpoken: ["English", "Spanish", "French", "Local language"],
    houseRules: {
      checkIn: "3:00 PM - 12:00 AM",
      checkOut: "Until 12:00 PM",
      childrenPolicy: "Children of all ages are welcome. Children 12 and under stay free with existing bedding.",
      petsPolicy: "Pets are not allowed",
      partiesPolicy: "Parties/events are not allowed in guest rooms"
    },
    finePrint: [
      "Credit card required at check-in",
      "Security deposit of equivalent to 1 night stay required",
      "Photo ID required at check-in",
      "Late check-out available upon request (charges may apply)"
    ]
  },
  deluxe: {
    propertyHighlights: [
      "Luxury beachfront location",
      "World-class spa",
      "Michelin-quality dining",
      "Butler service available",
      "Executive lounge access",
      "Complimentary airport transfers"
    ],
    propertyDescription: [
      "This stunning 5-star property redefines luxury hospitality with its impeccable service, world-class amenities, and breathtaking location. Every detail has been crafted to provide an unforgettable experience.",
      "The resort features elegantly designed suites with premium furnishings, state-of-the-art technology, and stunning views. Guests can indulge in the award-winning spa, savour exquisite cuisine at multiple restaurants, and enjoy exclusive access to premium facilities.",
      "The attentive staff anticipates every need, ensuring a seamless and memorable stay. Whether celebrating a special occasion or seeking the ultimate relaxation, this property delivers excellence in every aspect."
    ],
    mostPopularFacilities: [
      "Infinity pool", "Private beach", "Full-service spa", "Multiple restaurants", "Cocktail bars", "24-hour room service", "Fitness centre with personal trainers", "Tennis courts", "Water sports", "Kids club", "Business centre", "Concierge", "Airport shuttle", "Valet parking"
    ],
    roomAmenities: [
      "Air conditioning", "65-inch Smart TV", "Nespresso machine", "Fully stocked minibar", "In-room safe", "Bose sound system", "Premium bedding", "Pillow menu", "Balcony/Terrace", "Work desk", "Seating area", "Walk-in wardrobe", "Blackout curtains", "Twice-daily housekeeping"
    ],
    bathroomAmenities: [
      "Marble bathroom", "Walk-in rain shower", "Soaking tub", "Dual vanity", "Luxury toiletries (Bvlgari/Hermes)", "Hairdryer", "Magnifying mirror", "Bathrobes", "Premium slippers", "Heated floors"
    ],
    viewOptions: ["Ocean view", "Pool view", "Garden view", "Sunset view"],
    foodAndDrink: {
      restaurants: 4,
      bars: 2,
      roomService: "24-hour room service",
      breakfastOptions: ["A la carte", "Continental", "Full English", "Champagne buffet", "In-room breakfast"]
    },
    internet: {
      type: "High-speed WiFi",
      availability: "Complimentary throughout property",
      cost: "Free"
    },
    parking: {
      available: true,
      type: "Private underground parking",
      cost: "Free for guests",
      valet: true
    },
    services: [
      "24-hour front desk", "24-hour concierge", "Butler service", "Personal shopping assistant", "Currency exchange", "Luggage storage", "Premium laundry/Dry cleaning", "Express check-in/check-out", "Dedicated tour desk", "Limousine service", "Airport transfers", "In-room dining", "Childcare services"
    ],
    generalFacilities: [
      "Climate control throughout", "High-speed lifts", "Non-smoking property", "Designated cigar lounge", "Executive lounge", "Premium family suites", "Wheelchair accessible", "Soundproof rooms", "Private beach cabanas", "Rooftop terrace"
    ],
    languagesSpoken: ["English", "Arabic", "French", "German", "Spanish", "Italian", "Russian", "Mandarin", "Japanese"],
    houseRules: {
      checkIn: "2:00 PM onwards (early check-in available)",
      checkOut: "Until 12:00 PM (late check-out until 4:00 PM complimentary)",
      childrenPolicy: "Children of all ages welcome. Kids club available for ages 4-12. Babysitting available.",
      petsPolicy: "Small pets allowed upon request (charges apply)",
      partiesPolicy: "Private events can be arranged in designated areas"
    },
    finePrint: [
      "Credit card required at check-in for incidentals",
      "Dress code applies in certain restaurants after 7 PM",
      "Complimentary upgrade subject to availability",
      "Spa reservations recommended 24 hours in advance"
    ]
  },
  luxury: {
    propertyHighlights: [
      "Private island/exclusive location",
      "Personal butler 24/7",
      "Michelin-starred restaurants",
      "Private beach and yacht",
      "Helicopter transfers available",
      "Bespoke experiences"
    ],
    propertyDescription: [
      "Welcome to the pinnacle of luxury hospitality. This exclusive property offers an unparalleled level of service, privacy, and refinement that caters to the most discerning guests from around the world.",
      "Each residence is a masterpiece of design, featuring the finest materials, cutting-edge technology, and breathtaking views. Your personal butler ensures every desire is anticipated and fulfilled, from arranging private dining experiences to organising exclusive excursions.",
      "The culinary journey here is extraordinary, with Michelin-starred chefs creating bespoke menus featuring the finest ingredients. The spa offers transformative treatments using rare and precious ingredients, while the private beach and yacht provide ultimate relaxation.",
      "This is not just accommodation - it's a transformative experience where dreams become reality and memories last a lifetime."
    ],
    mostPopularFacilities: [
      "Private infinity pool", "Private beach access", "Award-winning spa", "Michelin-starred restaurant", "Champagne bar", "24-hour butler service", "Personal trainer", "Private yacht charter", "Helicopter pad", "Private cinema", "Wine cellar", "Cigar lounge", "Golf course access", "Kids club with nannies"
    ],
    roomAmenities: [
      "Individual climate zones", "85-inch OLED TV", "Bang & Olufsen sound system", "Premium wine fridge", "Full kitchen/kitchenette", "Private infinity pool/plunge pool", "Outdoor dining area", "Private garden/terrace", "Custom bedding (800+ thread count)", "Pillow menu", "In-suite bar", "Grand piano (select suites)", "Library", "Office with Zoom room"
    ],
    bathroomAmenities: [
      "Spa-like bathroom", "Rainfall and handheld shower", "Freestanding soaking tub", "Steam room/sauna", "Double vanity with TV mirror", "Exclusive designer toiletries (La Mer/Tom Ford)", "Dyson hairdryer", "Lighted magnifying mirror", "Plush robes and slippers", "Heated marble floors", "Private treatment room"
    ],
    viewOptions: ["Panoramic ocean view", "Sunset view", "Private garden view", "Lagoon view"],
    foodAndDrink: {
      restaurants: 5,
      bars: 3,
      roomService: "24-hour private chef available",
      breakfastOptions: ["Bespoke in-villa breakfast", "Champagne breakfast", "Floating breakfast", "Private beach breakfast", "Any cuisine on request"]
    },
    internet: {
      type: "Premium high-speed WiFi",
      availability: "Complimentary throughout with dedicated bandwidth",
      cost: "Free"
    },
    parking: {
      available: true,
      type: "Private garage",
      cost: "Complimentary",
      valet: true
    },
    services: [
      "24-hour butler service", "Personal concierge", "Private chef on request", "Personal shopper", "Yacht charter desk", "Helicopter transfers", "Private jet arrangements", "Premium laundry with 2-hour service", "In-villa spa treatments", "Personal trainer", "Golf caddy", "Childcare and tutoring", "Pet concierge", "Event planning"
    ],
    generalFacilities: [
      "Climate controlled throughout", "Private lift access", "Non-smoking property", "Private cigar lounge", "Members-only beach club", "Exclusive golf course", "Private cinema", "Art gallery", "Wellness centre", "Meditation pavilion", "Private marina", "Helipad"
    ],
    languagesSpoken: ["English", "Arabic", "French", "German", "Spanish", "Italian", "Russian", "Mandarin", "Japanese", "Portuguese", "Hindi"],
    houseRules: {
      checkIn: "Flexible - staff available 24/7",
      checkOut: "Flexible - complimentary late check-out",
      childrenPolicy: "Children welcome with dedicated kids' programme. Private nannies available 24/7.",
      petsPolicy: "Pets welcome with dedicated pet concierge and amenities",
      partiesPolicy: "Private celebrations can be arranged anywhere on property"
    },
    finePrint: [
      "Advance booking recommended for peak seasons",
      "Private experiences require 48-hour notice for optimal arrangement",
      "Personal preferences communicated in advance ensure bespoke experience",
      "All rates include taxes, service charges, and most amenities"
    ]
  }
};

// Get comprehensive hotel details by tier
function getComprehensiveHotelDetails(tier: string): ComprehensiveHotelDetails {
  return TIER_HOTEL_DETAILS[tier] || TIER_HOTEL_DETAILS.standard;
}

// Destination-specific hotel names for more realistic options
const DESTINATION_HOTEL_NAMES: Record<string, { budget: string; standard: string; deluxe: string; luxury: string }> = {
  dubai: {
    budget: "Dubai City Inn",
    standard: "Dubai Marina Resort",
    deluxe: "Jumeirah Emirates Towers",
    luxury: "Burj Al Arab Jumeirah",
  },
  paris: {
    budget: "Hotel Belleville",
    standard: "Mercure Paris Montmartre",
    deluxe: "Sofitel Paris Le Faubourg",
    luxury: "Four Seasons George V",
  },
  bali: {
    budget: "Bali Garden Hotel",
    standard: "Padma Resort Legian",
    deluxe: "The Mulia Bali",
    luxury: "COMO Shambhala Estate",
  },
  bangkok: {
    budget: "Bangkok City Hotel",
    standard: "Anantara Riverside Bangkok",
    deluxe: "Mandarin Oriental Bangkok",
    luxury: "The Peninsula Bangkok",
  },
  maldives: {
    budget: "Adaaran Select Hudhuranfushi",
    standard: "Sun Island Resort & Spa",
    deluxe: "Conrad Maldives Rangali Island",
    luxury: "Soneva Fushi",
  },
  london: {
    budget: "Premier Inn London City",
    standard: "DoubleTree by Hilton Tower of London",
    deluxe: "The Savoy",
    luxury: "The Ritz London",
  },
  rome: {
    budget: "Hotel Quirinale",
    standard: "Hotel Artemide",
    deluxe: "Rome Cavalieri",
    luxury: "Hotel de Russie",
  },
  tokyo: {
    budget: "Hotel Gracery Shinjuku",
    standard: "The Prince Park Tower Tokyo",
    deluxe: "The Peninsula Tokyo",
    luxury: "Aman Tokyo",
  },
  singapore: {
    budget: "Hotel Boss",
    standard: "Pan Pacific Singapore",
    deluxe: "Marina Bay Sands",
    luxury: "Raffles Hotel Singapore",
  },
  barcelona: {
    budget: "Hotel Rialto",
    standard: "H10 Marina Barcelona",
    deluxe: "Hotel Arts Barcelona",
    luxury: "El Palace Barcelona",
  },
  santorini: {
    budget: "Santorini Palace",
    standard: "Athina Luxury Suites",
    deluxe: "Grace Santorini",
    luxury: "Canaves Oia Suites",
  },
  amsterdam: {
    budget: "Hotel Casa Amsterdam",
    standard: "NH Amsterdam Centre",
    deluxe: "Waldorf Astoria Amsterdam",
    luxury: "Hotel TwentySeven",
  },
};

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

    return {
      id: `hotel-${option.id}`,
      name: hotelName,
      starRating: option.stars,
      address: baseHotel.address || `${destination} City Centre`,
      mainImage: baseHotel.mainImage,
      images: baseHotel.images,
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

// Destination hero images - high-quality Unsplash images showcasing iconic views
const DESTINATION_HERO_IMAGES: Record<string, string> = {
  "Dubai": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=800&fit=crop&q=80",
  "Maldives": "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&h=800&fit=crop&q=80",
  "Bali": "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=800&fit=crop&q=80",
  "Bangkok": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&h=800&fit=crop&q=80",
  "Bangkok & Phuket": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1200&h=800&fit=crop&q=80",
  "Paris": "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop&q=80",
  "Rome": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&h=800&fit=crop&q=80",
  "Barcelona": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200&h=800&fit=crop&q=80",
  "Santorini": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=800&fit=crop&q=80",
  "London": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&h=800&fit=crop&q=80",
  "New York": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=800&fit=crop&q=80",
  "Tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=800&fit=crop&q=80",
  "Singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=800&fit=crop&q=80",
  "Amsterdam": "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&h=800&fit=crop&q=80",
  "Hong Kong": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&h=800&fit=crop&q=80",
  "Cairo": "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&h=800&fit=crop&q=80",
  "Cairo & Luxor": "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=1200&h=800&fit=crop&q=80",
  "Phuket": "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&h=800&fit=crop&q=80",
  "Venice": "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&h=800&fit=crop&q=80",
  "Lisbon": "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=800&fit=crop&q=80",
  "Prague": "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&h=800&fit=crop&q=80",
  "Vienna": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200&h=800&fit=crop&q=80",
  "Milan": "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=1200&h=800&fit=crop&q=80",
  "Madrid": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&h=800&fit=crop&q=80",
  "Athens": "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&h=800&fit=crop&q=80",
  "Miami": "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=1200&h=800&fit=crop&q=80",
  "Los Angeles": "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1200&h=800&fit=crop&q=80",
  "Cancun": "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=1200&h=800&fit=crop&q=80",
  "Marrakech": "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&h=800&fit=crop&q=80",
  "Cape Town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&h=800&fit=crop&q=80",
  "Sydney": "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&h=800&fit=crop&q=80",
  "Melbourne": "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=1200&h=800&fit=crop&q=80",
  "Abu Dhabi": "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1200&h=800&fit=crop&q=80",
  "Kyoto": "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&h=800&fit=crop&q=80",
  "Seoul": "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=1200&h=800&fit=crop&q=80",
  "Kuala Lumpur": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&h=800&fit=crop&q=80",
  "Vietnam": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop&q=80",
  "Vietnam Explorer": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&h=800&fit=crop&q=80",
  "Florence": "https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=1200&h=800&fit=crop&q=80",
  "Dublin": "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&h=800&fit=crop&q=80",
  "Edinburgh": "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=1200&h=800&fit=crop&q=80",
  "Budapest": "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=1200&h=800&fit=crop&q=80",
  "Nice": "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&h=800&fit=crop&q=80",
  "Nice & French Riviera": "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&h=800&fit=crop&q=80",
  "Mauritius": "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=1200&h=800&fit=crop&q=80",
  "Sri Lanka": "https://images.unsplash.com/photo-1586901533048-0e856dff2c0d?w=1200&h=800&fit=crop&q=80",
  "Sicily": "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&h=800&fit=crop&q=80",
  "Iceland": "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=1200&h=800&fit=crop&q=80",
  "Zanzibar": "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=1200&h=800&fit=crop&q=80",
  "Jordan": "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&h=800&fit=crop&q=80",
  "Croatia": "https://images.unsplash.com/photo-1555990793-da11153b2473?w=1200&h=800&fit=crop&q=80",
  "Costa Rica": "https://images.unsplash.com/photo-1518182170546-07661fd94144?w=1200&h=800&fit=crop&q=80",
  "Peru": "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&h=800&fit=crop&q=80",
  "New Zealand": "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&h=800&fit=crop&q=80",
};

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

// Destination descriptions for package details
const DESTINATION_DESCRIPTIONS: Record<string, {
  about: string;
  highlights: string[];
  bestFor: string[];
}> = {
  paris: {
    about: "Paris, the City of Light, captivates visitors with its timeless elegance, world-renowned art museums, and romantic atmosphere. From the iconic Eiffel Tower to the charming cobblestone streets of Montmartre, every corner reveals architectural beauty and cultural richness. The city's legendary cafes, patisseries, and Michelin-starred restaurants make it a culinary paradise.",
    highlights: ["Eiffel Tower & Trocadero Gardens", "Louvre Museum & Mona Lisa", "Champs-Elysees & Arc de Triomphe", "Notre-Dame Cathedral", "Montmartre & Sacre-Coeur", "Seine River Cruises"],
    bestFor: ["Romantic getaways", "Art & culture lovers", "Food enthusiasts", "History buffs"],
  },
  dubai: {
    about: "Dubai is a dazzling metropolis where futuristic architecture meets Arabian heritage. Home to the world's tallest building, luxury shopping malls, and pristine beaches, this desert city offers an extraordinary blend of opulence and adventure. Experience thrilling desert safaris, world-class dining, and unparalleled hospitality.",
    highlights: ["Burj Khalifa observation deck", "Dubai Mall & Dubai Fountain", "Palm Jumeirah & Atlantis", "Desert safari experiences", "Gold & Spice Souks", "Dubai Marina"],
    bestFor: ["Luxury seekers", "Adventure enthusiasts", "Shopping lovers", "Family holidays"],
  },
  bali: {
    about: "Bali, the Island of the Gods, enchants travelers with its spiritual temples, lush rice terraces, and stunning beaches. This Indonesian paradise offers a perfect blend of relaxation and adventure, from tranquil yoga retreats to thrilling water sports. The warm Balinese hospitality and rich cultural traditions create an unforgettable experience.",
    highlights: ["Ubud rice terraces & temples", "Seminyak beach clubs", "Mount Batur sunrise trek", "Tanah Lot sea temple", "Traditional Balinese spa", "Nusa Penida island"],
    bestFor: ["Wellness retreats", "Nature lovers", "Adventure seekers", "Honeymoons"],
  },
  bangkok: {
    about: "Bangkok is a vibrant metropolis where ancient temples stand alongside modern skyscrapers. Thailand's capital city pulses with energy, offering incredible street food, ornate Buddhist shrines, and bustling night markets. Experience the perfect blend of traditional Thai culture and contemporary urban life.",
    highlights: ["Grand Palace & Wat Pho", "Floating markets", "Chatuchak Weekend Market", "Rooftop sky bars", "Thai cooking classes", "Chao Phraya River temples"],
    bestFor: ["Food lovers", "Culture enthusiasts", "Budget travelers", "Nightlife seekers"],
  },
  maldives: {
    about: "The Maldives is a tropical paradise of crystal-clear waters, pristine white sand beaches, and luxurious overwater villas. This Indian Ocean archipelago offers unparalleled opportunities for snorkeling, diving, and relaxation. Experience world-class resorts, stunning marine life, and breathtaking sunsets in this ultimate escape.",
    highlights: ["Overwater villa experience", "Snorkeling with manta rays", "Sunset dolphin cruises", "Private island dining", "Underwater restaurants", "Spa treatments"],
    bestFor: ["Honeymoons", "Luxury travelers", "Beach lovers", "Diving enthusiasts"],
  },
  london: {
    about: "London combines centuries of history with cutting-edge modernity. From the Tower of London to the Tate Modern, from traditional pubs to Michelin-starred restaurants, the city offers endless discoveries. World-class theatre, royal palaces, and diverse neighborhoods make every visit unique.",
    highlights: ["Tower of London & Crown Jewels", "Buckingham Palace", "British Museum", "West End theatre", "Borough Market", "Camden Town"],
    bestFor: ["History enthusiasts", "Theatre lovers", "Foodies", "Shopping"],
  },
  rome: {
    about: "Rome, the Eternal City, is an open-air museum of ancient wonders and Renaissance masterpieces. Walk in the footsteps of emperors at the Colosseum, toss a coin in the Trevi Fountain, and savor authentic Italian cuisine. Every street reveals layers of history spanning nearly 3,000 years.",
    highlights: ["Colosseum & Roman Forum", "Vatican City & Sistine Chapel", "Trevi Fountain", "Spanish Steps", "Trastevere neighborhood", "Authentic Roman cuisine"],
    bestFor: ["History lovers", "Art enthusiasts", "Food lovers", "Romantic trips"],
  },
  tokyo: {
    about: "Tokyo is a mesmerizing blend of ultra-modern innovation and ancient traditions. Neon-lit streets give way to serene temples, while cutting-edge technology coexists with centuries-old customs. Experience world-class cuisine, unique pop culture, and the renowned Japanese hospitality.",
    highlights: ["Shibuya Crossing", "Senso-ji Temple", "Tsukiji Fish Market", "Harajuku fashion district", "Mount Fuji day trips", "Robot restaurants"],
    bestFor: ["Tech enthusiasts", "Food lovers", "Culture seekers", "Anime fans"],
  },
  singapore: {
    about: "Singapore is a gleaming city-state where diverse cultures blend seamlessly with futuristic architecture. Gardens by the Bay's Supertrees, world-class hawker centers, and the iconic Marina Bay Sands define this clean, safe, and endlessly fascinating destination.",
    highlights: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Hawker food centres", "Orchard Road shopping", "Night Safari"],
    bestFor: ["Family holidays", "Food enthusiasts", "Urban explorers", "Shopping lovers"],
  },
  new_york: {
    about: "New York City, the city that never sleeps, offers an unrivaled urban experience. From the bright lights of Times Square to the tranquility of Central Park, from world-class museums to Broadway shows, NYC delivers excitement at every turn. Experience diverse neighborhoods, iconic landmarks, and legendary dining.",
    highlights: ["Statue of Liberty", "Central Park", "Empire State Building", "Broadway shows", "Metropolitan Museum", "Brooklyn Bridge"],
    bestFor: ["Culture lovers", "Foodies", "Shopping enthusiasts", "Entertainment seekers"],
  },
};

// Theme-based selling descriptions - compelling copy to sell the experience
const THEME_SELLING_POINTS: Record<string, {
  headline: string;
  description: string;
  sellingPoints: string[];
}> = {
  cultural: {
    headline: "Discover the Soul of {destination}",
    description: "This isn't just sightseeing — it's a journey into the heart of {destination}'s rich heritage. Walk through centuries of history, taste authentic flavors passed down through generations, and connect with traditions that have shaped this remarkable destination. Every moment becomes a story to tell.",
    sellingPoints: ["Expert local guides who share hidden stories", "Authentic experiences beyond the tourist trail", "Traditional cuisine and local markets", "Historic landmarks and UNESCO sites"],
  },
  adventure: {
    headline: "Unleash Your Adventurous Spirit in {destination}",
    description: "Feel the rush of adrenaline as you explore {destination}'s most thrilling landscapes. This package is designed for those who believe holidays should be filled with excitement, new challenges, and the kind of experiences that make your heart race. Come home with incredible stories and unforgettable memories.",
    sellingPoints: ["Carefully selected adventure activities", "Professional guides ensuring safety and fun", "Stunning natural landscapes", "Perfect mix of thrills and relaxation"],
  },
  romantic: {
    headline: "Fall in Love (Again) in {destination}",
    description: "Whether you're celebrating a honeymoon, anniversary, or simply your love for each other, {destination} provides the perfect backdrop for romance. Imagine sunset dinners, intimate experiences, and moments designed to bring you closer together. This is the escape you've been dreaming of.",
    sellingPoints: ["Romantic accommodations and settings", "Couples' experiences and private moments", "Sunset views and starlit dinners", "Memories to cherish forever"],
  },
  family: {
    headline: "Create Magical Family Memories in {destination}",
    description: "The best family holidays are those where everyone — from toddlers to grandparents — has the time of their lives. {destination} offers the perfect blend of excitement for the kids, relaxation for the parents, and shared experiences that bring your family closer together.",
    sellingPoints: ["Kid-friendly activities and attractions", "Family-friendly hotels with amenities", "Safe and welcoming environment", "Something for every age group"],
  },
  luxury: {
    headline: "Experience {destination} in Ultimate Style",
    description: "You deserve the finest that {destination} has to offer. From premium accommodations to exclusive experiences, every detail of this package has been crafted for discerning travelers who appreciate quality. Expect nothing less than exceptional service and unforgettable luxury.",
    sellingPoints: ["Premium 5-star accommodations", "VIP access and skip-the-line experiences", "Fine dining and exclusive venues", "Personalized service throughout"],
  },
  relaxation: {
    headline: "Escape, Unwind & Rejuvenate in {destination}",
    description: "Leave your stress behind and surrender to the tranquil beauty of {destination}. This package is your permission to slow down, breathe deeply, and focus on what matters — your wellbeing. Return home feeling refreshed, restored, and ready to take on the world.",
    sellingPoints: ["Serene spa treatments and wellness", "Peaceful surroundings and beautiful views", "Time to truly disconnect and relax", "Rejuvenating experiences for body and mind"],
  },
  beach: {
    headline: "Your Perfect Beach Escape to {destination}",
    description: "Picture yourself on pristine white sand, the turquoise water stretching to the horizon, a gentle breeze keeping you cool. {destination}'s beaches are waiting to deliver the ultimate sun-soaked holiday. Dive in, relax, and let the ocean wash your worries away.",
    sellingPoints: ["Stunning beach locations", "Water activities and snorkeling", "Beachfront or beach-access hotels", "Perfect balance of sun and exploration"],
  },
  city: {
    headline: "Discover the Vibrant Energy of {destination}",
    description: "Feel the pulse of {destination}'s dynamic urban landscape. From world-class restaurants to iconic landmarks, buzzing nightlife to hidden gems, this city break delivers excitement at every turn. Immerse yourself in the culture, cuisine, and character that makes {destination} unforgettable.",
    sellingPoints: ["Iconic landmarks and attractions", "World-class dining and nightlife", "Shopping and entertainment", "Convenient central locations"],
  },
};

// Legacy theme descriptions for fallback
const THEME_DESCRIPTIONS: Record<string, string> = {
  cultural: "Immerse yourself in local traditions, historic landmarks, and authentic experiences that reveal the soul of your destination.",
  adventure: "Push your boundaries with thrilling activities and exciting excursions that create unforgettable memories.",
  romantic: "Create magical moments together in beautiful settings designed for couples seeking connection and intimacy.",
  family: "Enjoy quality time with activities and accommodations perfect for travelers of all ages.",
  luxury: "Indulge in premium experiences, five-star service, and exclusive access to the finest your destination offers.",
  relaxation: "Unwind in tranquil settings with spa treatments, beautiful beaches, and a pace designed for restoration.",
  beach: "Sink your toes in pristine sand, swim in crystal waters, and enjoy the perfect coastal escape.",
  city: "Explore vibrant urban landscapes, world-class dining, and the energy of metropolitan life.",
};

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

// Destination-specific day themes
const DESTINATION_DAY_THEMES: Record<string, Array<{ title: string; desc: string; schedule: string[]; image: string }>> = {
  paris: [
    { title: "Arrival & Champs-Elysees", desc: "Arrive and discover the world's most famous avenue", schedule: ["Airport transfer to hotel", "Hotel check-in and refresh", "Evening stroll along Champs-Elysees", "Dinner at a classic Parisian brasserie"], image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop&q=80" },
    { title: "Louvre & Seine", desc: "Explore world-class art and riverside beauty", schedule: ["Breakfast at hotel", "Louvre Museum visit (morning)", "Lunch in Tuileries Garden area", "Seine River walk or cruise", "Dinner in Saint-Germain-des-Pres"], image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&h=400&fit=crop&q=80" },
    { title: "Eiffel Tower & Trocadero", desc: "Experience Paris's iconic landmark", schedule: ["Breakfast at hotel", "Trocadero gardens for Eiffel views", "Eiffel Tower visit", "Lunch near Champ de Mars", "Afternoon at Musee d'Orsay", "Evening in Marais district"], image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600&h=400&fit=crop&q=80" },
    { title: "Versailles Excursion", desc: "Step into royal French history", schedule: ["Early breakfast", "Day trip to Palace of Versailles", "Explore palace and gardens", "Lunch in Versailles town", "Return to Paris", "Free evening"], image: "https://images.unsplash.com/photo-1551410224-699683e15636?w=600&h=400&fit=crop&q=80" },
    { title: "Montmartre & Sacre-Coeur", desc: "Discover artistic Paris", schedule: ["Breakfast at hotel", "Walk through Montmartre village", "Visit Sacre-Coeur Basilica", "Artist's square - Place du Tertre", "Lunch at local bistro", "Shopping in Le Marais", "Optional: Moulin Rouge show"], image: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Au revoir Paris", schedule: ["Final breakfast", "Last-minute shopping", "Hotel checkout", "Transfer to airport"], image: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=600&h=400&fit=crop&q=80" },
  ],
  dubai: [
    { title: "Arrival & Dubai Marina", desc: "Welcome to the city of gold", schedule: ["Airport transfer to hotel", "Hotel check-in", "Evening at Dubai Marina", "Dinner at waterfront restaurant"], image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop&q=80" },
    { title: "Burj Khalifa & Downtown", desc: "Reach for the sky", schedule: ["Breakfast at hotel", "Dubai Mall exploration", "Burj Khalifa observation deck", "Dubai Fountain show", "Dinner in Downtown Dubai"], image: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=600&h=400&fit=crop&q=80" },
    { title: "Desert Safari Adventure", desc: "Experience Arabian wilderness", schedule: ["Relaxed morning at hotel or pool", "Light lunch", "Afternoon desert safari pickup", "Dune bashing and camel rides", "BBQ dinner under the stars", "Traditional entertainment"], image: "https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3?w=600&h=400&fit=crop&q=80" },
    { title: "Old Dubai & Culture", desc: "Discover the heritage", schedule: ["Breakfast at hotel", "Abra ride across Dubai Creek", "Gold and Spice Souks", "Al Fahidi Historic District", "Lunch at local restaurant", "Dubai Museum", "Evening at leisure"], image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=600&h=400&fit=crop&q=80" },
    { title: "Palm & Atlantis", desc: "Luxury island paradise", schedule: ["Breakfast at hotel", "Palm Jumeirah tour", "Atlantis Aquaventure or The Lost Chambers", "Beach time", "Sunset at Palm viewpoint", "Farewell dinner"], image: "https://images.unsplash.com/photo-1578681041175-9717c16b0b30?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Ma'a salama Dubai", schedule: ["Final breakfast", "Last-minute shopping", "Hotel checkout", "Transfer to airport"], image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&h=400&fit=crop&q=80" },
  ],
  bali: [
    { title: "Arrival & Seminyak", desc: "Welcome to the Island of Gods", schedule: ["Airport transfer to hotel", "Hotel check-in", "Relax by the pool", "Sunset at Seminyak beach", "Dinner at beach club"], image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop&q=80" },
    { title: "Ubud & Rice Terraces", desc: "Heart of Balinese culture", schedule: ["Early breakfast", "Drive to Ubud", "Tegallalang Rice Terraces", "Ubud Monkey Forest", "Lunch overlooking rice paddies", "Ubud Art Market", "Traditional dance performance"], image: "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600&h=400&fit=crop&q=80" },
    { title: "Temple & Spiritual Journey", desc: "Sacred Balinese temples", schedule: ["Breakfast at hotel", "Tirta Empul holy water temple", "Lunch at local warung", "Tanah Lot sunset temple visit", "Dinner with ocean views"], image: "https://images.unsplash.com/photo-1604999333679-b86d54738315?w=600&h=400&fit=crop&q=80" },
    { title: "Beach & Adventure", desc: "Sun, sand and thrills", schedule: ["Breakfast at hotel", "Nusa Dua beach activities", "Water sports or snorkeling", "Beachside lunch", "Spa treatment", "Seafood dinner at Jimbaran Bay"], image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600&h=400&fit=crop&q=80" },
    { title: "Uluwatu & Kecak", desc: "Clifftop magic", schedule: ["Relaxed morning", "Brunch at trendy cafe", "Pool time or shopping", "Uluwatu Temple visit", "Kecak fire dance at sunset", "Farewell dinner"], image: "https://images.unsplash.com/photo-1555444391-0f8e8e68db27?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Sampai jumpa Bali", schedule: ["Final breakfast", "Last-minute shopping", "Hotel checkout", "Transfer to airport"], image: "https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop&q=80" },
  ],
  maldives: [
    { title: "Arrival in Paradise", desc: "Welcome to tropical perfection", schedule: ["Seaplane or speedboat transfer", "Resort welcome and refreshments", "Villa orientation", "Sunset drinks on the beach", "Dinner at resort restaurant"], image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&h=400&fit=crop&q=80" },
    { title: "Ocean Exploration", desc: "Discover underwater wonders", schedule: ["Breakfast with ocean views", "Snorkeling excursion", "Beachside lunch", "Relaxation time", "Sunset dolphin cruise", "Romantic dinner"], image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop&q=80" },
    { title: "Island Life", desc: "Pure relaxation", schedule: ["In-villa breakfast", "Morning spa treatment", "Lazy beach afternoon", "Water villa experience", "Stargazing dinner on sandbank"], image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600&h=400&fit=crop&q=80" },
    { title: "Adventure Day", desc: "Active paradise experiences", schedule: ["Breakfast at restaurant", "Diving or water sports", "Island hopping or fishing trip", "Sunset sailing", "Special dining experience"], image: "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Farewell to paradise", schedule: ["Final breakfast", "Last swim", "Transfer to Male airport"], image: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600&h=400&fit=crop&q=80" },
  ],
  bangkok: [
    { title: "Arrival & River Views", desc: "Sawadee Bangkok", schedule: ["Airport transfer to hotel", "Hotel check-in", "Chao Phraya River cruise", "Dinner at riverside restaurant"], image: "https://images.unsplash.com/photo-1508009603885-50cf7c579c26?w=600&h=400&fit=crop&q=80" },
    { title: "Grand Palace & Temples", desc: "Royal Bangkok", schedule: ["Early breakfast", "Grand Palace visit", "Wat Pho & Reclining Buddha", "Lunch near palace", "Wat Arun at sunset", "Dinner in Chinatown"], image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&h=400&fit=crop&q=80" },
    { title: "Markets & Culture", desc: "Local Bangkok life", schedule: ["Early departure for floating market", "Damnoen Saduak experience", "Lunch at market", "Train market visit", "Return to Bangkok", "Thai cooking class", "Enjoy your creations for dinner"], image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&h=400&fit=crop&q=80" },
    { title: "Modern Bangkok", desc: "Shopping and skyline", schedule: ["Breakfast at hotel", "MBK or Siam shopping", "Lunch at food court", "Jim Thompson House", "Rooftop bar at sunset", "Dinner at upscale Thai restaurant"], image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Khob khun Bangkok", schedule: ["Final breakfast", "Last-minute shopping", "Hotel checkout", "Transfer to airport"], image: "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?w=600&h=400&fit=crop&q=80" },
  ],
  santorini: [
    { title: "Arrival in Santorini", desc: "Welcome to the Greek island paradise", schedule: ["Ferry or flight arrival", "Transfer to Fira or Oia hotel", "Hotel check-in", "Evening caldera views", "Dinner with sunset views"], image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop&q=80" },
    { title: "Oia & Blue Domes", desc: "Iconic Santorini views", schedule: ["Breakfast at hotel", "Walk through Oia village", "Famous blue dome churches", "Lunch with caldera views", "Shopping in Oia", "World-famous Oia sunset"], image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop&q=80" },
    { title: "Fira & Wine Tasting", desc: "Capital exploration and local wines", schedule: ["Breakfast at hotel", "Explore Fira town", "Archaeological Museum", "Lunch in Fira", "Santorini wine tour", "Traditional Greek dinner"], image: "https://images.unsplash.com/photo-1580502304784-8985b7eb7260?w=600&h=400&fit=crop&q=80" },
    { title: "Beach Day & Akrotiri", desc: "Ancient ruins and volcanic beaches", schedule: ["Breakfast at hotel", "Akrotiri archaeological site", "Red Beach visit", "Lunch at Perissa", "Black sand beach relaxation", "Seafood dinner by the sea"], image: "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=600&h=400&fit=crop&q=80" },
    { title: "Volcano & Hot Springs", desc: "Volcanic adventure", schedule: ["Breakfast at hotel", "Boat trip to Nea Kameni volcano", "Hike to crater", "Swim in hot springs", "Return to Fira", "Farewell dinner in Imerovigli"], image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Antio Santorini", schedule: ["Final breakfast with views", "Last photos", "Transfer to airport/port"], image: "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=600&h=400&fit=crop&q=80" },
  ],
  rome: [
    { title: "Arrival & Trastevere", desc: "Benvenuti a Roma", schedule: ["Airport transfer to hotel", "Hotel check-in", "Evening walk in Trastevere", "Authentic Roman dinner"], image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop&q=80" },
    { title: "Colosseum & Ancient Rome", desc: "Walk through ancient history", schedule: ["Early breakfast", "Colosseum guided tour", "Roman Forum exploration", "Palatine Hill", "Lunch near Piazza Venezia", "Trevi Fountain at night"], image: "https://images.unsplash.com/photo-1552432552-06c0b0a94dda?w=600&h=400&fit=crop&q=80" },
    { title: "Vatican City", desc: "Art and spirituality", schedule: ["Early start to beat crowds", "Vatican Museums", "Sistine Chapel", "St. Peter's Basilica", "Lunch in Borgo", "Castel Sant'Angelo", "Dinner in Centro Storico"], image: "https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600&h=400&fit=crop&q=80" },
    { title: "Piazzas & Fountains", desc: "La Dolce Vita experience", schedule: ["Breakfast at hotel", "Piazza Navona", "Pantheon visit", "Lunch at Campo de' Fiori", "Spanish Steps", "Via Condotti shopping", "Aperitivo and dinner"], image: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Arrivederci Roma", schedule: ["Final breakfast", "Last-minute shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600&h=400&fit=crop&q=80" },
  ],
  barcelona: [
    { title: "Arrival & Gothic Quarter", desc: "Bienvenidos a Barcelona", schedule: ["Airport transfer", "Hotel check-in", "Gothic Quarter evening walk", "Tapas dinner on Las Ramblas"], image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop&q=80" },
    { title: "Gaudi Masterpieces", desc: "Architectural wonders", schedule: ["Breakfast at hotel", "Sagrada Familia tour", "Park Guell visit", "Lunch in Gracia", "Casa Batllo", "Passeig de Gracia", "Dinner in El Born"], image: "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600&h=400&fit=crop&q=80" },
    { title: "Beaches & Barceloneta", desc: "Mediterranean vibes", schedule: ["Breakfast at hotel", "La Boqueria market", "Barceloneta beach", "Seafood lunch by the sea", "Port Olimpic walk", "Sunset at W Hotel area", "Beach club dinner"], image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop&q=80" },
    { title: "Montjuic & Culture", desc: "Art and panoramic views", schedule: ["Breakfast at hotel", "Montjuic cable car", "Joan Miro Foundation", "Olympic Stadium", "Magic Fountain show", "Dinner in Poble Sec"], image: "https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Adeu Barcelona", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=600&h=400&fit=crop&q=80" },
  ],
  london: [
    { title: "Arrival & South Bank", desc: "Welcome to London", schedule: ["Airport transfer", "Hotel check-in", "South Bank evening walk", "Dinner with Thames views"], image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop&q=80" },
    { title: "Royal London", desc: "Palaces and pageantry", schedule: ["Breakfast at hotel", "Buckingham Palace", "Changing of the Guard", "Westminster Abbey", "Big Ben & Parliament", "London Eye at sunset", "West End show"], image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=600&h=400&fit=crop&q=80" },
    { title: "Museums & Culture", desc: "World-class collections", schedule: ["Breakfast at hotel", "British Museum", "Lunch in Bloomsbury", "National Gallery", "Trafalgar Square", "Covent Garden evening", "Theatre district dinner"], image: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&h=400&fit=crop&q=80" },
    { title: "Tower & Markets", desc: "History and local life", schedule: ["Breakfast at hotel", "Tower of London", "Tower Bridge", "Borough Market lunch", "St. Paul's Cathedral", "Evening in Shoreditch"], image: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Cheerio London", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&h=400&fit=crop&q=80" },
  ],
  "new york": [
    { title: "Arrival in Manhattan", desc: "Welcome to the Big Apple", schedule: ["Airport transfer", "Hotel check-in", "Times Square evening", "Broadway show or dinner"], image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop&q=80" },
    { title: "Iconic NYC", desc: "Must-see landmarks", schedule: ["Breakfast at hotel", "Statue of Liberty ferry", "Ellis Island", "Wall Street walk", "Brooklyn Bridge", "DUMBO dinner with skyline views"], image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600&h=400&fit=crop&q=80" },
    { title: "Central Park & Museums", desc: "Culture and green spaces", schedule: ["Breakfast at hotel", "Central Park morning walk", "Metropolitan Museum", "Lunch on Museum Mile", "Guggenheim or MoMA", "Fifth Avenue", "Dinner in Midtown"], image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&h=400&fit=crop&q=80" },
    { title: "Empire State & Chelsea", desc: "Skyline and neighborhoods", schedule: ["Breakfast at hotel", "Empire State Building", "High Line walk", "Chelsea Market lunch", "Hudson Yards", "Top of the Rock sunset", "Rooftop bar evening"], image: "https://images.unsplash.com/photo-1518235506717-e1ed3306a89b?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Goodbye NYC", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1522083165195-3424ed129620?w=600&h=400&fit=crop&q=80" },
  ],
  tokyo: [
    { title: "Arrival in Tokyo", desc: "Welcome to Japan", schedule: ["Airport transfer", "Hotel check-in", "Shinjuku evening exploration", "Ramen dinner"], image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop&q=80" },
    { title: "Traditional Tokyo", desc: "Ancient temples and gardens", schedule: ["Breakfast at hotel", "Senso-ji Temple in Asakusa", "Nakamise shopping street", "Traditional lunch", "Meiji Shrine", "Harajuku exploration", "Shibuya Crossing at night"], image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop&q=80" },
    { title: "Modern Tokyo", desc: "Technology and pop culture", schedule: ["Breakfast at hotel", "Tsukiji Outer Market", "teamLab digital art museum", "Odaiba exploration", "Akihabara electronics", "Robot Restaurant or izakaya dinner"], image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=400&fit=crop&q=80" },
    { title: "Tokyo Tower & Gardens", desc: "Panoramas and tranquility", schedule: ["Breakfast at hotel", "Imperial Palace gardens", "Ginza shopping", "Tokyo Tower", "Roppongi Hills", "Sunset views", "Fine dining experience"], image: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Sayonara Tokyo", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop&q=80" },
  ],
  singapore: [
    { title: "Arrival in Singapore", desc: "Welcome to the Lion City", schedule: ["Airport transfer", "Hotel check-in", "Marina Bay evening walk", "Dinner at hawker centre"], image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=400&fit=crop&q=80" },
    { title: "Marina Bay & Gardens", desc: "Iconic Singapore", schedule: ["Breakfast at hotel", "Gardens by the Bay", "Cloud Forest & Flower Dome", "Marina Bay Sands SkyPark", "Merlion Park", "Light show at night"], image: "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=600&h=400&fit=crop&q=80" },
    { title: "Culture & Heritage", desc: "Multicultural Singapore", schedule: ["Breakfast at hotel", "Chinatown exploration", "Little India visit", "Kampong Glam & Arab Street", "Haji Lane shopping", "Evening on Clarke Quay"], image: "https://images.unsplash.com/photo-1565967511849-76a60a516170?w=600&h=400&fit=crop&q=80" },
    { title: "Sentosa & Fun", desc: "Island adventures", schedule: ["Breakfast at hotel", "Sentosa Island day", "Universal Studios or S.E.A. Aquarium", "Beach time", "Return to city", "Orchard Road shopping", "Farewell dinner"], image: "https://images.unsplash.com/photo-1496939376851-89342e90adcd?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Goodbye Singapore", schedule: ["Final breakfast", "Last shopping", "Transfer to Changi Airport"], image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop&q=80" },
  ],
  amsterdam: [
    { title: "Arrival in Amsterdam", desc: "Welkom in Amsterdam", schedule: ["Airport transfer", "Hotel check-in", "Canal evening walk", "Dinner in Jordaan"], image: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&h=400&fit=crop&q=80" },
    { title: "Museums & Culture", desc: "World-class art", schedule: ["Breakfast at hotel", "Rijksmuseum visit", "Van Gogh Museum", "Lunch at Museumplein", "Anne Frank House", "Evening canal cruise"], image: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600&h=400&fit=crop&q=80" },
    { title: "Canal Life", desc: "Explore by boat and bike", schedule: ["Breakfast at hotel", "Bike rental and cycling tour", "Vondelpark", "Nine Streets shopping", "Brown cafe experience", "Dinner in De Pijp"], image: "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600&h=400&fit=crop&q=80" },
    { title: "Markets & Neighborhoods", desc: "Local Amsterdam life", schedule: ["Breakfast at hotel", "Albert Cuyp Market", "Heineken Experience", "NDSM creative area", "A'DAM Lookout", "Farewell dinner"], image: "https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Tot ziens Amsterdam", schedule: ["Final breakfast", "Last canal walk", "Transfer to Schiphol"], image: "https://images.unsplash.com/photo-1459679749680-18eb1eb37418?w=600&h=400&fit=crop&q=80" },
  ],
  "hong kong": [
    { title: "Arrival in Hong Kong", desc: "Welcome to the fragrant harbour", schedule: ["Airport transfer", "Hotel check-in", "Victoria Harbour evening", "Dim sum dinner"], image: "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&h=400&fit=crop&q=80" },
    { title: "Hong Kong Island", desc: "Iconic landmarks", schedule: ["Breakfast at hotel", "Peak Tram to Victoria Peak", "Central district walk", "Star Ferry to Kowloon", "Temple Street Night Market", "Symphony of Lights show"], image: "https://images.unsplash.com/photo-1506970845246-9b17a7e8e7b3?w=600&h=400&fit=crop&q=80" },
    { title: "Culture & Temples", desc: "Traditional Hong Kong", schedule: ["Breakfast at hotel", "Wong Tai Sin Temple", "Chi Lin Nunnery", "Nan Lian Garden", "Mong Kok markets", "Rooftop bar evening"], image: "https://images.unsplash.com/photo-1518599807935-37015b9cefcb?w=600&h=400&fit=crop&q=80" },
    { title: "Lantau Island", desc: "Big Buddha and nature", schedule: ["Breakfast at hotel", "Ngong Ping 360 cable car", "Tian Tan Buddha", "Po Lin Monastery", "Tai O fishing village", "Return and farewell dinner"], image: "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Joi gin Hong Kong", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1594973782943-3314fe063f68?w=600&h=400&fit=crop&q=80" },
  ],
  "cairo & luxor": [
    { title: "Arrival in Cairo", desc: "Welcome to Egypt", schedule: ["Airport transfer", "Hotel check-in", "Nile evening walk", "Traditional Egyptian dinner"], image: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=600&h=400&fit=crop&q=80" },
    { title: "Pyramids & Sphinx", desc: "Ancient wonders", schedule: ["Early breakfast", "Giza Pyramids complex", "Great Sphinx", "Lunch with pyramid views", "Egyptian Museum", "Khan el-Khalili bazaar evening"], image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=600&h=400&fit=crop&q=80" },
    { title: "Fly to Luxor", desc: "Valley of the Kings", schedule: ["Early flight to Luxor", "Valley of the Kings", "Temple of Hatshepsut", "Colossi of Memnon", "Lunch", "Karnak Temple at sunset"], image: "https://images.unsplash.com/photo-1568322503652-c552c4e6c6c4?w=600&h=400&fit=crop&q=80" },
    { title: "Luxor Temples", desc: "Temple exploration", schedule: ["Breakfast at hotel", "Luxor Temple", "Nile felucca ride", "Lunch by the Nile", "Luxor Museum", "Return flight to Cairo"], image: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Ma'a salama Egypt", schedule: ["Final breakfast", "Last shopping", "Transfer to airport"], image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=600&h=400&fit=crop&q=80" },
  ],
  phuket: [
    { title: "Arrival in Phuket", desc: "Welcome to the Pearl of the Andaman", schedule: ["Airport transfer", "Resort check-in", "Beach relaxation", "Seafood dinner by the sea"], image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&h=400&fit=crop&q=80" },
    { title: "Island Hopping", desc: "Phi Phi and beyond", schedule: ["Early breakfast", "Speedboat to Phi Phi Islands", "Snorkeling at Maya Bay", "Beach lunch", "Explore Phi Phi Don", "Return sunset cruise"], image: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&h=400&fit=crop&q=80" },
    { title: "Old Town & Culture", desc: "Phuket heritage", schedule: ["Breakfast at resort", "Phuket Old Town walk", "Sino-Portuguese architecture", "Local lunch", "Big Buddha", "Wat Chalong temple", "Patong evening"], image: "https://images.unsplash.com/photo-1589474025176-6de47a4e1559?w=600&h=400&fit=crop&q=80" },
    { title: "Beach & Spa Day", desc: "Relaxation paradise", schedule: ["Late breakfast", "Thai massage spa", "Beach time", "Water sports", "Sunset at Promthep Cape", "Farewell dinner"], image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "La gon Phuket", schedule: ["Final breakfast", "Last beach time", "Transfer to airport"], image: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&h=400&fit=crop&q=80" },
  ],
  "bangkok & phuket": [
    { title: "Arrival in Bangkok", desc: "Sawadee Thailand", schedule: ["Airport transfer", "Hotel check-in", "Khao San Road evening", "Street food dinner"], image: "https://images.unsplash.com/photo-1508009603885-50cf7c579c26?w=600&h=400&fit=crop&q=80" },
    { title: "Bangkok Temples", desc: "Royal Bangkok", schedule: ["Early breakfast", "Grand Palace", "Wat Pho", "Wat Arun", "Chao Phraya cruise", "Rooftop bar sunset"], image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&h=400&fit=crop&q=80" },
    { title: "Fly to Phuket", desc: "Beach paradise awaits", schedule: ["Morning flight to Phuket", "Resort check-in", "Beach afternoon", "Seafood dinner"], image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&h=400&fit=crop&q=80" },
    { title: "Phuket Islands", desc: "Island adventures", schedule: ["Breakfast at resort", "Phi Phi Islands tour", "Snorkeling", "Beach lunch", "Return cruise", "Beach club evening"], image: "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Khob khun Thailand", schedule: ["Final breakfast", "Last beach time", "Transfer to airport"], image: "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&h=400&fit=crop&q=80" },
  ],
  venice: [
    { title: "Arrival in Venice", desc: "Benvenuti a Venezia", schedule: ["Water taxi transfer", "Hotel check-in", "Evening canal walk", "Dinner near Rialto"], image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&h=400&fit=crop&q=80" },
    { title: "St. Mark's & Grand Canal", desc: "Iconic Venice", schedule: ["Breakfast at hotel", "St. Mark's Basilica", "Doge's Palace", "Campanile views", "Gondola ride", "Sunset at Grand Canal"], image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&h=400&fit=crop&q=80" },
    { title: "Islands & Art", desc: "Murano and Burano", schedule: ["Breakfast at hotel", "Vaporetto to Murano", "Glass-making demonstration", "Ferry to Burano", "Colorful houses and lace", "Return to Venice", "Cicchetti dinner"], image: "https://images.unsplash.com/photo-1518623001395-125242310d0c?w=600&h=400&fit=crop&q=80" },
    { title: "Hidden Venice", desc: "Beyond the crowds", schedule: ["Breakfast at hotel", "Dorsoduro exploration", "Accademia Gallery", "Lunch in Cannaregio", "Jewish Ghetto history", "Aperitivo at sunset"], image: "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Arrivederci Venezia", schedule: ["Final breakfast", "Last canal stroll", "Water taxi to airport"], image: "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?w=600&h=400&fit=crop&q=80" },
  ],
  lisbon: [
    { title: "Arrival in Lisbon", desc: "Bem-vindo a Lisboa", schedule: ["Airport transfer", "Hotel check-in", "Baixa evening walk", "Dinner in Bairro Alto"], image: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop&q=80" },
    { title: "Alfama & Belem", desc: "History and pasteis", schedule: ["Breakfast at hotel", "Alfama neighborhood", "Sao Jorge Castle", "Tram 28 ride", "Belem Tower", "Jeronimos Monastery", "Pasteis de Belem"], image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&h=400&fit=crop&q=80" },
    { title: "Sintra Day Trip", desc: "Fairytale palaces", schedule: ["Early breakfast", "Train to Sintra", "Pena Palace", "Moorish Castle", "Lunch in Sintra town", "Quinta da Regaleira", "Return to Lisbon", "Fado show evening"], image: "https://images.unsplash.com/photo-1536663815808-535e2280d2c2?w=600&h=400&fit=crop&q=80" },
    { title: "LX Factory & Beaches", desc: "Modern Lisbon", schedule: ["Breakfast at hotel", "LX Factory markets", "Time Out Market lunch", "Beach at Cascais", "Sunset at Miradouro", "Farewell dinner"], image: "https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Adeus Lisboa", schedule: ["Final breakfast", "Last views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&q=80" },
  ],
  prague: [
    { title: "Arrival in Prague", desc: "Vitejte v Praze", schedule: ["Airport transfer", "Hotel check-in", "Old Town evening walk", "Traditional Czech dinner"], image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&h=400&fit=crop&q=80" },
    { title: "Prague Castle", desc: "Royal Prague", schedule: ["Breakfast at hotel", "Prague Castle complex", "St. Vitus Cathedral", "Golden Lane", "Lunch in Mala Strana", "Charles Bridge sunset", "Jazz club evening"], image: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&h=400&fit=crop&q=80" },
    { title: "Old Town & Jewish Quarter", desc: "Medieval Prague", schedule: ["Breakfast at hotel", "Old Town Square", "Astronomical Clock", "Jewish Quarter tour", "Lunch at local pub", "Wenceslas Square", "Opera or concert"], image: "https://images.unsplash.com/photo-1562624475-96c2bc08fab9?w=600&h=400&fit=crop&q=80" },
    { title: "Beer & Culture", desc: "Czech traditions", schedule: ["Breakfast at hotel", "Letna Park views", "Beer spa or brewery tour", "Traditional lunch", "Vysehrad fortress", "River cruise", "Farewell dinner"], image: "https://images.unsplash.com/photo-1458150945447-7fb764c11a92?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Sbohem Praha", schedule: ["Final breakfast", "Last Old Town stroll", "Transfer to airport"], image: "https://images.unsplash.com/photo-1600623471616-8c1966c91ff6?w=600&h=400&fit=crop&q=80" },
  ],
  vienna: [
    { title: "Arrival in Vienna", desc: "Willkommen in Wien", schedule: ["Airport transfer", "Hotel check-in", "Ringstrasse evening walk", "Wiener Schnitzel dinner"], image: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&h=400&fit=crop&q=80" },
    { title: "Imperial Vienna", desc: "Habsburg splendor", schedule: ["Breakfast at hotel", "Schonbrunn Palace", "Palace gardens", "Lunch at Naschmarkt", "Hofburg Palace", "Spanish Riding School", "Vienna State Opera"], image: "https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=600&h=400&fit=crop&q=80" },
    { title: "Art & Music", desc: "Cultural Vienna", schedule: ["Breakfast at hotel", "Belvedere Palace & Klimt", "St. Stephen's Cathedral", "Lunch in city center", "Kunsthistorisches Museum", "Traditional coffeehouse", "Concert evening"], image: "https://images.unsplash.com/photo-1548266652-99cf27701ced?w=600&h=400&fit=crop&q=80" },
    { title: "Prater & Wine", desc: "Fun and Heuriger", schedule: ["Breakfast at hotel", "Prater amusement park", "Giant Ferris Wheel", "Lunch in Prater", "Heuriger wine tavern", "Grinzing village", "Farewell dinner"], image: "https://images.unsplash.com/photo-1609856878074-cf31e21ccb6b?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Auf Wiedersehen Wien", schedule: ["Final breakfast", "Last Sachertorte", "Transfer to airport"], image: "https://images.unsplash.com/photo-1513805959324-96eb66ca8713?w=600&h=400&fit=crop&q=80" },
  ],
  milan: [
    { title: "Arrival in Milan", desc: "Benvenuti a Milano", schedule: ["Airport transfer", "Hotel check-in", "Navigli canal evening", "Aperitivo and dinner"], image: "https://images.unsplash.com/photo-1513581166391-887a96ddeafd?w=600&h=400&fit=crop&q=80" },
    { title: "Duomo & Fashion", desc: "Gothic grandeur and style", schedule: ["Breakfast at hotel", "Milan Cathedral", "Duomo rooftop", "Galleria Vittorio Emanuele II", "Lunch", "Quadrilatero della Moda", "La Scala area"], image: "https://images.unsplash.com/photo-1520440229-6469a149ac59?w=600&h=400&fit=crop&q=80" },
    { title: "Art & History", desc: "Leonardo's Milan", schedule: ["Breakfast at hotel", "Last Supper viewing", "Sforza Castle", "Lunch in Brera", "Pinacoteca di Brera", "San Maurizio church", "Dinner in Brera"], image: "https://images.unsplash.com/photo-1577083165633-14ebcdb0f658?w=600&h=400&fit=crop&q=80" },
    { title: "Design & Lifestyle", desc: "Modern Milan", schedule: ["Breakfast at hotel", "Fondazione Prada", "Design District", "Lunch at trendy spot", "Shopping outlets", "Sunset aperitivo", "Farewell dinner"], image: "https://images.unsplash.com/photo-1564592829150-82be4e02c0b5?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Arrivederci Milano", schedule: ["Final breakfast", "Last espresso", "Transfer to airport"], image: "https://images.unsplash.com/photo-1548867892-d1b34a2ff064?w=600&h=400&fit=crop&q=80" },
  ],
  madrid: [
    { title: "Arrival in Madrid", desc: "Bienvenidos a Madrid", schedule: ["Airport transfer", "Hotel check-in", "Plaza Mayor evening", "Tapas dinner"], image: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=600&h=400&fit=crop&q=80" },
    { title: "Royal Madrid", desc: "Palaces and art", schedule: ["Breakfast at hotel", "Royal Palace", "Almudena Cathedral", "Mercado San Miguel", "Prado Museum", "Retiro Park sunset", "Flamenco show"], image: "https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=600&h=400&fit=crop&q=80" },
    { title: "Art & Culture", desc: "Golden Triangle", schedule: ["Breakfast at hotel", "Reina Sofia Museum", "Guernica", "Lunch in La Latina", "Thyssen Museum", "Gran Via walk", "Rooftop bar evening"], image: "https://images.unsplash.com/photo-1559592432-d1e3e9b6b9a7?w=600&h=400&fit=crop&q=80" },
    { title: "Local Life", desc: "Madrileno experience", schedule: ["Late breakfast", "El Rastro market", "Tapas crawl", "Siesta time", "Malasana neighborhood", "Sunset drinks", "Farewell dinner"], image: "https://images.unsplash.com/photo-1570698473651-b2de99bae12f?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Adios Madrid", schedule: ["Final breakfast", "Last tapas", "Transfer to airport"], image: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=600&h=400&fit=crop&q=80" },
  ],
  istanbul: [
    { title: "Arrival in Istanbul", desc: "Hosgeldiniz", schedule: ["Airport transfer", "Hotel check-in", "Sultanahmet evening walk", "Turkish dinner"], image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&h=400&fit=crop&q=80" },
    { title: "Sultanahmet Treasures", desc: "Byzantine and Ottoman glory", schedule: ["Breakfast at hotel", "Hagia Sophia", "Blue Mosque", "Lunch at Sultanahmet", "Basilica Cistern", "Hippodrome", "Turkish bath experience"], image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=600&h=400&fit=crop&q=80" },
    { title: "Topkapi & Grand Bazaar", desc: "Palaces and markets", schedule: ["Breakfast at hotel", "Topkapi Palace", "Harem tour", "Lunch near palace", "Grand Bazaar shopping", "Spice Bazaar", "Dinner on the Bosphorus"], image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop&q=80" },
    { title: "Bosphorus & Asian Side", desc: "Two continents", schedule: ["Breakfast at hotel", "Bosphorus cruise", "Asian side exploration", "Kadikoy market lunch", "Dolmabahce Palace", "Istiklal Street", "Farewell meze dinner"], image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Gule gule Istanbul", schedule: ["Final breakfast", "Last bazaar visit", "Transfer to airport"], image: "https://images.unsplash.com/photo-1606939758551-14e1654e3489?w=600&h=400&fit=crop&q=80" },
  ],
  berlin: [
    { title: "Arrival in Berlin", desc: "Willkommen in Berlin", schedule: ["Airport transfer", "Hotel check-in", "Unter den Linden evening walk", "German dinner"], image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&h=400&fit=crop&q=80" },
    { title: "Historic Berlin", desc: "History and monuments", schedule: ["Breakfast at hotel", "Brandenburg Gate", "Reichstag Building", "Holocaust Memorial", "Checkpoint Charlie", "Berlin Wall Memorial", "East Side Gallery"], image: "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=600&h=400&fit=crop&q=80" },
    { title: "Museum Island", desc: "Cultural treasures", schedule: ["Breakfast at hotel", "Pergamon Museum", "Neues Museum", "Lunch on Museum Island", "Berlin Cathedral", "Alexanderplatz", "TV Tower views"], image: "https://images.unsplash.com/photo-1566404791232-af9fe3c25dea?w=600&h=400&fit=crop&q=80" },
    { title: "Neighborhoods & Culture", desc: "Local Berlin life", schedule: ["Breakfast at hotel", "Kreuzberg exploration", "Street food lunch", "Prenzlauer Berg cafes", "Mauerpark", "Sunset at Tempelhof", "Nightlife experience"], image: "https://images.unsplash.com/photo-1546726747-421c6d69c929?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Auf Wiedersehen Berlin", schedule: ["Final breakfast", "Last walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=600&h=400&fit=crop&q=80" },
  ],
  athens: [
    { title: "Arrival in Athens", desc: "Kalos irthate", schedule: ["Airport transfer", "Hotel check-in", "Plaka evening walk", "Greek taverna dinner"], image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&h=400&fit=crop&q=80" },
    { title: "Acropolis Day", desc: "Ancient glory", schedule: ["Early breakfast", "Acropolis visit", "Parthenon", "Acropolis Museum", "Lunch in Monastiraki", "Ancient Agora", "Sunset at Areopagus"], image: "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600&h=400&fit=crop&q=80" },
    { title: "Historic Athens", desc: "Classical heritage", schedule: ["Breakfast at hotel", "National Archaeological Museum", "Syntagma Square", "Parliament guard change", "Lunch", "Temple of Olympian Zeus", "Panathenaic Stadium", "Rooftop dinner with Acropolis views"], image: "https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=600&h=400&fit=crop&q=80" },
    { title: "Modern Athens", desc: "Contemporary culture", schedule: ["Breakfast at hotel", "Kolonaki neighborhood", "Benaki Museum", "Mount Lycabettus", "Psyrri street art", "Evening in Gazi", "Farewell souvlaki"], image: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Antio Athens", schedule: ["Final breakfast", "Last Greek coffee", "Transfer to airport"], image: "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=600&h=400&fit=crop&q=80" },
  ],
  miami: [
    { title: "Arrival in Miami", desc: "Welcome to Magic City", schedule: ["Airport transfer", "Hotel check-in", "Ocean Drive evening", "Cuban dinner in Little Havana"], image: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=600&h=400&fit=crop&q=80" },
    { title: "South Beach", desc: "Art Deco and sand", schedule: ["Breakfast at hotel", "South Beach morning", "Art Deco walking tour", "Lunch on Lincoln Road", "Beach afternoon", "Sunset at South Pointe", "Club evening"], image: "https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=600&h=400&fit=crop&q=80" },
    { title: "Art & Culture", desc: "Wynwood and beyond", schedule: ["Breakfast at hotel", "Wynwood Walls", "Art galleries", "Lunch in Wynwood", "Design District", "Perez Art Museum", "Brickell evening"], image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=400&fit=crop&q=80" },
    { title: "Everglades & Keys", desc: "Florida nature", schedule: ["Early breakfast", "Everglades airboat tour", "Alligator spotting", "Lunch", "Key Biscayne beach", "Sunset cruise", "Farewell dinner"], image: "https://images.unsplash.com/photo-1549989476-69a92fa57c36?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Goodbye Miami", schedule: ["Final breakfast", "Last beach time", "Transfer to airport"], image: "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=600&h=400&fit=crop&q=80" },
  ],
  "los angeles": [
    { title: "Arrival in LA", desc: "Welcome to the City of Angels", schedule: ["Airport transfer", "Hotel check-in", "Santa Monica Pier sunset", "Dinner on the beach"], image: "https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=600&h=400&fit=crop&q=80" },
    { title: "Hollywood & Stars", desc: "Entertainment capital", schedule: ["Breakfast at hotel", "Hollywood Walk of Fame", "TCL Chinese Theatre", "Hollywood Sign views", "Griffith Observatory", "Sunset Boulevard", "Beverly Hills dinner"], image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&h=400&fit=crop&q=80" },
    { title: "Beach Cities", desc: "California dreaming", schedule: ["Breakfast at hotel", "Venice Beach boardwalk", "Muscle Beach", "Lunch in Venice", "Abbot Kinney shopping", "Malibu drive", "Sunset dinner in Malibu"], image: "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?w=600&h=400&fit=crop&q=80" },
    { title: "Arts & Culture", desc: "Museums and more", schedule: ["Breakfast at hotel", "Getty Center", "Rodeo Drive", "Lunch in Beverly Hills", "LACMA or Broad Museum", "Downtown Arts District", "Rooftop bar evening"], image: "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Goodbye LA", schedule: ["Final breakfast", "Last beach walk", "Transfer to LAX"], image: "https://images.unsplash.com/photo-1515896769750-31548aa180ed?w=600&h=400&fit=crop&q=80" },
  ],
  cancun: [
    { title: "Arrival in Cancun", desc: "Bienvenidos al Caribe", schedule: ["Airport transfer", "Resort check-in", "Beach relaxation", "Welcome dinner"], image: "https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600&h=400&fit=crop&q=80" },
    { title: "Mayan Ruins", desc: "Ancient wonders", schedule: ["Early breakfast", "Chichen Itza day trip", "Explore the pyramid", "Cenote swim", "Lunch at hacienda", "Return to Cancun", "Dinner at hotel"], image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=600&h=400&fit=crop&q=80" },
    { title: "Beach & Water Sports", desc: "Caribbean fun", schedule: ["Breakfast at resort", "Snorkeling or diving", "Beach time", "Water sports", "Sunset catamaran cruise", "Seafood dinner"], image: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&h=400&fit=crop&q=80" },
    { title: "Isla Mujeres", desc: "Island paradise", schedule: ["Breakfast at resort", "Ferry to Isla Mujeres", "Golf cart island tour", "Playa Norte beach", "Lunch by the sea", "Snorkeling", "Return and farewell dinner"], image: "https://images.unsplash.com/photo-1590080876351-941da357a5e3?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Adios Cancun", schedule: ["Final breakfast", "Last beach time", "Transfer to airport"], image: "https://images.unsplash.com/photo-1569408202395-1f8e2fb08497?w=600&h=400&fit=crop&q=80" },
  ],
  marrakech: [
    { title: "Arrival in Marrakech", desc: "Ahlan wa Sahlan", schedule: ["Airport transfer", "Riad check-in", "Medina evening walk", "Traditional Moroccan dinner"], image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&h=400&fit=crop&q=80" },
    { title: "Medina & Souks", desc: "Ancient Marrakech", schedule: ["Breakfast at riad", "Bahia Palace", "Saadian Tombs", "Lunch in Medina", "Souk exploration", "Djemaa el-Fna at sunset", "Street food dinner"], image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&h=400&fit=crop&q=80" },
    { title: "Gardens & Culture", desc: "Oases and art", schedule: ["Breakfast at riad", "Jardin Majorelle", "YSL Museum", "Menara Gardens", "Hammam experience", "Koutoubia Mosque area", "Rooftop dinner"], image: "https://images.unsplash.com/photo-1572098474515-03dc0f2b9b82?w=600&h=400&fit=crop&q=80" },
    { title: "Atlas Excursion", desc: "Mountains and valleys", schedule: ["Early breakfast", "Atlas Mountains trip", "Berber village visit", "Traditional lunch", "Ourika Valley", "Return to Marrakech", "Farewell dinner"], image: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Bslama Marrakech", schedule: ["Final breakfast", "Last souk visit", "Transfer to airport"], image: "https://images.unsplash.com/photo-1560095633-bc1245a1ba07?w=600&h=400&fit=crop&q=80" },
  ],
  "cape town": [
    { title: "Arrival in Cape Town", desc: "Welcome to the Mother City", schedule: ["Airport transfer", "Hotel check-in", "V&A Waterfront evening", "Dinner with harbour views"], image: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&h=400&fit=crop&q=80" },
    { title: "Table Mountain", desc: "Iconic summit", schedule: ["Early breakfast", "Table Mountain cable car", "Summit exploration", "Lunch at waterfront", "Bo-Kaap colorful houses", "Signal Hill sunset", "Cape Malay dinner"], image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&h=400&fit=crop&q=80" },
    { title: "Cape Peninsula", desc: "Coastal beauty", schedule: ["Breakfast at hotel", "Chapman's Peak drive", "Boulder's Beach penguins", "Cape Point", "Cape of Good Hope", "Lunch at Simon's Town", "Return via wine farms"], image: "https://images.unsplash.com/photo-1591208333405-5d5e0a60f0af?w=600&h=400&fit=crop&q=80" },
    { title: "Wine & Culture", desc: "Winelands experience", schedule: ["Breakfast at hotel", "Stellenbosch wine tour", "Wine tasting", "Lunch among vineyards", "Franschhoek visit", "Return to Cape Town", "Farewell dinner"], image: "https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Totsiens Cape Town", schedule: ["Final breakfast", "Last views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1578559284795-25f6e833f46f?w=600&h=400&fit=crop&q=80" },
  ],
  sydney: [
    { title: "Arrival in Sydney", desc: "G'day Sydney", schedule: ["Airport transfer", "Hotel check-in", "Circular Quay evening", "Dinner with Opera House views"], image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop&q=80" },
    { title: "Harbour Icons", desc: "Sydney highlights", schedule: ["Breakfast at hotel", "Sydney Opera House tour", "The Rocks walking tour", "Lunch at Circular Quay", "Harbour Bridge climb or walk", "Ferry to Manly Beach", "Sunset return"], image: "https://images.unsplash.com/photo-1523428096881-5bd79d043006?w=600&h=400&fit=crop&q=80" },
    { title: "Beaches & Nature", desc: "Coastal Sydney", schedule: ["Breakfast at hotel", "Bondi Beach morning", "Bondi to Coogee walk", "Lunch at Bronte", "Taronga Zoo or aquarium", "Darling Harbour evening", "Dinner in Surry Hills"], image: "https://images.unsplash.com/photo-1506374169495-e16e0a3e68c5?w=600&h=400&fit=crop&q=80" },
    { title: "Blue Mountains", desc: "Natural wonder", schedule: ["Early breakfast", "Blue Mountains day trip", "Three Sisters viewpoint", "Scenic Railway", "Bush walks", "Lunch in Leura", "Return to Sydney", "Farewell dinner"], image: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Hooroo Sydney", schedule: ["Final breakfast", "Last harbour views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=600&h=400&fit=crop&q=80" },
  ],
  melbourne: [
    { title: "Arrival in Melbourne", desc: "Welcome to Melbourne", schedule: ["Airport transfer", "Hotel check-in", "Southbank evening walk", "Dinner on the Yarra"], image: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=600&h=400&fit=crop&q=80" },
    { title: "City Culture", desc: "Laneways and art", schedule: ["Breakfast at cafe", "Federation Square", "Laneway street art tour", "Hosier Lane", "Queen Victoria Market lunch", "NGV art gallery", "Rooftop bar sunset"], image: "https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=600&h=400&fit=crop&q=80" },
    { title: "Great Ocean Road", desc: "Coastal adventure", schedule: ["Early breakfast", "Great Ocean Road drive", "Bells Beach", "Lunch at Lorne", "Twelve Apostles", "Sunset at the coast", "Return to Melbourne"], image: "https://images.unsplash.com/photo-1529108190281-9a4f620bc2d8?w=600&h=400&fit=crop&q=80" },
    { title: "Neighborhoods", desc: "Local Melbourne", schedule: ["Breakfast at hotel", "Fitzroy exploration", "Brunswick Street cafes", "Lunch in Carlton", "St Kilda beach", "Luna Park", "Farewell dinner"], image: "https://images.unsplash.com/photo-1508317469940-e3de49ba902e?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Cheerio Melbourne", schedule: ["Final breakfast", "Last coffee", "Transfer to airport"], image: "https://images.unsplash.com/photo-1494949360228-4e9bde560065?w=600&h=400&fit=crop&q=80" },
  ],
  "abu dhabi": [
    { title: "Arrival in Abu Dhabi", desc: "Ahlan wa Sahlan", schedule: ["Airport transfer", "Hotel check-in", "Corniche evening walk", "Arabic dinner"], image: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=600&h=400&fit=crop&q=80" },
    { title: "Grand Mosque & Culture", desc: "Islamic splendor", schedule: ["Breakfast at hotel", "Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi", "Lunch at museum", "Heritage Village", "Corniche sunset", "Traditional dinner"], image: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=600&h=400&fit=crop&q=80" },
    { title: "Yas Island", desc: "Entertainment hub", schedule: ["Breakfast at hotel", "Ferrari World", "Yas Marina Circuit", "Lunch at Yas Mall", "Yas Beach", "Warner Bros or waterpark", "Dinner at Yas Marina"], image: "https://images.unsplash.com/photo-1578774204375-826dc5d996ed?w=600&h=400&fit=crop&q=80" },
    { title: "Desert & Mangroves", desc: "Natural Abu Dhabi", schedule: ["Early breakfast", "Desert safari", "Dune bashing", "Camel ride", "Kayaking in mangroves", "Sunset at Emirates Palace", "Farewell dinner"], image: "https://images.unsplash.com/photo-1451337516015-6b6e8e696a1b?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Ma'a salama Abu Dhabi", schedule: ["Final breakfast", "Last mosque views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop&q=80" },
  ],
  kyoto: [
    { title: "Arrival in Kyoto", desc: "Kyoto e yokoso", schedule: ["Train from Osaka/Tokyo", "Ryokan check-in", "Gion evening walk", "Kaiseki dinner"], image: "https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=600&h=400&fit=crop&q=80" },
    { title: "Temples & Shrines", desc: "Spiritual Kyoto", schedule: ["Early breakfast", "Fushimi Inari shrine", "Thousand torii gates walk", "Lunch", "Kinkaku-ji Golden Pavilion", "Ryoan-ji rock garden", "Traditional tea ceremony"], image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&h=400&fit=crop&q=80" },
    { title: "Arashiyama", desc: "Bamboo and nature", schedule: ["Breakfast at ryokan", "Bamboo Grove walk", "Tenryu-ji temple", "Monkey Park", "Lunch by the river", "Sagano scenic railway", "Geisha district evening"], image: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&h=400&fit=crop&q=80" },
    { title: "Nara Day Trip", desc: "Ancient capital", schedule: ["Breakfast at ryokan", "Train to Nara", "Todai-ji temple", "Deer park", "Lunch in Nara", "Kasuga shrine", "Return to Kyoto", "Farewell dinner"], image: "https://images.unsplash.com/photo-1590253230532-a67f6bc61c9e?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Sayonara Kyoto", schedule: ["Final breakfast", "Last temple visit", "Transfer to station"], image: "https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600&h=400&fit=crop&q=80" },
  ],
  seoul: [
    { title: "Arrival in Seoul", desc: "Annyeonghaseyo Seoul", schedule: ["Airport transfer", "Hotel check-in", "Myeongdong evening", "Korean BBQ dinner"], image: "https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=600&h=400&fit=crop&q=80" },
    { title: "Palaces & History", desc: "Royal Seoul", schedule: ["Breakfast at hotel", "Gyeongbokgung Palace", "Hanbok rental", "Bukchon Hanok Village", "Lunch at traditional restaurant", "Changdeokgung Secret Garden", "Insadong tea house"], image: "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=600&h=400&fit=crop&q=80" },
    { title: "Modern Seoul", desc: "K-culture and shopping", schedule: ["Breakfast at hotel", "Gangnam district", "COEX Mall", "K-pop experience", "Lunch", "Hongdae street culture", "Banpo Bridge Rainbow Fountain", "Club evening"], image: "https://images.unsplash.com/photo-1506816561089-5cc37b3aa9b0?w=600&h=400&fit=crop&q=80" },
    { title: "Views & Food", desc: "Seoul experiences", schedule: ["Breakfast at hotel", "N Seoul Tower", "Namsan Park", "Street food lunch", "Han River cruise", "Noryangjin fish market", "Farewell dinner"], image: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Annyeonghi gaseyo Seoul", schedule: ["Final breakfast", "Last shopping", "Transfer to Incheon"], image: "https://images.unsplash.com/photo-1601621915196-2621bfb0cd6e?w=600&h=400&fit=crop&q=80" },
  ],
  "kuala lumpur": [
    { title: "Arrival in KL", desc: "Selamat Datang", schedule: ["Airport transfer", "Hotel check-in", "KLCC evening", "Street food dinner"], image: "https://images.unsplash.com/photo-1508062878650-88b52897f298?w=600&h=400&fit=crop&q=80" },
    { title: "Petronas & City", desc: "Modern KL", schedule: ["Breakfast at hotel", "Petronas Twin Towers", "KLCC Park", "Lunch at Pavilion", "KL Tower", "Bukit Bintang", "Rooftop bar sunset"], image: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&h=400&fit=crop&q=80" },
    { title: "Culture & Heritage", desc: "Multicultural KL", schedule: ["Breakfast at hotel", "Batu Caves", "Little India", "Central Market", "Chinatown lunch", "Merdeka Square", "Traditional dinner"], image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=600&h=400&fit=crop&q=80" },
    { title: "Day Trip", desc: "Beyond the city", schedule: ["Early breakfast", "Genting Highlands or Putrajaya", "Explore and activities", "Lunch", "Return to KL", "Jalan Alor food street", "Farewell dinner"], image: "https://images.unsplash.com/photo-1531920221829-16c09ecdaf49?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Selamat Tinggal KL", schedule: ["Final breakfast", "Last shopping", "Transfer to KLIA"], image: "https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=600&h=400&fit=crop&q=80" },
  ],
  "vietnam explorer": [
    { title: "Arrival in Hanoi", desc: "Xin chao Vietnam", schedule: ["Airport transfer", "Hotel check-in", "Old Quarter evening walk", "Pho dinner"], image: "https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&h=400&fit=crop&q=80" },
    { title: "Hanoi Highlights", desc: "Capital culture", schedule: ["Breakfast at hotel", "Ho Chi Minh Mausoleum", "Temple of Literature", "Lunch on Bun Cha street", "Hoan Kiem Lake", "Water puppet show", "Bia hoi evening"], image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&h=400&fit=crop&q=80" },
    { title: "Ha Long Bay", desc: "UNESCO wonder", schedule: ["Early breakfast", "Drive to Ha Long", "Cruise boat boarding", "Kayaking", "Cave exploration", "Sunset on deck", "Overnight on boat"], image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&h=400&fit=crop&q=80" },
    { title: "Fly to Hoi An", desc: "Ancient town charm", schedule: ["Sunrise on bay", "Return to shore", "Flight to Da Nang", "Hoi An old town", "Lantern-lit streets", "Tailoring and shopping", "Riverside dinner"], image: "https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Tam biet Vietnam", schedule: ["Final breakfast", "Last old town stroll", "Transfer to airport"], image: "https://images.unsplash.com/photo-1535086181678-5a5c4d23aa7d?w=600&h=400&fit=crop&q=80" },
  ],
  florence: [
    { title: "Arrival in Florence", desc: "Benvenuti a Firenze", schedule: ["Airport/station transfer", "Hotel check-in", "Ponte Vecchio evening", "Tuscan dinner"], image: "https://images.unsplash.com/photo-1543429258-68a46a99b588?w=600&h=400&fit=crop&q=80" },
    { title: "Renaissance Art", desc: "Uffizi and more", schedule: ["Breakfast at hotel", "Uffizi Gallery", "Piazza della Signoria", "Lunch near Duomo", "Florence Cathedral climb", "Baptistery", "Gelato and evening walk"], image: "https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600&h=400&fit=crop&q=80" },
    { title: "Accademia & Craftsmen", desc: "David and artisans", schedule: ["Breakfast at hotel", "Accademia Gallery", "Michelangelo's David", "Santa Croce", "Lunch in Oltrarno", "Artisan workshops", "Piazzale Michelangelo sunset"], image: "https://images.unsplash.com/photo-1534445538923-ab38732dcd49?w=600&h=400&fit=crop&q=80" },
    { title: "Tuscany Day Trip", desc: "Hills and wine", schedule: ["Early breakfast", "Chianti wine tour", "Medieval villages", "Wine and olive oil tasting", "Tuscan lunch", "San Gimignano or Siena", "Return and farewell dinner"], image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Arrivederci Firenze", schedule: ["Final breakfast", "Last leather shopping", "Transfer to station/airport"], image: "https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=600&h=400&fit=crop&q=80" },
  ],
  dublin: [
    { title: "Arrival in Dublin", desc: "Failte go Dublin", schedule: ["Airport transfer", "Hotel check-in", "Temple Bar evening", "Irish pub dinner"], image: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=600&h=400&fit=crop&q=80" },
    { title: "City Highlights", desc: "Historic Dublin", schedule: ["Breakfast at hotel", "Trinity College", "Book of Kells", "Grafton Street", "St. Patrick's Cathedral", "Dublin Castle", "Traditional music evening"], image: "https://images.unsplash.com/photo-1565095028377-06f88aed4a64?w=600&h=400&fit=crop&q=80" },
    { title: "Guinness & Culture", desc: "Irish heritage", schedule: ["Breakfast at hotel", "Guinness Storehouse", "Lunch overlooking city", "Jameson Distillery", "Phoenix Park", "Ha'penny Bridge", "Literary pub crawl"], image: "https://images.unsplash.com/photo-1546608435-e558d05a09f5?w=600&h=400&fit=crop&q=80" },
    { title: "Coastal Escape", desc: "Beyond Dublin", schedule: ["Breakfast at hotel", "Howth fishing village", "Cliff walk", "Seafood lunch", "EPIC Irish Emigration Museum", "Sunset at Grand Canal Dock", "Farewell dinner"], image: "https://images.unsplash.com/photo-1590093464124-82c2c9bc59ed?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Slan Dublin", schedule: ["Final breakfast", "Last Temple Bar visit", "Transfer to airport"], image: "https://images.unsplash.com/photo-1548337138-e87d889cc369?w=600&h=400&fit=crop&q=80" },
  ],
  edinburgh: [
    { title: "Arrival in Edinburgh", desc: "Welcome to Edinburgh", schedule: ["Airport transfer", "Hotel check-in", "Royal Mile evening walk", "Scottish dinner"], image: "https://images.unsplash.com/photo-1562008851-2db03af0cd3a?w=600&h=400&fit=crop&q=80" },
    { title: "Castle & Old Town", desc: "Medieval Edinburgh", schedule: ["Breakfast at hotel", "Edinburgh Castle", "Royal Mile exploration", "St. Giles' Cathedral", "Lunch on Grassmarket", "Mary King's Close", "Whisky tasting", "Ghost tour evening"], image: "https://images.unsplash.com/photo-1566041510394-cf7c8fe21800?w=600&h=400&fit=crop&q=80" },
    { title: "Arthur's Seat & New Town", desc: "Views and Georgian elegance", schedule: ["Breakfast at hotel", "Climb Arthur's Seat", "Holyrood Palace", "Lunch", "New Town walk", "Scottish National Gallery", "Princes Street shopping", "Fine dining"], image: "https://images.unsplash.com/photo-1585436249004-c30b1f8c9fa2?w=600&h=400&fit=crop&q=80" },
    { title: "Highlands Taste", desc: "Day trip north", schedule: ["Early breakfast", "Stirling Castle or Rosslyn Chapel", "Scottish countryside", "Highland lunch", "Loch views", "Return to Edinburgh", "Farewell dinner"], image: "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Haste ye back Edinburgh", schedule: ["Final breakfast", "Last Royal Mile walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1595951509189-f7bfc67e7f87?w=600&h=400&fit=crop&q=80" },
  ],
  budapest: [
    { title: "Arrival in Budapest", desc: "Udvozlunk Budapesten", schedule: ["Airport transfer", "Hotel check-in", "Danube evening walk", "Ruin bar dinner"], image: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=600&h=400&fit=crop&q=80" },
    { title: "Buda Castle District", desc: "Royal Buda", schedule: ["Breakfast at hotel", "Fisherman's Bastion", "Matthias Church", "Buda Castle", "Lunch with views", "Gellert Hill sunset", "Thermal bath evening"], image: "https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=600&h=400&fit=crop&q=80" },
    { title: "Pest Highlights", desc: "Grand Budapest", schedule: ["Breakfast at hotel", "Parliament Building", "Shoes on the Danube", "St. Stephen's Basilica", "Central Market lunch", "Jewish Quarter", "Ruin bars evening"], image: "https://images.unsplash.com/photo-1541300613939-71366b37c92e?w=600&h=400&fit=crop&q=80" },
    { title: "Baths & Culture", desc: "Relaxation and art", schedule: ["Breakfast at hotel", "Szechenyi Thermal Bath", "Heroes' Square", "City Park", "Lunch", "Museum of Fine Arts", "Opera House", "Farewell dinner"], image: "https://images.unsplash.com/photo-1551867633-194f125bddfa?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Viszontlatasra Budapest", schedule: ["Final breakfast", "Last Danube views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1576697148558-8c24dad6e5a6?w=600&h=400&fit=crop&q=80" },
  ],
  "nice & french riviera": [
    { title: "Arrival in Nice", desc: "Bienvenue sur la Cote d'Azur", schedule: ["Airport transfer", "Hotel check-in", "Promenade des Anglais walk", "Dinner in Old Town"], image: "https://images.unsplash.com/photo-1533752458875-df6bf1c1af4e?w=600&h=400&fit=crop&q=80" },
    { title: "Nice & Monaco", desc: "Glamour and coast", schedule: ["Breakfast at hotel", "Vieux Nice exploration", "Cours Saleya market", "Lunch in Nice", "Train to Monaco", "Monte Carlo Casino", "Prince's Palace", "Dinner in Monaco"], image: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&h=400&fit=crop&q=80" },
    { title: "Cannes & Antibes", desc: "Film and art", schedule: ["Breakfast at hotel", "Train to Cannes", "La Croisette", "Lunch in Cannes", "Antibes old town", "Picasso Museum", "Cap d'Antibes walk", "Return and dinner"], image: "https://images.unsplash.com/photo-1559113452-f6ca3e9c67da?w=600&h=400&fit=crop&q=80" },
    { title: "Eze & Beaches", desc: "Village and sea", schedule: ["Breakfast at hotel", "Eze medieval village", "Exotic garden", "Lunch with views", "Beach afternoon", "Castle Hill sunset", "Farewell dinner"], image: "https://images.unsplash.com/photo-1533778440171-a2c99e4d88c1?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Au revoir Nice", schedule: ["Final breakfast", "Last Promenade walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1528992895944-81e8e0f7f8e1?w=600&h=400&fit=crop&q=80" },
  ],
  mauritius: [
    { title: "Arrival in Mauritius", desc: "Bienvini", schedule: ["Airport transfer", "Resort check-in", "Beach sunset", "Seafood dinner"], image: "https://images.unsplash.com/photo-1589979481223-deb893043163?w=600&h=400&fit=crop&q=80" },
    { title: "Beach Paradise", desc: "Indian Ocean bliss", schedule: ["Breakfast at resort", "Beach relaxation", "Water sports", "Beachside lunch", "Snorkeling", "Sunset drinks", "Romantic dinner"], image: "https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=600&h=400&fit=crop&q=80" },
    { title: "Island Exploration", desc: "Nature and culture", schedule: ["Breakfast at resort", "Chamarel Seven Colored Earth", "Black River Gorges", "Lunch at La Vanille", "Grand Bassin temple", "Trou aux Cerfs crater", "Return and dinner"], image: "https://images.unsplash.com/photo-1585821569331-f071db2abd8d?w=600&h=400&fit=crop&q=80" },
    { title: "Catamaran Cruise", desc: "Sailing paradise", schedule: ["Breakfast at resort", "Catamaran day cruise", "Ile aux Cerfs", "Snorkeling and swimming", "BBQ lunch on boat", "Dolphin watching", "Return and farewell dinner"], image: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Salam Mauritius", schedule: ["Final breakfast", "Last beach time", "Transfer to airport"], image: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop&q=80" },
  ],
  "sri lanka": [
    { title: "Arrival in Colombo", desc: "Ayubowan Sri Lanka", schedule: ["Airport transfer", "Hotel check-in", "Galle Face Green sunset", "Sri Lankan dinner"], image: "https://images.unsplash.com/photo-1586185371516-0daca3b59c31?w=600&h=400&fit=crop&q=80" },
    { title: "Cultural Triangle", desc: "Ancient cities", schedule: ["Early breakfast", "Drive to Sigiriya", "Lion Rock fortress climb", "Lunch", "Dambulla Cave Temple", "Evening in Kandy", "Cultural show"], image: "https://images.unsplash.com/photo-1575579203093-fc34ada85e56?w=600&h=400&fit=crop&q=80" },
    { title: "Kandy & Tea Country", desc: "Hill country beauty", schedule: ["Breakfast at hotel", "Temple of the Tooth", "Kandy Lake walk", "Train to Ella", "Tea plantation visit", "Scenic journey", "Dinner in hills"], image: "https://images.unsplash.com/photo-1568214379698-8aeb8c6c6ac8?w=600&h=400&fit=crop&q=80" },
    { title: "Coast & Wildlife", desc: "Beach and nature", schedule: ["Breakfast at hotel", "Drive to coast", "Galle Fort exploration", "Lunch in Galle", "Beach relaxation", "Turtle hatchery", "Seafood farewell dinner"], image: "https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Gihin ennam Sri Lanka", schedule: ["Final breakfast", "Last beach walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1567517309498-3a8c8d5b2e5f?w=600&h=400&fit=crop&q=80" },
  ],
  sicily: [
    { title: "Arrival in Sicily", desc: "Benvenuti in Sicilia", schedule: ["Airport transfer", "Hotel check-in", "Evening passeggiata", "Sicilian dinner"], image: "https://images.unsplash.com/photo-1559564187-f7c5a5a6e56b?w=600&h=400&fit=crop&q=80" },
    { title: "Taormina", desc: "Pearl of Sicily", schedule: ["Breakfast at hotel", "Taormina old town", "Greek Theatre", "Lunch with Etna views", "Isola Bella beach", "Corso Umberto shopping", "Dinner at sunset"], image: "https://images.unsplash.com/photo-1567604740954-a13f939da27f?w=600&h=400&fit=crop&q=80" },
    { title: "Mount Etna", desc: "Volcanic adventure", schedule: ["Early breakfast", "Drive to Etna", "Crater exploration", "Lava caves", "Wine tasting on slopes", "Return to hotel", "Traditional dinner"], image: "https://images.unsplash.com/photo-1523951778830-7f53c9ef03e3?w=600&h=400&fit=crop&q=80" },
    { title: "Syracuse", desc: "Greek heritage", schedule: ["Breakfast at hotel", "Ortigia island", "Greek Theatre Syracuse", "Ear of Dionysius", "Seafood lunch", "Baroque architecture", "Farewell dinner"], image: "https://images.unsplash.com/photo-1515859005217-8a1f08870f59?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Arrivederci Sicilia", schedule: ["Final breakfast", "Last espresso", "Transfer to airport"], image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&h=400&fit=crop&q=80" },
  ],
  iceland: [
    { title: "Arrival in Reykjavik", desc: "Velkomin til Islands", schedule: ["Airport transfer", "Hotel check-in", "Reykjavik evening walk", "Icelandic dinner"], image: "https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&h=400&fit=crop&q=80" },
    { title: "Golden Circle", desc: "Classic Iceland", schedule: ["Breakfast at hotel", "Thingvellir National Park", "Geysir geothermal area", "Lunch", "Gullfoss waterfall", "Kerid Crater", "Return and dinner"], image: "https://images.unsplash.com/photo-1520769945061-0a448c463865?w=600&h=400&fit=crop&q=80" },
    { title: "South Coast", desc: "Waterfalls and beaches", schedule: ["Early breakfast", "Seljalandsfoss waterfall", "Skogafoss waterfall", "Reynisfjara black beach", "Lunch", "Vik village", "Northern Lights hunt evening"], image: "https://images.unsplash.com/photo-1494500764479-0c8f2919a3d8?w=600&h=400&fit=crop&q=80" },
    { title: "Blue Lagoon", desc: "Geothermal relaxation", schedule: ["Late breakfast", "Blue Lagoon spa", "Lunch at lagoon", "Reykjavik exploration", "Hallgrimskirkja church", "Harpa Concert Hall", "Farewell dinner"], image: "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Bless Iceland", schedule: ["Final breakfast", "Last views", "Transfer to Keflavik"], image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=600&h=400&fit=crop&q=80" },
  ],
  zanzibar: [
    { title: "Arrival in Zanzibar", desc: "Karibu Zanzibar", schedule: ["Airport transfer", "Resort check-in", "Beach sunset", "Swahili dinner"], image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&h=400&fit=crop&q=80" },
    { title: "Stone Town", desc: "UNESCO heritage", schedule: ["Breakfast at resort", "Stone Town walking tour", "Slave market history", "Spice tour", "Lunch at local restaurant", "House of Wonders", "Sunset dhow cruise"], image: "https://images.unsplash.com/photo-1561919868-68ef2b8e4fb0?w=600&h=400&fit=crop&q=80" },
    { title: "Beach Paradise", desc: "Indian Ocean bliss", schedule: ["Breakfast at resort", "Beach relaxation", "Snorkeling trip", "Seafood lunch", "Spa treatment", "Sunset on beach", "Romantic dinner"], image: "https://images.unsplash.com/photo-1586699253884-e199770f63b9?w=600&h=400&fit=crop&q=80" },
    { title: "Marine Adventure", desc: "Ocean exploration", schedule: ["Early breakfast", "Mnemba Atoll trip", "Dolphin watching", "Snorkeling and diving", "Beach BBQ lunch", "Return to resort", "Farewell dinner"], image: "https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Kwaheri Zanzibar", schedule: ["Final breakfast", "Last beach walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1548277769-a0a60a8b9ecd?w=600&h=400&fit=crop&q=80" },
  ],
  jordan: [
    { title: "Arrival in Amman", desc: "Ahlan wa Sahlan", schedule: ["Airport transfer", "Hotel check-in", "Rainbow Street evening", "Jordanian dinner"], image: "https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=600&h=400&fit=crop&q=80" },
    { title: "Petra", desc: "Rose-red wonder", schedule: ["Early breakfast", "Drive to Petra", "The Siq entrance", "Treasury reveal", "Explore Petra", "Lunch", "Monastery climb", "Petra by Night"], image: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&h=400&fit=crop&q=80" },
    { title: "Wadi Rum", desc: "Desert adventure", schedule: ["Breakfast", "Drive to Wadi Rum", "Jeep desert tour", "Bedouin lunch", "Lawrence's Spring", "Sunset in desert", "Bedouin camp dinner"], image: "https://images.unsplash.com/photo-1548786811-dd6e453ccca7?w=600&h=400&fit=crop&q=80" },
    { title: "Dead Sea", desc: "Lowest point on Earth", schedule: ["Sunrise in desert", "Drive to Dead Sea", "Float in Dead Sea", "Mud treatment", "Lunch at resort", "Spa relaxation", "Return to Amman", "Farewell dinner"], image: "https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Ma'a salama Jordan", schedule: ["Final breakfast", "Last views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1548918901-9b31223c5c3a?w=600&h=400&fit=crop&q=80" },
  ],
  croatia: [
    { title: "Arrival in Dubrovnik", desc: "Dobrodosli u Hrvatsku", schedule: ["Airport transfer", "Hotel check-in", "Old Town evening walk", "Seafood dinner"], image: "https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&h=400&fit=crop&q=80" },
    { title: "Dubrovnik Old Town", desc: "Pearl of the Adriatic", schedule: ["Breakfast at hotel", "City walls walk", "Rector's Palace", "Lunch in Old Town", "Stradun shopping", "Cable car sunset", "Game of Thrones tour"], image: "https://images.unsplash.com/photo-1512495039889-52a3b799c9bc?w=600&h=400&fit=crop&q=80" },
    { title: "Islands & Coast", desc: "Adriatic beauty", schedule: ["Breakfast at hotel", "Boat to Lokrum Island", "Beach and nature", "Lunch on island", "Kayaking old town walls", "Sunset from Banje Beach", "Farewell dinner"], image: "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=600&h=400&fit=crop&q=80" },
    { title: "Day Trip", desc: "Beyond Dubrovnik", schedule: ["Breakfast at hotel", "Montenegro day trip or Elafiti Islands", "Kotor Bay or island hopping", "Lunch", "Scenic return", "Last Old Town stroll", "Traditional dinner"], image: "https://images.unsplash.com/photo-1580407196238-a5602de1d33f?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Dovidenja Croatia", schedule: ["Final breakfast", "Last Adriatic views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1596102971854-55fc8a6c8c78?w=600&h=400&fit=crop&q=80" },
  ],
  "costa rica": [
    { title: "Arrival in San Jose", desc: "Pura Vida", schedule: ["Airport transfer", "Hotel check-in", "City evening walk", "Costa Rican dinner"], image: "https://images.unsplash.com/photo-1518259102261-b40117eabbc9?w=600&h=400&fit=crop&q=80" },
    { title: "Arenal Volcano", desc: "Fire and water", schedule: ["Early breakfast", "Drive to La Fortuna", "Arenal Volcano views", "Hanging bridges walk", "Lunch with volcano views", "Hot springs evening", "Dinner at hot springs"], image: "https://images.unsplash.com/photo-1570737543098-0983d88f796d?w=600&h=400&fit=crop&q=80" },
    { title: "Rainforest Adventure", desc: "Wildlife and nature", schedule: ["Breakfast", "Zip line adventure", "Rainforest hike", "Lunch", "Wildlife spotting", "Waterfall visit", "Drive to coast", "Beach dinner"], image: "https://images.unsplash.com/photo-1559599746-8823b38544c6?w=600&h=400&fit=crop&q=80" },
    { title: "Beach Paradise", desc: "Pacific coast", schedule: ["Breakfast at hotel", "Beach relaxation", "Surfing or snorkeling", "Beachside lunch", "Manuel Antonio or Guanacaste", "Sunset on beach", "Farewell dinner"], image: "https://images.unsplash.com/photo-1535262412227-85541e910204?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Hasta luego Costa Rica", schedule: ["Final breakfast", "Last beach walk", "Transfer to airport"], image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop&q=80" },
  ],
  peru: [
    { title: "Arrival in Lima", desc: "Bienvenidos al Peru", schedule: ["Airport transfer", "Hotel check-in", "Miraflores evening walk", "Peruvian dinner"], image: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=600&h=400&fit=crop&q=80" },
    { title: "Fly to Cusco", desc: "Imperial city", schedule: ["Flight to Cusco", "Acclimatization", "Plaza de Armas", "San Pedro Market", "Coca tea", "Sacsayhuaman ruins", "Traditional dinner"], image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?w=600&h=400&fit=crop&q=80" },
    { title: "Sacred Valley", desc: "Inca heartland", schedule: ["Breakfast at hotel", "Ollantaytambo ruins", "Moray terraces", "Maras salt mines", "Traditional lunch", "Pisac market", "Return to Cusco"], image: "https://images.unsplash.com/photo-1568044852023-dd6b4e0a78b2?w=600&h=400&fit=crop&q=80" },
    { title: "Machu Picchu", desc: "Wonder of the world", schedule: ["Very early train", "Bus to Machu Picchu", "Guided tour", "Free exploration", "Lunch in Aguas Calientes", "Return to Cusco", "Farewell celebration"], image: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Hasta pronto Peru", schedule: ["Final breakfast", "Flight to Lima", "Transfer to airport"], image: "https://images.unsplash.com/photo-1580875636844-be4ace5813d4?w=600&h=400&fit=crop&q=80" },
  ],
  "new zealand": [
    { title: "Arrival in Auckland", desc: "Kia ora New Zealand", schedule: ["Airport transfer", "Hotel check-in", "Harbour evening walk", "Dinner at Viaduct"], image: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&h=400&fit=crop&q=80" },
    { title: "Auckland & Rotorua", desc: "City and geothermal", schedule: ["Breakfast at hotel", "Sky Tower views", "Drive to Rotorua", "Geothermal wonders", "Maori cultural experience", "Hangi dinner"], image: "https://images.unsplash.com/photo-1531804226530-70f8004aa44e?w=600&h=400&fit=crop&q=80" },
    { title: "Hobbiton & Nature", desc: "Middle Earth magic", schedule: ["Breakfast at hotel", "Hobbiton movie set tour", "Lunch at Green Dragon", "Waitomo Glowworm Caves", "Drive to destination", "Scenic dinner"], image: "https://images.unsplash.com/photo-1507097489474-f85e1d5a5d0e?w=600&h=400&fit=crop&q=80" },
    { title: "Queenstown", desc: "Adventure capital", schedule: ["Flight to Queenstown", "Gondola and views", "Lunch overlooking lake", "Jet boat or bungee", "Milford Sound option", "Fergburger dinner", "Stargazing"], image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&q=80" },
    { title: "Departure", desc: "Ka kite ano New Zealand", schedule: ["Final breakfast", "Last lake views", "Transfer to airport"], image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop&q=80" },
  ],
};

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

  // Generate airline options for flight selection
  const airlineFlightOptions = useMemo(() => {
    if (!pkg || !pkg.flight) return [];
    const baseFlight = pkg.flight;
    const basePrice = baseFlight.price;

    // Get destination info from static package data
    const packages = (top50PackagesData as { packages: StaticPackage[] }).packages;
    const staticPkg = packages.find((p) => p.id === packageId);
    const region = staticPkg?.region || "worldwide";
    const airportCode = staticPkg?.airportCode || baseFlight.outbound.destination;
    const destinationName = pkg.destination;

    return AIRLINE_OPTIONS.map((airline) =>
      generateFlightForAirline(basePrice, airline, "LHR", airportCode, destinationName, region)
    );
  }, [pkg, packageId]);

  // Use selected airline flight or default
  const selectedAirlineFlight = airlineFlightOptions[selectedAirlineIdx] || pkg?.flight;

  // Fetch hotel details on mount
  useEffect(() => {
    async function fetchHotelDetails() {
      if (!pkg?.hotel?.id) {
        setHotelDetailLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.set("currency", pkg.currency || "GBP");

        const res = await fetch(`/api/search/hotels/${encodeURIComponent(pkg.hotel.id)}?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status && json.data) {
            setHotelDetailData(json.data);
          }
        }
      } catch (error) {
        console.error("Error fetching hotel details:", error);
      } finally {
        setHotelDetailLoading(false);
      }
    }
    fetchHotelDetails();
  }, [pkg?.hotel?.id, pkg?.currency]);

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

  // Calculate hotel price with board type
  const hotelPriceWithBoard = Math.round(selectedHotel.price * (1 + boardTypeModifier / 100));
  const hotelPricePerNightWithBoard = Math.round(hotelPriceWithBoard / pkg.nights);

  // Calculate activity total
  const activityTotal = Object.values(selectedActivities).reduce((sum, price) => sum + price, 0);

  // Calculate total with selected options (including board type)
  const baseTotal = hotelPriceWithBoard + selectedFlight.price;
  const grandTotal = baseTotal + activityTotal;

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

                {/* Hotel Selector - 4 options like airline selector */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your hotel:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {hotelOptions.map((hotel, idx) => (
                      <button
                        key={hotel.id}
                        onClick={() => {
                          setSelectedHotelIdx(idx);
                          // Update board type to hotel's default
                          if ('defaultBoardType' in hotel) {
                            setSelectedBoardType(hotel.defaultBoardType as BoardType);
                          }
                        }}
                        className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                          selectedHotelIdx === idx
                            ? "border-[#003580] bg-white shadow-sm"
                            : "border-transparent bg-white/50 hover:border-gray-300 hover:bg-white"
                        }`}
                      >
                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5 mb-1">
                          {Array.from({ length: hotel.starRating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#feba02] text-[#feba02]" />
                          ))}
                        </div>
                        {/* Hotel Tier Badge */}
                        <div className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${
                          ('tier' in hotel && hotel.tier === 'luxury') ? 'bg-amber-100 text-amber-800' :
                          ('tier' in hotel && hotel.tier === 'deluxe') ? 'bg-purple-100 text-purple-800' :
                          ('tier' in hotel && hotel.tier === 'standard') ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {'tier' in hotel ? hotel.tier : 'standard'}
                        </div>
                        {/* Hotel Name */}
                        <div className="text-xs font-medium text-gray-900 text-center line-clamp-2 min-h-[32px]">
                          {hotel.name}
                        </div>
                        {/* Board Type */}
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {hotel.mealPlan}
                        </div>
                        {/* Price */}
                        <div className="text-sm font-bold text-[#003580] mt-1">
                          {formatPrice(hotel.price, currency)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {formatPrice(hotel.pricePerNight, currency)}/night
                        </div>
                        {/* Selected checkmark */}
                        {selectedHotelIdx === idx && (
                          <div className="absolute top-1 right-1">
                            <Check className="w-4 h-4 text-[#003580]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Select your preferred hotel tier above. Prices vary by hotel category.
                  </p>
                </div>

                {/* Board Type Options */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-green-600" />
                    Board basis:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {BOARD_OPTIONS.map((option) => {
                      const boardPrice = Math.round(selectedHotel.price * (1 + option.priceModifier / 100));
                      const priceDiff = boardPrice - selectedHotel.price;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelectedBoardType(option.type)}
                          className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                            selectedBoardType === option.type
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
                          <div className={`text-xs font-semibold mt-1 ${
                            priceDiff > 0 ? "text-orange-600" : "text-green-600"
                          }`}>
                            {priceDiff > 0 ? `+${formatPrice(priceDiff, currency)}` : "Included"}
                          </div>
                          {selectedBoardType === option.type && (
                            <Check className="w-3 h-3 text-green-600 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
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

                {/* Hotel name */}
                <h3 className="text-xl font-bold text-[#1a1a2e] mb-1">
                  {selectedHotel.name}
                </h3>

                {/* Address */}
                {selectedHotel.address && (
                  <div className="flex items-center gap-1 text-[#0071c2] text-sm">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{selectedHotel.address}</span>
                  </div>
                )}

                {/* Hotel Highlights */}
                {'highlights' in selectedHotel && selectedHotel.highlights && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(selectedHotel.highlights as string[]).map((highlight, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
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

                {/* Price and Actions */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(hotelPriceWithBoard, currency)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(hotelPricePerNightWithBoard, currency)} per night for {pkg.nights} nights
                    </div>
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

                {/* Airline Selector Dropdown */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose your airline:
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {airlineFlightOptions.map((flight, idx) => (
                      <button
                        key={flight.id}
                        onClick={() => setSelectedAirlineIdx(idx)}
                        className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
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
                          {flight.stops === 0 ? "Direct" : `${flight.stops} stop`}
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
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Prices vary by airline. Select your preferred carrier above.
                  </p>
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
                    <span className="font-medium">{formatPrice(selectedFlight.price, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      <Building className="h-3.5 w-3.5 inline mr-1" />
                      Hotel ({pkg.nights} nights)
                    </span>
                    <span className="font-medium">{formatPrice(hotelPriceWithBoard, currency)}</span>
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
