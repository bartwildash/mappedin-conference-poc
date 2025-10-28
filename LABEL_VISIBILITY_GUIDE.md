# Smart Label Visibility System

> **⚠️ DEPRECATED**: This guide describes an obsolete approach using manual `updateState()` calls and camera event listeners. The current implementation uses Mappedin's built-in `textVisibleAtZoomLevel` and `iconVisibleAtZoomLevel` properties for zoom-based visibility control. See `LABEL_SYSTEM_GUIDE.md` for the current implementation using official Mappedin terminology.

## Overview

Your map now implements **zoom-based progressive label disclosure** to prevent label clutter at low zoom levels. Labels appear progressively as users zoom in, showing the most important information first.

## How It Works

### Label Categories & Ranks

Labels are organized into 4 categories with different visibility thresholds:

| Category | Rank | Zoom Threshold | Always Visible | Examples |
|----------|------|----------------|----------------|----------|
| **Exhibitors** | `always-visible` | 0 (always) | ✅ Yes | "101 - Acme Corp" |
| **Main Areas** | `high` | ≥ 18 | ❌ No | "Main Hall", "Entrance", "Lobby" |
| **Amenities** | `medium` | ≥ 20 | ❌ No | "Restroom", "Elevator" |
| **Booths** | `low` | ≥ 22 | ❌ No | Individual booth labels |

### Zoom Behavior

```
Zoom < 18:  Only exhibitor labels visible
Zoom ≥ 18:  + Main area labels appear
Zoom ≥ 20:  + Amenity labels appear
Zoom ≥ 22:  + All booth labels appear
```

## Implementation Details

### Label Categorization (index.html:265-303)

Labels are automatically categorized based on:

**Main Areas** (rank: `high`):
- Keywords: 'hall', 'entrance', 'lobby', 'atrium', 'plaza', 'pavilion', 'gallery'
- Text size: 14px (larger)
- Color: #000 (darker)

**Amenities** (rank: `medium`):
- Keywords: 'restroom', 'toilet', 'bathroom', 'elevator', 'escalator', 'stairs'
- Text size: 12px
- Color: #333

**Booths** (rank: `low`):
- Pattern: Numeric `externalId` (e.g., "101", "205")
- Text size: 12px
- Color: #333

**Exhibitors** (rank: `always-visible`):
- Format: "BOOTH# - Company Name" (e.g., "101 - Acme Corp")
- Text size: 11px
- Color: #667eea (brand purple)

### Dynamic Visibility Updates (index.html:194-215)

The `updateLabelVisibility()` function controls label visibility:

```javascript
function updateLabelVisibility(zoomLevel) {
  // Main areas: visible at zoom >= 18
  labelCategories.mainAreas.forEach(label => {
    mapView.updateState(label, { enabled: zoomLevel >= 18 });
  });

  // Amenities: visible at zoom >= 20
  labelCategories.amenities.forEach(label => {
    mapView.updateState(label, { enabled: zoomLevel >= 20 });
  });

  // Booths: visible at zoom >= 22
  labelCategories.booths.forEach(label => {
    mapView.updateState(label, { enabled: zoomLevel >= 22 });
  });

  // Exhibitors: always visible (no update needed)
}
```

### Camera Event Listener (index.html:217-229)

Monitors camera zoom and updates labels when zoom changes significantly:

```javascript
mapView.on('camera-change', (event) => {
  const newZoom = event.transform.zoomLevel;

  // Update only if zoom changed by > 0.5
  if (Math.abs(newZoom - currentZoom) > 0.5) {
    updateLabelVisibility(newZoom);
  }
});
```

**Why 0.5 threshold?**
- Prevents excessive updates during smooth zoom animations
- Reduces performance overhead
- Still responsive to user zoom changes

## Rank System

### What is `rank`?

From Mappedin docs:
> "Ranking controls label display when multiple labels occupy the same space. The label with the highest rank will be shown."

### Rank Values

- `'always-visible'`: Always displayed (exhibitors)
- `'high'`: Priority display (main areas)
- `'medium'`: Secondary display (amenities)
- `'low'`: Tertiary display (booths)

### Rank Behavior

When labels overlap at the same position, the higher-ranked label is shown:

```
always-visible > high > medium > low
```

**Example:**
If an exhibitor label and a booth label overlap:
- ✅ Exhibitor label shown (rank: always-visible)
- ❌ Booth label hidden (rank: low)

## Customization

### Adjust Zoom Thresholds

Edit `ZOOM_THRESHOLDS` in index.html:35-50:

```javascript
const ZOOM_THRESHOLDS = {
  EXHIBITORS: 0,     // Always visible
  MAIN_AREAS: 18,    // Change to 16 for earlier visibility
  AMENITIES: 20,     // Change to 19 for earlier visibility
  BOOTHS: 22         // Change to 24 for later visibility
};
```

### Add New Categories

1. **Add to labelCategories** (index.html:36-41):
```javascript
let labelCategories = {
  exhibitors: [],
  mainAreas: [],
  amenities: [],
  booths: [],
  vipAreas: []  // ← New category
};
```

