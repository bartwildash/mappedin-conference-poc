# 🗺️ Mappedin Conference Map POC

**Clean, functional 3D conference map with exhibitor discovery and navigation**

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Features

✅ **Interactive 3D Map** - Mappedin SDK v6
✅ **Smart Search** - Find exhibitors by name or booth number
✅ **Exhibitor Cards** - Click booths to see company details
✅ **Turn-by-Turn Navigation** - Animated paths with directions
✅ **Accessible Mode** - Elevator/ramp preference toggle
✅ **Floor Selector** - Multi-floor venue support
✅ **Co-Exhibitor Support** - Multiple companies per booth

## Project Structure

```
mappedin-conference-poc/
├── index.html                # Main application
├── public/
│   ├── js/search-module.js   # Modular search system
│   └── map/                  # Alternative views
├── README.md                 # This file
├── PROJECT.md                # Detailed project info
├── QUICK_START.md            # Getting started guide
├── SEARCH_MODULE_GUIDE.md    # Search documentation
└── archive/                  # Old docs & incomplete code
```

## Demo Data

5 Australian Defence Companies:
- **Booth 3J84**: Aerius Marine + Offshore Unlimited (co-exhibitors)
- **Booth 3A90**: ASC Pty Ltd
- **Booth 3C74**: Pirtek Adelaide
- **Booth 3F92**: Additive Manufacturing CRC
- **Booth 4A126**: JCS-WB Technologies

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

- **[PROJECT.md](./PROJECT.md)** - Complete project overview
- **[QUICK_START.md](./QUICK_START.md)** - Step-by-step guide
- **[SEARCH_MODULE_GUIDE.md](./SEARCH_MODULE_GUIDE.md)** - Search system docs
- **[Mappedin Web SDK](https://developer.mappedin.com/web-sdk)** - Official docs

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

## Status

✅ **Production Ready** - Clean, functional, well-documented

**Version**: 1.0.0-clean
**Last Updated**: October 9, 2025

## Support

- **Mappedin Support**: https://docs.mappedin.com
- **Project Questions**: See PROJECT.md

---

**Quick Links**
- [Get Started](./QUICK_START.md)
- [Project Details](./PROJECT.md)
- [Search System](./SEARCH_MODULE_GUIDE.md)
- [Mappedin Docs](https://developer.mappedin.com/web-sdk)
