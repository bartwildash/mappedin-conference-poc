# Mappedin Conference Integration - Technical Specification

## Overview
Custom Mappedin implementation for ICC conference venue with website embed and native app integration via deep-linking and bidirectional communication.

---

## 1. Configuration

### Mappedin Credentials
```javascript
{
  mapId: '688ea50e362b1d000ba0822b',  // ICC venue
  key: 'mik_iND9Ra87M1Ca4DD444be4063d',
  secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024'
}
```

### Deployment Modes
1. **Website Embed** (`index.html`)
   - Standalone map viewer
   - Full UI with all controls
   - No external communication

2. **App WebView** (`app.html`)
   - Deep-link URL parameter handling
   - postMessage API for bidirectional communication
   - Simplified UI (relies on native app for some controls)

---

## 2. Core Features

### A. Search
- **Data Sources**:
  - Mappedin spaces (all named locations)
  - External exhibitor data (merged by `externalId`)
- **UI**: Top-centered search bar with dropdown results
- **Behavior**:
  - Minimum 2 characters to trigger
  - Debounced input (300ms)
  - Max 8 results shown
  - Click to focus camera on location

### B. Floor Selector
- **UI**: Dropdown in top-left corner
- **Data**: Dynamically populated from `mapData.getByType('floor')`
- **Behavior**:
  - Click to change floor
  - Auto-switch during multi-floor wayfinding
  - Show current floor indicator

### C. Wayfinding
- **Start Points** (priority order):
  1. Blue Dot (GPS/user location)
  2. Dropped Pin
  3. Selected space
  4. Map center (fallback)
- **Accessibility Toggle**: Uses Mappedin `getDirections({ accessible: true })`
- **UI**: Right-side panel with:
  - From/To inputs
  - Accessible route toggle
  - Go/Clear buttons
  - Turn-by-turn directions list
- **Rendering**: `mapView.Navigation.draw()` with custom accent color

### D. Drop Pin
- **Activation**: Click pin button (toggles mode)
- **Behavior**: Next map click drops pin at coordinate
- **Visual**: Large 📍 marker at rank 4
- **Integration**: Automatically sets as wayfinding start point

### E. Blue Dot (User Location)
- **Activation**: Click location button
- **Permissions**: Requests browser geolocation
- **Coordinate Mapping**:
  - **Production**: Convert GPS to Mappedin coordinates using venue calibration
  - **Demo/Fallback**: Use `mapData.mapCenter`
- **Visual**: Blue circle with white border (iOS/Android style)
- **Integration**: Sets as wayfinding start point

### F. Categories Bottom Sheet
- **UI**: Collapsible sheet from bottom
- **Categories**:
  - Amenities (restaurants, cafes, ATMs)
  - Exhibitors (filtered by category if data available)
  - Facilities (restrooms, elevators, stairs)
- **Behavior**:
  - Collapsed: Shows handle + category icons
  - Expanded: Full scrollable grid
  - Click item → Set as destination + open directions panel

### G. Accessibility Features
- **Routing**: Toggle for accessible paths
- **Visual**:
  - High contrast mode toggle (WCAG AA)
  - Keyboard navigation support
  - ARIA labels on all interactive elements
- **Screen Reader**: Announce location changes, directions

---

## 3. Deep-Link Integration (App Mode)

### Inbound: App → Map
**URL Format**:
```
https://yoursite.com/map/app.html?externalId=A-12&floor=1&action=navigate
```

**Parameters**:
- `externalId` (required): Stand/booth number matching Mappedin `space.externalId`
- `floor` (optional): Floor number/ID to switch to
- `action` (optional):
  - `focus`: Zoom to location only
  - `navigate`: Start wayfinding from user location
  - `highlight`: Focus + pulse effect on marker

**Implementation**:
```javascript
// Parse URL params on load
const params = new URLSearchParams(window.location.search);
const externalId = params.get('externalId');
const action = params.get('action') || 'focus';

if (externalId) {
  const space = mapData.getByType('space')
    .find(s => s.externalId === externalId);

  if (space) {
    // Switch floor if needed
    if (params.get('floor')) {
      mapView.setFloor(params.get('floor'));
    }

    // Execute action
    switch(action) {
      case 'navigate':
        toLocation = space;
        getDirections(); // Auto-start navigation
        break;
      case 'highlight':
        mapView.Camera.focusOn(space, { animationDuration: 1000 });
        highlightMarker(space); // Pulse effect
        break;
      default:
        mapView.Camera.focusOn(space);
    }
  }
}
```

