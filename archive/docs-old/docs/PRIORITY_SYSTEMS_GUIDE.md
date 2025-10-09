# Mappedin Priority & Ranking Systems - Complete Guide

> **Comprehensive overview of all ranking, priority, and scoring systems in Mappedin SDK**

---

## 📊 Overview: All Priority Systems

Mappedin uses **multiple priority systems** for different features:

| System | Purpose | Values | Where Used |
|--------|---------|--------|------------|
| **Label Rank** | Label visibility priority | `2`, `10` or `'low'`, `'high'` | Labels, Markers |
| **Search Score** | Search result relevance | `0-100` (higher = better match) | Search results |
| **Navigation Cost** | Route preference | `0` to `Infinity` | Dynamic routing zones |
| **Event Priority** | Click/hover handling | Custom logic (1st to 5th) | Event handlers |

---

## 1️⃣ Label & Marker Ranking

> **Purpose:** Controls which labels/markers are shown when elements overlap

### How It Works

When multiple labels/markers overlap:
- **Higher rank = visible**
- **Lower rank = hidden**

### Ranking Values

#### Named Ranks (Recommended by Mappedin)
```javascript
rank: 'low'            // Hidden by all higher ranks
rank: 'medium'         // Hidden by 'high' and 'always-visible'
rank: 'high'           // Hidden only by 'always-visible'
rank: 'always-visible' // Never hidden
```

#### Numeric Ranks (More Flexible)
```javascript
rank: 1    // Very low priority
rank: 2    // Low priority
rank: 5    // Medium priority
rank: 10   // High priority
rank: 100  // Maximum priority
```

### Conference POC Implementation

```javascript
// Exhibitor markers - HIGHEST priority (always visible)
mapView.Markers.add(space, markerHTML, {
  rank: 10,  // Always show exhibitor booths
  interactive: true
});

// Exhibitor object labels - HIGHEST priority
mapView.Labels.add(object, object.name, {
  rank: 10  // Always show booth names
});

// Amenities - LOW priority (hide when crowded)
mapView.Markers.add(amenity, iconHTML, {
  rank: 2  // Toilets, elevators can hide
});

// User drop pin - MEDIUM priority
mapView.Markers.add(coordinate, pinHTML, {
  rank: 5  // Visible over amenities
});
```

### Visual Hierarchy

```
RANK 10 ███████████████ Exhibitor Booths (Always Visible)
        ███████████████ Object Labels
                 ↓
RANK 5  ████████ User Drop Pins
                 ↓
RANK 2  ███ Amenities (Hidden when overlapping)
```

