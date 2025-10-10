/**
 * Interactive Directions Component
 *
 * Extends DirectionsCard with:
 * - Map click to select destination
 * - Search/suggest in destination field
 * - Real-time destination updates
 *
 * NEW FEATURES:
 * 1. Click map to set "To" location
 * 2. Search in destination field with autocomplete
 * 3. Visual feedback for selection mode
 */

class InteractiveDirections {
  constructor(mapView, mapData, searchModule, options = {}) {
    this.mapView = mapView;
    this.mapData = mapData;
    this.search = searchModule; // MappedInSearch instance
    this.options = options;

    // State
    this.fromLocation = null;
    this.toLocation = null;
    this.isSelectingDestination = false;
    this.currentDirections = null;

    // Callbacks
    this.onDirectionsCalculated = options.onDirectionsCalculated;
    this.onDestinationChanged = options.onDestinationChanged;

    // UI elements
    this.container = null;
    this.fromInput = null;
    this.toInput = null;
    this.suggestionsContainer = null;

    // Map click listener (stored for removal)
    this.mapClickListener = null;
  }

  /**
   * Initialize the interactive directions UI
   */
  init(containerElement) {
    this.container = containerElement;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the UI
   */
  render() {
    this.container.innerHTML = `
      <div class="interactive-directions">
        <div class="directions-header">
          <h3>Get Directions</h3>
          <button class="close-btn" id="closeDirections">×</button>
        </div>

        <!-- From Field -->
        <div class="directions-field">
          <label>From:</label>
          <div class="route-row">
            <span class="pin pin--from"></span>
            <div class="input-wrapper">
              <input
                type="text"
                id="fromInput"
                placeholder="Search or click map..."
                autocomplete="off"
              />
              <button class="clear-btn" id="clearFrom" style="display: none;">×</button>
            </div>
          </div>
          <div class="suggestions" id="fromSuggestions"></div>
        </div>

        <!-- To Field -->
        <div class="directions-field">
          <label>To:</label>
          <div class="route-row">
            <span class="pin pin--to"></span>
            <div class="input-wrapper ${this.isSelectingDestination ? 'selecting' : ''}">
              <input
                type="text"
                id="toInput"
                placeholder="Search or click map..."
                autocomplete="off"
              />
              <button class="map-select-btn" id="mapSelectBtn" title="Click map to select">
                📍
              </button>
              <button class="clear-btn" id="clearTo" style="display: none;">×</button>
            </div>
          </div>
          <div class="suggestions" id="toSuggestions"></div>
          ${this.isSelectingDestination ? `
            <div class="selection-hint">
              <span class="pulse-icon">📍</span>
              Click on the map to select destination
            </div>
          ` : ''}
        </div>

        <hr class="divider">

        <!-- Accessible Mode Toggle -->
        <div class="accessible-toggle">
          <label>
            <input type="checkbox" id="accessibleMode" checked>
            <span>♿ Accessible Route</span>
          </label>
        </div>

        <hr class="divider">

        <!-- Get Directions Button -->
        <button
          class="get-directions-btn ${this.fromLocation && this.toLocation ? 'ready' : ''}"
          id="getDirectionsBtn"
          ${!this.fromLocation || !this.toLocation ? 'disabled' : ''}
        >
          <span class="btn-icon">🧭</span>
          Get Directions
        </button>

        <!-- Directions Display -->
        <div class="directions-display" id="directionsDisplay"></div>
      </div>
    `;

    // Cache DOM elements
    this.fromInput = document.getElementById('fromInput');
    this.toInput = document.getElementById('toInput');
    this.fromSuggestions = document.getElementById('fromSuggestions');
    this.toSuggestions = document.getElementById('toSuggestions');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // From field search
    this.fromInput.addEventListener('input', (e) => {
      this.handleFromSearch(e.target.value);
    });

    this.fromInput.addEventListener('focus', () => {
      if (this.fromInput.value) {
        this.handleFromSearch(this.fromInput.value);
      }
    });

    // To field search
    this.toInput.addEventListener('input', (e) => {
      this.handleToSearch(e.target.value);
    });

    this.toInput.addEventListener('focus', () => {
      // Show suggestions if there's already text
      if (this.toInput.value) {
        this.handleToSearch(this.toInput.value);
      }
    });

    // Map select button
    const mapSelectBtn = document.getElementById('mapSelectBtn');
    mapSelectBtn.addEventListener('click', () => {
      this.toggleMapSelection();
    });

    // Clear buttons
    document.getElementById('clearFrom')?.addEventListener('click', () => {
      this.clearFrom();
    });

    document.getElementById('clearTo')?.addEventListener('click', () => {
      this.clearTo();
    });

    // Get directions button
    document.getElementById('getDirectionsBtn')?.addEventListener('click', () => {
      this.calculateDirections();
    });

    // Close button
    document.getElementById('closeDirections')?.addEventListener('click', () => {
      this.close();
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.directions-field')) {
        this.fromSuggestions.style.display = 'none';
        this.toSuggestions.style.display = 'none';
      }
    });
  }

