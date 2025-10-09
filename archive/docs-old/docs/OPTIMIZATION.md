# Optimized Architecture: Lazy-Load Exhibitor Data

## Problem
- 500+ exhibitors = heavy initial payload
- Most map objects (POIs, rooms, facilities) have NO exhibitor data
- Wasted bandwidth loading data that may never be viewed

## Solution: On-Click API Query + Skeleton Loading

---

## New Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Initial Map Load                        │
│                                                             │
│  1. Load Mappedin venue (ICC)                               │
│     • All spaces, POIs, facilities                          │
│     • Mappedin has: name, category, externalId              │
│                                                             │
│  2. Create markers using Mappedin data ONLY                 │
│     • Use space.name for label                              │
│     • Use space.category for icon                           │
│     • NO API calls yet ✅                                   │
│                                                             │
│  3. User clicks exhibitor marker                            │
│     ↓                                                       │
│  4. Show skeleton card immediately (Mappedin data)          │
│     • Name: "Acme Corporation" (from space.name)            │
│     • Booth: "2G19" (from space.externalId)                 │
│     • Category: "AEROSPACE" (from space.category)           │
│     • Loading spinner for details...                        │
│     ↓                                                       │
│  5. Query API by stallNo                                    │
│     GET /api/exhibitor-directory?stallNo=2G19               │
│     ↓                                                       │
│  6. Update card with full data                              │
│     • Logo, description, products, contact info             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Changes

### 1. **Map Initialization** (NO API calls)

```javascript
async function init() {
  mapView = await Mappedin.show3dMap(
    document.getElementById('mappedin-map'),
    {
      key: 'mik_iND9Ra87M1Ca4DD444be4063d',
      secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024',
      mapId: '688ea50e362b1d000ba0822b',
    }
  );

  mapData = mapView.mapData;
  allSpaces = mapData.getByType('space');

  // Create markers using ONLY Mappedin data
  createMarkersFromMappedin();

  // Search uses Mappedin data too
  setupSearch();
}

function createMarkersFromMappedin() {
  allSpaces
    .filter(space => space.name) // Only named spaces
    .forEach(space => {
      const icon = getCategoryIcon(space.category); // From Mappedin category
      const rank = getRank(space);

      const markerHTML = `
        <div class="space-marker rank-${rank}">
          <span class="marker-icon">${icon}</span>
        </div>
      `;

      const marker = mapView.Markers.add(space, markerHTML, {
        anchor: 'bottom',
        rank: rank,
        interactive: true
      });

      // On click: Load exhibitor data IF externalId exists
      marker.addEventListener('click', () => handleMarkerClick(space));
    });
}
```

---

### 2. **On-Click: Skeleton → API → Full Card**

