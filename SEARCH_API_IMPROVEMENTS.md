# Search API Improvements - Migration Guide

## Overview

Your search implementation has been updated to follow **Mappedin Web SDK v6 best practices** based on the official documentation at https://docs.mappedin.com/web/v6/latest/classes/Search.html

## What Changed

### ✅ Before (Old Implementation)

```javascript
// Used suggest() API but expected .node property (which doesn't exist)
async getSuggestions(query) {
  let suggestions = await this.mapData.Search.suggest(query, {
    enterpriseLocations: { enabled: true },
    places: { enabled: true }
  });

  // ❌ Problem: suggestions don't have .node property
  // This would fail in focusOnSuggestion()
}
```

### ✅ After (New Implementation)

```javascript
// Uses query() API to get full objects with nodes
async getSuggestions(query) {
  const results = await this.mapData.Search.query(query, {
    enterpriseLocations: {
      fields: { name: true, tags: true, description: true },
      limit: 3
    },
    places: {
      fields: { name: true, description: true },
      limit: 3
    }
  });

  // ✅ Now has .node property from result.item
  return results.enterpriseLocations.map(result => ({
    name: result.item.name,
    node: result.item,  // Full map object!
    score: result.score
  }));
}
```

## Key Improvements

### 1. **Correct API Usage**

| Method | Purpose | Returns | Use Case |
|--------|---------|---------|----------|
| `Search.query()` | Full search with objects | `SearchResult` with `.item` property | **Recommended** - When you need the actual map object |
| `Search.suggest()` | Fast text suggestions | `Suggestion[]` with `.suggestion` text | Autocomplete dropdowns (text only) |

### 2. **New Methods Added**

#### `getSuggestions(query)` - Full Search (Default)
```javascript
const results = await search.getSuggestions('Coffee');
// Returns objects with .node property ready to use
results[0].node  // ✅ Full map object
```

#### `getFastSuggestions(query)` - Fast Autocomplete
```javascript
const suggestions = await search.getFastSuggestions('Cof');
// Returns text-only suggestions (fast)
suggestions[0].name  // "Coffee Shop"
```

#### `resolveSuggestion(text)` - Lazy Load Object
```javascript
// User selects suggestion
const node = await search.resolveSuggestion(suggestions[0].value);
// Now you have the full object
```

### 3. **Enhanced Booth Number Search**

```javascript
// Old: Basic booth search
searchBoothNumbers(query) {
  return locations.map(loc => ({
    name: loc.details.externalId,
    node: loc
  }));
}

// New: Score-based booth search with exact match prioritization
searchBoothNumbers(query) {
  // Searches both 'space' and 'location' types
  // Prioritizes exact matches (score: 1000)
  // Includes partial matches (score: 500)
  // Sorts by score automatically
}
```

### 4. **Better Node Type Handling**

```javascript
focusOnSuggestion(suggestion, mapView) {
  const node = suggestion.node;

  // Handles different types correctly
  if (node.__type === 'enterprise-location') {
    // Enterprise locations need polygon focusing
    mapView.Camera.focusOn(node.polygons[0]);
  } else {
    // Spaces, POIs, etc. focus directly
    mapView.Camera.focusOn(node);
  }
}
```

## Migration Steps

### Step 1: Enable Search at Initialization

```javascript
// In your index.html or main.js
const mapData = await getMapData({
  search: { enabled: true }  // ✅ Enable search upfront
});
```

### Step 2: No Code Changes Required!

Your existing code will work automatically because:
- `getSuggestions()` now returns proper objects with `.node`
- `focusOnSuggestion()` handles different node types
- Booth number search includes better scoring

### Step 3 (Optional): Use Fast Suggestions for Better Performance

```javascript
// For autocomplete dropdown (text-only, very fast)
handleInput(query) {
  search.debouncedSearch(query, async (textSuggestions) => {
    displaySuggestions(textSuggestions);
  });
}

// When user clicks a suggestion
async selectSuggestion(suggestionText) {
  const node = await search.resolveSuggestion(suggestionText);
  if (node) {
    mapView.Camera.focusOn(node);
  }
}
```

## Search Result Format

### query() Returns:
```javascript
{
  enterpriseLocations: [
    {
      type: 'enterprise-location',
      item: EnterpriseLocation,  // ✅ Full object
      score: 0.95,
      match: { name: ['Coffee'] }
    }
  ],
  places: [
    {
      type: 'space',
      item: Space,  // ✅ Full object
      score: 0.87,
      match: { name: ['Coffee'] }
    }
  ]
}
```

### suggest() Returns:
```javascript
[
  {
    suggestion: "Coffee Shop",  // ❌ Text only, no .node
    score: 0.95
  }
]
```

## Performance Considerations

### Query vs Suggest Performance

| Method | Speed | Data Size | Best For |
|--------|-------|-----------|----------|
| `query()` | Slower | Full objects | Main search, immediate results |
| `suggest()` | Faster | Text only | Autocomplete dropdowns |

### Recommended Pattern

```javascript
// Fast autocomplete
const suggestions = await search.getFastSuggestions('Cof');
// Show in dropdown immediately

// Lazy load when user selects
const node = await search.resolveSuggestion(selectedText);
```

## Testing Your Changes

### 1. Test Basic Search
```javascript
const results = await search.getSuggestions('Coffee');
console.log(results[0].node);  // Should show full object
```

### 2. Test Booth Numbers
```javascript
const results = await search.getSuggestions('101');
console.log(results[0].type);  // Should be 'booth'
console.log(results[0].score); // Should be 1000 for exact match
```

### 3. Test Camera Focus
```javascript
const results = await search.getSuggestions('Coffee');
search.focusOnSuggestion(results[0], mapView);  // Should focus camera
```

## Compatibility

- ✅ **Mappedin Web SDK**: v6.0.0+
- ✅ **Browser Support**: All modern browsers
- ✅ **Backwards Compatible**: Existing code continues to work

## Reference Links

- [Search Class API](https://docs.mappedin.com/web/v6/latest/classes/Search.html)
- [MapData Class](https://docs.mappedin.com/web/v6/latest/classes/MapData.html)
- [Search Guide](https://developer.mappedin.com/web-sdk/enterprise-data#enterprise-search)

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| **API Used** | `suggest()` (incorrect) | `query()` (correct) |
| **Node Property** | ❌ Missing | ✅ Present |
| **Booth Search** | Basic | Score-based, exact match priority |
| **Type Handling** | Limited | Enterprise locations supported |
| **Documentation** | Minimal | Comprehensive JSDoc |

Your search is now fully compliant with Mappedin Web SDK v6 best practices! 🎉
