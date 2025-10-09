# Search Implementation Guide - Mappedin v6

## Overview

Based on the Mappedin Web SDK v6 documentation and API, here's how to implement search functionality for the Conference POC.

---

## Available Search Methods

### 1. **Basic Filtering with `getByType()`**

The primary method for filtering map data:

```javascript
// Get all spaces
const allSpaces = mapData.getByType('space');

// Get all amenities
const amenities = mapData.getByType('amenity');

// Get all floors
const floors = mapData.getByType('floor');
```

### 2. **JavaScript Array Filtering**

Filter results using standard JavaScript methods:

```javascript
// Search by name (case-insensitive)
const spaces = mapData.getByType('space');
const searchResults = spaces.filter(space =>
  space.name?.toLowerCase().includes(searchTerm.toLowerCase())
);

// Search by externalId (booth number)
const boothResults = spaces.filter(space =>
  space.externalId?.toLowerCase().includes(searchTerm.toLowerCase())
);

// Combined search (name OR booth number)
const combinedResults = spaces.filter(space =>
  space.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  space.externalId?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

### 3. **Find Specific Item**

```javascript
// Find first match
const cafeteria = mapData.getByType('space').find(space =>
  space.name === 'Cafeteria'
);

// Find by ID
const spaceById = mapData.getById(spaceId);
```

---

## Conference POC Implementation

### Search Exhibitors by Name or Booth

```javascript
// Search configuration
let allSpaces = [];
let allExhibitors = []; // From API

// Initialize search
function setupSearch() {
  allSpaces = mapData.getByType('space').filter(s => s.externalId);

  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Debounced search (300ms delay)
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 300);
  });
}

// Perform search
function performSearch(query) {
  if (!query || query.length < 2) {
    hideSearchResults();
    return;
  }

  const searchTerm = query.toLowerCase().trim();

  // Search in spaces (by externalId and name)
  const spaceResults = allSpaces.filter(space =>
    space.externalId?.toLowerCase().includes(searchTerm) ||
    space.name?.toLowerCase().includes(searchTerm)
  );

  // Search in exhibitor data (by company name)
  const exhibitorResults = allExhibitors.filter(exhibitor =>
    exhibitor.name?.toLowerCase().includes(searchTerm) ||
    exhibitor.stallNo?.toLowerCase().includes(searchTerm) ||
    exhibitor.description?.toLowerCase().includes(searchTerm)
  );

  displaySearchResults([...spaceResults, ...exhibitorResults], searchTerm);
}

// Display results
function displaySearchResults(results, query) {
  const searchResults = document.getElementById('searchResults');

  if (results.length === 0) {
    searchResults.innerHTML = `
      <div style="padding: 16px; color: #666;">
        No results found for "${query}"
      </div>
    `;
    searchResults.style.display = 'block';
    return;
  }

  searchResults.innerHTML = results.map(result => `
    <div class="search-result-item" onclick="handleSearchResultClick('${result.id}')">
      <strong>${highlightMatch(result.name || result.externalId, query)}</strong>
      ${result.externalId ? `<div style="font-size: 12px; color: #666;">Booth ${result.externalId}</div>` : ''}
    </div>
  `).join('');

  searchResults.style.display = 'block';
}

// Highlight matching text
function highlightMatch(text, query) {
  if (!text) return '';
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Handle search result click
function handleSearchResultClick(spaceId) {
  const space = mapData.getById(spaceId);
  if (space) {
    showCardForSpace(space, true);
    mapView.Camera.focusOn(space);
    hideSearchResults();
  }
}

function hideSearchResults() {
  document.getElementById('searchResults').style.display = 'none';
}
```

---

## Advanced Search Features

### 1. **Category Filtering**

```javascript
// Filter by category/type
const retailSpaces = mapData.getByType('space').filter(space =>
  space.category === 'retail'
);

// Filter amenities by type
const restrooms = mapData.getByType('amenity').filter(amenity =>
  amenity.type === 'restroom'
);
```

### 2. **Multi-Criteria Search**

```javascript
function advancedSearch(query, options = {}) {
  let results = mapData.getByType('space');

  // Filter by search term
  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(space =>
      space.name?.toLowerCase().includes(searchTerm) ||
      space.externalId?.toLowerCase().includes(searchTerm)
    );
  }

  // Filter by floor
  if (options.floor) {
    results = results.filter(space =>
      space.floor?.id === options.floor.id
    );
  }

  // Filter by category
  if (options.category) {
    results = results.filter(space =>
      space.category === options.category
    );
  }

  // Filter by has externalId (booths only)
  if (options.boothsOnly) {
    results = results.filter(space => space.externalId);
  }

  return results;
}

// Usage
const results = advancedSearch('tech', {
  floor: mapData.getByType('floor')[0],
  category: 'exhibitor',
  boothsOnly: true
});
```

### 3. **Fuzzy Search (Optional)**

For more advanced search, implement fuzzy matching:

```javascript
// Simple fuzzy match function
function fuzzyMatch(str, pattern) {
  pattern = pattern.toLowerCase();
  str = str.toLowerCase();

  let patternIdx = 0;
  for (let strIdx = 0; strIdx < str.length; strIdx++) {
    if (str[strIdx] === pattern[patternIdx]) {
      patternIdx++;
    }
    if (patternIdx === pattern.length) return true;
  }
  return false;
}

