import Image from "next/image";
import Link from "next/link";
import { Phone, Shield, Award, Star, Headphones, Lock } from "lucide-react";
import { CollapsibleSearchSection } from "@/components/search/CollapsibleSearchSection";
import { Button } from "@/components/ui/button";
import { FeaturedPackagesHero } from "@/components/packages/FeaturedPackagesHero";
import { Top50PackagesSection } from "@/components/packages/Top50PackagesSection";
import top50PackagesData from "@/data/top50-packages.json";
import type { FeaturedPackage, Top50Package } from "@/components/packages/types";

// Transform all top 50 packages JSON data to FeaturedPackage type for hero carousel
const heroFeaturedPackages: FeaturedPackage[] = top50PackagesData.packages.map((pkg) => ({
  id: pkg.id,
  name: pkg.title,
  destination: pkg.destinationName,
  destinationCode: pkg.airportCode,
  image: pkg.heroImage,
  price: pkg.startingPrice,
  currency: pkg.currency as "GBP" | "USD" | "EUR",
  nights: pkg.nights,
  rating: pkg.rating,
}));

// Transform top50 packages JSON data to Top50Package type
const top50Packages: Top50Package[] = top50PackagesData.packages.map((pkg) => ({
  id: pkg.id,
  name: pkg.title,
  destination: pkg.destinationName,
  destinationCode: pkg.airportCode,
  image: pkg.heroImage,
  price: pkg.startingPrice,
  currency: pkg.currency as "GBP" | "USD" | "EUR",
  nights: pkg.nights,
  staticInclusions: pkg.highlights.map((h, idx) => ({
    id: `${pkg.id}-inc-${idx}`,
    name: h,
    icon: "tour" as const,
  })),
  flightOptions: [],
  hotelOptions: [],
}));

// Airline partners with IATA codes for logo fetching
const airlines = [
  { name: "British Airways", shortName: "BA", code: "BA" },
  { name: "Emirates", shortName: "Emirates", code: "EK" },
  { name: "Qatar Airways", shortName: "Qatar", code: "QR" },
  { name: "KLM", shortName: "KLM", code: "KL" },
  { name: "Singapore Airlines", shortName: "SIA", code: "SQ" },
  { name: "Etihad", shortName: "Etihad", code: "EY" },
];

// Hotel partners with brand colors
const hotelPartners = [
  { name: "Marriott", shortName: "Marriott", color: "#8B1A1A" },
  { name: "Hilton", shortName: "Hilton", color: "#003580" },
  { name: "IHG", shortName: "IHG", color: "#6B2D5B" },
  { name: "Hyatt", shortName: "Hyatt", color: "#1D4370" },
  { name: "Accor", shortName: "Accor", color: "#1E2A5E" },
];

// Trust features - consolidated into one section
const trustFeatures = [
  {
    icon: Shield,
    title: "ATOL & ABTA Protected",
    description: "Your holiday is financially protected",
  },
  {
    icon: Award,
    title: "14+ Years Experience",
    description: "Trusted by 50,000+ happy travelers",
  },
  {
    icon: Headphones,
    title: "24/7 Expert Support",
    description: "Help whenever you need it",
  },
  {
    icon: Lock,
    title: "Best Price Guarantee",
    description: "We match any comparable quote",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero Section - Text on LEFT, Featured Packages on RIGHT */}
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
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
        </div>

        {/* Content - Two column layout: text left, packages right */}
        <div className="container-wide relative z-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* LEFT SIDE - Hero Text Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-full mb-6">
                <span className="text-accent">★</span>
                Premium Holiday Experiences
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-display italic text-white mb-6 leading-tight">
                Experience Luxury Holidays for Less
              </h1>

              {/* Subtext */}
              <p className="text-lg lg:text-xl text-white/90 leading-relaxed mb-8">
                Discover our hand-picked holiday packages with luxury hotels, flights &amp; exclusive experiences included.
              </p>

              {/* CTA Button - scrolls to packages section */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild>
                  <a href="#top-packages">
                    Explore all of our premium packages
                  </a>
                </Button>
              </div>

              {/* Trust indicators - compact */}
              <div className="flex flex-wrap gap-6 text-white/80 text-sm">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ATOL Protected
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  14+ Years Experience
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  50,000+ Happy Travelers
                </span>
              </div>
            </div>

            {/* RIGHT SIDE - Featured Packages Hero Component */}
            <div className="hidden lg:block">
              <FeaturedPackagesHero
                packages={heroFeaturedPackages}
                title="Top Packages"
                subtitle="Handpicked for you"
                className="!py-0 [&_.container-wide]:!px-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Booking Engine Section - Below the Fold, collapsed by default */}
      <section className="section bg-muted">
        <div className="container-wide">
          <CollapsibleSearchSection />
        </div>
      </section>

      {/* Top 50 Packages Section */}
      <div id="top-packages">
        <Top50PackagesSection
          packages={top50Packages}
          title="Top 50 Holiday Packages"
          subtitle="Pre-built packages with real experiences - choose your perfect getaway"
          initialDisplayCount={6}
        />
      </div>

      {/* Why Travelers Choose Us */}
      <section className="section">
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
      <section className="section bg-muted">
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
                  className="px-8 py-4 bg-muted/50 rounded-lg opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center min-w-[120px] h-14"
                  title={airline.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://pics.avs.io/200/80/${airline.code}.png`}
                    alt={airline.name}
                    className="h-8 w-auto object-contain"
                  />
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
                  className="px-8 py-4 bg-muted/50 rounded-lg opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center min-w-[120px] h-14"
                  title={hotel.name}
                >
                  <span
                    className="text-lg font-bold tracking-wide"
                    style={{ color: hotel.color }}
                  >
                    {hotel.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Protection & Trust Badges - Consolidated */}
      <section className="py-8 bg-muted border-y border-border">
        <div className="container-wide">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">ATOL Protected</div>
                <div className="text-xs text-muted-foreground">License 12345</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">ABTA Bonded</div>
                <div className="text-xs text-muted-foreground">Member Y1234</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-accent" />
              <div>
                <div className="font-semibold text-sm">Secure Payments</div>
                <div className="text-xs text-muted-foreground">256-bit SSL</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="https://www.globehunters.com/testimonial.htm" target="_blank">
                Read Reviews &rarr;
              </Link>
            </Button>
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
