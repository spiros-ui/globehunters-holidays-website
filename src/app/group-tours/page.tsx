import Image from "next/image";
import Link from "next/link";
import { Phone, Users, Building, GraduationCap, Camera, PartyPopper, Check, Plane, Hotel, Utensils, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const tourTypes = [
  {
    icon: Building,
    title: "Corporate Retreats",
    description: "Team building experiences, conferences, and incentive trips tailored for businesses of all sizes.",
  },
  {
    icon: GraduationCap,
    title: "School & University Trips",
    description: "Educational tours, cultural exchanges, and adventure trips for students and academic groups.",
  },
  {
    icon: Camera,
    title: "Special Interest Groups",
    description: "Photography tours, culinary adventures, wellness retreats, and hobby-focused travel experiences.",
  },
  {
    icon: PartyPopper,
    title: "Celebration Tours",
    description: "Milestone birthdays, anniversary trips, family reunions, and wedding group travel.",
  },
];

const benefits = [
  "Dedicated group travel specialists",
  "Exclusive group rates & discounts",
  "Flexible payment plans",
  "24/7 support during your trip",
  "Customizable itineraries",
  "ATOL & IATA protected",
];

const inclusions = [
  { icon: Plane, title: "Flights", description: "Return flights from UK airports" },
  { icon: Hotel, title: "Accommodation", description: "Hand-picked hotels & resorts" },
  { icon: Utensils, title: "Meals", description: "Breakfast, lunch & dinner options" },
  { icon: MapPin, title: "Experiences", description: "Guided tours & activities" },
];

export default function GroupToursPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070"
            alt="Group tour"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="container-wide relative z-10 py-20">
          <div className="max-w-2xl">
            <p className="text-accent font-medium mb-4">Custom Group Travel Experiences</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
              Unforgettable Group Tours
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Whether you're planning a corporate retreat, school trip, family reunion, or special celebration,
              our expert team creates bespoke group travel experiences tailored to your needs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  020 8944 4555
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" asChild>
                <a href="mailto:groups@globehunters.com">
                  Chat With Our Team
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tour Types */}
      <section className="section bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Types of Group Tours</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From corporate events to family celebrations, we cater to all types of group travel
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tourTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-4">
                  <type.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                <p className="text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif mb-6">
                Why Choose Globehunters for Group Travel?
              </h2>
              <p className="text-muted-foreground mb-8">
                With over 14 years of experience organizing group tours worldwide, we understand that every group is unique.
                Our dedicated specialists work closely with you to create a seamless travel experience.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2032"
                alt="Group of travelers"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="section bg-primary text-white">
        <div className="container-wide">
          <h2 className="text-3xl md:text-4xl font-serif text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inclusions.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-white/80">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section">
        <div className="container-wide">
          <div className="bg-gradient-to-r from-accent to-accent/80 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">
              Ready to Plan Your Group Tour?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Tell us about your group, destination preferences, and travel dates.
              Our team will create a custom proposal just for you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  020 8944 4555
                </a>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" asChild>
                <a href="mailto:groups@globehunters.com">
                  Start a Conversation
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
