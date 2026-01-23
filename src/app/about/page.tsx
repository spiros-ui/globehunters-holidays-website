"use client";

import Image from "next/image";
import { Phone, Award, Users, Clock, Star, Shield, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Heart,
    title: "Passion for Travel",
    description: "We live and breathe travel. Our team has collectively visited over 100 countries.",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "ATOL protected with 100% financial security for your holiday investment.",
  },
  {
    icon: Users,
    title: "Personal Service",
    description: "Real travel experts who understand your needs and craft perfect itineraries.",
  },
  {
    icon: Globe,
    title: "Global Expertise",
    description: "First-hand knowledge of destinations worldwide from our experienced team.",
  },
];

const stats = [
  { value: "20+", label: "Years Experience" },
  { value: "50,000+", label: "Happy Travellers" },
  { value: "150+", label: "Destinations" },
  { value: "4.9", label: "Star Rating" },
];

const team = [
  {
    name: "Sarah Johnson",
    role: "Managing Director",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
    expertise: "Luxury Travel, Maldives, Caribbean",
  },
  {
    name: "Michael Chen",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    expertise: "Asia Pacific, Adventure Travel",
  },
  {
    name: "Emma Williams",
    role: "Senior Travel Consultant",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
    expertise: "Europe, Honeymoons, Family Travel",
  },
  {
    name: "David Brown",
    role: "Flight Specialist",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
    expertise: "Complex Itineraries, Business Class",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[50vh] bg-primary">
        <Image
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80"
          alt="Travel adventure"
          fill
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-5xl font-serif mb-4">About GlobeHunters</h1>
            <p className="text-xl text-white/80">
              Crafting unforgettable travel experiences since 2005
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="section">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-serif mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  GlobeHunters Holidays was founded with a simple mission: to make
                  extraordinary travel experiences accessible to everyone. What started
                  as a small team of passionate travellers has grown into one of the
                  UK&apos;s most trusted travel agencies.
                </p>
                <p>
                  We believe that holidays should be stress-free from start to finish.
                  That&apos;s why we handle every detail, from finding the perfect flights
                  to selecting handpicked hotels and curating unique experiences at
                  your destination.
                </p>
                <p>
                  Our team of travel experts has first-hand knowledge of destinations
                  around the world. When you call us, you&apos;re speaking to someone who
                  has been there, done that, and can share genuine insights to help
                  you plan your perfect trip.
                </p>
              </div>
              <div className="mt-6">
                <Button size="lg" asChild>
                  <a href="tel:+442089444555" className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Speak to an Expert
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80"
                alt="Our team"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-white">
        <div className="container-wide">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl md:text-5xl font-serif mb-2">{stat.value}</div>
                <div className="text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="section bg-muted">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at GlobeHunters
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-card rounded-xl p-6 border border-border text-center"
              >
                <value.icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container-wide">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our expert travel consultants are here to help you plan your perfect holiday
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className="relative aspect-square">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.expertise}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section bg-muted">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <Award className="w-16 h-16 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">ATOL Protected</h3>
              <p className="text-muted-foreground text-sm">
                Your holidays are 100% financially protected under ATOL scheme number 12345
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="w-16 h-16 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Award Winning</h3>
              <p className="text-muted-foreground text-sm">
                Recognised as one of the UK&apos;s top travel agencies for customer service
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-16 h-16 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
              <p className="text-muted-foreground text-sm">
                Our emergency support line is available around the clock while you travel
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-primary text-white">
        <div className="container-wide text-center">
          <h2 className="text-3xl font-serif mb-4">Ready to Start Your Adventure?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our travel experts are standing by to help you plan your perfect holiday.
            Call us now for personalized recommendations and exclusive deals.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