```javascript
async function handleMarkerClick(space) {
  // Focus camera
  mapView.Camera.focusOn(space);

  // Check if this is an exhibitor booth (has externalId/stallNo)
  if (!space.externalId) {
    // Regular POI (restroom, info desk, etc.)
    showPOICard(space);
    return;
  }

  // EXHIBITOR: Show skeleton immediately
  showSkeletonCard(space);

  // Query API by stallNo
  try {
    const exhibitorData = await fetchExhibitorByStallNo(space.externalId);

    if (exhibitorData) {
      // Update with full data
      showFullExhibitorCard(space, exhibitorData);

      // Send to app (React Native)
      sendToApp('exhibitorClick', {
        stallNo: space.externalId,
        exhibitor: exhibitorData
      });
    } else {
      // No exhibitor found - show basic info only
      showBasicSpaceCard(space);
    }

  } catch (error) {
    console.error('Failed to load exhibitor:', error);
    showErrorCard(space, 'Unable to load exhibitor details');
  }
}

// API call with caching
const exhibitorCache = new Map();

async function fetchExhibitorByStallNo(stallNo) {
  // Check cache first
  if (exhibitorCache.has(stallNo)) {
    return exhibitorCache.get(stallNo);
  }

  // Query API
  const response = await fetch(
    `https://your-api.com/api/exhibitor-directory?stallNo=${stallNo}`
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const exhibitor = data.length > 0 ? data[0] : null;

  // Cache result (even if null)
  exhibitorCache.set(stallNo, exhibitor);

  return exhibitor;
}
```

---

### 3. **Skeleton Card UI** (Instant display)

```javascript
function showSkeletonCard(space) {
  const cardHTML = `
    <div class="exhibitor-card skeleton">
      <div class="card-header">
        <div class="skeleton-logo"></div>
        <div class="card-info">
          <h3>${space.name}</h3>
          <p>Booth ${space.externalId}</p>
          ${space.category ? `<span class="category">${space.category}</span>` : ''}
        </div>
      </div>

      <div class="card-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
      </div>

      <div class="card-actions">
        <button disabled class="loading">Loading details...</button>
      </div>
    </div>
  `;

  // For web version: Show in modal/popup
  showCardModal(cardHTML);

  // For app version: Send to React Native
  sendToApp('exhibitorClick', {
    stallNo: space.externalId,
    name: space.name,
    category: space.category,
    loading: true  // App shows skeleton sheet
  });
}
```

---

### 4. **Full Card UI** (After API loads)

```javascript
function showFullExhibitorCard(space, exhibitor) {
  const cardHTML = `
    <div class="exhibitor-card">
      <div class="card-header">
        ${exhibitor.logoUrl
          ? `<img src="${exhibitor.logoUrl}" alt="${exhibitor.companyName}" class="company-logo">`
          : `<div class="placeholder-logo">${exhibitor.companyName[0]}</div>`
        }
        <div class="card-info">
          <h3>${exhibitor.companyName}</h3>
          <p>Booth ${exhibitor.stallNo}</p>
          <div class="categories">
            ${exhibitor.categories.map(c => `<span class="category">${c}</span>`).join('')}
          </div>
        </div>
      </div>

      <div class="card-body">
        <p>${exhibitor.profileDesc}</p>

        ${exhibitor.products?.length > 0 ? `
          <div class="products">
            <h4>Products</h4>
            ${exhibitor.products.slice(0, 3).map(p => `
              <div class="product-item">
                ${p.image ? `<img src="${p.image}" alt="${p.title}">` : ''}
                <span>${p.title}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="contact">
          ${exhibitor.website ? `<a href="${exhibitor.website}" target="_blank">🌐 Website</a>` : ''}
          ${exhibitor.emailId ? `<a href="mailto:${exhibitor.emailId}">📧 Email</a>` : ''}
          ${exhibitor.linkedinLink ? `<a href="${exhibitor.linkedinLink}" target="_blank">💼 LinkedIn</a>` : ''}
        </div>
      </div>

      <div class="card-actions">
        <button onclick="navigateToExhibitor('${space.id}')">Navigate to Booth</button>
        <button onclick="closeCard()">Close</button>
      </div>
    </div>
  `;

  updateCardModal(cardHTML);
}
```

---

### 5. **React Native Integration** (Optimized)

```typescript
const MapScreen = () => {
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);
  const [loadingExhibitor, setLoadingExhibitor] = useState(false);

  // Handle messages from WebView
  const handleWebViewMessage = async (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'exhibitorClick':
        const { stallNo, name, category, loading, exhibitor } = message.payload;

        if (loading) {
          // Show skeleton sheet immediately
          setLoadingExhibitor(true);
          setSelectedExhibitor({
            stallNo,
            companyName: name,
            categories: [category],
            // Rest null - shows skeleton
          });

          // Fetch full data from API
          try {
            const fullData = await fetch(
              `https://your-api.com/api/exhibitor-directory?stallNo=${stallNo}`
            ).then(res => res.json());

            setLoadingExhibitor(false);
            setSelectedExhibitor(fullData[0] || null);

          } catch (error) {
            setLoadingExhibitor(false);
            Alert.alert('Error', 'Unable to load exhibitor details');
          }

        } else if (exhibitor) {
          // WebView already loaded it - use that data
          setLoadingExhibitor(false);
          setSelectedExhibitor(exhibitor);
        }
        break;
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://yoursite.com/map/app.html' }}
        onMessage={handleWebViewMessage}
      />

      {selectedExhibitor && (
        <ExhibitorBottomSheet
          exhibitor={selectedExhibitor}
          loading={loadingExhibitor}
          onClose={() => setSelectedExhibitor(null)}
        />
      )}
    </View>
  );
};
```

---

### 6. **Enhanced Search** (Still uses Mappedin data)

```javascript
function setupSearch() {
  const searchInput = document.getElementById('searchInput');

  searchInput.addEventListener('input', debounce((e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) return;

    // Search Mappedin spaces only (no API call needed)
    const results = allSpaces
      .filter(space => {
        if (!space.name) return false;

        return (
          space.name.toLowerCase().includes(query) ||
          space.externalId?.toLowerCase().includes(query) ||
          space.category?.toLowerCase().includes(query)
        );
      })
      .slice(0, 10)
      .map(space => ({
        id: space.id,
        name: space.name,
        stallNo: space.externalId,
        category: space.category,
        icon: getCategoryIcon(space.category)
      }));

    renderSearchResults(results);
  }, 300));
}

