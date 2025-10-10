/**
 * TypeScript Type Definitions
 * Based on vanilla JS implementation patterns
 */

export interface Exhibitor {
  id: string;
  name: string;
  externalId?: string;
  spaceIds?: string[];
  category?: string;
  categories?: string[];
  capabilities?: string[];
  coExhibitorIds?: string[];
  logoUrl?: string;
  icon?: string;
  website?: string;
  description?: string;
  floor?: string;
  status?: 'open' | 'closed';
  openingHours?: {
    start: string;
    end: string;
  };
}

export interface ExhibitorDB {
  byId: Record<string, Exhibitor>;
  byExternalId: Record<string, string>; // externalId -> exhibitorId
  bySpaceId: Record<string, string[]>; // spaceId -> exhibitorIds[]
  all: Exhibitor[];
}

export interface SearchSuggestion {
  name: string;
  value: string;
  type: 'booth' | 'enterpriseLocation' | 'location' | 'place' | 'amenity' | 'suggestion';
  node?: any;
  score?: number;
  match?: any;
  externalId?: string;
  isExactMatch?: boolean;
}

export interface LocationSelection {
  name: string;
  type: 'booth' | 'space' | 'location' | 'coordinate' | 'suggestion';
  node: any;
  externalId?: string;
  coordinate?: [number, number, number];
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface NearestSpace {
  id: string;
  name: string;
  distance: number;
  center: {
    latitude: number;
    longitude: number;
  };
}

export interface DirectionsResult {
  distance: number;
  instructions: DirectionInstruction[];
  path?: any[];
  coordinates?: any[];
}

export interface DirectionInstruction {
  action: string | { type: string };
  distance?: number;
  node?: any;
  connection?: any;
  coordinate?: [number, number, number];
}

export interface FloorData {
  id: string;
  name: string;
  elevation: number;
  shortName?: string;
}

export interface MapClickEvent {
  spaces?: any[];
  locations?: any[];
  coordinate?: [number, number, number];
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  type?: NotificationType;
}
