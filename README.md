# 🗺️ Mappedin Conference Map POC

**Production-ready 3D conference map with external exhibitor data integration**

Built with **Svelte 5 + TypeScript + Mappedin Web SDK v6.1.2**

## 🚀 Live Demo

**GitHub Pages:** https://bartwildash.github.io/mappedin-conference-poc/

## Quick Start

### Local Development
```bash
npm install
npm run dev
```

Open http://localhost:5173/mappedin-conference-poc/

### Network Access (iPad/Mobile)
```bash
npm run dev -- --host
```

Visit `http://YOUR_IP:5173/mappedin-conference-poc/` from any device on your network

## ✨ Features

### Core Features
✅ **Interactive 3D Map** - Mappedin Web SDK v6.1.2
✅ **External Data Integration** - REST API for exhibitor data (logos, websites, descriptions)
✅ **Unified Search** - Searches both Mappedin objects AND external exhibitors
✅ **Progressive Label System** - Zoom-based disclosure (exhibitors → food → amenities → restrooms)
✅ **Location Cards** - Merged Mappedin + external data display
✅ **Integrated Directions** - Search OR click map to select start/destination
✅ **Real-Time Location** - Blue Dot tracking with three-state button (off → on → following) 🆕
✅ **Turn-by-Turn Navigation** - Animated paths with accessible route options
✅ **Accessible Mode** - Elevator/ramp preference toggle
✅ **Floor Selector** - Multi-floor venue support

### Technical Features
✅ **Zero Memory Leaks** - Proper event listener cleanup
✅ **Fine-Grained Reactivity** - Svelte 5 runes ($state, $effect, $derived)
✅ **TypeScript** - Full type safety throughout
✅ **Responsive Design** - Mobile, tablet, desktop optimized
✅ **5-Minute API Cache** - LocalStorage caching for performance
✅ **Offline Fallback** - Static JSON when API unavailable
✅ **Error Logging** - Centralized logging system for debugging

## Project Structure

```
mappedin-conference-poc/
├── src/
│   ├── App.svelte                        # Root application component
│   ├── lib/
│   │   ├── components/
│   │   │   ├── MapView.svelte            # Map initialization & SDK setup
│   │   │   ├── MapLabels.svelte          # Progressive label system
│   │   │   ├── Search.svelte             # Unified exhibitor + amenity search
│   │   │   ├── LocationCard.svelte       # Details + Directions tabs
│   │   │   ├── BlueDotControl.svelte     # Real-time location tracking 🆕
│   │   │   ├── FloorSelector.svelte      # Multi-floor navigation
│   │   │   └── ui/                       # shadcn-svelte components
│   │   ├── stores/
│   │   │   ├── map.ts                    # Mappedin state management
│   │   │   ├── exhibitors.ts             # External data integration
│   │   │   └── ui.ts                     # UI state
│   │   ├── utils/
│   │   │   ├── icons.ts                  # Icon utilities
│   │   │   └── logger.ts                 # Error logging system 🆕
│   │   ├── config/
│   │   │   └── api.ts                    # REST API configuration
│   │   └── types/
│   │       └── mappedin.ts               # TypeScript definitions
├── public/
│   └── data/
│       └── exhibitors-transformed.json   # Offline fallback data
├── vite.config.ts                        # Vite configuration
├── README.md                             # This file
├── CLAUDE.md                             # Development session notes
└── MAPPEDIN_REVIEW.md                    # Technical review for Mappedin 🆕
```

## 📱 How to Use

### 1. Search for Exhibitors or Amenities
1. Type in search bar (minimum 2 characters)
2. Select from unified autocomplete (exhibitors + amenities)
3. Camera focuses on location and shows LocationCard

