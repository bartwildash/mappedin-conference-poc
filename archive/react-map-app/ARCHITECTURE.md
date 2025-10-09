# React Map Application Architecture

## 📐 Component Architecture

```
App.tsx (Root)
├── MapView (Mappedin SDK)
│   └── MapContainer (Map Logic)
│       ├── SearchBar
│       ├── Controls
│       ├── ExhibitorCard
│       └── NavigationPanel
```

## 🔄 State Management

### Global State (App.tsx)
```typescript
const [selectedSpace, setSelectedSpace] = useState<any>(null);
const [showCard, setShowCard] = useState(false);
const [showNavPanel, setShowNavPanel] = useState(false);
const [accessibleMode, setAccessibleMode] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
```

### Component State
- **SearchBar**: `suggestions`, `showSuggestions`
- **NavigationPanel**: `fromLocation`, `fromInput`, `showPath`

## 🗺️ Mappedin SDK Integration

### Hook Usage
```typescript
const { mapData, mapView } = useMap();
```

### Key Events
```typescript
// Click handling
mapView.on('click', (event) => {
  if (event.spaces?.length > 0) {
    handleSpaceClick(event.spaces[0]);
  }
});
```

### Search Implementation
```typescript
// Using suggest API
const suggestions = await mapData.Search.suggest(query, {
  enterpriseLocations: { enabled: true },
  places: { enabled: true }
});
```

### Navigation Implementation
```typescript
// Directions with accessibility
const directions = await mapData.getDirections(start, end, {
  accessible: accessibleMode
});

// Draw path
mapView.Navigation.draw(directions, {
  pathOptions: { color: '#667eea' }
});

// Auto-zoom to path
mapView.Camera.focusOn(directions.path, {
  minZoom: 1000,
  maxZoom: 3000,
  animationDuration: 800
});
```

## 📦 Component Breakdown

### 1. SearchBar Component
**Purpose**: Autocomplete search for locations/exhibitors

**Props**:
- `value: string` - Current search query
- `onChange: (value: string) => void` - Update query
- `onSearch: (query: string) => void` - Trigger search

**Features**:
- Real-time suggestions
- Keyboard navigation (Enter key)
- Click-to-select suggestions
- Icon integration (Lucide React)

### 2. ExhibitorCard Component
**Purpose**: Display booth/exhibitor information

**Props**:
- `space: any` - Selected space object
- `exhibitorData: Record<string, any[]>` - Exhibitor lookup
- `showNavPanel: boolean` - Controls compact mode
- `onDirections: () => void` - Open navigation
- `onClose: () => void` - Close card

**Features**:
- Single exhibitor display
- Co-exhibitor support (multiple companies)
- Share URL functionality
- Compact mode when navigating

### 3. NavigationPanel Component
**Purpose**: Turn-by-turn navigation UI

**Props**:
- `destination: any` - Target location
- `accessibleMode: boolean` - Accessibility state
- `onAccessibleToggle: () => void` - Toggle accessibility
- `mapData: any` - Mappedin data object
- `mapView: any` - Mappedin view object

**Features**:
- Pin drop for custom start location
- Search-based "from" selection
- Accessible route toggle
- Path visualization
- Clear path button

### 4. Controls Component
**Purpose**: Map control buttons

**Props**:
- `accessibleMode: boolean`
- `onAccessibleToggle: () => void`

**Features**:
- Accessible mode toggle
- Visual active state
- Icon integration

## 🎨 Styling Structure

Each component has its own CSS file following BEM-like naming:

```css
/* SearchBar.css */
.search-container { }
.search-input-wrapper { }
.search-input { }
.search-suggestions { }
.search-suggestion { }

/* ExhibitorCard.css */
.exhibitor-card { }
.exhibitor-card.compact { }
.card-header { }
.card-actions { }
.co-exhibitor { }

/* NavigationPanel.css */
.navigation-panel { }
.nav-field { }
.input-with-icon { }
.accessible-toggle { }

/* Controls.css */
.controls { }
.control-btn { }
.control-btn.active { }
```

## 🔄 Data Flow

### Search Flow
1. User types in SearchBar
2. `onChange` updates parent state
3. `onSearch` triggers suggest API
4. Suggestion selected → `handleSpaceClick()`
5. Camera focuses on location
6. Card displays with exhibitor info

