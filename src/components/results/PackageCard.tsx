"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plane, Building, Map, Clock } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Currency } from "@/types";

interface PackageCardProps {
  id: string;
  title: string;
  image: string;
  destination: string;
  destinationCode?: string;
  nights: number;
  price: number;
  originalPrice?: number;
  currency: Currency;
  includes: string[];
  rating?: number;
  className?: string;
}

export function PackageCard({
  id,
  title,
  image,
  destination,
  destinationCode,
  nights,
  price,
  originalPrice,
  currency,
  includes,
  rating,
  className,
}: PackageCardProps) {
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  // Generate search URL with dates starting from 2 weeks from now
  const generateSearchUrl = () => {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14); // 2 weeks from now
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + nights);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const params = new URLSearchParams({
      origin: "LHR",
      destination: destinationCode || destination,
      departureDate: formatDate(departureDate),
      returnDate: formatDate(returnDate),
      adults: "2",
      children: "0",
      rooms: "1",
      currency: currency,
    });

    return `/packages?${params.toString()}`;
  };

  return (
    <div className={cn("group card-hover flex flex-col", className)}>
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {discount > 0 && (
            <Badge variant="destructive" className="bg-red-500">
              {discount}% OFF
            </Badge>
          )}
          {rating && (
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              ★ {rating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex-1">
          {/* Title */}
          <h3 className="font-serif text-lg text-foreground mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {title}
          </h3>

          {/* Destination & Duration */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Map className="h-4 w-4" />
              {destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {nights} nights
            </span>
          </div>

          {/* Includes */}
          <div className="flex flex-wrap gap-2 mb-4">
            {includes.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
              >
                {item === "Flights" && <Plane className="h-3 w-3" />}
                {item === "Hotel" && <Building className="h-3 w-3" />}
                {item === "Tours" && <Map className="h-3 w-3" />}
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice, currency)}
              </span>
            )}
            <div className="text-2xl font-semibold text-foreground">
              {formatPrice(price, currency)}
            </div>
            <span className="text-xs text-muted-foreground">per person</span>
          </div>
          <Button asChild size="sm">
            <Link href={generateSearchUrl()}>View Details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PackageCard;
