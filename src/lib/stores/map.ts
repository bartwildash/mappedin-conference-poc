import { writable, derived } from 'svelte/store';
import type { MapView, MapData, MappedinLocation, MappedinNode } from '@mappedin/mappedin-js';
import type { MapState, PathfindingState } from '$lib/types/mappedin';

// Map state
export const mapView = writable<MapView | null>(null);
export const mapData = writable<MapData | null>(null);
export const currentFloor = writable<string | null>(null);
export const currentZoom = writable<number>(19);
export const accessibleMode = writable<boolean>(true);

// Pathfinding state
export const pathfindingFrom = writable<MappedinLocation | MappedinNode | null>(null);
export const pathfindingTo = writable<MappedinLocation | MappedinNode | null>(null);
export const currentPath = writable<any | null>(null);

// Amenities store (spaces like restrooms, cafes, etc)
export interface AmenityItem {
  name: string;
  type: 'restroom' | 'cafe' | 'elevator' | 'stairs' | 'prayer' | 'media' | 'meeting' | 'service' | 'security' | 'atm' | 'information' | 'other';
  space: any; // MappedinSpace
  categories: string[];
}

export const amenities = writable<AmenityItem[]>([]);

// Derived state
export const isMapReady = derived(
  [mapView, mapData],
  ([$mapView, $mapData]) => $mapView !== null && $mapData !== null
);

export const hasActivePath = derived(
  currentPath,
  ($currentPath) => $currentPath !== null
);

// Actions
export function clearPath() {
  pathfindingFrom.set(null);
  pathfindingTo.set(null);
  currentPath.set(null);
}

export function setPathfindingPoints(from: MappedinLocation | MappedinNode | null, to: MappedinLocation | MappedinNode | null) {
  pathfindingFrom.set(from);
  pathfindingTo.set(to);
}

// Search amenities
export const searchAmenities = derived(
  amenities,
  ($amenities) => (query: string) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return $amenities.filter(amenity =>
      amenity.name.toLowerCase().includes(lowerQuery) ||
      amenity.type.toLowerCase().includes(lowerQuery)
    );
  }
);
