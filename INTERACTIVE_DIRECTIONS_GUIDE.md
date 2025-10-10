# Interactive Directions Component - Implementation Guide

## 🎯 Overview

The `InteractiveDirections` component provides an enhanced user experience for selecting destinations and origins in your Mappedin conference map application.

**New Features:**
- 🗺️ **Map Click Selection** - Click anywhere on the map to select destination
- 🔍 **Live Search Suggestions** - Real-time autocomplete in both "From" and "To" fields
- 📍 **Three Selection Methods** - Search, map button, or direct click
- ✨ **Visual Feedback** - Pulse animations and active states guide the user

## 📁 Files

### JavaScript
- **`public/js/directions-interactive.js`** - Main component (550+ lines)

### CSS
- **`public/css/directions-interactive.css`** - Complete styling (400+ lines)

### Dependencies
- `MappedInSearch` instance (from `public/js/search-module.js`)
- `DirectionsCard` component (optional, fallback provided)
- Mappedin Web SDK v6

## 🚀 Basic Usage

### 1. Include Files

```html
<!-- In your index.html -->
<link rel="stylesheet" href="/public/css/directions-interactive.css">
<script src="/public/js/search-module.js"></script>
<script src="/public/js/directions-card.js"></script>
<script src="/public/js/directions-interactive.js"></script>
```

### 2. Initialize Component

```javascript
// Initialize search module first
const searchModule = new MappedInSearch(mapData, {
  maxSuggestions: 5,
  fields: {
    enterpriseLocations: { name: true, tags: true, description: true },
    places: { name: true, description: true }
  }
});

// Create interactive directions component
const interactiveDirections = new InteractiveDirections(
  mapView,
  mapData,
  searchModule,
  {
    onDirectionsCalculated: (directions) => {
      console.log('Directions calculated:', directions);
    },
    onDestinationChanged: (destination) => {
      console.log('Destination changed:', destination);
    }
  }
);

// Initialize with container element
const container = document.getElementById('directionsContainer');
interactiveDirections.init(container);
```

### 3. HTML Container

```html
<div id="directionsContainer" style="display: none;"></div>
```

## 🎨 User Interface Features

### Map Selection Mode

When the user clicks the 📍 button next to the "To" field:

1. **Button becomes active** (✓ checkmark appears)
2. **Input field pulses** with blue border animation
3. **Hint appears** below input: "📍 Click on the map to select destination"
4. **Map becomes interactive** - user can click anywhere

**Priority handling:**
- **Spaces** (booths/rooms) - Highest priority
- **Locations** (enterprise locations) - Medium priority
- **Coordinates** (drop pin) - Fallback

### Search Suggestions

Both "From" and "To" fields support live search:

1. **Type 2+ characters** - Suggestions appear
2. **Autocomplete dropdown** shows with icons:
   - #️⃣ Booth
   - 🏢 Enterprise Location
   - 📍 Location
   - 🏛️ Place
   - 🚻 Amenity
3. **Click suggestion** - Auto-fills field and focuses camera

### Visual Feedback

- **Pulse border** animation when in selection mode
- **Active state** styling on map select button
- **Clear buttons** (×) appear when fields have values
- **Button state** changes from disabled to ready when both locations set

## 📊 API Reference

### Constructor

```javascript
new InteractiveDirections(mapView, mapData, searchModule, options)
```

**Parameters:**
- `mapView` - Mappedin MapView instance
- `mapData` - Mappedin MapData instance
- `searchModule` - MappedInSearch instance
- `options` - Configuration object (optional)

**Options:**
```javascript
{
  onDirectionsCalculated: (directions) => void,  // Called when route is found
  onDestinationChanged: (destination) => void    // Called when "To" changes
}
```

### Methods

#### `init(containerElement)`
Initialize the component and render UI.

```javascript
const container = document.getElementById('directionsContainer');
interactiveDirections.init(container);
```

#### `setInitialLocations(from, to)`
Pre-fill "From" and "To" locations programmatically.

```javascript
interactiveDirections.setInitialLocations(
  { name: 'Main Entrance', node: entranceNode },
  { name: 'Booth 101', node: boothNode }
);
```

#### `enableMapSelection()`
Enable map click selection mode for destination.

```javascript
interactiveDirections.enableMapSelection();
```

#### `disableMapSelection()`
Disable map click selection mode.

```javascript
interactiveDirections.disableMapSelection();
```

#### `close()`
Close the directions panel and clear navigation.

```javascript
interactiveDirections.close();
```

### Location Object Structure

```javascript
{
  name: string,              // Display name
  type: string,              // 'booth', 'space', 'location', 'coordinate'
  node: object,              // Mappedin node object
  externalId?: string,       // External ID (for booths)
  coordinate?: [x, y, z]     // 3D coordinate (for pins)
}
```

## 🔧 Integration Examples

### Example 1: Open From Exhibitor Card