### Outbound: Map → App
**postMessage Schema**:
```javascript
// When user clicks exhibitor booth
window.parent.postMessage({
  type: 'exhibitorClick',
  payload: {
    externalId: 'A-12',
    name: 'Acme Corporation',
    spaceId: 'mappedin-internal-id',
    floor: 1,
    coordinates: { x: 123, y: 456 }
  }
}, '*'); // Use specific origin in production

// When navigation starts
window.parent.postMessage({
  type: 'navigationStart',
  payload: {
    from: { externalId: null, type: 'userLocation' },
    to: { externalId: 'A-12', name: 'Acme Corp' },
    distance: 150, // meters
    duration: 180  // seconds
  }
}, '*');

// When user arrives at destination
window.parent.postMessage({
  type: 'navigationComplete',
  payload: {
    externalId: 'A-12',
    timestamp: Date.now()
  }
}, '*');
```

**App Listener** (Native side - pseudo-code):
```javascript
// React Native example
webViewRef.current.onMessage = (event) => {
  const { type, payload } = JSON.parse(event.nativeEvent.data);

  switch(type) {
    case 'exhibitorClick':
      // Show native bottom sheet with exhibitor details
      navigation.navigate('ExhibitorDetail', {
        externalId: payload.externalId
      });
      break;
    case 'navigationStart':
      // Track analytics
      analytics.track('Navigation Started', payload);
      break;
  }
};
```

---

## 4. Data Schema

### Exhibitor Data (`exhibitors.json`)
```json
[
  {
    "externalId": "A-12",
    "name": "Acme Corporation",
    "category": "Technology",
    "subcategory": "AI/ML",
    "floor": 1,
    "logo": "https://example.com/logos/acme.png",
    "description": "Leading AI solutions provider",
    "contact": {
      "email": "info@acme.com",
      "phone": "+1234567890",
      "website": "https://acme.com"
    },
    "products": ["AI Platform", "Analytics Suite"],
    "featured": true,
    "rank": 4  // For marker sizing
  }
]
```

### Mappedin Space Enhancement
```javascript
// Merge exhibitor data with Mappedin spaces
const enhancedSpaces = mapData.getByType('space').map(space => {
  const exhibitor = exhibitorData.find(e => e.externalId === space.externalId);
  return {
    ...space,
    exhibitor: exhibitor || null,
    rank: exhibitor?.rank || calculateRank(space),
    icon: exhibitor?.logo || getDefaultIcon(space)
  };
});
```

---

## 5. UI Components

### Floor Selector
```html
<select id="floorSelector" class="floor-selector">
  <option value="floor-1">Ground Floor</option>
  <option value="floor-2">Level 1</option>
  <option value="floor-3">Level 2</option>
</select>
```

### Accessibility Controls
```html
<div class="accessibility-panel">
  <button id="accessToggle" class="toggle-btn" aria-label="Toggle accessible routes">
    <span>♿ Accessible Routes</span>
  </button>
  <button id="contrastToggle" class="toggle-btn" aria-label="Toggle high contrast">
    <span>◐ High Contrast</span>
  </button>
  <button id="textSizeToggle" class="toggle-btn" aria-label="Increase text size">
    <span>A+ Text Size</span>
  </button>
</div>
```

---

## 6. Marker System

### Ranking (Controls size & z-index)
```javascript
const RANK_CONFIG = {
  4: { // VIP/Featured
    size: 40,
    zIndex: 1000,
    types: ['entrance', 'featured_exhibitor', 'info_desk']
  },
  3: { // Important
    size: 32,
    zIndex: 900,
    types: ['elevator', 'escalator', 'restaurant']
  },
  2: { // Standard
    size: 28,
    zIndex: 800,
    types: ['exhibitor', 'kiosk', 'atm']
  },
  1: { // Minor
    size: 20,
    zIndex: 700,
    types: ['restroom', 'stairs', 'emergency_exit']
  }
};

function createMarker(space, exhibitor) {
  const config = RANK_CONFIG[exhibitor?.rank || 2];

  const markerHTML = exhibitor?.logo
    ? `<img src="${exhibitor.logo}" style="width:${config.size}px; height:${config.size}px; border-radius:50%; border:2px solid #667eea;">`
    : `<div style="font-size:${config.size}px;">${getIcon(space)}</div>`;

  return mapView.Markers.add(space, markerHTML, {
    anchor: 'bottom',
    rank: exhibitor?.rank || 2,
    interactive: true
  });
}
```

---

## 7. Wayfinding Implementation

