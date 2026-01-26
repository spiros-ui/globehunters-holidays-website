# Booking.com API Research Report

## Executive Summary

This document provides comprehensive research on obtaining real hotel and flight data for the GlobeHunters Holidays website. The research covers Booking.com's official APIs, affiliate programs, alternative aggregator APIs, and third-party marketplace options.

**Key Finding:** Booking.com does not offer a public API. Access is granted only to approved Affiliate Partners and Connectivity Partners. However, multiple alternative approaches exist for obtaining travel inventory data.

---

## Table of Contents

1. [Booking.com Demand API](#1-bookingcom-demand-api)
2. [Booking.com Affiliate Program](#2-bookingcom-affiliate-program)
3. [Alternative Aggregator APIs](#3-alternative-aggregator-apis)
4. [RapidAPI and Marketplaces](#4-rapidapi-and-marketplaces)
5. [GDS Providers (Amadeus, Sabre, Travelport)](#5-gds-providers)
6. [Web Scraping Considerations](#6-web-scraping-considerations)
7. [Recommendations](#7-recommendations)

---

## 1. Booking.com Demand API

### Overview

The Booking.com Demand API enables Affiliate Partners to access Booking.com's travel inventory, including:
- **Accommodations** (hotels, apartments, villas, etc.)
- **Car rentals**
- **Flights** (expanding area, available in API V3)
- **Attractions** (expanding area)

### Current Status

**IMPORTANT:** As of 2025, Booking.com is NOT accepting new registrations on the Connectivity Partner portal due to updating of terms and conditions. They aim to re-open registrations once their new terms are released.

The Affiliate Partner Program (see Section 2) remains open for applications.

### API Versions

| Version | Status | Features |
|---------|--------|----------|
| V3.1 | Current (Latest) | All travel products in one API, fastest performance |
| V3 | Active | First unified API for all verticals |
| V2 | Legacy | Being phased out |

### Technical Specifications

- **Protocol:** RESTful API with JSON responses
- **Authentication:** API key token + Affiliate ID (Bearer token auth)
- **Request Method:** HTTPS POST
- **Sandbox:** Available for testing with sample properties
- **Rate Limits:** Production allows 40 requests/user/second

### Requirements to Access

1. Must be registered as a **Booking.com Managed Affiliate Partner**
2. Access to Partner Centre
3. Generate valid API key and X-Affiliate-Id
4. For booking functionality: Must be **PCI DSS-compliant**

### Key Restrictions

- Prices cannot be modified or cached
- Data forwarding/forward distribution is strictly forbidden
- Commission rates and usage rules must be followed
- Authentication method change: Credential-based auth sunset date is **December 31, 2025**

### Pricing

**FREE** - No charges for API access for approved partners. Partners earn commission on bookings.

### Resources

- [Booking.com Developers Portal](https://developers.booking.com/)
- [Demand API Documentation](https://developers.booking.com/demand)
- [API V3 Information](https://partnerships.booking.com/api-v3)

---

## 2. Booking.com Affiliate Program

### Program Overview

The Affiliate Partner Program is open to:
- Large companies and online portals
- Travel bloggers and influencers
- Travel agents (independent)
- Website owners with travel-related content

### Commission Structure

| Product | Commission Rate |
|---------|-----------------|
| Accommodations | Starting at 4% per completed stay |
| Car Rentals | 6% per completed rental |
| Flights | GBP 2 / EUR 2 per flight |

### Cookie Duration

**30 days** - Earn commission on bookings completed within 30 days of user's initial click.

### Available Inventory

- 28+ million accommodations
- 60,000+ locations worldwide
- Transportation options
- Attractions

### Application Process

#### Step 1: Choose Your Region's Affiliate Network

| Region | Network |
|--------|---------|
| Austria, France, Germany, Italy, Spain, Switzerland, UK, Benelux, Eastern Europe, Nordic, Middle East | **CJ Affiliate** |
| Australia, Brazil, Latin America, North America, Asia Pacific | **Awin** |

#### Step 2: Registration Requirements

1. Navigate to [Booking.com Affiliate Partner Center](https://partnerships.booking.com/)
2. Provide user information (administrator name, email, phone)
3. Create network profile with business model description
4. Specify promotional property (website/app details)
5. Submit company details and tax forms (W-9 or W-8BEN)
6. Provide payment information
7. Wait for approval confirmation email

#### Step 3: Post-Approval

1. Access dashboard and affiliate tools
2. If you need API access, present your integration project
3. Complete multi-stage approval for API activation

### Available Tools

- Customizable banners
- Text links
- Search boxes
- Widgets

### Important Notes

- Booking.com does NOT provide voucher codes
- Publishers listing discount vouchers will be removed from the program
- API access requires additional approval after affiliate status

### Resources

- [Affiliate Program Signup](https://www.booking.com/affiliate-program/v2/index.html)
- [Affiliate Support Centre](https://affiliates.support.booking.com/kb/s/)
- [Partnerships Hub](https://partnerships.booking.com/)

---

## 3. Alternative Aggregator APIs

### Option A: Agoda API (Same Parent Company - Booking Holdings)

Agoda is part of Booking Holdings (same as Booking.com) and offers developer-friendly APIs.

**Inventory:**
- Extensive Asia-Pacific coverage
- Global hotel inventory

**Partnership Models:**

| Model | Description | API Requirements |
|-------|-------------|------------------|
| Online Affiliates/MSE | Price comparison sites | Search API only |
| Agoda Fulfill Assisted | Booking without post-booking services | Search + Book API |
| Partner Fulfillment | Full control including customer service | Search + Book + Post Book API |

**APIs Available:**
- Search API (availability & rates)
- Content API (property info, photos)
- Book API (reservations)
- Post Book API (cancellations, modifications)

**Pricing:** Free for approved affiliate partners (commission-based)

**Resources:**
- [Agoda Developer Portal](https://partners.agoda.com/DeveloperPortal/)
- [Agoda Partner Center](https://partners.agoda.com/)

---

### Option B: Hotelbeds API

One of the largest B2B hotel wholesalers globally.

**Inventory:** 180,000+ hotels worldwide

**APIs Available:**
- Booking API (availability, rates, reservations)
- Content API (property details, images)
- Cache API (bulk data for analysis)

**Pricing Models:**
- Net Model (wholesale prices)
- Commission Model (commission included in selling rate)

**Getting Started:**
1. Register for free API key at [Developer Portal](https://developer.hotelbeds.com/)
2. Access Evaluation Plan with generic key
3. Complete profile for commercial assessment
4. Get certified for proper integration
5. Go live

**Resources:**
- [Hotelbeds Developer Portal](https://developer.hotelbeds.com/)

---

### Option C: Expedia Rapid API

**Inventory:** 700,000+ accommodations in 250,000 destinations

**Features:**
- Search, Geography, and Content APIs
- Shopping and Booking APIs
- Post-Booking APIs
- 13+ million property images
- Hold & Resume functionality
- Cross-sell recommendations

**Requirements:**
- Must be PCI compliant for Property Collect bookings
- Can use EPS Checkout as alternative

**Resources:**
- [Expedia Rapid API](https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api)
- [Partner Registration](https://partner.expediagroup.com/en-us/join-us/rapid-api)

---

### Option D: RateHawk API

**Inventory:** 2.5 million options in 220 countries

**Pricing:** **FREE** to use

**Features:**
- Easy and customized API integration
- Rich hotel content
- Fast response times
- Special B2B rates

---

### Option E: Vio API

**Features:**
- Aggregates prices from multiple OTAs
- Includes Expedia, Trip.com, Agoda, and others
- Price comparison functionality

---

### Option F: Gimmonix (Travolutionary)

**Inventory:** 3.5 million properties from 80+ suppliers

**Features:**
- Single API access to aggregated hotel deals
- Distribution across OTAs

---

## 4. RapidAPI and Marketplaces

### RapidAPI Hotel APIs

RapidAPI hosts various travel-related APIs on their marketplace.

**Available Options:**

| API | Description |
|-----|-------------|
| Booking COM (by DataCrawler) | Third-party API for Booking.com data |
| Hotels.com API (by APIDojo) | Real-time Hotels.com data |
| Hotel Services | Various hotel search capabilities |

**Note:** These are third-party APIs, not official Booking.com APIs. Use with caution and verify compliance with terms of service.

**Resources:**
- [RapidAPI Hotel APIs Collection](https://rapidapi.com/collection/hotels-apis)
- [RapidAPI Travel & Hospitality](https://rapidapi.com/travel/)

### Makcorps Hotel Price API

**Pricing:** Free/low-cost tier available

**Features:**
- Price comparison data from 200+ OTAs
- Hotel name, location, real-time pricing
- Competitor rate comparison
- JSON format, bulk search support

---

## 5. GDS Providers

### Global Distribution Systems Comparison

| Feature | Amadeus | Sabre | Travelport |
|---------|---------|-------|------------|
| Global Reach | 190+ countries | 160 countries | 180 countries |
| Airlines | 400+ | 400+ | Major airlines |
| Hotels | 150,000+ | Extensive | 650,000+ |
| Travel Agencies | Leading worldwide | 55,000+ | Global network |

### Amadeus Self-Service APIs

**Best for:** Startups and independent developers

**Free Tier:**
- 200 to 10,000 free requests/month (varies by API)
- Full sandbox testing environment
- Flight Order Management: up to 10,000 free calls

**APIs Available:**
- Flight Offers Search (500+ airlines)
- Hotel Search
- Car Rental
- Airport & City Search
- Points of Interest

**Limitations (Self-Service):**
- Does NOT include: American Airlines, Delta, British Airways, low-cost carriers
- Need Enterprise subscription for full inventory

**Enterprise Upgrade:**
- Access to all airlines including low-cost carriers
- Negotiated fares and special deals
- Higher rate limits

**Rate Limits:**
- Test: 10 requests/user/second
- Production: 40 requests/user/second

**Resources:**
- [Amadeus for Developers](https://developers.amadeus.com/)
- [Pricing Page](https://developers.amadeus.com/pricing)
- [Self-Service APIs](https://developers.amadeus.com/self-service)

---

### Sabre

**Features:**
- Strong legacy in airline distribution
- Rich airline content including ancillaries
- Seat selection, baggage options
- Dynamic pricing tools

**Resources:**
- [Sabre Dev Studio](https://developer.sabre.com/)

---

### Travelport

**Features:**
- Universal API (SOAP/XML)
- Single point of access to air, hotel, car, rail
- First GDS to achieve Level 3 NDC aggregator compliance

**Resources:**
- [Travelport Developers](https://developer.travelport.com/)

---

## 6. Web Scraping Considerations

### Legal Analysis

**Terms of Service:**
- Booking.com's terms explicitly prohibit automated scraping
- Their robots.txt discourages scraping (not legally enforceable)

**US Legal Perspective:**
- Data scraping from websites is generally legal in the US
- **Caveat:** Data cannot be simply reposted; must be transformed into new product

**Risks:**
- Violation of Terms of Service
- Legal consequences for commercial use
- IP blocking and account termination
- Reputational risk to business

### GDPR Considerations

- Cannot store PII of EU citizens without consent
- Must comply with data protection regulations

### Recommendation

**DO NOT recommend web scraping for commercial use.** The legal and business risks outweigh potential benefits. Official APIs and affiliate partnerships provide legitimate, sustainable access to data.

---

## 7. Recommendations

### Best Approach for GlobeHunters Holidays

#### Tier 1: Primary Recommendation

**Apply for Booking.com Affiliate Partner Program**

1. Apply through Awin (for North America) or CJ Affiliate (for Europe)
2. Complete registration with business details
3. Once approved, request API access
4. Present integration project for additional approval

**Pros:**
- Access to 28M+ accommodations
- No cost for API access
- Earn commissions on bookings
- Official, reliable data

**Cons:**
- Application approval required
- API access requires additional approval steps
- Connectivity Partner portal currently closed for new registrations

---

#### Tier 2: Parallel/Alternative Options

**Option A: Agoda Partner Program**
- Same parent company as Booking.com
- Developer-friendly API
- Good for additional inventory, especially Asia-Pacific

**Option B: Amadeus Self-Service APIs**
- Immediate access with free tier
- Good for flights (500+ airlines)
- Hotel inventory available
- Best for startups needing quick access

**Option C: Expedia Rapid API**
- 700,000+ accommodations
- Established partner support
- Good for US market focus

---

#### Tier 3: For Flights Specifically

| Provider | Best For |
|----------|----------|
| Kiwi.com Tequila API | Free access, flight search |
| Skyscanner API | 1,300+ suppliers, established |
| Amadeus | GDS access, enterprise needs |

---

### Implementation Roadmap

```
Phase 1 (Week 1-2):
- Apply for Booking.com Affiliate Program
- Register for Amadeus Self-Service (immediate access)
- Apply for Agoda Partner Program

Phase 2 (Week 3-4):
- Begin Amadeus integration for flights
- Await Booking.com/Agoda approvals
- Evaluate Skyscanner/Kiwi.com for flight backup

Phase 3 (Upon Approval):
- Integrate Booking.com Demand API for hotels
- Add Agoda as supplementary inventory
- Implement unified search across providers

Phase 4 (Optimization):
- Compare pricing and availability across providers
- Optimize API calls for performance
- Implement caching where permitted
```

---

## Summary Table

| Provider | Hotels | Flights | Free Tier | Application Required | Time to Access |
|----------|--------|---------|-----------|----------------------|----------------|
| Booking.com Demand API | Yes (28M+) | Yes (V3) | Free (commission) | Yes (affiliate + API approval) | 2-4 weeks |
| Agoda | Yes | No | Free (commission) | Yes | 1-2 weeks |
| Amadeus Self-Service | Yes (150K+) | Yes (400+ airlines) | 200-10K calls/month | No (self-service) | Immediate |
| Expedia Rapid | Yes (700K+) | No | Varies | Yes | 1-2 weeks |
| Hotelbeds | Yes (180K+) | No | Evaluation available | Yes | 1-2 weeks |
| Kiwi.com Tequila | No | Yes | Free | No (registration) | Immediate |
| Skyscanner | Yes | Yes | Free tier available | Yes (commercial) | 2 weeks |
| RateHawk | Yes (2.5M+) | No | Free | Yes | 1-2 weeks |

---

## Resources Quick Links

### Official Documentation
- [Booking.com Developers](https://developers.booking.com/)
- [Booking.com Partnerships Hub](https://partnerships.booking.com/)
- [Agoda Developer Portal](https://partners.agoda.com/DeveloperPortal/)
- [Amadeus for Developers](https://developers.amadeus.com/)
- [Expedia Rapid API](https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api)
- [Hotelbeds Developer Portal](https://developer.hotelbeds.com/)
- [Skyscanner Partners](https://www.partners.skyscanner.net/product/travel-api)
- [Kiwi.com Tequila](https://tequila.kiwi.com/)

### Application Links
- [Booking.com Affiliate Signup](https://www.booking.com/affiliate-program/v2/index.html)
- [Awin Network](https://www.awin.com/)
- [CJ Affiliate](https://www.cj.com/)
- [Amadeus Registration](https://developers.amadeus.com/register)

---

*Document created: January 26, 2026*
*Last updated: January 26, 2026*
