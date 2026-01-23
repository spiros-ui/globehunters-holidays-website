"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Phone, Plane, ArrowLeft, Loader2, Check, ArrowRight, Luggage, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

function FlightDetailContent({ id }: { id: string }) {
  const searchParams = useSearchParams();

  // Get flight data from query params
  const airlineCode = searchParams.get("airlineCode") || "";
  const airlineName = searchParams.get("airlineName") || "Airline";
  const totalFare = parseFloat(searchParams.get("totalFare") || "0");
  const stops = parseInt(searchParams.get("stops") || "0");
  const cabinType = searchParams.get("cabinType") || "Economy";
  const refundable = searchParams.get("refundable") === "true";
  const destination = searchParams.get("destination") || "";
  const origin = searchParams.get("origin") || "LON";
  const originName = searchParams.get("originName") || "London";
  const destinationName = searchParams.get("destinationName") || destination;
  const currency = (searchParams.get("currency") || "GBP") as Currency;
  const departureDate = searchParams.get("departureDate") || "";
  const returnDate = searchParams.get("returnDate") || "";
  const adults = parseInt(searchParams.get("adults") || "2");
  const children = parseInt(searchParams.get("children") || "0");

  const totalPassengers = adults + children;
  const totalPrice = totalFare * totalPassengers;

  return (
    <>
      {/* Back Navigation */}
      <div className="bg-muted py-4">
        <div className="container-wide">
          <Link
            href="/flights"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Flight Search
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-primary text-white py-12 md:py-16">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
              <Plane className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif">{airlineName}</h1>
              <p className="text-white/80">{airlineCode}</p>
            </div>
            <div className="flex gap-2 ml-auto">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {cabinType}
              </Badge>
              {refundable && (
                <Badge className="bg-green-500 text-white border-0">
                  Refundable
                </Badge>
              )}
            </div>
          </div>

          {/* Route Display */}
          <div className="flex items-center justify-center gap-4 md:gap-8 py-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{origin}</div>
              <div className="text-white/80 text-sm md:text-base">{originName}</div>
            </div>
            <div className="flex-1 max-w-xs flex items-center gap-2">
              <div className="flex-1 h-px bg-white/30" />
              <div className="flex flex-col items-center">
                <Plane className="w-6 h-6 rotate-90" />
                <span className="text-xs text-white/60 mt-1">
                  {stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="flex-1 h-px bg-white/30" />
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{destination}</div>
              <div className="text-white/80 text-sm md:text-base">{destinationName}</div>
            </div>
          </div>

          {/* Dates */}
          {(departureDate || returnDate) && (
            <div className="flex justify-center gap-8 text-center">
              {departureDate && (
                <div>
                  <div className="text-sm text-white/60">Outbound</div>
                  <div className="font-semibold">{departureDate}</div>
                </div>
              )}
              {returnDate && (
                <div>
                  <div className="text-sm text-white/60">Return</div>
                  <div className="font-semibold">{returnDate}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Flight Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Flight Info */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-serif mb-4">Flight Details</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Plane className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Airline</div>
                        <div className="font-semibold">{airlineName}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Luggage className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Cabin Class</div>
                        <div className="font-semibold">{cabinType}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Stops</div>
                        <div className="font-semibold">
                          {stops === 0 ? "Direct Flight" : `${stops} Stop${stops > 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Flexibility</div>
                        <div className="font-semibold">
                          {refundable ? "Refundable" : "Non-refundable"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-serif mb-4">Passengers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent">{adults}</div>
                    <div className="text-sm text-muted-foreground">Adult{adults > 1 ? "s" : ""}</div>
                  </div>
                  {children > 0 && (
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold text-accent">{children}</div>
                      <div className="text-sm text-muted-foreground">Child{children > 1 ? "ren" : ""}</div>
                    </div>
                  )}
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold text-accent">{totalPassengers}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-white border border-border rounded-xl p-6">
                <h2 className="text-xl font-serif mb-4">Typical Inclusions</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Checked baggage (varies by fare)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Carry-on luggage</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>In-flight entertainment</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Complimentary meals (long haul)</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  * Inclusions may vary by airline and fare type. Please call to confirm specific details.
                </p>
              </div>
            </div>

            {/* Right Column - Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white border border-border rounded-xl p-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-sm text-muted-foreground mb-1">
                    Price per person
                  </div>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {formatPrice(totalFare, currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Return flight
                  </div>
                </div>

                {totalPassengers > 1 && (
                  <div className="bg-muted rounded-lg p-4 mb-6 text-center">
                    <div className="text-sm text-muted-foreground">
                      Total for {totalPassengers} passenger{totalPassengers > 1 ? "s" : ""}
                    </div>
                    <div className="text-2xl font-bold">
                      {formatPrice(totalPrice, currency)}
                    </div>
                  </div>
                )}

                {refundable && (
                  <div className="flex items-center gap-2 text-green-600 mb-6 justify-center">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Refundable ticket</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Button size="lg" className="w-full" asChild>
                    <a href="tel:+442089444555" className="flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" />
                      Call to Book
                    </a>
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    020 8944 4555
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-3">Why Book With Us?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access to exclusive airline fares</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Flexible payment options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>ATOL protected bookings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>24/7 customer support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-12">
        <div className="container-wide text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">
            Ready to Book Your Flight?
          </h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Our flight specialists can help you find the best fares, upgrade options,
            and create complex multi-city itineraries.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="tel:+442089444555" className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call 020 8944 4555
            </a>
          </Button>
        </div>
      </section>
    </>
  );
}

export default function FlightDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <FlightDetailContent id={params.id} />
    </Suspense>
  );
}
