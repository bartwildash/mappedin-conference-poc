# Labels vs Markers - Quick Decision Guide

## TL;DR - What Should I Use?

### Use **Labels** when you need:
- ✅ Simple text or icons
- ✅ High performance (100s of items)
- ✅ Native map feel
- ✅ Automatic collision handling
- ✅ Examples: room names, toilet icons, exit signs

### Use **Markers** when you need:
- ✅ Custom HTML/CSS styling (gradients, shadows, complex UI)
- ✅ Rich interactive cards
- ✅ Buttons or clickable elements inside
- ✅ Examples: exhibitor booths, custom info cards, promotional displays

---

## Key Differences At a Glance

| Aspect | Labels | Markers |
|--------|--------|---------|
| **What They Are** | Native Mappedin text/icon elements | Custom HTML elements anchored to map |
| **Rendering** | Built into map engine (WebGL) | DOM elements (HTML/CSS) |
| **Performance** | Very fast (100s possible) | Slower (DOM overhead) |
| **Customization** | Limited (text, color, simple SVG icon) | Full HTML/CSS control |
| **Collision** | Automatic via ranking | Automatic via ranking |
| **Interactivity** | `interactive: true` | `false`, `true`, or `'pointer-events-auto'` |

---

## Ranking System (Both Support Same Ranks)

```javascript
rank: 'low'            // Hidden when overlapping with higher ranks
rank: 'medium'         // Hidden by 'high' and 'always-visible'
rank: 'high'           // Hidden only by 'always-visible'
rank: 'always-visible' // Never hidden
```

### Conference POC Ranking Strategy:
- **Amenities** (toilets, exits): `rank: 'low'` - Less important, can hide
- **Exhibitors** (booths): `rank: 'high'` - Primary focus, should show
- **Emergency exits**: `rank: 'always-visible'` - Critical safety info

---

## Interactivity Comparison

### Labels - Simple Interactive Mode
```javascript
mapView.Labels.add(space, 'Booth 2G19', {
  interactive: true,  // Can be clicked
  rank: 'high'
});

// Detect clicks
mapView.on('click', (event) => {
  if (event?.labels?.length > 0) {
    console.log('Clicked label');
  }
});
```

### Markers - Three Interactive Modes

#### Mode 1: Non-Interactive
```javascript
mapView.Markers.add(space, html, {
  interactive: false  // No events
});
```

#### Mode 2: Captures Click Events
```javascript
const marker = mapView.Markers.add(space, html, {
  interactive: true  // Marker captures clicks
});

marker.addEventListener('click', () => {
  showExhibitorCard();
});
```

#### Mode 3: HTML Interactivity (Buttons, Links)
```javascript
const html = `
  <div>
    <button onclick="navigate()">Go</button>
    <button onclick="details()">Info</button>
  </div>
`;

mapView.Markers.add(space, html, {
  interactive: 'pointer-events-auto'  // HTML elements work
});
```

---

## Conference POC Implementation

### Current Implementation ✅

**Exhibitors** - Using **Markers** (Correct Choice)
- Custom gradient styling
- Hover scale animation
- Rich HTML with icons
- High ranking

```javascript
const markerHTML = `
  <div style="
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    cursor: pointer;
  ">
    📍 Booth 2G19
  </div>
`;

mapView.Markers.add(space, markerHTML, {
  rank: 'high',
  interactive: true
});
```

**Amenities** - Using **Markers** (Works, but Labels might be better)
- Simple emoji icons
- Low ranking
- Could benefit from Label performance

```javascript
// Current (Markers)
mapView.Markers.add(amenity, markerHTML, {
  rank: 'low'
});

// Alternative (Labels) - Better performance
mapView.Labels.add(amenity, '🚻', {
  rank: 'low',
  interactive: true,
  appearance: { color: '#666' }
});
```

---

## Hover Effects - Space Interactivity

Spaces (floors, booths, rooms) can have hover effects:

```javascript
mapView.updateState(space, {
  interactive: true,
  hoverColor: '#667eea',  // Color when hovering
  color: '#e0e0e0'        // Default color
});

// Detect hover
mapView.on('hover', (event) => {
  if (event?.spaces?.length > 0) {
    console.log('Hovering:', event.spaces[0].name);
  }
});
```

---

