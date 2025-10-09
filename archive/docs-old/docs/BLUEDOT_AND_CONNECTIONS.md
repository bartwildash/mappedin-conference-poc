# 🔵 BlueDot & Multi-Floor Connections

## Overview

Two essential features for conference navigation:
1. **BlueDot** - Real-time user location tracking
2. **Connections** - Elevators, stairs, escalators for multi-floor navigation

---

## 🔵 BlueDot - User Location Tracking

### Installation

Already installed in this POC:
```bash
npm install @mappedin/blue-dot
```

### Basic Implementation

```javascript
import { BlueDot } from '@mappedin/blue-dot';

// Create BlueDot instance
const blueDot = new BlueDot(mapView);

// Enable with custom styling
blueDot.enable({
  color: '#4285F4',              // Blue dot color
  accuracyRing: {
    color: '#4285F4',
    opacity: 0.2
  },
  timeout: 20000                 // 20s before going inactive
});
```

### Position Update Methods

#### 1. Browser Geolocation (Automatic)
```javascript
// Uses browser's geolocation API
blueDot.enable();

// Browser will prompt for location permission
// Works outdoors and in some indoor venues with WiFi positioning
```

#### 2. Manual Position Update
```javascript
// Update position manually (e.g., from indoor positioning system)
blueDot.update({
  latitude: 43.642567,
  longitude: -79.387054,
  accuracy: 5,                   // Meters
  heading: 90,                   // Degrees (0=North, 90=East)
  floorOrFloorId: 'floor_1'     // Current floor
});
```

#### 3. Indoor Positioning System Integration
```javascript
// Example: Integration with Bluetooth beacons or WiFi positioning
indoorPositioningSystem.on('position', (position) => {
  blueDot.update({
    latitude: position.lat,
    longitude: position.lng,
    accuracy: position.accuracy,
    heading: position.heading,
    floorOrFloorId: position.floor
  });
});
```

### Follow Modes

```javascript
// Follow user position only
blueDot.follow('position-only');

// Follow user position and heading
blueDot.follow('position-and-heading');

// Follow along navigation path
blueDot.follow('position-and-path-direction');

// Disable follow mode
blueDot.follow(false);
```

### Event Handling

```javascript
// Position updates
blueDot.on('position-update', (event) => {
  console.log('User location:', event.coordinate);
  console.log('Accuracy:', event.accuracy, 'meters');
  console.log('Floor:', event.floor);
});

// State changes (active/inactive)
blueDot.on('state-change', (event) => {
  console.log('BlueDot state:', event.state);
  // States: 'active', 'inactive'
});

// Error handling
blueDot.on('error', (error) => {
  console.error('Location error:', error);
  // Handle permission denied, unavailable, timeout
});
```

### Navigation Integration

```javascript
// Start navigation with BlueDot
async function navigateFromUserLocation(destination) {
  // Wait for BlueDot position
  const userPosition = await new Promise((resolve) => {
    blueDot.once('position-update', (event) => {
      resolve(event.coordinate);
    });
  });

  // Find nearest space to user
  const userSpace = mapData.getNearestNode(userPosition);

  // Get directions from user to destination
  const directions = await mapData.getDirections(userSpace, destination);

  // Draw navigation path
  mapView.Navigation.draw(directions);

  // Enable follow mode
  blueDot.follow('position-and-path-direction');
}
```

### Conference Use Cases

#### 1. Real-Time Navigation
```javascript
// Navigate attendee to exhibitor booth
const exhibitorBooth = mapData.getByType('space')
  .find(s => s.externalId === '2G19');

navigateFromUserLocation(exhibitorBooth);
```

