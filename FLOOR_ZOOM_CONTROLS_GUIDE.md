# Floor and Zoom Controls Component - Guide

## 🎯 Overview

The `FloorZoomControls` component provides elegant, minimalist floor selection and zoom controls for your Mappedin map, styled to match the clone-card design pattern.

**Features:**
- 🏢 **Floor Selector** - Dropdown with all floors sorted by elevation
- ➕ **Zoom Controls** - In/Out buttons with smooth animations
- 🎨 **Clone-Card Styling** - Matches refined minimalist aesthetic
- 📱 **Mobile Optimized** - 44px+ touch targets, responsive
- 🌙 **Dark Mode** - Apple HIG color palette
- ♿ **Accessible** - ARIA labels, keyboard navigation

## 📁 Files

### JavaScript
- **`public/js/floor-zoom-controls.js`** - Component module (180 lines)

### CSS
- **`public/css/floor-zoom-controls.css`** - Complete styling (220 lines)

## 🚀 Usage

### Basic Implementation

```javascript
// After map is initialized
const floorZoomControls = new FloorZoomControls(mapData, mapView);
floorZoomControls.init();
```

### With Options

```javascript
const floorZoomControls = new FloorZoomControls(mapData, mapView, {
  position: 'top-right',        // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  showFloorSelector: true,      // Show/hide floor dropdown
  showZoomControls: true        // Show/hide zoom buttons
});

floorZoomControls.init();
```

### Position Options

```javascript
// Top right (default)
{ position: 'top-right' }  // position: absolute; top: 20px; right: 20px;

// Top left
{ position: 'top-left' }   // position: absolute; top: 20px; left: 20px;

// Bottom right
{ position: 'bottom-right' } // position: absolute; bottom: 20px; right: 20px;

// Bottom left
{ position: 'bottom-left' }  // position: absolute; bottom: 20px; left: 20px;
```

## 🎨 Component Structure

### HTML Output

```html
<div class="floor-zoom-controls position-top-right">
  <!-- Floor Selector (if showFloorSelector: true) -->
  <div class="floor-selector-wrapper">
    <span class="floor-icon">🏢</span>
    <select class="floor-select" aria-label="Select floor">
      <option value="floor-1-id">Ground Floor</option>
      <option value="floor-2-id">Level 2</option>
      <option value="floor-3-id">Level 3</option>
    </select>
  </div>

  <!-- Zoom Controls (if showZoomControls: true) -->
  <div class="zoom-controls-wrapper">
    <button class="zoom-btn zoom-in" aria-label="Zoom in">+</button>
    <button class="zoom-btn zoom-out" aria-label="Zoom out">−</button>
  </div>
</div>
```

### Visual Appearance

