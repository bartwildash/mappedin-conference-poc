# Mappedin Interactivity Guide

Complete guide to handling user interactions in the Mappedin Conference POC.

## Overview

Mappedin supports three types of interactivity:
1. **Space interactions** - Clicking/hovering on map spaces (booths, rooms)
2. **Label interactions** - Interacting with text labels
3. **Marker interactions** - Clicking custom HTML markers

## Space Interactivity

### Enable Interactive Spaces with Hover Effects

```javascript
// Make all exhibitor spaces interactive
const exhibitorSpaces = mapData.getByType('space').filter(s => s.externalId);

exhibitorSpaces.forEach((space) => {
  mapView.updateState(space, {
    interactive: true,
    hoverColor: '#667eea',  // Purple hover effect
    color: '#f0f0f0'        // Default color
  });
});
```

### Handle Space Clicks

```javascript
mapView.on('click', (event) => {
  if (event?.spaces?.length > 0) {
    const clickedSpace = event.spaces[0];

    console.log('Clicked:', clickedSpace.name);
    console.log('Booth ID:', clickedSpace.externalId);

    // Show exhibitor details
    showExhibitorCard(clickedSpace);

    // Navigate to space
    navigateToSpace(clickedSpace);
  }
});
```

### Handle Space Hover

```javascript
mapView.on('hover', (event) => {
  if (event?.spaces?.length > 0) {
    const hoveredSpace = event.spaces[0];

    // Show preview tooltip
    showPreviewTooltip(hoveredSpace.name, event.coordinate);
  } else {
    // Mouse left all spaces
    hidePreviewTooltip();
  }
});
```

## Label Interactivity

### Create Interactive Labels

```javascript
// Add interactive label to space
mapView.Labels.add(space, space.name, {
  interactive: true,
  rank: 'high',
  appearance: {
    color: '#667eea',
    icon: svgIconString  // Optional SVG icon
  }
});
```

### Handle Label Clicks

```javascript
mapView.on('click', (event) => {
  if (event?.labels?.length > 0) {
    const clickedLabel = event.labels[0];
    console.log('Clicked label:', clickedLabel);

    // Labels are attached to targets (spaces, coordinates, etc.)
    // Access the underlying object if needed
  }
});
```

## Marker Interactivity

### Three Interactivity Modes

#### Mode 1: Non-Interactive (Default)
```javascript
mapView.Markers.add(space, markerHTML, {
  interactive: false  // Default - marker doesn't capture events
});
```

#### Mode 2: Interactive (Captures Clicks)
```javascript
const marker = mapView.Markers.add(space, markerHTML, {
  interactive: true  // Marker captures click events
});

// Listen to marker clicks directly
marker.addEventListener('click', (e) => {
  e.stopPropagation();  // Prevent event bubbling
  console.log('Marker clicked!');
  showExhibitorDetails();
});
```

#### Mode 3: Pointer Events Auto (HTML Interactivity)
```javascript
const markerHTML = `
  <div style="padding: 10px; background: white;">
    <h3>Booth 2G19</h3>
    <button onclick="navigateHere()">Navigate</button>
    <button onclick="showDetails()">Details</button>
  </div>
`;

mapView.Markers.add(space, markerHTML, {
  interactive: 'pointer-events-auto'  // Pass events to HTML content
});

// Now buttons inside marker will work
```

### Global Marker Click Handler

```javascript
mapView.on('click', (event) => {
  if (event?.markers?.length > 0) {
    console.log('Clicked a marker via global handler');
  }
});
```

## Event Object Structure

```javascript
mapView.on('click', (event) => {
  console.log(event);

  // Event structure:
  // {
  //   coordinate: {
  //     latitude: 43.1234,
  //     longitude: -79.5678,
  //     floor: FloorObject
  //   },
  //   spaces: [Space, Space],      // All spaces at click point
  //   objects: [MapObject],         // Clicked map objects (doors, windows, furniture, etc.)
  //   labels: [Label],              // Clicked labels
  //   markers: [Marker],            // Clicked markers
  //   pointerEvent: MouseEvent      // Original DOM event
  // }
});
```

### Working with Map Objects

Map objects are physical elements like doors, windows, columns, furniture:

```javascript
mapView.on('click', (event) => {
  if (event?.objects?.length > 0) {
    const mapObject = event.objects[0];

    console.log('Clicked object type:', mapObject.type);  // 'door', 'window', 'column', etc.
    console.log('Object name:', mapObject.name);

    // Example: Highlight clicked door
    if (mapObject.type === 'door') {
      mapView.updateState(mapObject, {
        color: '#ff0000',  // Highlight in red
        interactive: true
      });
    }
  }
});
```

## Conference POC Implementation

### Complete Interactive Setup

