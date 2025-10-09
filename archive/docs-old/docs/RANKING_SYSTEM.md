# Mappedin Ranking System - Conference POC

## Overview

Mappedin uses a ranking system to control label and marker visibility when elements overlap. Higher-ranked items are shown, lower-ranked items are hidden.

---

## POC Ranking Strategy

| Element Type | Rank Value | Priority | Reason |
|--------------|------------|----------|--------|
| **Exhibitor Markers** | `10` | Highest | Primary focus - must always be visible |
| **Exhibitor Object Labels** | `10` | Highest | Same priority as markers |
| **Amenities (Toilets, etc.)** | `2` | Low | Nice to have, can hide when crowded |
| **Drop Pin** | `5` | Medium | User-placed, moderate priority |

---

## Implementation

### Exhibitor Booth Markers (Rank 10)

```javascript
// Gradient purple markers for exhibitor booths
const marker = mapView.Markers.add(space, markerHTML, {
  anchor: 'center',
  rank: 10,  // Highest priority - always visible
  interactive: true
});
```

**Location:** `index.html:182-186`

**Why Rank 10:**
- Exhibitors are the primary focus of the conference map
- Must be visible even when map is crowded
- Takes precedence over all other elements

---

### Exhibitor Object Labels (Rank 10)

```javascript
// Labels on 3D exhibitor objects (booths, displays)
mapView.Labels.add(obj, obj.name, {
  interactive: false,
  rank: 10,  // Same as markers - highest priority
  appearance: {
    textSize: 11,
    color: '#333'
  }
});
```

**Location:** `index.html:226-233`

**Why Rank 10:**
- 3D objects represent physical exhibitor booths
- Names should be as visible as markers
- Critical for wayfinding in 3D space

---

### Amenity Markers (Rank 2)

```javascript
// Toilets, elevators, exits, etc.
mapView.Markers.add(amenity, markerHTML, {
  anchor: 'center',
  rank: 2  // Low priority - can hide when crowded
});
```

**Location:** `index.html:143`

**Why Rank 2:**
- Amenities are supporting information
- Less critical than exhibitor booths
- Users can zoom in to see them if needed
- Prevents clutter on busy maps

---

## Ranking Behavior

### When Elements Overlap

1. **Exhibitor vs Amenity**
   - Exhibitor marker (rank 10) shown
   - Amenity icon (rank 2) hidden

2. **Multiple Exhibitors**
   - All exhibitors (rank 10) shown
   - May overlap - consider adjusting positions if needed

3. **User Drop Pin**
   - Drop pin (rank 5) shown over amenities
   - Hidden behind exhibitor markers

---

## Numeric vs Named Ranks

Mappedin supports both systems:

### Named Ranks (Not Used in POC)
```javascript
rank: 'low'            // Lowest priority
rank: 'medium'         // Medium priority
rank: 'high'           // High priority
rank: 'always-visible' // Always shown
```

### Numeric Ranks (Used in POC)
```javascript
rank: 1    // Very low
rank: 2    // Low (amenities)
rank: 5    // Medium (user pins)
rank: 10   // Highest (exhibitors)
rank: 100  // Maximum priority (not used)
```

**Why Numeric:**
- More precise control (can use 3, 4, 6, 7, etc.)
- Easier to insert new priority levels
- Clearer hierarchy (2 < 5 < 10)

---

## Best Practices

### 1. Use Gaps Between Ranks

Don't use consecutive numbers:
```javascript
// ❌ Bad - no room to add new priorities
rank: 1  // amenities
rank: 2  // objects
rank: 3  // markers

// ✅ Good - room for future additions
rank: 2  // amenities
rank: 5  // future use
rank: 10 // objects & markers
```

### 2. Group Similar Elements

```javascript
// All exhibitor-related = rank 10
exhibitorMarkers: rank: 10
exhibitorObjects: rank: 10
exhibitorLabels: rank: 10

// All amenities = rank 2
toilets: rank: 2
elevators: rank: 2
exits: rank: 2
```

### 3. Test at Different Zoom Levels

```javascript
// Zoom out - many elements visible
// - Exhibitors (rank 10) should remain
// - Amenities (rank 2) may disappear

// Zoom in - more space
// - All elements may be visible
// - Ranking less important
```

---

## Future Considerations

### Emergency Exits (Not Yet Implemented)

Could use high rank for safety:
```javascript
mapView.Markers.add(emergencyExit, html, {
  rank: 15  // Higher than exhibitors for safety
});
```

### Floor Selector Integration

Different ranks per floor:
```javascript
if (currentFloor === mainFloor) {
  rank: 10  // Show exhibitors on main floor
} else {
  rank: 5   // Lower priority on other floors
}
```

### Dynamic Ranking

Adjust based on context:
```javascript
const rank = userIsSearching ? 10 : 5;  // Boost search results
```

---

## Collision Management

### Current Strategy

- **Exhibitors (rank 10):** Always visible, may overlap each other
- **Amenities (rank 2):** Hidden when overlapping higher ranks
- **No clustering:** All markers shown individually

### If Markers Overlap

**Option 1: Marker Clustering**
```javascript
mapView.Markers.enableClustering({
  minRank: 2,
  maxRank: 9  // Don't cluster exhibitors (rank 10)
});
```

**Option 2: Offset Positions**
```javascript
const marker = mapView.Markers.add(space, html, {
  rank: 10,
  offset: { x: 10, y: 0 }  // Shift marker slightly
});
```

**Option 3: Zoom-Based Visibility**
```javascript
mapView.on('zoom-changed', (event) => {
  if (event.zoomLevel < 18) {
    // Hide lower-ranked items when zoomed out
    amenityMarkers.forEach(m => m.setVisible(false));
  }
});
```

---

## Testing Ranking

### Verify Correct Behavior

1. **Add many exhibitors and amenities in same area**
   - Exhibitors should always show
   - Amenities should hide when overlapping

2. **Zoom in/out**
   - Exhibitors remain visible at all zoom levels
   - Amenities appear when space allows

3. **Check console logs**
   ```javascript
   console.log('Exhibitor markers:', exhibitorMarkers.length, 'rank:', 10);
   console.log('Amenity markers:', amenities.length, 'rank:', 2);
   ```

---

## Summary

### POC Ranking Hierarchy

```
┌─────────────────────────────────────┐
│  Rank 10 (Highest Priority)         │
│  - Exhibitor Markers                │
│  - Exhibitor Object Labels          │
└─────────────────────────────────────┘
           ↑ Always visible

┌─────────────────────────────────────┐
│  Rank 5 (Medium Priority)           │
│  - User Drop Pins                   │
│  - Future use                       │
└─────────────────────────────────────┘
           ↑ Visible when space allows

┌─────────────────────────────────────┐
│  Rank 2 (Low Priority)              │
│  - Amenity Markers                  │
│  - Toilets, Elevators, Exits        │
└─────────────────────────────────────┘
           ↑ Hidden when overlapping
```

**Key Principle:** Exhibitors are always visible, amenities yield when crowded.

---

## Code Reference

| Element | File Location | Rank | Notes |
|---------|---------------|------|-------|
| Exhibitor Markers | `index.html:184` | `10` | Gradient purple markers |
| Object Labels | `index.html:228` | `10` | 3D object names |
| Amenity Markers | `index.html:143` | `2` | Toilet/elevator icons |
| Drop Pin | `index.html:534` | `5` | User-placed pins |

---

**Last Updated:** October 9, 2025
**POC Version:** 0.1.0
**Status:** ✅ Implemented