### Navigation Flow
1. User clicks "Directions" on card
2. `onDirections()` shows NavigationPanel
3. Card enters compact mode
4. User sets "from" location (pin/search)
5. "Get Directions" calculates route
6. Path drawn on map
7. Camera auto-zooms to show path
8. "Clear Path" removes route

### State Updates
```
User Action
    ↓
Event Handler (onClick, onChange)
    ↓
State Update (useState setter)
    ↓
Re-render
    ↓
Mappedin API Call (if needed)
    ↓
Visual Update
```

## 🔌 API Integration Points

### Replace Mock Data
```typescript
// Current: src/data/exhibitors.ts
export const exhibitorData = { /* mock */ };

// Production: Fetch from API
const fetchExhibitors = async () => {
  const response = await fetch('/api/exhibitors');
  return await response.json();
};
```

### Environment Variables
```typescript
// .env.local
VITE_MAPPEDIN_KEY=your_key
VITE_MAPPEDIN_SECRET=your_secret
VITE_MAP_ID=your_map_id

// Usage in App.tsx
mapData={{
  key: import.meta.env.VITE_MAPPEDIN_KEY,
  secret: import.meta.env.VITE_MAPPEDIN_SECRET,
  mapId: import.meta.env.VITE_MAP_ID
}}
```

## 📱 React Native Migration Path

### 1. Replace SDK Package
```bash
npm uninstall @mappedin/react-sdk
npm install @mappedin/react-native-sdk react-native-webview
```

### 2. Update Imports
```typescript
// Before (Web)
import { MapView, useMap } from '@mappedin/react-sdk';

// After (Mobile)
import { MapView, useMap } from '@mappedin/react-native-sdk';
```

### 3. Replace Components
```typescript
// Web → React Native
<div> → <View>
<input> → <TextInput>
<button> → <TouchableOpacity>/<Pressable>
className → style={styles.x}
onClick → onPress
```

### 4. Update Styles
```typescript
// Before (CSS)
.search-container { padding: 16px; }

// After (StyleSheet)
const styles = StyleSheet.create({
  searchContainer: {
    padding: 16
  }
});
```

## 🧪 Testing Strategy

### Unit Tests
- Component rendering
- State updates
- Event handlers
- Props validation

### Integration Tests
- Search flow end-to-end
- Navigation flow end-to-end
- Card display logic
- API integration

### E2E Tests
- User search journey
- User navigation journey
- Mobile responsiveness

## 🚀 Performance Optimizations

### Current Optimizations
- Component-level state (avoid unnecessary re-renders)
- Event debouncing (search input)
- Conditional rendering (showCard, showNavPanel)

### Future Optimizations
- React.memo() for pure components
- useMemo() for expensive calculations
- useCallback() for event handlers
- Virtual scrolling for suggestion lists
- Code splitting (React.lazy)

## 📊 Comparison: HTML vs React

| Aspect | HTML Version | React Version |
|--------|-------------|---------------|
| **State** | Global variables | React hooks |
| **Events** | addEventListener | onClick/onChange |
| **Rendering** | innerHTML | JSX components |
| **Styling** | Inline + CSS | Component CSS |
| **Modularity** | Functions | Components |
| **Reusability** | Copy-paste | Import/Export |
| **Type Safety** | ❌ None | ✅ TypeScript |
| **Testing** | Manual | Jest/RTL |
| **Mobile** | Responsive CSS | React Native |

## 🎯 Key Learnings from React Native Examples

From the Mappedin React Native SDK examples:

1. **useMap() hook** provides mapData and mapView
2. **Event system** uses same API as web SDK
3. **Search API** uses suggest() and query() methods
4. **Navigation** uses getDirections() and mapView.Navigation
5. **Camera control** via mapView.Camera.focusOn()
6. **WebView wrapper** enables web SDK in native apps

## 🔗 Dependencies

### Core
- `react` ^18.2.0
- `react-dom` ^18.2.0
- `@mappedin/mappedin-js` ^6.0.0
- `@mappedin/react-sdk` ^6.0.0

### UI
- `lucide-react` ^0.294.0 (icons)

### Build
- `vite` ^5.0.0
- `typescript` ^5.3.0
- `@vitejs/plugin-react` ^4.2.0

## 📝 Next Development Steps

1. ✅ Component structure
2. ✅ State management
3. ✅ Mappedin integration
4. ✅ Search implementation
5. ✅ Navigation system
6. ⏳ API integration
7. ⏳ Error handling
8. ⏳ Loading states
9. ⏳ Unit tests
10. ⏳ React Native version
