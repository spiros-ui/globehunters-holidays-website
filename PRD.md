# GlobeHunters Holidays Website — Product Requirements Document

**Version:** 1.0
**Date:** 2026-01-22
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technical Stack](#3-technical-stack)
4. [Site Structure & Routes](#4-site-structure--routes)
5. [UI/UX Specification](#5-uiux-specification)
6. [API Integrations](#6-api-integrations)
7. [Data Models](#7-data-models)
8. [Core Features](#8-core-features)
9. [Admin Panel](#9-admin-panel)
10. [Analytics & Tracking](#10-analytics--tracking)
11. [Security & Performance](#11-security--performance)
12. [Deployment](#12-deployment)
13. [Implementation Phases](#13-implementation-phases)
14. [Acceptance Criteria](#14-acceptance-criteria)

---

## 1. Executive Summary

### 1.1 Objective

Rebuild the existing GlobeHunters holiday website (https://globehunter.replit.app) as a production-grade platform that:

- Maintains **pixel-identical UI/UX** to the current site
- Replaces mock data with **real inventory** from live APIs (flights, hotels, activities)
- Supports **multi-currency** (GBP, EUR, USD, AUD)
- Uses **click-to-call** as the primary conversion action
- Provides an **Admin panel** for content and pricing management

### 1.2 Business Context

| Property | Value |
|----------|-------|
| Organization | GlobeHunters (Travel Agency) |
| Primary Market | United Kingdom |
| Secondary Markets | US, Australia, EU |
| Base Currency | GBP |
| Conversion Model | Click-to-call (phone sales) |
| Primary Phone | 020 8944 4555 |

### 1.3 Key Decisions Summary

| Decision | Choice |
|----------|--------|
| Flight API | Duffel |
| Hotel API | Amadeus Self-Service |
| Activities API | Viator Affiliate |
| Hosting | Vercel |
| Database | Neon (Serverless Postgres) |
| Cache | Upstash (Serverless Redis) |
| Admin Auth | Google OAuth (@globehunters.com) |
| Analytics | GA4 + GTM + Meta Pixel + VoIPStudio |

---

## 2. Project Overview

### 2.1 Current Site Analysis

**URL:** https://globehunter.replit.app

**Technology:** React/Vite SPA with Tailwind CSS

**Fonts:**
- DM Serif Display (headings)
- Playfair Display (accent headings)
- Inter (body text)
- Poppins (UI elements)

**Color Palette:**
- Primary: `#1e3a5f` (dark navy)
- Accent: `#f97316` (orange/coral)
- Background: `#ffffff` (white)
- Text: `#1f2937` (dark gray)
- Muted: `#6b7280` (gray)

**Current Pages:**
- `/` - Homepage with search
- `/honeymoon` - Honeymoon packages
- `/group-tours` - Group tours
- `/about` - About us
- `/search` - Search results
- `/flight-search` - Flight search

### 2.2 Non-Negotiables

1. **UI Parity**: Layout, spacing, typography, and visual hierarchy must match exactly
2. **Real Data**: All prices, availability, and inventory from live APIs
3. **Click-to-Call**: Primary CTA on every page
4. **Multi-Currency**: Auto-detect + manual override
5. **Admin Control**: All content, phone numbers, and pricing rules editable

---

## 3. Technical Stack

### 3.1 Frontend

```
Framework:      Next.js 14+ (App Router)
Language:       TypeScript 5.x
Styling:        Tailwind CSS 3.x
Components:     Radix UI primitives + custom components
State:          Zustand (client) + React Query (server)
Forms:          React Hook Form + Zod validation
```

### 3.2 Backend

```
Runtime:        Node.js 20+ (Vercel serverless)
API:            Next.js API Routes + Server Actions
Database:       Neon (Serverless PostgreSQL)
ORM:            Drizzle ORM
Cache:          Upstash Redis
Auth:           NextAuth.js v5 (Google OAuth)
```

### 3.3 External Services

| Service | Purpose | Account Setup |
|---------|---------|---------------|
| Duffel | Flight search & booking | https://app.duffel.com/join |
| Amadeus | Hotel search | https://developers.amadeus.com |
| Viator | Activities/experiences | https://partnerresources.viator.com |
| Neon | PostgreSQL database | https://neon.tech |
| Upstash | Redis cache | https://upstash.com |
| Vercel | Hosting & deployment | https://vercel.com |
| Google Cloud | OAuth + Analytics | https://console.cloud.google.com |

### 3.4 Project Structure

```
globehunters-holidays-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Public pages
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── flights/
│   │   │   ├── hotels/
│   │   │   ├── packages/
│   │   │   └── destinations/
│   │   ├── (admin)/            # Admin panel
│   │   │   └── admin/
│   │   ├── api/                # API routes
│   │   │   ├── flights/
│   │   │   ├── hotels/
│   │   │   ├── packages/
│   │   │   └── admin/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── search/             # Search forms
│   │   ├── results/            # Result cards
│   │   ├── details/            # Detail pages
│   │   └── admin/              # Admin components
│   ├── lib/
│   │   ├── api/                # API client adapters
│   │   │   ├── duffel.ts
│   │   │   ├── amadeus.ts
│   │   │   └── viator.ts
│   │   ├── db/                 # Database
│   │   │   ├── schema.ts
│   │   │   └── queries.ts
│   │   ├── cache/              # Redis cache
│   │   ├── currency/           # FX conversion
│   │   └── pricing/            # Markup engine
│   ├── hooks/                  # React hooks
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types
├── public/
│   ├── images/
│   └── fonts/
├── drizzle/                    # DB migrations
├── .env.local                  # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Site Structure & Routes

### 4.1 Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Hero + search + destinations + packages |
| `/flights` | Flight Results | Search results list |
| `/flights/[id]` | Flight Detail | Single flight with full details |
| `/hotels` | Hotel Results | Search results list |
| `/hotels/[id]` | Hotel Detail | Single hotel with rooms/rates |
| `/packages` | Package Results | Combined flight+hotel+activity |
| `/packages/[id]` | Package Detail | Full package breakdown |
| `/destinations/[slug]` | Destination Landing | SEO page per destination |
| `/honeymoon` | Honeymoon Packages | Filtered packages |
| `/group-tours` | Group Tours | Filtered packages |
| `/about` | About Us | Company info |
| `/privacy` | Privacy Policy | Legal |
| `/terms` | Terms of Service | Legal |
| `/cookies` | Cookie Policy | Legal |

### 4.2 Admin Routes

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Overview + quick stats |
| `/admin/content` | Content Manager | Edit copy blocks |
| `/admin/destinations` | Destinations | Manage destination pages |
| `/admin/phone` | Phone Numbers | Configure CTAs |
| `/admin/pricing` | Pricing Rules | Markup/markdown rules |
| `/admin/scripts` | Script Manager | GTM, pixels, etc. |
| `/admin/users` | User Management | Admin users |
| `/admin/audit` | Audit Log | Change history |

### 4.3 API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/flights/search` | POST | Search flights |
| `/api/flights/[id]` | GET | Get flight details |
| `/api/hotels/search` | POST | Search hotels |
| `/api/hotels/[id]` | GET | Get hotel details |
| `/api/hotels/[id]/rooms` | GET | Get room availability |
| `/api/activities/search` | POST | Search activities |
| `/api/packages/search` | POST | Compose packages |
| `/api/packages/[id]` | GET | Get package details |
| `/api/currency/rates` | GET | Get FX rates |
| `/api/admin/*` | Various | Admin operations |

---

## 5. UI/UX Specification

### 5.1 Homepage Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ [Logo] [Honeymoon] [Group Tours] [About Us]    [📞 Phone]   │
├─────────────────────────────────────────────────────────────┤
│ HERO SECTION (Full-width background image)                   │
│                                                              │
│    "Experience Luxury Holidays for Less"                     │
│    "Find Your Perfect Escape"                                │
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ [Packages] [Flights] [Hotels]                       │  │
│    │                                                      │  │
│    │ [Departure ▼] [Destination] [Dates] [Guests ▼]      │  │
│    │                                                      │  │
│    │                              [🔍 Search Packages]    │  │
│    └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ WHY TRAVELERS CHOOSE US                                      │
│ [4 feature boxes with icons]                                 │
├─────────────────────────────────────────────────────────────┤
│ FLY & STAY WITH THE WORLD'S BEST                            │
│ [Airline logos row]                                          │
│ [Hotel partner logos row]                                    │
├─────────────────────────────────────────────────────────────┤
│ POPULAR HOLIDAY DESTINATIONS                                 │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │Maldives│ │ Dubai  │ │  Bali  │ │ Europe │ │Thailand│ ... │
│ │ $1,299 │ │  $899  │ │  $749  │ │ $1,599 │ │  $699  │     │
│ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
├─────────────────────────────────────────────────────────────┤
│ TRENDING HOLIDAY PACKAGES                                    │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │   [Image]    │ │   [Image]    │ │   [Image]    │          │
│ │ Paris & Alps │ │   Maldives   │ │     Bali     │          │
│ │    $2,499    │ │    $3,299    │ │    $1,899    │          │
│ │ [View Details]│ │ [View Details]│ │ [View Details]│         │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
├─────────────────────────────────────────────────────────────┤
│ BOOK WITH CONFIDENCE                                         │
│ [Trust badges: ATOL, ABTA, SSL, Awards]                     │
├─────────────────────────────────────────────────────────────┤
│ OUR AWARDS & ACHIEVEMENTS                                    │
│ [Award logos]                                                │
├─────────────────────────────────────────────────────────────┤
│ EXPERIENCE THE DIFFERENCE                                    │
│ [14+ Years] [50k+ Customers] [24/7 Support] [100% Secure]   │
├─────────────────────────────────────────────────────────────┤
│ NOT SURE WHERE TO GO? (Dark background CTA section)          │
│ [Plan My Holiday button]                                     │
├─────────────────────────────────────────────────────────────┤
│ FOOTER                                                       │
│ [Company info] [Links] [Destinations] [Contact]             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Component Specifications

#### Header Component
```typescript
interface HeaderProps {
  phone: string;           // From admin config
  currency: Currency;      // Current selected
  onCurrencyChange: (c: Currency) => void;
}

// Behavior:
// - Sticky on scroll
// - Mobile: hamburger menu
// - Phone number always visible
// - Currency selector in dropdown
```

#### Search Form Component
```typescript
interface SearchFormProps {
  type: 'packages' | 'flights' | 'hotels';
  defaultValues?: SearchParams;
  onSearch: (params: SearchParams) => void;
}

interface SearchParams {
  origin: string;          // Airport code (e.g., "LON")
  destination: string;     // Airport/city code
  departureDate: string;   // ISO date
  returnDate: string;      // ISO date
  adults: number;          // 1-9
  children: number;        // 0-8
  rooms?: number;          // For hotels: 1-5
  cabinClass?: CabinClass; // For flights
}
```

#### Destination Card Component
```typescript
interface DestinationCardProps {
  slug: string;
  name: string;
  image: string;
  startingPrice: number;
  currency: Currency;
  airportCode: string;
}

// Visual: Image background, name overlay, price badge
// Click: Navigate to /search with destination pre-filled
```

#### Package Card Component
```typescript
interface PackageCardProps {
  id: string;
  title: string;           // e.g., "Romantic Paris & Swiss Alps Getaway"
  image: string;
  nights: number;
  destination: string;
  price: number;
  currency: Currency;
  includes: string[];      // ["Flights", "Hotel", "Tours"]
}
```

### 5.3 Typography Scale

```css
/* Headings - DM Serif Display / Playfair Display */
h1: 48px / 56px line-height / font-weight: 400
h2: 36px / 44px line-height / font-weight: 400
h3: 24px / 32px line-height / font-weight: 500
h4: 20px / 28px line-height / font-weight: 500

/* Body - Inter */
body-lg: 18px / 28px line-height / font-weight: 400
body: 16px / 24px line-height / font-weight: 400
body-sm: 14px / 20px line-height / font-weight: 400

/* UI - Poppins */
button: 14px / font-weight: 600
label: 12px / font-weight: 500
caption: 11px / font-weight: 600 / letter-spacing: 0.05em
```

### 5.4 Spacing System

```css
/* Base: 4px */
space-1: 4px
space-2: 8px
space-3: 12px
space-4: 16px
space-5: 20px
space-6: 24px
space-8: 32px
space-10: 40px
space-12: 48px
space-16: 64px
space-20: 80px
```

---

## 6. API Integrations

### 6.1 Duffel (Flights)

**Documentation:** https://duffel.com/docs

**Setup:**
1. Create account at https://app.duffel.com/join
2. Generate API access token
3. Use sandbox for development (`https://api.duffel.com` with test token)
4. Switch to live token for production

**Environment Variables:**
```env
DUFFEL_ACCESS_TOKEN=duffel_test_xxxxx
DUFFEL_API_URL=https://api.duffel.com
```

**Key Endpoints:**

```typescript
// Search flights
POST /air/offer_requests
{
  "data": {
    "slices": [
      {
        "origin": "LHR",
        "destination": "CDG",
        "departure_date": "2026-03-15"
      },
      {
        "origin": "CDG",
        "destination": "LHR",
        "departure_date": "2026-03-22"
      }
    ],
    "passengers": [
      { "type": "adult" },
      { "type": "adult" }
    ],
    "cabin_class": "economy",
    "return_offers": true
  }
}

// Response includes offer_id for each flight option
// Use offer_id to get full details or create booking
```

**Rate Limits:**
- 100 requests/minute (sandbox)
- Higher limits in production (contact Duffel)

**Pricing:**
- Free sandbox access
- Pay-per-booking in production (no charge for searches)

**Adapter Implementation:**
```typescript
// src/lib/api/duffel.ts
import { Duffel } from '@duffel/api';

const duffel = new Duffel({
  token: process.env.DUFFEL_ACCESS_TOKEN!,
});

export async function searchFlights(params: FlightSearchParams) {
  const offerRequest = await duffel.offerRequests.create({
    slices: [
      {
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departureDate,
      },
      ...(params.returnDate ? [{
        origin: params.destination,
        destination: params.origin,
        departure_date: params.returnDate,
      }] : []),
    ],
    passengers: [
      ...Array(params.adults).fill({ type: 'adult' }),
      ...Array(params.children).fill({ type: 'child' }),
    ],
    cabin_class: params.cabinClass || 'economy',
    return_offers: true,
  });

  return normalizeFlightOffers(offerRequest.data.offers);
}
```

### 6.2 Amadeus (Hotels)

**Documentation:** https://developers.amadeus.com/self-service/category/hotels

**Setup:**
1. Create account at https://developers.amadeus.com
2. Create new app in dashboard
3. Get API Key and API Secret
4. Use test environment first

**Environment Variables:**
```env
AMADEUS_CLIENT_ID=xxxxx
AMADEUS_CLIENT_SECRET=xxxxx
AMADEUS_API_URL=https://test.api.amadeus.com
```

**Key Endpoints:**

```typescript
// 1. Get OAuth token
POST /v1/security/oauth2/token
grant_type=client_credentials&client_id=xxx&client_secret=xxx

// 2. Search hotels by city
GET /v1/reference-data/locations/hotels/by-city
?cityCode=PAR&radius=5&radiusUnit=KM

// 3. Search hotel offers
GET /v3/shopping/hotel-offers
?hotelIds=MCLONGHM,HILONPAK&adults=2&checkInDate=2026-03-15&checkOutDate=2026-03-22

// Response includes rates, room types, cancellation policies
```

**Important Notes:**
- Hotel images not available via Self-Service API (use Leonardo or fallback images)
- Rate limits: 10 requests/second in test, higher in production
- Prices in requested currency when available

**Adapter Implementation:**
```typescript
// src/lib/api/amadeus.ts
import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

export async function searchHotels(params: HotelSearchParams) {
  // First get hotel IDs for the city
  const hotelList = await amadeus.referenceData.locations.hotels.byCity.get({
    cityCode: params.destination,
    radius: 10,
    radiusUnit: 'KM',
  });

  const hotelIds = hotelList.data.slice(0, 20).map(h => h.hotelId);

  // Then get offers for those hotels
  const offers = await amadeus.shopping.hotelOffersSearch.get({
    hotelIds: hotelIds.join(','),
    adults: params.adults,
    checkInDate: params.checkInDate,
    checkOutDate: params.checkOutDate,
    currency: params.currency,
  });

  return normalizeHotelOffers(offers.data);
}
```

### 6.3 Viator (Activities)

**Documentation:** https://docs.viator.com/partner-api/

**Setup:**
1. Sign up at https://partnerresources.viator.com
2. Get Basic Access immediately (no approval needed)
3. Request Full Access for richer data
4. API key provided via email

**Environment Variables:**
```env
VIATOR_API_KEY=xxxxx
VIATOR_API_URL=https://api.viator.com/partner
```

**Key Endpoints:**

```typescript
// Search products by destination
GET /products/search
{
  "destId": 684,           // Paris destination ID
  "startDate": "2026-03-15",
  "endDate": "2026-03-22",
  "topX": "1-10",
  "currencyCode": "GBP"
}

// Get product details
GET /product/{productCode}

// Get availability
GET /availability/products/{productCode}
?startDate=2026-03-15&endDate=2026-03-22
```

**Destination IDs (Common):**
```typescript
const VIATOR_DESTINATIONS = {
  'PAR': 479,   // Paris
  'LON': 737,   // London
  'DXB': 828,   // Dubai
  'MLE': 923,   // Maldives
  'DPS': 755,   // Bali
  'BKK': 343,   // Bangkok
  'SYD': 357,   // Sydney
  // Add more as needed
};
```

**Adapter Implementation:**
```typescript
// src/lib/api/viator.ts
export async function searchActivities(params: ActivitySearchParams) {
  const destId = VIATOR_DESTINATIONS[params.destination];
  if (!destId) return [];

  const response = await fetch(`${VIATOR_API_URL}/products/search`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'exp-api-key': process.env.VIATOR_API_KEY!,
    },
    body: JSON.stringify({
      destId,
      startDate: params.startDate,
      endDate: params.endDate,
      topX: '1-10',
      currencyCode: params.currency,
    }),
  });

  const data = await response.json();
  return normalizeActivityProducts(data.products);
}
```

---

## 7. Data Models

### 7.1 Database Schema (Drizzle ORM)

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, jsonb, decimal, integer, boolean, uuid } from 'drizzle-orm/pg-core';

// ============ CONTENT MANAGEMENT ============

export const contentBlocks = pgTable('content_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),        // e.g., "hero.title", "footer.company"
  content: text('content').notNull(),
  type: text('type').notNull(),                // "text", "html", "json"
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'),
});

export const destinations = pgTable('destinations', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),       // "maldives", "paris"
  name: text('name').notNull(),
  airportCode: text('airport_code').notNull(), // "MLE", "CDG"
  country: text('country').notNull(),
  heroImage: text('hero_image'),
  description: text('description'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  startingPrice: decimal('starting_price', { precision: 10, scale: 2 }),
  currency: text('currency').default('GBP'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const destinationGallery = pgTable('destination_gallery', {
  id: uuid('id').primaryKey().defaultRandom(),
  destinationId: uuid('destination_id').references(() => destinations.id),
  imageUrl: text('image_url').notNull(),
  altText: text('alt_text'),
  sortOrder: integer('sort_order').default(0),
});

// ============ PHONE CONFIGURATION ============

export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),                // "UK Main", "US Support"
  number: text('number').notNull(),            // "+442089444555"
  displayNumber: text('display_number'),       // "020 8944 4555"
  country: text('country'),                    // "UK", "US", "AU"
  destinationSlug: text('destination_slug'),   // For destination-specific
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  trackingId: text('tracking_id'),             // For VoIPStudio
});

// ============ PRICING RULES ============

export const pricingRules = pgTable('pricing_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(),                // "percentage", "fixed", "tiered"
  vertical: text('vertical'),                  // "flights", "hotels", "activities", null=all
  destinationSlug: text('destination_slug'),   // null = all destinations
  providerCode: text('provider_code'),         // null = all providers

  // Rule values
  percentageMarkup: decimal('percentage_markup', { precision: 5, scale: 2 }),
  fixedMarkup: decimal('fixed_markup', { precision: 10, scale: 2 }),
  tieredRules: jsonb('tiered_rules'),          // [{min: 0, max: 500, markup: 10}, ...]

  // Constraints
  minMargin: decimal('min_margin', { precision: 10, scale: 2 }),
  roundTo: decimal('round_to', { precision: 5, scale: 2 }), // Round to nearest X

  // Validity
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  priority: integer('priority').default(0),    // Higher = takes precedence
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'),
});

// ============ SCRIPTS MANAGEMENT ============

export const scripts = pgTable('scripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  code: text('code').notNull(),
  placement: text('placement').notNull(),      // "head", "body_start", "body_end"
  environment: text('environment').notNull(), // "all", "production", "staging", "development"
  isActive: boolean('is_active').default(true),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'),
});

export const scriptVersions = pgTable('script_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scriptId: uuid('script_id').references(() => scripts.id),
  version: integer('version').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by'),
});

// ============ ADMIN USERS ============

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull(),                // "admin", "editor", "analyst"
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ AUDIT LOG ============

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(),            // "create", "update", "delete"
  resource: text('resource').notNull(),        // "destination", "pricing_rule", etc.
  resourceId: text('resource_id'),
  changes: jsonb('changes'),                   // {before: {...}, after: {...}}
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============ CACHE METADATA ============

export const cacheMetadata = pgTable('cache_metadata', {
  key: text('key').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 7.2 TypeScript Types

```typescript
// src/types/index.ts

// ============ CURRENCY ============

export type Currency = 'GBP' | 'EUR' | 'USD' | 'AUD';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface FXRate {
  from: Currency;
  to: Currency;
  rate: number;
  timestamp: Date;
}

// ============ SEARCH ============

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants?: number;
  rooms?: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

// ============ FLIGHTS ============

export interface FlightOffer {
  id: string;
  provider: 'duffel';
  providerOfferId: string;

  outbound: FlightSlice;
  inbound?: FlightSlice;

  totalPrice: Money;
  basePrice: Money;
  taxes: Money;

  passengers: PassengerPricing[];

  cabinClass: string;
  baggageIncluded: BaggageAllowance;

  bookingUrl?: string;
  expiresAt: Date;
}

export interface FlightSlice {
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;          // minutes
  segments: FlightSegment[];
  stops: number;
}

export interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  aircraft?: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Airline {
  code: string;
  name: string;
  logo?: string;
}

// ============ HOTELS ============

export interface HotelOffer {
  id: string;
  provider: 'amadeus';
  providerHotelId: string;

  name: string;
  description?: string;
  starRating: number;
  address: Address;
  coordinates?: Coordinates;

  images: HotelImage[];
  amenities: string[];

  rooms: RoomOffer[];

  checkIn: string;
  checkOut: string;

  lowestPrice: Money;

  reviewScore?: number;
  reviewCount?: number;
}

export interface RoomOffer {
  id: string;
  name: string;
  description?: string;
  bedType?: string;
  maxOccupancy: number;

  price: Money;
  pricePerNight: Money;

  cancellationPolicy: CancellationPolicy;
  mealPlan?: string;

  available: boolean;
}

export interface HotelImage {
  url: string;
  category?: string;
  alt?: string;
}

// ============ ACTIVITIES ============

export interface ActivityOffer {
  id: string;
  provider: 'viator';
  providerProductCode: string;

  title: string;
  description: string;
  shortDescription?: string;

  images: ActivityImage[];

  duration: string;          // "3 hours", "Full day"

  price: Money;
  pricePerPerson: Money;

  rating?: number;
  reviewCount?: number;

  categories: string[];
  tags: string[];            // "luxury", "romantic", "adventure"

  includes: string[];
  excludes: string[];

  meetingPoint?: string;

  bookingUrl?: string;
}

// ============ PACKAGES ============

export interface PackageOffer {
  id: string;
  title: string;             // "Wine Tasting Experience — 5 nights in Paris"
  theme: string;             // "Wine Tasting Experience"

  destination: Destination;
  nights: number;

  flight: FlightOffer;
  hotel: HotelOffer;
  activity?: ActivityOffer;

  totalPrice: Money;
  breakdown: {
    flight: Money;
    hotel: Money;
    activity?: Money;
    markup: Money;
  };

  includes: string[];

  images: string[];

  createdAt: Date;
  expiresAt: Date;
}

// ============ DESTINATION ============

export interface Destination {
  slug: string;
  name: string;
  country: string;
  airportCode: string;
  heroImage?: string;
  description?: string;
  startingPrice?: Money;
}
```

---

## 8. Core Features

### 8.1 Search Module

#### Flight Search
```typescript
// POST /api/flights/search
interface FlightSearchRequest {
  origin: string;           // "LON" or "LHR"
  destination: string;      // "PAR" or "CDG"
  departureDate: string;    // "2026-03-15"
  returnDate?: string;      // "2026-03-22"
  adults: number;
  children: number;
  infants?: number;
  cabinClass?: CabinClass;
  currency: Currency;
}

interface FlightSearchResponse {
  offers: FlightOffer[];
  meta: {
    searchId: string;
    totalResults: number;
    currency: Currency;
    cached: boolean;
    expiresAt: string;
  };
}
```

#### Hotel Search
```typescript
// POST /api/hotels/search
interface HotelSearchRequest {
  destination: string;      // City code or name
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  currency: Currency;

  filters?: {
    minStars?: number;
    maxPrice?: number;
    amenities?: string[];
  };
}
```

#### Package Composition
```typescript
// POST /api/packages/search
interface PackageSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  currency: Currency;
}

// Composition Logic:
// 1. Fetch top 5 flight offers (sorted by price/quality score)
// 2. Fetch top 10 hotel offers (sorted by rating/value)
// 3. Fetch top 5 activities (sorted by popularity + matching tags)
// 4. Create packages by pairing:
//    - Each flight with 2-3 compatible hotels
//    - Attach matching activity to each pair
// 5. Generate title from activity theme
// 6. Apply pricing rules and markup
// 7. Return top 12-20 packages
```

### 8.2 Multi-Currency System

```typescript
// src/lib/currency/index.ts

const SUPPORTED_CURRENCIES: Currency[] = ['GBP', 'EUR', 'USD', 'AUD'];

// Currency detection priority:
// 1. URL parameter (?currency=EUR)
// 2. Cookie (user preference)
// 3. Geo-IP detection
// 4. Default: GBP

export async function detectCurrency(request: Request): Promise<Currency> {
  // Check URL param
  const url = new URL(request.url);
  const urlCurrency = url.searchParams.get('currency');
  if (urlCurrency && SUPPORTED_CURRENCIES.includes(urlCurrency as Currency)) {
    return urlCurrency as Currency;
  }

  // Check cookie
  const cookieCurrency = getCookie(request, 'currency');
  if (cookieCurrency && SUPPORTED_CURRENCIES.includes(cookieCurrency as Currency)) {
    return cookieCurrency as Currency;
  }

  // Geo-IP detection
  const country = request.headers.get('cf-ipcountry') ||
                  request.headers.get('x-vercel-ip-country');

  const currencyByCountry: Record<string, Currency> = {
    'GB': 'GBP',
    'UK': 'GBP',
    'US': 'USD',
    'AU': 'AUD',
    // EU countries -> EUR
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
  };

  return currencyByCountry[country || ''] || 'GBP';
}

// FX Rate fetching (cache for 1 hour)
export async function getFXRates(baseCurrency: Currency): Promise<Map<Currency, number>> {
  const cacheKey = `fx_rates:${baseCurrency}`;
  const cached = await redis.get(cacheKey);
  if (cached) return new Map(Object.entries(JSON.parse(cached)));

  // Use exchangerate-api.com or similar
  const response = await fetch(
    `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
  );
  const data = await response.json();

  const rates = new Map<Currency, number>();
  SUPPORTED_CURRENCIES.forEach(currency => {
    rates.set(currency, data.rates[currency] || 1);
  });

  await redis.setex(cacheKey, 3600, JSON.stringify(Object.fromEntries(rates)));
  return rates;
}

// Convert price
export async function convertPrice(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) return amount;

  const rates = await getFXRates(from);
  const rate = rates.get(to) || 1;
  return Math.round(amount * rate * 100) / 100;
}
```

### 8.3 Pricing Engine

```typescript
// src/lib/pricing/engine.ts

export interface PricingContext {
  vertical: 'flights' | 'hotels' | 'activities' | 'packages';
  destinationSlug?: string;
  providerCode: string;
  basePrice: number;
  currency: Currency;
  bookingDate?: Date;
}

export async function applyPricingRules(ctx: PricingContext): Promise<{
  finalPrice: number;
  markup: number;
  ruleApplied: string;
}> {
  // Fetch applicable rules (ordered by priority DESC)
  const rules = await db.query.pricingRules.findMany({
    where: and(
      eq(pricingRules.isActive, true),
      or(
        isNull(pricingRules.vertical),
        eq(pricingRules.vertical, ctx.vertical)
      ),
      or(
        isNull(pricingRules.destinationSlug),
        eq(pricingRules.destinationSlug, ctx.destinationSlug)
      ),
      or(
        isNull(pricingRules.providerCode),
        eq(pricingRules.providerCode, ctx.providerCode)
      )
    ),
    orderBy: [desc(pricingRules.priority)],
  });

  if (rules.length === 0) {
    // Default: 8% markup
    const markup = ctx.basePrice * 0.08;
    return {
      finalPrice: roundPrice(ctx.basePrice + markup),
      markup,
      ruleApplied: 'default',
    };
  }

  const rule = rules[0]; // Highest priority
  let markup = 0;

  switch (rule.type) {
    case 'percentage':
      markup = ctx.basePrice * (Number(rule.percentageMarkup) / 100);
      break;

    case 'fixed':
      markup = Number(rule.fixedMarkup);
      break;

    case 'tiered':
      const tiers = rule.tieredRules as TieredRule[];
      const tier = tiers.find(t =>
        ctx.basePrice >= t.min && ctx.basePrice < t.max
      );
      if (tier) {
        markup = tier.isPercentage
          ? ctx.basePrice * (tier.value / 100)
          : tier.value;
      }
      break;
  }

  // Apply minimum margin
  if (rule.minMargin && markup < Number(rule.minMargin)) {
    markup = Number(rule.minMargin);
  }

  const finalPrice = roundPrice(
    ctx.basePrice + markup,
    Number(rule.roundTo) || 0.99
  );

  return {
    finalPrice,
    markup,
    ruleApplied: rule.name,
  };
}

function roundPrice(price: number, roundTo: number = 0.99): number {
  if (roundTo === 0) return Math.round(price * 100) / 100;

  // Round to nearest X.99
  return Math.floor(price) + roundTo;
}
```

### 8.4 Caching Strategy

```typescript
// src/lib/cache/index.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Cache TTLs
const CACHE_TTL = {
  FLIGHT_SEARCH: 5 * 60,        // 5 minutes
  HOTEL_SEARCH: 10 * 60,        // 10 minutes
  HOTEL_STATIC: 24 * 60 * 60,   // 24 hours
  ACTIVITY_SEARCH: 15 * 60,     // 15 minutes
  PACKAGE_SEARCH: 5 * 60,       // 5 minutes
  FX_RATES: 60 * 60,            // 1 hour
  DESTINATION_CONTENT: 60 * 60, // 1 hour
};

// Generate cache key from search params
function generateSearchKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key];
    return acc;
  }, {} as Record<string, any>);

  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(sorted))
    .digest('hex')
    .substring(0, 12);

  return `${prefix}:${hash}`;
}

export async function getCachedSearch<T>(
  type: 'flight' | 'hotel' | 'activity' | 'package',
  params: Record<string, any>
): Promise<T | null> {
  const key = generateSearchKey(type, params);
  const cached = await redis.get(key);
  return cached as T | null;
}

export async function setCachedSearch(
  type: 'flight' | 'hotel' | 'activity' | 'package',
  params: Record<string, any>,
  data: any
): Promise<void> {
  const key = generateSearchKey(type, params);
  const ttl = {
    flight: CACHE_TTL.FLIGHT_SEARCH,
    hotel: CACHE_TTL.HOTEL_SEARCH,
    activity: CACHE_TTL.ACTIVITY_SEARCH,
    package: CACHE_TTL.PACKAGE_SEARCH,
  }[type];

  await redis.setex(key, ttl, JSON.stringify(data));
}
```

### 8.5 Click-to-Call Implementation

```typescript
// src/components/PhoneCTA.tsx
'use client';

import { useCallback } from 'react';
import { trackPhoneClick } from '@/lib/analytics';

interface PhoneCTAProps {
  phoneNumber: string;
  displayNumber: string;
  context: {
    pageType: 'home' | 'flights' | 'hotels' | 'packages' | 'detail';
    itemId?: string;
    currency: Currency;
    searchQuery?: string;
  };
  variant?: 'header' | 'cta' | 'floating';
}

export function PhoneCTA({ phoneNumber, displayNumber, context, variant = 'cta' }: PhoneCTAProps) {
  const handleClick = useCallback(() => {
    // Track in GA4
    trackPhoneClick({
      event: 'phone_click',
      page_type: context.pageType,
      item_id: context.itemId,
      currency: context.currency,
      search_query: context.searchQuery,
      phone_variant: variant,
    });
  }, [context, variant]);

  const isMobile = typeof window !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (variant === 'header') {
    return (
      <a
        href={`tel:${phoneNumber}`}
        onClick={handleClick}
        className="flex items-center gap-2 text-primary font-semibold"
      >
        <PhoneIcon className="w-4 h-4" />
        <span>{displayNumber}</span>
      </a>
    );
  }

  return (
    <a
      href={`tel:${phoneNumber}`}
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition-colors"
    >
      <PhoneIcon className="w-5 h-5" />
      <span>{isMobile ? 'Call Now' : displayNumber}</span>
    </a>
  );
}
```

---

## 9. Admin Panel

### 9.1 Authentication

```typescript
// src/lib/auth/config.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          hd: 'globehunters.com', // Restrict to domain
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Check if user is in admin_users table
      const adminUser = await db.query.adminUsers.findFirst({
        where: and(
          eq(adminUsers.email, user.email!),
          eq(adminUsers.isActive, true)
        ),
      });
      return !!adminUser;
    },
    async session({ session, token }) {
      // Add role to session
      const adminUser = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, session.user.email!),
      });
      session.user.role = adminUser?.role || 'viewer';
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
});
```

### 9.2 Role-Based Access

```typescript
// src/lib/auth/permissions.ts

