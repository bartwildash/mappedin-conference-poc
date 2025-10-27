# Dynamic Focus Management Guide

## Understanding Mappedin's Label System

This guide documents our journey learning and optimizing Mappedin's dynamic focus and label ranking system for the conference map application.

## Core Concepts

### 1. Label Ranking System

Mappedin uses **named tiers** for label ranking, not numeric values:

```typescript
rank: 'high' | 'medium' | 'low' | 'always-visible'
```

**Important**: These are strings, not numbers! Early attempts to use numeric ranks (1-10) failed because Mappedin's collision detection doesn't recognize them.

### 2. Progressive Disclosure

Labels appear at different zoom levels based on importance. This prevents visual clutter and creates a progressive exploration experience:

```typescript
appearance: {
  textVisibleAtZoomLevel: 18,  // Zoom level (higher = more zoomed in)
  iconVisibleAtZoomLevel: 18
}
```

**Zoom Level Scale**:
- **Zoom 17-18**: Very far out (venue overview)
- **Zoom 19-20**: Medium distance (area view)
- **Zoom 21-22**: Close up (booth level)
- **Zoom 23-24**: Very close (detail view)

### 3. Visual Hierarchy

Label visibility is controlled by THREE factors working together:

1. **Rank** ('high', 'medium', 'low') - Determines collision priority
2. **Text Size** (9-14px) - Visual dominance
3. **Zoom Threshold** (18-24) - When labels appear

## Our Implementation

### Current Label Hierarchy

From `src/lib/components/MapLabels.svelte`:

```typescript
// Rank: high, Size: 14px, Zoom: 18+
Exhibitors (black text, LARGEST, earliest visibility)

// Rank: high, Size: 14px, Zoom: 19+
Special Areas (grey text, stages, lounges)

// Rank: high, Size: 11px + 16px icon, Zoom: 19+
Food & Drink (early visibility for user needs)

// Rank: medium, Size: 11px + 16px icon, Zoom: 20+
POIs, Elevators, Stairs, Prayer Rooms

// Rank: low, Size: 9px + 12px icon, Zoom: 24+
Restrooms (blue, SMALLEST, latest visibility)
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
  rank: 'high',  // Same rank as exhibitors
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
  rank: 'low',  // Lowest priority
  appearance: {
    textSize: 9,   // Smallest text
    color: '#3b82f6',  // Blue for distinction
    icon: iconSVG,
    iconSize: 12,  // Small icon
    textVisibleAtZoomLevel: 24,  // Very close zoom only
    iconVisibleAtZoomLevel: 24
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
rank: 'high'  // Use named tiers
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

### Problem 3: Restrooms Dominating Visually

Early implementations had restrooms appearing too early and too large:
- Text: 12px (same as general amenities)
- Icon: 20px (too large)
- Zoom: 21 (too early)
- Color: Black (no distinction)

✅ **Solution**: Make them smallest and latest:
```typescript
rank: 'low',
appearance: {
  textSize: 9,   // 36% smaller than exhibitors
  iconSize: 12,  // Half size of other amenities
  color: '#3b82f6',  // Blue for distinction
  textVisibleAtZoomLevel: 24  // Very close zoom only
}
```

### Problem 4: Important Amenities Appearing Too Late

Food & drink is critical for user experience but was appearing at same level as POIs.

✅ **Solution**: Elevate to 'high' rank with earlier zoom threshold:
```typescript
rank: 'high',  // Same as exhibitors
appearance: {
  textSize: 11,  // But smaller text
  textVisibleAtZoomLevel: 19  // Earlier than other amenities
}
```

## Best Practices

### 1. Use Size + Rank + Zoom Together

Create hierarchy by combining all three factors:

```typescript
// Primary content (exhibitors)
rank: 'high' + textSize: 14 + zoom: 18

// Secondary content (food)
rank: 'high' + textSize: 11 + zoom: 19

// Tertiary content (amenities)
rank: 'medium' + textSize: 11 + zoom: 20

// Quaternary content (restrooms)
rank: 'low' + textSize: 9 + zoom: 24
```

### 2. Consider User Needs

Prioritize labels based on what users need to find:
1. **Exhibitors** - Primary reason for visiting
2. **Food & Drink** - Essential for long events
3. **Navigation** - Elevators, stairs for wayfinding
4. **Facilities** - Restrooms (needed but not primary)

### 3. Test at Different Zoom Levels

Always test your label hierarchy at zoom levels: 17, 19, 21, 23

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
console.log(`   - ${restroomCount} restrooms (low, zoom 24+)`);
```

### Visual Testing Checklist

- [ ] Exhibitors appear first (zoom 18)
- [ ] Food & drink appear with special areas (zoom 19)
- [ ] General amenities appear at medium zoom (zoom 20)
- [ ] Restrooms only appear when very close (zoom 24)
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

## Resources

- [Mappedin Web SDK Documentation](https://developer.mappedin.com/)
- [Label API Reference](https://docs.mappedin.com/web-sdk/labels)
- [Dynamic Focus Best Practices](https://docs.mappedin.com/web-sdk/camera#camera-focus)

## Changelog

### 2025-10-27
- Increased restroom zoom threshold from 22 to 24 (very close zoom only)
- Changed food & drink from medium rank (zoom 20) to high rank (zoom 19)
- Updated label hierarchy comments
- Created this guide

### Previous Session
- Changed restroom color from black to blue (#3b82f6)
- Reduced restroom text size from 12px to 9px
- Reduced restroom icon size from 20px to 12px
- Increased restroom zoom threshold from 21 to 22
- Implemented amenity search functionality
- Enhanced UI components with shadcn/ui patterns

---

**Remember**: Dynamic focus is about creating a progressive exploration experience. Users should discover details as they zoom in, not be overwhelmed with everything at once.