```javascript
async function setupInteractivity() {
  // 1. Make exhibitor spaces interactive with hover
  const exhibitorSpaces = mapData.getByType('space').filter(s => s.externalId);

  exhibitorSpaces.forEach((space) => {
    mapView.updateState(space, {
      interactive: true,
      hoverColor: '#667eea',
      color: '#e0e0e0'
    });
  });

  // 2. Handle hover events for preview
  mapView.on('hover', (event) => {
    const statusDiv = document.getElementById('status');

    if (event?.spaces?.length > 0) {
      const space = event.spaces[0];
      statusDiv.textContent = `🎯 ${space.name || space.externalId}`;
      statusDiv.style.background = '#667eea';
    } else {
      statusDiv.textContent = '👆 Click any booth to see details';
      statusDiv.style.background = '#333';
    }
  });

  // 3. Handle click events
  mapView.on('click', async (event) => {
    // Priority 1: Marker clicks (custom exhibitor cards)
    if (event?.markers?.length > 0) {
      return; // Let marker handle it
    }

    // Priority 2: Space clicks
    if (event?.spaces?.length > 0) {
      const space = event.spaces[0];
      await showExhibitorCard(space);
      return;
    }

    // Priority 3: Empty map click (close card)
    hideExhibitorCard();
  });
}
```

### Interactive Exhibitor Markers

```javascript
function createExhibitorMarker(space) {
  const markerHTML = `
    <div class="exhibitor-marker" style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 16px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    " onmouseover="this.style.transform='scale(1.1)'"
       onmouseout="this.style.transform='scale(1)'">
      📍 ${space.externalId}
    </div>
  `;

  const marker = mapView.Markers.add(space, markerHTML, {
    anchor: 'center',
    rank: 'high',
    interactive: true
  });

  // Handle marker click
  marker.addEventListener('click', (e) => {
    e.stopPropagation();
    showExhibitorCard(space, true);  // true = navigate
  });

  return marker;
}
```

### Show/Hide Exhibitor Card

```javascript
async function showExhibitorCard(space, shouldNavigate = false) {
  const card = document.getElementById('exhibitorCard');
  const standNumber = space.externalId;

  // Fetch exhibitor data
  const exhibitors = await fetchExhibitorsForBooth(standNumber);

  if (exhibitors.length === 0) {
    card.innerHTML = `
      <h3>Booth ${standNumber}</h3>
      <p>No exhibitor information available</p>
    `;
  } else if (exhibitors.length === 1) {
    // Single exhibitor
    card.innerHTML = `
      <h3>${exhibitors[0].name}</h3>
      <p><strong>Booth:</strong> ${standNumber}</p>
      <p>${exhibitors[0].description}</p>
      <button onclick="navigateToSpace('${space.id}')">Navigate Here</button>
    `;
  } else {
    // Co-exhibitors
    card.innerHTML = `
      <h3>Booth ${standNumber} - Co-Exhibitors</h3>
      ${exhibitors.map(ex => `
        <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #667eea;">
          <strong>${ex.name}</strong>
          <p>${ex.description}</p>
        </div>
      `).join('')}
      <button onclick="navigateToSpace('${space.id}')">Navigate Here</button>
    `;
  }

  card.style.display = 'block';

  // Optional: Auto-navigate
  if (shouldNavigate) {
    await navigateToSpace(space);
  }
}

function hideExhibitorCard() {
  document.getElementById('exhibitorCard').style.display = 'none';
}
```

## Best Practices

### 1. Event Bubbling
```javascript
marker.addEventListener('click', (e) => {
  e.stopPropagation();  // Prevent space click from also firing
  handleMarkerClick();
});
```

### 2. Hover Performance
```javascript
// Debounce hover events for better performance
let hoverTimeout;
mapView.on('hover', (event) => {
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    updateHoverUI(event);
  }, 50);
});
```

### 3. Priority System
Handle clicks in priority order:
1. Markers (most specific)
2. Labels (medium specificity)
3. Spaces (least specific)
4. Empty map (fallback)

### 4. Visual Feedback
Always provide immediate visual feedback:
- Hover effects on spaces
- Cursor changes (`cursor: pointer`)
- Scale animations on markers
- Status bar updates

## Accessibility Considerations

```javascript
// Add keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideExhibitorCard();
    mapView.Navigation.clear();
  }
});

// Add ARIA labels to interactive elements
const markerHTML = `
  <div role="button"
       aria-label="Booth ${space.externalId}"
       tabindex="0">
    📍 ${space.externalId}
  </div>
`;
```

## Testing Interactivity

```javascript
// Log all interactions for debugging
function enableDebugMode() {
  mapView.on('click', (e) => console.log('CLICK:', e));
  mapView.on('hover', (e) => console.log('HOVER:', e));

  // Test if space is interactive
  const space = mapData.getByType('space')[0];
  console.log('Space interactive?', mapView.getState(space).interactive);
}
```

## Performance Tips

1. **Limit hover events**: Use debouncing for hover handlers
2. **Remove unused listeners**: Clean up event listeners when removing markers
3. **Batch updates**: Update multiple spaces at once with `updateState`
4. **Use event delegation**: Prefer global handlers over individual marker listeners when possible

## License Note

Interactive features require a **Mappedin Pro license** for custom maps.
