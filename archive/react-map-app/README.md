# Mappedin Conference Map - React Version

React implementation of the Mappedin conference venue map with search, navigation, and exhibitor information.

## 🎯 Features

### ✅ Core Functionality
- **3D Interactive Map** - ICC venue rendering with Mappedin SDK
- **Search with Autocomplete** - Mappedin suggest API integration
- **Turn-by-Turn Navigation** - Accessible routing with elevator preferences
- **Exhibitor Cards** - Display booth information and co-exhibitors
- **Responsive Design** - Mobile-optimized (iOS/Android ready)

### ✅ Navigation Features
- Accessible mode toggle (prefers elevators/ramps)
- Pin drop for custom start location
- Auto-zoom to show complete path
- Clear path functionality
- Real-time route calculation

### ✅ Search Features
- Live autocomplete suggestions
- Booth number search (externalId)
- Mappedin locations and places search
- Direct result selection

## 📁 Project Structure

```
react-map-app/
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx          # Search with autocomplete
│   │   ├── ExhibitorCard.tsx      # Booth/exhibitor info card
│   │   ├── NavigationPanel.tsx    # Directions UI
│   │   └── Controls.tsx           # Map controls (accessible toggle)
│   ├── data/
│   │   └── exhibitors.ts          # Mock exhibitor data
│   ├── hooks/
│   │   └── (custom hooks)
│   ├── types/
│   │   └── (TypeScript types)
│   ├── App.tsx                    # Main app component
│   └── App.css                    # Global styles
├── package.json
└── README.md
```

## 🚀 Getting Started

### Installation

```bash
cd react-map-app
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
npm run preview
```

## 🔧 Configuration

### Map Credentials

Update in `src/App.tsx`:

```typescript
<MapView
  mapData={{
    key: 'YOUR_MAPPEDIN_KEY',
    secret: 'YOUR_MAPPEDIN_SECRET',
    mapId: 'YOUR_MAP_ID'
  }}
>
```

### Exhibitor Data

Update `src/data/exhibitors.ts`:

```typescript
export const exhibitorData: Record<string, any[]> = {
  'BOOTH_NUMBER': [{
    name: 'Company Name',
    country: 'Country',
    description: 'Description',
    website: 'https://...',
    logo: 'https://...',  // Optional
    social: 'https://...' // Optional
  }]
};
```

## 📱 React Native Version

To create a React Native twin:

1. Use `@mappedin/react-native-sdk` instead of `@mappedin/react-sdk`
2. Replace DOM elements with React Native components:
   - `<div>` → `<View>`
   - `<input>` → `<TextInput>`
   - `<button>` → `<TouchableOpacity>`
3. Use React Native WebView for map rendering

### React Native Setup

```bash
npx create-expo-app@latest conference-map-mobile --template blank-typescript
cd conference-map-mobile
npm install @mappedin/react-native-sdk react-native-webview
```

### React Native Map Component

```tsx
import { MapView, useMap } from '@mappedin/react-native-sdk';
import { View, StyleSheet } from 'react-native';

const App = () => (
  <View style={styles.container}>
    <MapView
      mapData={{
        key: "YOUR_KEY",
        secret: "YOUR_SECRET",
        mapId: "YOUR_MAP_ID"
      }}
      options={{}}
    />
  </View>
);
```

## 🎨 Customization

### Styling

Each component has its own CSS file:
- `SearchBar.css` - Search bar and suggestions
- `ExhibitorCard.css` - Card layout and animations
- `NavigationPanel.css` - Navigation UI
- `Controls.css` - Map controls

### Adding Features

1. **New Component**: Create in `src/components/`
2. **State Management**: Use React hooks or context
3. **Map Events**: Subscribe using `mapView.on()` in useEffect

## 📚 Key Hooks & APIs

### Mappedin Hooks

```typescript
const { mapData, mapView } = useMap();
```

### Search API

```typescript
// Autocomplete suggestions
const suggestions = await mapData.Search.suggest(query, {
  enterpriseLocations: { enabled: true },
  places: { enabled: true }
});

// Select suggestion
if (suggestion.node) {
  mapView.Camera.focusOn(suggestion.node);
}
```

### Navigation API

```typescript
const directions = await mapData.getDirections(start, end, {
  accessible: true  // Prefers elevators
});

mapView.Navigation.draw(directions, {
  pathOptions: { color: '#667eea' }
});
```

## 🔗 Useful Links

- [Mappedin React SDK Docs](https://developer.mappedin.com/web-sdk/using-react)
- [React Native SDK Docs](https://developer.mappedin.com/react-native-sdk/getting-started)
- [Mappedin SDK Examples](https://github.com/MappedIn/react-native/tree/master/SDKv6_Examples)

## 📝 Migration from HTML Version

This React version maintains feature parity with the HTML version:

| Feature | HTML Version | React Version |
|---------|-------------|---------------|
| Search | ✅ Vanilla JS | ✅ React Component |
| Navigation | ✅ Inline handlers | ✅ React Hooks |
| Card Display | ✅ DOM manipulation | ✅ React State |
| Responsive | ✅ Media queries | ✅ CSS + React |
| Accessibility | ✅ Global variable | ✅ React State |

### Key Differences

1. **State Management**: React useState/useEffect vs vanilla JS variables
2. **Event Handling**: React synthetic events vs addEventListener
3. **Rendering**: JSX components vs innerHTML
4. **Modularity**: Component-based vs function-based

## 🚀 Next Steps

1. Replace mock exhibitor data with API integration
2. Add user location detection (GPS/Bluetooth beacons)
3. Implement saved favorites/bookmarks
4. Add AR wayfinding for mobile
5. Multi-language support

## 📄 License

PROPRIETARY - Conference POC
