/**
 * Navigation Utilities - Deep Linking & ExternalId Navigation
 *
 * Handles navigation to exhibitors and locations using externalId from project-pavilion.
 */

import { get } from 'svelte/store';
import { mapView, mapData } from '$lib/stores/map';
import { exhibitors, selectedExhibitor } from '$lib/stores/exhibitors';
import { exhibitorCardOpen, locationCardOpen, selectedLocation } from '$lib/stores/ui';
import { toasts } from '$lib/stores/toast';

/**
 * Navigate to exhibitor by externalId
 * This is the primary deep linking function for project-pavilion integration
 */
export async function navigateToExhibitor(externalId: string): Promise<boolean> {
  console.log('[Navigation] Navigating to exhibitor:', externalId);

  const view = get(mapView);
  const data = get(mapData);
  const exhibitorData = get(exhibitors);

  if (!view || !data) {
    console.error('[Navigation] Map not ready');
    toasts.show('Map is loading, please wait...', 'warning');
    return false;
  }

  // Find exhibitor by externalId
  const exhibitor = exhibitorData.find(
    (e) => e.externalId === externalId
  );

  if (!exhibitor) {
    console.warn('[Navigation] Exhibitor not found:', externalId);
    toasts.show(`Exhibitor not found: ${externalId}`, 'error');
    return false;
  }

  // Find location in Mappedin data
  const locations = data.getByType('location');
  const location = locations.find(
    (loc: any) => loc.profile?.externalId === externalId
  );

  if (!location || !location.space) {
    console.warn('[Navigation] Location not found on map:', externalId);
    toasts.show(`Location not found for ${exhibitor.name}`, 'error');
    return false;
  }

  // Focus camera on location
  try {
    view.Camera.focusOn({
      nodes: [location.space],
      minZoom: 22,
      animate: true
    });

    // Add marker
    view.Markers.removeAll();
    view.Markers.add(location.space, `
      <div class="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg font-semibold">
        ${exhibitor.name}
      </div>
    `);

    // Show exhibitor card
    selectedExhibitor.set(exhibitor);
    exhibitorCardOpen.set(true);

    toasts.show(`Navigating to ${exhibitor.name}`, 'success', 2000);
    console.log('[Navigation] Successfully navigated to:', exhibitor.name);

    return true;
  } catch (error) {
    console.error('[Navigation] Failed to navigate:', error);
    toasts.show('Failed to navigate to location', 'error');
    return false;
  }
}

/**
 * Navigate to location by space or object
 * General-purpose navigation for amenities, rooms, etc.
 */
export async function navigateToLocation(mapObject: any, options?: {
  zoom?: number;
  showMarker?: boolean;
  markerText?: string;
}): Promise<boolean> {
  const view = get(mapView);

  if (!view) {
    console.error('[Navigation] Map not ready');
    return false;
  }

  const {
    zoom = 22,
    showMarker = true,
    markerText
  } = options || {};

  try {
    // Focus camera
    view.Camera.focusOn({
      nodes: [mapObject],
      minZoom: zoom,
      animate: true
    });

    // Add marker if requested
    if (showMarker) {
      view.Markers.removeAll();
      view.Markers.add(mapObject, `
        <div class="bg-teal-500 text-white px-3 py-2 rounded-lg shadow-lg font-semibold">
          ${markerText || mapObject.name || 'Location'}
        </div>
      `);
    }

    return true;
  } catch (error) {
    console.error('[Navigation] Failed to navigate to location:', error);
    return false;
  }
}

/**
 * Parse URL hash parameters for deep linking
 * Supports formats like: #exhibitor=ABC123 or #externalId=ABC123
 */
export function parseDeepLinkHash(): { type: string; id: string } | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.slice(1); // Remove #
  if (!hash) return null;

  // Parse key=value format
  const match = hash.match(/^(\w+)=(.+)$/);
  if (!match) return null;

  const [, type, id] = match;

  // Normalize type
  const normalizedType = type.toLowerCase();
  if (normalizedType === 'exhibitor' || normalizedType === 'externalid') {
    return { type: 'exhibitor', id: decodeURIComponent(id) };
  }

  return null;
}

/**
 * Handle deep link from URL hash on app load
 */
export function handleInitialDeepLink(): void {
  const deepLink = parseDeepLinkHash();

  if (!deepLink) return;

  console.log('[Navigation] Processing deep link:', deepLink);

  // Wait for map to be ready, then navigate
  const checkMapReady = setInterval(() => {
    const view = get(mapView);
    const data = get(mapData);

    if (view && data) {
      clearInterval(checkMapReady);

      if (deepLink.type === 'exhibitor') {
        navigateToExhibitor(deepLink.id);
      }
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => clearInterval(checkMapReady), 10000);
}

/**
 * Update URL hash without page reload
 */
export function setDeepLinkHash(externalId: string): void {
  if (typeof window === 'undefined') return;

  const newHash = `#exhibitor=${encodeURIComponent(externalId)}`;
  window.history.replaceState(null, '', newHash);
}

/**
 * Clear URL hash
 */
export function clearDeepLinkHash(): void {
  if (typeof window === 'undefined') return;

  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Get all exhibitor externalIds (useful for debugging)
 */
export function getAllExternalIds(): string[] {
  const exhibitorData = get(exhibitors);
  return exhibitorData
    .map(e => e.externalId)
    .filter(Boolean) as string[];
}
