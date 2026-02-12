# GlobeHunters Holidays Website — All Findings in Plain English

**Date:** 11 February 2026
**Prepared for:** Spiros Maragkoudakis
**Based on work by:** 3 AI agents (Executive Summary Agent, API Hotel Tester Agent, The Architect)

---

## What This Document Is

Three agents were deployed to analyse and test the GlobeHunters Holidays website. This document brings together everything they found into one place, written in plain English so you can understand exactly what's going on, what works, what doesn't, and what needs fixing.

---

## Part 1: What The Website Actually Is

GlobeHunters Holidays is a UK travel agency website that sells curated holiday packages. It's built with Next.js 16, React 19, and TypeScript, hosted on Vercel. Here's the key thing to understand:

**The site does NOT process bookings.** It's a lead generation tool. Customers browse packages, see prices, pick flights and hotels — then they call the GlobeHunters phone line (020 8944 4555) or WhatsApp to actually book. Every search creates a reference number (like `GH-A3B7K9`) so the sales team can find what the customer was looking at.

### The Two Modes

The site works in two distinct ways:

1. **Static Package Pages (the "Top 50")** — These are 50 pre-built holiday packages. When a user visits `/packages/pkg-santorini-001`, they see a curated page with estimated prices, 4 hotel tiers, 4 airlines, and local activities. **No live API calls** are made for pricing — everything is calculated from the package's starting price using percentage modifiers.

2. **Live Search** — When a user searches for a destination using the search bar, the site calls real APIs in real-time: Duffel for flights, RateHawk + HotelBeds + Travelpayouts for hotels, and OpenStreetMap + Wikipedia for attractions. These return actual live prices and availability.

### How Prices Work

For the static Top 50 packages, prices are **estimated**, not live:

- The package has a starting price (e.g., £899 for Santorini)
- **40% goes to flights** (£360), **60% goes to hotels** (£540)
- Hotel tiers adjust the hotel portion: Budget is 30% cheaper, Standard is base price, Deluxe is 40% more, Luxury is 90% more
- Board type adds more: Room Only is base, B&B adds 15%, Half Board adds 35%, All Inclusive adds 60%
- Airlines adjust the flight portion: British Airways is base, Emirates adds 15%, Qatar adds 10%, Turkish is 5% cheaper

All this maths happens in the browser — no server calls needed.

---

## Part 2: The Hotel Image Bug (Why We Did All This)

### The Original Problem

When you visit a package page and pick a hotel tier (Budget, Standard, Deluxe, or Luxury), the image shown below is supposed to be of that specific hotel. **It wasn't.** The images were either generic Unsplash stock photos or, worse, photos of the completely wrong hotel.

### What Was Happening

The old system used **RateHawk's autocomplete API** to find hotels by name. You'd type "Grace Santorini" and it would return a list of possible matches. The code blindly picked the **first result** — but the first result was often wrong. For example:

- "Grace Santorini" → returned "Santorini Grace Villa No. 2" (a random villa) instead of the actual Grace Hotel
- The correct hotel was the 5th result in the list, not the 1st

### What We Fixed

We completely replaced the RateHawk image lookup with **HotelBeds Content API**. This is a separate system specifically designed to return hotel photos, descriptions, and facilities. The new flow:

1. **Fast path**: If we already know the hotel's HotelBeds code number (e.g., `89600` for Canaves Oia Suites), we fetch images directly — instant and always correct
2. **Fallback path**: If we don't know the code, we search HotelBeds by hotel name + country. This uses a fuzzy matching algorithm (exact match → partial match → word overlap scoring)
3. **Last resort**: If HotelBeds can't find the hotel, it falls back to Unsplash placeholder images

A new API endpoint was created: `/api/hotels/content-by-name` — you can call it with either a hotel code or a name + country, and it returns real images from HotelBeds.

---

## Part 3: The API Test Results (36 Hotels Tested)

The API Hotel Tester agent tested 36 hotels across all 12 destinations — 3 tiers per destination (budget, deluxe, luxury). Here are the results in plain English.

### The Scorecard

| What | Number |
|------|--------|
| Hotels tested | 36 |
| Found with correct images | 26 (72%) |
| Found but WRONG hotel returned | 5 (14%) |
| Weak/questionable match | 1 (3%) |
| Not found at all | 4 (11%) |

### Destination-by-Destination Breakdown

**Santorini** — Mostly good
- Budget (Santorini Palace): Found correctly
- Deluxe (Grace Santorini): **WRONG** — returned "Brown Acropol" which is a hotel in Athens, not Santorini
- Luxury (Canaves Oia Suites): Found correctly

**Dubai** — One wrong match
- Budget (Dubai City Inn): **WRONG** — returned "Millennium Downtown Abu Dhabi" which is in Abu Dhabi, not even Dubai. Note: "Dubai City Inn" is likely a made-up name; no real hotel has this exact name
- Deluxe (Atlantis The Palm): Found correctly
- Luxury (Burj Al Arab Jumeirah): Found (acceptable match)

