/**
 * Floor and Zoom Controls Component
 *
 * Provides floor selection and zoom controls for Mappedin map
 * Styled with clone-card minimalist design pattern
 *
 * Features:
 * - Floor selector dropdown (sorted by elevation)
 * - Zoom in/out buttons
 * - Responds to floor change events
 * - Mobile-optimized
 */

class FloorZoomControls {
  constructor(mapData, mapView, options = {}) {
    this.mapData = mapData;
    this.mapView = mapView;
    this.options = {
      position: options.position || 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      showFloorSelector: options.showFloorSelector !== false,
      showZoomControls: options.showZoomControls !== false,
      ...options
    };

    this.container = null;
    this.floorSelect = null;
    this.floors = [];
  }

  /**
   * Initialize and render the controls
   */
  init() {
    // Get and sort floors
    this.floors = this.mapData.getByType("floor") || [];
    this.floors.sort((a, b) => a.elevation - b.elevation);

    // Create container
    this.container = document.createElement("div");
    this.container.className = "floor-zoom-controls";
    this.container.classList.add(`position-${this.options.position}`);

    // Render controls
    if (this.options.showFloorSelector && this.floors.length > 1) {
      this.renderFloorSelector();
    }

    if (this.options.showZoomControls) {
      this.renderZoomControls();
    }

    // Add to DOM
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEventListeners();

    return this;
  }

  /**
   * Render floor selector dropdown
   */
  renderFloorSelector() {
    const floorWrapper = document.createElement("div");
    floorWrapper.className = "floor-selector-wrapper";

    // Label icon
    const icon = document.createElement("span");
    icon.className = "floor-icon";
    icon.textContent = "🏢";
    floorWrapper.appendChild(icon);

    // Select dropdown
    this.floorSelect = document.createElement("select");
    this.floorSelect.className = "floor-select";
    this.floorSelect.setAttribute("aria-label", "Select floor");

    this.floors.forEach((floor) => {
      const option = document.createElement("option");
      option.value = floor.id;
      option.textContent = floor.name || `Floor ${floor.elevation}`;
      this.floorSelect.appendChild(option);
    });

    // Set current floor
    const currentFloor = this.mapView.currentFloor;
    if (currentFloor) {
      this.floorSelect.value = currentFloor.id;
    }

    floorWrapper.appendChild(this.floorSelect);
    this.container.appendChild(floorWrapper);
  }

  /**
   * Render zoom in/out buttons
   */
  renderZoomControls() {
    const zoomWrapper = document.createElement("div");
    zoomWrapper.className = "zoom-controls-wrapper";

    // Zoom in button
    const zoomInBtn = document.createElement("button");
    zoomInBtn.className = "zoom-btn zoom-in";
    zoomInBtn.setAttribute("aria-label", "Zoom in");
    zoomInBtn.textContent = "+";
    zoomInBtn.addEventListener("click", () => {
      const currentZoom = this.mapView.Camera.zoom || 2000;
      this.mapView.Camera.set({ zoom: currentZoom * 1.2 });
    });

    // Zoom out button
    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.className = "zoom-btn zoom-out";
    zoomOutBtn.setAttribute("aria-label", "Zoom out");
    zoomOutBtn.textContent = "−";
    zoomOutBtn.addEventListener("click", () => {
      const currentZoom = this.mapView.Camera.zoom || 2000;
      this.mapView.Camera.set({ zoom: currentZoom / 1.2 });
    });

    zoomWrapper.appendChild(zoomInBtn);
    zoomWrapper.appendChild(zoomOutBtn);
    this.container.appendChild(zoomWrapper);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Floor selector change
    if (this.floorSelect) {
      this.floorSelect.addEventListener("change", (e) => {
        this.mapView.setFloor(e.target.value);
      });
    }

    // Listen for floor changes (from other sources)
    this.mapView.on("floor-change", (event) => {
      if (event.floor && this.floorSelect) {
        this.floorSelect.value = event.floor.id;
      }
    });
  }

  /**
   * Destroy the controls and cleanup
   */
  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.floorSelect = null;
  }

  /**
   * Show the controls
   */
  show() {
    if (this.container) {
      this.container.style.display = "flex";
    }
  }

  /**
   * Hide the controls
   */
  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }

  /**
   * Update position
   */
  setPosition(position) {
    if (this.container) {
      this.container.classList.remove(
        'position-top-right',
        'position-top-left',
        'position-bottom-right',
        'position-bottom-left'
      );
      this.container.classList.add(`position-${position}`);
      this.options.position = position;
    }
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FloorZoomControls;
} else {
  window.FloorZoomControls = FloorZoomControls;
}
