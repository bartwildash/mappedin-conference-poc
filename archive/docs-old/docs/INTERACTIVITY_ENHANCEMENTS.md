# Interactivity Enhancements - Conference POC

## What's New ✨

The POC now implements Mappedin's official best practices for interactivity, including:

1. **Hover Effects** - Spaces change color when you hover over them
2. **Proper Event Priority** - Handles markers, labels, objects, and spaces in correct order
3. **Named Ranking** - Uses official `'low'`, `'high'` ranks instead of numeric values
4. **Complete Event Coverage** - Handles all clickable elements (markers, labels, objects, spaces)

---

## Implementation Details

### 1. Hover Effects on Spaces

**What it does:** Exhibitor booth spaces turn purple when you hover over them

**Code:**
```javascript
spacesWithIds.forEach(space => {
  mapView.updateState(space, {
    interactive: true,
    hoverColor: '#667eea',  // Purple hover
    color: '#e0e0e0'        // Light gray default
  });
});
```

**Location:** `index.html` lines 204-210

**User Experience:**
- Hover over booth → turns purple
- Status bar shows: "🎯 Hovering: Booth 2G19"
- Move mouse away → returns to light gray
- Clear visual feedback before clicking

---

### 2. Hover Event Handler

**What it does:** Updates status bar with booth info on hover

**Code:**
```javascript
mapView.on('hover', (event) => {
  if (event?.spaces?.length > 0) {
    const space = event.spaces[0];
    status.textContent = `🎯 Hovering: ${space.name || space.externalId}`;
    status.style.background = '#667eea';
  } else {
    status.textContent = '👆 Click any booth to see exhibitor details';
    status.style.background = '#333';
  }
});
```

**Location:** `index.html` lines 213-225

**User Experience:**
- Immediate feedback when hovering
- Shows booth name or ID
- Status bar color changes to match hover color
- Returns to default message when not hovering

---

### 3. Complete Event Priority System

**What it does:** Handles clicks on different elements in correct priority order

**Code:**
```javascript
mapView.on('click', (event) => {
  // 1. Markers (custom UI)
  if (event?.markers?.length > 0) {
    return; // Marker has own handler
  }

  // 2. Labels
  if (event?.labels?.length > 0) {
    console.log('📝 Label clicked:', event.labels[0]);
    return;
  }

  // 3. Map Objects (doors, windows, furniture)
  if (event?.objects?.length > 0) {
    console.log('🚪 Object clicked:', event.objects[0].type);
    return;
  }

  // 4. Spaces (booths, rooms)
  if (event?.spaces?.length > 0) {
    showCardForSpace(event.spaces[0]);
    return;
  }

  // 5. Empty map - close card
  card.style.display = 'none';
});
```

**Location:** `index.html` lines 228-259

**Why Priority Matters:**
- Prevents conflicting handlers
- Most specific elements handled first
- Clicking marker won't also trigger space click
- Provides clean, predictable UX

---

### 4. Named Ranking for Markers

**What it does:** Uses official Mappedin rank names instead of numbers

**Before:**
```javascript
mapView.Markers.add(amenity, html, { rank: 3 });  // ❌ Numeric
```

**After:**
```javascript
mapView.Markers.add(amenity, html, { rank: 'low' });  // ✅ Named
```

**Location:** `index.html` line 143

**Benefits:**
- Follows official API
- More readable code
- Better collision handling
- Future-proof

---

## Event Object Reference

When any interaction happens, Mappedin provides a rich event object:

```javascript
{
  coordinate: {
    latitude: 43.1234,
    longitude: -79.5678,
    floor: FloorObject
  },
  spaces: [Space, Space],      // Clicked spaces
  objects: [MapObject],         // Clicked objects (doors, windows, etc.)
  labels: [Label],              // Clicked labels
  markers: [Marker],            // Clicked markers
  pointerEvent: MouseEvent      // Original DOM event
}
```

---

## Interactive Elements in POC

### Exhibitor Booths (High Priority)
- **Visual:** Gradient purple markers with icons
- **Hover:** Scale up (1.05x), status bar updates
- **Click:** Show exhibitor card with details
- **Rank:** `high` - Always visible
- **Interactive Mode:** `true` - Captures clicks

### Amenities (Low Priority)
- **Visual:** Simple emoji icons in white circles
- **Hover:** Not implemented (simple icons)
- **Click:** Not implemented (could add info)
- **Rank:** `low` - Hidden when overlapping
- **Interactive Mode:** Not set (could add)

### Spaces (Medium Priority)
- **Visual:** Light gray, purple on hover
- **Hover:** Color change + status bar update
- **Click:** Show exhibitor card if has externalId
- **Interactive State:** Enabled with `updateState()`

