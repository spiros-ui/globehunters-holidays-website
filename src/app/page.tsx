import Image from "next/image";
import Link from "next/link";
import { Phone, Shield, Clock, Award, Star, Users, Headphones, Lock } from "lucide-react";
import { SearchForm } from "@/components/search/SearchForm";
import { DestinationCard } from "@/components/results/DestinationCard";
import { PackageCard } from "@/components/results/PackageCard";
import { Button } from "@/components/ui/button";

// Static data for destinations
const destinations = [
  {
    slug: "maldives",
    name: "Maldives",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    startingPrice: 1299,
    airportCode: "MLE",
  },
  {
    slug: "dubai",
    name: "Dubai",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    startingPrice: 899,
    airportCode: "DXB",
  },
  {
    slug: "bali",
    name: "Bali",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    startingPrice: 749,
    airportCode: "DPS",
  },
  {
    slug: "europe",
    name: "Europe",
    image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
    startingPrice: 1599,
    airportCode: "CDG",
  },
  {
    slug: "thailand",
    name: "Thailand",
    image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&q=80",
    startingPrice: 699,
    airportCode: "BKK",
  },
  {
    slug: "australia",
    name: "Australia",
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
    startingPrice: 2199,
    airportCode: "SYD",
  },
];

// Static data for trending packages
const trendingPackages = [
  {
    id: "paris-swiss-alps",
    title: "Romantic Paris & Swiss Alps Getaway",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    destination: "Paris & Geneva",
    nights: 6,
    price: 2499,
    originalPrice: 2899,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.8,
  },
  {
    id: "maldives-water-villa",
    title: "Luxury Maldives Water Villa Escape",
    image: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
    destination: "Maldives",
    nights: 5,
    price: 3299,
    originalPrice: 3799,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.9,
  },
  {
    id: "bali-retreat",
    title: "Bali Jungle & Beach Retreat",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    destination: "Bali",
    nights: 7,
    price: 1899,
    originalPrice: 2299,
    includes: ["Flights", "Hotel", "Tours"],
    rating: 4.7,
  },
];

// Airline partners
const airlines = [
  { name: "British Airways", shortName: "BA" },
  { name: "Emirates", shortName: "Emirates" },
  { name: "Qatar Airways", shortName: "Qatar" },
  { name: "KLM", shortName: "KLM" },
  { name: "Singapore Airlines", shortName: "SIA" },
  { name: "Etihad", shortName: "Etihad" },
];

// Hotel partners
const hotelPartners = [
  { name: "Marriott", shortName: "Marriott" },
  { name: "Hilton", shortName: "Hilton" },
  { name: "IHG", shortName: "IHG" },
  { name: "Hyatt", shortName: "Hyatt" },
  { name: "Accor", shortName: "Accor" },
];

// Trust features
const trustFeatures = [
  {
    icon: Shield,
    title: "Trusted Experts",
    description: "14+ years of experience in travel",
  },
  {
    icon: Award,
    title: "Best Price Guarantee",
    description: "We match any comparable quote",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Expert help whenever you need it",
  },
  {
    icon: Lock,
    title: "Secure Booking",
    description: "Your payments are 100% protected",
  },
];

