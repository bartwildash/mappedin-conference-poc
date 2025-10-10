# Mappedin Conference POC - React + TypeScript

> Production-ready conference navigation app built with React, TypeScript, and Mappedin Web SDK v6

## 🚀 Features

### Core Features
- ✅ **Interactive Map** - Powered by Mappedin Web SDK v6
- ✅ **Live Search** - Real-time autocomplete for exhibitors, booths, and amenities
- ✅ **GPS Location** - Auto-find nearest entrance using device GPS
- ✅ **Interactive Directions** - Map click, search, and GPS for route selection
- ✅ **Accessible Routing** - Toggle between accessible (elevators/ramps) and all routes
- ✅ **Animated Paths** - Visual directions with animated arrows
- ✅ **Mobile Optimized** - Touch-friendly UI following Apple HIG guidelines
- ✅ **Dark Mode** - Automatic dark mode support

### Advanced Features
- 🗺️ **Map Click Selection** - Click anywhere on map to set destination
- 📍 **GPS Integration** - Haversine distance calculation to find nearest entrance
- 🔍 **Booth Number Search** - Search by external ID (e.g., "Booth 101")
- ♿ **Accessibility Mode** - Prefer elevators and ramps
- 📱 **Progressive Web App** - Installable on mobile devices

## 📁 Project Structure

```
react-app/
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx          # Live search component
│   │   ├── SearchBar.css
│   │   ├── DirectionsPanel.tsx    # Interactive directions
│   │   └── DirectionsPanel.css
│   ├── services/
│   │   ├── GPSLocationService.ts  # GPS + Haversine distance
│   │   └── SearchService.ts       # Mappedin Search API
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   ├── App.tsx                    # Main app component
│   ├── App.css
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- Mappedin API credentials ([Get them here](https://developer.mappedin.com/))

### Setup

1. **Navigate to React app directory:**
   ```bash
   cd react-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your Mappedin credentials:**
   ```env
   VITE_MAPPEDIN_KEY=your_mappedin_key_here
   VITE_MAPPEDIN_SECRET=your_mappedin_secret_here
   VITE_MAPPEDIN_MAP_ID=your_map_id_here
   ```

## 🚀 Development

### Run development server:
```bash
npm run dev
```

App will be available at `http://localhost:3000`

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

## 📚 Usage Guide

### Search Bar Component

```typescript
import { SearchBar } from '@/components/SearchBar';

<SearchBar
  mapData={mapData}
  mapView={mapView}
  onSelect={(suggestion) => {
    console.log('Selected:', suggestion.name);
  }}
  placeholder="Search exhibitors, booths, amenities..."
/>
```

### Directions Panel Component

```typescript
import { DirectionsPanel } from '@/components/DirectionsPanel';

<DirectionsPanel
  mapData={mapData}
  mapView={mapView}
  initialDestination={{
    name: 'Booth 101',
    type: 'booth',
    node: boothNode,
  }}
  onClose={() => setShowDirections(false)}
/>
```

### GPS Location Service

```typescript
import { GPSLocationService } from '@/services/GPSLocationService';

const gpsService = new GPSLocationService(mapData);

// Get location and find nearest entrance
const { gps, nearestSpace } = await gpsService.getLocationAndNearestEntrance();

console.log('GPS Location:', gps.latitude, gps.longitude);
console.log('Nearest Entrance:', nearestSpace.name);
console.log('Distance:', GPSLocationService.formatDistance(nearestSpace.distance));
```

### Search Service

```typescript
import { SearchService } from '@/services/SearchService';

const searchService = new SearchService(mapData, {
  maxSuggestions: 6,
  searchBoothNumbers: true,
});

// Get search suggestions
const results = await searchService.getSuggestions('Coffee');

results.forEach(result => {
  console.log(result.name, result.type, result.score);
});
```

## 🎨 Customization

### Styling

All components use CSS custom properties for easy theming:

```css
:root {
  --primary-blue: #667eea;
  --primary-green: #30b27a;
  --dark: #2e2f32;
  --border-light: #e5e6ea;
  --bg-light: #f3f3f5;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 12px 36px rgba(0, 0, 0, 0.16);

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 18px;
}
```

### Map Configuration

Edit `src/App.tsx` to customize map behavior:

```typescript
const data = await getMapData({
  key: import.meta.env.VITE_MAPPEDIN_KEY,
  secret: import.meta.env.VITE_MAPPEDIN_SECRET,
  mapId: import.meta.env.VITE_MAPPEDIN_MAP_ID,
});

const view = await show3dMap(mapContainerRef.current!, data, {
  // Custom map options
  backgroundColor: '#f5f5f7',
  shadingAndOutlines: true,
  outdoorView: {
    enabled: true,
  },
});
```

## 🏗️ Architecture

### Component Architecture

- **App.tsx** - Main application container, map initialization
- **SearchBar.tsx** - Live search with debouncing and suggestions
- **DirectionsPanel.tsx** - Multi-method route selection (GPS, search, map click)

### Service Architecture

- **GPSLocationService.ts** - Geolocation API wrapper with Haversine distance
- **SearchService.ts** - Mappedin Search API integration

### State Management

Uses React hooks (useState, useEffect, useRef) for local state management. No external state library required.

## 📱 Mobile Optimization

- **Touch targets:** 44px minimum (Apple HIG standard)
- **Font size:** 16px inputs to prevent iOS zoom
- **Viewport:** `user-scalable=no` for app-like experience
- **Layout:** Responsive bottom sheet on mobile
- **Gestures:** Touch-optimized event handlers

## 🌙 Dark Mode

Automatic dark mode based on system preferences:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --dark: #1c1c1e;
    --border-light: #38383a;
    --bg-light: #2c2c2e;
    --text-primary: #f5f5f7;
  }
}
```

## ♿ Accessibility

- **ARIA labels** on interactive elements
- **Keyboard navigation** support
- **Focus management** for modals and panels
- **Accessible routing** option for wheelchair users
- **Reduced motion** support via `prefers-reduced-motion`

## 🔧 Troubleshooting

### Map not loading

1. Check console for API errors
2. Verify `.env` credentials are correct
3. Ensure venue has GPS coordinates for GPS features

### GPS not working

1. Check browser supports `navigator.geolocation`
2. Verify HTTPS (required for geolocation)
3. Grant location permissions when prompted
4. Ensure venue spaces have `center.latitude` and `center.longitude`

### Search not showing results

1. Verify Mappedin Search API is enabled for your venue
2. Check minimum 2 characters are typed
3. Look for console errors from Search API

## 📦 Comparison to Vanilla JS Version

| Feature | React Version | Vanilla JS Version |
|---------|---------------|-------------------|
| **Framework** | React + TypeScript | Pure JavaScript |
| **Type Safety** | ✅ Full TypeScript | ❌ No types |
| **Component Reusability** | ✅ React components | ✅ ES6 classes |
| **Bundle Size** | ~200KB (gzipped) | ~50KB (gzipped) |
| **Development Speed** | ✅ Faster with React | Slower (manual DOM) |
| **Learning Curve** | React knowledge required | Vanilla JS only |
| **Production Ready** | ✅ Yes | ✅ Yes |

Both versions have **identical features** - choose based on your team's expertise.

## 📄 License

MIT License - see parent repository for details

## 🤝 Contributing

This is a reference implementation. For contributions, please see the main project repository.

## 📞 Support

- **Mappedin Docs:** https://docs.mappedin.com/
- **Mappedin Support:** https://developer.mappedin.com/support
- **Issues:** See main repository

---

**Built with ❤️ using Mappedin Web SDK v6**
