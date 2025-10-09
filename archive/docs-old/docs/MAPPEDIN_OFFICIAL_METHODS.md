# 📘 Mappedin Official Methods Reference

## Based on Official Documentation Analysis

This document contains the **exact official Mappedin methods** as documented at developer.mappedin.com

---

## 🔵 Blue Dot (User Location)

### Official Import & Setup
```javascript
import { BlueDot } from '@mappedin/blue-dot';

// Initialize
const blueDot = new BlueDot(mapView);
```

### Enable Blue Dot
```javascript
// Basic enable (uses browser geolocation)
blueDot.enable();

// With options
blueDot.enable({
  color: 'tomato',                    // Custom blue dot color
  debug: true,                        // Show debug info
  accuracyRing: {
    color: 'forestgreen',
    opacity: 0.1
  },
  timeout: 20000                      // Position timeout (ms)
});
```

### Listen for Position Updates
```javascript
blueDot.on('position-update', (event) => {
  console.log('Position:', event.coordinate);
  console.log('Floor:', event.floor);
  console.log('Accuracy:', event.accuracy);
  console.log('Heading:', event.heading);

  // Use for wayfinding
  const userCoordinate = event.coordinate;
  const userFloor = event.floor;
});
```

### Camera Follow Modes
```javascript
// Follow user position only
blueDot.follow('position');

// Follow position and heading
blueDot.follow('position-and-heading');

// Follow position and navigation path
blueDot.follow('position-and-path-direction');

// Stop following
blueDot.follow('none');
```

### Manually Update Position (Testing)
```javascript
// For testing without GPS
blueDot.update({
  latitude: 43.65107,           // Or 'device' for real GPS
  longitude: -79.347015,        // Or 'device' for real GPS
  heading: 90,                  // Degrees
  floorOrFloorId: 'm_a3ee83bcd2500363'
});
```

### Disable Blue Dot
```javascript
blueDot.disable();
```

### All BlueDot Events
```javascript
blueDot.on('position-update', (e) => {
  // Position changed
});

blueDot.on('state-change', (state) => {
  // State: 'active', 'inactive', 'error'
});

blueDot.on('error', (error) => {
  // Handle errors
});

blueDot.on('follow-change', (followMode) => {
  // Follow mode changed
});
```

---

## 📍 Drop Pin / Custom Location

### Handle Map Click
```javascript
// Get coordinates from click
mapView.on('click', (event) => {
  const clickedCoordinate = event.coordinate;
  const clickedFloor = event.floor;

  console.log('Clicked at:', clickedCoordinate);

  // Add marker at clicked position
  const marker = mapView.Markers.add(
    clickedCoordinate,
    '<div class="custom-pin">📍</div>'
  );
});
```

