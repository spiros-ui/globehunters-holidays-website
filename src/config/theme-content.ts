// Theme-based selling descriptions and content

export const THEME_SELLING_POINTS: Record<string, {
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
export const THEME_DESCRIPTIONS: Record<string, string> = {
  cultural: "Immerse yourself in local traditions, historic landmarks, and authentic experiences that reveal the soul of your destination.",
  adventure: "Push your boundaries with thrilling activities and exciting excursions that create unforgettable memories.",
  romantic: "Create magical moments together in beautiful settings designed for couples seeking connection and intimacy.",
  family: "Enjoy quality time with activities and accommodations perfect for travelers of all ages.",
  luxury: "Indulge in premium experiences, five-star service, and exclusive access to the finest your destination offers.",
  relaxation: "Unwind in tranquil settings with spa treatments, beautiful beaches, and a pace designed for restoration.",
  beach: "Sink your toes in pristine sand, swim in crystal waters, and enjoy the perfect coastal escape.",
  city: "Explore vibrant urban landscapes, world-class dining, and the energy of metropolitan life.",
};
