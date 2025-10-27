import type { MapView, MapData, MappedinLocation, MappedinNode, MappedinSpace } from '@mappedin/mappedin-js';

export interface ExhibitorData {
  externalId: string;
  name: string;
  boothNumber: string;
  category?: string;
  description?: string;
  website?: string;
  logo?: string;
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface MapState {
  mapView: MapView | null;
  mapData: MapData | null;
  currentFloor: string | null;
  currentZoom: number;
  accessibleMode: boolean;
}

export interface PathfindingState {
  from: MappedinLocation | MappedinNode | null;
  to: MappedinLocation | MappedinNode | null;
  currentPath: any | null;
}

export interface SearchResult {
  type: 'exhibitor' | 'space' | 'amenity';
  name: string;
  location?: MappedinLocation;
  space?: MappedinSpace;
  node?: MappedinNode;
  exhibitorData?: ExhibitorData;
}
