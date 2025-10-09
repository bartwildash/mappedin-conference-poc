/**
 * Modular Search System for Mappedin
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
   * Get autocomplete suggestions using Mappedin suggest API
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Use Mappedin suggest API
      let suggestions = await this.mapData.Search.suggest(query, {
        enterpriseLocations: { enabled: true },
        places: { enabled: true }
      });

      // Also search booth numbers if enabled
      if (this.options.searchBoothNumbers) {
        const boothResults = this.searchBoothNumbers(query);
        suggestions = [...boothResults, ...(suggestions || [])];
      }

      return suggestions.slice(0, this.options.maxSuggestions);
    } catch (error) {
      console.error('❌ Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Search booth numbers (externalId) manually using locations
   */
  searchBoothNumbers(query) {
    const queryUpper = query.toUpperCase();
    const locations = this.mapData.getByType('location').filter(loc =>
      loc.details?.externalId && loc.details.externalId.toUpperCase().includes(queryUpper)
    );

    return locations.slice(0, 3).map(location => ({
      name: `${location.details.externalId} - ${location.details.name}`,
      value: location.details.externalId,
      type: 'booth',
      node: location
    }));
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
   */
  focusOnSuggestion(suggestion, mapView, showCardCallback) {
    if (!suggestion.node) {
      console.warn('⚠️ Suggestion missing node:', suggestion);
      return false;
    }

    try {
      mapView.Camera.focusOn(suggestion.node);
      if (showCardCallback) {
        showCardCallback(suggestion.node);
      }
      return true;
    } catch (error) {
      console.error('❌ Error focusing on suggestion:', error);
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
      ...options
    };

    this.suggestions = [];
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

    this.search.debouncedSearch(query, (suggestions) => {
      this.displaySuggestions(suggestions);
    });
  }

  displaySuggestions(suggestions) {
    this.suggestions = suggestions;

    if (suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.suggestionsElement.innerHTML = this.search.buildSuggestionsHTML(suggestions);
    this.suggestionsElement.style.display = 'block';

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add click handlers
    this.suggestionsElement.querySelectorAll('.search-suggestion').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectSuggestion(index);
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
