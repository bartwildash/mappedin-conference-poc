/**
 * API Configuration
 *
 * Connects to Dollarydoos Admin Dashboard API
 */

export const API_CONFIG = {
  // Base URL for Dollarydoos admin API
  baseUrl: import.meta.env.VITE_DOLLARYDOOS_API_URL || 'https://dash.dollarydoos.com',

  // API endpoints
  endpoints: {
    conferenceVendors: '/api/external/conference/vendors'
  },

  // Authentication
  apiKey: import.meta.env.VITE_DOLLARYDOOS_API_KEY || '',

  // Tenant ID (event ID)
  tenantId: import.meta.env.VITE_TENANT_ID || 'ludo-land',

  // Cache configuration
  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes (matches API cache-control)
    key: 'dollarydoos_vendors_cache'
  }
}

/**
 * Check if API is configured
 */
export function isAPIConfigured(): boolean {
  return Boolean(API_CONFIG.baseUrl && API_CONFIG.apiKey)
}

/**
 * Get conference vendors API URL
 */
export function getConferenceVendorsURL(): string {
  const url = new URL(API_CONFIG.endpoints.conferenceVendors, API_CONFIG.baseUrl)
  url.searchParams.set('tenantId', API_CONFIG.tenantId)
  return url.toString()
}