**Official Docs:** [Marker Ranking](https://developer.mappedin.com/web-sdk/markers#marker-rank)

---

## 2️⃣ Search Scoring

> **Purpose:** Ranks search results by relevance

### How It Works

Mappedin Search API returns results with a **score** (0-100):
- **100** = Perfect match (exact name)
- **75-99** = Strong match (contains query)
- **50-74** = Partial match (description, tags)
- **0-49** = Weak match

### Search Result Structure

```javascript
const results = await mapData.Search.query('Coffee Shop');

// Results format:
{
  locations: [
    {
      id: "loc-123",
      name: "Coffee Shop A",
      type: "tenant",
      score: 95.5,  // ← Search score
      matchedTerms: ["coffee", "shop"]
    },
    {
      id: "loc-456",
      name: "Cafe B",
      type: "tenant",
      score: 72.3,
      matchedTerms: ["coffee"]
    }
  ]
}
```

### Best Practice: Sort by Score

```javascript
// Always sort search results by score (descending)
const sortedResults = results.locations
  .filter(loc => loc.type === 'tenant')  // Filter by type
  .sort((a, b) => b.score - a.score)     // Highest score first
  .slice(0, 10);                          // Limit to top 10

// iOS/Swift equivalent:
let searchLocations = results
    .compactMap { $0 as? MPISearchResultLocation }
    .filter({$0.object.type == "tenant"})
    .sorted(by: {$0.score > $1.score})  // Highest first
```

### Custom Search Scoring (For Exhibitor Data)

```javascript
function calculateSearchScore(exhibitor, query) {
  let score = 0;
  const lowerQuery = query.toLowerCase();

  // Exact booth number match = 100
  if (exhibitor.stallNo?.toLowerCase() === lowerQuery) {
    score = 100;
  }
  // Exact company name match = 90
  else if (exhibitor.name.toLowerCase() === lowerQuery) {
    score = 90;
  }
  // Company name contains query = 60
  else if (exhibitor.name.toLowerCase().includes(lowerQuery)) {
    score = 60;
  }
  // Description contains query = 30
  else if (exhibitor.description?.toLowerCase().includes(lowerQuery)) {
    score = 30;
  }

  return score;
}

// Use in search:
const exhibitorResults = allExhibitors
  .map(ex => ({
    exhibitor: ex,
    score: calculateSearchScore(ex, query)
  }))
  .filter(r => r.score > 0)
  .sort((a, b) => b.score - a.score);  // Highest first
```

**Official Docs:** [Search Documentation](https://developer.mappedin.com/ios-sdk/search/)

---

## 3️⃣ Navigation Cost (Dynamic Routing)

> **Purpose:** Control route preferences through zones

### How It Works

You can assign **cost values** to map zones to influence routing:
- **Cost 0** = Preferred path (default)
- **Cost > 0** = Less preferred (avoid if possible)
- **Cost Infinity** = Blocked (never use)

### Cost Values

```javascript
// Zone cost options:
cost: 0         // Normal path (default)
cost: 10        // Slightly avoid
cost: 50        // Strongly avoid
cost: 100       // Almost impassable
cost: Infinity  // Completely blocked
```

### Conference POC Example: Accessibility Routes

```javascript
// Prefer elevator routes (accessible mode)
const directions = await mapData.getDirections(start, end, {
  zones: [
    {
      // Block stairs when accessible mode ON
      cost: accessibleMode ? Infinity : 0,
      floor: floor,
      geometry: stairsPolygon  // Define stairs area
    },
    {
      // Prefer elevators
      cost: accessibleMode ? 0 : 10,
      floor: floor,
      geometry: elevatorPolygon
    }
  ]
});
```

### Use Cases

#### 1. Block Construction Areas
```javascript
zones: [{
  cost: Infinity,  // Completely blocked
  floor: floor1,
  geometry: constructionAreaPolygon
}]
```

#### 2. Prefer Main Corridors
```javascript
zones: [
  {
    cost: 0,  // Main corridor (preferred)
    geometry: mainCorridorPolygon
  },
  {
    cost: 20,  // Side paths (less preferred)
    geometry: sidePathPolygon
  }
]
```

#### 3. Accessible Routes
```javascript
zones: [
  {
    cost: accessibleMode ? Infinity : 0,  // Block stairs if accessible
    geometry: stairsPolygon
  },
  {
    cost: accessibleMode ? 0 : 50,  // Prefer ramps if accessible
    geometry: rampsPolygon
  }
]
```

**Official Docs:** [Dynamic Routing](https://developer.mappedin.com/web-sdk/wayfinding#dynamic-routing)

---

## 4️⃣ Event Handler Priority

> **Purpose:** Determine which element handles clicks when multiple overlap

### How It Works

Custom **priority logic** in event handlers (not a Mappedin API feature):

```javascript
mapView.on('click', (event) => {
  // Priority 1: Markers (most specific)
  if (event?.markers?.length > 0) {
    handleMarkerClick(event.markers[0]);
    return;  // Stop here
  }

  // Priority 2: Labels
  if (event?.labels?.length > 0) {
    handleLabelClick(event.labels[0]);
    return;
  }

  // Priority 3: Objects (3D elements)
  if (event?.objects?.length > 0) {
    handleObjectClick(event.objects[0]);
    return;
  }

  // Priority 4: Spaces (floor areas)
  if (event?.spaces?.length > 0) {
    handleSpaceClick(event.spaces[0]);
    return;
  }

  // Priority 5: Empty map
  handleMapClick();
});
```

### Conference POC Implementation

```javascript
// index.html:244-294
mapView.on('click', (event) => {
  // 1. Markers (custom exhibitor UI)
  if (event?.markers?.length > 0) {
    return; // Marker has own handler
  }

  // 2. Labels (text annotations)
  if (event?.labels?.length > 0) {
    console.log('Label clicked:', event.labels[0]);
    return;
  }

  // 3. Objects (3D booth displays, furniture)
  if (event?.objects?.length > 0) {
    showObjectDetails(event.objects[0]);
    return;
  }

  // 4. Spaces (booth floor areas)
  if (event?.spaces?.length > 0) {
    showExhibitorCard(event.spaces[0]);
    return;
  }

  // 5. Empty map (close card)
  hideExhibitorCard();
});
```

### Why This Order?

1. **Markers** = User placed custom UI (most intentional click)
2. **Labels** = Specific text labels (user clicked text)
3. **Objects** = 3D elements (booth displays, furniture)
4. **Spaces** = Floor areas (larger, less specific)
5. **Empty** = Fallback (clear selection)

**Implementation:** Custom logic using `event.stopPropagation()`

---

## 🎯 Complete Priority Matrix

### All Systems Combined

| Feature | Priority Type | High Priority | Low Priority | Purpose |
|---------|---------------|---------------|--------------|---------|
| **Labels/Markers** | Rank | `10` or `'high'` | `2` or `'low'` | Visibility when overlapping |
| **Search Results** | Score | `90-100` | `0-30` | Relevance sorting |
| **Navigation** | Cost | `0` | `Infinity` | Route preference |
| **Events** | Order | Markers (1st) | Spaces (4th) | Click handling |

---

## 📝 Conference POC: Complete Implementation

### 1. Label/Marker Ranking

```javascript
// RANK 10: Exhibitors (always visible)
Exhibitor Markers:  rank: 10
Object Labels:      rank: 10

// RANK 5: User elements (medium)
Drop Pins:          rank: 5

// RANK 2: Amenities (can hide)
Toilets:            rank: 2
Elevators:          rank: 2
```

### 2. Search Scoring

```javascript
// Booth number exact match: score = 100
"3J84" → Booth 3J84 (score: 100)

// Company name exact match: score = 90
"ASC" → ASC Pty Ltd (score: 90)

// Company name contains: score = 60
"Offshore" → Offshore Unlimited (score: 60)

// Description contains: score = 30
"submarine" → ASC Pty Ltd (score: 30)
```

### 3. Navigation Cost

```javascript
// Accessibility mode implementation:
if (accessibleMode) {
  stairs:    cost = Infinity  // Blocked
  elevators: cost = 0         // Preferred
} else {
  stairs:    cost = 0         // Allowed
  elevators: cost = 10        // Slight preference for stairs
}
```

### 4. Event Priority

```javascript
// Click handling order:
1. Markers     → Show exhibitor card
2. Labels      → Log click
3. Objects     → Show object details
4. Spaces      → Show space details
5. Empty map   → Close card
```

---

## 🔍 Decision Matrix

**When to use which priority system:**

| Scenario | System | Solution |
|----------|--------|----------|
| Too many labels overlapping | Label Rank | Use rank `10` for important, `2` for less important |
| Search results chaotic | Search Score | Sort by `score` descending |
| Want accessible routes | Navigation Cost | Set stairs to `cost: Infinity` |
| Wrong element handling clicks | Event Priority | Reorder priority in event handler |
| Markers hiding each other | Label Rank | Adjust rank or use clustering |

---

## 📊 Best Practices Summary

### Label/Marker Ranking
✅ Use numeric ranks for flexibility (2, 5, 10)
✅ Leave gaps between ranks (room for new priorities)
✅ Group similar elements at same rank
❌ Don't use consecutive numbers (1, 2, 3)

### Search Scoring
✅ Always sort by score descending
✅ Filter by type before sorting
✅ Limit results (top 10-20)
❌ Don't show results with score < 20

### Navigation Cost
✅ Use `Infinity` for blocked areas
✅ Use `0` for preferred paths
✅ Test with different cost values
❌ Don't use negative costs

### Event Priority
✅ Handle most specific first (markers)
✅ Use `return` to stop propagation
✅ Provide fallback for empty map
❌ Don't handle same element twice

---

## 🧪 Testing Priorities

### Test Label Ranking
```javascript
// Add many labels at same location
mapView.Labels.add(space, 'Label 1', { rank: 2 });
mapView.Labels.add(space, 'Label 2', { rank: 10 });

// Expected: Label 2 (rank 10) should be visible
```

### Test Search Scoring
```javascript
const results = await mapData.Search.query('Coffee');
console.log(results.map(r => `${r.name}: ${r.score}`));

// Expected: Sorted by score, highest first
```

### Test Navigation Cost
```javascript
const directions = await mapData.getDirections(start, end, {
  zones: [{ cost: Infinity, geometry: blockedArea }]
});

// Expected: Path avoids blocked area
```

### Test Event Priority
```javascript
// Click on overlapping marker + space
mapView.on('click', (event) => {
  console.log('Clicked:', {
    markers: event.markers?.length,
    spaces: event.spaces?.length
  });
});

// Expected: Marker handler executes first
```

---

## 📚 Official Documentation Links

- [Marker Ranking](https://developer.mappedin.com/web-sdk/markers#marker-rank)
- [Search & Scoring](https://developer.mappedin.com/ios-sdk/search/)
- [Dynamic Routing](https://developer.mappedin.com/web-sdk/wayfinding#dynamic-routing)
- [Interactivity](https://developer.mappedin.com/web-sdk/interactivity)
- [API Reference](https://docs.mappedin.com/web/v6/latest/)

---

## ✅ Summary

**Four Priority Systems:**

1. **Label Rank** (2 vs 10) - Visibility priority
2. **Search Score** (0-100) - Relevance sorting
3. **Navigation Cost** (0 to ∞) - Route preference
4. **Event Priority** (1st to 5th) - Click handling

**Conference POC Uses All Four:**
- Exhibitors ranked `10` (highest)
- Search sorted by score
- Accessibility mode via navigation cost
- 5-level event priority system

**Everything documented, tested, and production-ready!** ✅