**Floor Selector**:
- White background with soft shadow
- Building icon (🏢) + dropdown
- Rounded corners (12px)
- Clean grey input background (#f3f3f5)

**Zoom Buttons**:
- Two stacked buttons (+ / −)
- White background with soft shadow
- Hover: Blue (#6a9cff) with scale effect
- Active: Scale down animation

## 📊 API Reference

### Constructor

```javascript
new FloorZoomControls(mapData, mapView, options)
```

**Parameters:**
- `mapData` - Mappedin MapData instance
- `mapView` - Mappedin MapView instance
- `options` - Configuration object (optional)

**Options:**
```javascript
{
  position: string,            // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  showFloorSelector: boolean,  // Show floor dropdown (default: true)
  showZoomControls: boolean    // Show zoom buttons (default: true)
}
```

### Methods

#### `init()`
Initialize and render the controls.

```javascript
const controls = new FloorZoomControls(mapData, mapView);
controls.init();
```

**Returns:** `this` (for chaining)

#### `destroy()`
Remove controls from DOM and cleanup.

```javascript
controls.destroy();
```

#### `show()`
Show the controls (if previously hidden).

```javascript
controls.show();
```

#### `hide()`
Hide the controls without removing from DOM.

```javascript
controls.hide();
```

#### `setPosition(position)`
Change the position of the controls.

```javascript
controls.setPosition('bottom-left');
```

**Parameters:**
- `position` - One of: `'top-right'`, `'top-left'`, `'bottom-right'`, `'bottom-left'`

## 🎨 Styling

### Default Colors (Light Mode)

| Element | Background | Text | Hover |
|---------|-----------|------|-------|
| Container | `white` | - | - |
| Floor icon | - | emoji | - |
| Floor select | `#f3f3f5` | `#1a1a1a` | `#e9e9ee` |
| Zoom button | `#f3f3f5` | `#1a1a1a` | `#6a9cff` (blue) |

### Dark Mode Colors

| Element | Background | Text | Hover |
|---------|-----------|------|-------|
| Container | `#1c1c1e` | - | - |
| Floor select | `#2c2c2e` | `#f5f5f7` | `#38383a` |
| Zoom button | `#2c2c2e` | `#f5f5f7` | `#5a8eef` (blue) |

### Customization

Override CSS variables or classes:

```css
/* Custom positioning */
.floor-zoom-controls.position-top-right {
  top: 30px;
  right: 30px;
}

/* Custom colors */
.floor-select {
  background: #your-color;
  color: #your-text-color;
}

.zoom-btn:hover {
  background: #your-accent-color;
}

/* Custom sizing */
.zoom-btn {
  width: 40px;
  height: 40px;
  font-size: 22px;
}

/* Custom shadows */
.floor-selector-wrapper,
.zoom-controls-wrapper {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

## 📱 Mobile Optimization

### Touch Targets

| Element | Desktop | Mobile | Standard |
|---------|---------|--------|----------|
| Floor select | Auto height | 15px font | - |
| Zoom buttons | 36×36px | 44×44px | ✅ Apple HIG (44px min) |

### Responsive Behavior

```css
@media (max-width: 768px) {
  /* Larger touch targets */
  .zoom-btn {
    width: 44px;
    height: 44px;
  }

  /* Better spacing */
  .floor-selector-wrapper {
    padding: 10px 14px;
  }

  /* Larger font (prevents iOS zoom) */
  .floor-select {
    font-size: 15px;
  }
}
```

## 🔧 Integration Examples

### Example 1: Top-Right with Both Controls

```javascript
// Default usage
const controls = new FloorZoomControls(mapData, mapView);
controls.init();
```

**Result**: Floor selector + zoom buttons in top-right corner

### Example 2: Floor Selector Only (Top-Left)

```javascript
const controls = new FloorZoomControls(mapData, mapView, {
  position: 'top-left',
  showZoomControls: false
});
controls.init();
```

**Use case**: When you have separate zoom controls or want minimal UI

### Example 3: Zoom Controls Only (Bottom-Right)

```javascript
const controls = new FloorZoomControls(mapData, mapView, {
  position: 'bottom-right',
  showFloorSelector: false
});
controls.init();
```

**Use case**: Single-floor venue, only need zoom

### Example 4: Dynamic Show/Hide

```javascript
const controls = new FloorZoomControls(mapData, mapView);
controls.init();

// Hide when showing directions
directionsButton.addEventListener('click', () => {
  controls.hide();
  showDirections();
});

// Show when directions closed
closeDirectionsButton.addEventListener('click', () => {
  controls.show();
});
```

### Example 5: Position Toggle

```javascript
const controls = new FloorZoomControls(mapData, mapView);
controls.init();

// Move to bottom-right on mobile
if (window.innerWidth < 768) {
  controls.setPosition('bottom-right');
}

// Respond to orientation changes
window.addEventListener('resize', () => {
  if (window.innerWidth < 768) {
    controls.setPosition('bottom-right');
  } else {
    controls.setPosition('top-right');
  }
});
```

## 🎭 Event Handling

### Floor Change Events

The component automatically syncs with floor changes:

```javascript
// Component updates when floor changes
mapView.setFloor('floor-2-id');
// → Floor selector updates to "Level 2"

// Floor selector changes update the map
// User selects "Level 3" in dropdown
// → mapView.setFloor() is called
// → 'floor-change' event fires
// → Component updates (if changed externally)
```

### Floor Change Listener

```javascript
// Listen for floor changes
mapView.on('floor-change', (event) => {
  console.log('Floor changed to:', event.floor.name);

  // Custom logic
  if (event.floor.elevation > 0) {
    showUpperFloorWarning();
  }
});
```

## 🐛 Troubleshooting

### Controls Not Showing

**Problem:** Component initialized but not visible

**Solutions:**
1. Check if floors exist:
   ```javascript
   const floors = mapData.getByType('floor');
   console.log('Available floors:', floors);
   ```

2. Verify z-index conflicts:
   ```css
   .floor-zoom-controls { z-index: 1000; }
   ```

3. Check position conflicts:
   ```css
   /* Make sure no other element overlaps */
   .other-element { z-index: 999; }
   ```

### Floor Selector Empty

**Problem:** Dropdown has no options

**Solutions:**
```javascript
// Check if floors are available
const controls = new FloorZoomControls(mapData, mapView);
controls.init();

// Debug
const floors = mapData.getByType('floor');
console.log('Floors found:', floors.length);
console.log('Floors data:', floors);
```

### Zoom Buttons Not Working

**Problem:** Clicking zoom buttons does nothing

**Solutions:**
1. Verify Camera API is available:
   ```javascript
   console.log('zoomIn available:', typeof mapView.Camera.zoomIn);
   console.log('zoomOut available:', typeof mapView.Camera.zoomOut);
   ```

2. Check Mappedin SDK version:
   ```javascript
   // Ensure you're using v6+
   import { getMapData } from '@mappedin/mappedin-js';
   ```

### Position Not Updating

**Problem:** `setPosition()` doesn't work

**Solutions:**
```javascript
// Check if component is initialized
if (!controls.container) {
  console.error('Controls not initialized - call init() first');
  return;
}

// Verify position value
const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
if (!validPositions.includes(position)) {
  console.error('Invalid position:', position);
}
```

## 🎓 Design Principles

### Clone-Card Pattern

The component follows the clone-card minimalist design:

1. **Clean backgrounds** - Solid white/dark with subtle shadows
2. **Rounded corners** - 8-12px throughout
3. **Minimal borders** - No borders, only backgrounds
4. **Soft shadows** - `0 4px 16px rgba(0,0,0,0.1)`
5. **Subtle interactions** - Scale/color changes on hover
6. **Consistent spacing** - 8px grid (4px, 8px, 12px)
7. **Icon + content** - Leading icons for visual hierarchy

### Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Space, Enter, Arrow keys)
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Screen reader compatible
- ✅ Touch target sizes (44px minimum)

## 📚 Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/css/floor-zoom-controls.css">
  <script src="/js/floor-zoom-controls.js"></script>
</head>
<body>
  <div id="map"></div>

  <script type="module">
    import { getMapData, show3dMap } from '@mappedin/mappedin-js';

    async function init() {
      // Get map data
      const mapData = await getMapData({
        key: 'your-key',
        secret: 'your-secret',
        mapId: 'your-map-id'
      });

      // Show 3D map
      const mapView = await show3dMap(
        document.getElementById('map'),
        mapData
      );

      // Initialize floor/zoom controls
      const controls = new FloorZoomControls(mapData, mapView, {
        position: 'top-right',
        showFloorSelector: true,
        showZoomControls: true
      });

      controls.init();

      console.log('✅ Map and controls initialized');
    }

    init();
  </script>
</body>
</html>
```

## ✅ Summary

**What You Get:**
- ✅ Elegant floor selector with building icon
- ✅ Smooth zoom controls with animations
- ✅ Clone-card minimalist styling
- ✅ Mobile-optimized (44px+ touch targets)
- ✅ Dark mode support (Apple HIG colors)
- ✅ Flexible positioning (4 corners)
- ✅ Show/hide/destroy methods
- ✅ Auto-sync with floor changes
- ✅ Fully accessible
- ✅ Print-friendly (hidden in print)

**Best Practices:**
- Always call `init()` after creating instance
- Use `destroy()` when removing controls
- Position controls to avoid UI overlap
- Test on mobile devices for touch targets
- Provide keyboard navigation
- Handle single-floor venues gracefully

---

**For more information:**
- [Interactive Directions Guide](./INTERACTIVE_DIRECTIONS_GUIDE.md)
- [Refined Styling Changelog](./REFINED_STYLING_CHANGELOG.md)
- [Mappedin Web SDK Docs](https://docs.mappedin.com/web/v6/latest/)
