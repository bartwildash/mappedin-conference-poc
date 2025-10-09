# Mappedin Conference Map POC

**Clean, functional 3D conference map with exhibitor discovery and navigation**

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Features

### ✅ Core Features
1. **Interactive 3D Map** - Mappedin SDK v6 rendering ICC venue
2. **Smart Search** - Autocomplete with booth numbers and exhibitor names
3. **Exhibitor Cards** - Click any booth to see exhibitor details
4. **Turn-by-Turn Directions** - Navigate between any two points
5. **Accessible Mode** - Toggle elevator/ramp preference
6. **Floor Selector** - Navigate multi-floor venues

### 🔍 Search System
- Modular design (reusable in React)
- Searches exhibitors, booth numbers, and locations
- Real-time autocomplete with 200ms debounce
- Lucide icons for visual clarity

### 🗺️ Navigation
- Drop pin to set start location
- Auto-zoom to show entire path
- Accessible route option (elevators/ramps)
- Turn-by-turn instructions
- Card minimizes during navigation

## Project Structure

```
mappedin-conference-poc/
├── index.html              # Main application (single-file POC)
├── public/
│   ├── js/
│   │   └── search-module.js  # Modular search system
│   └── map/
│       ├── app.html          # React Native WebView version
│       ├── index.html        # Alternative map view
│       └── menu.html         # Map selector
├── README.md               # Installation & usage
├── SEARCH_MODULE_GUIDE.md  # Search system docs
├── QUICK_START.md          # Getting started guide
└── archive/                # Old docs and incomplete code
```

## Key Files

### `/index.html`
Main application - All POC features in one file:
- Map initialization (Mappedin SDK)
- Search with autocomplete
- Navigation system
- Exhibitor cards
- Floor selector
- Accessibility toggle

**Functions:**
- `setupSearch()` - Initialize modular search
- `setupLabels()` - Add space labels to map
- `setupAmenities()` - Add restroom/amenity markers
- `setupExhibitors()` - Add booth labels
- `setupSpaceInteractivity()` - Click handlers
- `setupAccessibility()` - Accessible mode toggle
- `setupDropPin()` - Pin drop for navigation
- `showCardForSpace()` - Display exhibitor card
- `navigateToSpace()` - Calculate and show directions

### `/public/js/search-module.js`
Modular search system with two classes:
- `MappedInSearch` - Core search logic
- `SearchUIManager` - DOM handling and events

Can be reused in React/React Native.

## Configuration

**Mappedin Credentials** (in index.html):
```javascript
const mapOptions = {
  key: 'mik_Qar1NBX1qFjtljLDI52a60753',
  secret: 'mis_CXFS9WnkQmy9GCt4uOJx87hoWvQhXq170eEjauGKho2g74',
  mapId: '66ce20fdf42a3e000b1b0545'  // ICC venue
};
```

## Exhibitor Data

Mock exhibitor data in `index.html` around line 50:
```javascript
const exhibitorData = {
  'A100': [
    { name: 'TechCorp Solutions', booth: 'A100', description: '...' }
  ],
  // ... more exhibitors
};
```

**To integrate real data:**
1. Replace `exhibitorData` with API call
2. Ensure booth numbers match `space.externalId` on map
3. Update `getExhibitorsByBooth()` function if needed

## Development

### Running Locally
```bash
npm run dev  # Starts Vite dev server on port 5173
```

### Building for Production
```bash
npm run build    # Creates dist/ folder
npm run preview  # Preview production build
```

## Features Detail

### Search
- Minimum 2 characters to trigger
- Searches: exhibitor names, booth numbers, places
- Shows top 6 suggestions
- Press Enter to select first result
- Click suggestion to focus and show card

### Navigation
1. Click exhibitor card **Directions** button
2. Choose start location:
   - Type to search
   - Click pin icon to drop on map
3. Toggle **Accessible Mode** for elevator/ramp preference
4. Directions appear with turn-by-turn instructions
5. Camera auto-zooms to show path
6. Click **Clear** to reset

### Exhibitor Cards
- Auto-show when clicking booth
- Shows company name, description, contact
- **Co-Exhibitors**: If multiple companies share a booth, shows all
- **Navigation State**: Card shrinks to To/From fields when navigating
- **Share URL**: Copy link to exhibitor (future feature)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS/Android)

## Responsive Design

Breakpoints:
- Desktop: 1920px+ (full layout)
- Tablet: 768px - 1919px (adjusted card sizes)
- Mobile: 390px - 767px (compact layout)

## Performance

- Debounced search (200ms)
- Efficient marker ranking system
- Lazy loading of exhibitor data
- Optimized map rendering

## Known Limitations

1. **Mock Data**: Exhibitor data is hardcoded
2. **Search API**: Some booth numbers may not be found by Mappedin suggest() - we manually search externalId as fallback
3. **Labels**: All space labels visible at once (can be overwhelming on large venues)
4. **Co-Exhibitors**: Parent/child logic is manual, not from Mappedin

## Next Steps

### Short Term
- [ ] Connect to real exhibitor API
- [ ] Add share URL functionality
- [ ] Optimize label visibility (zoom-based)
- [ ] Add loading states

### Long Term
- [ ] Build React Native mobile app
- [ ] Add analytics tracking
- [ ] Multi-language support
- [ ] Offline mode

## Troubleshooting

**Search not working?**
- Check browser console for errors
- Verify Mappedin credentials are valid
- Ensure mapData is loaded before setupSearch()

**Booth numbers not found?**
- Check `space.externalId` matches your booth numbers
- Enable booth number search in setupSearch() options

**Navigation not showing path?**
- Verify both start and end locations are valid
- Check accessible mode if having issues
- Ensure mapView.Camera.focusOn() is working

## Credits

- **Mappedin SDK**: https://docs.mappedin.com
- **Lucide Icons**: https://lucide.dev
- **Vite**: https://vitejs.dev

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0-clean
**Status**: ✅ Production Ready - Streamlined