#### 2. Location-Based Notifications
```javascript
blueDot.on('position-update', (event) => {
  // Check if near a specific exhibitor
  exhibitorData.forEach(exhibitor => {
    const booth = findBoothByExternalId(exhibitor.stallNo);
    const distance = mapData.getDistance(event.coordinate, booth);

    if (distance < 5) {  // Within 5 meters
      showNotification(`You're near ${exhibitor.companyName}!`);
    }
  });
});
```

#### 3. Attendance Tracking
```javascript
// Track which booths attendees visit
blueDot.on('position-update', (event) => {
  const nearestSpace = mapData.getNearestNode(event.coordinate);
  
  if (nearestSpace.externalId) {
    logVisit(attendeeId, nearestSpace.externalId);
  }
});
```

---

## 🏢 Connections - Multi-Floor Navigation

### What are Connections?

Connections represent vertical transportation between floors:
- 🛗 Elevators
- 🪜 Stairs
- 🔼 Escalators
- 🚪 Ramps

### Getting Connections

```javascript
// Get all connections in the venue
const connections = mapData.getByType('connection');

console.log(`Found ${connections.length} connections`);

connections.forEach(connection => {
  console.log(`${connection.name}:`, connection.type);
  console.log('  Floors:', connection.coordinates.map(c => c.floor.name));
});
```

### Connection Properties

```javascript
{
  id: 'connection_123',
  name: 'Elevator A',
  type: 'elevator',           // elevator, stairs, escalator
  coordinates: [              // Array of coordinates per floor
    {
      latitude: 43.642567,
      longitude: -79.387054,
      floor: Floor              // Floor object
    },
    // ... more floors
  ]
}
```

### Displaying Connections

```javascript
// Add markers for all elevators on current floor
function displayElevators(currentFloor) {
  const elevators = mapData.getByType('connection')
    .filter(c => c.type === 'elevator');

  elevators.forEach(elevator => {
    // Find coordinate for current floor
    const coord = elevator.coordinates.find(
      c => c.floor.id === currentFloor.id
    );

    if (coord) {
      // Add elevator marker
      const markerHTML = `
        <div style="
          background: white;
          color: #333;
          padding: 8px;
          border-radius: 50%;
          font-size: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">🛗</div>
      `;

      mapView.Markers.add(coord, markerHTML, {
        anchor: 'center',
        rank: 'high'
      });
    }
  });
}
```

### Connection Types with Icons

```javascript
const connectionIcons = {
  'elevator': '🛗',
  'stairs': '🪜',
  'escalator': '🔼',
  'ramp': '♿'
};

function displayAllConnections(currentFloor) {
  const connections = mapData.getByType('connection');

  connections.forEach(connection => {
    const coord = connection.coordinates.find(
      c => c.floor.id === currentFloor.id
    );

    if (coord) {
      const icon = connectionIcons[connection.type] || '📍';
      
      const markerHTML = `
        <div style="background:white;padding:8px;border-radius:50%;font-size:24px;">
          ${icon}
        </div>
      `;

      mapView.Markers.add(coord, markerHTML, {
        anchor: 'center',
        rank: 'medium'
      });
    }
  });
}
```

### Multi-Floor Navigation

```javascript
// Navigate between floors automatically
async function navigateWithFloorChange(start, destination) {
  const directions = await mapData.getDirections(start, destination);

  if (!directions) return;

  // Check if route crosses floors
  const floorsInRoute = new Set(
    directions.path.map(coord => coord.floor.id)
  );

  if (floorsInRoute.size > 1) {
    console.log('Route uses multiple floors');
    
    // Find which connections are used
    directions.instructions.forEach(instruction => {
      if (instruction.action?.type === 'take-elevator') {
        console.log('Take elevator:', instruction.action.name);
      }
      if (instruction.action?.type === 'take-stairs') {
        console.log('Take stairs:', instruction.action.name);
      }
    });
  }

  // Draw the full multi-floor path
  mapView.Navigation.draw(directions);
}
```

### Accessible Routing

```javascript
// Prefer elevators over stairs for accessible routes
async function getAccessibleRoute(start, destination) {
  const directions = await mapData.getDirections(start, destination, {
    accessible: true  // SDK will prefer elevators/ramps over stairs
  });

  if (directions) {
    mapView.Navigation.draw(directions);
    
    console.log('Accessible route instructions:');
    directions.instructions.forEach((instruction, i) => {
      console.log(`${i + 1}. ${instruction.action?.type}`);
    });
  }
}
```

### Conference Use Cases

#### 1. Show Nearest Elevator
```javascript
function findNearestElevator(userCoordinate) {
  const elevators = mapData.getByType('connection')
    .filter(c => c.type === 'elevator');

  let nearest = null;
  let minDistance = Infinity;

  elevators.forEach(elevator => {
    const coord = elevator.coordinates.find(
      c => c.floor.id === userCoordinate.floor.id
    );

    if (coord) {
      const distance = mapData.getDistance(userCoordinate, coord);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { elevator, coordinate: coord, distance };
      }
    }
  });

  return nearest;
}

