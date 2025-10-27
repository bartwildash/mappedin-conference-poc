# Mappedin Deep Linking Guide - Conference POC

This guide explains how to implement deep linking for the Mappedin conference map application, enabling navigation from notifications, QR codes, web links, and other app screens directly to specific locations on the map.

## Table of Contents

1. [Overview](#overview)
2. [Location Identifiers](#location-identifiers)
3. [Deep Link URL Structure](#deep-link-url-structure)
4. [External ID Setup](#external-id-setup)
5. [Implementation Guide](#implementation-guide)
6. [Complete Flow Examples](#complete-flow-examples)
7. [React Native Integration](#react-native-integration)
8. [Web Integration](#web-integration)
9. [QR Code Integration](#qr-code-integration)
10. [Testing & Debugging](#testing--debugging)
11. [Best Practices](#best-practices)

---

## Overview

Deep linking allows users to navigate directly to specific locations on the Mappedin conference map from:

- **Push notifications** (event reminders, session starting soon)
- **QR codes** (booth signs, posters, badges)
- **Web links** (emails, websites, social media)
- **App screens** (exhibitor list, schedule, bookmarks)
- **Share functionality** (share booth location with colleagues)

### Why Use External IDs?

Mappedin provides three ways to reference locations:

| Type | Example | Stability | Best For |
|------|---------|-----------|----------|
| **External ID** | `booth-1c01` | ✅ Stable | **Recommended** - You control it |
| Location Name | `Samsung Booth` | ⚠️ Can change | Search, display |
| Location ID | `s_abc123...` | ❌ Mappedin internal | Never use for deep links |

**External IDs are the ONLY stable way to reference locations across:
- CMS updates
- Map republishes
- Venue changes
- Multi-year events

---

## Location Identifiers

### 1. External ID (Recommended)

External IDs are custom identifiers you assign in the Mappedin CMS. They're stable, human-readable, and perfect for deep linking.

**Format:**
```
booth-{booth-number}
amenity-{type}-{number}
room-{name}
```

**Examples:**
```
booth-1c01
booth-2b14
amenity-restroom-1
amenity-cafe-main
room-seminar-a
```

### 2. Location Name

Location names are user-facing but can change over time.

**Examples:**
```
"Samsung Innovation Booth"
"Main Entrance"
"Conference Room A"
```

**Use for:**
- Search functionality
- User display
- Fallback if external ID missing

**Don't use for:**
- Deep links (unstable)
- Persistent references

### 3. Location ID (Avoid)

Mappedin's internal database IDs. These can change when venues are republished.

**Format:**
```
s_abc123def456...
```

**Never use for:**
- Deep links
- Persistent storage
- External references

---

## Deep Link URL Structure

### Basic Format

```
{scheme}://{host}/{path}?{parameters}
```

### For Mobile App (Custom Scheme)

```
amda://map?location={externalId}
```

### For Web (HTTPS)

```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor={externalId}
```

### Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `location` | string | External ID of location | `booth-1c01` |
| `exhibitor` | string | External ID of exhibitor (web) | `booth-1c01` |
| `floor` | string | Floor ID to display | `level-2` |
| `zoom` | number | Zoom level (1-22) | `19` |
| `bearing` | number | Camera rotation (0-360°) | `90` |
| `pitch` | number | Camera tilt (0-68°) | `45` |
| `search` | string | Pre-fill search query | `restroom` |
| `navigate` | boolean | Open directions modal | `true` |
| `from` | string | Starting point for directions | `booth-1a01` |
| `to` | string | Destination for directions | `booth-1c01` |

### Example URLs

**Navigate to booth:**
```
amda://map?location=booth-1c01
```

**Navigate with floor and zoom:**
```
amda://map?location=booth-1c01&floor=level-2&zoom=19
```

**Show directions to booth:**
```
amda://map?to=booth-1c01&navigate=true
```

**Directions between two booths:**
```
amda://map?from=booth-1a01&to=booth-1c01&navigate=true
```

**Open map with search:**
```
amda://map?search=restroom
```

**Web deep link:**
```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=booth-1c01
```

---

## External ID Setup

### Step 1: Mappedin CMS Configuration

Log in to Mappedin CMS and assign external IDs to all locations:

**For Exhibitor Booths:**
```
Booth Number: 1C01
External ID: booth-1c01
Name: Samsung Innovation Booth
```

**For Amenities:**
```
Location Type: Restroom
External ID: amenity-restroom-level2-north
Name: Restroom (Level 2 North)
```

**For Rooms:**
```
Location Type: Meeting Room
External ID: room-seminar-a
Name: Seminar Room A
```

### Step 2: Data Sync

Ensure your exhibitor data includes external IDs:

**public/data/exhibitors.json:**
```json
{
  "exhibitors": [
    {
      "externalId": "booth-1c01",
      "name": "Samsung Innovation",
      "boothNumber": "1C01",
      "category": "Exhibitor",
      "description": "...",
      "website": "https://samsung.com"
    }
  ]
}
```

### Step 3: Mapping Convention

**Recommended naming convention:**

| Type | Format | Example |
|------|--------|---------|
| Exhibitor | `booth-{number}` | `booth-1c01` |
| Co-Exhibitor | `booth-{number}` | `booth-1c01` (same as main) |
| Restroom | `amenity-restroom-{floor}-{location}` | `amenity-restroom-2-north` |
| Cafe | `amenity-cafe-{name}` | `amenity-cafe-main` |
| Elevator | `amenity-elevator-{floor}-{location}` | `amenity-elevator-2-east` |
| Stairs | `amenity-stairs-{floor}-{location}` | `amenity-stairs-1-west` |
| Room | `room-{name}` | `room-seminar-a` |

**Rules:**
- Always lowercase
- Use hyphens, not spaces
- Be consistent across CMS and app data
- Keep it short but descriptive

---

## Implementation Guide

### Current POC Implementation

The Mappedin Conference POC already has deep linking support:

**✅ Implemented:**
- URL hash navigation (`#exhibitor=EXTERNAL_ID`)
- Programmatic navigation via postMessage
- React Native WebView bridge
- Iframe bridge
- Navigation utility functions

**File: `src/lib/utils/navigation.ts`**

Key functions:
```typescript
// Navigate to exhibitor by external ID
export async function navigateToExhibitor(externalId: string): Promise<boolean>

// Parse URL hash for deep links
export function parseDeepLinkHash(): { type: string; id: string } | null

// Handle initial deep link on page load
export function handleInitialDeepLink(): void
```

### How It Works (Web App)

**1. URL Hash Navigation:**

User visits:
```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=booth-1c01
```

App automatically:
```typescript
// src/lib/utils/navigation.ts
export function handleInitialDeepLink(): void {
  const deepLink = parseDeepLinkHash();
  if (deepLink?.type === 'exhibitor') {
    navigateToExhibitor(deepLink.id);
  }
}
```

**2. Programmatic Navigation:**

From React Native or iframe parent:
```typescript
// React Native
webViewRef.current?.postMessage(JSON.stringify({
  type: 'navigate:exhibitor',
  payload: { externalId: 'booth-1c01' }
}));

// Iframe
iframe.contentWindow.postMessage({
  type: 'navigate:exhibitor',
  payload: { externalId: 'booth-1c01' }
}, '*');
```

**3. Map Focus:**

```typescript
// src/lib/utils/navigation.ts
export async function navigateToExhibitor(externalId: string): Promise<boolean> {
  // Find exhibitor data
  const exhibitor = exhibitorData.find(e => e.externalId === externalId);

  // Find location on map
  const location = locations.find(loc =>
    loc.profile?.externalId === externalId
  );

  // Focus camera
  view.Camera.focusOn({
    nodes: [location.space],
    minZoom: 22,
    animate: true
  });

  // Show exhibitor card
  selectedExhibitor.set(exhibitor);
  exhibitorCardOpen.set(true);

  return true;
}
```

---

## Complete Flow Examples

### Example 1: Notification → Map Focus

**Scenario:** User bookmarked IoT Workshop at Booth 1C01. App sends notification 15 minutes before event starts.

**Backend (Send Notification):**

```typescript
// server/services/eventReminderService.ts
import { sendPushNotification } from './pushNotificationService';

async function sendEventReminder(user: User, event: Event) {
  const booth = event.location; // { externalId: "booth-1c01" }

  await sendPushNotification({
    userId: user.id,
    title: 'Event Starting Soon',
    body: `${event.title} at Booth ${booth.boothNumber} in 15 minutes`,
    data: {
      type: 'event_reminder',
      eventId: event.id,
      // Deep link to booth
      url: `amda://map?location=${booth.externalId}`
    }
  });
}
```

**Mobile App (Handle Notification):**

```typescript
// mobile/src/services/NotificationService.ts
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

Notifications.addNotificationResponseReceivedListener((response) => {
  const { url } = response.notification.request.content.data;

  if (url) {
    // url = "amda://map?location=booth-1c01"
    Linking.openURL(url);
  }
});
```

**Mobile App (Deep Link Handler):**

```typescript
// mobile/src/navigation/LinkingConfiguration.ts
export default {
  prefixes: ['amda://', 'https://amda.events'],
  config: {
    screens: {
      Map: {
        path: 'map',
        parse: {
          location: (location: string) => location,
          zoom: (zoom: string) => parseInt(zoom, 10),
          floor: (floor: string) => floor
        }
      }
    }
  }
};
```

**Mobile App (Map Screen):**

```typescript
// mobile/src/screens/MapScreen.tsx
import { useRoute } from '@react-navigation/native';

export function MapScreen() {
  const route = useRoute();
  const { location: externalId } = route.params || {};

  useEffect(() => {
    if (externalId && webViewRef.current) {
      // Send to web map
      webViewRef.current.postMessage(JSON.stringify({
        type: 'navigate:exhibitor',
        payload: { externalId }
      }));
    }
  }, [externalId]);

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://bartwildash.github.io/mappedin-conference-poc/' }}
      onMessage={handleMessage}
    />
  );
}
```

**Web Map (Navigate):**

```typescript
// src/lib/utils/webview-bridge.ts
window.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'navigate:exhibitor') {
    navigateToExhibitor(message.payload.externalId);
  }
});
```

**Result:** User taps notification → App opens → Map shows → Camera focuses on Booth 1C01 → Exhibitor card displays

---

### Example 2: QR Code → Booth Details

**Scenario:** Conference attendee scans QR code on booth sign.

**QR Code URL:**
```
https://amda.events/booth/1c01
```

**Backend (Redirect Endpoint):**

```typescript
// server/routes/booth.ts
app.get('/booth/:boothNumber', (req, res) => {
  const { boothNumber } = req.params;
  const externalId = `booth-${boothNumber.toLowerCase()}`;

  // Redirect to app with deep link
  res.redirect(`amda://map?location=${externalId}`);
});
```

**Mobile App (Universal Links):**

```json
// ios/.well-known/apple-app-site-association
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.amda.conference",
      "paths": ["/booth/*"]
    }]
  }
}
```

**Result:** User scans QR → Opens in app → Map focuses on booth

---

### Example 3: Exhibitor List → Map

**Scenario:** User browses exhibitor list, taps "Show on Map" button.

**Exhibitor List Screen:**

```typescript
// mobile/src/screens/ExhibitorListScreen.tsx
import { useNavigation } from '@react-navigation/native';

