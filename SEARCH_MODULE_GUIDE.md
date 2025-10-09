# 🔍 Modular Search System - Implementation Guide

## Overview

The search functionality has been refactored into a **modular, reusable system** that can be used in both vanilla JavaScript (HTML) and React applications.

## Architecture

### Two-Class Design

#### 1. **MappedInSearch** (Core Logic)
Location: `/public/js/search-module.js`

Pure search logic, independent of UI:
- `getSuggestions(query)` - Get autocomplete suggestions from Mappedin API
- `searchBoothNumbers(query)` - Manual search by externalId (booth numbers)
- `buildSuggestionsHTML(suggestions)` - Build dropdown HTML
- `focusOnSuggestion(suggestion, mapView, callback)` - Focus camera and trigger callback
- `getIconForType(type)` - Map suggestion types to Lucide icons
- `getDisplayType(type)` - Get human-readable type names

#### 2. **SearchUIManager** (DOM Handling)
Location: `/public/js/search-module.js`

Manages UI interactions:
- Event listeners (input, keydown, click outside)
- Debounced search triggering
- Suggestions display/hide
- Selection handling
- Enter key support

## Usage in HTML Version

```javascript
// Initialize search system
let searchUI;

function setupSearch() {
  // Create search instance with options
  const searchInstance = new MappedInSearch(mapData, {
    debounceDelay: 200,        // Search delay in ms
    maxSuggestions: 6,         // Max results to show
    searchBoothNumbers: true   // Include booth number search
  });

  // Create UI manager
  searchUI = new SearchUIManager(searchInstance, mapView, {
    inputSelector: '#searchInput',
    suggestionsSelector: '#searchSuggestions',
    onSelect: (space) => {
      showCardForSpace(space, true);
    }
  });
}
```

## API Integration

### Mappedin Search API

The module uses **Mappedin's `suggest()` API** exclusively:

```javascript
const suggestions = await mapData.Search.suggest(query, {
  enterpriseLocations: { enabled: true },
  places: { enabled: true }
});
```

### Booth Number Search

Since `suggest()` doesn't search `externalId` fields, we manually filter:

```javascript
const spacesWithIds = mapData.getByType('space').filter(s =>
  s.externalId && s.externalId.toUpperCase().includes(queryUpper)
);

const boothSuggestions = spacesWithIds.map(space => ({
  name: `Booth ${space.externalId}`,
  value: space.externalId,
  type: 'booth',
  node: space
}));
```

Booth results are **prioritized** at the top of suggestions.

## Features

### ✅ Implemented Features

1. **Autocomplete Suggestions**
   - Debounced search (200ms)
   - Top 6 results
   - Enterprise locations and places

2. **Booth Number Search**
   - Searches by `externalId`
   - Shows as "Booth XXX"
   - Prioritized in results

3. **Visual Indicators**
   - Lucide icons for each type:
     - `hash` - Booth numbers
     - `store` - Exhibitors
     - `building-2` - Places
     - `tag` - Categories
   - Type labels (e.g., "Booth Number", "Exhibitor")

4. **Keyboard Support**
   - Enter key selects first suggestion
   - Click outside to close

5. **Camera Focus**
   - Auto-focuses on selected location
   - Triggers exhibitor card display

## Icon Mapping

```javascript
const iconMap = {
  'booth': 'hash',
  'enterpriseLocation': 'store',
  'location': 'store',
  'place': 'building-2',
  'category': 'tag'
};
```

## HTML Structure Required

```html
<!-- Search Input -->
<input type="text" id="searchInput" placeholder="Search...">

<!-- Suggestions Dropdown -->
<div id="searchSuggestions" style="display: none;">
  <!-- Populated by buildSuggestionsHTML() -->
</div>

<!-- Script Tag -->
<script src="/js/search-module.js"></script>
```

## CSS Classes

The module uses these CSS classes:

- `.search-suggestion` - Each suggestion item
- `.suggestion-name` - Suggestion title
- `.suggestion-type` - Suggestion type label

## Migration from Old Search

### ❌ Removed APIs
- `mapData.Search.query()` - Replaced with `suggest()`
- `showSearchSuggestions()` - Moved to `SearchUIManager`
- `selectSuggestion()` - Moved to `SearchUIManager`
- `performSearch()` - Removed entirely

### ✅ New APIs
- `MappedInSearch.getSuggestions()`
- `MappedInSearch.searchBoothNumbers()`
- `SearchUIManager.displaySuggestions()`
- `SearchUIManager.selectSuggestion()`

## Benefits

### 🎯 Modularity
- Separated search logic from UI
- Reusable across HTML and React
- Easy to test

### 📦 Maintainability
- Single source of truth
- Clear separation of concerns
- Well-documented

### 🚀 Performance
- Debounced search (200ms)
- Efficient booth number filtering
- Optimized suggestion limits

### 🔄 Reusability
- Export for React: `import { MappedInSearch, SearchUIManager } from './search-module'`
- Use in vanilla JS: `window.MappedInSearch`, `window.SearchUIManager`

## React Integration (Future)

The module is designed for easy React adaptation:

```typescript
import { MappedInSearch } from '../js/search-module';

const SearchBar: React.FC = () => {
  const [suggestions, setSuggestions] = useState([]);
  const searchInstance = new MappedInSearch(mapData, options);

  const handleInput = (query: string) => {
    searchInstance.debouncedSearch(query, setSuggestions);
  };

  return (
    <div>
      <input onChange={(e) => handleInput(e.target.value)} />
      {suggestions.map((s, i) => (
        <div key={i}>{s.name}</div>
      ))}
    </div>
  );
};
```

## Testing

### Automated Test Suite

The `testSearchQueries()` function tests common queries:

```javascript
const testQueries = [
  'booth', 'restroom', 'toilet', 'stairs',
  'space', 'room', 'hall', 'elevator'
];
```

Run it by loading the map - it executes automatically.

## Debugging

### Console Logs

- `✅ Modular search initialized` - Setup successful
- `❌ Search suggestions error:` - API errors
- `⚠️ Suggestion missing node:` - Invalid suggestion

### Common Issues

1. **No suggestions appearing**
   - Check debounce delay (200ms)
   - Minimum 2 characters required
   - Verify `mapData` is loaded

2. **Booth numbers not found**
   - Check `searchBoothNumbers: true` in options
   - Verify spaces have `externalId` property

3. **Icons not showing**
   - Ensure Lucide is loaded: `lucide.createIcons()`
   - Check icon names match Lucide library

## Files Modified

1. **Created**: `/public/js/search-module.js` (289 lines)
   - `MappedInSearch` class
   - `SearchUIManager` class
   - Module/window exports

2. **Modified**: `/index.html`
   - Added `<script src="/js/search-module.js">`
   - Replaced `setupSearch()` to use modular system
   - Removed old search functions
   - Updated `testSearchQueries()` to use `suggest()`

## Status

✅ **Complete and Production Ready**

- All old search code removed
- Modular system integrated
- Booth number search working
- Icons displaying correctly
- Keyboard support active
- Camera focus functional

---

**Last Updated**: October 9, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
