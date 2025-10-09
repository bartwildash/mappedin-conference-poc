# Labels vs Markers - Implementation Guide

## Quick Reference

| Feature | Labels | Markers |
|---------|--------|---------|
| **Type** | Native Mappedin elements | Custom HTML/CSS elements |
| **Content** | Text + simple icons | Any HTML/CSS |
| **Performance** | High (built-in rendering) | Lower (DOM elements) |
| **Use Case** | Space names, simple annotations | Custom UI, rich tooltips |
| **Ranking** | `'low'`, `'medium'`, `'high'`, `'always-visible'` | Same ranking system |
| **Interactivity** | `interactive: true` option | `false`, `true`, or `'pointer-events-auto'` |

## When to Use Labels

Use **Labels** for:
- Space names and room numbers
- Simple icons (toilets, exits, elevators)
- Static text annotations
- High-volume items (100s of labels)
- Native map feel

### Label Code Example
```javascript
// Add label to space
mapView.Labels.add(space, space.name, {
  appearance: {
    color: 'blue',
    icon: svgIcon  // SVG string
  },
  interactive: true,
  rank: 'high'
});

// Add all default labels
mapView.Labels.__EXPERIMENTAL__all();
```

### Label Ranking Example
```javascript
// Amenities - low priority
mapView.Labels.add(amenity, '🚻', { rank: 'low' });

// Exhibitors - high priority
mapView.Labels.add(exhibitor, 'Booth 2G19', { rank: 'high' });

// Critical info - always visible
mapView.Labels.add(exit, 'Emergency Exit', { rank: 'always-visible' });
```

## When to Use Markers

Use **Markers** for:
- Custom styled components (gradient backgrounds, shadows)
- Interactive cards with buttons
- Rich HTML tooltips
- Dynamic content that changes frequently
- Custom exhibitor displays

### Marker Code Example
```javascript
const markerHTML = `
  <div style="
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 16px;
    border-radius: 20px;
    font-weight: 600;
  ">
    <span>📍</span> Booth 2G19
  </div>
`;

const marker = mapView.Markers.add(space, markerHTML, {
  anchor: 'center',
  rank: 'high',
  interactive: true  // Captures click events
});

// Listen to marker clicks
marker.addEventListener('click', (e) => {
  e.stopPropagation();
  showExhibitorCard(space);
});
```

## Interactivity Patterns

### 1. Interactive Spaces with Hover
```javascript
mapData.getByType('space').forEach((space) => {
  mapView.updateState(space, {
    interactive: true,
    hoverColor: '#667eea',  // Color on hover
  });
});

// Handle hover events
mapView.on('hover', (event) => {
  if (event?.spaces?.length > 0) {
    console.log('Hovering over:', event.spaces[0].name);
  }
});
```

### 2. Click Events
```javascript
mapView.on('click', (event) => {
  // Check what was clicked
  if (event?.spaces?.length > 0) {
    const space = event.spaces[0];
    console.log('Clicked space:', space.name);
    showDetailsCard(space);
  }

  if (event?.labels?.length > 0) {
    console.log('Clicked label:', event.labels[0]);
  }

  if (event?.markers?.length > 0) {
    console.log('Clicked marker');
  }
});
```

### 3. Marker Interactivity Modes
```javascript
// Mode 1: Not interactive
mapView.Markers.add(space, html, { interactive: false });

// Mode 2: Captures click events
mapView.Markers.add(space, html, { interactive: true });

// Mode 3: Pass events to HTML content (for buttons, links)
mapView.Markers.add(space, html, { interactive: 'pointer-events-auto' });
```

## Conference POC Recommendations

### Exhibitor Booths
**Use Markers** - They need custom styling with gradients, shadows, and rich interactivity
```javascript
mapView.Markers.add(space, exhibitorHTML, {
  rank: 'high',
  interactive: true
});
```

### Amenities (Toilets, Elevators, Exits)
**Use Labels** - Simple icons, better performance, native feel
```javascript
mapView.Labels.add(amenity, '🚻', {
  rank: 'low',
  interactive: true,
  appearance: { color: '#666' }
});
```

### Space Highlighting
**Use updateState** - For hover effects on floor spaces
```javascript
mapView.updateState(space, {
  interactive: true,
  hoverColor: '#667eea'
});
```

## Performance Tips

1. **High Volume Items**: Use Labels (100s of toilets, rooms)
2. **Custom UI**: Use Markers (exhibitor cards, special booths)
3. **Ranking**: Set appropriate ranks to manage collisions
4. **Clustering**: For many markers in same area, enable clustering
5. **Dynamic Updates**: Remove/add markers as needed, labels are more static

## Event Payload Structure

```javascript
mapView.on('click', (event) => {
  console.log(event);
  // {
  //   coordinate: { latitude, longitude, floor },
  //   spaces: [space1, space2],  // Clicked spaces
  //   labels: [label1],           // Clicked labels
  //   markers: [marker1],         // Clicked markers
  //   pointerEvent: MouseEvent    // Original DOM event
  // }
});
```

## License Note

**Interactive features require a Pro license** for custom maps (Mappedin venues may have different requirements).

## Migration Path

If you start with Markers and need better performance:
1. Identify simple markers (just text/icons)
2. Replace with Labels using same rank
3. Keep complex markers for rich UI
4. Test collision behavior with mixed approach