function ExhibitorCard({ exhibitor }) {
  const navigation = useNavigation();

  const showOnMap = () => {
    navigation.navigate('Map', {
      location: exhibitor.externalId // "booth-1c01"
    });
  };

  return (
    <View>
      <Text>{exhibitor.name}</Text>
      <Text>Booth {exhibitor.boothNumber}</Text>
      <Button title="Show on Map" onPress={showOnMap} />
    </View>
  );
}
```

**Map Screen:**

```typescript
// Receives externalId via navigation params
// Sends to WebView as shown in Example 1
```

---

### Example 4: Share Booth Location

**Scenario:** User wants to share booth location with colleague.

**Share Function:**

```typescript
// mobile/src/screens/MapScreen.tsx
import { Share } from 'react-native';

async function shareBooth(exhibitor: Exhibitor) {
  const deepLink = `https://amda.events/booth/${exhibitor.boothNumber.toLowerCase()}`;

  await Share.share({
    title: `Visit ${exhibitor.name} at Booth ${exhibitor.boothNumber}`,
    message: `Check out ${exhibitor.name} at Booth ${exhibitor.boothNumber}!\n\n${deepLink}`,
    url: deepLink // iOS
  });
}
```

**Web Share (PWA):**

```typescript
// src/lib/utils/share.ts
export async function shareBooth(exhibitor: Exhibitor) {
  const url = `${window.location.origin}${window.location.pathname}#exhibitor=${exhibitor.externalId}`;

  if (navigator.share) {
    await navigator.share({
      title: exhibitor.name,
      text: `Visit ${exhibitor.name} at Booth ${exhibitor.boothNumber}`,
      url
    });
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(url);
    toasts.show('Link copied to clipboard', 'success');
  }
}
```

---

## React Native Integration

### Complete Setup

**1. Install Dependencies:**

```bash
npm install react-native-webview @react-navigation/native
```

**2. Configure Linking:**

```typescript
// mobile/src/navigation/LinkingConfiguration.ts
import { LinkingOptions } from '@react-navigation/native';

