// Hotel tier configuration and comprehensive details

import type { BoardType } from "./airline-options";

export interface HotelOption {
  id: string;
  tier: "budget" | "standard" | "deluxe" | "luxury";
  namePrefix: string;
  nameSuffix: string;
  stars: number;
  defaultBoardType: BoardType;
  priceModifier: number;
  roomType: string;
  highlights: string[];
}

export const HOTEL_TIER_OPTIONS: HotelOption[] = [
  {
    id: "budget",
    tier: "budget",
    namePrefix: "",
    nameSuffix: "City Hotel",
    stars: 3,
    defaultBoardType: "Room Only",
    priceModifier: -30,
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
    priceModifier: 0,
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
    priceModifier: 40,
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
    priceModifier: 90,
    roomType: "Presidential Suite",
    highlights: ["Private beach", "Michelin dining", "Chauffeur service", "VIP experiences"],
  },
];

export interface ComprehensiveHotelDetails {
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

export const TIER_HOTEL_DETAILS: Record<string, ComprehensiveHotelDetails> = {
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

export const DESTINATION_HOTEL_NAMES: Record<string, { budget: string; standard: string; deluxe: string; luxury: string }> = {
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

export const TIER_PLACEHOLDER_IMAGES: Record<string, string[]> = {
  budget: [
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=640&h=400&fit=crop&q=80",
  ],
  standard: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=640&h=400&fit=crop&q=80",
  ],
  deluxe: [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=640&h=400&fit=crop&q=80",
  ],
  luxury: [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=640&h=400&fit=crop&q=80",
    "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=640&h=400&fit=crop&q=80",
  ],
};
