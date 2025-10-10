/**
 * Modular Search System for Mappedin Web SDK v6
 *
 * Uses standard Mappedin Search API (mapData.Search.query and mapData.Search.suggest)
 * following best practices from https://docs.mappedin.com/web/v6/latest/
 *
 * Features:
 * - Full-text search using mapData.Search.query() for complete results
 * - Fast autocomplete using mapData.Search.suggest() for suggestions only
 * - Booth number search by externalId
 * - Score-based result ranking
 * - Debounced search to reduce API calls
 *
 * Usage:
 *
 * // Initialize
 * const search = new MappedInSearch(mapData, {
 *   debounceDelay: 300,
 *   maxSuggestions: 6,
 *   searchBoothNumbers: true
 * });
 *
 * // Get full search results (recommended - includes map objects)
 * const results = await search.getSuggestions('Coffee');
 * results.forEach(r => {
 *   console.log(r.name, r.score, r.node);
 * });
 *
 * // Get fast text-only suggestions (for autocomplete dropdown)
 * const suggestions = await search.getFastSuggestions('Cof');
 * // Later, resolve to actual object when user selects
 * const node = await search.resolveSuggestion(suggestions[0].value);
 *
 * Can be used in vanilla HTML or imported into React
 */

class MappedInSearch {
  constructor(mapData, options = {}) {
    this.mapData = mapData;
    this.options = {
      debounceDelay: 300,
      maxSuggestions: 6,
      searchBoothNumbers: true,
      ...options
    };
    this.searchTimeout = null;
  }

