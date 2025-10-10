/**
 * GPS Location Service
 *
 * Handles geolocation, Haversine distance calculation,
 * and finding nearest venue entrance/space
 *
 * Based on Neeth-N/Mappedin-demo implementation
 */

import type { GPSLocation, NearestSpace } from '@/types';

export class GPSLocationService {
  private mapData: any;

  constructor(mapData: any) {
    this.mapData = mapData;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   * Returns distance in meters
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get user's current GPS location
   */
  getCurrentLocation(): Promise<GPSLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // Cache for 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({ latitude, longitude, accuracy });
        },
        (error) => {
          let message = 'Unable to get location';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location access.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out.';
              break;
          }

          reject(new Error(message));
        },
        options
      );
    });
  }

  /**
   * Find nearest space/entrance to user's GPS location
   */
  findNearestSpace(userLat: number, userLon: number): NearestSpace | null {
    const spaces = this.mapData.getByType('space');

    // Filter spaces that have GPS coordinates
    const validSpaces = spaces.filter(
      (space: any) =>
        space.name &&
        space.name.trim() !== '' &&
        space.center &&
        space.center.latitude &&
        space.center.longitude
    );

    if (validSpaces.length === 0) {
      console.warn('No spaces with GPS coordinates found');
      return null;
    }

    let nearestSpace: NearestSpace | null = null;
    let minDistance = Infinity;

    validSpaces.forEach((space: any) => {
      const distance = this.calculateDistance(
        userLat,
        userLon,
        space.center.latitude,
        space.center.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestSpace = {
          id: space.id,
          name: space.name,
          distance,
          center: space.center,
        };
      }
    });

    return nearestSpace;
  }

  /**
   * Get location and find nearest entrance (main entry point)
   */
  async getLocationAndNearestEntrance(): Promise<{
    gps: GPSLocation;
    nearestSpace: NearestSpace | null;
  }> {
    try {
      const gps = await this.getCurrentLocation();
      const nearestSpace = this.findNearestSpace(gps.latitude, gps.longitude);

      return { gps, nearestSpace };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1) {
      return `${Math.round(meters * 100)}cm`;
    } else if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Format accuracy for display
   */
  static formatAccuracy(meters: number): string {
    return `±${Math.round(meters)}m`;
  }
}
