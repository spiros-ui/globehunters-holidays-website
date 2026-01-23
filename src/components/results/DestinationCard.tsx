"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import type { Currency } from "@/types";

interface DestinationCardProps {
  slug: string;
  name: string;
  image: string;
  startingPrice: number;
  currency: Currency;
  airportCode: string;
  className?: string;
}

export function DestinationCard({
  slug,
  name,
  image,
  startingPrice,
  currency,
  airportCode,
  className,
}: DestinationCardProps) {
  // Generate search URL with default dates
  const today = new Date();
  const departureDate = new Date(today);
  departureDate.setDate(departureDate.getDate() + 30);
  const returnDate = new Date(departureDate);
  returnDate.setDate(returnDate.getDate() + 7);

  const searchUrl = `/packages?origin=LON&destination=${airportCode}&departureDate=${departureDate.toISOString().split('T')[0]}&returnDate=${returnDate.toISOString().split('T')[0]}&adults=2&children=0&rooms=1`;

  return (
    <Link
      href={searchUrl}
      className={cn(
        "group relative block aspect-[4/5] rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 20vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Price badge */}
        <div className="self-start">
          <span className="inline-block bg-accent text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            Starting from {formatPrice(startingPrice, currency)}
          </span>
        </div>

        {/* Destination name */}
        <div>
          <h3 className="text-white text-xl font-serif mb-1">{name}</h3>
          <span className="text-white/80 text-sm font-medium group-hover:text-accent transition-colors">
            View Packages →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default DestinationCard;
