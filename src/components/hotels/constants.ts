import { Coffee, Check, Waves, Wifi, ParkingCircle } from "lucide-react";

// Booking.com color constants
export const BOOKING_BLUE = "#003580";
export const BOOKING_BLUE_LIGHT = "#0071c2";
export const BOOKING_GREEN = "#008009";
export const BOOKING_ORANGE = "#ff6600";
export const GH_ORANGE = "#f97316"; // GlobeHunters brand orange for CTAs

// Default hotel placeholder image
export const HOTEL_PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80";

// Popular filter options
export const POPULAR_FILTERS = [
  { id: "breakfast", label: "Breakfast included", icon: Coffee },
  { id: "freeCancellation", label: "Free cancellation", icon: Check },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "wifi", label: "Free WiFi", icon: Wifi },
  { id: "parking", label: "Parking", icon: ParkingCircle },
];

// Premium amenities for "Popular" badge
export const PREMIUM_AMENITIES = ["Swimming pool", "Spa", "Restaurant", "Fitness center", "Beach"];

// Sustainability keywords
export const SUSTAINABILITY_KEYWORDS = ["solar", "eco", "sustainable", "green", "electric vehicle", "ev charging", "carbon", "environmental"];