type Role = 'admin' | 'editor' | 'analyst';

const PERMISSIONS: Record<Role, string[]> = {
  admin: ['*'], // All permissions
  editor: [
    'content.read', 'content.write',
    'destinations.read', 'destinations.write',
    'phone.read', 'phone.write',
    'pricing.read', 'pricing.write',
    'scripts.read',
  ],
  analyst: [
    'content.read',
    'destinations.read',
    'phone.read',
    'pricing.read',
    'scripts.read',
    'audit.read',
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (rolePermissions.includes('*')) return true;
  return rolePermissions.includes(permission);
}

// Middleware for API routes
export function requirePermission(permission: string) {
  return async (req: Request) => {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!hasPermission(session.user.role, permission)) {
      return new Response('Forbidden', { status: 403 });
    }
    return null; // Continue
  };
}
```

### 9.3 Admin Pages Specification

#### Dashboard (`/admin`)
- Quick stats: Today's searches, Popular destinations, Active rules
- Recent audit log entries
- System status (API health, cache hit rate)

#### Content Manager (`/admin/content`)
- List all content blocks with search/filter
- Inline editing with rich text editor
- Preview changes before saving
- Version history per block

#### Destinations (`/admin/destinations`)
- Grid/list view of all destinations
- Add/edit destination form:
  - Basic info (name, slug, airport code, country)
  - Hero image upload
  - Description (rich text)
  - Gallery management
  - SEO fields
  - Starting price override
  - Active/inactive toggle
- Drag-and-drop reordering

#### Phone Numbers (`/admin/phone`)
- List all phone numbers
- Add/edit form:
  - Name, number, display format
  - Country assignment
  - Destination assignment (optional)
  - Tracking ID (VoIPStudio)
  - Default toggle
- Test dial button

#### Pricing Rules (`/admin/pricing`)
- List all rules with status indicators
- Add/edit rule form:
  - Name, type (percentage/fixed/tiered)
  - Vertical filter (flights/hotels/activities/all)
  - Destination filter
  - Provider filter
  - Markup values
  - Min margin, rounding
  - Date range validity
  - Priority
- Preview calculator: Enter base price → See final price
- Bulk import/export

#### Script Manager (`/admin/scripts`)
- List all scripts with environment badges
- Add/edit script form:
  - Name, description
  - Code editor with syntax highlighting
  - Placement (head/body_start/body_end)
  - Environment (all/production/staging/development)
  - Active toggle
- Version history with diff view
- Rollback button
- Preview in sandbox

#### User Management (`/admin/users`)
- List admin users
- Invite new user (sends email)
- Edit role
- Deactivate/reactivate

#### Audit Log (`/admin/audit`)
- Searchable/filterable log
- Filters: User, action, resource, date range
- Export to CSV
- Detail view with before/after diff

---

## 10. Analytics & Tracking

### 10.1 Google Analytics 4

```typescript
// src/lib/analytics/ga4.ts

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function initGA4(measurementId: string) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