2. **Add threshold**:
```javascript
const ZOOM_THRESHOLDS = {
  EXHIBITORS: 0,
  MAIN_AREAS: 18,
  AMENITIES: 20,
  VIP_AREAS: 21,  // ← New threshold
  BOOTHS: 22
};
```

3. **Add to categorization logic** (index.html:277-287):
```javascript
if (vipKeywords.some(keyword => nameLower.includes(keyword))) {
  category = 'vipAreas';
  rank = 'high';
}
```

4. **Add to updateLabelVisibility** (index.html:194-215):
```javascript
labelCategories.vipAreas.forEach(label => {
  mapView.updateState(label, { enabled: zoomLevel >= ZOOM_THRESHOLDS.VIP_AREAS });
});
```

### Change Label Appearance

Modify the label appearance in setupLabels (index.html:290-298):

```javascript
const label = mapView.Labels.add(space, space.name, {
  interactive: false,
  rank: rank,
  enabled: enabled,
  appearance: {
    textSize: 14,           // Change size
    color: '#FF0000',       // Change color
    backgroundColor: '#FFF', // Add background
    marker: true            // Add marker icon
  }
});
```

## Performance Considerations

### Update Throttling

The camera listener only updates when zoom changes by > 0.5:

```javascript
if (Math.abs(newZoom - currentZoom) > 0.5) {
  updateLabelVisibility(newZoom);
}
```

**Benefits:**
- ✅ Reduces function calls during smooth zoom
- ✅ Lower CPU usage
- ✅ Better performance on mobile

### Label States

Labels use Mappedin's `enabled` state:
- `enabled: true` → Label in memory and visible
- `enabled: false` → Label in memory but hidden

**Why not remove labels?**
- Faster to toggle visibility than recreate
- Maintains label references
- Better for dynamic visibility

## DynamicFocus Alternative

**Note:** Mappedin SDK v6 removed `MapView.DynamicFocus` as a built-in feature. It's now available as a separate package `@mappedin/dynamic-focus`.

**Our implementation achieves similar results:**
- ✅ Progressive disclosure of labels
- ✅ Zoom-based visibility control
- ✅ Rank-based priority
- ✅ No additional packages needed

## Debugging

### Check Current Zoom

```javascript
console.log('Current zoom:', currentZoom);
```

### Check Label States

```javascript
console.log('Main areas:', labelCategories.mainAreas.length);
console.log('Amenities:', labelCategories.amenities.length);
console.log('Booths:', labelCategories.booths.length);
console.log('Exhibitors:', labelCategories.exhibitors.length);
```

### Monitor Visibility Changes

The console logs zoom and visibility info:
```
🔍 Zoom: 19.2 | Labels visible: Exhibitors (45), Main Areas (12), Amenities (0), Booths (0)
```

## Comparison: Before vs After

### Before
```javascript
// All labels always visible
allLabels = spaces.map(space => mapView.Labels.add(space, space.name, {
  interactive: false,
  appearance: { textSize: 12 }
}));
// Result: 200+ labels visible at once → cluttered
```

### After
```javascript
// Smart categorization with zoom-based visibility
- Exhibitors: Always visible (45 labels)
- Main Areas: Visible at zoom >= 18 (12 labels)
- Amenities: Visible at zoom >= 20 (8 labels)
- Booths: Visible at zoom >= 22 (150 labels)
// Result: Progressive disclosure → clean UX
```

## Benefits

✅ **Better UX**
- Reduced visual clutter at low zoom
- Progressive information disclosure
- Focus on important labels first

✅ **Better Performance**
- Hidden labels don't render
- Throttled updates reduce CPU usage
- Efficient state management

✅ **Better Scalability**
- Works with hundreds of labels
- Maintains performance on mobile
- Easy to add new categories

## Next Steps

### Optional Enhancements

1. **User Toggle Controls**
   ```javascript
   // Allow users to override visibility
   toggleLabels(category, visible) {
     labelCategories[category].forEach(label => {
       mapView.updateState(label, { enabled: visible });
     });
   }
   ```

2. **Floor-Specific Labels**
   ```javascript
   // Show/hide labels by floor
   mapView.on('floor-change', (event) => {
     updateLabelsByFloor(event.floor);
   });
   ```

3. **Custom Zoom Presets**
   ```javascript
   const ZOOM_PRESETS = {
     overview: 16,   // Show only exhibitors
     normal: 20,     // Show exhibitors + main areas
     detailed: 24    // Show everything
   };
   ```

## Reference

- **Mappedin Labels Docs**: https://developer.mappedin.com/web-sdk/labels
- **Label Rank System**: https://docs.mappedin.com/web/v6/latest/interfaces/TLabelOptions.html
- **Camera Events**: https://docs.mappedin.com/web/v6/latest/classes/Camera.html

---

Your label system now provides a clean, scalable, and performant way to display information progressively as users explore the map! 🎉