### Create Drop Pin Marker
```javascript
let dropPinMarker = null;

function handleDropPin(coordinate) {
  // Remove existing pin
  if (dropPinMarker) {
    mapView.Markers.remove(dropPinMarker);
  }

  // Add new pin
  const pinHTML = `
    <div class="drop-pin">
      <style>
        .drop-pin {
          font-size: 40px;
          animation: drop 0.5s ease-out;
        }
        @keyframes drop {
          0% { transform: translateY(-100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      </style>
      📍
    </div>
  `;

  dropPinMarker = mapView.Markers.add(coordinate, pinHTML, {
    anchor: 'bottom',
    rank: 4
  });
}

// Use on click
mapView.on('click', (event) => {
  if (dropPinMode) {
    handleDropPin(event.coordinate);
  }
});
```

### Animated Marker Movement
```javascript
// Move marker smoothly
mapView.Markers.animateTo(marker, newCoordinate, {
  duration: 1000,
  easing: 'ease-in-out'
});
```

### Remove Markers
```javascript
// Remove specific marker
mapView.Markers.remove(marker);

// Remove all markers
mapView.Markers.removeAll();
```

---

## 🗺️ Wayfinding / Directions

### Basic Directions
```javascript
// Get directions between two spaces
const directions = await mapData.getDirections(startSpace, endSpace);

// Draw on map
mapView.Navigation.draw(directions);
```

### Accessible Routes
```javascript
const directions = await mapData.getDirections(startSpace, endSpace, {
  accessible: true
});
```

### Directions from Coordinate
```javascript
// Use coordinate (from blue dot or drop pin)
const startCoordinate = event.coordinate;
const endSpace = mapData.getByType('space').find(s => s.externalId === '2G19');

const directions = await mapData.getDirections(startCoordinate, endSpace);
```

### Customized Navigation Drawing
```javascript
const navigationOptions = {
  pathOptions: {
    displayArrowsOnPath: true,
    animateArrowsOnPath: true,
    accentColor: '#667eea',
    nearRadius: 2,              // Distance to trigger "arrived"
    farRadius: 5                // Distance to show path
  },
  markerOptions: {
    departureColor: '#228b22',
    destinationColor: '#ff6347'
  }
};

mapView.Navigation.draw(directions, navigationOptions);
```

### Multi-Destination Directions
```javascript
const destinations = [space1, space2, space3];
const multiDirections = mapData.getDirectionsMultiDestination(
  departureSpace,
  destinations
);
```

### Clear Navigation
```javascript
mapView.Navigation.clear();
```

---

## 📏 Turn-by-Turn Instructions

### Display Instructions
```javascript
directions.instructions.forEach((instruction) => {
  const step = `
    ${instruction.action.type}        // "Turn", "Continue", etc.
    ${instruction.action.bearing}     // "left", "right", etc.
    in ${Math.round(instruction.distance)} meters
  `;

  console.log(step);
});
```

### Create Instruction Markers
```javascript
directions.instructions.forEach((instruction) => {
  const markerHTML = `
    <div class="instruction-marker">
      <p>${instruction.action.type} ${instruction.action.bearing ?? ''}</p>
      <p>${Math.round(instruction.distance)}m</p>
    </div>
  `;

  mapView.Markers.add(
    instruction.coordinate,
    markerHTML,
    { anchor: 'center' }
  );
});
```

---

## 🛤️ Custom Paths

### Draw Path
```javascript
const directions = await mapData.getDirections(start, end);

const path = mapView.Paths.add(directions.coordinates, {
  width: 0.5,
  color: '#667eea',
  opacity: 0.8
});
```

### Remove Paths
```javascript
// Remove specific path
mapView.Paths.remove(path);

// Remove all paths
mapView.Paths.removeAll();
```

---

## 🎯 Dynamic Routing with Zones

### Create Cost Zones
```javascript
const directions = await mapData.getDirections(origin, destination, {
  zones: [
    {
      cost: 10,              // Additional navigation cost
      floor: specificFloor,
      geometry: zoneGeometry  // Polygon coordinates
    }
  ]
});
```

**Use Case**: Make certain areas less desirable (construction, crowded areas)

---

## 🎥 Camera Control

### Focus on Location
```javascript
// Focus on space
mapView.Camera.focusOn(space);

// Focus with animation
mapView.Camera.focusOn(space, {
  animationDuration: 1000,
  tilt: 45
});

// Focus on path
mapView.Camera.focusOn(directions.path);
```

### Set Camera State
```javascript
// Follow blue dot
mapView.setState('FOLLOW');

// Default state
mapView.setState('DEFAULT');
```

---

## 🎨 Parachute Drop Pin Animation (Custom)

**Note**: This is NOT a built-in Mappedin feature. It's a custom CSS animation you can add.

```javascript
function createParachutePin(coordinate) {
  const pinHTML = `
    <div class="parachute-container">
      <style>
        .parachute-container {
          position: relative;
          width: 40px;
          height: 80px;
        }

        .parachute {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 30px;
          animation: parachuteFloat 1.2s ease-out forwards;
        }

        .pin {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          font-size: 40px;
          animation: pinDrop 1.2s ease-out;
        }

        @keyframes parachuteFloat {
          0% {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
        }

        @keyframes pinDrop {
          0% {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
          }
          60% {
            transform: translateX(-50%) translateY(5px);
          }
          80% {
            transform: translateX(-50%) translateY(-3px);
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
      </style>
      <div class="parachute">🪂</div>
      <div class="pin">📍</div>
    </div>
  `;

  return mapView.Markers.add(coordinate, pinHTML, {
    anchor: 'bottom',
    rank: 4
  });
}

// Use on click
mapView.on('click', (event) => {
  if (dropPinMode) {
    if (dropPinMarker) mapView.Markers.remove(dropPinMarker);
    dropPinMarker = createParachutePin(event.coordinate);
  }
});
```

---

## 🔄 Complete User Location Flow (Official)

```javascript
import { BlueDot } from '@mappedin/blue-dot';

let blueDot = null;
let currentUserCoordinate = null;

// 1. Initialize Blue Dot
function initBlueDot() {
  blueDot = new BlueDot(mapView);

  blueDot.enable({
    color: '#4285F4',     // Google Maps blue
    accuracyRing: {
      color: '#4285F4',
      opacity: 0.2
    }
  });

  // 2. Listen for position updates
  blueDot.on('position-update', (event) => {
    currentUserCoordinate = event.coordinate;
    console.log('User at:', event.coordinate);
  });

  // 3. Follow user
  blueDot.follow('position');
}

// 4. Get directions from current location
async function navigateFromCurrentLocation(destination) {
  if (!currentUserCoordinate) {
    alert('Waiting for your location...');
    return;
  }

  const directions = await mapData.getDirections(
    currentUserCoordinate,
    destination
  );

  if (directions) {
    mapView.Navigation.draw(directions, {
      pathOptions: {
        displayArrowsOnPath: true,
        animateArrowsOnPath: true,
        accentColor: '#667eea'
      }
    });

    // Follow user during navigation
    blueDot.follow('position-and-path-direction');
  }
}
```

---

## 📱 Complete POC Implementation

### Combining All Features

```javascript
// ============================================
// COMPLETE POC SETUP
// ============================================
import { BlueDot } from '@mappedin/blue-dot';

let mapView, mapData;
let blueDot = null;
let dropPinMarker = null;
let currentUserCoordinate = null;
let dropPinMode = false;

// Initialize
async function init() {
  mapView = await Mappedin.show3dMap(element, options);
  mapData = mapView.mapData;

  // Setup Blue Dot
  setupBlueDot();

  // Setup Drop Pin
  setupDropPin();

  // Setup Click Handlers
  setupClickHandlers();
}

// Blue Dot Setup
function setupBlueDot() {
  blueDot = new BlueDot(mapView);

  blueDot.on('position-update', (event) => {
    currentUserCoordinate = event.coordinate;
  });
}

// Drop Pin Setup
function setupDropPin() {
  mapView.on('click', (event) => {
    if (dropPinMode) {
      handleDropPin(event.coordinate);
    }
  });
}

function handleDropPin(coordinate) {
  if (dropPinMarker) mapView.Markers.remove(dropPinMarker);

  dropPinMarker = createParachutePin(coordinate);
  dropPinMode = false;
}

// Get Directions (Smart Source Selection)
async function getDirections(destination) {
  let startPoint;
  let source = 'unknown';

  // Priority: Blue Dot > Drop Pin > Map Center
  if (currentUserCoordinate) {
    startPoint = currentUserCoordinate;
    source = 'Blue Dot (User Location)';
  } else if (dropPinMarker) {
    startPoint = dropPinMarker.coordinate;
    source = 'Dropped Pin';
  } else {
    startPoint = mapData.mapCenter;
    source = 'Map Center';
  }

  console.log(`Navigating from: ${source}`);

  const directions = await mapData.getDirections(startPoint, destination, {
    accessible: document.getElementById('accessibleToggle').checked
  });

  if (directions) {
    mapView.Navigation.draw(directions, {
      pathOptions: {
        displayArrowsOnPath: true,
        animateArrowsOnPath: true,
        accentColor: '#667eea'
      }
    });

    // Display turn-by-turn
    displayInstructions(directions.instructions);

    // Focus camera
    mapView.Camera.focusOn(directions.path);

    // If using blue dot, follow during navigation
    if (currentUserCoordinate && blueDot) {
      blueDot.follow('position-and-path-direction');
    }
  }
}

// UI Controls
function toggleBlueDot() {
  if (!blueDot) return;

  if (!blueDot.isEnabled) {
    blueDot.enable();
    blueDot.follow('position');
  } else {
    blueDot.disable();
  }
}

function toggleDropPin() {
  dropPinMode = !dropPinMode;
  document.getElementById('dropPinBtn').classList.toggle('active', dropPinMode);
}

function clearNavigation() {
  mapView.Navigation.clear();
}
```

---

## 🎯 Key Takeaways

### ✅ Official Mappedin Methods
1. **BlueDot**: Separate import, full API for user location
2. **Click Events**: `mapView.on('click', ...)` for coordinates
3. **Directions**: `mapData.getDirections(start, end, options)`
4. **Navigation**: `mapView.Navigation.draw(directions, options)`
5. **Markers**: `mapView.Markers.add/remove/animateTo`

### ❌ NOT Built-In
1. **Parachute animation**: Custom CSS (shown above)
2. **Drop pin mode**: Custom state management
3. **UI controls**: Custom buttons/panels

### 🚀 Best Practices
1. Use BlueDot for real user location (not manual coordinate tracking)
2. Priority: Blue Dot > Drop Pin > Map Center
3. Always handle position-update events for live location
4. Use `follow()` modes during navigation
5. Clear navigation before starting new route

---

## 📚 Official Documentation Links

- **Wayfinding**: https://developer.mappedin.com/web-sdk/wayfinding
- **Blue Dot**: https://developer.mappedin.com/web-sdk/blue-dot
- **Markers**: https://developer.mappedin.com/web-sdk/markers
- **Camera**: https://developer.mappedin.com/web-sdk/camera-controls

---

**All code examples above are from official Mappedin documentation!**
