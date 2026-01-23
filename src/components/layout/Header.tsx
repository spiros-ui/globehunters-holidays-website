"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Honeymoon", href: "/honeymoon" },
  { name: "Group Tours", href: "/group-tours" },
  { name: "About Us", href: "/about" },
];

interface HeaderProps {
  phoneNumber?: string;
  displayNumber?: string;
}

export function Header({
  phoneNumber = "+442089444555",
  displayNumber = "020 8944 4555"
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">
      {/* Top bar */}
      <div className="border-b border-border bg-primary/5">
        <div className="container-wide py-2 flex items-center justify-between text-xs font-semibold tracking-wider text-primary/80">
          <span>ATOL PROTECTED | ABTA BONDED</span>
          <span>24/7 CUSTOMER SUPPORT</span>
        </div>
      </div>

      {/* Main header */}
      <nav className="container-wide" aria-label="Global">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="font-serif text-2xl text-primary">
                Globe<span className="text-accent">hunters</span>
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-foreground hover:text-accent transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Phone CTA */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-4">
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              onClick={() => {
                // Track phone click
                if (typeof window !== 'undefined' && window.gtag) {
                  window.gtag('event', 'phone_click', {
                    event_category: 'engagement',
                    event_label: 'header',
                  });
                }
              }}
            >
              <Phone className="h-4 w-4" />
              <span>{displayNumber}</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-50 bg-white transform transition-transform duration-300 ease-in-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
            <span className="font-serif text-2xl text-primary">
              Globe<span className="text-accent">hunters</span>
            </span>
          </Link>
          <button
            type="button"
            className="-m-2.5 rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="sr-only">Close menu</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 flow-root px-6">
          <div className="-my-6 divide-y divide-border">
            <div className="space-y-2 py-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-muted"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="py-6">
              <a
                href={`tel:${phoneNumber}`}
                className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-3 rounded-lg font-semibold"
              >
                <Phone className="h-5 w-5" />
                <span>Call {displayNumber}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
