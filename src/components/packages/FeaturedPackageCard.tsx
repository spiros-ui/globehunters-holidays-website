"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Map, Clock } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FeaturedPackage } from "./types";

interface FeaturedPackageCardProps {
  package: FeaturedPackage;
  className?: string;
  priority?: boolean;
}

/**
 * Card component for Top 15 featured packages in hero area
 * Optimized for fast loading with minimal content
 */
export function FeaturedPackageCard({
  package: pkg,
  className,
  priority = false,
}: FeaturedPackageCardProps) {
  const discount = pkg.originalPrice
    ? Math.round((1 - pkg.price / pkg.originalPrice) * 100)
    : 0;

  // Generate search URL with dates starting from 2 weeks from now
  const generateSearchUrl = () => {
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 14);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + pkg.nights);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const params = new URLSearchParams({
      origin: "LHR",
      destination: pkg.destinationCode,
      departureDate: formatDate(departureDate),
      returnDate: formatDate(returnDate),
      adults: "2",
      children: "0",
      rooms: "1",
      currency: pkg.currency,
    });

    return `/packages/${pkg.id}?${params.toString()}`;
  };

  return (
    <Link
      href={generateSearchUrl()}
      className={cn(
        "group relative block overflow-hidden rounded-lg card-hover",
        className
      )}
    >
      {/* Image with gradient overlay - compact square aspect ratio */}
      <div className="relative aspect-square">
        <Image
          src={pkg.image}
          alt={pkg.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {discount > 0 && (
            <Badge variant="destructive" className="bg-red-500">
              {discount}% OFF
            </Badge>
          )}
          {pkg.rating && (
            <Badge variant="secondary" className="bg-white/90 text-foreground">
              <span className="text-accent">★</span> {pkg.rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Price */}
          <div className="mb-2">
            {pkg.originalPrice && (
              <span className="text-sm text-white/70 line-through mr-2">
                {formatPrice(pkg.originalPrice, pkg.currency)}
              </span>
            )}
            <span className="text-xl font-semibold text-white">
              {formatPrice(pkg.price, pkg.currency)}
            </span>
            <span className="text-xs text-white/80 ml-1">pp</span>
          </div>

          {/* Package name */}
          <h3 className="font-serif text-lg text-white mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {pkg.name}
          </h3>

          {/* Destination & Duration */}
          <div className="flex items-center gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Map className="h-3.5 w-3.5" />
              {pkg.destination}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {pkg.nights} nights
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default FeaturedPackageCard;
