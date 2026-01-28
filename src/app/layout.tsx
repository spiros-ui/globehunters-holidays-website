import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Analytics, AnalyticsNoScript } from "@/components/analytics";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export const metadata: Metadata = {
  title: {
    default: "Globehunters - Premium Holiday Packages",
    template: "%s | Globehunters",
  },
  description:
    "Curated luxury holiday experiences across the world. Hand-crafted packages with hotels, sightseeing & experiences included.",
  keywords: [
    "holiday packages",
    "luxury travel",
    "flights",
    "hotels",
    "honeymoon",
    "group tours",
    "travel deals",
  ],
  authors: [{ name: "Globehunters" }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://www.globehunters.com",
    siteName: "Globehunters",
    title: "Globehunters - Premium Holiday Packages",
    description:
      "Curated luxury holiday experiences across the world. Hand-crafted packages with hotels, sightseeing & experiences included.",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "Globehunters - Premium Holiday Packages",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Globehunters - Premium Holiday Packages",
    description:
      "Curated luxury holiday experiences across the world. Hand-crafted packages with hotels, sightseeing & experiences included.",
    images: ["/opengraph.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <AnalyticsNoScript />
        <Analytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
