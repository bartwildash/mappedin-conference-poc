import { writable, derived } from 'svelte/store';
import type { ExhibitorData } from '$lib/types/mappedin';
import { API_CONFIG, getConferenceVendorsURL, isAPIConfigured } from '$lib/config/api';

// Exhibitor data store
export const exhibitors = writable<ExhibitorData[]>([]);
export const selectedExhibitor = writable<ExhibitorData | null>(null);
export const isLoading = writable<boolean>(false);
export const loadError = writable<string | null>(null);

/**
 * Load exhibitors from Dollarydoos Admin API
 *
 * Data Flow:
 * 1. Check cache (5-minute TTL)
 * 2. Fetch from /api/external/conference/vendors (if cache miss/expired)
 * 3. Transform response → ExhibitorData[]
 * 4. Update store + cache
 */
export async function loadExhibitors(): Promise<ExhibitorData[]> {
  isLoading.set(true);
  loadError.set(null);

  try {
    // Check cache first (5-minute TTL)
    const cached = getCachedExhibitors();
    if (cached) {
      console.log(`✅ Loaded ${cached.length} exhibitors from cache`);
      exhibitors.set(cached);
      isLoading.set(false);
      return cached;
    }

    // Fetch from Dollarydoos API if configured
    if (isAPIConfigured()) {
      const apiUrl = getConferenceVendorsURL();

      console.log('📡 Fetching exhibitors from Dollarydoos API:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      // Transform API response → ExhibitorData[]
      const vendors: ExhibitorData[] = result.data.vendors.map((v: any) => ({
        externalId: v.externalId,
        name: v.name,
        boothNumber: v.boothNumber,
        category: v.category,
        description: v.description,
        website: v.website,
        logo: v.logo,
        // Optionally include floor/zone in contact or separate field
      }));

      console.log(`✅ Loaded ${vendors.length} exhibitors from API`);
      exhibitors.set(vendors);

      // Cache for 5 minutes
      cacheExhibitors(vendors);

      isLoading.set(false);
      return vendors;
    }

    // Fallback: Load from static JSON (development/offline)
    console.warn('⚠️  API not configured, loading from static JSON');
    const response = await fetch('/mappedin-conference-poc/data/exhibitors-transformed.json');
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} exhibitors from static file`);
      exhibitors.set(data);
      isLoading.set(false);
      return data;
    }

    throw new Error('No data source available');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to load exhibitors:', errorMessage);
    loadError.set(errorMessage);
    isLoading.set(false);
    return [];
  }
}

// Search exhibitors
export const searchExhibitors = derived(
  exhibitors,
  ($exhibitors) => (query: string) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return $exhibitors.filter(exhibitor =>
      exhibitor.name.toLowerCase().includes(lowerQuery) ||
      exhibitor.boothNumber.toLowerCase().includes(lowerQuery) ||
      exhibitor.category?.toLowerCase().includes(lowerQuery)
    );
  }
);

// Get exhibitor by externalId
export function getExhibitorByExternalId(externalId: string) {
  let result: ExhibitorData | null = null;
  exhibitors.subscribe(ex => {
    result = ex.find(e => e.externalId === externalId) || null;
  })();
  return result;
}

// ============================================
// Cache Helpers (LocalStorage)
// ============================================

interface CacheEntry {
  data: ExhibitorData[]
  timestamp: number
}

function getCachedExhibitors(): ExhibitorData[] | null {
  try {
    const cached = localStorage.getItem(API_CONFIG.cache.key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    const age = Date.now() - entry.timestamp;

    // Check if cache is still valid (5 minutes)
    if (age < API_CONFIG.cache.ttl) {
      return entry.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(API_CONFIG.cache.key);
    return null;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

function cacheExhibitors(data: ExhibitorData[]): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(API_CONFIG.cache.key, JSON.stringify(entry));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

/**
 * Clear the exhibitors cache (useful for debugging/refresh)
 */
export function clearExhibitorsCache(): void {
  try {
    localStorage.removeItem(API_CONFIG.cache.key);
    console.log('✅ Exhibitors cache cleared');
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}
