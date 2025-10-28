# Mappedin Label System Guide

## Overview

This guide documents how we implement Mappedin Web SDK v6's label ranking and zoom-based visibility features for the conference map application.

**Important**: This guide uses official Mappedin terminology from their v6 SDK documentation.

## Mappedin Label Features

### 1. Label Ranking (Collision Detection)

Mappedin uses **Collision Ranking Tiers** (`TCollisionRankingTier`) to control which labels show when multiple labels overlap:

```typescript
rank: 'low' | 'medium' | 'high' | 'always-visible'
```

**How it works**: When labels occupy the same space, the label with the highest rank will be shown. Labels with lower ranks are automatically hidden to prevent clutter.

**Official definition**: "Fine-tune the visibility of colliders, enhancing map readability and user experience by prioritizing important information."

### 2. Zoom-Level Visibility Control

Labels can appear/disappear at specific zoom levels using `iconVisibleAtZoomLevel`:

```typescript
appearance: {
  iconVisibleAtZoomLevel: 18  // Zoom level where icon becomes visible
}
```

**How zoom levels work**:
- **-Infinity**: Always visible
- **0**: Visible at maximum zoom (fully zoomed in)
- **Specific number (18-22)**: Visible at that zoom level and closer
- **Infinity**: Never visible

**Zoom Level Scale** (Mappedin uses Mercator zoom):
- **Zoom 17-18**: Far out (venue overview)
- **Zoom 19-20**: Medium distance (area view)
- **Zoom 21-22**: Close up (booth level)
- **Zoom 22**: Maximum zoom in Mappedin v6

**Note**: `textVisibleAtZoomLevel` works the same way for label text visibility.

### 3. Visual Hierarchy

Our implementation combines THREE Mappedin features:

1. **Rank** (collision priority) - Which label wins when overlapping
2. **Text Size** (visual prominence) - How big the label appears
3. **Zoom Threshold** (progressive disclosure) - When labels appear

## Our Implementation

### Label Hierarchy

From `src/lib/components/MapLabels.svelte`:

```typescript
// HIGH RANK: Exhibitors (earliest visibility)
rank: 'high', textSize: 14px, zoom: 18+

// HIGH RANK: Food & Drink (early visibility for user needs)
rank: 'high', textSize: 11px, zoom: 19+

// MEDIUM RANK: General amenities
rank: 'medium', textSize: 11px, zoom: 20+

// LOW RANK: Restrooms (latest visibility)
rank: 'low', textSize: 9px, zoom: 22 (maximum zoom only)
```

### Code Example

```typescript
// Exhibitor labels
view.Labels.add(exhibitor, exhibitor.name, {
  interactive: false,
  rank: 'high',
  appearance: {
    textSize: 14,
    color: '#2d4a3e',
    textStrokeColor: 'rgba(255, 255, 255, 0.6)',
    textStrokeWidth: 1.5,
    textVisibleAtZoomLevel: 18  // Appear early
  }
});

// Food & Drink labels
view.Labels.add(space, amenityName, {
  interactive: false,
  rank: 'high',  // Same collision priority as exhibitors
  appearance: {
    textSize: 11,  // But smaller text
    color: '#333',
    icon: iconSVG,
    iconSize: 16,
    textVisibleAtZoomLevel: 19,  // Appear slightly later
    iconVisibleAtZoomLevel: 19
  }
});

// Restroom labels
view.Labels.add(space, amenityName, {
  interactive: false,
  rank: 'low',  // Lowest collision priority
  appearance: {
    textSize: 9,   // Smallest text
    color: '#3b82f6',  // Blue for distinction
    icon: iconSVG,
    iconSize: 12,  // Small icon
    textVisibleAtZoomLevel: 22,  // Maximum zoom only
    iconVisibleAtZoomLevel: 22
  }
});
```

## Common Pitfalls & Solutions

### Problem 1: Using Numeric Ranks

❌ **Wrong**:
```typescript
rank: 10  // Doesn't work!
```

✅ **Correct**:
```typescript
rank: 'high'  // Use Mappedin's named tiers
```

### Problem 2: Too Many 'always-visible' Labels

We initially set 297 exhibitors to `rank: 'always-visible'`, which caused:
- Visual clutter
- Disabled collision detection
- No progressive disclosure

✅ **Solution**: Use 'high' rank with appropriate zoom thresholds:
```typescript
rank: 'high',
appearance: {
  textVisibleAtZoomLevel: 18  // Progressive disclosure
}
```

### Problem 3: Zoom Levels Above Maximum

**Critical**: Mappedin v6 maximum zoom is **22**, not 24 or higher!

Setting `textVisibleAtZoomLevel: 24` causes fallback to always visible (opposite of intended behavior).

❌ **Wrong**:
```typescript
textVisibleAtZoomLevel: 24  // Out of range!
```

✅ **Correct**:
```typescript
textVisibleAtZoomLevel: 22  // Maximum zoom
```

### Problem 4: Restrooms Dominating Visually

Early implementations had restrooms appearing too early and too large, causing user complaints about clutter.