---

## User Experience Flow

### Scenario 1: Hover and Click Booth

1. User moves mouse over booth space
2. **→ Hover event fires**
3. Space turns purple (`hoverColor: '#667eea'`)
4. Status bar shows: "🎯 Hovering: Booth 2G19"
5. User clicks booth
6. **→ Click event fires**
7. Event priority: checks markers → labels → objects → **spaces ✓**
8. `showCardForSpace()` called
9. Exhibitor card appears with details
10. User can navigate or close

### Scenario 2: Click Marker Directly

1. User clicks gradient exhibitor marker
2. **→ Marker click event fires** (highest priority)
3. `e.stopPropagation()` prevents space click
4. `showCardForSpace(space, true)` called
5. Card appears with navigation enabled
6. No space click event fires (prevented)

### Scenario 3: Click Empty Map

1. User clicks empty area (no spaces/objects)
2. **→ Click event fires**
3. Event checks: no markers, no labels, no objects, no spaces
4. Falls through to default case
5. Exhibitor card closes
6. Map returns to default state

---

## Ranking Strategy

| Element | Rank | Reason | Visibility |
|---------|------|--------|------------|
| Emergency Exits | `always-visible` | Critical safety | Never hidden |
| Exhibitor Booths | `high` | Primary focus | Hidden only by always-visible |
| Connections (elevators) | `medium` | Important navigation | Hidden by high/always |
| Amenities (toilets) | `low` | Nice to have | Hidden by all higher ranks |

**Current POC:**
- Exhibitors: `high` ✅
- Amenities: `low` ✅

---

## Testing Interactivity

### Browser Console Commands

```javascript
// Test hover effect
const space = mapView.currentMap.spaces[0];
mapView.updateState(space, { interactive: true, hoverColor: 'red' });

// Check if space is interactive
console.log(mapView.getState(space));

// Log all events
mapView.on('click', e => console.log('CLICK:', e));
mapView.on('hover', e => console.log('HOVER:', e));

// Get all interactive spaces
const interactive = mapData.getByType('space').filter(s =>
  mapView.getState(s).interactive
);
```

---

## Performance Considerations

### Hover Events
- Fire on every mouse move
- Debounce if performance issues:
```javascript
let hoverTimeout;
mapView.on('hover', (event) => {
  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    updateHoverUI(event);
  }, 50); // 50ms debounce
});
```

### Click Events
- Fire once per click
- Use `e.stopPropagation()` to prevent bubbling
- Priority system prevents duplicate handlers

### Interactive State
- Setting `interactive: true` on 100s of spaces is fine
- Mappedin handles efficiently
- No performance impact observed

---

## Future Enhancements

### 1. Interactive Amenity Labels
```javascript
mapView.Labels.add(amenity, '🚻', {
  rank: 'low',
  interactive: true  // Enable clicking
});

// Handle amenity clicks
mapView.on('click', (event) => {
  if (event?.labels?.length > 0) {
    showAmenityInfo(event.labels[0]);
  }
});
```

### 2. Map Object Highlighting
```javascript
if (event?.objects?.length > 0) {
  const obj = event.objects[0];
  if (obj.type === 'door') {
    mapView.updateState(obj, {
      color: '#ff0000',  // Highlight exit doors
      interactive: true
    });
  }
}
```

### 3. Keyboard Navigation
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideExhibitorCard();
    mapView.Navigation.clear();
  }

  if (e.key === 'Tab') {
    // Cycle through exhibitors
    focusNextExhibitor();
  }
});
```

### 4. Touch Gestures (Mobile)
```javascript
let touchStartTime;

mapView.on('click', (event) => {
  const touchDuration = Date.now() - touchStartTime;

  if (touchDuration > 500) {
    // Long press - show context menu
    showContextMenu(event.coordinate);
  } else {
    // Quick tap - normal click
    handleNormalClick(event);
  }
});
```

---

## Documentation References

- **Labels vs Markers:** `docs/LABELS_VS_MARKERS.md`
- **Complete Interactivity Guide:** `docs/INTERACTIVITY_GUIDE.md`
- **Quick Summary:** `docs/LABELS_VS_MARKERS_SUMMARY.md`
- **Official Mappedin Docs:** https://developer.mappedin.com/web-sdk/interactivity

---

## Key Takeaways

✅ **Hover effects** provide immediate visual feedback
✅ **Event priority system** prevents conflicting handlers
✅ **Named ranks** (`'low'`, `'high'`) follow official API
✅ **Complete event coverage** handles all interactive elements
✅ **Proper event bubbling** with `stopPropagation()`
✅ **Rich event objects** provide context for all interactions

The POC now implements professional-grade interactivity following Mappedin best practices! 🎉
