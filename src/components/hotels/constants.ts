import { Coffee, Check, Waves, Wifi, ParkingCircle } from "lucide-react";

// Booking.com color constants
export const BOOKING_BLUE = "#003580";
export const BOOKING_BLUE_LIGHT = "#0071c2";
export const BOOKING_GREEN = "#008009";
export const BOOKING_ORANGE = "#ff6600";
export const GH_ORANGE = "#f97316"; // GlobeHunters brand orange for CTAs

// Default hotel placeholder image
export const HOTEL_PLACEHOLDER = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80";

// Category-based placeholder images for variety
export const HOTEL_PLACEHOLDERS: Record<string, string> = {
  resort: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=640&h=400&fit=crop&q=80",
  city: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=640&h=400&fit=crop&q=80",
  apartment: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=640&h=400&fit=crop&q=80",
  boutique: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=640&h=400&fit=crop&q=80",
  beach: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=640&h=400&fit=crop&q=80",
  luxury: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&h=400&fit=crop&q=80",
  budget: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=640&h=400&fit=crop&q=80",
  villa: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=640&h=400&fit=crop&q=80",
  hostel: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=640&h=400&fit=crop&q=80",
  default: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80",
};

// Review score labels (Booking.com style)
export function getReviewLabel(score: number): string {
  if (score >= 9.0) return "Exceptional";
  if (score >= 8.5) return "Wonderful";
  if (score >= 8.0) return "Very Good";
  if (score >= 7.0) return "Good";
  if (score >= 6.0) return "Pleasant";
  return "Review score";
}

// Review score badge background color
export function getReviewColor(score: number): string {
  if (score >= 9.0) return "#003580";
  if (score >= 8.0) return "#003580";
  if (score >= 7.0) return "#003580";
  return "#547fa5";
}

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