**Paris** — Weakest European result
- Budget (Hotel Belleville): **WEAK** — returned a hotel outside central Paris, near a highway
- Deluxe (Le Bristol Paris): Found correctly
- Luxury (Four Seasons George V): **WRONG** — returned "Therese" which is a small unrelated hotel

**Bali** — Mixed
- Budget (Bali Kuta Resort): Not found
- Deluxe (The Mulia Bali): **WRONG** — returned "Bali Rich Villas Seminyak Beach" which is a budget villa complex
- Luxury (COMO Shambhala Estate): Found correctly

**Bangkok** — One wrong
- Budget (Bangkok City Inn): Found correctly (code: 253361)
- Deluxe (Mandarin Oriental Bangkok): **WRONG** — returned "The Athenee Hotel" which is a different hotel entirely
- Luxury (Mandarin Oriental Bangkok): Found correctly (code: 26761)

**Maldives** — Clean
- Budget (Bandos Maldives): Found (acceptable match)
- Deluxe (Niyama Private Islands): Found correctly
- Luxury (Soneva Fushi): Found correctly

**London** — TOTAL FAILURE
- Budget (Premier Inn London City): Not found
- Deluxe (The Savoy): Not found
- Luxury (The Ritz London): Not found
- **All three London hotels failed.** This is the most critical issue. London is arguably the #1 market for a UK-based travel agency.

**Rome** — Clean
- Budget (Hotel Lazio): Found correctly
- Deluxe (Hotel de Russie): Found (acceptable)
- Luxury (Hotel Eden Rome): Found correctly

**Tokyo** — Perfect
- Budget (Shinjuku Granbell Hotel): Found correctly
- Deluxe (Park Hyatt Tokyo): Found correctly
- Luxury (Aman Tokyo): Found correctly

**Singapore** — Clean
- Budget (Hotel Boss): Found (acceptable — name matched as "Boss")
- Deluxe (Marina Bay Sands): Found correctly
- Luxury (Raffles Hotel Singapore): Found correctly

**Barcelona** — Clean
- Budget (Hotel Rialto): Found (acceptable)
- Deluxe (Hotel Arts Barcelona): Found (acceptable)
- Luxury (W Barcelona): Found (acceptable)

