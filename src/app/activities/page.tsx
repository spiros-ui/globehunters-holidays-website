"use client";

import { Suspense } from "react";
import { Phone, Loader2, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/SearchForm";

function ActivitiesContent() {
  return (
    <>
      {/* Search Form */}
      <section className="bg-primary py-8">
        <div className="container-wide">
          <SearchForm defaultType="packages" />
        </div>
      </section>

      {/* Activities Coming Soon */}
      <section className="section">
        <div className="container-wide">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-[#003580]/10 rounded-full flex items-center justify-center">
                <Compass className="h-8 w-8 text-[#003580]" />
              </div>
            </div>
            <h1 className="text-3xl font-serif mb-4">Activities & Experiences</h1>
            <p className="text-muted-foreground text-lg mb-8">
              From sunset cruises to cultural tours, our travel experts can arrange unforgettable
              activities at your destination. Call us to add tours and experiences to your holiday package.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild>
                <a href="tel:+442089444555" className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call 020 8944 4555
                </a>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <MapPin className="h-6 w-6 text-[#003580] mb-3" />
                <h3 className="font-semibold mb-2">Local Tours</h3>
                <p className="text-sm text-muted-foreground">
                  Guided city tours, cultural experiences, and historical site visits curated by local experts.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Compass className="h-6 w-6 text-[#003580] mb-3" />
                <h3 className="font-semibold mb-2">Adventure</h3>
                <p className="text-sm text-muted-foreground">
                  Water sports, hiking, desert safaris, and outdoor adventures tailored to your interests.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <Phone className="h-6 w-6 text-[#003580] mb-3" />
                <h3 className="font-semibold mb-2">Custom Packages</h3>
                <p className="text-sm text-muted-foreground">
                  Speak to our team to add activities to any flight and hotel package at the best prices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <ActivitiesContent />
    </Suspense>
  );
}
