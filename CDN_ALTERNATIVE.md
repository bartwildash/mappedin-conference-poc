# CDN Alternative (Not Recommended)

## Current Setup (Recommended ✅)

**NPM Package:**
```javascript
// index.html
import { getMapData, show3dMap } from '@mappedin/mappedin-js';
import '@mappedin/mappedin-js/lib/index.css';
```

**Benefits:**
- Version locked in package.json
- Bundled with your app (faster)
- Works offline
- TypeScript support
- Smaller total bundle size (tree-shaking)

## CDN Alternative (Legacy ⚠️)

If you need to use the CDN version:

### Step 1: Remove NPM Package

```bash
npm uninstall @mappedin/mappedin-js
```

### Step 2: Update index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Add Mappedin CSS from CDN -->
  <link href="https://d1p5cqqchvbqmy.cloudfront.net/web2/release/mappedin-web.css" rel="stylesheet">
</head>
<body>
  <!-- Your content -->

  <!-- Add Mappedin JS from CDN -->
  <script src="https://d1p5cqqchvbqmy.cloudfront.net/web2/release/mappedin-web.js"></script>

  <script>
    // CDN exposes global Mappedin object
    const { getMapData, show3dMap } = window.Mappedin;

    // Rest of your code...
  </script>
</body>
</html>
```

### Step 3: Update Imports

Remove ES6 imports, use global `window.Mappedin`:

```javascript
// Before (NPM)
import { getMapData, show3dMap } from '@mappedin/mappedin-js';

// After (CDN)
const { getMapData, show3dMap } = window.Mappedin;
```

## Comparison

| Feature | NPM (Current ✅) | CDN (Legacy) |
|---------|------------------|--------------|
| **Bundle Size** | Optimized (tree-shaking) | Full SDK loaded |
| **Load Time** | Faster (bundled) | Extra HTTP request |
| **Offline** | Works | Requires connection |
| **Version Control** | package.json | Manual URL update |
| **TypeScript** | Full support | Limited |
| **Build Tool** | Required (Vite) | Optional |
| **Caching** | App-level | CDN-level |

## Why NPM is Better

1. **Performance:**
   - Single bundled file vs. multiple requests
   - Tree-shaking removes unused code
   - Better caching strategy

2. **Development:**
   - TypeScript autocompletion
   - Version locking
   - Dependency management

3. **Production:**
   - Works offline after first load
   - No external CDN dependency
   - Faster subsequent loads

## When to Use CDN

Only use CDN if:
- ❌ No build tool available (plain HTML)
- ❌ Multiple apps sharing same SDK (CDN caching)
- ❌ Quick prototyping without setup

**For your production app:** Stick with NPM ✅

## Your Current Bundle Analysis

```bash
# Check what's in your bundle
npm run build

# Output shows:
dist/assets/index-DOLS7EvE.js    3,108.48 kB  # Includes Mappedin SDK
dist/assets/index-DXfiSx10.css      25.30 kB  # Includes Mappedin CSS
```

**Mappedin SDK is already bundled in these files!**

## Verification

Your current setup is correct and optimal. The CDN URLs you shared are:
- ❌ Not used in your project
- ❌ Not needed
- ❌ Would be redundant

**Stick with your current NPM-based setup.** ✅

---

**Bottom Line:** You're already using the best approach. No changes needed!
