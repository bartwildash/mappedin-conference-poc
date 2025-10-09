# Mappedin UI Features & Embedding Guide

## Visual Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│  [Floor: Ground ▼]           [Search exhibitors...]      🧭📍📋│ ← Header
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│               🗺️ 3D Interactive Map                          │
│                                                              │
│            ┌─────┐  ┌─────┐  ┌─────┐                        │
│            │ 2G19│  │ 3A12│  │ 1B05│  ← Exhibitor markers   │
│            │Acme │  │Tech │  │Nano │                        │
│            └─────┘  └─────┘  └─────┘                        │
│                                                              │
│      🚻 Facilities     🍽️ Food     ℹ️ Info                   │
│                                                              │
│                                        ┌──────────────────┐  │
│                                        │ DIRECTIONS       │  │ ← Side Panel
│                                        │ From: My Location│  │ (when active)
│                                        │ To: Acme Corp    │  │
│                                        │ ♿ Accessible ☐  │  │
│                                        │ [Go] [Clear]     │  │
│                                        └──────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ ═══ CATEGORIES ══════════════════════════════════════════    │ ← Bottom Sheet
│ 🏢 Exhibitors    🍽️ Food & Beverage    🚻 Facilities        │ (collapsible)
│ [Acme] [TechCo] [Nano] [...]                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Features Breakdown

### 1. **Floor Selector** (Top-Left)
**What it looks like**:
```
┌─────────────────┐
│ Floor: Ground ▼ │
└─────────────────┘
```

**What it does**:
- Dropdown menu showing all floors
- Click to switch between floors
- Auto-switches during multi-floor navigation
- Shows current floor name

**User interaction**:
- Click → See list of floors
- Select → Map transitions to that floor
- During navigation → Auto-follows route

---

### 2. **Search Bar** (Top-Center)
**What it looks like**:
```
┌─────────────────────────────────────────┐
│ 🔍 Search exhibitors, booths...         │
└─────────────────────────────────────────┘
        ↓ (when typing)
┌─────────────────────────────────────────┐
│ 🏢 Acme Corporation - Booth 2G19        │
│ ✈️ Nanocube Pty Ltd - Booth 2G19        │
│ 🍽️ Conference Cafe - Level 1           │
│ 🚻 Restrooms - Ground Floor             │
└─────────────────────────────────────────┘
```

**What it does**:
- Searches exhibitor names, booth numbers, categories
- Live results as you type (min 2 characters)
- Shows logo/icon, name, and location
- Click result → Camera focuses on location

**User interaction**:
- Type "Acme" → See Acme Corporation + booth number
- Type "2G19" → See exhibitor at that booth
- Type "AEROSPACE" → See all aerospace exhibitors
- Click result → Map zooms to location

---

### 3. **Control Buttons** (Top-Right)
**What it looks like**:
```
┌────┐
│ 🧭 │  Directions
├────┤
│ 📍 │  Drop Pin
├────┤
│ 📍 │  My Location (Blue Dot)
├────┤
│ 📋 │  Categories
└────┘
```

**What each does**:

