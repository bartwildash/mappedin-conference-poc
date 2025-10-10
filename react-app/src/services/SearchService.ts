/**
 * Search Service
 *
 * Uses Mappedin Search API (mapData.Search.query and mapData.Search.suggest)
 * Ported from public/js/search-module.js
 */

import type { SearchSuggestion } from '@/types';

export interface SearchOptions {
  debounceDelay?: number;
  maxSuggestions?: number;
  searchBoothNumbers?: boolean;
}

export class SearchService {
  private mapData: any;
  private options: Required<SearchOptions>;

  constructor(mapData: any, options: SearchOptions = {}) {
    this.mapData = mapData;
    this.options = {
      debounceDelay: 300,
      maxSuggestions: 6,
      searchBoothNumbers: true,
      ...options,
    };
  }

  /**
   * Get autocomplete suggestions using Mappedin query API
   */
  async getSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Use query() to get full objects with nodes
      const results = await this.mapData.Search.query(query, {
        enterpriseLocations: {
          fields: {
            name: true,
            tags: true,
            description: true,
          },
          limit: 3,
        },
        places: {
          fields: {
            name: true,
            description: true,
          },
          limit: 3,
        },
      });

      let suggestions: SearchSuggestion[] = [];

      // Process enterprise locations (exhibitors)
      if (results.enterpriseLocations) {
        const locationSuggestions = results.enterpriseLocations.map((result: any) => ({
          name: result.item.name,
          value: result.item.name,
          type: 'enterpriseLocation' as const,
          node: result.item,
          score: result.score,
          match: result.match,
        }));
        suggestions = [...suggestions, ...locationSuggestions];
      }

      // Process places (spaces, POIs, etc.)
      if (results.places) {
        const placeSuggestions = results.places.map((result: any) => ({
          name: result.item.name,
          value: result.item.name,
          type: result.type,
          node: result.item,
          score: result.score,
          match: result.match,
        }));
        suggestions = [...suggestions, ...placeSuggestions];
      }

      // Search booth numbers if enabled
      if (this.options.searchBoothNumbers) {
        const boothResults = this.searchBoothNumbers(query);
        suggestions = [...boothResults, ...suggestions];
      }

      // Sort by score descending
      suggestions.sort((a, b) => (b.score || 0) - (a.score || 0));

      return suggestions.slice(0, this.options.maxSuggestions);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Search booth numbers (externalId) using spaces
   */
  private searchBoothNumbers(query: string): SearchSuggestion[] {
    const queryUpper = query.toUpperCase();
    const results: SearchSuggestion[] = [];

    // Search spaces
    const spaces = this.mapData.getByType('space').filter((space: any) =>
      space.externalId && space.externalId.toUpperCase().includes(queryUpper)
    );

    // Search locations (legacy support)
    const locations = this.mapData.getByType('location').filter((loc: any) =>
      loc.details?.externalId &&
      loc.details.externalId.toUpperCase().includes(queryUpper)
    );

    // Process spaces
    spaces.forEach((space: any) => {
      const isExactMatch = space.externalId.toUpperCase() === queryUpper;
      results.push({
        name: `Booth ${space.externalId}${space.name ? ` - ${space.name}` : ''}`,
        value: space.externalId,
        type: 'booth',
        node: space,
        score: isExactMatch ? 1000 : 500,
        externalId: space.externalId,
        isExactMatch,
      });
    });

    // Process locations
    locations.forEach((location: any) => {
      const isExactMatch =
        location.details.externalId.toUpperCase() === queryUpper;
      results.push({
        name: `Booth ${location.details.externalId} - ${location.details.name}`,
        value: location.details.externalId,
        type: 'booth',
        node: location,
        score: isExactMatch ? 950 : 450,
        externalId: location.details.externalId,
        isExactMatch,
      });
    });

    // Sort by score
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    return results.slice(0, 3);
  }

  /**
   * Get fast text-only suggestions using Mappedin suggest API
   */
  async getFastSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const suggestions = await this.mapData.Search.suggest(query, {
        enterpriseLocations: { enabled: true },
        places: { enabled: true },
      });

      return suggestions.slice(0, this.options.maxSuggestions).map((s: any) => ({
        name: s.suggestion,
        value: s.suggestion,
        type: 'suggestion' as const,
        score: s.score,
      }));
    } catch (error) {
      console.error('Fast suggestions error:', error);
      return [];
    }
  }

  /**
   * Get icon for suggestion type
   */
  static getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
      booth: 'hash',
      enterpriseLocation: 'store',
      location: 'store',
      place: 'building-2',
      category: 'tag',
    };
    return iconMap[type] || 'map-pin';
  }

  /**
   * Get display type name
   */
  static getDisplayType(type: string): string {
    const typeMap: Record<string, string> = {
      booth: 'Booth Number',
      enterpriseLocation: 'Exhibitor',
      location: 'Exhibitor',
      place: 'Place',
      category: 'Category',
    };
    return typeMap[type] || 'Location';
  }
}
