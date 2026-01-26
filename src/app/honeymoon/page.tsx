"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Heart, Sunset, Palmtree, Wine, Camera, Search, Calendar, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const honeymoonDestinations = [
  {
    id: "maldives",
    code: "MLE",
    name: "Maldives",
    title: "Maldives Overwater Villa Experience",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2065",
    price: 3499,
    description: "Private overwater villas with glass floors, personal butler service, and sunset dolphin cruises.",
  },
  {
    id: "bali",
    code: "DPS",
    name: "Bali, Indonesia",
    title: "Romantic Bali Retreat",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2038",
    price: 2299,
    description: "Luxurious jungle villas, couple spa treatments, and private temple ceremonies.",
  },
  {
    id: "santorini",
    code: "JTR",
    name: "Santorini, Greece",
    title: "Santorini Sunset Romance",
    image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=2071",
    price: 1899,
    description: "Cave suites with caldera views, wine tasting, and private yacht excursions.",
  },
  {
    id: "seychelles",
    code: "SEZ",
    name: "Seychelles",
    title: "Seychelles Paradise",
    image: "https://images.unsplash.com/photo-1589979481223-deb893043163?q=80&w=2074",
    price: 3799,
    description: "Secluded beach villas, giant tortoise encounters, and pristine coral reefs.",
  },
  {
    id: "mauritius",
    code: "MRU",
    name: "Mauritius",
    title: "Mauritius Beach Bliss",
    image: "https://images.unsplash.com/photo-1585152968992-d2b9444408cc?q=80&w=1974",
    price: 2599,
    description: "Beachfront suites, catamaran cruises, and candlelit dinners on the sand.",
  },
  {
    id: "paris",
    code: "CDG",
    name: "Paris, France",
    title: "Paris City of Love",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073",
    price: 1199,
    description: "Eiffel Tower views, Michelin-star dining, and Seine river cruises.",
  },
];

const features = [
  { icon: Sunset, title: "Sunset Dinners", description: "Private romantic dining experiences" },
  { icon: Palmtree, title: "Secluded Beaches", description: "Exclusive beach access for couples" },
  { icon: Wine, title: "Champagne Extras", description: "Complimentary welcome packages" },
  { icon: Camera, title: "Photo Shoots", description: "Professional couple photography" },
];

function HoneymoonContent() {
  const router = useRouter();
  const [destination, setDestination] = useState("MLE");
  const [departureDate, setDepartureDate] = useState("");
  const [duration, setDuration] = useState("7");

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate return date based on duration
    const departure = new Date(departureDate);
    departure.setDate(departure.getDate() + parseInt(duration));
    const returnDate = departure.toISOString().split('T')[0];

    const params = new URLSearchParams({
      origin: "LON",
      destination,
      departureDate,
      returnDate,
      adults: "2",
      children: "0",
      rooms: "1",
      currency: "GBP",
    });

    router.push(`/packages?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2070"
            alt="Romantic beach sunset"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="container-wide relative z-10 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent font-medium mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Romantic Getaways
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
                Unforgettable Honeymoons
              </h1>
              <p className="text-xl text-white/90 mb-6">
                Begin your forever with the honeymoon of your dreams. Curated romantic experiences
                in the world's most enchanting destinations.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="bg-white/20 text-white border-0 py-2 px-4">
                    <feature.icon className="w-4 h-4 mr-2" />
                    {feature.title}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Search Form */}
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-serif mb-4">Plan Your Honeymoon</h2>
              <p className="text-sm text-muted-foreground mb-6">Create unforgettable memories</p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Destination
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    <option value="MLE">Maldives</option>
                    <option value="DPS">Bali</option>
                    <option value="JTR">Santorini</option>
                    <option value="SEZ">Seychelles</option>
                    <option value="MRU">Mauritius</option>
                    <option value="CDG">Paris</option>
                    <option value="PHU">Phuket</option>
                    <option value="HNL">Hawaii</option>
                    <option value="FJI">Fiji</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Departure Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      min={today}
                      required
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Duration
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent appearance-none"
                    >
                      <option value="5">5 Nights</option>
                      <option value="7">7 Nights</option>
                      <option value="10">10 Nights</option>
                      <option value="14">14 Nights</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Find Honeymoon Packages
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Over 10,000 couples have booked with us
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="section">
        <div className="container-wide">
          <div className="text-center mb-12">
            <p className="text-accent font-medium mb-2">Inspiration for Your Love Story</p>
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Honeymoon Destinations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated collection of romantic destinations and find the perfect backdrop for your love story
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {honeymoonDestinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/packages?origin=LON&destination=${dest.code}&departureDate=&returnDate=&adults=2&children=0&rooms=1&currency=GBP`}
                className="group"
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="relative h-56">
                    <Image
                      src={dest.image}
                      alt={dest.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge className="bg-white/90 text-foreground mb-2">{dest.name}</Badge>
                      <h3 className="text-xl font-serif text-white">{dest.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {dest.description}
                    </p>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">From</span>
                        <div className="text-2xl font-bold text-accent">£{dest.price.toLocaleString()}</div>
                        <span className="text-xs text-muted-foreground">per couple</span>
                      </div>
                      <Button variant="outline" size="sm">
                        View Packages
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-gray-50">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">Why Choose Us for Your Honeymoon?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We specialize in creating bespoke honeymoon experiences that exceed expectations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary text-white">
        <div className="container-wide text-center">
          <Heart className="w-12 h-12 mx-auto mb-6 text-accent" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">
            Ready to Plan Your Dream Honeymoon?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Speak with our honeymoon specialists who will craft the perfect romantic getaway just for you.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

export default function HoneymoonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <HoneymoonContent />
    </Suspense>
  );
}