// Event tracking
export function trackEvent(eventName: string, params: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// Predefined events
export function trackSearch(params: {
  search_type: 'flights' | 'hotels' | 'packages';
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  adults: number;
  children: number;
  currency: string;
}) {
  trackEvent('search', params);
}

export function trackViewItem(params: {
  item_type: 'flight' | 'hotel' | 'package';
  item_id: string;
  item_name: string;
  price: number;
  currency: string;
}) {
  trackEvent('view_item', {
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      price: params.price,
    }],
    currency: params.currency,
  });
}

export function trackPhoneClick(params: {
  page_type: string;
  item_id?: string;
  currency: string;
  search_query?: string;
  phone_variant: string;
}) {
  trackEvent('phone_click', {
    ...params,
    event_category: 'engagement',
    event_label: params.page_type,
  });
}
```

### 10.2 Google Tag Manager

```typescript
// src/lib/analytics/gtm.ts

export function initGTM(containerId: string) {
  const script = document.createElement('script');
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `;
  document.head.appendChild(script);
}

export function pushToDataLayer(data: Record<string, any>) {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
}
```

### 10.3 Meta Pixel

```typescript
// src/lib/analytics/meta.ts

export function initMetaPixel(pixelId: string) {
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, params);
  }
}
```

### 10.4 VoIPStudio Integration

```typescript
// src/lib/analytics/voipstudio.ts

// VoIPStudio call tracking integration
// Tracks which phone numbers receive calls and from which pages

export interface CallTrackingConfig {
  accountId: string;
  defaultNumber: string;
  dynamicNumberPool?: string[];
}

export function getTrackingNumber(
  config: CallTrackingConfig,
  context: {
    source?: string;
    medium?: string;
    campaign?: string;
    pageType: string;
    destination?: string;
  }
): string {
  // If using dynamic number pools, return tracking number
  // Otherwise return default with UTM parameters encoded

  // For now, return default number
  // VoIPStudio integration will be configured in their dashboard
  return config.defaultNumber;
}
```

---

## 11. Security & Performance

### 11.1 Security Measures

```typescript
// Security headers (next.config.js)
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

// Rate limiting for API routes
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  return { success, limit, reset, remaining };
}
```

### 11.2 Performance Optimizations

```typescript
// Image optimization
// next.config.js
module.exports = {
  images: {
    domains: [
      'images.unsplash.com',    // Placeholder images
      'content.r9cdn.net',      // Duffel airline logos
      'cf.bstatic.com',         // Hotel images (fallback)
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

// API response compression (automatic in Vercel)
// Static asset caching
// Cache-Control headers for static assets: public, max-age=31536000, immutable

// Database query optimization
// - Use indexes on frequently queried columns
// - Implement connection pooling via Neon's serverless driver
// - Use prepared statements

// Redis caching strategy
// - Cache search results with TTL
// - Cache static content (destinations, phone numbers)
// - Invalidate on admin updates
```

### 11.3 Error Handling

```typescript
// src/lib/errors.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class APIError extends AppError {
  constructor(message: string, provider: string) {
    super(message, `${provider.toUpperCase()}_ERROR`, 502);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

// Global error handler
export function handleError(error: Error) {
  console.error('[Error]', {
    name: error.name,
    message: error.message,
    stack: error.stack,
  });

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error);
  }
}

// API retry logic
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error('Unreachable');
}
```

---

## 12. Deployment

### 12.1 Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=https://holidays.globehunters.com
NEXT_PUBLIC_APP_ENV=production

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Cache (Upstash)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# Auth (Google OAuth)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://holidays.globehunters.com

# Flight API (Duffel)
DUFFEL_ACCESS_TOKEN=duffel_live_xxx

# Hotel API (Amadeus)
AMADEUS_CLIENT_ID=xxx
AMADEUS_CLIENT_SECRET=xxx

# Activities API (Viator)
VIATOR_API_KEY=xxx

# Analytics
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=xxxxxxxxxx

# VoIPStudio
VOIPSTUDIO_ACCOUNT_ID=xxx
```

### 12.2 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["lhr1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/refresh-cache",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 12.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 13. Implementation Phases

### Phase 0: Project Setup (Foundation)
- [ ] Initialize Next.js project with TypeScript
- [ ] Configure Tailwind CSS with custom theme
- [ ] Set up Drizzle ORM with Neon
- [ ] Set up Upstash Redis
- [ ] Configure ESLint, Prettier, Husky
- [ ] Set up Vercel project and environment variables
- [ ] Create base component library (matching existing site)

### Phase 1: UI Clone (Pixel Parity)
- [ ] Clone exact layout from globehunter.replit.app
- [ ] Implement all page components with static/mock data
- [ ] Match typography, colors, spacing exactly
- [ ] Implement responsive design
- [ ] Set up screenshot comparison testing
- [ ] Verify pixel parity on desktop and mobile

### Phase 2: API Adapters
- [ ] Implement Duffel flight adapter
- [ ] Implement Amadeus hotel adapter
- [ ] Implement Viator activities adapter
- [ ] Create normalized data types
- [ ] Implement caching layer
- [ ] Add error handling and retries
- [ ] Write adapter tests

### Phase 3: Currency & Pricing
- [ ] Implement currency detection
- [ ] Implement FX rate fetching and caching
- [ ] Build pricing rules engine
- [ ] Create admin pricing rules UI
- [ ] Test markup calculations
- [ ] Add currency selector to header

### Phase 4: Search & Results
- [ ] Wire up flight search with real API
- [ ] Wire up hotel search with real API
- [ ] Implement package composition logic
- [ ] Build results pages with filters/sorting
- [ ] Implement pagination/infinite scroll
- [ ] Add loading states and error handling

### Phase 5: Detail Pages
- [ ] Build flight detail page (rich content)
- [ ] Build hotel detail page (rooms, amenities, gallery)
- [ ] Build package detail page (itinerary breakdown)
- [ ] Implement click-to-call CTAs throughout
- [ ] Add similar/related items sections

### Phase 6: Analytics & Tracking
- [ ] Integrate GA4 with all events
- [ ] Set up GTM container
- [ ] Add Meta Pixel
- [ ] Configure VoIPStudio tracking
- [ ] Test all conversion tracking
- [ ] Set up dashboards in GA4

### Phase 7: Admin Panel
- [ ] Implement Google OAuth for admin
- [ ] Build admin dashboard
- [ ] Build content manager
- [ ] Build destinations manager
- [ ] Build phone numbers manager
- [ ] Build pricing rules manager
- [ ] Build script manager
- [ ] Build user management
- [ ] Implement audit logging

### Phase 8: Hardening
- [ ] Add rate limiting
- [ ] Implement security headers
- [ ] Add error boundaries
- [ ] Set up Sentry error tracking
- [ ] Write E2E tests (Playwright)
- [ ] Perform load testing
- [ ] Security audit
- [ ] Performance optimization

### Phase 9: Launch
- [ ] Final QA on staging
- [ ] DNS configuration
- [ ] SSL verification
- [ ] Launch to production
- [ ] Monitor for issues
- [ ] Document operations runbook

---

## 14. Acceptance Criteria

### Functional Requirements

- [ ] Homepage loads with all sections matching original design
- [ ] Search form submits and returns real flight/hotel/package data
- [ ] Results pages display with filters and sorting working
- [ ] Detail pages show comprehensive information
- [ ] Click-to-call works on mobile (initiates call) and desktop (shows number)
- [ ] Currency auto-detects and can be manually changed
- [ ] All prices display in selected currency with correct conversion
- [ ] Admin panel accessible only to @globehunters.com accounts
- [ ] Admin can edit all content blocks
- [ ] Admin can manage destinations with images
- [ ] Admin can configure phone numbers
- [ ] Admin can create/edit pricing rules
- [ ] Admin can manage tracking scripts
- [ ] All changes logged in audit trail

### Non-Functional Requirements

- [ ] Page load time < 3 seconds on 3G
- [ ] Lighthouse score > 90 for Performance
- [ ] Lighthouse score > 90 for Accessibility
- [ ] API response time < 2 seconds for searches
- [ ] 99.9% uptime target
- [ ] Mobile responsive on all pages
- [ ] Works on Chrome, Firefox, Safari, Edge (latest 2 versions)

### Testing Requirements

- [ ] Unit tests for pricing engine
- [ ] Unit tests for currency conversion
- [ ] Integration tests for API adapters
- [ ] E2E tests for critical user flows
- [ ] Visual regression tests for UI parity
- [ ] Load tests for search endpoints

---

## Appendix A: API Signup Links

| Service | Signup URL | Notes |
|---------|------------|-------|
| Duffel | https://app.duffel.com/join | Instant sandbox access |
| Amadeus | https://developers.amadeus.com | Free test environment |
| Viator | https://partnerresources.viator.com | Basic access immediate |
| Neon | https://neon.tech | Free tier available |
| Upstash | https://upstash.com | Free tier available |
| Vercel | https://vercel.com | Free tier available |

## Appendix B: Reference Screenshots

Screenshots saved to:
- `/homepage_full.png` - Full page screenshot
- `/homepage_viewport.png` - Above-the-fold view

## Appendix C: Color Palette (Exact)

```css
:root {
  --primary: #1e3a5f;
  --primary-foreground: #ffffff;
  --accent: #f97316;
  --accent-foreground: #ffffff;
  --background: #ffffff;
  --foreground: #1f2937;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --border: #e5e7eb;
  --ring: #f97316;
}
```

---

*Document Version: 1.0*
*Created: 2026-01-22*
*Status: Ready for Implementation*