```javascript
// When user clicks "Directions" on exhibitor card
function showDirections(exhibitor) {
  // Show container
  document.getElementById('directionsContainer').style.display = 'block';

  // Set destination
  interactiveDirections.setInitialLocations(
    null,  // Let user choose "from"
    {
      name: exhibitor.name,
      type: 'booth',
      node: exhibitor.space,
      externalId: exhibitor.boothNumber
    }
  );
}
```

### Example 2: User's Current Location as Start

```javascript
// Use device location or default entrance
navigator.geolocation.getCurrentPosition((position) => {
  const userLocation = convertToMapCoordinate(position.coords);

  interactiveDirections.setInitialLocations(
    {
      name: 'Your Location',
      type: 'coordinate',
      node: userLocation,
      coordinate: userLocation
    },
    null  // Let user choose destination
  );
});
```

### Example 3: Step-by-Step Navigation

```javascript
const interactiveDirections = new InteractiveDirections(
  mapView,
  mapData,
  searchModule,
  {
    onDirectionsCalculated: (directions) => {
      // Enable step-by-step mode
      enableStepByStepNavigation(directions);
    }
  }
);

function enableStepByStepNavigation(directions) {
  let currentStep = 0;

  document.getElementById('nextStepBtn').addEventListener('click', () => {
    if (currentStep < directions.instructions.length - 1) {
      currentStep++;
      focusOnInstruction(directions.instructions[currentStep]);
    }
  });
}

function focusOnInstruction(instruction) {
  if (instruction.coordinate) {
    mapView.Camera.focusOn({
      center: instruction.coordinate,
      zoomLevel: 22,
      tilt: 45
    });
  }
}
```

## 🎭 Event Handling

### Map Click Events

The component handles map click events with priority:

```javascript
handleMapClick(event) {
  // Priority 1: Space (booth/room)
  if (event.spaces && event.spaces.length > 0) {
    const space = event.spaces[0];
    this.setToLocation({
      name: space.name || space.externalId,
      type: 'space',
      node: space
    });
    return;
  }

  // Priority 2: Location (enterprise location)
  if (event.locations && event.locations.length > 0) {
    const location = event.locations[0];
    this.setToLocation({
      name: location.details?.name,
      type: 'location',
      node: location
    });
    return;
  }

  // Priority 3: Coordinate (drop pin)
  if (event.coordinate) {
    this.setToLocation({
      name: `Pin (${event.coordinate[0].toFixed(1)}, ${event.coordinate[1].toFixed(1)})`,
      type: 'coordinate',
      coordinate: event.coordinate
    });
  }
}
```

### Search Event Flow

```javascript
// User types in "To" field
toInput.addEventListener('input', async (e) => {
  const query = e.target.value;

  if (query.length >= 2) {
    // Get suggestions from search module
    const suggestions = await searchModule.getSuggestions(query);

    // Render dropdown
    renderSuggestions(suggestions);
  }
});
```

## 🎨 Customization

### Custom Styling

Override CSS variables or classes:

```css
/* Custom theme */
.interactive-directions {
  --primary-color: #667eea;
  --danger-color: #f56565;
  --border-radius: 12px;
}

/* Custom button style */
.get-directions-btn.ready {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

/* Custom pulse animation speed */
.input-wrapper.selecting {
  animation: pulse-border 1s infinite;  /* Faster pulse */
}
```

### Custom Suggestion Icons

```javascript
// Override icon mapping
InteractiveDirections.prototype.getSuggestionIcon = function(type) {
  const customIcons = {
    'booth': '🎪',
    'enterpriseLocation': '🏪',
    'location': '📌',
    'place': '🏰',
    'amenity': '🚽'
  };
  return customIcons[type] || '📍';
};
```

### Custom Direction Calculation

```javascript
const interactiveDirections = new InteractiveDirections(
  mapView,
  mapData,
  searchModule,
  {
    onDirectionsCalculated: (directions) => {
      // Custom post-processing
      analyzeRoute(directions);
      trackAnalytics('directions_calculated', {
        distance: directions.distance,
        steps: directions.instructions.length
      });
    }
  }
);
```

## 📱 Mobile Optimization

The component is fully mobile-optimized with:

### Touch Targets
- **Buttons:** 44px minimum (Apple HIG standard)
- **Input fields:** 44px height
- **Suggestion items:** 48px height

### Mobile Layout
```css
@media (max-width: 768px) {
  .interactive-directions {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 80vh;
    border-radius: 20px 20px 0 0;  /* iOS-style sheet */
  }
}
```

### Keyboard Handling
- **Auto-dismiss** suggestions on selection
- **Focus management** between fields
- **Prevent zoom** on input focus (iOS)

## 🐛 Troubleshooting

### Map Selection Not Working

**Problem:** Clicking map doesn't select destination

**Solution:**
1. Check if selection mode is enabled (button should show ✓)
2. Verify `mapView.on('click', handler)` is attached
3. Check console for click event data

