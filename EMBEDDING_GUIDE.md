# Embedding Guide - React Native WebView & Iframe Integration

This guide explains how to embed the Mappedin Conference Map in your React Native mobile app or website iframe.

## Table of Contents

1. [React Native WebView Integration](#react-native-webview-integration)
2. [Iframe Embedding](#iframe-embedding)
3. [Deep Linking with ExternalId](#deep-linking-with-externalid)
4. [Message Protocol Reference](#message-protocol-reference)
5. [Project Pavilion Integration](#project-pavilion-integration)

---

## React Native WebView Integration

### Installation

```bash
npm install react-native-webview
```

### Basic Implementation

```typescript
import React, { useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

const MAP_URL = 'https://bartwildash.github.io/mappedin-conference-poc/';

export function ConferenceMapWebView() {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Handle messages from web app
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from map:', message);

      switch (message.type) {
        case 'map:ready':
          setIsMapReady(true);
          console.log('Map is ready!');
          break;

        case 'exhibitor:selected':
          console.log('User selected exhibitor:', message.payload);
          // Navigate to exhibitor detail screen in your app
          navigateToExhibitorDetail(message.payload);
          break;

        case 'navigation:back':
          console.log('User wants to go back to app');
          // Handle back navigation
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  };

  // Send navigation command to web app
  const navigateToExhibitor = (externalId: string) => {
    if (!isMapReady) {
      console.warn('Map not ready yet');
      return;
    }

    const message = JSON.stringify({
      type: 'navigate:exhibitor',
      payload: { externalId }
    });

    webViewRef.current?.postMessage(message);
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: MAP_URL }}
      onMessage={handleMessage}
      style={{ flex: 1 }}
      // Performance optimizations
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      // iOS specific
      bounces={false}
      scrollEnabled
      decelerationRate="normal"
      // Android specific
      androidLayerType="hardware"
    />
  );
}
```

### Deep Linking to Specific Exhibitor

```typescript
// Navigate to specific exhibitor on mount
useEffect(() => {
  if (isMapReady && exhibitorId) {
    navigateToExhibitor(exhibitorId);
  }
}, [isMapReady, exhibitorId]);
```

### Handling "Open in App" Button

When user clicks "Open in App" on an exhibitor card:

```typescript
const navigateToExhibitorDetail = (exhibitor: {
  externalId: string;
  name: string;
  boothNumber?: string;
  description?: string;
  website?: string;
}) => {
  // Navigate to your app's exhibitor detail screen
  navigation.navigate('ExhibitorDetail', {
    externalId: exhibitor.externalId,
    name: exhibitor.name,
    boothNumber: exhibitor.boothNumber
  });
};
```

---

## Iframe Embedding

### Responsive Iframe Wrapper

The map automatically detects iframe embedding and sends height updates. Use this HTML wrapper:

```html
<!-- 16:9 Responsive Iframe -->
<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe
    id="conference-map"
    src="https://bartwildash.github.io/mappedin-conference-poc/"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    allowfullscreen
    loading="lazy"
  ></iframe>
</div>
```

### JavaScript Iframe Communication

```html
<script>
const iframe = document.getElementById('conference-map');

// Listen for messages from map
window.addEventListener('message', (event) => {
  // Security: Validate origin
  if (!event.origin.includes('github.io')) return;

  const message = event.data;

  // Validate message source
  if (message.source !== 'mappedin-conference-map') return;

  console.log('Message from map:', message);

  switch (message.type) {
    case 'iframe:ready':
      console.log('Map loaded:', message.payload);
      break;

    case 'iframe:height':
      // Optional: Adjust iframe height dynamically
      console.log('Content height:', message.payload.height);
      break;

    case 'exhibitor:clicked':
      console.log('User clicked exhibitor:', message.payload);
      // Handle exhibitor click (e.g., open modal, navigate)
      showExhibitorModal(message.payload);
      break;
  }
});

// Send navigation command to iframe
function navigateToExhibitor(externalId) {
  iframe.contentWindow.postMessage({
    type: 'navigate:exhibitor',
    payload: { externalId: externalId }
  }, '*');
}
</script>
```

### Iframe Height Auto-Adjustment

```javascript
// Automatically adjust iframe height based on content
window.addEventListener('message', (event) => {
  if (event.data.type === 'iframe:height') {
    const iframe = document.getElementById('conference-map');
    iframe.style.height = event.data.payload.height + 'px';
  }
});
```

---

## Deep Linking with ExternalId

### URL Hash Navigation

Navigate directly to an exhibitor using URL hash:

```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=EXHIBITOR_EXTERNAL_ID
```

Example:
```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=ABC123
```

### Programmatic Navigation

#### From React Native:

```typescript
const message = JSON.stringify({
  type: 'navigate:exhibitor',
  payload: { externalId: 'ABC123' }
});

webViewRef.current?.postMessage(message);
```

#### From Iframe Parent:

```javascript
iframe.contentWindow.postMessage({
  type: 'navigate:exhibitor',
  payload: { externalId: 'ABC123' }
}, '*');
```

---

## Message Protocol Reference

### Messages FROM Web App → Parent

#### `map:ready`

Sent when map is fully loaded and ready.

```json
{
  "type": "map:ready"
}
```

#### `exhibitor:selected`

User clicked "Open in App" button.

```json
{
  "type": "exhibitor:selected",
  "payload": {
    "externalId": "ABC123",
    "name": "Example Corp",
    "boothNumber": "A-101",
    "description": "Leading provider of...",
    "website": "https://example.com"
  }
}
```

#### `exhibitor:clicked` (iframe only)

User clicked an exhibitor on the map.

```json
{
  "type": "exhibitor:clicked",
  "source": "mappedin-conference-map",
  "payload": {
    "externalId": "ABC123",
    "name": "Example Corp",
    "boothNumber": "A-101"
  }
}
```

#### `iframe:height` (iframe only)

Content height changed (for responsive iframes).

```json
{
  "type": "iframe:height",
  "source": "mappedin-conference-map",
  "payload": {
    "height": 800,
    "scrollHeight": 850
  }
}
```

#### `navigation:back`

User wants to return to parent app.

```json
{
  "type": "navigation:back"
}
```

### Messages TO Web App ← Parent

#### `navigate:exhibitor`

Navigate map to specific exhibitor.

```json
{
  "type": "navigate:exhibitor",
  "payload": {
    "externalId": "ABC123"
  }
}
```

#### `theme:change`

Change map theme (optional).

```json
{
  "type": "theme:change",
  "payload": {
    "theme": "dark"
  }
}
```

---

## Project Pavilion Integration

This map is designed to integrate seamlessly with the `project-pavilion` mobile app.

### Linking from Pavilion to Map

When user taps an exhibitor in project-pavilion:

```typescript
// In project-pavilion
function openExhibitorOnMap(exhibitor: Exhibitor) {
  navigation.navigate('ConferenceMapWebView', {
    initialExternalId: exhibitor.externalId
  });
}
```

Then in WebView screen:

```typescript
const { initialExternalId } = route.params;

useEffect(() => {
  if (isMapReady && initialExternalId) {
    navigateToExhibitor(initialExternalId);
  }
}, [isMapReady, initialExternalId]);
```

### Linking from Map back to Pavilion

When user clicks "Open in App" on map:

```typescript
// Handle message in WebView
case 'exhibitor:selected':
  // Close map, return to pavilion with exhibitor data
  navigation.navigate('ExhibitorDetail', {
    externalId: message.payload.externalId,
    name: message.payload.name,
    // ... other data
  });
  break;
```

### ExternalId Consistency

Ensure exhibitor `externalId` matches between:
- Mappedin location `profile.externalId`
- Project-pavilion exhibitor data
- Your backend database

Example data structure:

```json
{
  "externalId": "EXHIBITOR_ABC123",
  "name": "Example Corp",
  "boothNumber": "A-101",
  "description": "...",
  "website": "https://example.com",
  "category": "Exhibitor"
}
```

---

## Testing

### Test in React Native

```typescript
// Test navigation
navigateToExhibitor('ABC123');

// Test message handling
console.log('Waiting for exhibitor:selected message...');
```

### Test in Iframe

```javascript
// Open browser console
navigateToExhibitor('ABC123');

// Check for messages
window.addEventListener('message', console.log);
```

### Test Deep Linking

Visit these URLs directly:

```
https://bartwildash.github.io/mappedin-conference-poc/#exhibitor=ABC123
```

---

## Debugging

### Enable Verbose Logging

Messages are logged with prefixes:

- `[WebView Bridge]` - React Native WebView communication
- `[Iframe Bridge]` - Iframe communication
- `[Navigation]` - Deep linking and navigation
- `[App]` - General application logs

### Check Environment Detection

Open browser console:

```javascript
// Check if in WebView
typeof window.ReactNativeWebView !== 'undefined'

// Check if in iframe
window.self !== window.top
```

---

## Performance Optimization

### React Native WebView

```typescript
<WebView
  // Enable hardware acceleration
  androidLayerType="hardware"
  // Reduce memory usage
  cacheEnabled
  cacheMode="LOAD_CACHE_ELSE_NETWORK"
  // Optimize scrolling
  decelerationRate="normal"
  bounces={false}
/>
```

### Iframe

```html
<!-- Lazy load iframe when in viewport -->
<iframe loading="lazy" ... />

<!-- Preconnect to map domain -->
<link rel="preconnect" href="https://bartwildash.github.io" />
```

---

## Common Issues

### Issue: Map not loading in iframe

**Solution**: Check CSP headers. The map allows embedding from:
- `*.github.io`
- `*.cloudflare.com`
- `*.pages.dev`

### Issue: Messages not received in React Native

**Solution**: Ensure `onMessage` prop is set on WebView. The map injects `window.ReactNativeWebView.postMessage` only if `onMessage` is defined.

### Issue: Deep linking not working

**Solution**: Check URL hash format: `#exhibitor=EXTERNAL_ID` (case-sensitive)

---

## Support

For issues or questions:
- GitHub: [mappedin-conference-poc/issues](https://github.com/bartwildash/mappedin-conference-poc/issues)
- Check browser console for error messages
- Enable verbose logging (`console.log` statements)

---

## Example: Complete React Native Integration

```typescript
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { WebView } from 'react-native-webview';

export function ConferenceMapScreen({ route, navigation }) {
  const { exhibitorId } = route.params || {};
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  const handleMessage = (event) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'map:ready':
        setIsReady(true);
        break;

      case 'exhibitor:selected':
        navigation.navigate('ExhibitorDetail', message.payload);
        break;

      case 'navigation:back':
        navigation.goBack();
        break;
    }
  };

  useEffect(() => {
    if (isReady && exhibitorId) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'navigate:exhibitor',
          payload: { externalId: exhibitorId }
        })
      );
    }
  }, [isReady, exhibitorId]);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://bartwildash.github.io/mappedin-conference-poc/' }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1 }}
      />
    </View>
  );
}
```

---

**Generated with Claude Code** • Last updated: October 27, 2025
