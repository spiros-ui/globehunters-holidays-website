# Booking.com UI/UX Specification Document

This document outlines the exact UI/UX patterns used by Booking.com for flight and hotel search results pages, compiled from extensive research of the platform, UX case studies, and design analysis.

---

## Table of Contents
1. [Flight Results Page](#flight-results-page)
2. [Hotel Results Page](#hotel-results-page)
3. [Common Design Patterns](#common-design-patterns)
4. [Sources and References](#sources-and-references)

---

## Flight Results Page

### Layout Structure

```
+------------------------------------------------------------------+
|                        HEADER / SEARCH BAR                        |
|  [Origin] --> [Destination]  [Dates]  [Passengers]  [Search]     |
+------------------------------------------------------------------+
|                                                                    |
| +----------------+  +------------------------------------------+  |
| |   FILTERS      |  |           FLIGHT RESULTS                 |  |
| |   SIDEBAR      |  |                                          |  |
| |                |  |  [Sort: Best | Cheapest | Fastest]       |  |
| | Stops          |  |                                          |  |
| | [ ] Direct     |  |  +------------------------------------+  |  |
| | [ ] 1 stop     |  |  | FLIGHT CARD                        |  |  |
| | [ ] 2+ stops   |  |  | Airline Logo | Times | Duration    |  |  |
| |                |  |  | DEP --> ARR  | Stops | Price       |  |  |
| | Duration       |  |  +------------------------------------+  |  |
| | [====slider===]|  |                                          |  |
| |                |  |  +------------------------------------+  |  |
| | Airlines       |  |  | FLIGHT CARD                        |  |  |
| | [ ] Airline 1  |  |  | ...                                 |  |  |
| | [ ] Airline 2  |  |  +------------------------------------+  |  |
| | [+ Show more]  |  |                                          |  |
| |                |  |                                          |  |
| | Departure Time |  |                                          |  |
| | [====slider===]|  |                                          |  |
| |                |  |                                          |  |
| | Price          |  |                                          |  |
| | $XXX - $XXX    |  |                                          |  |
| +----------------+  +------------------------------------------+  |
+------------------------------------------------------------------+
```

### Filters Available (Order)

1. **Stops**
   - UI Pattern: Checkboxes
   - Options: Direct, 1 stop, 2+ stops
   - Shows count of available flights per option

2. **Duration**
   - UI Pattern: Range slider
   - Shows maximum travel time
   - User can slide to set preferred max duration

3. **Airlines**
   - UI Pattern: Checkboxes with "Show more" expandable
   - Shows 5-6 airlines initially
   - Expandable to show all airlines
   - Each option shows flight count

4. **Departure Time**
   - UI Pattern: Time range slider
   - Outbound and return times separately

5. **Arrival Time**
   - UI Pattern: Time range slider

6. **Price**
   - UI Pattern: Price range display
   - Shows min-max range

7. **Baggage**
   - UI Pattern: Checkboxes
   - Options for included baggage

### Flight Card Layout and Information Hierarchy

```
+------------------------------------------------------------------+
| [Airline Logo]                                          [PRICE]  |
|                                                         per person|
| OUTBOUND                                                         |
| 06:15 ---------> 14:30    8h 15m    Direct / 1 stop             |
| LHR            JFK         Duration   Stops info                 |
|                                                                   |
| RETURN (if applicable)                                           |
| 18:00 ---------> 06:30+1  7h 30m    Direct                       |
| JFK            LHR                                               |
|                                                                   |
| [Included: Personal item] [Cabin bag: extra]                     |
|                                                         [View Deal]|
+------------------------------------------------------------------+
```

**Information Hierarchy (Top to Bottom):**
1. Price (most prominent, right-aligned)
2. Flight times (departure and arrival)
3. Duration
4. Number of stops
5. Airline name/logo
6. Baggage information
7. CTA button

### Sorting Options

1. **Best** (Default)
   - Algorithm considers: price, travel time, number of stops, baggage allowance
   - Labeled as "Our top picks" on some pages

2. **Cheapest**
   - Lowest price first

3. **Fastest**
   - Shortest travel time first

### Color Scheme for Flights

- Primary blue (#003580) for headers and CTAs
- White/light gray backgrounds for cards
- Green accents for positive indicators (good deals)
- Yellow (#FEBA02) for promotional badges
- Gray text for secondary information

### Mobile vs Desktop Differences

**Desktop:**
- Left sidebar filters visible by default
- Results in center column
- Multiple cards visible at once
- Horizontal card layout

**Mobile:**
- Filters hidden behind "Filter" button
- Full-width cards
- Sticky search bar at top
- Bottom navigation bar
- Filter modal/drawer opens from bottom
- Simplified card layout with stacked information

---

## Hotel Results Page

### Layout Structure

```
+------------------------------------------------------------------+
|                        HEADER / SEARCH BAR                        |
| [Destination] [Check-in] [Check-out] [Guests/Rooms] [Search]     |
+------------------------------------------------------------------+
|                                                                    |
| +----------------+  +------------------------------------------+  |
| |   FILTERS      |  |  SORTING BAR                             |  |
| |   SIDEBAR      |  |  [Sort: Our top picks v] [Map view]      |  |
| |                |  |                                          |  |
| | Your budget    |  |  +------------------------------------+  |  |
| | (per night)    |  |  | HOTEL CARD                         |  |  |
| | $0 ----o---- $ |  |  | +--------+ Hotel Name    [9.2]     |  |  |
| |                |  |  | | IMAGE  | Location        Superb   |  |  |
| | Popular filters|  |  | | GALLERY| Reviews count            |  |  |
| | [ ] Breakfast  |  |  | +--------+ Amenities icons          |  |  |
| | [ ] Free cancel|  |  |            Room type                 |  |  |
| | [ ] Pool       |  |  |            "Only 3 left!" [PRICE]   |  |  |
| | [ ] Pet friendly|  |  +------------------------------------+  |  |
| |                |  |                                          |  |
| | Star rating    |  |  +------------------------------------+  |  |
| | [ ] 5 stars    |  |  | HOTEL CARD                         |  |  |
| | [ ] 4 stars    |  |  | ...                                 |  |  |
| | [ ] 3 stars    |  |  +------------------------------------+  |  |
| |                |  |                                          |  |
| | Guest review   |  |                                          |  |
| | score          |  |                                          |  |
| | [ ] Superb: 9+ |  |                                          |  |
| | [ ] Very good  |  |                                          |  |
| | [ ] Good: 7+   |  |                                          |  |
| |                |  |                                          |  |
| | Property type  |  |                                          |  |
| | [ ] Hotels     |  |                                          |  |
| | [ ] Apartments |  |                                          |  |
| | [+ Show more]  |  |                                          |  |
| +----------------+  +------------------------------------------+  |
+------------------------------------------------------------------+
```

### Filters Available (Order)

1. **Your Budget (per night)**
   - UI Pattern: Range slider with dual handles
   - Shows histogram of price distribution
   - Min/max values displayed

2. **Popular Filters** (Quick access)
   - UI Pattern: Checkboxes
   - Options:
     - Breakfast included
     - Free cancellation
     - No prepayment
     - Pool
     - Pet friendly
     - Spa
     - Free WiFi
     - Parking

3. **Star Rating**
   - UI Pattern: Checkboxes with star icons
   - Options: 5 stars, 4 stars, 3 stars, 2 stars, Unrated
   - Each shows count of properties

4. **Guest Review Score**
   - UI Pattern: Checkboxes
   - Options:
     - Wonderful: 9+
     - Very Good: 8+
     - Good: 7+
     - Pleasant: 6+
   - Each shows count

5. **Property Type**
   - UI Pattern: Checkboxes with expandable list
   - Initial 5-6 shown
   - "Show more" reveals: Hotels, Apartments, Villas, Resorts, B&Bs, Hostels, Guesthouses, Homestays, Boats

6. **Facilities**
   - UI Pattern: Checkboxes
   - WiFi, Parking, Restaurant, Fitness center, etc.

7. **Room Facilities**
   - UI Pattern: Checkboxes
   - Air conditioning, Kitchen, Private bathroom, Balcony

8. **Bed Preference**
   - UI Pattern: Checkboxes
   - Twin beds, Double bed, King bed

9. **District/Neighborhood**
   - UI Pattern: Checkboxes with map reference

10. **Landmarks**
    - UI Pattern: Checkboxes
    - Distance from popular attractions

### Filter UI Patterns

- **Checkboxes**: Square boxes with check marks, blue when selected
- **Range Sliders**: Dual-handle sliders for price ranges
- **Expandable Sections**: Accordion-style, collapsed by default after top 5-6
- **Applied Filters**: Shown as chips/tags at top, with "X" to remove
- **Clear All**: Link to reset all filters
- **Results Count**: Updates dynamically as filters applied ("1,234 properties")

### Hotel Card Layout and Information Hierarchy

```
+------------------------------------------------------------------+
|  +------------------+                                             |
|  |                  |  Hotel Name Here                 [9.2]     |
|  |     IMAGE        |  Location, Distance from center   Superb   |
|  |    CAROUSEL      |  123 reviews                              |
|  |                  |                                             |
|  |  [1] [2] [3]     |  [Genius] [Free cancellation]              |
|  |  o   o   o       |                                             |
|  +------------------+  [WiFi] [Parking] [Pool] [Breakfast]       |
|                                                                   |
|  [Sustainability badge]    Room: Superior Double Room            |
|                            1 night, 2 adults                      |
|                                                                   |
|  "Only 3 rooms left at this price on our site"                   |
|                                                                   |
|                                        Original: $XXX   [$XXX]   |
|                                        per night         TOTAL   |
|                                                                   |
|                                        [See availability]        |
+------------------------------------------------------------------+
```

**Information Hierarchy:**
1. Property image (left, ~30-40% of card width)
2. Property name (prominent, bold)
3. Review score badge (top right, colored background)
4. Location and distance
5. Review count
6. Badges (Genius, sustainability, free cancellation)
7. Amenity icons
8. Room type
9. Urgency indicator
10. Price (prominent, bottom right)
11. CTA button

### Image Gallery Behavior

- **Thumbnail carousel** on card: 3-5 images visible as dots
- **Hover to browse**: Images change on hover (desktop)
- **Click to expand**: Opens lightbox gallery
- **Lightbox features**:
  - Full-screen view
  - Left/right navigation arrows
  - Thumbnail strip at bottom
  - Image count indicator (e.g., "3 of 24")
  - Close button (X)
  - Swipe gestures on mobile

### Price Display Format

```
Original: $299 (strikethrough if discounted)
$249
per night

Includes taxes and fees: $279 total
```

**Price Components:**
- **Nightly rate**: Most prominent
- **Strikethrough**: Original price when discounted
- **Genius discount**: Yellow highlight "-10%"
- **Per night**: Small text below price
- **Total price**: Shown with "includes taxes and fees"
- **Currency**: User's local currency

**FTC Compliance (US):**
- Total price shown upfront including mandatory fees
- Resort fees, service fees included in displayed total
- Only government taxes may be shown separately

### Badges and Urgency Indicators

**Trust Badges:**
- **Genius** (Blue logo): Loyalty program discount
- **Preferred** (Thumbs up): Partner property
- **Sustainability** (Green leaf): Eco-certified

**Urgency Indicators (Red/Orange text):**
- "Only X rooms left at this price on our site"
- "In high demand - booked X times in last 24 hours"
- "Booked X times today"
- "Last booked X minutes ago"
- "Limited-time deal"

**Quality Indicators:**
- **Yellow tiles**: Quality rating (1-5) for apartments/villas
- **Review score badge**: Colored by score
  - 9+ : Dark blue, "Superb" / "Exceptional"
  - 8-8.9: Blue, "Very Good"
  - 7-7.9: Light blue, "Good"
  - 6-6.9: Gray, "Pleasant"

**Promotional Badges:**
- "Free cancellation"
- "No prepayment needed"
- "Breakfast included"
- "Mobile-only price"

### Sorting Options

1. **Our Top Picks** (Default)
   - Algorithm based on:
     - Net bookings (bookings minus cancellations)
     - Review scores
     - Availability
     - Pricing
     - Content quality (photos, descriptions)
     - Commission rates

2. **Price (Lowest First)**
   - Sorted by nightly rate

3. **Best Reviewed & Lowest Price**
   - Combination of reviews and price

4. **Property Rating (High to Low)**
   - Star rating descending

5. **Distance from City Center**
   - Closest first

6. **Top Reviewed**
   - Highest guest review scores

### Map View Integration

**Toggle Behavior:**
- "Map" button/icon in sorting bar
- Click toggles between list and map view
- Some layouts show split view (list + map)

**Map Features:**
- **Markers**: Each property shown as price bubble
- **Hover**: Highlights corresponding card in list
- **Click marker**: Opens property preview card
- **Color coding**:
  - White markers: Available
  - Red dots: Sold out for selected dates
- **Controls**: Zoom +/-, fullscreen toggle
- **Provider**: Uses Google Maps / Mapbox

**Map View Card:**
```
+------------------------+
| [IMAGE]                |
| Hotel Name      [9.2]  |
| $XXX per night         |
| [See availability]     |
+------------------------+
```

### Mobile vs Desktop Differences

**Desktop:**
- Left sidebar filters (always visible)
- Wide card layout (image left, details right)
- Map toggle in sorting bar
- Hover effects on images
- Multiple cards visible
- ~1200px+ viewport

**Tablet:**
- Collapsible filter sidebar
- 2-column card layout option
- Touch-friendly controls

**Mobile:**
- **Filters**: Hidden behind "Filter" button (sticky)
- **Sort**: Dropdown selector
- **Cards**: Full-width, stacked layout
- **Images**: Swipeable carousel
- **Search**: Collapsible search bar
- **Bottom nav**: Persistent navigation
- **Filter drawer**: Slides up from bottom
- **Map**: Full-screen toggle
- **Sticky elements**:
  - Search bar
  - Filter/Sort buttons
  - Price comparison bar

**Mobile Card Layout:**
```
+---------------------------+
| [FULL WIDTH IMAGE]        |
| [o] [o] [o] carousel dots |
+---------------------------+
| Hotel Name         [9.2]  |
| Location            Superb|
| [Genius] [Free cancel]    |
| [WiFi] [Pool] [Parking]   |
| "Only 2 left!"            |
|                    $XXX   |
|              [See avail.] |
+---------------------------+
```

---

## Common Design Patterns

### Typography

**Font Stack (System Fonts):**
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

**Font Sizes (Approximate):**
- Headings (H1): 24-32px, bold
- Headings (H2): 20-24px, bold
- Property name: 16-18px, bold (600-700 weight)
- Body text: 14-16px, regular (400 weight)
- Small text: 12-13px
- Price: 18-24px, bold
- Badges: 12-14px, medium weight

**Line Heights:**
- Headings: 1.2-1.3
- Body: 1.4-1.5
- Cards: 1.3-1.4

### Color Palette

**Primary Colors:**
| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| Resolution Blue (Primary) | #003580 | rgb(0, 53, 128) | Headers, CTAs, links |
| Cerulean (Secondary Blue) | #009FE3 | rgb(0, 159, 227) | Highlights, accents |
| Selective Yellow | #FEBA02 | rgb(254, 186, 2) | Genius badges, promotions |
| Dove Gray | #666666 | rgb(102, 102, 102) | Secondary text |
| Black Squeeze (Light BG) | #F2F6FA | rgb(242, 246, 250) | Page backgrounds |

**Extended Palette:**
| Color | Hex | Usage |
|-------|-----|-------|
| White | #FFFFFF | Card backgrounds, text on dark |
| Black | #1A1A1A | Primary text |
| Light Gray | #E7E7E7 | Borders, dividers |
| Success Green | #008009 | Positive indicators, free cancellation |
| Warning Orange | #FF6600 | Urgency indicators |
| Error Red | #CC0000 | Alerts, sold out |
| Review Blue | #003580 | Review score 9+ |
| Review Light Blue | #5B9BD5 | Review score 8+ |

### Button Styles

**Primary CTA Button:**
```css
.btn-primary {
  background-color: #003580;
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}
.btn-primary:hover {
  background-color: #00264D;
}
```

**Secondary Button:**
```css
.btn-secondary {
  background-color: transparent;
  color: #003580;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #003580;
}
```

**Yellow Promotional Button:**
```css
.btn-promo {
  background-color: #FEBA02;
  color: #003580;
  /* Used for Genius deals, special offers */
}
```

**Button Sizes:**
- Small: 8px 16px padding, 12px font
- Medium: 12px 24px padding, 14px font
- Large: 16px 32px padding, 16px font

### Card Shadows and Borders

**Card Container:**
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E7E7E7;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #003580;
}
```

**Elevation Levels:**
```css
/* Level 1 - Cards */
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Level 2 - Hover / Modals */
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);

/* Level 3 - Dropdowns / Popovers */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
```

**Border Radius:**
- Cards: 8px
- Buttons: 4px
- Badges: 4px
- Images: 8px (cards), 0 (full-width mobile)
- Input fields: 4px
- Modals: 12px

### Spacing Patterns

**Base Unit: 4px**

**Spacing Scale:**
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

**Card Internal Padding:**
- Desktop: 16px
- Mobile: 12px

**Grid Gap:**
- Between cards: 16px (desktop), 12px (mobile)
- Filter sections: 24px

**Section Margins:**
- Between major sections: 32-48px

### Loading States

**Skeleton Loading (Shimmer):**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    #F2F6FA 25%,
    #E7E7E7 50%,
    #F2F6FA 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Skeleton Card Structure:**
```
+------------------------------------------------------------------+
|  +------------------+                                             |
|  | [SKELETON IMAGE] |  [==============] (title)                  |
|  |    Loading...    |  [========] (location)                     |
|  +------------------+  [====] (reviews)                          |
|                                                                   |
|                        [===] [===] [===] (badges)                |
|                                                                   |
|                                             [=====] (price)       |
+------------------------------------------------------------------+
```

**Loading Indicators:**
- Skeleton screens for initial load
- Spinner for filter updates
- Progress bar for search processing
- Inline loaders for lazy-loaded content

### Interactive States

**Checkbox (Filter):**
```
[ ] Unchecked: Border #CCC, Background white
[x] Checked: Border #003580, Background #003580, Check white
```

**Radio Button:**
```
( ) Unchecked: Border #CCC
(*) Checked: Border #003580, Fill #003580
```

**Slider (Price/Duration):**
```
Track: #E7E7E7 (inactive), #003580 (active range)
Handle: White circle with shadow, #003580 border
```

**Focus States:**
```css
:focus {
  outline: 2px solid #003580;
  outline-offset: 2px;
}
```

### Icons

**Icon Style:** Line icons, 1.5-2px stroke weight

**Common Icons:**
- WiFi: Signal waves
- Parking: "P" in circle
- Pool: Swimming figure
- Breakfast: Coffee cup / Utensils
- Pet-friendly: Paw print
- Location: Map pin
- Star: Filled star
- Heart: Outlined (save)
- Filter: Sliders / Funnel
- Sort: Up/down arrows
- Map: Folded map
- Calendar: Grid with header
- Person: User silhouette
- Search: Magnifying glass

**Icon Sizes:**
- Small: 16px
- Medium: 20px
- Large: 24px

### Responsive Breakpoints

```css
/* Mobile first approach */
/* Mobile: 0 - 575px */
/* Tablet: 576px - 991px */
/* Desktop: 992px - 1199px */
/* Large Desktop: 1200px+ */

@media (min-width: 576px) { /* Tablet */ }
@media (min-width: 992px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
```

---

## Sources and References

### Official Resources
- [Booking.com Official Site](https://www.booking.com/)
- [Booking.com Partner Resources](https://partner.booking.com/)
- [Booking.com Developer Documentation](https://developers.booking.com/)
- [Booking.com Design Blog](https://booking.design/)

### UX Case Studies
- [Baymard Institute - Booking.com UX Benchmark](https://baymard.com/ux-benchmark/case-studies/booking-com)
- [Medium - Booking.com UX Case Study by Filippo Rovelli](https://medium.muz.li/booking-com-ux-case-study-7ffb39e54791)
- [Medium - Booking.com UX Case Study by Karolina Cieslak](https://medium.com/@karolina.cieslak.pl/booking-com-a-ux-case-study-6e3d764e4707)
- [Medium - Elevating User Experience of Booking.com by S. Lavanya Shree](https://medium.com/design-bootcamp/elevating-user-experience-of-booking-com-a-ui-ux-case-study-6927e0056498)
- [Medium - Redesigning Booking.com UI Challenge by Isabelle Malmendier](https://bootcamp.uxdesign.cc/case-study-redesigning-booking-com-ui-challenge-72f70fa0e385)

### Design Platforms
- [Dribbble - Booking.com Redesigns](https://dribbble.com/tags/booking_redesign)
- [Behance - Booking.com UX Study Case and Redesign](https://www.behance.net/gallery/121354235/Bookingcom-UX-Study-Case-and-Redesign)
- [DesignRush - Booking.com App Design Analysis](https://www.designrush.com/best-designs/apps/bookingcom)
- [Mobbin - Booking.com Web Map View](https://mobbin.com/explore/screens/1029ac77-5899-4f71-8bdb-bc441a16fbe6)

### Typography
- [Implementing System Fonts on Booking.com](https://booking.design/implementing-system-fonts-on-booking-com-a-lesson-learned-bdc984df627f)
- [CSS-Tricks - System Font Stack](https://css-tricks.com/implementing-system-fonts-booking-com-a-lesson-learned/)

### Color Palette
- [Booking.com Brand Colors - BrandColors](https://brandcolors.net/b/booking-com)
- [Booking.com Color Palette - Design Pieces](https://www.designpieces.com/palette/booking-com-color-palette-hex-and-rgb/)
- [Booking.com Logo Colors - SchemeColor](https://www.schemecolor.com/booking-com-logo-colors.php)

### UX Patterns
- [The Points Guy - Booking.com Genius Program Guide](https://thepointsguy.com/loyalty-programs/booking-com-genius-loyalty-programme/)
- [CXL - Scarcity Principle Examples](https://cxl.com/blog/scarcity-examples/)
- [Smashing Magazine - Filter Design Patterns](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)
- [Baymard - Flight Booking UX Benchmark 2025](https://baymard.com/blog/flight-booking-and-airlines-2025-benchmark)

### Technical Resources
- [Booking.com FTC Compliance - Price Display](https://developers.booking.com/demand/docs/compliance/ftc-compliance)
- [Booking.com Accommodation Pricing Guide](https://developers.booking.com/demand/docs/accommodations/prices-accommodations)
- [Mapbox - Booking.com CityBook Case Study](https://www.mapbox.com/showcase/booking-com)

---

*Last Updated: January 2026*
*Document compiled from web research and publicly available design resources*
