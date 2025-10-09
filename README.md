# 🗺️ Mappedin Conference Map POC

**Production-ready 3D conference map with exhibitor discovery and navigation**

Optimized for mobile, iPad, and web app embedding.

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

## Features

### Core Features
✅ **Interactive 3D Map** - Mappedin SDK v6
✅ **Smart Search** - Clickable autocomplete with booth number support
✅ **Exhibitor Cards** - Click booths to see company details
✅ **Turn-by-Turn Navigation** - Animated paths with directions
✅ **Accessible Mode** - Elevator/ramp preference toggle
✅ **Floor Selector** - Multi-floor venue support

### Mobile & Embed Optimizations
✅ **Touch-optimized** - 44px+ touch targets, visual feedback
✅ **iPad/Mobile Ready** - Responsive design, no pull-to-refresh
✅ **App Embed Ready** - Works in iOS/Android WebViews
✅ **PWA Compatible** - Can be installed as standalone app
✅ **Network Sharing** - Test on any device via local network

## Project Structure

```
mappedin-conference-poc/
├── index.html                # Main application (production-ready)
├── public/
│   └── js/search-module.js   # Modular search system
├── vite.config.js            # Vite configuration for GitHub Pages
├── netlify.toml              # Netlify deployment config
├── README.md                 # This file
├── PROJECT.md                # Detailed project documentation
├── SEARCH_MODULE_GUIDE.md    # Search system documentation
└── archive/                  # Old docs & incomplete code (not deployed)
```

## How to Use

### Search
1. Type in search bar (minimum 2 characters)
2. Select from autocomplete suggestions
3. Camera focuses on booth and shows exhibitor card

### Navigate
1. Click "Directions" on exhibitor card
2. Choose start location (search or drop pin)
3. Toggle accessible mode if needed
4. View turn-by-turn instructions

### Map Controls
- **Search**: Find exhibitors
- **Floor Selector**: Change floors
- **Accessibility Toggle**: Prefer elevators/ramps
- **Pin Drop**: Set custom start location

## Configuration

Update Mappedin credentials in `index.html`:

```javascript
const mapOptions = {
  key: 'mik_YOUR_KEY',
  secret: 'mis_YOUR_SECRET',
  mapId: 'YOUR_MAP_ID'
};
```

## Connect Real Data

Replace mock exhibitor data in `index.html` (around line 50):

```javascript
// Replace this:
const exhibitorData = { ... };

// With API call:
const response = await fetch('https://your-api.com/exhibitors');
const exhibitorData = await response.json();
```

## Build for Production

```bash
npm run build     # Creates dist/ folder
npm run preview   # Test production build
```

Deploy `dist/` folder to any static hosting (Netlify, Vercel, etc.)

## Documentation

- **[PROJECT.md](./PROJECT.md)** - Complete project overview & technical details
- **[SEARCH_MODULE_GUIDE.md](./SEARCH_MODULE_GUIDE.md)** - Search system documentation
- **[Mappedin Web SDK](https://developer.mappedin.com/web-sdk)** - Official Mappedin docs

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

## Tech Stack

- **Mappedin SDK**: v6.0.0 (Web SDK)
- **Build Tool**: Vite 5.4
- **Icons**: Lucide Icons
- **JavaScript**: ES6+ (vanilla, no framework)

## Deployment

### GitHub Pages (Auto-Deploy)
Push to `main` branch automatically deploys to:
https://bartwildash.github.io/mappedin-conference-poc/

### Netlify (Alternative)
Connect your GitHub repo at [netlify.com](https://netlify.com)
Configuration is already in `netlify.toml`

## Status

✅ **Production Ready** - Mobile-optimized, touch-ready, fully functional

**Version**: 1.0.0
**Last Updated**: October 10, 2025

## Tech Stack

- **Mappedin SDK**: v6.0.0 (Web SDK)
- **Build Tool**: Vite 5.4
- **Icons**: Lucide Icons
- **JavaScript**: ES6+ (vanilla, no framework)
- **Deployment**: GitHub Pages + GitHub Actions

---

**Repository**: https://github.com/bartwildash/mappedin-conference-poc