const linking: LinkingOptions<any> = {
  prefixes: ['amda://', 'https://amda.events'],
  config: {
    screens: {
      Map: {
        path: 'map',
        parse: {
          location: (location: string) => location,
          to: (to: string) => to,
          from: (from: string) => from,
          zoom: (zoom: string) => parseInt(zoom, 10),
          floor: (floor: string) => floor,
          search: (search: string) => search,
          navigate: (navigate: string) => navigate === 'true'
        }
      }
    }
  }
};

export default linking;
```

**3. WebView Integration:**

```typescript
// mobile/src/screens/MapScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

export function MapScreen() {
  const route = useRoute();
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Handle messages FROM web app
  const handleMessage = (event: any) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'map:ready':
        setIsMapReady(true);
        console.log('Map is ready');
        break;

      case 'exhibitor:selected':
        // User clicked "Open in App" button
        // Navigate to exhibitor detail screen
        navigation.navigate('ExhibitorDetail', message.payload);
        break;
    }
  };

  // Handle deep link parameters
  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return;

    const params = route.params || {};

    // Navigate to location
    if (params.location) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'navigate:exhibitor',
        payload: { externalId: params.location }
      }));
    }

    // Show directions
    if (params.navigate && (params.from || params.to)) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'navigate:directions',
        payload: {
          from: params.from,
          to: params.to
        }
      }));
    }

    // Pre-fill search
    if (params.search) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'search',
        payload: { query: params.search }
      }));
    }
  }, [isMapReady, route.params]);

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://bartwildash.github.io/mappedin-conference-poc/' }}
      onMessage={handleMessage}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}