## Event Priority System

When multiple elements overlap, handle clicks in priority:

```javascript
mapView.on('click', (event) => {
  // 1. Markers (most specific - custom UI)
  if (event?.markers?.length > 0) {
    return; // Marker has own handler
  }

  // 2. Labels (specific annotations)
  if (event?.labels?.length > 0) {
    console.log('Label clicked');
    return;
  }

  // 3. Map Objects (doors, windows, furniture)
  if (event?.objects?.length > 0) {
    console.log('Object clicked:', event.objects[0].type);
    return;
  }

  // 4. Spaces (floor areas, rooms, booths)
  if (event?.spaces?.length > 0) {
    console.log('Space clicked');
    return;
  }

  // 5. Empty map (fallback)
  console.log('Map background clicked');
});
```

---

## Performance Recommendations

| Scenario | Recommendation | Reason |
|----------|---------------|--------|
| 500 exhibitor booths with custom UI | Markers with `rank: 'high'` | Need custom styling |
| 200 toilet icons | Labels with `rank: 'low'` | Simple icons, better performance |
| 50 emergency exits | Labels with `rank: 'always-visible'` | Critical + simple |
| 10 promotional booths | Markers with rich HTML | Custom interactive UI |
| Floor/room names | Labels | Native map feel |

---

## Migration Path: Markers → Labels

If you have simple markers that could be labels:

```javascript
// Before (Marker)
mapView.Markers.add(amenity, `<div>🚻</div>`, {
  rank: 'low'
});

// After (Label) - Better performance
mapView.Labels.add(amenity, '🚻', {
  rank: 'low',
  appearance: {
    color: '#666'
  }
});
```

---

## Code Examples

### Complete Exhibitor Marker Setup
```javascript
function setupExhibitorMarkers() {
  const spaces = mapData.getByType('space').filter(s => s.externalId);

  spaces.forEach(space => {
    const html = `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 16px;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'"
         onmouseout="this.style.transform='scale(1)'">
        📍 ${space.externalId}
      </div>
    `;

    const marker = mapView.Markers.add(space, html, {
      anchor: 'center',
      rank: 'high',
      interactive: true
    });

    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      showExhibitorCard(space);
    });
  });
}
```

### Complete Amenity Label Setup
```javascript
function setupAmenityLabels() {
  const amenities = mapData.getByType('amenity');

  const icons = {
    'restroom': '🚻',
    'elevator': '🛗',
    'exit': '🚪'
  };

  amenities.forEach(amenity => {
    const icon = icons[amenity.type] || '📍';

    mapView.Labels.add(amenity, icon, {
      rank: 'low',
      interactive: true,
      appearance: {
        color: '#666'
      }
    });
  });
}
```

### Space Hover + Click Setup
```javascript
function setupSpaceInteractivity() {
  const spaces = mapData.getByType('space').filter(s => s.externalId);

  // Enable hover effects
  spaces.forEach(space => {
    mapView.updateState(space, {
      interactive: true,
      hoverColor: '#667eea',
      color: '#e0e0e0'
    });
  });

  // Handle hover
  mapView.on('hover', (event) => {
    if (event?.spaces?.length > 0) {
      showPreview(event.spaces[0]);
    } else {
      hidePreview();
    }
  });

  // Handle clicks
  mapView.on('click', (event) => {
    if (event?.spaces?.length > 0) {
      showDetails(event.spaces[0]);
    }
  });
}
```

---

## Decision Flowchart

```
Do you need custom HTML/CSS styling?
├─ YES → Use Markers
│   └─ Do elements inside need to be clickable (buttons)?
│       ├─ YES → interactive: 'pointer-events-auto'
│       └─ NO → interactive: true
│
└─ NO → Do you just need text/simple icon?
    └─ YES → Use Labels
        └─ Set appropriate rank: 'low', 'medium', 'high', 'always-visible'
```

---

## License Note

Interactive features require a **Mappedin Pro license** for custom maps.

---

## Questions?

- **"My labels aren't showing"** → Check rank, might be hidden by higher-ranked elements
- **"Markers are slow"** → Consider switching simple ones to Labels
- **"Click not working"** → Check `interactive: true` and event handlers
- **"Hover effect not showing"** → Ensure `mapView.updateState(space, { interactive: true })`