✅ **Solution**: Make them smallest and latest:
```typescript
rank: 'low',
appearance: {
  textSize: 9,   // 36% smaller than exhibitors
  iconSize: 12,  // Half size of other amenities
  color: '#3b82f6',  // Blue for distinction
  textVisibleAtZoomLevel: 22  // Maximum zoom only
}
```

## Best Practices

### 1. Use Size + Rank + Zoom Together

Create hierarchy by combining all three features:

```typescript
// Primary content (exhibitors)
rank: 'high' + textSize: 14 + zoom: 18

// Secondary content (food)
rank: 'high' + textSize: 11 + zoom: 19

// Tertiary content (amenities)
rank: 'medium' + textSize: 11 + zoom: 20

// Quaternary content (restrooms)
rank: 'low' + textSize: 9 + zoom: 22
```

### 2. Consider User Needs

Prioritize labels based on what users need to find:
1. **Exhibitors** - Primary reason for visiting
2. **Food & Drink** - Essential for long events
3. **Navigation** - Elevators, stairs for wayfinding
4. **Facilities** - Restrooms (needed but not primary)

### 3. Test at Different Zoom Levels

Always test your label hierarchy at zoom levels: 17, 19, 21, 22

```bash
# Run dev server
npm run dev

# Open http://localhost:5173 and test zooming
```

### 4. Use Color for Distinction

When labels overlap in priority, use color to distinguish types:
- **Black (#2d4a3e)**: Exhibitors
- **Grey (#4a5568)**: Special areas
- **Dark grey (#333)**: General amenities
- **Blue (#3b82f6)**: Restrooms

### 5. Add Text Strokes for Readability

Always add subtle text strokes for readability over varying backgrounds:

```typescript
appearance: {
  textStrokeColor: 'rgba(255, 255, 255, 0.6)',
  textStrokeWidth: 1.5
}
```

## Debugging Tips

### Check Label Count

Add logging to track how many labels are being added:

```typescript
console.log(`✅ Added ${successCount} object labels:`);
console.log(`   - ${exhibitorCount} exhibitors (high, zoom 18+)`);
console.log(`   - ${foodCount} food & drink (high, zoom 19+)`);
console.log(`   - ${amenityCount} amenities (medium, zoom 20+)`);
console.log(`   - ${restroomCount} restrooms (low, zoom 22)`);
```

### Visual Testing Checklist

- [ ] Exhibitors appear first (zoom 18)
- [ ] Food & drink appear with special areas (zoom 19)
- [ ] General amenities appear at medium zoom (zoom 20)
- [ ] Restrooms only appear at maximum zoom (zoom 22)
- [ ] No label overlap at exhibitor level
- [ ] Blue restrooms are visually distinct
- [ ] Text is readable over all backgrounds

## Performance Considerations

### Label Limits

Mappedin can handle thousands of labels, but consider:
- **CPU impact**: More labels = more collision detection
- **User experience**: Too many labels = visual clutter
- **Mobile performance**: Test on actual devices

### Optimization Strategies

1. **Progressive disclosure**: Only show labels at appropriate zoom
2. **Rank hierarchy**: Let Mappedin hide lower-rank labels when needed
3. **Icon size**: Smaller icons = less visual clutter
4. **Text size**: Reserve large text for most important labels

## Related Files

- `src/lib/components/MapLabels.svelte` - Label implementation
- `src/lib/utils/icons.ts` - Icon generation
- `src/lib/stores/map.ts` - Map state management

## Mappedin Official Resources

- [Labels Guide (v6)](https://developer.mappedin.com/v6/web-sdk-guides/labels/)
- [TCollisionRankingTier API](https://docs.mappedin.com/web/v6/latest/types/TCollisionRankingTier.html)
- [Camera API](https://developer.mappedin.com/v6/web-sdk-guides/camera/)

## What About "Dynamic Focus"?

**Dynamic Focus** is a different Mappedin feature for outdoor maps with multiple buildings. It automatically fades buildings in/out as the camera pans over them.

**We are NOT using Dynamic Focus** - we're using:
- **Label Ranking** (collision detection)
- **Zoom-Level Visibility** (progressive disclosure)
- **Camera Focus** (`Camera.focusOn()` for navigation)

## Changelog

### 2025-10-28
- Renamed from DYNAMIC_FOCUS_GUIDE.md to LABEL_SYSTEM_GUIDE.md
- Updated all terminology to match official Mappedin v6 documentation
- Clarified difference between our label system and Mappedin's Dynamic Focus feature
- Corrected maximum zoom from 24 to 22

### 2025-10-27
- Corrected restroom zoom threshold to 22 (maximum zoom in Mappedin v6)
- Changed food & drink from medium rank (zoom 20) to high rank (zoom 19)
- Updated label hierarchy comments
- Created original guide

### Previous Session
- Changed restroom color from black to blue (#3b82f6)
- Reduced restroom text size from 12px to 9px
- Reduced restroom icon size from 20px to 12px
- Increased restroom zoom threshold from 21 to 22
- Implemented amenity search functionality
- Enhanced UI components with shadcn/ui patterns

---

**Remember**: Use official Mappedin terminology: **Label Ranking** for collision detection, **Zoom-Level Visibility** for progressive disclosure, and **Camera Focus** for navigation.