  /**
   * Handle "From" field search with suggestions
   */
  async handleFromSearch(query) {
    if (!query || query.length < 2) {
      this.fromSuggestions.style.display = 'none';
      return;
    }

    try {
      const suggestions = await this.search.getSuggestions(query);
      this.renderSuggestions(suggestions, this.fromSuggestions, (suggestion) => {
        this.setFromLocation(suggestion);
      });
    } catch (error) {
      console.error('From search error:', error);
    }
  }

  /**
   * Handle "To" field search with suggestions
   */
  async handleToSearch(query) {
    if (!query || query.length < 2) {
      this.toSuggestions.style.display = 'none';
      return;
    }

    try {
      const suggestions = await this.search.getSuggestions(query);
      this.renderSuggestions(suggestions, this.toSuggestions, (suggestion) => {
        this.setToLocation(suggestion);
      });
    } catch (error) {
      console.error('To search error:', error);
    }
  }

  /**
   * Render suggestions dropdown
   */
  renderSuggestions(suggestions, container, onSelect) {
    if (!suggestions || suggestions.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = suggestions.map((suggestion, index) => `
      <div class="suggestion-item" data-index="${index}">
        <span class="suggestion-icon">${this.getSuggestionIcon(suggestion.type)}</span>
        <div class="suggestion-content">
          <div class="suggestion-name">${this.escapeHtml(suggestion.name)}</div>
          <div class="suggestion-type">${this.escapeHtml(suggestion.type)}</div>
        </div>
      </div>
    `).join('');

    container.style.display = 'block';

    // Attach click handlers
    container.querySelectorAll('.suggestion-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        onSelect(suggestions[index]);
        container.style.display = 'none';
      });
    });
  }

  /**
   * Get icon for suggestion type
   */
  getSuggestionIcon(type) {
    const icons = {
      'booth': '#️⃣',
      'enterpriseLocation': '🏢',
      'location': '📍',
      'place': '🏛️',
      'amenity': '🚻'
    };
    return icons[type] || '📍';
  }

  /**
   * Set "From" location
   */
  setFromLocation(suggestion) {
    this.fromLocation = suggestion;
    this.fromInput.value = suggestion.name;
    this.fromSuggestions.style.display = 'none';

    // Show clear button
    document.getElementById('clearFrom').style.display = 'block';

    // Update button state
    this.updateGetDirectionsButton();

    // Focus camera on selection
    if (suggestion.node) {
      this.mapView.Camera.focusOn(suggestion.node);
    }
  }

  /**
   * Set "To" location
   */
  setToLocation(suggestion) {
    this.toLocation = suggestion;
    this.toInput.value = suggestion.name;
    this.toSuggestions.style.display = 'none';

    // Show clear button
    document.getElementById('clearTo').style.display = 'block';

    // Disable map selection mode
    this.disableMapSelection();

    // Update button state
    this.updateGetDirectionsButton();

    // Focus camera on selection
    if (suggestion.node) {
      this.mapView.Camera.focusOn(suggestion.node);
    }

    // Callback
    if (this.onDestinationChanged) {
      this.onDestinationChanged(this.toLocation);
    }
  }

  /**
   * Toggle map selection mode for destination
   */
  toggleMapSelection() {
    if (this.isSelectingDestination) {
      this.disableMapSelection();
    } else {
      this.enableMapSelection();
    }
  }

  /**
   * Enable map click to select destination
   */
  enableMapSelection() {
    this.isSelectingDestination = true;

    // Update UI
    const mapSelectBtn = document.getElementById('mapSelectBtn');
    mapSelectBtn.classList.add('active');
    mapSelectBtn.textContent = '✓';
    mapSelectBtn.title = 'Click map now...';

    // Show hint
    const inputWrapper = this.toInput.closest('.input-wrapper');
    inputWrapper.classList.add('selecting');

    const hint = document.createElement('div');
    hint.className = 'selection-hint';
    hint.innerHTML = '<span class="pulse-icon">📍</span> Click on the map to select destination';
    inputWrapper.after(hint);

    // Add map click listener
    this.mapClickListener = (event) => {
      this.handleMapClick(event);
    };

    this.mapView.on('click', this.mapClickListener);

    console.log('✅ Map selection enabled - click on map to select destination');
  }

  /**
   * Disable map selection mode
   */
  disableMapSelection() {
    this.isSelectingDestination = false;

    // Update UI
    const mapSelectBtn = document.getElementById('mapSelectBtn');
    mapSelectBtn?.classList.remove('active');
    if (mapSelectBtn) {
      mapSelectBtn.textContent = '📍';
      mapSelectBtn.title = 'Click map to select';
    }

    const inputWrapper = this.toInput?.closest('.input-wrapper');
    inputWrapper?.classList.remove('selecting');

    // Remove hint
    const hint = this.container?.querySelector('.selection-hint');
    hint?.remove();

    // Remove map click listener
    if (this.mapClickListener) {
      this.mapView.off('click', this.mapClickListener);
      this.mapClickListener = null;
    }

    console.log('❌ Map selection disabled');
  }

  /**
   * Handle map click for destination selection
   */
  handleMapClick(event) {
    console.log('🗺️ Map clicked:', event);

    // Priority 1: Check for space click
    if (event.spaces && event.spaces.length > 0) {
      const space = event.spaces[0];
      console.log('✅ Space clicked:', space.name);

      this.setToLocation({
        name: space.name || space.externalId || 'Selected Space',
        type: 'space',
        node: space,
        externalId: space.externalId
      });
      return;
    }

    // Priority 2: Check for location click
    if (event.locations && event.locations.length > 0) {
      const location = event.locations[0];
      console.log('✅ Location clicked:', location.details?.name);

      this.setToLocation({
        name: location.details?.name || location.details?.externalId || 'Selected Location',
        type: 'location',
        node: location,
        externalId: location.details?.externalId
      });
      return;
    }

    // Priority 3: Use coordinate (drop pin)
    if (event.coordinate) {
      console.log('✅ Coordinate clicked, creating pin');

      this.setToLocation({
        name: `Pin (${event.coordinate[0].toFixed(1)}, ${event.coordinate[1].toFixed(1)})`,
        type: 'coordinate',
        node: event.coordinate,
        coordinate: event.coordinate
      });
    }
  }

  /**
   * Clear "From" location
   */
  clearFrom() {
    this.fromLocation = null;
    this.fromInput.value = '';
    document.getElementById('clearFrom').style.display = 'none';
    this.updateGetDirectionsButton();
  }

  /**
   * Clear "To" location
   */
  clearTo() {
    this.toLocation = null;
    this.toInput.value = '';
    document.getElementById('clearTo').style.display = 'none';
    this.disableMapSelection();
    this.updateGetDirectionsButton();
  }

  /**
   * Update Get Directions button state
   */
  updateGetDirectionsButton() {
    const btn = document.getElementById('getDirectionsBtn');
    if (this.fromLocation && this.toLocation) {
      btn.disabled = false;
      btn.classList.add('ready');
    } else {
      btn.disabled = true;
      btn.classList.remove('ready');
    }
  }

  /**
   * Calculate and display directions
   */
  async calculateDirections() {
    if (!this.fromLocation || !this.toLocation) {
      alert('Please select both from and to locations');
      return;
    }

    try {
      const accessibleMode = document.getElementById('accessibleMode').checked;

      console.log('🧭 Calculating directions:', {
        from: this.fromLocation.name,
        to: this.toLocation.name,
        accessible: accessibleMode
      });

      const directions = await this.mapData.getDirections(
        this.fromLocation.node,
        this.toLocation.node,
        { accessible: accessibleMode }
      );

      if (directions) {
        this.currentDirections = directions;

        // Draw path on map
        this.mapView.Navigation.draw(directions, {
          pathOptions: {
            nearRadius: 1.5,
            farRadius: 0.8,
            color: '#667eea',
            displayArrowsOnPath: true,
            animateArrowsOnPath: true
          }
        });

        // Display turn-by-turn instructions
        this.displayDirections(directions);

        // Callback
        if (this.onDirectionsCalculated) {
          this.onDirectionsCalculated(directions);
        }

        console.log('✅ Directions calculated:', directions.distance.toFixed(0) + 'm');
      }
    } catch (error) {
      console.error('❌ Error calculating directions:', error);
      alert('Could not calculate directions. Please try different locations.');
    }
  }

  /**
   * Display directions using DirectionsCard
   */
  displayDirections(directions) {
    const display = document.getElementById('directionsDisplay');

    if (typeof DirectionsCard !== 'undefined') {
      // Use DirectionsCard component if available
      const card = new DirectionsCard({
        accessibleMode: document.getElementById('accessibleMode').checked,
        onStepClick: (instruction, index) => {
          if (instruction.coordinate) {
            this.mapView.Camera.focusOn({
              center: instruction.coordinate,
              zoomLevel: 22
            });
          }
        }
      });

      display.innerHTML = '';
      display.appendChild(
        card.render(directions, this.fromLocation.name, this.toLocation.name)
      );
    } else {
      // Fallback: Simple display
      const distanceM = Math.round(directions.distance);
      const distanceFt = Math.round(directions.distance * 3.28084);
      const timeMin = Math.ceil(directions.distance / 1.4 / 60);

      display.innerHTML = `
        <div class="simple-directions">
          <h4>Route Found</h4>
          <p>📏 Distance: ${distanceM}m (${distanceFt}ft)</p>
          <p>⏱️ Time: ~${timeMin} minutes</p>
          <p>📋 ${directions.instructions?.length || 0} steps</p>
        </div>
      `;
    }

    display.style.display = 'block';
  }

  /**
   * Close the directions panel
   */
  close() {
    this.disableMapSelection();
    this.mapView.Navigation.clear();
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Set initial from/to locations programmatically
   */
  setInitialLocations(from, to) {
    if (from) {
      this.setFromLocation(from);
    }
    if (to) {
      this.setToLocation(to);
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InteractiveDirections;
} else {
  window.InteractiveDirections = InteractiveDirections;
}