// Use in search
const fuzzyResults = allSpaces.filter(space =>
  fuzzyMatch(space.name || '', searchTerm) ||
  fuzzyMatch(space.externalId || '', searchTerm)
);
```

---

## Search UI Components

### HTML Structure

```html
<!-- Search Bar -->
<div class="search-container">
  <input
    type="text"
    id="searchInput"
    placeholder="🔍 Search exhibitors or booth numbers..."
    autocomplete="off"
  />
  <div id="searchResults" class="search-results"></div>
</div>

<!-- Search Result Item Template -->
<style>
.search-container {
  position: relative;
  width: 100%;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  display: none;
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

mark {
  background: #667eea;
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
}
</style>
```

---

## Performance Optimization

### 1. **Debouncing**

Prevent excessive searches while typing:

```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300); // Wait 300ms after user stops typing
});
```

### 2. **Memoization**

Cache search results:

```javascript
const searchCache = new Map();

function performSearch(query) {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  const results = /* perform search */;
  searchCache.set(query, results);
  return results;
}
```

### 3. **Limit Results**

Show only top N results:

```javascript
const MAX_RESULTS = 10;

function displaySearchResults(results, query) {
  const limitedResults = results.slice(0, MAX_RESULTS);

  // Show results
  // ...

  if (results.length > MAX_RESULTS) {
    searchResults.innerHTML += `
      <div style="padding: 12px; color: #666; font-size: 12px;">
        Showing ${MAX_RESULTS} of ${results.length} results
      </div>
    `;
  }
}
```

---

## Conference POC Search Features

### Recommended Implementation

```javascript
// Complete search setup for POC
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Get all searchable data
  const allSpaces = mapData.getByType('space').filter(s => s.externalId);

  // Debounced search
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(() => {
      const searchTerm = query.toLowerCase();

      // Search spaces by booth number and name
      const spaceMatches = allSpaces.filter(space =>
        space.externalId?.toLowerCase().includes(searchTerm) ||
        space.name?.toLowerCase().includes(searchTerm)
      );

      // Search exhibitor data
      const exhibitorMatches = Object.entries(exhibitorData)
        .filter(([stallNo, exhibitors]) =>
          stallNo.toLowerCase().includes(searchTerm) ||
          exhibitors.some(ex =>
            ex.name.toLowerCase().includes(searchTerm) ||
            ex.description?.toLowerCase().includes(searchTerm)
          )
        )
        .map(([stallNo, exhibitors]) => ({
          stallNo,
          exhibitors,
          space: allSpaces.find(s =>
            s.externalId?.toLowerCase() === stallNo.toLowerCase()
          )
        }))
        .filter(match => match.space); // Only include if space exists

      // Combine and display results
      displayResults([...spaceMatches, ...exhibitorMatches], searchTerm);
    }, 300);
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      searchResults.style.display = 'none';
    }
  });

  console.log('✅ Search initialized');
}

function displayResults(results, query) {
  const searchResults = document.getElementById('searchResults');

  if (results.length === 0) {
    searchResults.innerHTML = `
      <div style="padding: 16px; color: #666;">
        No exhibitors found for "${query}"
      </div>
    `;
    searchResults.style.display = 'block';
    return;
  }

  searchResults.innerHTML = results.map(result => {
    if (result.exhibitors) {
      // Exhibitor match
      return `
        <div class="search-result-item" onclick="focusOnBooth('${result.stallNo}')">
          <strong>${result.exhibitors[0].name}</strong>
          ${result.exhibitors.length > 1 ? ` <span style="color: #667eea;">+${result.exhibitors.length - 1} more</span>` : ''}
          <div style="font-size: 12px; color: #666;">📍 Booth ${result.stallNo}</div>
        </div>
      `;
    } else {
      // Space match
      return `
        <div class="search-result-item" onclick="focusOnBooth('${result.externalId}')">
          <strong>${result.name || result.externalId}</strong>
          <div style="font-size: 12px; color: #666;">📍 Booth ${result.externalId}</div>
        </div>
      `;
    }
  }).join('');

  searchResults.style.display = 'block';
}

function focusOnBooth(stallNo) {
  const space = mapData.getByType('space').find(s =>
    s.externalId?.toLowerCase() === stallNo.toLowerCase()
  );

  if (space) {
    showCardForSpace(space, true);
    mapView.Camera.focusOn(space);
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('searchInput').value = '';
  }
}
```

---

## Testing Search

### Test Cases

1. **Search by booth number**: "3J84", "3A90"
2. **Search by company name**: "ASC", "Pirtek", "Offshore"
3. **Partial matches**: "Aer" should find "Aerius Marine"
4. **Case insensitive**: "asc" should find "ASC Pty Ltd"
5. **Empty search**: Should hide results
6. **No results**: Should show "No results" message

---

## Summary

**Best Practice for Mappedin v6 Search:**

1. Use `mapData.getByType('space')` to get all spaces
2. Filter with JavaScript `.filter()` method
3. Search by `externalId` (booth number) and `name`
4. Debounce input for performance
5. Highlight matching text in results
6. Focus camera on selected result

**No built-in search API needed** - JavaScript array methods provide all functionality!

---

## Next Steps

1. Implement search in `index.html`
2. Wire up existing search input
3. Test with exhibitor data
4. Add keyboard navigation (up/down arrows)
5. Add "Clear search" button