### Following Mappedin Docs Pattern
```javascript
async function getDirections() {
  // Determine start point
  const startPoint = blueDotMarker?.coordinate
    || dropPinMarker?.coordinate
    || fromLocation
    || mapData.mapCenter;

  if (!toLocation) {
    showError('Please select a destination');
    return;
  }

  const accessible = document.getElementById('accessibleToggle').checked;

  try {
    // Mappedin API call
    const directions = await mapData.getDirections(startPoint, toLocation, {
      accessible: accessible
    });

    if (!directions) {
      showError('No route found');
      return;
    }

    // Render path on map
    mapView.Navigation.draw(directions, {
      pathOptions: {
        nearRadius: 2,           // Distance to trigger "arrived"
        farRadius: 5,            // Distance to show path
        displayArrowsOnPath: true,
        animateArrowsOnPath: true,
        accentColor: '#667eea'
      }
    });

    // Display turn-by-turn
    renderDirectionsList(directions.instructions);

    // Focus camera on full route
    mapView.Camera.focusOn(directions.path);

    // Notify app
    notifyApp('navigationStart', {
      from: getLocationInfo(startPoint),
      to: getLocationInfo(toLocation),
      distance: directions.distance,
      duration: directions.duration
    });

  } catch (error) {
    console.error('Wayfinding error:', error);
    showError('Unable to calculate route. Please try again.');
  }
}

function renderDirectionsList(instructions) {
  const list = document.getElementById('directionsList');
  list.innerHTML = instructions.map((inst, i) => `
    <div class="direction-step" role="listitem">
      <div class="step-number">${i + 1}</div>
      <div class="step-content">
        <strong>${formatAction(inst.action.type)}</strong>
        ${inst.action.bearing ? `<span class="bearing">${inst.action.bearing}</span>` : ''}
        <div class="step-meta">
          <span class="distance">${Math.round(inst.distance)}m</span>
          ${inst.floor ? `<span class="floor">Floor ${inst.floor.name}</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}
```

---

## 8. Responsive Design

### Breakpoints
```css
/* Mobile: < 768px */
@media (max-width: 767px) {
  .search-bar { width: calc(100% - 40px); top: 10px; }
  .controls { top: 10px; right: 10px; }
  .directions-panel { width: 100%; top: 0; right: 0; border-radius: 0; }
  .bottom-sheet { max-height: 60vh; }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .directions-panel { width: 360px; }
  .bottom-sheet { max-height: 50vh; }
}

/* Desktop: > 1024px */
@media (min-width: 1025px) {
  .directions-panel { width: 400px; }
  .bottom-sheet { max-height: 40vh; }
  /* Show sidebar for categories instead of bottom sheet */
}
```

---

## 9. Performance Optimizations

### Lazy Loading
```javascript
// Load exhibitor data only after map initialized
async function init() {
  const mapView = await show3dMap(/* ... */);
  const mapData = mapView.mapData;

  // Parallel loading
  const [exhibitorData, categoriesData] = await Promise.all([
    fetch('/data/exhibitors.json').then(r => r.json()),
    fetch('/data/categories.json').then(r => r.json())
  ]);

  enhanceMapData(mapData, exhibitorData);
  renderMarkers();
}
```

### Marker Clustering (for 100+ exhibitors)
```javascript
// Group nearby markers by floor
const clusters = clusterMarkersByProximity(spaces, {
  minDistance: 5, // meters
  maxClusterSize: 10
});

clusters.forEach(cluster => {
  if (cluster.spaces.length > 1) {
    // Show cluster marker
    mapView.Markers.add(cluster.center,
      `<div class="cluster">${cluster.spaces.length}</div>`,
      { rank: 3 }
    );
  } else {
    // Show individual marker
    createMarker(cluster.spaces[0]);
  }
});
```

---

## 10. Analytics Events

### Track Key Actions
```javascript
const analytics = {
  track(event, properties) {
    // Google Analytics 4
    gtag('event', event, properties);

    // Send to app
    notifyApp('analytics', { event, properties });
  }
};

// Usage
analytics.track('Search Performed', { query, resultsCount });
analytics.track('Location Selected', { externalId, name, category });
analytics.track('Navigation Started', { from, to, distance, accessible });
analytics.track('Navigation Completed', { externalId, duration });
analytics.track('Floor Changed', { from: oldFloor, to: newFloor });
analytics.track('Exhibitor Clicked', { externalId, name, category });
```

---

## 11. Error Handling

### Graceful Degradation
```javascript
// Geolocation fallback
async function enableBlueDot() {
  if (!navigator.geolocation) {
    showToast('Location not supported by your browser');
    return;
  }

  try {
    const position = await getCurrentPosition();
    const mapCoord = convertGPStoMappedin(position.coords);
    createBlueDot(mapCoord);
  } catch (error) {
    if (error.code === 1) {
      showToast('Location permission denied', {
        action: 'Use drop pin instead',
        callback: () => toggleDropPin()
      });
    } else {
      showToast('Unable to get your location');
    }
  }
}

// Map loading failure
async function init() {
  try {
    const mapView = await show3dMap(/* ... */);
    // ... success
  } catch (error) {
    document.getElementById('mappedin-map').innerHTML = `
      <div class="error-state">
        <h2>Unable to load map</h2>
        <p>Please check your connection and try again</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
    console.error('Map initialization failed:', error);
  }
}
```

---

## 12. Security

### API Key Protection
```javascript
// For production, use server-side proxy
// Client-side fallback with domain restrictions:

const config = {
  mapId: '688ea50e362b1d000ba0822b',
  key: process.env.MAPPEDIN_KEY,    // From build-time env
  secret: process.env.MAPPEDIN_SECRET
};

// OR fetch from your backend
const config = await fetch('/api/map-config').then(r => r.json());
```

### postMessage Origin Validation
```javascript
// App version only
const ALLOWED_ORIGINS = [
  'https://yourapp.com',
  'capacitor://localhost',  // Capacitor apps
  'ionic://localhost'       // Ionic apps
];

window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Blocked message from unauthorized origin:', event.origin);
    return;
  }

  handleAppMessage(event.data);
});
```

---

## 13. Testing Checklist

### Functionality
- [ ] Search returns correct results
- [ ] Deep-link with `externalId` focuses on correct booth
- [ ] Floor selector switches floors
- [ ] Wayfinding calculates route with/without accessibility
- [ ] Drop pin sets as start point
- [ ] Blue dot requests location permission
- [ ] Bottom sheet categories filter correctly
- [ ] postMessage sends to parent app

### Accessibility
- [ ] Keyboard navigation works for all controls
- [ ] Screen reader announces location changes
- [ ] High contrast mode meets WCAG AA
- [ ] Focus indicators visible
- [ ] All buttons have aria-labels

### Performance
- [ ] Map loads in < 3 seconds on 3G
- [ ] No jank when switching floors
- [ ] Smooth animations (60fps)
- [ ] Markers render efficiently (< 500ms for 100+ markers)

### Cross-browser
- [ ] Chrome/Edge (desktop + mobile)
- [ ] Safari (desktop + iOS)
- [ ] Firefox
- [ ] WebView (iOS WKWebView, Android WebView)

---

## 14. Implementation Checklist

### Phase 1: Core Map (Week 1)
- [ ] Initialize Mappedin with ICC credentials
- [ ] Implement floor selector
- [ ] Add basic search functionality
- [ ] Create marker system with ranking

### Phase 2: Wayfinding (Week 1-2)
- [ ] Directions panel UI
- [ ] Accessible route toggle
- [ ] Blue dot with geolocation
- [ ] Drop pin functionality
- [ ] Turn-by-turn display

### Phase 3: Data Integration (Week 2)
- [ ] Load exhibitor JSON
- [ ] Merge with Mappedin spaces by `externalId`
- [ ] Custom markers with logos
- [ ] Category filtering

### Phase 4: App Integration (Week 3)
- [ ] Deep-link URL parameter parsing
- [ ] postMessage API implementation
- [ ] Test with WebView container
- [ ] Create app.html variant

### Phase 5: Polish (Week 3-4)
- [ ] Accessibility features (contrast, keyboard nav)
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Error handling
- [ ] Analytics integration
- [ ] Performance optimization

---

## 15. Open Questions for Client

1. **Exhibitor Data**:
   - Do you have existing JSON/CSV with stand numbers?
   - Are `externalId` values already set in Mappedin?

2. **App Platform**:
   - React Native / Flutter / Capacitor / Cordova?
   - WebView or native SDK?

3. **GPS Calibration**:
   - Do you have Mappedin indoor positioning enabled for ICC?
   - Should blue dot be real-time GPS or mock location?

4. **Brand Customization**:
   - Primary/secondary brand colors?
   - Custom marker designs beyond logos?

5. **Content Management**:
   - How will exhibitor data be updated (manual JSON, CMS, API)?
   - Real-time updates needed during conference?

6. **Analytics**:
   - Google Analytics / Firebase / Custom?
   - Required events beyond standard interactions?

---

## Next Steps

1. **Review this spec** and provide answers to open questions
2. **Share exhibitor data sample** (5-10 entries) for testing
3. **Confirm app platform** for postMessage implementation
4. **Approve to build** → I'll create production-ready files

**Estimated Timeline**: 3-4 weeks from approval to production-ready code.