#### **🧭 Directions Button**
- Opens directions panel (see #4 below)
- Shows route from your location to destination
- Accessible route toggle

#### **📍 Drop Pin Button**
- Click once → Activates "pin mode"
- Click on map → Drops pin at that location
- Pin becomes your "start point" for directions
- Useful when not using GPS

#### **📍 Blue Dot (My Location)**
- Requests GPS permission
- Shows your real-time location on map
- Blue pulsing dot (like Google Maps)
- Auto-sets as navigation start point

#### **📋 Categories**
- Opens bottom sheet (see #6 below)
- Browse exhibitors by category
- Quick access to amenities/facilities

---

### 4. **Directions Panel** (Right Side, appears when active)
**What it looks like**:
```
┌─────────────────────────────────┐
│ DIRECTIONS                      │
├─────────────────────────────────┤
│ From: My Location          📍   │
│ To: Acme Corporation       🔍   │
├─────────────────────────────────┤
│ ♿ Accessible Route      ☑       │
├─────────────────────────────────┤
│        [Go]        [Clear]      │
├─────────────────────────────────┤
│ 1. Head north                   │
│    150m • Ground Floor          │
├─────────────────────────────────┤
│ 2. Turn right                   │
│    45m • Ground Floor           │
├─────────────────────────────────┤
│ 3. Take elevator to Level 1     │
│    Elevator B                   │
├─────────────────────────────────┤
│ 4. Turn left                    │
│    30m • Level 1                │
├─────────────────────────────────┤
│ 5. Arrive at destination        │
│    Booth 2G19                   │
└─────────────────────────────────┘
```

**What it does**:
- Shows start/end locations
- Toggle for wheelchair-accessible routes
- Turn-by-turn directions with distances
- Shows floor changes (elevators/escalators)
- Draws animated path on map (blue arrows)

**User interaction**:
- Select destination from search → Fills "To" field
- Click "Go" → Calculates route + shows on map
- Click "Clear" → Removes route from map
- Toggle ♿ → Recalculates using accessible paths only

---

### 5. **3D Map** (Main Area)
**What it looks like**:
- Fully interactive 3D map of ICC venue
- Pan with mouse/finger drag
- Zoom with scroll/pinch
- Rotate with right-click drag (desktop) or two-finger rotate (mobile)

**Markers on map**:

**Exhibitor Booths**:
```
┌──────┐
│ LOGO │  ← Company logo (if available)
└──────┘
  or
┌──────┐
│  ✈️  │  ← Category icon (if no logo)
└──────┘
```
- Larger markers for featured exhibitors
- Click marker → Sends to app (opens exhibitor detail sheet)
- Hover → Shows company name tooltip

**Amenities/Facilities**:
```
🚻 Restrooms
🍽️ Restaurants
ℹ️ Information
🛗 Elevators
🚪 Entrances
🚰 Water Fountains
🏧 ATMs
```
- Smaller markers
- Click → Focus on location
- Can set as destination for directions

**Navigation Path** (when active):
```
Start Point (Blue Dot/Pin)
    ↓ ━━━━━ Blue arrows flowing ━━━━━
    ↓
   Turn
    ↓ ━━━━━━━━━━━━━━━━━━━━━━━━━
    ↓
Destination (Pulsing marker)
```

---

### 6. **Bottom Sheet** (Collapsible from bottom)
**Collapsed state**:
```
┌────────────────────────────────────────┐
│ ════ (drag handle)                     │
│ 🏢 Exhibitors  🍽️ Food  🚻 Facilities  │
└────────────────────────────────────────┘
```

**Expanded state**:
```
┌──────────────────────────────────────────────────────┐
│ ════ (drag handle)                                   │
├──────────────────────────────────────────────────────┤
│ 🏢 EXHIBITORS (128)                                  │
│                                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│ │ ACME │ │TechCo│ │ Nano │ │ Aero │ │ Def  │       │
│ │ 2G19 │ │ 3A12 │ │ 2G19 │ │ 1B05 │ │ 4C22 │       │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│                                                      │
├──────────────────────────────────────────────────────┤
│ 🍽️ FOOD & BEVERAGE (12)                             │
│                                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐                          │
│ │ Cafe │ │ Bar  │ │ Rest │                          │
│ │  L1  │ │  L2  │ │  L1  │                          │
│ └──────┘ └──────┘ └──────┘                          │
│                                                      │
├──────────────────────────────────────────────────────┤
│ 🚻 FACILITIES                                        │
│                                                      │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │Toilet│ │Elevtr│ │ ATM  │ │ Info │                 │
│ │  GF  │ │  All │ │  L1  │ │  GF  │                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
└──────────────────────────────────────────────────────┘
```

**What it does**:
- Drag handle to expand/collapse
- Shows all exhibitors grouped by category
- Quick browse without searching
- Click any item → Zoom to location + open directions

**Categories shown**:
- **Exhibitors**: All companies with booths
  - Filtered by: AEROSPACE, DEFENCE, BUSINESS AVIATION, etc.
  - Shows: Logo, company name, booth number
  - Click → Opens exhibitor detail in app

- **Food & Beverage**: Cafes, restaurants, bars
  - Click → Navigate to location

- **Facilities**: Restrooms, elevators, ATMs, info desks
  - Click → Navigate to location

---

### 7. **Accessibility Panel** (Optional, can be in settings)
**What it looks like**:
```
┌─────────────────────────────┐
│ ACCESSIBILITY               │
├─────────────────────────────┤
│ ♿ Accessible Routes    ☑    │
│ ◐  High Contrast       ☐    │
│ A+ Larger Text         ☐    │
│ 🔊 Screen Reader       ☑    │
└─────────────────────────────┘
```

**What it does**:
- **Accessible Routes**: Only shows wheelchair-accessible paths (no stairs)
- **High Contrast**: Increases contrast for visibility (WCAG AA compliant)
- **Larger Text**: Increases font size by 125%
- **Screen Reader**: Announces location changes and directions

---

## Website Embedding

### ✅ YES, can be embedded in website!

**Two versions**:

### 1. **Standalone Website Embed** (Full UI)
For conference website public page:
```html
<iframe
  src="https://yoursite.com/map/index.html"
  width="100%"
  height="800px"
  frameborder="0"
  allow="geolocation"
  title="Conference Venue Map"
></iframe>
```

**Features in this version**:
- ✅ All UI controls visible (search, directions, categories)
- ✅ Full wayfinding
- ✅ Blue dot (GPS location)
- ✅ Drop pin
- ✅ Bottom sheet with exhibitors
- ✅ Accessibility controls
- ❌ No postMessage to app (self-contained)
- ❌ Clicking exhibitor shows in-map card (not app bottom sheet)

**Best for**:
- Conference website "Venue" page
- Exhibitor portal (logged-in users can see their booth)
- QR code landing pages
- Email links

---

### 2. **App WebView Embed** (Minimal UI)
For React Native app:
```jsx
<WebView
  source={{ uri: 'https://yoursite.com/map/app.html' }}
  javaScriptEnabled={true}
  onMessage={handleMessage}
/>
```

**Features in this version**:
- ✅ Map + search
- ✅ Directions panel
- ✅ Floor selector
- ✅ Deep-link handling (?stallNo=2G19)
- ✅ postMessage to app
- ❌ Bottom sheet hidden (app shows native sheet instead)
- ❌ Some controls may be in native app header

**Best for**:
- Inside your conference app
- Bidirectional communication with app
- Native-feeling experience

---

## Responsive Design

### Desktop (> 1024px)
```
┌─────────────┬──────────────────────────────┬──────────────┐
│ Floor: GF ▼ │  Search exhibitors...        │ 🧭 📍 📍 📋  │
├─────────────┴──────────────────────────────┴──────────────┤
│                                            ┌──────────────┐│
│                                            │ Directions   ││
│          3D Map (full width)               │ Panel        ││
│                                            │              ││
│                                            │ (side panel) ││
│                                            └──────────────┘│
├────────────────────────────────────────────────────────────┤
│ Categories (horizontal tabs)                               │
└────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌────────────┬─────────────────────────┬────────┐
│ Floor: GF ▼│  Search...              │🧭📍📍📋 │
├────────────┴─────────────────────────┴────────┤
│                                               │
│           3D Map                              │
│       (full width)                            │
│                                               │
│  Directions panel overlays on right →        │
│                                               │
├───────────────────────────────────────────────┤
│ Categories (bottom sheet)                     │
└───────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────────────┬──┐
│  Search...                      │🧭│
├─────────────────────────────────┴──┤
│                                    │
│        3D Map                      │
│      (full screen)                 │
│                                    │
│  Directions panel = full overlay   │
│  (slides up from bottom)           │
│                                    │
├────────────────────────────────────┤
│ ══ Categories (drag up) ══         │
└────────────────────────────────────┘
```

**Mobile-specific**:
- Search bar takes full width
- Controls stack vertically (right side)
- Directions panel slides up as overlay
- Bottom sheet covers more screen (60% height)
- Touch gestures: pinch-zoom, two-finger rotate

---

## Interactions Summary

### **Click Exhibitor Marker** (on map):
- **Website version**: Shows in-map popup with details
- **App version**: Sends postMessage → App opens native bottom sheet

### **Search & Select**:
1. Type "Acme"
2. See results dropdown
3. Click "Acme Corporation - Booth 2G19"
4. Map zooms to booth
5. Marker pulses briefly

### **Get Directions**:
1. Click 🧭 button
2. Directions panel opens
3. From: My Location (blue dot)
4. To: Search or click marker
5. Toggle ♿ if needed
6. Click "Go"
7. Blue path animates on map
8. Turn-by-turn list appears

### **Browse Categories**:
1. Click 📋 button (or swipe up on mobile)
2. Bottom sheet expands
3. See all exhibitors grouped
4. Click exhibitor card
5. Map focuses on booth
6. Directions panel opens (optional)

### **Change Floors**:
1. Click "Floor: Ground ▼"
2. See list: Ground, Level 1, Level 2
3. Click "Level 1"
4. Map transitions to Level 1
5. Markers update to that floor

---

## What Users Will See

### **Scenario 1: Visitor at conference entrance**
1. Opens conference app
2. Navigates to "Venue Map" tab
3. Sees map with "My Location" blue dot
4. Searches "Acme Corporation"
5. Clicks "Navigate to Booth"
6. Follows blue arrows on map
7. Arrives at booth 2G19

### **Scenario 2: Pre-conference planning (on website)**
1. Visits conference website on desktop
2. Clicks "Venue Map" page
3. Sees full 3D map embedded
4. Clicks "Categories" → "AEROSPACE"
5. Sees all aerospace exhibitors
6. Clicks exhibitor → Shows company info card
7. Bookmarks booth number

### **Scenario 3: QR code on printed program**
1. Scans QR code: `yoursite.com/map?stallNo=2G19`
2. Map loads directly to booth 2G19
3. Camera zooms to location
4. Can click "Navigate" if at venue

---

## Customization Options

### **What you can customize**:
1. **Colors**:
   - Primary: Currently `#667eea` (purple)
   - Accent: Navigation path color
   - Markers: Border colors

2. **Branding**:
   - Logo in top-left (replace floor selector position)
   - Custom marker designs
   - Font family (system font → your brand font)

3. **Content**:
   - Category names (AEROSPACE → Aerospace & Defense)
   - Icons for categories
   - Search placeholder text

4. **Features**:
   - Hide/show blue dot
   - Hide/show drop pin
   - Disable certain floors
   - Featured exhibitors section

5. **Analytics**:
   - Track search queries
   - Track navigation starts
   - Track popular destinations

---

## Final Checklist: What You Get

### **Website Embed Version** (`index.html`)
- [x] Full 3D Mappedin map
- [x] Search (exhibitors + locations)
- [x] Floor selector
- [x] Directions with accessible routes
- [x] Blue dot (GPS)
- [x] Drop pin
- [x] Bottom sheet with categories
- [x] In-map exhibitor info cards
- [x] Responsive (mobile/tablet/desktop)
- [x] Accessibility features
- [x] Deep-link support via URL params

### **App WebView Version** (`app.html`)
- [x] All features from website version
- [x] PLUS: postMessage to app
- [x] PLUS: Deep-link handling from app
- [x] PLUS: Sends exhibitor clicks to native bottom sheet
- [x] PLUS: Lighter UI (some controls in app header)

---

## Ready to Build?

Once you approve, I'll create:
1. ✅ `index.html` - Website embed version (standalone)
2. ✅ `app.html` - App WebView version (with postMessage)
3. ✅ `config.js` - Shared configuration
4. ✅ `styles.css` - All styles
5. ✅ `README.md` - Setup & deployment instructions

**Estimated build time**: 2-3 hours for production-ready code.

**Want me to proceed?** Just say "build it" or "approved" and I'll start! 🚀