**Amsterdam** — Clean
- Budget (Hotel V Nesplein): Found correctly
- Deluxe (Waldorf Astoria Amsterdam): Found correctly
- Luxury (De L'Europe Amsterdam): Found (acceptable)

### Verified HotelBeds Codes Ready to Use

The tester produced 25 verified codes that can be hardcoded into the website for instant, guaranteed-correct image lookups:

| Destination | Budget | Deluxe | Luxury |
|-------------|--------|--------|--------|
| Santorini | 9003 | — | 89600 |
| Dubai | — | 7657 | 7660 |
| Paris | — | 9061 | — |
| Bali | — | — | 93198 |
| Bangkok | 253361 | — | 26761 |
| Maldives | 108520 | 111636 | 169878 |
| London | — | — | — |
| Rome | 5633 | 191427 | 5680 |
| Tokyo | 383967 | 123898 | 526501 |
| Singapore | 431338 | 125839 | 69629 |
| Barcelona | 641 | 3500 | 2913 |
| Amsterdam | 17756 | 197418 | 757360 |

A "—" means the code needs to be found manually or the hotel name needs changing.

---

## Part 4: The Architect's QA Review

The Architect agent reviewed both deliverables and scored them.

### Executive Summary: 8.5 / 10 — PASS WITH CONDITIONS

**What was good:**
- All 10 required sections were present and well-documented
- Every tech stack version was verified against the actual code
- Code snippets include exact file paths and line numbers
- The document explains things clearly for both technical and non-technical readers
- All 10 API integrations were documented with authentication methods, endpoints, and data flows
- The RateHawk-to-HotelBeds migration timeline was included with commit references

**What was missing:**
- Three critical configuration maps were NOT documented: `DESTINATION_HOTEL_NAMES` (the map of which hotel name appears for each destination/tier), `DESTINATION_HOTEL_CODES` (the map of HotelBeds code numbers — currently empty), and `DESTINATION_COUNTRIES` (the map of destinations to country codes). These are arguably the most important maps in the entire system because they control what the user actually sees.

### API Hotel Tester: 7.0 / 10 — PASS WITH CONDITIONS

**What was good:**
- All 12 destinations were tested
- Results are clearly annotated (exact match, good match, wrong match, not found)
- The Failed Lookups sheet provides practical fix suggestions
- A ready-to-paste code snippet was provided for the verified codes

**What was missing:**
- The **Standard tier was completely skipped** — only Budget, Deluxe, and Luxury were tested. Standard is the default tier (0% modifier) and probably the most commonly selected. That's 12 untested hotels.
- No end-to-end verification that the images actually display correctly in the website's image pipeline
- Some "OK" matches that are actually correct (like "Boss" for "Hotel Boss") weren't marked as high confidence

---

## Part 5: What Needs Fixing (Priority Order)

### URGENT — Must Fix Now

**1. Hardcode the 25 verified HotelBeds codes**

The codes are ready (listed above). They need to be pasted into the `DESTINATION_HOTEL_CODES` map in `page.tsx` (line 880). Right now this map is completely empty — every page view triggers a slow name-based API search instead of a fast direct code lookup. This is literally a copy-paste job that will:
- Make image loading much faster (direct code lookup vs name search)
- Eliminate wrong-match errors for the 25 verified hotels
- Reduce API calls to HotelBeds

**2. Fix London (all 3 hotels are broken)**

None of the London hotels were found by HotelBeds. This is catastrophic for a UK travel agency. Possible causes:
- The country code "GB" might not work as expected in HotelBeds (they might use "UK" or something else)
- The hotel names might not match HotelBeds' database (e.g., "The Savoy" might be listed as "Savoy London" or "The Savoy, A Fairmont Managed Hotel")
- The Content API's country filter might work differently for the UK

**Action needed:** Manually search HotelBeds for London hotels, find the correct codes, and hardcode them.

**3. Fix the 5 wrong hotel matches**

These hotels return images of the completely wrong property:

| Our Hotel Name | What HotelBeds Returns | The Problem |
|---------------|----------------------|-------------|
| Grace Santorini | Brown Acropol | Shows an Athens hotel instead of Santorini |
| Dubai City Inn | Millennium Downtown Abu Dhabi | Shows an Abu Dhabi hotel instead of Dubai |
| Four Seasons George V | Therese | Shows a tiny Paris hotel instead of a 5-star palace |
| The Mulia Bali | Bali Rich Villas Seminyak Beach | Shows budget villas instead of a luxury resort |
| Mandarin Oriental Bangkok | The Athenee Hotel | Shows a completely different Bangkok hotel |

**Fix options:**
- Option A: Find the correct HotelBeds code for each hotel manually and add it to `DESTINATION_HOTEL_CODES`
- Option B: Rename the hotel in `DESTINATION_HOTEL_NAMES` to match what HotelBeds actually has (e.g., "Dubai City Inn" is probably not a real hotel name — replace it with a real budget hotel like "Rove Downtown Dubai")

### IMPORTANT — Should Fix Soon

**4. Test the 12 Standard-tier hotels**

These were completely skipped by the tester:
- Dubai Marina Resort
- Mercure Paris Montmartre
- Padma Resort Legian (Bali)
- Anantara Riverside Bangkok
- Sun Island Resort & Spa (Maldives)
- DoubleTree by Hilton Tower of London
- Hotel Artemide (Rome)
- The Prince Park Tower Tokyo
- Pan Pacific Singapore
- H10 Marina Barcelona
- Athina Luxury Suites (Santorini)
- NH Amsterdam Centre

Standard is the default selection — it's what most users will see first.

**5. Update the Executive Summary**

Add the three missing maps (`DESTINATION_HOTEL_NAMES`, `DESTINATION_HOTEL_CODES`, `DESTINATION_COUNTRIES`) to Section 8. These are the most operationally important configuration maps.

**6. Document the name-matching weakness**

The fuzzy matching algorithm fails ~14% of the time for generic hotel names. This should be noted as a known issue. The recommendation: always hardcode HotelBeds codes rather than relying on name-based searches.

### NICE TO HAVE — Eventually

**7. Replace made-up hotel names with real ones**

Some hotel names like "Dubai City Inn" appear to be generated generically (pattern: `{Destination} City Hotel`). They're not real hotels. Replace them with actual hotels that exist in HotelBeds.

**8. Consider storing codes in a database**

Currently, hotel codes are hardcoded in the source code. Every time you want to change a hotel, you need a code change and redeployment. A simple database table would make this much easier to manage.

---

## Part 6: How The Whole System Connects (The Big Picture)

Here's how everything ties together, from the moment a user lands on a package page to seeing hotel images:

```
User visits /packages/pkg-santorini-001
        |
        v
1. page.tsx loads static package data from top50-packages.json
   (destinationId: "santorini", startingPrice: £899)
        |
        v
2. generateHotelOptions() creates 4 hotel cards:
   - Looks up DESTINATION_HOTEL_NAMES["santorini"] for real hotel names
     (Budget: "Santorini Palace", Standard: "Athina Luxury Suites",
      Deluxe: "Grace Santorini", Luxury: "Canaves Oia Suites")
   - Looks up DESTINATION_HOTEL_CODES["santorini"] for HotelBeds codes
     (Currently empty — this is what needs to be populated!)
   - Looks up DESTINATION_COUNTRIES["santorini"] → "GR"
   - Calculates prices using tier modifiers
        |
        v
3. User clicks on a hotel tier (e.g., "Luxury")
        |
        v
4. fetchHotelDetails useEffect fires:
   - If hotelBedsCode exists → calls /api/hotels/content-by-name?code=89600
     (FAST: direct lookup, always correct)
   - If no code but countryCode exists → calls
     /api/hotels/content-by-name?name=Canaves+Oia+Suites&country=GR
     (SLOWER: name search, may return wrong hotel)
   - If neither → shows placeholder image
        |
        v
5. The API endpoint either:
   a) Fetches hotel content directly by code from HotelBeds Content API
   b) Lists ALL hotels in the country, fuzzy-matches by name, then fetches content
        |
        v
6. Returns to the browser:
   - Real hotel images (from photos.hotelbeds.com)
   - Hotel description
   - Facilities list
   - Address and city
        |
        v
7. The page displays the real hotel image below the selection cards
```

### The 10 APIs The Site Uses

| # | API | What It Does | Used For |
|---|-----|-------------|----------|
| 1 | **Duffel** | Flight search | Only flight provider. Real-time prices and schedules |
| 2 | **RateHawk** | Hotel search (primary) | Live hotel inventory, prices, availability |
| 3 | **HotelBeds Booking** | Hotel search (secondary) | Supplementary hotel inventory |
| 4 | **HotelBeds Content** | Hotel images & info | Real hotel photos, descriptions, facilities |
| 5 | **Travelpayouts** | Hotel search (tertiary) | Price comparison from Hotellook engine |
| 6 | **OpenStreetMap** | Geocoding + attractions | Converts city names to coordinates, finds tourist spots |
| 7 | **Wikipedia** | Attraction descriptions | Descriptions and photos for attractions |
| 8 | **Viator** | Activities/tours | Premium activity listings with booking URLs |
| 9 | **Klook** | Activities (scraped) | Additional activities via web scraping |
| 10 | **ExchangeRate API** | Currency conversion | GBP/EUR/USD/AUD conversion rates |

Plus legacy APIs (Amadeus for hotels, GlobeHunters internal) that exist in code but aren't actively used.

---

## Part 7: Key Numbers At A Glance

| Metric | Value |
|--------|-------|
| Total curated packages | 50 |
| Featured packages (homepage) | 15 |
| Destinations covered | 48+ |
| Hotel tiers per package | 4 (budget, standard, deluxe, luxury) |
| Airline options per package | 4 (BA, Emirates, Qatar, Turkish) |
| Board type options | 4 (Room Only, B&B, Half Board, All Inclusive) |
| API integrations | 10 active |
| HotelBeds hotels tested | 36 |
| Correct match rate | 72% |
| Wrong matches found | 5 |
| Total failures (not found) | 4 |
| London hotels working | 0 out of 3 |
| Verified HotelBeds codes ready | 25 |
| Standard-tier hotels tested | 0 out of 12 |

---

## Part 8: Files That Matter Most

If you ever need to change how things work, these are the files to look at:

| File | What It Controls |
|------|-----------------|
| `src/app/packages/[id]/page.tsx` | The entire package detail page — hotel tiers, airlines, pricing, hotel image fetching |
| `src/lib/hotelbeds.ts` | All HotelBeds API integration — booking search, content/images, name matching |
| `src/app/api/hotels/content-by-name/route.ts` | The new API endpoint for fetching hotel images by name or code |
| `src/app/api/search/hotels/route.ts` | Multi-provider hotel search (RateHawk + HotelBeds + Travelpayouts) |
| `src/app/api/search/hotels/[id]/route.ts` | Hotel detail page API (supports content-only mode for packages) |
| `src/data/top50-packages.json` | All 50 curated package definitions |
| `src/data/destination-activities.json` | Activities for each destination |
| `next.config.ts` | Image domain allowlist (must include any new image sources) |
| `data/admin-settings.json` | Admin markup percentages and password |

---

## Summary

**The good news:** The hotel image bug has been fixed architecturally. The system now uses HotelBeds Content API instead of unreliable RateHawk autocomplete. The build compiles cleanly. 72% of hotels already resolve correctly.

**The bad news:** London is completely broken (0/3 hotels found), 5 hotels show wrong images, the standard tier is untested (12 hotels), and the verified codes haven't been hardcoded yet — meaning the site is still doing slow name-based lookups for every hotel.

**The bottom line:** The hardest part (building the new system) is done. What remains is mostly data entry (hardcoding codes) and manual investigation (London, wrong matches). Once the 25 codes are hardcoded and London is fixed, the hotel image system will be reliable for the vast majority of destinations.

---

*End of consolidated findings.*