function selectSearchResult(spaceId) {
  const space = allSpaces.find(s => s.id === spaceId);
  if (space) {
    mapView.Camera.focusOn(space);
    // Clicking search result triggers marker click behavior
    handleMarkerClick(space);
  }
}
```

**Search behavior**:
- Searches Mappedin space names (fast, no API)
- Shows results with booth numbers
- Click result → Focuses on map → Triggers API load for that booth

**Optional enhancement**: Add API search endpoint for deep product/description search:
```javascript
// Only if user clicks "Search all exhibitor details"
const apiResults = await fetch(
  `https://your-api.com/api/exhibitor-directory/search?q=${query}`
).then(r => r.json());
```

---

### 7. **Categories/Bottom Sheet** (Hybrid approach)

```javascript
function populateCategories() {
  // Use Mappedin categories (instant)
  const categorizedSpaces = allSpaces
    .filter(s => s.externalId && s.category) // Only exhibitor booths
    .reduce((acc, space) => {
      if (!acc[space.category]) acc[space.category] = [];
      acc[space.category].push(space);
      return acc;
    }, {});

  const categoryHTML = Object.entries(categorizedSpaces)
    .map(([category, spaces]) => `
      <div class="category-section">
        <h4>${getCategoryIcon(category)} ${category} (${spaces.length})</h4>
        <div class="exhibitor-grid">
          ${spaces.slice(0, 6).map(space => `
            <div class="exhibitor-card-mini" onclick="selectExhibitor('${space.id}')">
              <div class="icon">${getCategoryIcon(space.category)}</div>
              <div class="name">${space.name}</div>
              <div class="booth">${space.externalId}</div>
            </div>
          `).join('')}
          ${spaces.length > 6 ? `
            <button onclick="expandCategory('${category}')">
              See all ${spaces.length} →
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

  document.getElementById('categoriesContainer').innerHTML = categoryHTML;
}

window.selectExhibitor = function(spaceId) {
  const space = allSpaces.find(s => s.id === spaceId);
  if (space) {
    mapView.Camera.focusOn(space);
    handleMarkerClick(space); // Triggers API load
  }
};
```

---

### 8. **Caching Strategy**

```javascript
// In-memory cache (lasts for session)
const exhibitorCache = new Map();

// Optional: LocalStorage cache (persists across sessions)
function getCachedExhibitor(stallNo) {
  // Check memory first
  if (exhibitorCache.has(stallNo)) {
    return Promise.resolve(exhibitorCache.get(stallNo));
  }

  // Check localStorage
  const cached = localStorage.getItem(`exhibitor_${stallNo}`);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      const age = Date.now() - data.timestamp;

      // Cache valid for 24 hours
      if (age < 24 * 60 * 60 * 1000) {
        exhibitorCache.set(stallNo, data.exhibitor);
        return Promise.resolve(data.exhibitor);
      }
    } catch (e) {
      console.error('Cache parse error:', e);
    }
  }

  // Not cached - fetch from API
  return fetchExhibitorByStallNo(stallNo).then(exhibitor => {
    // Save to localStorage
    localStorage.setItem(`exhibitor_${stallNo}`, JSON.stringify({
      exhibitor,
      timestamp: Date.now()
    }));

    return exhibitor;
  });
}
```

---

### 9. **API Endpoint Requirements**

Your API should support:

**Option 1: Single exhibitor query** (recommended)
```
GET /api/exhibitor-directory?stallNo=2G19