  /**
   * Get autocomplete suggestions using Mappedin query API
   * Uses query() instead of suggest() to get full objects with nodes
   */
  async getSuggestions(query) {
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
            description: true
          },
          limit: 3
        },
        places: {
          fields: {
            name: true,
            description: true
          },
          limit: 3
        },
        objects: {
          fields: {
            name: true,
            description: true
          },
          limit: 2
        }
      });

      let suggestions = [];

      // Process enterprise locations (exhibitors)
      if (results.enterpriseLocations) {
        const locationSuggestions = results.enterpriseLocations.map(result => ({
          name: result.item.name,
          value: result.item.name,
          type: 'enterpriseLocation',
          node: result.item,
          score: result.score,
          match: result.match
        }));
        suggestions = [...suggestions, ...locationSuggestions];
      }

      // Process places (spaces, POIs, etc.)
      if (results.places) {
        const placeSuggestions = results.places.map(result => ({
          name: result.item.name,
          value: result.item.name,
          type: result.type,
          node: result.item,
          score: result.score,
          match: result.match
        }));
        suggestions = [...suggestions, ...placeSuggestions];
      }

      // Process objects (furniture, fixtures, amenities with names)
      if (results.objects) {
        const objectSuggestions = results.objects.map(result => ({
          name: result.item.name,
          value: result.item.name,
          type: 'object',
          node: result.item,
          score: result.score,
          match: result.match
        }));
        suggestions = [...suggestions, ...objectSuggestions];
      }

      // Also search booth numbers if enabled
      if (this.options.searchBoothNumbers) {
        const boothResults = this.searchBoothNumbers(query);
        suggestions = [...boothResults, ...suggestions];
      }

      // Sort by score descending (higher scores first)
      suggestions.sort((a, b) => (b.score || 0) - (a.score || 0));

      return suggestions.slice(0, this.options.maxSuggestions);
    } catch (error) {
      console.error('❌ Search error:', error);
      return [];
    }
  }

  /**
   * Get fast text-only suggestions using Mappedin suggest API
   * Useful for autocomplete when you don't need the full object immediately
   */
  async getFastSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Use suggest() for fast text-based autocomplete
      const suggestions = await this.mapData.Search.suggest(query, {
        enterpriseLocations: { enabled: true },
        places: { enabled: true }
      });

      return suggestions.slice(0, this.options.maxSuggestions).map(s => ({
        name: s.suggestion,
        value: s.suggestion,
        type: 'suggestion',
        score: s.score
      }));
    } catch (error) {
      console.error('❌ Fast suggestions error:', error);
      return [];
    }
  }

  /**
   * Resolve a suggestion text to an actual map object
   * Use this after user selects a suggestion from getFastSuggestions()
   */
  async resolveSuggestion(suggestionText) {
    try {
      const results = await this.mapData.Search.query(suggestionText, {
        enterpriseLocations: {
          fields: { name: true, tags: true },
          limit: 1
        },
        places: {
          fields: { name: true },
          limit: 1
        }
      });

      // Return first match
      const location = results.enterpriseLocations?.[0]?.item;
      const place = results.places?.[0]?.item;

      return location || place || null;
    } catch (error) {
      console.error('❌ Error resolving suggestion:', error);
      return null;
    }
  }

  /**
   * Search booth numbers (externalId) manually using spaces
   * Searches both 'space' and 'location' types for booth numbers
   */
  searchBoothNumbers(query) {
    const queryUpper = query.toUpperCase();
    const results = [];

    // Search spaces (preferred for conference booths)
    const spaces = this.mapData.getByType('space').filter(space =>
      space.externalId && space.externalId.toUpperCase().includes(queryUpper)
    );

    // Search locations (legacy support)
    const locations = this.mapData.getByType('location').filter(loc =>
      loc.details?.externalId && loc.details.externalId.toUpperCase().includes(queryUpper)
    );

    // Process spaces
    spaces.forEach(space => {
      const isExactMatch = space.externalId.toUpperCase() === queryUpper;
      results.push({
        name: `Booth ${space.externalId}${space.name ? ` - ${space.name}` : ''}`,
        value: space.externalId,
        type: 'booth',
        node: space,
        score: isExactMatch ? 1000 : 500, // High score for booth matches, higher for exact
        externalId: space.externalId,
        isExactMatch
      });
    });

    // Process locations
    locations.forEach(location => {
      const isExactMatch = location.details.externalId.toUpperCase() === queryUpper;
      results.push({
        name: `Booth ${location.details.externalId} - ${location.details.name}`,
        value: location.details.externalId,
        type: 'booth',
        node: location,
        score: isExactMatch ? 950 : 450, // Slightly lower than spaces
        externalId: location.details.externalId,
        isExactMatch
      });
    });

    // Sort by score (exact matches first, then partial)
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 3);
  }

  /**
   * Debounced search function
   */
  debouncedSearch(query, callback) {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(async () => {
      const suggestions = await this.getSuggestions(query);
      callback(suggestions);
    }, this.options.debounceDelay);
  }

  /**
   * Get icon name based on suggestion type
   */
  getIconForType(type) {
    const iconMap = {
      'booth': 'hash',
      'enterpriseLocation': 'store',
      'location': 'store',
      'place': 'building-2',
      'object': 'box',
      'category': 'tag'
    };
    return iconMap[type] || 'map-pin';
  }

  /**
   * Get display type name
   */
  getDisplayType(type) {
    const typeMap = {
      'booth': 'Booth Number',
      'enterpriseLocation': 'Exhibitor',
      'location': 'Exhibitor',
      'place': 'Place',
      'object': 'Object',
      'category': 'Category'
    };
    return typeMap[type] || 'Location';
  }

  /**
   * Build HTML for suggestions dropdown
   */
  buildSuggestionsHTML(suggestions) {
    return suggestions.map((suggestion, index) => {
      const name = suggestion.name || suggestion.value || 'Unknown Location';
      const type = suggestion.type || 'location';
      const iconName = this.getIconForType(type);
      const displayType = this.getDisplayType(type);

      return `
        <div class="search-suggestion" data-index="${index}">
          <div style="display: flex; align-items: center; gap: 12px;">
            <i data-lucide="${iconName}" style="width: 20px; height: 20px; color: #667eea; flex-shrink: 0;"></i>
            <div style="flex: 1; min-width: 0;">
              <div class="suggestion-name">${this.escapeHtml(name)}</div>
              <div class="suggestion-type">${displayType}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Focus camera on suggestion
   * Handles different node types from Mappedin Search API
   */
  focusOnSuggestion(suggestion, mapView, showCardCallback) {
    if (!suggestion.node) {
      console.warn('⚠️ Suggestion missing node:', suggestion);
      return false;
    }

    try {
      const node = suggestion.node;

      // Handle different node types
      // EnterpriseLocation, Space, POI, etc.
      if (node.__type === 'enterprise-location') {
        // Enterprise locations may have multiple polygons/spaces
        // Focus on the first one
        if (node.polygons && node.polygons.length > 0) {
          mapView.Camera.focusOn(node.polygons[0]);
        } else {
          console.warn('⚠️ EnterpriseLocation has no polygons:', node);
          return false;
        }
      } else {
        // For spaces, POIs, and other types, focus directly
        mapView.Camera.focusOn(node);
      }

      // Trigger callback with the node
      if (showCardCallback) {
        showCardCallback(node);
      }

      return true;
    } catch (error) {
      console.error('❌ Error focusing on suggestion:', error, suggestion);
      return false;
    }
  }
}

/**
 * Search UI Manager - Handles DOM interaction
 */
class SearchUIManager {
  constructor(searchInstance, mapView, options = {}) {
    this.search = searchInstance;
    this.mapView = mapView;
    this.options = {
      inputSelector: '#searchInput',
      suggestionsSelector: '#searchSuggestions',
      onSelect: null,
      showLoadingState: true,
      ...options
    };

    this.suggestions = [];
    this.isLoading = false;
    this.init();
  }

  init() {
    this.inputElement = document.querySelector(this.options.inputSelector);
    this.suggestionsElement = document.querySelector(this.options.suggestionsSelector);

    if (!this.inputElement || !this.suggestionsElement) {
      console.error('❌ Search elements not found');
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Input event - show suggestions
    this.inputElement.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this.handleInput(query);
    });

    // Enter key - select first suggestion
    this.inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.selectFirstSuggestion();
      }
    });

    // Click outside - hide suggestions
    document.addEventListener('click', (e) => {
      if (!this.inputElement.contains(e.target) &&
          !this.suggestionsElement.contains(e.target)) {
        this.hideSuggestions();
      }
    });
  }

  handleInput(query) {
    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }

    // Show loading state immediately
    if (this.options.showLoadingState) {
      this.showLoadingState();
    }

    this.search.debouncedSearch(query, (suggestions) => {
      this.isLoading = false;
      this.displaySuggestions(suggestions);
    });
  }

  /**
   * Show loading skeleton
   */
  showLoadingState() {
    this.isLoading = true;
    this.suggestionsElement.innerHTML = this.buildLoadingHTML();
    this.suggestionsElement.style.display = 'block';
  }

  /**
   * Build loading skeleton HTML
   */
  buildLoadingHTML() {
    return `
      <div class="search-loading">
        <div class="loading-text">
          <div class="loading-spinner loading-spinner--small"></div>
          <span>Searching...</span>
        </div>
      </div>
      ${this.buildSkeletonItems(3)}
    `;
  }

  /**
   * Build skeleton items
   */
  buildSkeletonItems(count) {
    return Array.from({ length: count }, () => `
      <div class="search-skeleton">
        <div class="search-skeleton__row">
          <div class="search-skeleton__icon skeleton"></div>
          <div class="search-skeleton__content">
            <div class="search-skeleton__title skeleton"></div>
            <div class="search-skeleton__subtitle skeleton"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  displaySuggestions(suggestions) {
    this.suggestions = suggestions;

    if (suggestions.length === 0) {
      // Show empty state instead of hiding
      this.suggestionsElement.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🔍</div>
          <div class="empty-state__title">No results found</div>
          <div class="empty-state__description">Try a different search term</div>
        </div>
      `;
      this.suggestionsElement.style.display = 'block';
      return;
    }

    this.suggestionsElement.innerHTML = this.search.buildSuggestionsHTML(suggestions);
    this.suggestionsElement.style.display = 'block';

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add click/touch handlers for better mobile support
    this.suggestionsElement.querySelectorAll('.search-suggestion').forEach((item, index) => {
      // Use both click and touchend for mobile compatibility
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.selectSuggestion(index);
      };

      item.addEventListener('click', handler);
      item.addEventListener('touchend', handler);

      // Add visual feedback on touch
      item.addEventListener('touchstart', () => {
        item.style.backgroundColor = '#f0f0f0';
      });
      item.addEventListener('touchcancel', () => {
        item.style.backgroundColor = '';
      });
    });
  }

  selectSuggestion(index) {
    const suggestion = this.suggestions[index];
    if (!suggestion) return;

    const success = this.search.focusOnSuggestion(
      suggestion,
      this.mapView,
      this.options.onSelect
    );

    if (success) {
      this.inputElement.value = suggestion.name || suggestion.value;
      this.hideSuggestions();
    }
  }

  selectFirstSuggestion() {
    if (this.suggestions.length > 0) {
      this.selectSuggestion(0);
    }
  }

  hideSuggestions() {
    this.suggestionsElement.style.display = 'none';
  }

  setValue(value) {
    this.inputElement.value = value;
  }

  getValue() {
    return this.inputElement.value;
  }
}

// Export for use in modules or attach to window for vanilla JS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MappedInSearch, SearchUIManager };
} else {
  window.MappedInSearch = MappedInSearch;
  window.SearchUIManager = SearchUIManager;
}
