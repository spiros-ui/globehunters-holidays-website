# GlobeHunters Holidays Website - Executive Summary

**Document Version:** 1.0
**Generated:** 2026-02-11
**Codebase Root:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Data Architecture](#2-data-architecture)
3. [API Integrations - Deep Dive](#3-api-integrations---deep-dive)
4. [Hotel Selection Flow - Step by Step](#4-hotel-selection-flow---step-by-step)
5. [Pricing Logic](#5-pricing-logic)
6. [Flight Selection Flow](#6-flight-selection-flow)
7. [Search & Booking Flow](#7-search--booking-flow)
8. [Key Configuration Maps](#8-key-configuration-maps)
9. [Deployment & Infrastructure](#9-deployment--infrastructure)
10. [Known Issues & Recent Changes](#10-known-issues--recent-changes)

---

## 1. Project Overview

### 1.1 What is GlobeHunters Holidays?

GlobeHunters Holidays is a UK-based travel agency website that sells curated holiday packages combining flights, hotels, and activities. The site targets British travellers and presents "Top 50" pre-configured holiday packages covering 48+ destinations across Europe, Asia, the Middle East, the Americas, Africa, and Oceania.

The website serves three primary functions:

1. **Package Browsing** - Users browse curated "Top 50" holiday packages with pre-set destinations, hero images, and starting prices. Each package page shows flight options, hotel tiers, and local activities.

2. **Live Search** - Users can search for flights, hotels, and full packages using real-time API data from Duffel (flights), RateHawk (hotels), HotelBeds (hotels), and Travelpayouts (hotels).

3. **Lead Generation** - The site is not a direct-booking platform. Users are guided to call GlobeHunters' phone line (020 8944 4555) or contact via WhatsApp to complete bookings. Each search session generates a reference number (format: `GH-XXXXXX`) for the sales team.

### 1.2 Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.1.4 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 |
| State Management | Zustand | ^5.0.10 |
| Data Fetching | TanStack React Query | ^5.90.19 |
| Forms | React Hook Form + Zod | ^7.71.1 / ^4.3.6 |
| UI Components | Radix UI | Various |
| Icons | Lucide React | ^0.562.0 |
| Maps | Leaflet + React Leaflet | ^1.9.4 / ^5.0.0 |
| Date Handling | date-fns | ^4.1.0 |
| Database | Neon PostgreSQL (via Drizzle ORM) | - |
| Caching | Upstash Redis | ^1.36.1 |
| Rate Limiting | Upstash Rate Limit | ^2.0.8 |
| Auth | NextAuth v5 (Google OAuth) | ^5.0.0-beta.30 |
| Image Optimization | Next.js Image + Sharp | - |
| Deployment | Vercel | ^50.4.10 |
| Testing | Playwright | ^1.58.1 |

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/package.json`

### 1.3 Project Structure Overview

```
globehunters-holidays-website/
+-- src/
|   +-- app/                    # Next.js App Router pages & API routes
|   |   +-- page.tsx            # Homepage (hero, search, Top 50 packages)
|   |   +-- layout.tsx          # Root layout (Header, Footer, Analytics)
|   |   +-- packages/           # /packages and /packages/[id] pages
|   |   +-- flights/            # /flights search results
|   |   +-- hotels/             # /hotels search results and /hotels/[id]
|   |   +-- destinations/       # /destinations and /destinations/[slug]
|   |   +-- activities/         # /activities listing
|   |   +-- about/              # Static about page
|   |   +-- contact/            # Contact page
|   |   +-- faq/                # FAQ page
|   |   +-- honeymoon/          # Honeymoon packages page
|   |   +-- group-tours/        # Group tours page
|   |   +-- admin/              # Admin panel (content, pricing, phones, settings)
|   |   +-- backoffice/         # Backoffice page
|   |   +-- api/                # API route handlers
|   |       +-- search/
|   |       |   +-- flights/route.ts     # Duffel flight search
|   |       |   +-- hotels/route.ts      # Multi-provider hotel search
|   |       |   +-- hotels/[id]/route.ts # Hotel detail (RateHawk + HotelBeds)
|   |       |   +-- packages/route.ts    # Full package search
|   |       |   +-- activities/route.ts  # Activities search
|   |       +-- attractions/route.ts     # OSM/Wikipedia attractions
|   |       +-- autocomplete/hotels/route.ts # RateHawk autocomplete
|   |       +-- hotels/content-by-name/route.ts # HotelBeds content lookup
|   |       +-- admin/                   # Admin API routes
|   |       +-- references/route.ts      # Reference number API
|   |       +-- sessions/route.ts        # Session tracking
|   |       +-- debug/route.ts           # Debug/health endpoint
|   +-- components/
|   |   +-- activities/         # ActivitiesSection, ActivityCard
|   |   +-- analytics/          # Google Analytics, GTM, Meta Pixel
|   |   +-- hotels/             # HotelCard, HotelFilters, HotelMap, constants
|   |   +-- layout/             # Header, Footer
|   |   +-- packages/           # FeaturedPackageCard, Top50PackageCard, etc.
|   |   +-- results/            # DestinationCard, PackageCard
|   |   +-- search/             # SearchForm, CollapsibleSearchSection
|   |   +-- ui/                 # button, card, badge, input, ReferenceNumber, WhatsApp
|   +-- data/                   # Static JSON data files
|   |   +-- top50-packages.json           # 50 curated packages
|   |   +-- featured-packages.json        # 15 featured packages
|   |   +-- destination-activities.json   # Activities per destination
|   |   +-- package-destinations.json     # Valid destination list
|   |   +-- uk-airports.json              # Valid UK departure airports
|   |   +-- index.ts                      # Data access functions
|   |   +-- types.ts                      # Data type definitions
|   +-- lib/
|   |   +-- api/
|   |   |   +-- amadeus.ts      # Amadeus hotel API (legacy)
|   |   |   +-- duffel.ts       # Duffel flight API adapter
|   |   |   +-- viator.ts       # Viator activities API adapter
|   |   |   +-- klook.ts        # Klook web scraper for activities
|   |   |   +-- globehunters.ts # Internal GlobeHunters API adapter
|   |   |   +-- fetch-utils.ts  # Retry, timeout, caching utilities
|   |   |   +-- utils.ts        # Additional API reliability utilities
|   |   +-- hotelbeds.ts        # HotelBeds Booking + Content API
|   |   +-- travelpayouts.ts    # Travelpayouts/Hotellook hotel API
|   |   +-- opentripmap.ts      # OpenStreetMap + Wikipedia attractions
|   |   +-- pricing/engine.ts   # Markup rules engine
|   |   +-- currency/index.ts   # Currency detection & FX rates
|   |   +-- admin-auth.ts       # Admin authentication
|   |   +-- admin-settings.ts   # Admin settings (markup, password)
|   |   +-- booking-validation.ts # Input validation (airports, destinations)
|   |   +-- reference-number.ts # GH-XXXXXX reference generator
|   |   +-- theme-generator.ts  # Package theme name/description generator
|   |   +-- utils.ts            # General utilities (formatPrice, etc.)
|   |   +-- db/schema.ts        # Drizzle ORM database schema
|   +-- types/
|       +-- index.ts            # Core type definitions
|       +-- global.d.ts         # Global window type augmentations
+-- data/
|   +-- admin-settings.json     # Admin markup settings
+-- public/
|   +-- images/logo.png
|   +-- videos/hero-bg.mp4
|   +-- opengraph.jpg
+-- docs/                       # Progress documentation & screenshots
+-- tests/                      # Playwright E2E tests
```

### 1.4 Brand & Design System

The site uses a custom Tailwind CSS design system defined in `tailwind.config.ts`:

- **Primary Color:** `#1e3a5f` (deep navy blue)
- **Accent Color:** `#f97316` (orange, for CTAs)
- **Fonts:** Inter (body), DM Serif Display (headings), Playfair Display (display), Poppins (UI)
- **Custom Animations:** fade-in, slide-up, slide-down, shimmer (loading states)

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/tailwind.config.ts`

---

## 2. Data Architecture

### 2.1 Static Package Data

The core product catalog is stored as static JSON files, not in a database. This enables fast server-side rendering and eliminates API dependencies for initial page loads.

#### `top50-packages.json`

The primary data file containing all 50 curated holiday packages. Each package has:

```typescript
// File: /src/data/types.ts (lines 10-33)
interface PackageData {
  id: string;              // e.g. "pkg-santorini-001"
  destinationId: string;   // e.g. "santorini"
  destinationName: string; // e.g. "Santorini"
  country: string;         // e.g. "Greece"
  region?: string;         // e.g. "europe"
  airportCode: string;     // e.g. "JTR"
  title: string;           // e.g. "Santorini Sunset Escape"
  tagline: string;         // e.g. "Experience the magic of Greek sunsets"
  nights: number;          // e.g. 7
  startingPrice: number;   // e.g. 899 (in GBP)
  currency: Currency;      // "GBP" | "EUR" | "USD" | "AUD"
  rating: number;          // e.g. 4.8
  reviewCount: number;     // e.g. 1250
  featured: boolean;       // Whether shown in homepage hero carousel
  featuredOrder?: number;  // Position in hero carousel
  top50Rank?: number;      // Position in Top 50 grid
  theme: PackageTheme;     // "luxury"|"beach"|"cultural"|"adventure"|"romantic"|"city"
  heroImage: string;       // Unsplash URL for card display
  images: string[];        // Gallery images
  highlights: string[];    // e.g. ["Return flights", "5-star hotel", ...]
  includes: string[];      // What's included
  activities: string[];    // Activity IDs linking to destination-activities.json
}
```

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/top50-packages.json`

#### `destination-activities.json`

Activities data organized by destination. Each destination has an array of activities:

```typescript
// File: /src/data/types.ts (lines 56-70)
interface ActivityData {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  duration: string;      // e.g. "3 hours"
  price: number;         // e.g. 45
  currency: Currency;
  rating: number;
  reviewCount: number;
  category: ActivityCategory;  // "Attractions"|"Tours"|"Cultural"|etc.
  image: string;
  includes: string[];
  highlights: string[];
}
```

Structure: `{ activities: { "dubai": [...], "santorini": [...], ... } }`

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/destination-activities.json`

#### `featured-packages.json`

A subset of the Top 50 packages marked as `featured: true`, used for the homepage hero carousel. Contains the same `PackageData` structure.

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/featured-packages.json`

#### `uk-airports.json`

List of valid UK departure airports used for search form validation:

```json
{ "airports": [
  { "code": "LHR", "name": "London Heathrow", "city": "London", "region": "London" },
  { "code": "LGW", "name": "London Gatwick", "city": "London", "region": "London" },
  ...
]}
```

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/uk-airports.json`

#### `package-destinations.json`

List of valid package destinations used for search form validation:

```json
{ "destinations": [
  { "code": "DXB", "name": "Dubai", "country": "UAE", "region": "Middle East" },
  { "code": "JTR", "name": "Santorini", "country": "Greece", "region": "Europe" },
  ...
]}
```

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/package-destinations.json`

### 2.2 Data Access Layer

All static data access is centralized through `src/data/index.ts`, which provides typed functions:

- `getFeaturedPackages()` - Returns the 15 featured packages for the hero carousel
- `getTop50Packages()` - Returns all 50 packages
- `getPackageById(id)` - Single package lookup
- `getPackagesByDestination(destinationId)` - Filter by destination
- `getPackagesByTheme(theme)` - Filter by theme
- `filterPackages(filters)` - Multi-criteria filtering
- `searchPackages(query)` - Text search across name, country, tagline
- `getActivitiesByDestination(destinationId)` - Activities for a destination
- `getActivitiesForPackage(packageId)` - Activities for a specific package
- `getPackageWithActivities(packageId)` - Package + resolved activities

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/data/index.ts`

### 2.3 How Destinations, Hotels, Flights, and Activities Connect

```
PackageData (static JSON)
  |
  +-- destinationId ------> destination-activities.json (static activities)
  |
  +-- airportCode ---------> Used for flight search (Duffel API)
  |                          Also maps to city name via IATA_TO_CITY
  |
  +-- destinationName -----> Used for hotel search (RateHawk region lookup)
  |                          Also used for HotelBeds geolocation search
  |                          Also used for attractions (Nominatim geocoding)
  |
  +-- activities[] ---------> Activity IDs that resolve from
                              destination-activities.json
```

The static package data provides the **initial display**. When a user performs a live search or views a package detail page, the system calls real APIs:
- **Flights:** Duffel API (by IATA airport codes)
- **Hotels:** RateHawk + HotelBeds + Travelpayouts (by city name or region)
- **Activities:** OpenStreetMap + Wikipedia (by city name, geocoded)
- **Hotel Images:** HotelBeds Content API (by hotel code)

### 2.4 Admin Settings

Admin markup percentages and password are stored in a flat JSON file:

```json
// File: /data/admin-settings.json
{
  "markup": {
    "flights": 0,
    "hotels": 0,
    "tours": 0,
    "packages": 0
  },
  "password": "globehunters2024"
}
```

These percentages are applied on top of API prices via `applyAdminMarkup()` in the package search API.

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/admin-settings.ts`

---

## 3. API Integrations - Deep Dive

### 3.1 RateHawk API (Hotel Search - Primary)

**Purpose:** Primary hotel inventory provider. Powers the main hotel search on `/hotels` and contributes hotels to the `/packages` search.

**Base URL:** `https://api.worldota.net/api/b2b/v3`

**Authentication:** HTTP Basic Auth
```
Authorization: Basic base64(RATEHAWK_KEY_ID:RATEHAWK_API_KEY)
```
Environment variables: `RATEHAWK_KEY_ID`, `RATEHAWK_API_KEY`

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/search/multicomplete/` | POST | Region/destination autocomplete lookup |
| `/search/serp/region/` | POST | Search hotels in a region (primary search) |
| `/hotel/info/` | POST | Fetch detailed hotel info (images, amenities, description) |
| `/search/hp/` | POST | Fetch rates for a specific hotel (hotel detail page) |

**Data Flow:**

1. User searches "Santorini" -> `/search/multicomplete/` returns region IDs (e.g., `{ id: "123", name: "Santorini", country: "GR" }`)
2. All matching regions from the same country are searched in parallel via `/search/serp/region/`
3. Results are deduplicated by hotel ID, sorted by price
4. For the first 30 hotels (one page), `/hotel/info/` is called to get names, images, and amenities
5. Results are combined with HotelBeds and Travelpayouts results

**SERP Response Data:** The SERP endpoint returns inline data including:
- `star_rating`, `name`, `images[]`, `latitude`, `longitude`, `address`
- `rates[]` with `payment_options.payment_types[].show_amount`, `meal`, `cancellation_penalties`

**Rate Limits:** The `/hotel/info/` endpoint is limited to 30 requests per 60 seconds, hence the `PAGE_SIZE = 30` constant.

**Caching:**
- Region lookups: 1 hour TTL
- Hotel search results: 5 minutes TTL
- Hotel info: 24 hours TTL
- Combined sorted results: 5 minutes TTL

**Known Reliability Issues:**
- Region autocomplete sometimes returns US cities for European names (e.g., "Athens, GA" instead of "Athens, Greece"). The HotelBeds geocoder explicitly deprioritizes US results.
- `/hotel/info/` rate limit of 30/min is the primary bottleneck. The system now uses SERP inline data as the primary source to avoid this bottleneck, reducing search time from 35s to approximately 6s.
- Image URLs contain a `{size}` placeholder that must be replaced (e.g., `{size}` -> `640x400`)

**Files:**
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/api/search/hotels/route.ts` (lines 24-1110)
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/api/search/hotels/[id]/route.ts`
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/api/autocomplete/hotels/route.ts`

---

### 3.2 HotelBeds API (Hotel Search - Secondary + Content/Images)

**Purpose:** Dual purpose: (1) Secondary hotel inventory to supplement RateHawk results, and (2) Content API for high-quality hotel images, descriptions, and facilities.

**Two Separate APIs:**

#### Booking API
**Base URL:** `https://api.hotelbeds.com/hotel-api/1.0` (configurable via `HOTELBEDS_API_URL`)

**Purpose:** Live hotel availability and pricing

**Authentication:** Custom X-Signature header
```
Api-key: {HOTELBEDS_API_KEY}
X-Signature: SHA256(apiKey + secret + unixTimestamp)
```

The signature is generated fresh for each request:
```typescript
// File: /src/lib/hotelbeds.ts (lines 67-83)
function generateSignature(apiKey: string, secret: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = apiKey + secret + timestamp;
  const signature = createHash("sha256").update(signatureString).digest("hex");
  return { signature, debug: { timestamp, apiKeyLength: apiKey.length, secretLength: secret.length } };
}
```

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /hotels` | POST | Search hotels by geolocation or hotel code |

**Data Provided:**
- Hotel code, name, category (star rating), destination, zone
- Room types with rates (net price), board codes (RO, BB, HB, AI)
- Cancellation policies
- Coordinates (latitude/longitude)
- Does NOT provide images (that requires the Content API)

**Search Flow:**
1. City name is geocoded to lat/lon (first checks an internal cache of 30+ major cities, then falls back to OpenStreetMap Nominatim)
2. `POST /hotels` with geolocation filter (30km radius)
3. Results are converted to a standard format via `convertToStandardFormat()`
4. Hotels with unrealistic prices (> 10,000 GBP/night) are filtered out

#### Content API
**Base URL:** `https://api.hotelbeds.com/hotel-content-api/1.0`

**Purpose:** Static hotel data -- images, descriptions, facilities. This data rarely changes and is cached for 24 hours.

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /hotels/{codes}/details` | GET | Fetch content for up to 100 hotels per request |
| `GET /hotels?countryCode={CC}` | GET | List all hotels in a country (for name-based search) |

**Image URL Format:** `https://photos.hotelbeds.com/giata/{path}`
- Standard: `/giata/{path}`
- Large: `/giata/bigger/{path}` (string replacement done client-side)

**Content Data Provided:**
- Images (up to 15 per hotel, full URLs constructed from `path`)
- Description (`hotel.description.content`)
- Facilities (e.g., "Swimming pool", "Free WiFi")
- Address, city, country, postal code
- Review score (from `hotel.ranking`, divided by 10)
- Phone numbers, email

**Caching:**
- Content data: 24 hours (per hotel code)
- Country hotel lists: 7 days (up to 10,000 hotels per country)

**Name-Based Hotel Search:**
The `findHotelByName()` function lists all hotels in a country via the Content API, then performs fuzzy matching:
1. Exact case-insensitive match
2. Substring containment match
3. Word overlap scoring (requires 60%+ of search words to match)

**Files:**
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/hotelbeds.ts` (992 lines)
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/api/hotels/content-by-name/route.ts`

---

### 3.3 Travelpayouts/Hotellook API (Hotel Search - Tertiary)

**Purpose:** Third hotel inventory source, providing additional price comparison data. Uses the Hotellook engine.

**Base URL:** `https://engine.hotellook.com/api/v2`

**Authentication:** Token-based query parameter
```
?token={TRAVELPAYOUTS_API_TOKEN}
```

Environment variables: `TRAVELPAYOUTS_API_TOKEN`, `TRAVELPAYOUTS_MARKER`

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/lookup.json` | GET | Search locations (cities, hotels) by query |
| `/cache.json` | GET | Search hotels with pricing by city name |
| `/static/hotels.json` | GET | Get hotel details (description, amenities) by ID |

**Data Provided:**
- Hotel name, star rating, price range
- Location coordinates
- Photo count (images are constructed as: `https://photo.hotellook.com/image_v2/limit/{hotelId}/{index}/640/480.jpg`)
- Room offers with agency booking URLs

**Key Limitation:** The cache.json endpoint accepts city names directly (not coordinates). Prices may be cached/historical rather than real-time.

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/travelpayouts.ts`

---

### 3.4 Duffel API (Flight Search)

**Purpose:** Real-time flight search and pricing. This is the ONLY flight API used in the project -- all flight data comes from Duffel.

**Base URL:** `https://api.duffel.com`

**Authentication:** Bearer token
```
Authorization: Bearer {DUFFEL_ACCESS_TOKEN}
Duffel-Version: v2
```

Environment variable: `DUFFEL_ACCESS_TOKEN`

**Endpoints Used:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/air/offer_requests` | POST | Create a flight search (returns offers) |
| `/air/offers/{id}` | GET | Get details for a specific offer |

**Request Format:**
```json
{
  "data": {
    "slices": [
      { "origin": "LHR", "destination": "JTR", "departure_date": "2026-06-15" },
      { "origin": "JTR", "destination": "LHR", "departure_date": "2026-06-22" }
    ],
    "passengers": [{ "type": "adult" }, { "age": 8 }],
    "cabin_class": "economy",
    "return_offers": true,
    "currency": "GBP"
  }
}
```

**Data Provided:**
- Airline name, IATA code, logos (via `logo_symbol_url`, `logo_lockup_url`)
- Per-segment details: departure/arrival times, airports, duration (ISO 8601), aircraft type
- Pricing: `total_amount`, `base_amount`, `tax_amount`
- Baggage allowance per passenger (carry-on and checked quantities)
- Payment requirements and offer expiry
- Number of stops

**Passenger Pricing:** Duffel does not provide per-passenger pricing directly. The system estimates:
- Adults: 100% of average fare
- Children (2-11): 85% of adult fare
- Infants (<2): 10% of adult fare

**Retry & Caching:**
- 3 retries with exponential backoff (1s, 2s, 4s)
- 15-second timeout per request
- 5-minute in-memory cache per search

**Files:**
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/api/search/flights/route.ts` (686 lines)
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/api/duffel.ts`

---

### 3.5 Amadeus API (Legacy - Hotels)

**Purpose:** Legacy hotel search adapter. Present in the codebase but NOT actively used in any API route. The system has migrated to RateHawk + HotelBeds + Travelpayouts.

**Base URL:** `https://test.api.amadeus.com` (sandbox) or `https://api.amadeus.com`

**Authentication:** OAuth 2.0 client credentials flow
```
POST /v1/security/oauth2/token
grant_type=client_credentials&client_id=XXX&client_secret=XXX
```

**Endpoints:**
- `/v1/reference-data/locations/hotels/by-city` - Get hotel IDs for a city
- `/v3/shopping/hotel-offers` - Search for room offers

**Note:** This adapter includes mock data functions (`getMockHotelOffers`) for development.

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/api/amadeus.ts`

---

### 3.6 Attractions APIs (OpenStreetMap + Wikipedia)

**Purpose:** Fetch tourist attractions for any city. Uses entirely FREE, KEYLESS APIs.

**No API keys required.**

**Three-step process:**

1. **Nominatim Geocoding** (OpenStreetMap)
   - URL: `https://nominatim.openstreetmap.org/search?q={city}&format=json`
   - Converts city name to lat/lon coordinates
   - User-Agent: `GlobeHunters/1.0 (travel website)`

2. **Overpass API** (OpenStreetMap)
   - URL: `https://overpass-api.de/api/interpreter`
   - Queries for nodes with tourism/historic/amenity tags within 15km radius
   - Tags: `tourism~"attraction|museum|artwork|gallery|viewpoint"`, `historic~"monument|memorial|castle|ruins"`, `amenity~"theatre|arts_centre"`

3. **Wikipedia API**
   - URL: `https://en.wikipedia.org/w/api.php`
   - Batches up to 20 attraction names per request
   - Fetches: extracts (descriptions), page images (thumbnails at 400px)

**Price Generation:** Since attractions are free data, tour prices are generated algorithmically:
```typescript
// File: /src/lib/opentripmap.ts (lines 288-301)
function generateTourPrice(kinds: string, rate: string): number {
  let basePrice = 25;
  if (kinds.includes("museum")) basePrice = 20;
  if (kinds.includes("amusement")) basePrice = 45;
  // ... more rules
  const multiplier = 0.8 + rateNum * 0.2;
  return Math.round(basePrice * multiplier);
}
```

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/opentripmap.ts`

---

### 3.7 Viator API (Activities - Configured but Optional)

**Purpose:** Premium activity and tour listings. Provides real booking URLs and high-quality data.

**Base URL:** `https://api.viator.com/partner`

**Authentication:** API key header
```
exp-api-key: {VIATOR_API_KEY}
```

**Endpoints:**
- `POST /products/search` - Search activities by destination ID
- `GET /product/{code}` - Get single activity details

**Destination Mapping:** The adapter contains a comprehensive mapping of 140+ IATA codes and city names to Viator destination IDs (e.g., `DXB: 828`, `SANTORINI: 4959`).

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/api/viator.ts`

---

### 3.8 Klook (Activities - Web Scraping)

**Purpose:** Supplementary activity source. Scrapes Klook's website rather than using an official API. Includes affiliate tracking.

**Affiliate ID:** `api|13694|af4ba6d625384320be87e2877-701824|pid|701824`

**How it works:** Makes HTTP requests to Klook's website and parses:
1. JSON-LD structured data (`@type: "ItemList"` or `@type: "Product"`)
2. `__NEXT_DATA__` script tag (Next.js SSR data)
3. HTML patterns (title tags, price patterns, image URLs from `res.klook.com`)

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/api/klook.ts`

---

### 3.9 GlobeHunters Internal API

**Purpose:** Connects to an existing GlobeHunters backend API hosted on Replit for flights, hotels, and packages.

**Base URL:** `https://globehunter.replit.app` (configurable via `GLOBEHUNTERS_API_URL`)

**Endpoints:**
- `POST /api/search/packages` - Combined flight+hotel package search
- `POST /api/search/flights` - Flight-only search
- `POST /api/search/hotels` - Hotel-only search

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/api/globehunters.ts`

---

### 3.10 Currency / FX Rates

**Provider:** `https://api.exchangerate-api.com/v4/latest/{currency}` (free tier)

**Supported Currencies:** GBP, EUR, USD, AUD

**Caching:** 1-hour TTL for FX rates

**Fallback Rates (hardcoded approximations):**
```
GBP: 1, EUR: 1.18, USD: 1.27, AUD: 1.95
```

**Currency Detection Priority:**
1. URL parameter (`?currency=EUR`)
2. Cookie/stored preference
3. Geo-IP country code mapping
4. Default: GBP

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/currency/index.ts`

---

## 4. Hotel Selection Flow - Step by Step

### 4.1 User Lands on a Package Page (e.g., `/packages/pkg-santorini-001`)

**Step 1: Static Data Load**

The page component (`src/app/packages/[id]/page.tsx`) is a client component. On mount, it:

1. Reads the `id` from URL params
2. Calls `getStaticPackageById(packageId)` which searches `top50-packages.json` for the matching package
3. Loads activities from `destination-activities.json` for that destination
4. Creates **placeholder flight data** (estimated at 40% of package price, British Airways as default)
5. Creates **placeholder hotel data** (estimated at 60% of package price, generic name like "Santorini Premium Resort")

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/app/packages/[id]/page.tsx` (lines 237-343)

### 4.2 The 4 Hotel Tiers (Budget / Standard / Deluxe / Luxury)

The package detail page generates 4 hotel options using the `HOTEL_TIER_OPTIONS` configuration:

```typescript
// File: /src/app/packages/[id]/page.tsx (lines 465-510)
const HOTEL_TIER_OPTIONS = [
  { id: "budget",   tier: "budget",   stars: 3, priceModifier: -30,  roomType: "Standard Room" },
  { id: "standard", tier: "standard", stars: 4, priceModifier: 0,    roomType: "Superior Room" },
  { id: "deluxe",   tier: "deluxe",   stars: 5, priceModifier: 40,   roomType: "Deluxe Suite" },
  { id: "luxury",   tier: "luxury",   stars: 5, priceModifier: 90,   roomType: "Presidential Suite" },
];
```

Each tier generates a hotel name using the destination name:
- Budget: `{destination} City Hotel` (3-star)
- Standard: `{destination} Premium Resort` (4-star)
- Deluxe: `{destination} Grand Palace` (5-star)
- Luxury: `The {destination} Royal Collection` (5-star)

The `priceModifier` is a percentage applied to the base hotel price:
- Budget: 30% cheaper than base
- Standard: Base price (0% modifier)
- Deluxe: 40% more expensive
- Luxury: 90% more expensive

### 4.3 User Clicks on a Different Hotel Tier

When a user selects a different tier:

1. The `priceModifier` adjusts the hotel price component
2. The board type changes to the tier's default: Budget=Room Only, Standard=B&B, Deluxe=Half Board, Luxury=All Inclusive
3. The total package price is recalculated as: `flightPrice + adjustedHotelPrice`
4. The comprehensive hotel details change (amenities, description, facilities) based on `TIER_HOTEL_DETAILS` configuration

### 4.4 What API Calls Fire?

**For static package pages:** No API calls are made when switching tiers. The tier system uses client-side price modifiers and pre-defined hotel detail templates. This is all calculated in the browser.

**For live search package results (`/api/search/packages`):** The package search API performs real API calls:

1. **RateHawk region lookup** -> `/search/multicomplete/` (to find region IDs)
2. **Duffel flight search** -> `/air/offer_requests` (real flight prices)
3. **RateHawk hotel search** -> `/search/serp/region/` (real hotel inventory, all regions in parallel)
4. **RateHawk hotel info** -> `/hotel/info/` (hotel names, images, amenities, in batches of 10)
5. **HotelBeds hotel search** -> `POST /hotels` (supplementary inventory via geolocation)
6. **HotelBeds Content API** -> `GET /hotels/{codes}/details` (images for HotelBeds hotels)
7. **OpenStreetMap/Wikipedia** -> Nominatim + Overpass + Wikipedia APIs (attractions)

All three hotel providers run in parallel. Results are then:
- Deduplicated by normalized hotel name
- Priority: RateHawk > HotelBeds > Travelpayouts
- Sorted by price

### 4.5 Where Do Images Come From?

Image sources follow a priority chain:

1. **RateHawk SERP data** - Inline images from `hotel.images[]`, URLs use `{size}` placeholder replaced with `640x400`
2. **RateHawk `/hotel/info/`** - Higher quality images from the detail endpoint
3. **HotelBeds Content API** - `https://photos.hotelbeds.com/giata/{path}` (enriched after initial results)
4. **Travelpayouts/Hotellook** - `https://photo.hotellook.com/image_v2/limit/{hotelId}/{index}/640/480.jpg`
5. **Unsplash placeholders** - Category-based fallback images (resort, city, apartment, beach, etc.)

For the package search specifically, HotelBeds images are matched to RateHawk hotels by:
1. Exact normalized name match
2. Partial name containment match
3. Round-robin assignment from available HotelBeds image sets

Hotels still without images get unique Unsplash URLs generated from a hash of the hotel name.

**Allowed image domains** (configured in `next.config.ts`):
- `images.unsplash.com`
- `content.r9cdn.net`
- `cf.bstatic.com`
- `*.cloudinary.com`
- `pics.avs.io` (airline logos)
- `cdn.worldota.net` (RateHawk)
- `photos.hotellook.com` (Travelpayouts)
- `photos.hotelbeds.com` (HotelBeds)
- `commons.wikimedia.org`, `upload.wikimedia.org` (Wikipedia)

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/next.config.ts`

### 4.6 Fallback Chain if APIs Fail

The system uses a graceful degradation strategy:

1. **RateHawk fails:** HotelBeds and Travelpayouts results are still returned. If all three fail, the search returns an empty array with an error message.
2. **HotelBeds fails:** Silently ignored; RateHawk and Travelpayouts results are still used.
3. **Travelpayouts fails:** Silently ignored; other providers' results are still used.
4. **HotelBeds Content API fails:** Hotels display without images; Unsplash placeholders are used instead.
5. **All hotel APIs fail:** The package search returns `{ data: [], message: "No hotels available" }`.
6. **Duffel (flights) fails:** Returns empty array; package search returns no results (flights are required).
7. **OpenStreetMap/Wikipedia fails:** Attractions section is simply empty; packages are still generated without activities.

Each API integration uses `Promise.allSettled()` so failures in one provider don't crash the others.

### 4.7 Recent Migration from RateHawk to HotelBeds

Based on git history, the project has undergone a significant evolution in hotel data sourcing:

**Timeline (from git log):**
- `d5b8161` - Added Travelpayouts (Hotellook) integration
- `71894e7` - Added HotelBeds API integration
- `438a433` - Added HotelBeds hotel detail support
- `b3cade9` - Upgraded hotel pages with Booking.com-style UI, Content API
- `947a118` - Optimized hotel search from 35s to 6s (switched from `/hotel/info/` calls to SERP inline data)
- `b7e2f88` - Fixed images by enriching ALL HotelBeds hotels with Content API
- `d4258f9` - Fixed hotel images to match selected tier

The key optimization was moving from calling `/hotel/info/` for every hotel (rate-limited to 30/min) to using the SERP response's inline data for basic info, and only fetching detailed info on demand when viewing a specific hotel.

---

## 5. Pricing Logic

### 5.1 Hotel Price Calculation

**For static package pages (Top 50):**

The base hotel price is estimated at 60% of the package's `startingPrice`:
```typescript
price: Math.round(staticPkg.startingPrice * 0.6)
pricePerNight: Math.round((staticPkg.startingPrice * 0.6) / staticPkg.nights)
```

Tier modifiers are then applied:
```
Budget:   basePrice * (1 + (-30)/100) = basePrice * 0.70
Standard: basePrice * (1 + 0/100)     = basePrice * 1.00
Deluxe:   basePrice * (1 + 40/100)    = basePrice * 1.40
Luxury:   basePrice * (1 + 90/100)    = basePrice * 1.90
```

**For live search results:**

Prices come directly from API responses:
- RateHawk: `rate.payment_options.payment_types[0].show_amount` (total stay price)
- HotelBeds: `rate.net` (net price, total stay)
- Travelpayouts: `hotel.priceFrom` (total stay price)

### 5.2 Board Type Pricing

Board type modifiers apply to the hotel price:

```typescript
// File: /src/app/packages/[id]/page.tsx (lines 425-450)
const BOARD_OPTIONS = [
  { type: "Room Only",       priceModifier: 0 },
  { type: "Bed & Breakfast", priceModifier: 15 },   // +15%
  { type: "Half Board",      priceModifier: 35 },   // +35%
  { type: "All Inclusive",   priceModifier: 60 },   // +60%
];
```

Formula: `adjustedHotelPrice = hotelPrice * (1 + boardModifier/100)`

### 5.3 Flight Pricing per Airline

Airlines have price modifiers relative to the base (cheapest) flight:

```typescript
// File: /src/app/packages/[id]/page.tsx (lines 360-413)
const AIRLINE_OPTIONS = [
  { code: "BA", name: "British Airways",   priceModifier: 0 },    // Base price
  { code: "EK", name: "Emirates",          priceModifier: 15 },   // +15%
  { code: "QR", name: "Qatar Airways",     priceModifier: 10 },   // +10%
  { code: "TK", name: "Turkish Airlines",  priceModifier: -5 },   // -5%
];
```

Formula: `adjustedFlightPrice = baseFlightPrice * (1 + priceModifier/100)`

### 5.4 Activity Pricing

Activities from the static JSON have fixed prices. Activities from the OpenStreetMap/Wikipedia pipeline have generated prices (see section 3.6).

Admin markup is then applied:
```typescript
const price = applyAdminMarkup(basePrice, "tours");
```

### 5.5 Grand Total Calculation

**Static packages:**
```
totalPrice = adjustedFlightPrice + adjustedHotelPrice
pricePerPerson = Math.round(totalPrice / 2)
```

**Live search packages (from /api/search/packages):**
```typescript
// File: /src/app/api/search/packages/route.ts (lines 798-804)
const flightPrice = applyAdminMarkup(cheapestFlight.price, "flights");
const hotelPrice = applyAdminMarkup(hotel.price, "hotels");
const baseTotal = flightPrice + hotelPrice;
const totalPrice = applyAdminMarkup(baseTotal, "packages");
const pricePerPerson = Math.round(totalPrice / (adults + children || 1));
```

### 5.6 Pricing Rules Engine

A more sophisticated pricing engine exists at `/src/lib/pricing/engine.ts` but is not currently wired into the main API routes (the simpler `applyAdminMarkup()` is used instead).

The engine supports:
- **Percentage markup** (e.g., 8% on flights, 10% on hotels, 12% on activities)
- **Fixed markup** (e.g., +50 GBP flat)
- **Tiered rules** (e.g., 15% markup on Maldives packages under 2000 GBP, 12% for 2000-5000, 10% above 5000)
- **Minimum margin** (e.g., at least 50 GBP profit per booking)
- **Price rounding** to X.99

Default rules:
```typescript
{ vertical: "flights",    percentageMarkup: 8 }
{ vertical: "hotels",     percentageMarkup: 10 }
{ vertical: "activities", percentageMarkup: 12 }
{ destination: "maldives", type: "tiered", tiers: [15%, 12%, 10%], minMargin: 50 }
```

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/lib/pricing/engine.ts`

---

## 6. Flight Selection Flow

### 6.1 How Airline Options Are Generated

**On static package pages (`/packages/[id]`):**

Airlines are NOT fetched from any API. They come from a hardcoded `AIRLINE_OPTIONS` array with 4 options:

| Airline | Code | Price Modifier | Stops | Departure |
|---------|------|---------------|-------|-----------|
| British Airways | BA | 0% (base) | 0 (direct) | 09:00 |
| Emirates | EK | +15% | 1 stop | 07:30 |
| Qatar Airways | QR | +10% | 1 stop | 08:00 |
| Turkish Airlines | TK | -5% | 1 stop | 06:30 |

Each airline has fixed times, baggage allowances, and number of stops. The flight price is calculated from the base flight price (40% of package starting price) multiplied by the price modifier.

**On live search results (`/api/search/packages`):**

Real flights come from the Duffel API. The cheapest flight is used as the default, and up to 4 alternative flights are provided with their actual API prices, airline names, and real schedule data.

### 6.2 What Data is Real vs Generated?

| Data Point | Static Packages | Live Search |
|-----------|----------------|-------------|
| Airline names | Generated (4 fixed) | Real (from Duffel) |
| Flight prices | Estimated (40% of pkg price + modifier) | Real API prices |
| Departure/arrival times | Fixed per airline | Real schedule |
| Number of stops | Fixed (0 or 1) | Real route data |
| Flight duration | Estimated by region | Real ISO 8601 duration |
| Baggage allowance | Fixed per airline | Real (from Duffel per-segment) |
| Airline logos | `https://pics.avs.io/400/160/{code}.png` | Real Duffel logo URLs |

### 6.3 How the Flight Selector UI Works

The package detail page renders a flight selection card with:

1. Currently selected airline displayed prominently (logo, name, times, stops)
2. Alternative airlines shown as clickable options below
3. Selecting a different airline:
   - Updates the flight price using that airline's `priceModifier`
   - Recalculates the total package price
   - Updates displayed departure/arrival times
   - Shows different baggage allowance
4. All calculations happen client-side -- no API calls on selection change

---

## 7. Search & Booking Flow

### 7.1 How the Search Form Works

The search form (`/src/components/search/SearchForm.tsx`) supports three modes:

1. **Packages** (default) - FROM (UK airports only) + DESTINATION (Top 50 only) + dates + passengers
2. **Flights** - FROM (any airport) + TO (any airport) + dates + passengers
3. **Hotels** - Destination (free text) + dates + passengers + rooms

**Key validation constraints for Packages:**
- FROM field is locked to UK airports (from `uk-airports.json`)
- DESTINATION field is locked to Top 50 package destinations (from `package-destinations.json`)
- Both use autocomplete dropdowns with validation

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/components/search/SearchForm.tsx`

### 7.2 How Search Results Get Populated

When the user submits a package search:

1. The form constructs a URL: `/packages?origin=LHR&destination=Santorini&departureDate=2026-06-15&returnDate=2026-06-22&adults=2&children=0&rooms=1`

2. The packages page fetches `/api/search/packages` with these params

3. The API handler:
   a. Validates origin (must be UK airport) and destination (must be from Top 50)
   b. Resolves destination to IATA code for flights and city name for hotels
   c. Runs in parallel:
      - Duffel flight search
      - RateHawk region lookup + hotel search (across all matching regions)
      - Attractions search (Nominatim + Overpass + Wikipedia)
   d. HotelBeds image enrichment (after initial results)
   e. Creates packages by combining cheapest flight with each hotel
   f. Returns sorted by total price

4. Each result package includes:
   - Generated theme name (based on attraction categories)
   - Flight details (cheapest + alternatives)
   - Hotel details (with images)
   - Attractions list
   - Total price with admin markup applied

### 7.3 What Happens When a User Searches for a Destination

The search flow differs by search type:

**Package search:**
```
User types "Santorini" -> Validates against package-destinations.json
-> Resolves to IATA code "JTR" for flights
-> Resolves to city name "Santorini" for hotels (via IATA_TO_CITY map)
-> Parallel API calls -> Combined results
```

**Hotel search:**
```
User types "Santorini" -> Free text (no validation)
-> RateHawk multicomplete -> Region ID(s)
-> Parallel: RateHawk SERP + HotelBeds geo + Travelpayouts cache
-> Deduplicate + sort by price
```

**Flight search:**
```
User types "LHR" (origin) + "JTR" (destination)
-> Duffel API search -> Sorted by price
```

### 7.4 Reference Numbers

Every search session generates a reference number:

```typescript
// File: /src/lib/reference-number.ts
// Format: GH-XXXXXX (e.g., GH-A3B7K9)
// Characters: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no confusing 0/O, 1/I/L)
```

This reference is displayed on search results and package detail pages, allowing the sales team to locate the user's search when they call.

---

## 8. Key Configuration Maps

### 8.1 HOTEL_TIER_OPTIONS

**Location:** `/src/app/packages/[id]/page.tsx` (lines 465-510)

Controls the 4 hotel tiers displayed on static package pages:

| Tier | Stars | Price Modifier | Default Board | Room Type |
|------|-------|---------------|---------------|-----------|
| budget | 3 | -30% | Room Only | Standard Room |
| standard | 4 | 0% | Bed & Breakfast | Superior Room |
| deluxe | 5 | +40% | Half Board | Deluxe Suite |
| luxury | 5 | +90% | All Inclusive | Presidential Suite |

### 8.2 BOARD_OPTIONS

**Location:** `/src/app/packages/[id]/page.tsx` (lines 425-450)

Controls meal plan pricing:

| Board Type | Price Modifier | Description |
|-----------|---------------|-------------|
| Room Only | 0% | Accommodation only |
| Bed & Breakfast | +15% | Breakfast included daily |
| Half Board | +35% | Breakfast & dinner included |
| All Inclusive | +60% | All meals & selected drinks |

### 8.3 AIRLINE_OPTIONS

**Location:** `/src/app/packages/[id]/page.tsx` (lines 360-413)

Controls flight options on static packages. See section 6.1 for details.

### 8.4 TIER_HOTEL_DETAILS (Comprehensive Booking.com-style data)

**Location:** `/src/app/packages/[id]/page.tsx` (lines 551-698+)

Each hotel tier has full Booking.com-style property details:
- `propertyHighlights` - Key selling points
- `propertyDescription` - Multi-paragraph description
- `mostPopularFacilities` - Amenity list
- `roomAmenities` - In-room features
- `bathroomAmenities` - Bathroom features
- `viewOptions` - Available views
- `foodAndDrink` - Restaurant count, bars, room service, breakfast options
- `internet` - WiFi type, availability, cost
- `parking` - Availability, type, cost, valet
- `services` - Concierge, laundry, shuttle, etc.
- `houseRules` - Check-in/out times, children/pets/parties policies
- `finePrint` - Terms and conditions

### 8.5 IATA_TO_CITY

**Location:** `/src/app/api/search/packages/route.ts` (lines 21-67)

Maps 100+ IATA airport codes to city names for hotel/attraction searches:

```typescript
const IATA_TO_CITY: Record<string, string> = {
  MLE: "Maldives", DXB: "Dubai", DPS: "Bali", BKK: "Bangkok",
  SIN: "Singapore", HKG: "Hong Kong", NRT: "Tokyo", CDG: "Paris",
  FCO: "Rome", BCN: "Barcelona", ATH: "Athens", LIS: "Lisbon",
  // ... 100+ entries
};
```

### 8.6 VIATOR_DESTINATIONS

**Location:** `/src/lib/api/viator.ts` (lines 16-143)

Maps 140+ IATA codes and city names to Viator destination IDs:

```typescript
const VIATOR_DESTINATIONS: Record<string, number> = {
  CDG: 479, PARIS: 479, LON: 737, LONDON: 737,
  DXB: 828, DUBAI: 828, SANTORINI: 4959,
  // ... 140+ entries covering every major tourist destination
};
```

### 8.7 CITY_COORDINATES (HotelBeds Geocoding Cache)

**Location:** `/src/lib/hotelbeds.ts` (lines 569-608)

Hardcoded coordinates for 30+ major tourist cities to avoid OpenStreetMap geocoding errors:

```typescript
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "athens":    { lat: 37.9838, lon: 23.7275 },
  "london":    { lat: 51.5074, lon: -0.1278 },
  "santorini": { lat: 36.3932, lon: 25.4615 },
  "dubai":     { lat: 25.2048, lon: 55.2708 },
  // ... 30+ cities
};
```

### 8.8 HOTEL_PLACEHOLDERS

**Location:** `/src/components/hotels/constants.ts` (lines 14-25)

Category-based placeholder images when hotel images are unavailable:

```typescript
const HOTEL_PLACEHOLDERS: Record<string, string> = {
  resort:    "photo-1520250497591-112f2f40a3f4",
  city:      "photo-1551882547-ff40c63fe5fa",
  apartment: "photo-1502672260266-1c1ef2d93688",
  boutique:  "photo-1582719508461-905c673771fd",
  beach:     "photo-1573843981267-be1999ff37cd",
  luxury:    "photo-1542314831-068cd1dbfeeb",
  // ... more categories
};
```

### 8.9 AMENITY_CATEGORIES (RateHawk amenity normalization)

**Location:** `/src/app/api/search/hotels/route.ts` (lines 453-477)

Maps raw amenity strings to user-friendly category names:

```typescript
const AMENITY_CATEGORIES = {
  "Free WiFi":       ["wifi", "wi-fi", "internet"],
  "Swimming pool":   ["pool", "swimming"],
  "Spa":             ["spa", "sauna", "wellness"],
  "Air conditioning": ["air conditioning", "a/c"],
  "Beach":           ["beach", "beachfront"],
  // ... 23 categories
};
```

---

## 9. Deployment & Infrastructure

### 9.1 Deployment Platform

The project is deployed on **Vercel** (confirmed by `.vercel/` directory, `vercel` in devDependencies, and `.env.vercel`).

### 9.2 Environment Variables Required

All environment variables are documented in `.env.example`:

**Critical (required for core functionality):**

| Variable | Purpose |
|----------|---------|
| `RATEHAWK_KEY_ID` | RateHawk API key ID (hotel search) |
| `RATEHAWK_API_KEY` | RateHawk API key (hotel search) |
| `DUFFEL_ACCESS_TOKEN` | Duffel flight API token |
| `HOTELBEDS_API_KEY` | HotelBeds API key |
| `HOTELBEDS_SECRET` | HotelBeds API secret |

**Important (needed for full feature set):**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `UPSTASH_REDIS_REST_URL` | Redis for caching/rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token |
| `TRAVELPAYOUTS_API_TOKEN` | Travelpayouts hotel search |
| `TRAVELPAYOUTS_MARKER` | Travelpayouts affiliate marker |
| `VIATOR_API_KEY` | Viator activities API |
| `HOTELBEDS_API_URL` | HotelBeds endpoint (default: production) |

**Authentication:**

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth for admin |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `NEXTAUTH_SECRET` | NextAuth session encryption |
| `NEXTAUTH_URL` | NextAuth callback URL |
| `ADMIN_ALLOWED_DOMAIN` | Allowed email domain (globehunters.com) |

**Analytics & Tracking:**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager |
| `NEXT_PUBLIC_META_PIXEL_ID` | Facebook/Meta Pixel |

**Site Configuration:**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `NEXT_PUBLIC_DEFAULT_PHONE` | Phone number (E.164 format) |
| `NEXT_PUBLIC_DEFAULT_PHONE_FORMATTED` | Display phone number |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | Default currency (GBP) |
| `USE_MOCK_DATA` | Use mock data instead of APIs |

**File:** `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/.env.example`

### 9.3 External Services Dependencies

The project depends on these external services:

1. **Vercel** - Hosting, edge functions, image optimization
2. **Neon** - Serverless PostgreSQL database
3. **Upstash** - Redis for caching and rate limiting
4. **Duffel** - Flight search API
5. **RateHawk/WorldOTA** - Hotel search API
6. **HotelBeds** - Hotel booking + content API
7. **Travelpayouts/Hotellook** - Hotel price comparison
8. **OpenStreetMap** - Geocoding (Nominatim) + attractions (Overpass)
9. **Wikipedia** - Attraction descriptions and images
10. **Google Cloud** - OAuth (admin), Analytics, Tag Manager
11. **Meta** - Pixel tracking
12. **ExchangeRate API** - Currency conversion

### 9.4 Image Optimization

Next.js Image component is used with remote patterns configured for all hotel image providers. The `sharp` package (`@img/sharp-darwin-arm64`) handles server-side image optimization.

### 9.5 Analytics & Tracking

Three tracking systems are integrated via the `Analytics` component in the root layout:

1. **Google Analytics 4** - Page views, events
2. **Google Tag Manager** - Tag management container
3. **Meta Pixel** - Facebook conversion tracking

Additionally, a **Travelpayouts verification script** is loaded in the document head:
```html
<Script src="https://tpembars.com/NDk2MDgz.js?t=496083" strategy="beforeInteractive" />
```

**Files:**
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/components/analytics/GoogleAnalytics.tsx`
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/components/analytics/GoogleTagManager.tsx`
- `/Users/spirosmaragkoudakis/Projects/globehunters-holidays-website/src/components/analytics/MetaPixel.tsx`

---

## 10. Known Issues & Recent Changes

### 10.1 The RateHawk Autocomplete Bug (Resolved)

**Problem:** When users searched for European cities like "Athens" or "Paris", the RateHawk `/search/multicomplete/` endpoint sometimes returned the American city first (Athens, Georgia or Paris, Texas).

**Solution implemented in HotelBeds geocoder:**
```typescript
// File: /src/lib/hotelbeds.ts (lines 659-668)
// Deprioritize US results for common European city names
const sorted = data.sort((a, b) => {
  const aIsUS = a.address?.country_code === "us";
  const bIsUS = b.address?.country_code === "us";
  if (aIsUS && !bIsUS) return 1;
  if (!aIsUS && bIsUS) return -1;
  return (b.importance || 0) - (a.importance || 0);
});
```

Additionally, a hardcoded `CITY_COORDINATES` cache ensures the 30+ most popular tourist cities always resolve to the correct coordinates without any geocoding API call.

### 10.2 Hotel Search Speed Optimization (35s -> 6s)

**Problem:** The original hotel search called RateHawk's `/hotel/info/` endpoint individually for each hotel (rate limited to 30/min). For a page of 30 hotels, this took approximately 35 seconds.

**Solution (commit `947a118`):** The SERP endpoint (`/search/serp/region/`) returns inline data including `name`, `star_rating`, `images[]`, `latitude`, `longitude`. The system now uses this inline data directly instead of calling `/hotel/info/`, and only fetches detailed info on-demand when a user clicks into a specific hotel.

### 10.3 Broken Hotel Images

**Problem:** Multiple rounds of image fixes were needed:
- HotelBeds Booking API returns no images (only the Content API does)
- RateHawk images use `{size}` placeholder that must be replaced
- Some Unsplash URLs expired or returned 404

**Solutions (commits `b7e2f88`, `4f4742f`, `d4258f9`):**
- All HotelBeds hotels are now enriched via the Content API in parallel (batches of 100)
- Category-based placeholder images for hotels without real photos
- Hash-based unique Unsplash URLs so no two hotels show the same placeholder

### 10.4 Broken Destination Hero Images

**Problem:** Several package hero images from Unsplash were broken or showed the wrong destination.

**Solutions (commits `e2bfd42`, `c1b3ef5`, `1706987`, `287fff9`, `869f496`):**
- 91 broken Unsplash images replaced with destination-specific alternatives
- Specific fixes for Hong Kong, Jordan, Costa Rica, Budapest, Zanzibar, Milan

### 10.5 Current Limitations

1. **No Direct Booking** - The site is lead-generation only. Users must call to book. There is no payment processing or booking confirmation system.

2. **Static Package Prices** - The Top 50 packages show hardcoded starting prices that do not update automatically from API data.

3. **Static Airline Options** - Package detail pages show 4 fixed airlines with estimated prices rather than live flight search results.

4. **Admin Panel Password** - The admin panel uses a simple password stored in plain text in `data/admin-settings.json` (`globehunters2024`). This is not suitable for production.

5. **In-Memory Caching** - All caching is in-memory (module-level `Map` objects). This means cache is lost on server restart and is not shared across serverless function instances on Vercel.

6. **Rate Limiting** - RateHawk's `/hotel/info/` endpoint is limited to 30 requests per 60 seconds. The SERP-first approach mitigates this, but detailed hotel pages may still hit limits under load.

7. **No Database Integration Active** - While Drizzle ORM and Neon PostgreSQL are configured, the database appears to be used minimally. Most data is static JSON or in-memory.

8. **Klook Scraping** - The Klook integration relies on HTML scraping which is fragile and may break if Klook changes their page structure.

9. **Mock Data** - The Duffel and Amadeus adapters include mock data functions for when APIs are unavailable, but these are not clearly differentiated in the UI.

10. **HotelBeds API Rate Limit** - Production limit is 4 queries per second. The system does not implement explicit rate limiting against this; concurrent users could exceed the limit.

### 10.6 Security Considerations

1. Admin credentials are stored in a plain JSON file with a default password
2. The `.env.local` file contains live API credentials (properly gitignored)
3. API keys are validated at runtime with graceful fallbacks when missing
4. Input validation is in place for search parameters (UK airports, Top 50 destinations)
5. Google OAuth is configured for admin access restricted to the `globehunters.com` domain

---

## Appendix A: Complete API Route Map

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search/flights` | GET | Duffel flight search |
| `/api/search/hotels` | GET | Multi-provider hotel search |
| `/api/search/hotels/[id]` | GET | Hotel detail (RateHawk or HotelBeds) |
| `/api/search/packages` | GET | Full package search (flights + hotels + activities) |
| `/api/search/activities` | GET | Activity search (from static data or Viator) |
| `/api/attractions` | GET | OSM/Wikipedia attraction search |
| `/api/autocomplete/hotels` | GET | RateHawk destination autocomplete |
| `/api/hotels/content-by-name` | GET | HotelBeds Content API lookup by name |
| `/api/references` | GET/POST | Reference number management |
| `/api/sessions` | GET/POST | Session tracking |
| `/api/admin/auth` | POST | Admin authentication check |
| `/api/admin/login` | POST | Admin login |
| `/api/admin/settings` | GET/PUT | Admin settings CRUD |
| `/api/debug` | GET | Debug/health check |

## Appendix B: Page Route Map

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Homepage with hero video, search, Top 50 packages |
| `/packages` | `packages/page.tsx` | Package search results |
| `/packages/[id]` | `packages/[id]/page.tsx` | Package detail with hotel tiers, flights, activities |
| `/flights` | `flights/page.tsx` | Flight search results |
| `/flights/[id]` | `flights/[id]/page.tsx` | Flight detail |
| `/hotels` | `hotels/page.tsx` | Hotel search results (Booking.com-style) |
| `/hotels/[id]` | `hotels/[id]/page.tsx` | Hotel detail with rates and map |
| `/destinations` | `destinations/page.tsx` | Destination listing |
| `/destinations/[slug]` | `destinations/[slug]/page.tsx` | Destination detail |
| `/activities` | `activities/page.tsx` | Activities listing |
| `/about` | `about/page.tsx` | About GlobeHunters |
| `/contact` | `contact/page.tsx` | Contact information |
| `/faq` | `faq/page.tsx` | FAQ page |
| `/honeymoon` | `honeymoon/page.tsx` | Honeymoon packages |
| `/group-tours` | `group-tours/page.tsx` | Group tour packages |
| `/admin` | `admin/page.tsx` | Admin dashboard |
| `/admin/pricing` | `admin/pricing/page.tsx` | Markup management |
| `/admin/content` | `admin/content/page.tsx` | Content management |
| `/admin/phones` | `admin/phones/page.tsx` | Phone number management |
| `/admin/settings` | `admin/settings/page.tsx` | Admin settings |
| `/backoffice` | `backoffice/page.tsx` | Backoffice dashboard |

## Appendix C: External Image Domains

All configured in `next.config.ts` under `images.remotePatterns`:

| Domain | Provider | Content |
|--------|----------|---------|
| `images.unsplash.com` | Unsplash | Placeholder/hero images |
| `content.r9cdn.net` | KAYAK | Hotel images |
| `cf.bstatic.com` | Booking.com | Hotel images |
| `*.cloudinary.com` | Cloudinary | Various images |
| `pics.avs.io` | Aviasales | Airline logos |
| `cdn.worldota.net` | RateHawk | Hotel images |
| `photos.hotellook.com` | Hotellook | Hotel images |
| `photos.hotelbeds.com` | HotelBeds | Hotel images |
| `commons.wikimedia.org` | Wikipedia | Attraction images |
| `upload.wikimedia.org` | Wikipedia | Attraction images |

---

*End of Executive Summary*