// Stats
const stats = [
  { value: "14+", label: "Years Experience" },
  { value: "50k+", label: "Happy Customers" },
  { value: "24/7", label: "Customer Support" },
  { value: "100%", label: "Secure Booking" },
];

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        </div>

        {/* Content */}
        <div className="container-wide relative z-10 py-20">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
            {/* Left side - Hero text */}
            <div className="max-w-xl lg:pt-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/80 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
                <span className="text-accent">★</span>
                Premium Holiday Experiences
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display italic text-white mb-6 leading-tight">
                Experience Luxury Holidays for Less
              </h1>

              {/* Subtext */}
              <p className="text-lg text-white/80 leading-relaxed max-w-lg">
                Where are you traveling next? Discover hand-crafted holiday packages with luxury hotels, curated sightseeing &amp; exclusive experiences included.
              </p>
            </div>

            {/* Right side - Search Form */}
            <div className="w-full lg:w-[480px] flex-shrink-0">
              <SearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* Why Travelers Choose Us */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-12">
            Why Travelers Choose Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 text-center shadow-card"
              >
                <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fly & Stay With The World's Best */}
      <section className="section">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-4">
            Fly & Stay With The World&apos;s Best
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            We partner with leading airlines and hotel brands to bring you the best travel experiences
          </p>

          {/* Airlines */}
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center mb-6">
              Airlines
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {airlines.map((airline) => (
                <div
                  key={airline.name}
                  className="px-6 py-3 bg-muted/50 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                  title={airline.name}
                >
                  <span className="text-lg font-semibold text-primary/80">{airline.shortName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hotels */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center mb-6">
              Hotel Partners
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {hotelPartners.map((hotel) => (
                <div
                  key={hotel.name}
                  className="px-6 py-3 bg-muted/50 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                  title={hotel.name}
                >
                  <span className="text-lg font-semibold text-primary/80">{hotel.shortName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Holiday Destinations */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-12">
            Popular Holiday Destinations
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.slug}
                slug={destination.slug}
                name={destination.name}
                image={destination.image}
                startingPrice={destination.startingPrice}
                currency="GBP"
                airportCode={destination.airportCode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Holiday Packages */}
      <section className="section">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-serif">Trending Holiday Packages</h2>
            <Button variant="outline" asChild>
              <Link href="/packages">View All Packages</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                id={pkg.id}
                title={pkg.title}
                image={pkg.image}
                destination={pkg.destination}
                nights={pkg.nights}
                price={pkg.price}
                originalPrice={pkg.originalPrice}
                currency="GBP"
                includes={pkg.includes}
                rating={pkg.rating}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Book With Confidence */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-4">
            Book With Confidence
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Your holiday is protected with us. We&apos;re ATOL protected and ABTA bonded.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="bg-white rounded-lg px-6 py-4 shadow-card flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">ATOL Protected</div>
                <div className="text-xs text-muted-foreground">License 12345</div>
              </div>
            </div>
            <div className="bg-white rounded-lg px-6 py-4 shadow-card flex items-center gap-3">
              <Award className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">ABTA Bonded</div>
                <div className="text-xs text-muted-foreground">Member Y1234</div>
              </div>
            </div>
            <div className="bg-white rounded-lg px-6 py-4 shadow-card flex items-center gap-3">
              <Lock className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">SSL Secured</div>
                <div className="text-xs text-muted-foreground">256-bit encryption</div>
              </div>
            </div>
            <div className="bg-white rounded-lg px-6 py-4 shadow-card flex items-center gap-3">
              <Star className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">Travel Awards</div>
                <div className="text-xs text-muted-foreground">Best Agency 2025</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="https://www.globehunters.com/testimonial.htm" target="_blank">
                Read Our Reviews
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Our Awards & Achievements */}
      <section className="section">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-12">
            Our Awards & Achievements
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12">
            {/* Placeholder for award logos */}
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-10 h-10 text-accent" />
              </div>
              <div className="text-sm font-medium">Best Travel Agency</div>
              <div className="text-xs text-muted-foreground">2025</div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-10 h-10 text-accent" />
              </div>
              <div className="text-sm font-medium">Customer Choice</div>
              <div className="text-xs text-muted-foreground">2024</div>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-10 h-10 text-accent" />
              </div>
              <div className="text-sm font-medium">50k+ Travelers</div>
              <div className="text-xs text-muted-foreground">Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience the Difference - Stats */}
      <section className="section bg-muted">
        <div className="container-wide">
          <h2 className="text-3xl font-serif text-center mb-12">
            Experience the Difference
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-serif text-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not Sure Where to Go? CTA */}
      <section className="relative py-20 bg-primary">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80"
            alt="Beach sunset"
            fill
            className="object-cover opacity-30"
          />
        </div>
        <div className="container-wide relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">
            Not sure where to go?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Let our travel experts help you plan your perfect holiday. Call us now or request a callback.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href="tel:+442089444555" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call 020 8944 4555
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20" asChild>
              <Link href="/contact">Plan My Holiday</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