```javascript
// Debug map clicks
mapView.on('click', (event) => {
  console.log('Map clicked:', {
    spaces: event.spaces,
    locations: event.locations,
    coordinate: event.coordinate
  });
});
```

### Suggestions Not Appearing

**Problem:** Typing in field doesn't show suggestions

**Solution:**
1. Verify search module is initialized
2. Check minimum 2 characters requirement
3. Verify search results in console

```javascript
// Debug search
searchModule.getSuggestions('query').then(results => {
  console.log('Search results:', results);
});
```

### Directions Not Calculating

**Problem:** "Get Directions" button doesn't work

**Solution:**
1. Verify both locations are set (check `fromLocation` and `toLocation`)
2. Ensure nodes are valid Mappedin objects
3. Check accessible mode setting

```javascript
// Debug locations
console.log('From:', interactiveDirections.fromLocation);
console.log('To:', interactiveDirections.toLocation);
```

### Map Click Listener Not Removed

**Problem:** Map stays in selection mode after closing

**Solution:**
Call `disableMapSelection()` explicitly:

```javascript
// Override close method if needed
const originalClose = interactiveDirections.close.bind(interactiveDirections);
interactiveDirections.close = function() {
  this.disableMapSelection();
  originalClose();
};
```

## 🚀 Advanced Features

### Voice Navigation

```javascript
const interactiveDirections = new InteractiveDirections(
  mapView,
  mapData,
  searchModule,
  {
    onDirectionsCalculated: (directions) => {
      speakInstructions(directions);
    }
  }
);

function speakInstructions(directions) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(
      `Route found. Distance: ${Math.round(directions.distance)} meters. ${directions.instructions.length} steps.`
    );
    speechSynthesis.speak(utterance);
  }
}
```

### Analytics Tracking

```javascript
const interactiveDirections = new InteractiveDirections(
  mapView,
  mapData,
  searchModule,
  {
    onDestinationChanged: (destination) => {
      analytics.track('destination_selected', {
        name: destination.name,
        type: destination.type,
        method: destination.coordinate ? 'map_click' : 'search'
      });
    },
    onDirectionsCalculated: (directions) => {
      analytics.track('directions_calculated', {
        distance: directions.distance,
        steps: directions.instructions.length,
        duration: estimateDuration(directions.distance)
      });
    }
  }
);
```

### Save Favorite Locations

```javascript
function saveFavoriteLocation(location) {
  const favorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
  favorites.push(location);
  localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
}

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
  // Show in UI
  favorites.forEach(fav => {
    addFavoriteButton(fav);
  });
}
```

## 📚 Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/public/css/directions-interactive.css">
  <style>
    #map { width: 100%; height: 100vh; }
    #directionsContainer {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: none;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="directionsContainer"></div>

  <script src="https://d1p5cqqchvbqmy.cloudfront.net/web2/release/mappedin-web.js"></script>
  <script src="/public/js/search-module.js"></script>
  <script src="/public/js/directions-card.js"></script>
  <script src="/public/js/directions-interactive.js"></script>

  <script>
    async function init() {
      // Initialize Mappedin
      const mapData = await window.mappedin.getMapData({
        key: 'mik_YOUR_KEY',
        secret: 'mis_YOUR_SECRET',
        mapId: 'YOUR_MAP_ID'
      });

      const mapView = await window.mappedin.createMapView({
        mapData,
        container: document.getElementById('map')
      });

      // Initialize search module
      const searchModule = new MappedInSearch(mapData, {
        maxSuggestions: 5
      });

      // Initialize interactive directions
      const interactiveDirections = new InteractiveDirections(
        mapView,
        mapData,
        searchModule,
        {
          onDirectionsCalculated: (directions) => {
            console.log('✅ Route calculated:', {
              distance: directions.distance,
              steps: directions.instructions.length
            });
          },
          onDestinationChanged: (destination) => {
            console.log('📍 Destination changed:', destination.name);
          }
        }
      );

      const container = document.getElementById('directionsContainer');
      interactiveDirections.init(container);

      // Show directions panel
      container.style.display = 'block';
    }

    init();
  </script>
</body>
</html>
```

## ✅ Summary

**What You Get:**
- ✅ Map click selection with visual feedback
- ✅ Live search suggestions in both fields
- ✅ Three ways to select locations
- ✅ Mobile-optimized UI
- ✅ Accessible mode support
- ✅ Clean event handling
- ✅ Fully customizable

**Best Practices:**
- Always initialize search module first
- Use callbacks for custom behavior
- Handle errors gracefully
- Provide clear visual feedback
- Test on mobile devices
- Cache suggestions for performance

---

**For more information:**
- [DirectionsCard Component Reference](./DIRECTIONS_COMPONENT_REFERENCE.md)
- [Search Module Guide](./SEARCH_MODULE_GUIDE.md)
- [Mappedin Web SDK Docs](https://docs.mappedin.com/web/v6/latest/)
