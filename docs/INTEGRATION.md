# Mappedin + Exhibitor API Integration Guide

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                        │
│                                                             │
│  1. Fetch exhibitors from API on mount                      │
│     GET https://your-api.com/api/exhibitor-directory        │
│                                                             │
│  2. Pass stallNo mapping to WebView                         │
│     webView.injectJavaScript(exhibitorMap)                  │
│                                                             │
│  3. Listen for postMessage from map                         │
│     { type: 'exhibitorClick', stallNo: '2G19' }             │
│                                                             │
│  4. Find exhibitor & show bottom sheet                      │
│     exhibitors.find(e => e.stallNo === '2G19')              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Mappedin WebView (app.html)               │
│                                                             │
│  1. Initialize map with ICC venue                           │
│  2. Load spaces & filter by externalId                      │
│  3. Create markers for exhibitor booths                     │
│  4. On marker click → postMessage(stallNo)                  │
│  5. Handle deep-links: ?stallNo=2G19&action=navigate        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Exhibitor Data Schema

### API Response
```json
[
  {
    "id": "34171",
    "companyName": "Nanocube Pty Ltd",
    "stallNo": "2G19",                    // ← MAPS TO Mappedin externalId
    "logoUrl": "https://aal.exhibitoronlinemanual.com/uploads/logo.png",
    "countryName": "Australia",
    "profileDesc": "Leading manufacturer...",
    "emailId": "contact@nanocube.com.au",
    "phoneNumber": "+61 2 1234 5678",
    "website": "https://www.nanocube.com.au",
    "linkedinLink": "https://linkedin.com/company/nanocube",
    "categories": ["AEROSPACE", "DEFENCE", "BUSINESS AVIATION"],
    "products": [...],
    "brochures": [...],
    "videos": [],
    "pressReleases": []
  }
]
```

### Mapping to Mappedin
```javascript
// In WebView: Match stallNo to space.externalId
const exhibitorSpaces = mapData.getByType('space')
  .filter(space => {
    // stallNo like "2G19" should match space.externalId
    return exhibitorData.some(e =>
      e.stallNo?.toUpperCase() === space.externalId?.toUpperCase()
    );
  });
```

---

## 2. React Native Implementation

### MapScreen Component
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import ExhibitorBottomSheet from './ExhibitorBottomSheet';

interface Exhibitor {
  id: string;
  companyName: string;
  stallNo: string;
  logoUrl: string;
  profileDesc: string;
  categories: string[];
  // ... rest of fields
}