```

---

## Web Integration

### URL Hash Navigation

**Current Implementation:**

```typescript
// src/lib/utils/navigation.ts

// Parse URL hash
export function parseDeepLinkHash(): { type: string; id: string } | null {
  const hash = window.location.hash.slice(1); // Remove '#'

  // Match patterns like: exhibitor=booth-1c01
  const match = hash.match(/^(\w+)=(.+)$/);

  if (match) {
    const [, type, id] = match;
    if (type.toLowerCase() === 'exhibitor' || type.toLowerCase() === 'externalid') {
      return { type: 'exhibitor', id: decodeURIComponent(id) };
    }
  }

  return null;
}

// Handle on page load
export function handleInitialDeepLink(): void {
  const deepLink = parseDeepLinkHash();

  if (deepLink?.type === 'exhibitor') {
    console.log('[Navigation] Processing deep link:', deepLink.id);
    navigateToExhibitor(deepLink.id);
  }
}
```

**Usage:**

```typescript
// src/App.svelte
import { onMount } from 'svelte';
import { handleInitialDeepLink } from '$lib/utils/navigation';

onMount(() => {
  // Handle deep links from URL hash
  handleInitialDeepLink();
});
```

### Query Parameters (Alternative)

**If you prefer query parameters over hash:**

```typescript
// src/lib/utils/navigation.ts
export function parseDeepLinkQuery(): { type: string; id: string } | null {
  const params = new URLSearchParams(window.location.search);

  const exhibitor = params.get('exhibitor');
  const location = params.get('location');

  if (exhibitor) {
    return { type: 'exhibitor', id: exhibitor };
  }

  if (location) {
    return { type: 'exhibitor', id: location };
  }

  return null;
}
```

**URL format:**
```
https://bartwildash.github.io/mappedin-conference-poc/?exhibitor=booth-1c01
```

---

## QR Code Integration

### QR Code Generation

**Backend Service:**

```typescript
// server/services/qrCodeService.ts
import QRCode from 'qrcode';