Response:
[{
  "id": "34171",
  "companyName": "Acme Corp",
  "stallNo": "2G19",
  "logoUrl": "...",
  "profileDesc": "...",
  "categories": ["AEROSPACE"],
  "products": [...],
  ...
}]
```

**Option 2: Batch query** (for preloading featured exhibitors)
```
GET /api/exhibitor-directory?stallNos=2G19,3A12,1B05

Response:
[{ ... }, { ... }, { ... }]
```

**Option 3: Search endpoint** (optional, for deep search)
```
GET /api/exhibitor-directory/search?q=aerospace+sensors

Response:
[{
  "id": "34171",
  "companyName": "Acme Corp",
  "stallNo": "2G19",
  "matchedFields": ["categories", "products"],
  ...
}]
```

---

## Performance Comparison

### ❌ Old Approach (Load all 500 upfront)
```
Initial load:
- Mappedin venue: ~500KB
- Exhibitor API (500 items): ~2MB
- TOTAL: ~2.5MB
- Time: 3-5 seconds on 4G

User clicks booth:
- Show details: Instant (already loaded)
```

### ✅ New Approach (Lazy load on click)
```
Initial load:
- Mappedin venue: ~500KB
- TOTAL: ~500KB
- Time: 1-2 seconds on 4G

User clicks booth:
- Query API: ~4KB
- Time: 200-500ms
- Cached for subsequent clicks: Instant
```

**Result**:
- 80% faster initial load
- Users only load data they actually view
- Better for users who just browse without clicking

---

## Edge Cases

### 1. **No Exhibitor Data** (POI/Facility)
```javascript
if (!space.externalId) {
  // Regular POI - show basic info from Mappedin
  showPOICard({
    name: space.name,
    category: space.category,
    floor: space.floor?.name,
    // No API call needed
  });
}
```

### 2. **ExternalId exists but API returns nothing**
```javascript
const exhibitor = await fetchExhibitorByStallNo(space.externalId);

if (!exhibitor) {
  // Booth reserved but exhibitor not confirmed yet?
  showBasicSpaceCard({
    name: space.name,
    booth: space.externalId,
    message: 'Exhibitor details coming soon'
  });
}
```

### 3. **API Error/Offline**
```javascript
try {
  const exhibitor = await fetchExhibitorByStallNo(stallNo);
} catch (error) {
  showErrorCard({
    name: space.name,
    booth: space.externalId,
    error: 'Unable to load details. Please try again.'
  });
}
```

---

## Summary: What Changed

| Feature | Old | New |
|---------|-----|-----|
| Initial load | All 500 exhibitors | 0 exhibitors (only Mappedin data) |
| Marker creation | Needs API data | Uses Mappedin data only |
| Search | Needs API data | Uses Mappedin names/categories |
| Card display | Instant (pre-loaded) | Skeleton (instant) → API (200ms) → Full |
| Bandwidth | ~2.5MB initial | ~500KB initial + ~4KB per click |
| Load time | 3-5 seconds | 1-2 seconds |
| Caching | All in memory | Per-exhibitor + localStorage |

---

## Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MAP INITIALIZATION                       │
│                                                             │
│  Load Mappedin → Create markers from space.name/category   │
│  (NO exhibitor API calls)                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                        │
│                                                             │
│  Search: Use Mappedin data (fast)                           │
│  Browse categories: Use Mappedin data (fast)                │
│  Click marker: Check if exhibitor booth...                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────┴──────────┐
                 │                     │
         ┌───────▼────────┐    ┌──────▼─────────┐
         │  POI/Facility  │    │ Exhibitor Booth│
         │  (no API call) │    │ (has externalId)│
         └────────────────┘    └────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ 1. Show skeleton card │
                            │    (Mappedin data)    │
                            └───────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ 2. Query API by       │
                            │    stallNo (cached)   │
                            └───────────────────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │ 3. Update card with   │
                            │    full exhibitor data│
                            └───────────────────────┘
```

---

**This is much better!** Ready to build with this optimized architecture? 🚀
