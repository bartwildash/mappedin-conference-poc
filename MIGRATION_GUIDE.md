# Migration Guide - v1.0.0 to v1.1.0

## Overview

This guide covers the migration from the basic implementation to the enhanced version with:
- ✅ **Smart Search** using standard Mappedin Web SDK v6 APIs
- ✅ **Zoom-based Label Visibility** for progressive disclosure
- ✅ **No Breaking Changes** - Existing functionality preserved

## What Changed

### 1. Search API Improvements

**Before (v1.0.0):**
```javascript
// Used suggest() incorrectly
const suggestions = await mapData.Search.suggest(query);
// ❌ suggestions didn't have .node property
```

**After (v1.1.0):**
```javascript
// Uses query() for full objects
const results = await mapData.Search.query(query, {
  enterpriseLocations: { fields: { name: true, tags: true }, limit: 3 },
  places: { fields: { name: true }, limit: 3 }
});
// ✅ results have .item property with full map object
```

### 2. Label Visibility System

**Before (v1.0.0):**
```javascript
// All labels always visible
allLabels = spaces.map(space => mapView.Labels.add(space, space.name, {
  interactive: false,
  appearance: { textSize: 12 }
}));
```

**After (v1.1.0):**
```javascript
// Smart categorization with zoom-based visibility
- Exhibitors: Always visible (rank: 'always-visible')
- Main Areas: Visible at zoom >= 18 (rank: 'high')
- Amenities: Visible at zoom >= 20 (rank: 'medium')
- Booths: Visible at zoom >= 22 (rank: 'low')
```

## Migration Steps

### Step 1: No Code Changes Required! ✅

All changes are **backwards compatible**. Your existing code will work without modifications.

### Step 2: Update Dependencies (Optional)

The project already uses `@mappedin/mappedin-js@^6.0.0`, so no package updates needed.

### Step 3: Deploy New Build

```bash
# 1. Build the updated version
npm run build

# 2. Test locally (optional)
npm run preview

# 3. Commit and push to GitHub
git add .
git commit -m "feat: Add smart search and zoom-based label visibility"
git push origin main
```

GitHub Actions will automatically deploy to GitHub Pages.

### Step 4: Verify Deployment

Visit your GitHub Pages URL and test:

1. **Search Functionality**
   - Search for exhibitor names
   - Search for booth numbers
   - Verify camera focuses correctly

2. **Label Visibility**
   - Zoom out: Only exhibitor labels visible
   - Zoom to 19: Main area labels appear
   - Zoom to 21: Amenity labels appear
   - Zoom to 23: All booth labels appear

## Breaking Changes

### None! 🎉

All changes are **non-breaking** and **backwards compatible**:

- ✅ Existing search continues to work
- ✅ Existing label system enhanced (not replaced)
- ✅ All previous features intact
- ✅ Same API surface

## New Features Available

### 1. Enhanced Search Methods

**`getSuggestions(query)`** - Full search with map objects (default):
```javascript
const search = new MappedInSearch(mapData);
const results = await search.getSuggestions('Coffee');
// results[0].node is the full map object
```

**`getFastSuggestions(query)`** - Fast text-only autocomplete:
```javascript
const suggestions = await search.getFastSuggestions('Cof');
// Returns text suggestions quickly
```

**`resolveSuggestion(text)`** - Lazy load full object:
```javascript
const node = await search.resolveSuggestion(suggestions[0].value);
// Resolves text to map object
```

### 2. Zoom-Based Label Control

**Automatic (default):**
Labels appear/disappear based on zoom level automatically.

**Manual Control (optional):**
```javascript
// Force show all labels
labelCategories.booths.forEach(label => {
  mapView.updateState(label, { enabled: true });
});

// Force hide amenity labels
labelCategories.amenities.forEach(label => {
  mapView.updateState(label, { enabled: false });
});
```

### 3. Label Rank System

Labels now have priority ranks:
- `'always-visible'`: Exhibitors (highest priority)
- `'high'`: Main areas
- `'medium'`: Amenities
- `'low'`: Booths (lowest priority)

When labels overlap, higher-ranked labels are shown.

## Configuration

### Customize Zoom Thresholds

Edit `index.html` (lines 44-49):

```javascript
const ZOOM_THRESHOLDS = {
  EXHIBITORS: 0,     // Always visible
  MAIN_AREAS: 18,    // Adjust to 16 for earlier visibility
  AMENITIES: 20,     // Adjust to 19 for earlier visibility
  BOOTHS: 22         // Adjust to 24 for later visibility
};
```

### Customize Search Options

Edit `public/js/search-module.js` (lines 29-45):

```javascript
const results = await this.mapData.Search.query(query, {
  enterpriseLocations: {
    fields: {
      name: true,
      tags: true,        // Enable tag search
      description: true  // Enable description search
    },
    limit: 5             // Increase result limit
  }
});
```

## Testing Checklist

After migration, verify:

- [ ] Map loads correctly
- [ ] Floor selector works
- [ ] Search returns results
- [ ] Search focuses camera on selection
- [ ] Labels appear at correct zoom levels
- [ ] Exhibitor labels always visible
- [ ] Booth number search works
- [ ] Navigation panel works
- [ ] Accessible routing works
- [ ] Mobile/tablet responsive

## Rollback (If Needed)

If you need to rollback to v1.0.0:

```bash
# Revert to previous commit
git log --oneline  # Find the commit hash before migration
git revert <commit-hash>
git push origin main
```

Or restore specific files:

```bash
# Restore old files
git checkout <previous-commit-hash> index.html
git checkout <previous-commit-hash> public/js/search-module.js
npm run build
git commit -m "Rollback to v1.0.0"
git push origin main
```

## Performance Notes

### Before Migration
- All 200+ labels rendered at all zoom levels
- Search used incorrect API (suggest instead of query)
- No progressive disclosure

### After Migration
- Labels rendered progressively (45 → 57 → 65 → 215 as you zoom in)
- Search uses correct API with proper objects
- Better performance on mobile
- Reduced visual clutter

## Support Documentation

- **Search Improvements**: `SEARCH_API_IMPROVEMENTS.md`
- **Label Visibility**: `LABEL_VISIBILITY_GUIDE.md`
- **Quick Reference**: `ZOOM_LABEL_SUMMARY.md`

## Questions?

**Q: Will my existing code break?**
A: No, all changes are backwards compatible.

**Q: Do I need to update my Mappedin API keys?**
A: No, same API keys work.

**Q: Can I disable the new features?**
A: Yes, you can modify the zoom thresholds to show all labels:

```javascript
const ZOOM_THRESHOLDS = {
  EXHIBITORS: 0,
  MAIN_AREAS: 0,    // Always show
  AMENITIES: 0,     // Always show
  BOOTHS: 0         // Always show
};
```

**Q: How do I deploy to GitHub Pages?**
A: Just commit and push to `main` branch. GitHub Actions handles the rest.

---

**Migration Status:** ✅ Ready for deployment
**Risk Level:** 🟢 Low (no breaking changes)
**Estimated Migration Time:** < 5 minutes