export async function generateBoothQR(exhibitor: Exhibitor): Promise<Buffer> {
  const deepLink = `https://amda.events/booth/${exhibitor.boothNumber.toLowerCase()}`;

  return await QRCode.toBuffer(deepLink, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}

// Generate QR code with logo
export async function generateBoothQRWithLogo(exhibitor: Exhibitor): Promise<Buffer> {
  const deepLink = `https://amda.events/booth/${exhibitor.boothNumber.toLowerCase()}`;

  return await QRCode.toBuffer(deepLink, {
    width: 400,
    margin: 3,
    errorCorrectionLevel: 'H' // High - allows logo overlay
  });
}
```

**Bulk Generation:**

```typescript
// scripts/generateQRCodes.ts
import fs from 'fs';
import path from 'path';
import exhibitors from '../data/exhibitors.json';
import { generateBoothQR } from '../services/qrCodeService';

async function generateAllQRCodes() {
  const outputDir = path.join(__dirname, '../output/qr-codes');
  fs.mkdirSync(outputDir, { recursive: true });

  for (const exhibitor of exhibitors) {
    const qrCode = await generateBoothQR(exhibitor);
    const filename = `booth-${exhibitor.boothNumber.toLowerCase()}.png`;
    fs.writeFileSync(path.join(outputDir, filename), qrCode);
    console.log(`Generated QR code for ${exhibitor.name}`);
  }
}

generateAllQRCodes();
```

### QR Code Scanning

**Mobile App:**

```typescript
// mobile/src/screens/QRScannerScreen.tsx
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Linking } from 'react-native';

export function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    // data = "https://amda.events/booth/1c01"
    Linking.openURL(data);
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <BarCodeScanner
      onBarCodeScanned={handleBarCodeScanned}
      style={StyleSheet.absoluteFillObject}
    />
  );
}
```

---

## Testing & Debugging

### Testing Deep Links (iOS)

**Simulator:**
```bash
# Test custom scheme
xcrun simctl openurl booted "amda://map?location=booth-1c01"

# Test universal link
xcrun simctl openurl booted "https://amda.events/booth/1c01"
```

**Device:**
```bash
# Via Safari
# Open: amda://map?location=booth-1c01

# Via Terminal (device connected)
xcrun devicectl device info url --device YOUR_DEVICE_ID "amda://map?location=booth-1c01"
```

### Testing Deep Links (Android)

**Emulator:**
```bash
# Test custom scheme
adb shell am start -a android.intent.action.VIEW -d "amda://map?location=booth-1c01"

# Test app link
adb shell am start -a android.intent.action.VIEW -d "https://amda.events/booth/1c01"
```

### Testing Web Deep Links

**Browser Console:**
```javascript
// Change URL hash
window.location.hash = '#exhibitor=booth-1c01';

// Test navigation function
import { navigateToExhibitor } from './src/lib/utils/navigation';
navigateToExhibitor('booth-1c01');
```

**URL Testing:**
```
# Test different formats
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=booth-1c01
https://bartwildash.github.io/mappedin-conference-poc/?exhibitor=booth-1c01
```

### Debugging Checklist

**When deep links don't work:**

1. **Check External ID exists:**
   ```typescript
   console.log('All exhibitors:', exhibitorData.map(e => e.externalId));
   console.log('Looking for:', externalId);
   ```

2. **Check location on map:**
   ```typescript
   const locations = mapData.getByType('location');
   const location = locations.find(loc => loc.profile?.externalId === externalId);
   console.log('Found location:', location);
   ```

3. **Check map is loaded:**
   ```typescript
   console.log('Map view:', mapView);
   console.log('Map data:', mapData);
   ```

4. **Check message passing (React Native):**
   ```typescript
   // In WebView
   console.log('[WebView] Received message:', message);

   // In React Native
   console.log('[RN] Sending message:', JSON.stringify(message));
   ```

5. **Check URL parsing:**
   ```typescript
   const deepLink = parseDeepLinkHash();
   console.log('Parsed deep link:', deepLink);
   ```

### Logging Best Practices

**Add prefixes to logs:**
```typescript
console.log('[DeepLink]', 'Navigating to:', externalId);
console.log('[WebView]', 'Message received:', message.type);
console.log('[Navigation]', 'Camera focus complete');
```

---

## Best Practices

### 1. Always Use External IDs

✅ **Good:**
```typescript
const deepLink = `amda://map?location=${exhibitor.externalId}`;
// "amda://map?location=booth-1c01"
```

❌ **Bad:**
```typescript
const deepLink = `amda://map?location=${exhibitor.name}`;
// "amda://map?location=Samsung Innovation Booth" (can change!)
```

### 2. Validate External IDs

```typescript
export async function navigateToExhibitor(externalId: string): Promise<boolean> {
  // Validate format
  if (!externalId || typeof externalId !== 'string') {
    console.error('[Navigation] Invalid external ID:', externalId);
    return false;
  }

  // Check if exists
  const exhibitor = exhibitorData.find(e => e.externalId === externalId);
  if (!exhibitor) {
    toasts.show(`Exhibitor not found: ${externalId}`, 'error');
    return false;
  }

  // Find on map
  const location = locations.find(loc => loc.profile?.externalId === externalId);
  if (!location || !location.space) {
    toasts.show(`Location not found on map: ${externalId}`, 'error');
    return false;
  }

  // Navigate
  view.Camera.focusOn({ nodes: [location.space], minZoom: 22, animate: true });
  return true;
}
```

### 3. Handle Async Loading

```typescript
// Wait for map to be ready
let mapReadyResolver: (() => void) | null = null;
const mapReadyPromise = new Promise<void>(resolve => {
  mapReadyResolver = resolve;
});