### 2. View Location Details
- Click any booth or space on the map
- **Details Tab**: View exhibitor info (logo, website, description, booth #)
- **Directions Tab**: Get turn-by-turn navigation

### 3. Navigate with Directions 🧭
1. Open LocationCard → Switch to "Directions" tab
2. **Choose destination** (3 ways):
   - 🔍 **Type to search** - Live autocomplete with exhibitors + amenities
   - 📍 **Click "Select on map"** - Then click any booth/space
   - 🎯 **Already selected** - If you clicked a location, it's pre-filled
3. Choose start location (same 3 options)
4. Toggle accessible mode if needed (♿ prefers elevators/ramps)
5. Click "Get Directions"
6. View turn-by-turn instructions with distance

### 4. Track Your Location 📍 (NEW)
- Click floating Blue Dot button (bottom-left)
- **First click**: Shows your location as blue dot
- **Second click**: Camera follows your position
- **Third click**: Disables tracking

### 5. Change Floors
- Use Floor Selector (bottom-right)
- Floors with exhibitors highlighted

## ⚙️ Configuration

### Mappedin Credentials
Update in `src/lib/components/MapView.svelte`:

```typescript
const MAP_CONFIG = {
  key: 'mik_YOUR_KEY',
  secret: 'mis_YOUR_SECRET',
  mapId: 'YOUR_MAP_ID'
};
```

### External API Configuration
Set environment variables (`.env`):

```bash
VITE_DOLLARYDOOS_API_URL=https://dash.dollarydoos.com
VITE_DOLLARYDOOS_API_KEY=your_api_key
VITE_TENANT_ID=your-event-id
```

### Exhibitor Data API
The app expects this REST API format:

```typescript
// GET /api/external/conference/vendors?tenantId=EVENT_ID
{
  "success": true,
  "data": {
    "vendors": [
      {
        "externalId": "ABC123",      // Used for matching to Mappedin objects
        "name": "Acme Corp",
        "boothNumber": "101",         // Searchable
        "category": "Technology",
        "description": "...",
        "website": "https://acme.com",
        "logo": "https://cdn.../logo.png"
      }
    ]
  }
}
```

**Offline Fallback**: If API unavailable, uses `public/data/exhibitors-transformed.json`

## Build for Production

```bash
npm run build     # Creates dist/ folder
npm run preview   # Test production build
```

Deploy `dist/` folder to any static hosting (Netlify, Vercel, etc.)

## 📚 Documentation

### Technical Documentation
- **[MAPPEDIN_REVIEW.md](./MAPPEDIN_REVIEW.md)** - Comprehensive technical review for Mappedin 🆕
  - 8-section deep dive into implementation
  - Custom components explained
  - 18 questions for Mappedin validation
  - Code snippets for review
- **[CLAUDE.md](./CLAUDE.md)** - Development session notes & label system details

### External Resources
- **[Mappedin Web SDK](https://developer.mappedin.com/web-sdk)** - Official Mappedin docs
- **[Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)** - Svelte 5 runes syntax

## Troubleshooting

**Map not loading?**
- Check browser console for errors
- Verify Mappedin credentials
- Ensure dev server is running

**Search not finding booths?**
- Booth numbers must match `space.externalId` on map
- Minimum 2 characters required
- Check console for booth number list

**Navigation not working?**
- Verify both start and end locations are valid
- Try toggling accessible mode
- Check console for direction errors

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS/Android)

## Performance

- Map loads in ~1-2 seconds
- Search debounced at 200ms
- Smooth camera transitions
- Optimized marker rendering

## 🛠️ Tech Stack

### Core Technologies
- **Framework**: Svelte 5 (runes syntax: $state, $effect, $derived)
- **Language**: TypeScript (full type safety)
- **Mappedin SDK**: v6.1.2 (Web SDK)
- **Blue Dot SDK**: @mappedin/blue-dot v6.0.1-beta.60
- **Build Tool**: Vite 7.1.12
- **UI Components**: shadcn-svelte (Tailwind CSS)
- **Icons**: Lucide Icons

### Architecture
- **State Management**: Svelte 5 stores (writable, derived)
- **Data Integration**: REST API with 5-minute cache
- **Deployment**: GitHub Pages + GitHub Actions (auto-deploy on push)

## 🚀 Deployment

### GitHub Pages (Auto-Deploy)
Push to `main` branch automatically deploys to:
https://bartwildash.github.io/mappedin-conference-poc/

Build triggered by: `.github/workflows/deploy.yml`

### Build & Deploy Manually
```bash
npm run build       # Creates dist/ folder
npm run preview     # Test production build locally
git push            # Auto-deploys to GitHub Pages
```

## 📊 Status

✅ **Production Ready** - Zero memory leaks, fully functional, mobile-optimized

**Version**: 2.0.0 (Svelte 5 Rewrite)
**Last Updated**: October 28, 2025

### What's New in v2.0.0 🎉

✨ **Complete Svelte 5 Rewrite**
- Migrated from vanilla JS to Svelte 5 + TypeScript
- Fine-grained reactivity with runes ($state, $effect, $derived)
- Component-based architecture

✨ **External Data Integration**
- REST API integration for exhibitor data
- Booth number matching via externalId
- 5-minute LocalStorage caching
- Offline fallback to static JSON

✨ **Blue Dot Location Tracking** 🆕
- Real-time user positioning
- Three-state button (off → on → following)
- Accuracy indicator with color coding

✨ **Unified Search System**
- Single search bar for exhibitors + amenities
- Live autocomplete with debouncing
- Merged Mappedin + external data results

✨ **Progressive Label System**
- Zoom-based disclosure (prevents clutter)
- Dynamic ranking: Exhibitors (zoom 18) → Food (19) → Amenities (20) → Restrooms (22)
- Category-based detection from Mappedin space categories

✨ **Integrated Directions**
- Combined Details + Directions in single LocationCard
- Three ways to select: search, map click, or pre-selected
- Accessible route options (elevator/ramp preference)

🔧 **Critical Fixes**
- Zero memory leaks (proper event cleanup)
- Fixed Svelte 5 $derived.by() usage
- Fixed store access in event handlers (use get())
- Added comprehensive error logging

📈 **Performance**
- 300+ labels render smoothly
- Zero runtime errors
- Playwright tested

---

**Repository**: https://github.com/bartwildash/mappedin-conference-poc