// Usage
const nearestElevator = findNearestElevator(blueDotPosition);
console.log(`Nearest elevator: ${nearestElevator.elevator.name}`);
console.log(`Distance: ${Math.round(nearestElevator.distance)}m`);
```

#### 2. Display Connection Labels
```javascript
function addConnectionLabels(currentFloor) {
  const connections = mapData.getByType('connection');

  connections.forEach(connection => {
    const coord = connection.coordinates.find(
      c => c.floor.id === currentFloor.id
    );

    if (coord) {
      mapView.Labels.add(coord, connection.name, {
        appearance: {
          textSize: 14,
          marker: {
            foregroundColor: { r: 102, g: 126, b: 234 }
          }
        }
      });
    }
  });
}
```

#### 3. Floor Change Notification
```javascript
let currentFloor = mapView.currentFloor;

mapView.on('floor-change', (event) => {
  const newFloor = event.floor;
  
  if (currentFloor.id !== newFloor.id) {
    // User changed floors
    showNotification(`You are now on ${newFloor.name}`);
    
    // Update connection markers for new floor
    displayAllConnections(newFloor);
    
    currentFloor = newFloor;
  }
});
```

## Integration Example: Complete Conference Navigation

```javascript
import { BlueDot } from '@mappedin/blue-dot';
import { getMapData, show3dMap } from '@mappedin/mappedin-js';

async function setupConferenceNavigation() {
  // Initialize map
  const mapData = await getMapData(options);
  const mapView = await show3dMap(container, mapData);

  // Setup BlueDot
  const blueDot = new BlueDot(mapView);
  blueDot.enable({
    color: '#667eea',
    accuracyRing: { color: '#667eea', opacity: 0.2 }
  });

  // Display connections on current floor
  const displayConnections = (floor) => {
    const connections = mapData.getByType('connection');
    connections.forEach(connection => {
      const coord = connection.coordinates.find(c => c.floor.id === floor.id);
      if (coord) {
        const icon = connectionIcons[connection.type] || '📍';
        mapView.Markers.add(coord, `<div>${icon}</div>`);
      }
    });
  };

  displayConnections(mapView.currentFloor);

  // Navigate to exhibitor from user location
  async function navigateToExhibitor(exhibitorBoothId) {
    const userPosition = await new Promise(resolve => {
      blueDot.once('position-update', e => resolve(e.coordinate));
    });

    const userSpace = mapData.getNearestNode(userPosition);
    const booth = mapData.getByType('space')
      .find(s => s.externalId === exhibitorBoothId);

    const directions = await mapData.getDirections(userSpace, booth, {
      accessible: true  // Prefer accessible routes
    });

    mapView.Navigation.draw(directions);
    blueDot.follow('position-and-path-direction');
  }

  return { mapView, mapData, blueDot, navigateToExhibitor };
}
```

## Key Takeaways

### BlueDot
✅ Real-time user location tracking
✅ Browser geolocation or manual positioning
✅ Follow modes for navigation
✅ Event-driven architecture
✅ Perfect for "Navigate from here"

### Connections
✅ Vertical transportation representation
✅ Elevators, stairs, escalators, ramps
✅ Multi-floor navigation support
✅ Accessible routing options
✅ Visual markers on map

## Resources

- BlueDot Docs: `developer.mappedin.com/web-sdk/blue-dot`
- Connections Docs: `developer.mappedin.com/web-sdk/connections`
- API Reference: `docs.mappedin.com/web/v6/latest/`

---

**Status:** 📚 Documented for implementation
**Next Step:** Add BlueDot button to POC UI
**Priority:** High (essential for production)

