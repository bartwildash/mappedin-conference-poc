# Mappedin Search Implementation Guide

> **Official Reference:** [Mappedin Search Documentation](https://developer.mappedin.com/ios-sdk/search/)

## Overview

Mappedin SDK provides built-in search functionality that works **offline** by indexing location names, descriptions, and tags locally.

---

## Search Methods

### 1. **`mapData.Search.query()`** - Full Search

Searches for locations and categories based on query string.

```javascript
const results = await mapData.Search.query('Coffee Shop');

// Results structure:
// {
//   locations: [MPISearchResultLocation],
//   categories: [MPISearchResultCategory]
// }
```

### 2. **`mapData.Search.suggest()`** - Autocomplete

Generates search suggestions for autocomplete functionality.

```javascript
const suggestions = await mapData.Search.suggest('Cof');

// Returns: ['Coffee Shop', 'Coffee Bar', 'Cafe']
```

---

## Conference POC Implementation

### Current Approach (Custom Search)

Our POC uses **custom JavaScript filtering** for exhibitor data:

```javascript
// index.html:606-650
function performSearch(query) {
  const searchTerm = query.toLowerCase();

  // Search spaces by booth number & name
  const spaceMatches = exhibitorMarkers.filter(({ space }) =>
    space.externalId?.toLowerCase().includes(searchTerm) ||
    space.name?.toLowerCase().includes(searchTerm)
  );

  // Search exhibitor data by company name & description
  const exhibitorMatches = Object.entries(exhibitorData)
    .filter(([stallNo, exhibitors]) =>
      stallNo.toLowerCase().includes(searchTerm) ||
      exhibitors.some(ex =>
        ex.name.toLowerCase().includes(searchTerm) ||
        ex.description?.toLowerCase().includes(searchTerm)
      )
    );

  // Show first result
  if (results.length > 0) {
    showCardForSpace(results[0].space, true);
    mapView.Camera.focusOn(results[0].space);
  }
}
```

**Why Custom Search:**
- Searches external exhibitor data (not in Mappedin map)
- Matches booth numbers to `space.externalId`
- Supports co-exhibitor searching
- Works with our mock data structure

---

## Enhanced: Combining Both Approaches

### Recommended Implementation

Use **Mappedin Search API** for venue locations + **Custom search** for exhibitor data:

```javascript
async function enhancedSearch(query) {
  const results = {
    exhibitors: [],
    venues: []
  };

  // 1. Search Mappedin locations (if Search API is enabled)
  if (mapData.Search) {
    try {
      const mappedResults = await mapData.Search.query(query);

      // Filter for tenant/exhibitor types
      results.venues = mappedResults.locations
        .filter(loc => loc.type === 'tenant' || loc.type === 'exhibitor')
        .sort((a, b) => b.score - a.score);  // Highest score first
    } catch (error) {
      console.warn('Mappedin search not available:', error);
    }
  }

  // 2. Search our custom exhibitor data
  results.exhibitors = Object.entries(exhibitorData)
    .filter(([stallNo, exhibitors]) =>
      stallNo.toLowerCase().includes(query.toLowerCase()) ||
      exhibitors.some(ex =>
        ex.name.toLowerCase().includes(query.toLowerCase()) ||
        ex.description?.toLowerCase().includes(query.toLowerCase())
      )
    )
    .map(([stallNo, exhibitors]) => ({
      stallNo,
      exhibitors,
      score: calculateRelevanceScore(stallNo, exhibitors, query)
    }))
    .sort((a, b) => b.score - a.score);

  return results;
}

// Calculate relevance score (0-100)
function calculateRelevanceScore(stallNo, exhibitors, query) {
  let score = 0;
  const lowerQuery = query.toLowerCase();

  // Exact booth match = highest score
  if (stallNo.toLowerCase() === lowerQuery) score += 100;
  else if (stallNo.toLowerCase().includes(lowerQuery)) score += 50;

  // Company name match
  exhibitors.forEach(ex => {
    if (ex.name.toLowerCase() === lowerQuery) score += 90;
    else if (ex.name.toLowerCase().includes(lowerQuery)) score += 40;

    // Description match (lower priority)
    if (ex.description?.toLowerCase().includes(lowerQuery)) score += 10;
  });

  return score;
}
```

---

## Search Suggestions (Autocomplete)

### Implementation with Mappedin API

```javascript
async function setupSearchSuggestions() {
  const searchInput = document.getElementById('searchInput');
  const suggestionsDiv = document.getElementById('searchSuggestions');

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      suggestionsDiv.style.display = 'none';
      return;
    }

    // Get Mappedin suggestions
    let suggestions = [];
    if (mapData.Search) {
      try {
        const mappedSuggestions = await mapData.Search.suggest(query);
        suggestions = mappedSuggestions.map(s => s.suggestion);
      } catch (error) {
        console.warn('Search suggestions not available');
      }
    }

    // Add custom exhibitor suggestions
    const exhibitorSuggestions = Object.values(exhibitorData)
      .flat()
      .filter(ex => ex.name.toLowerCase().includes(query.toLowerCase()))
      .map(ex => ex.name)
      .slice(0, 5);

    suggestions = [...new Set([...suggestions, ...exhibitorSuggestions])];

    // Display suggestions
    displaySuggestions(suggestions);
  });
}

function displaySuggestions(suggestions) {
  const suggestionsDiv = document.getElementById('searchSuggestions');

  suggestionsDiv.innerHTML = suggestions.map(s => `
    <div class="suggestion-item" onclick="selectSuggestion('${s}')">
      ${s}
    </div>
  `).join('');

  suggestionsDiv.style.display = 'block';
}
```

---

## Understanding Search Results

### Mappedin Search Result Structure

```javascript
{
  locations: [
    {
      id: "location-123",
      name: "Coffee Shop",
      description: "Artisan coffee and pastries",
      type: "tenant",
      score: 95.5,  // Higher = better match
      matchedTerms: ["coffee", "shop"]
    }
  ],
  categories: [
    {
      id: "cat-food",
      name: "Food & Beverage",
      score: 75.2
    }
  ]
}
```

### Sort by Score (Best Practices)

```javascript
// Mappedin recommendation: Sort by score descending
const sortedResults = results.locations
  .sort((a, b) => b.score - a.score)  // Highest score first
  .slice(0, 10);  // Limit to top 10
```

---

## Conference POC: Search Features

### Current Implementation ✅

1. **Custom Exhibitor Search**
   - Searches by booth number (e.g., "3J84")
   - Searches by company name (e.g., "ASC")
   - Searches by description keywords (e.g., "submarine")
   - Debounced 300ms
   - Auto-focuses on first result

2. **Mappedin Search API**
   - **Enabled:** `search: { enabled: true }` in `getMapData()`
   - **Ready to use:** Can call `mapData.Search.query()` and `mapData.Search.suggest()`
   - **Current status:** Foundation in place, using custom search for exhibitor data

### Future Enhancements 🚀

1. **Combine Both Searches**
   - Use Mappedin Search for venue locations (restrooms, exits, etc.)
   - Use custom search for exhibitor data
   - Merge and sort by relevance score

2. **Add Autocomplete**
   - Show suggestions as user types
   - Use `mapData.Search.suggest()` for venue locations
   - Add exhibitor names from custom data

3. **Search Filters**
   - Filter by exhibitor category
   - Filter by country
   - Filter by floor/area

---

## Code Examples

### Example 1: Basic Mappedin Search

```javascript
// Enable search in getMapData
const mapData = await getMapData({
  mapId: 'your-map-id',
  key: 'your-key',
  secret: 'your-secret',
  search: { enabled: true }  // Important!
});

// Perform search
const results = await mapData.Search.query('Restroom');

// Filter for specific type
const restrooms = results.locations
  .filter(loc => loc.type === 'amenity')
  .sort((a, b) => b.score - a.score);

// Focus on best match
if (restrooms.length > 0) {
  mapView.Camera.focusOn(restrooms[0]);
}
```

### Example 2: Search with Suggestions

```javascript
// Get suggestions
const suggestions = await mapData.Search.suggest('Rest');
// Returns: ['Restroom', 'Restaurant', 'Rest Area']

// User selects suggestion
const query = suggestions[0]; // 'Restroom'
const results = await mapData.Search.query(query);
```

### Example 3: Filter by Type (Exhibitors Only)

```javascript
const results = await mapData.Search.query('Tech');

// Filter for tenant/exhibitor types only
const exhibitors = results.locations
  .filter(loc => loc.type === 'tenant' || loc.type === 'exhibitor')
  .sort((a, b) => b.score - a.score);

console.log('Found exhibitors:', exhibitors.map(e => e.name));
```

---

## Search Performance Tips

### 1. Debounce Input

```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300);  // Wait 300ms after user stops typing
});
```

### 2. Minimum Query Length

```javascript
if (query.length < 2) {
  // Don't search for single characters
  return;
}
```

### 3. Limit Results

```javascript
const topResults = results.locations
  .sort((a, b) => b.score - a.score)
  .slice(0, 10);  // Only show top 10
```

### 4. Cache Results

```javascript
const searchCache = new Map();

async function cachedSearch(query) {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  const results = await mapData.Search.query(query);
  searchCache.set(query, results);
  return results;
}
```

---

## Offline Search

**Key Feature:** Mappedin search works **completely offline**!

- All location data indexed locally on device/browser
- No network requests needed for search
- Instant results even without internet

**How it works:**
1. When you call `getMapData({ search: { enabled: true } })`
2. Mappedin downloads and indexes all location data
3. Search queries run locally against this index
4. Works offline after initial map load

---

## Testing Search

### Test Cases

```javascript
// Test 1: Exact match
await mapData.Search.query('Coffee Shop');
// Should return Coffee Shop with high score

// Test 2: Partial match
await mapData.Search.query('Coffee');
// Should return Coffee Shop, Cafe, etc.

// Test 3: Category search
await mapData.Search.query('Food');
// Should return food-related locations

// Test 4: Suggestions
await mapData.Search.suggest('Cof');
// Should return ['Coffee Shop', 'Coffee Bar']
```

---

## Migration Path

### Current (Custom Search) → Enhanced (Mappedin + Custom)

```javascript
// Step 1: Keep current custom search
function searchExhibitors(query) {
  // Existing implementation
}

// Step 2: Add Mappedin search for venue
async function searchVenue(query) {
  const results = await mapData.Search.query(query);
  return results.locations.filter(loc => loc.type !== 'exhibitor');
}

// Step 3: Combine results
async function universalSearch(query) {
  const [exhibitorResults, venueResults] = await Promise.all([
    searchExhibitors(query),
    searchVenue(query)
  ]);

  return {
    exhibitors: exhibitorResults,
    amenities: venueResults.filter(r => r.type === 'amenity'),
    other: venueResults.filter(r => r.type !== 'amenity')
  };
}
```

---

## Summary

### ✅ Current POC Status

- **Mappedin Search API:** Enabled ✅
- **Custom Exhibitor Search:** Working ✅
- **Debounced Input:** 300ms ✅
- **Search by Booth/Name/Description:** Working ✅
- **Auto-focus Results:** Working ✅

### 🚀 Future Enhancements

- [ ] Combine Mappedin + Custom search
- [ ] Add autocomplete suggestions
- [ ] Search result scoring
- [ ] Search filters (category, floor, etc.)
- [ ] Search history

---

## Official Resources

- 📖 [Mappedin Search Documentation](https://developer.mappedin.com/ios-sdk/search/)
- 📖 [Web SDK v6 API Reference](https://docs.mappedin.com/web/v6/latest/)
- 💻 [Example Code (iOS)](https://github.com/MappedIn/ios) - SearchVC.kt
- 🌐 [Developer Portal](https://developer.mappedin.com/)

---

**Status:** Search foundation in place, ready to enhance with Mappedin API when needed.
**Current:** Custom search for exhibitor data works perfectly for POC.
**Future:** Easy to integrate Mappedin Search API for venue-wide search.