export async function navigateToExhibitor(externalId: string): Promise<boolean> {
  // Wait for map to load
  await mapReadyPromise;

  // Now safe to navigate
  const view = get(mapView);
  if (!view) {
    console.error('[Navigation] Map view not available');
    return false;
  }

  // ... rest of navigation
}
```

### 4. Provide User Feedback

```typescript
export async function navigateToExhibitor(externalId: string): Promise<boolean> {
  // Show loading
  toasts.show('Navigating to exhibitor...', 'info', 1000);

  // Attempt navigation
  const success = await performNavigation(externalId);

  if (success) {
    toasts.show(`Navigating to ${exhibitor.name}`, 'success', 2000);
  } else {
    toasts.show('Could not find exhibitor', 'error', 3000);
  }

  return success;
}
```

### 5. Fallback Strategies

```typescript
// Try multiple methods to find location
const location =
  // Method 1: External ID (preferred)
  locations.find(loc => loc.profile?.externalId === externalId) ||

  // Method 2: Name match (fallback)
  locations.find(loc =>
    loc.name?.toLowerCase() === exhibitor.name.toLowerCase()
  ) ||

  // Method 3: Booth number in name
  locations.find(loc =>
    loc.name?.includes(exhibitor.boothNumber)
  );
```

### 6. URL Encoding

```typescript
// Always encode external IDs in URLs
const url = `amda://map?location=${encodeURIComponent(externalId)}`;

// And decode when parsing
const externalId = decodeURIComponent(params.get('location'));
```

### 7. Documentation

Document all external IDs in your codebase:

```typescript
/**
 * External ID Format:
 * - Exhibitors: booth-{booth-number}
 * - Amenities: amenity-{type}-{location}
 * - Rooms: room-{name}
 *
 * Examples:
 * - booth-1c01
 * - amenity-restroom-2-north
 * - room-seminar-a
 */
export const EXTERNAL_ID_FORMATS = {
  EXHIBITOR: /^booth-[a-z0-9]+$/,
  AMENITY: /^amenity-[a-z]+-[a-z0-9-]+$/,
  ROOM: /^room-[a-z-]+$/
};
```

---

## Additional Resources

### Files in This Repository

- **EMBEDDING_GUIDE.md** - React Native WebView and iframe embedding
- **src/lib/utils/navigation.ts** - Deep linking implementation
- **src/lib/utils/webview-bridge.ts** - React Native communication
- **src/lib/utils/iframe-bridge.ts** - Iframe communication

### External Links

- [Mappedin Web SDK Documentation](https://developer.mappedin.com/web-sdk/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [React Native Linking API](https://reactnative.dev/docs/linking)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [Android App Links](https://developer.android.com/training/app-links)

---

## Summary

**Deep linking with Mappedin is simple when you:**

1. ✅ Use external IDs (not names or internal IDs)
2. ✅ Set up consistent naming convention
3. ✅ Implement URL hash or query parameter parsing
4. ✅ Validate and provide feedback
5. ✅ Test on all platforms (iOS, Android, Web)
6. ✅ Document your external ID format

**With this setup, users can:**
- Tap notification → See booth on map
- Scan QR code → Navigate to booth
- Click web link → Open in app
- Share booth location → Colleague opens directly on map

**This POC already has the foundation:**
- ✅ URL hash navigation working
- ✅ External ID search and navigation
- ✅ WebView and iframe bridges
- ✅ Toast notifications for feedback

**You just need to:**
1. Ensure all locations have external IDs in Mappedin CMS
2. Configure React Native linking (if using mobile app)
3. Test deep links on your platform

---

**Generated with Claude Code** • Last updated: October 27, 2025