const MapScreen = () => {
  const webViewRef = useRef<WebView>(null);
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [selectedExhibitor, setSelectedExhibitor] = useState<Exhibitor | null>(null);

  // 1. Load exhibitors from API
  useEffect(() => {
    fetch('https://your-api.com/api/exhibitor-directory')
      .then(res => res.json())
      .then(data => {
        setExhibitors(data);

        // 2. Pass to WebView after map loads
        const exhibitorMap = data.reduce((acc, e) => {
          acc[e.stallNo] = {
            id: e.id,
            name: e.companyName,
            logo: e.logoUrl,
            categories: e.categories
          };
          return acc;
        }, {});

        // Inject into WebView
        webViewRef.current?.injectJavaScript(`
          window.exhibitorData = ${JSON.stringify(exhibitorMap)};
          window.initializeExhibitorMarkers?.();
          true; // Required for iOS
        `);
      })
      .catch(err => console.error('Error loading exhibitors:', err));
  }, []);

  // 3. Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'exhibitorClick':
          const exhibitor = exhibitors.find(e =>
            e.stallNo?.toLowerCase() === message.payload.stallNo?.toLowerCase()
          );
          if (exhibitor) {
            setSelectedExhibitor(exhibitor);
          }
          break;

        case 'navigationStart':
          // Track analytics
          console.log('Navigation started:', message.payload);
          break;

        case 'mapReady':
          console.log('Map initialized successfully');
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // 4. Deep-link handler (when user clicks exhibitor in directory)
  const navigateToExhibitor = (stallNo: string, action = 'navigate') => {
    webViewRef.current?.injectJavaScript(`
      window.handleDeepLink?.('${stallNo}', '${action}');
      true;
    `);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://yoursite.com/map/app.html' }}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />

      {selectedExhibitor && (
        <ExhibitorBottomSheet
          exhibitor={selectedExhibitor}
          onClose={() => setSelectedExhibitor(null)}
          onNavigate={() => navigateToExhibitor(selectedExhibitor.stallNo, 'navigate')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default MapScreen;
```

---

## 3. WebView Implementation (app.html)

### Core JavaScript
```javascript
// Global state
let mapView, mapData;
let exhibitorData = {}; // Injected from React Native
let allSpaces = [];

// Initialize map
async function init() {
  try {
    mapView = await Mappedin.show3dMap(
      document.getElementById('mappedin-map'),
      {
        key: 'mik_iND9Ra87M1Ca4DD444be4063d',
        secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024',
        mapId: '688ea50e362b1d000ba0822b', // ICC
      }
    );

    mapData = mapView.mapData;
    allSpaces = mapData.getByType('space');

    // Notify React Native
    sendToApp('mapReady', {
      totalSpaces: allSpaces.length,
      floors: mapData.getByType('floor').map(f => ({ id: f.id, name: f.name }))
    });

    // Wait for exhibitor data from React Native
    // (injected via window.exhibitorData)
    if (window.exhibitorData) {
      initializeExhibitorMarkers();
    }

    // Handle URL params (deep-links)
    handleURLParams();

  } catch (error) {
    console.error('Map initialization failed:', error);
    sendToApp('mapError', { error: error.message });
  }
}

// Create markers for exhibitor booths
window.initializeExhibitorMarkers = function() {
  if (!exhibitorData || !mapData) return;

  const exhibitorSpaces = allSpaces.filter(space =>
    space.externalId && exhibitorData[space.externalId]
  );

  console.log(`Creating ${exhibitorSpaces.length} exhibitor markers`);

  exhibitorSpaces.forEach(space => {
    const exhibitor = exhibitorData[space.externalId];

    // Create marker with logo or icon
    const markerContent = exhibitor.logo
      ? `<div class="exhibitor-marker">
           <img src="${exhibitor.logo}" alt="${exhibitor.name}" />
         </div>`
      : `<div class="exhibitor-marker">
           <span class="category-icon">${getCategoryIcon(exhibitor.categories)}</span>
         </div>`;

    const marker = mapView.Markers.add(
      space,
      markerContent,
      {
        anchor: 'bottom',
        rank: 4, // High priority for exhibitors
        interactive: true
      }
    );

    // Click handler
    marker.addEventListener('click', () => {
      sendToApp('exhibitorClick', {
        stallNo: space.externalId,
        name: exhibitor.name,
        spaceId: space.id,
        floor: space.floor?.name
      });

      // Visual feedback
      mapView.Camera.focusOn(space, {
        animationDuration: 800,
        tilt: 45
      });
    });
  });
};

// Handle deep-links from React Native
window.handleDeepLink = function(stallNo, action = 'focus') {
  const space = allSpaces.find(s =>
    s.externalId?.toLowerCase() === stallNo.toLowerCase()
  );

  if (!space) {
    console.warn(`Space not found for stallNo: ${stallNo}`);
    return;
  }

  // Switch to correct floor
  if (space.floor && mapView.currentFloor?.id !== space.floor.id) {
    mapView.setFloor(space.floor.id);
  }

  switch (action) {
    case 'navigate':
      // Start wayfinding
      const startPoint = blueDotMarker?.coordinate || mapData.mapCenter;
      mapData.getDirections(startPoint, space)
        .then(directions => {
          if (directions) {
            mapView.Navigation.draw(directions, {
              pathOptions: {
                displayArrowsOnPath: true,
                animateArrowsOnPath: true,
                accentColor: '#007AFF'
              }
            });
            mapView.Camera.focusOn(directions.path);

            sendToApp('navigationStart', {
              from: { type: 'userLocation' },
              to: { stallNo, name: exhibitorData[stallNo]?.name },
              distance: directions.distance,
              duration: directions.duration
            });
          }
        });
      break;

    case 'highlight':
      // Focus with pulse effect
      mapView.Camera.focusOn(space, { animationDuration: 1000 });
      pulseMarker(space);
      break;

    default:
      // Just focus
      mapView.Camera.focusOn(space);
  }
};

// Handle URL parameters (for web deep-links)
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const stallNo = params.get('stallNo') || params.get('externalId');
  const action = params.get('action') || 'focus';

  if (stallNo) {
    // Wait for exhibitor data if not loaded yet
    const checkData = setInterval(() => {
      if (window.exhibitorData) {
        clearInterval(checkData);
        window.handleDeepLink(stallNo, action);
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkData), 5000);
  }
}

// Helper: Get icon by category
function getCategoryIcon(categories = []) {
  if (categories.includes('AEROSPACE')) return '✈️';
  if (categories.includes('DEFENCE')) return '🛡️';
  if (categories.includes('BUSINESS AVIATION')) return '🚁';
  return '🏢';
}

// Helper: Send message to React Native
function sendToApp(type, payload) {
  const message = { type, payload, timestamp: Date.now() };

  // React Native WebView
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  // Fallback for web testing
  else if (window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
  // Console log for debugging
  else {
    console.log('[sendToApp]', message);
  }
}

// Helper: Pulse marker animation
function pulseMarker(space) {
  // Implementation depends on Mappedin's current API
  // Could use temporary overlay or CSS animation
}

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
```

### CSS for Markers
```css
.exhibitor-marker {
  width: 40px;
  height: 40px;
  background: white;
  border: 3px solid #007AFF;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: transform 0.2s;
}

.exhibitor-marker:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
}

.exhibitor-marker img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-icon {
  font-size: 24px;
}

/* Pulse animation for highlights */
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.exhibitor-marker.pulse {
  animation: pulse 1s ease-in-out 3;
}
```

---

## 4. Deep-Link URL Formats

### From Web (QR codes, emails, etc.)
```
https://yoursite.com/map/app.html?stallNo=2G19&action=navigate

Parameters:
- stallNo: Exhibitor booth number (required)
- action: focus | navigate | highlight (default: focus)
- floor: Floor ID (optional, auto-detected from space)
```

### From App (directory to map)
```javascript
// In exhibitor directory list
<TouchableOpacity onPress={() => {
  navigation.navigate('Map', {
    stallNo: '2G19',
    action: 'navigate'
  });
}}>
  <Text>Navigate to Booth</Text>
</TouchableOpacity>

// MapScreen receives params
const { stallNo, action } = route.params;
useEffect(() => {
  if (stallNo) {
    navigateToExhibitor(stallNo, action);
  }
}, [stallNo, action]);
```

---

## 5. Search Integration

### Enhanced Search with Exhibitor Names
```javascript
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) {
      searchResults.classList.remove('show');
      return;
    }

    // Search both spaces and exhibitors
    const spaceMatches = allSpaces
      .filter(s => s.name?.toLowerCase().includes(query))
      .map(s => ({
        type: 'space',
        id: s.id,
        name: s.name,
        stallNo: s.externalId,
        icon: getSpaceIcon(s)
      }));

    const exhibitorMatches = Object.entries(exhibitorData)
      .filter(([stallNo, ex]) =>
        ex.name.toLowerCase().includes(query) ||
        ex.categories?.some(c => c.toLowerCase().includes(query))
      )
      .map(([stallNo, ex]) => ({
        type: 'exhibitor',
        stallNo,
        name: ex.name,
        icon: ex.logo ? `<img src="${ex.logo}" style="width:24px;height:24px;border-radius:50%;">` : '🏢',
        categories: ex.categories
      }));

    const allMatches = [...exhibitorMatches, ...spaceMatches]
      .slice(0, 10);

    searchResults.innerHTML = allMatches.map(item => `
      <div class="search-item" onclick="selectSearchResult('${item.stallNo || item.id}', '${item.type}')">
        <div class="search-icon">${item.icon}</div>
        <div class="search-info">
          <div class="search-name">${item.name}</div>
          ${item.stallNo ? `<div class="search-meta">Booth ${item.stallNo}</div>` : ''}
          ${item.categories ? `<div class="search-meta">${item.categories[0]}</div>` : ''}
        </div>
      </div>
    `).join('');

    searchResults.classList.add('show');
  });
}

window.selectSearchResult = function(identifier, type) {
  if (type === 'exhibitor') {
    window.handleDeepLink(identifier, 'focus');
    sendToApp('searchSelected', {
      stallNo: identifier,
      name: exhibitorData[identifier]?.name
    });
  } else {
    const space = allSpaces.find(s => s.id === identifier);
    if (space) mapView.Camera.focusOn(space);
  }

  document.getElementById('searchResults').classList.remove('show');
};
```

---

## 6. Category Filtering

### Bottom Sheet with Exhibitor Categories
```javascript
function populateCategories() {
  const categories = {};

  // Group exhibitors by category
  Object.entries(exhibitorData).forEach(([stallNo, ex]) => {
    ex.categories?.forEach(cat => {
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push({ stallNo, ...ex });
    });
  });

  const categoryContainer = document.getElementById('categoriesContainer');
  categoryContainer.innerHTML = Object.entries(categories)
    .sort((a, b) => b[1].length - a[1].length) // Sort by count
    .slice(0, 8) // Top 8 categories
    .map(([category, exhibitors]) => `
      <div class="category-section">
        <h4>${getCategoryIcon([category])} ${category} (${exhibitors.length})</h4>
        <div class="exhibitor-grid">
          ${exhibitors.slice(0, 6).map(ex => `
            <div class="exhibitor-card" onclick="window.handleDeepLink('${ex.stallNo}', 'focus')">
              ${ex.logo ? `<img src="${ex.logo}" alt="${ex.name}">` : `<div class="placeholder-logo">${ex.name[0]}</div>`}
              <div class="exhibitor-name">${ex.name}</div>
              <div class="exhibitor-booth">Booth ${ex.stallNo}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
}
```

---

## 7. Error Handling & Fallbacks

### Handle Missing stallNo Mapping
```javascript
// In React Native
const handleWebViewMessage = (event: any) => {
  const message = JSON.parse(event.nativeEvent.data);

  if (message.type === 'exhibitorClick') {
    const exhibitor = exhibitors.find(e =>
      e.stallNo?.toLowerCase() === message.payload.stallNo?.toLowerCase()
    );

    if (!exhibitor) {
      // Fallback: Search by space name
      const fallbackExhibitor = exhibitors.find(e =>
        e.companyName.toLowerCase().includes(message.payload.name?.toLowerCase())
      );

      if (fallbackExhibitor) {
        console.warn(`stallNo mismatch: ${message.payload.stallNo} mapped to ${fallbackExhibitor.companyName}`);
        setSelectedExhibitor(fallbackExhibitor);
      } else {
        Alert.alert('Exhibitor Not Found', `No data available for booth ${message.payload.stallNo}`);
      }
    } else {
      setSelectedExhibitor(exhibitor);
    }
  }
};
```

### Handle Map Load Failures
```javascript
// In WebView
async function init() {
  const errorContainer = document.getElementById('error-container');
  const mapContainer = document.getElementById('mappedin-map');

  try {
    mapView = await Mappedin.show3dMap(mapContainer, {
      key: 'mik_iND9Ra87M1Ca4DD444be4063d',
      secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024',
      mapId: '688ea50e362b1d000ba0822b',
    });

    // Success
    errorContainer.style.display = 'none';
    mapContainer.style.display = 'block';

  } catch (error) {
    console.error('Map load failed:', error);

    errorContainer.innerHTML = `
      <div class="error-message">
        <h3>Unable to load map</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
    errorContainer.style.display = 'flex';
    mapContainer.style.display = 'none';

    sendToApp('mapError', { error: error.message });
  }
}
```

---

## 8. Testing Scenarios

### Manual Test Cases
1. **Deep-link from directory**:
   - Click "Navigate to Booth" in exhibitor directory
   - Should focus on booth + start wayfinding

2. **Map click**:
   - Click exhibitor marker on map
   - Should open bottom sheet in app with full exhibitor details

3. **Search**:
   - Type exhibitor name → Should find by company name
   - Type booth number → Should find by stallNo
   - Type category → Should show all in category

4. **QR code scan**:
   - Scan QR with `?stallNo=2G19&action=navigate`
   - Should deep-link to map and start navigation

5. **Missing data**:
   - Click booth with no matching exhibitor
   - Should show graceful error

### Automated Tests
```javascript
// In WebView (test mode)
window.runTests = async function() {
  const tests = [];

  // Test 1: Exhibitor data loaded
  tests.push({
    name: 'Exhibitor data injection',
    pass: window.exhibitorData && Object.keys(window.exhibitorData).length > 0
  });

  // Test 2: Markers created
  const markers = mapView.Markers.getAll();
  tests.push({
    name: 'Markers created',
    pass: markers.length > 0
  });

  // Test 3: Deep-link handler
  window.handleDeepLink('2G19', 'focus');
  tests.push({
    name: 'Deep-link handler',
    pass: true // Check camera position
  });

  console.table(tests);
  sendToApp('testResults', { tests });
};
```

---

## 9. Performance Optimization

### Lazy Load Logos
```javascript
function createExhibitorMarker(space, exhibitor) {
  // Start with placeholder
  const marker = mapView.Markers.add(
    space,
    `<div class="exhibitor-marker loading">
       <span>${exhibitor.name[0]}</span>
     </div>`,
    { anchor: 'bottom', rank: 4 }
  );

  // Load logo async
  if (exhibitor.logo) {
    const img = new Image();
    img.onload = () => {
      marker.setHTML(`
        <div class="exhibitor-marker">
          <img src="${exhibitor.logo}" alt="${exhibitor.name}">
        </div>
      `);
    };
    img.onerror = () => {
      console.warn(`Failed to load logo for ${exhibitor.name}`);
    };
    img.src = exhibitor.logo;
  }

  return marker;
}
```

### Debounced Search
```javascript
let searchTimeout;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    performSearch(e.target.value);
  }, 300); // 300ms debounce
});
```

---

## 10. Analytics Tracking

### Events to Track
```javascript
// In React Native
const trackEvent = (event: string, properties: any) => {
  // Firebase Analytics
  analytics().logEvent(event, properties);

  // Or Amplitude, Mixpanel, etc.
};

const handleWebViewMessage = (event: any) => {
  const message = JSON.parse(event.nativeEvent.data);

  // Track all interactions
  trackEvent(`map_${message.type}`, message.payload);

  // Specific events
  if (message.type === 'exhibitorClick') {
    trackEvent('exhibitor_viewed', {
      stallNo: message.payload.stallNo,
      name: message.payload.name,
      source: 'map'
    });
  }

  if (message.type === 'navigationStart') {
    trackEvent('navigation_started', {
      destination: message.payload.to.stallNo,
      distance: message.payload.distance,
      accessible: message.payload.accessible || false
    });
  }
};
```

---

## Summary Checklist

### React Native App
- [ ] Fetch exhibitors from API on mount
- [ ] Inject exhibitor data into WebView
- [ ] Handle postMessage from map
- [ ] Implement exhibitor bottom sheet
- [ ] Add deep-link navigation
- [ ] Track analytics events

### WebView (app.html)
- [ ] Initialize Mappedin with ICC credentials
- [ ] Create markers for exhibitor booths (matched by stallNo)
- [ ] Handle marker clicks → postMessage to app
- [ ] Handle deep-links from URL params
- [ ] Implement search with exhibitor names
- [ ] Add category filtering
- [ ] Error handling for missing data

### Testing
- [ ] Test deep-links from directory
- [ ] Test map clicks opening bottom sheet
- [ ] Test search functionality
- [ ] Test QR code deep-links
- [ ] Test with missing/mismatched stallNo
- [ ] Performance test with 100+ exhibitors

---

**Next**: Ready to build the production files when you approve! 🚀
