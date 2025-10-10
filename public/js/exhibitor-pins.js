/**
 * Exhibitor Pins Component
 *
 * Add branded pins/markers to exhibitor booths on the map
 * Styled with clone-card minimalist pattern
 */

class ExhibitorPins {
  constructor(mapView, mapData, options = {}) {
    this.mapView = mapView;
    this.mapData = mapData;
    this.options = {
      defaultIcon: '👕',
      placement: 'top',
      rank: 6,
      interactive: true,
      showLabels: true,
      ...options
    };

    // Track added pins
    this.pins = new Map(); // exhibitorId -> marker
  }

  /**
   * Add pin for a single exhibitor
   */
  addPin(exhibitor, space = null) {
    if (!exhibitor) return null;

    // Find anchor (space or coordinate)
    const anchor = this.getAnchor(exhibitor, space);
    if (!anchor) {
      console.warn('Cannot add pin for exhibitor:', exhibitor.name, '- no anchor found');
      return null;
    }

    // Generate HTML
    const html = this.createPinHTML(exhibitor);

    // Add marker
    const marker = this.mapView.Markers.add(anchor, html, {
      placement: this.options.placement,
      rank: this.options.rank,
      interactive: this.options.interactive
    });

    // Track marker
    if (marker) {
      this.pins.set(exhibitor.id, marker);
    }

    return marker;
  }

  /**
   * Add pins for multiple exhibitors
   */
  addPins(exhibitors) {
    const markers = [];

    exhibitors.forEach(exhibitor => {
      const marker = this.addPin(exhibitor);
      if (marker) {
        markers.push(marker);
      }
    });

    console.log(`✅ Added ${markers.length} exhibitor pins`);
    return markers;
  }

  /**
   * Get anchor point for exhibitor
   */
  getAnchor(exhibitor, space = null) {
    // Priority 1: Provided space
    if (space) {
      return space;
    }

    // Priority 2: Find by externalId
    if (exhibitor.externalId) {
      const spaces = this.mapData.getByType('space');
      const foundSpace = spaces.find(s =>
        s.externalId?.toUpperCase() === exhibitor.externalId.toUpperCase()
      );
      if (foundSpace) return foundSpace;
    }

    // Priority 3: Find by spaceIds
    if (exhibitor.spaceIds && exhibitor.spaceIds.length > 0) {
      const spaces = this.mapData.getByType('space');
      const foundSpace = spaces.find(s => exhibitor.spaceIds.includes(s.id));
      if (foundSpace) return foundSpace;
    }

    // Priority 4: Use coordinate if available
    if (exhibitor.coordinate) {
      return exhibitor.coordinate;
    }

    return null;
  }

  /**
   * Create pin HTML
   */
  createPinHTML(exhibitor) {
    const icon = exhibitor.icon || exhibitor.logoUrl || this.options.defaultIcon;
    const showLabel = this.options.showLabels && exhibitor.name;

    // Icon type detection
    const isEmoji = !icon.startsWith('http') && !icon.startsWith('/');
    const isImage = icon.startsWith('http') || icon.startsWith('/');

    return `
      <div class="ex-pin" data-exhibitor-id="${this.escapeHtml(exhibitor.id)}">
        <div class="ex-pin__bubble ${exhibitor.category ? `ex-pin__bubble--${this.categoryToClass(exhibitor.category)}` : ''}">
          ${isImage
            ? `<img class="ex-pin__icon" src="${this.escapeHtml(icon)}" alt="${this.escapeHtml(exhibitor.name)}" />`
            : `<span class="ex-pin__emoji">${icon}</span>`
          }
        </div>
        ${showLabel
          ? `<div class="ex-pin__label">${this.escapeHtml(exhibitor.name)}</div>`
          : ''
        }
      </div>
    `;
  }

  /**
   * Convert category to CSS class
   */
  categoryToClass(category) {
    return category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Remove pin for exhibitor
   */
  removePin(exhibitorId) {
    const marker = this.pins.get(exhibitorId);
    if (marker) {
      this.mapView.Markers.remove(marker);
      this.pins.delete(exhibitorId);
      return true;
    }
    return false;
  }

  /**
   * Remove all pins
   */
  removeAllPins() {
    this.pins.forEach((marker, exhibitorId) => {
      this.mapView.Markers.remove(marker);
    });
    this.pins.clear();
    console.log('✅ Removed all exhibitor pins');
  }

  /**
   * Update pin (remove and re-add)
   */
  updatePin(exhibitor, space = null) {
    this.removePin(exhibitor.id);
    return this.addPin(exhibitor, space);
  }

  /**
   * Get all pin markers
   */
  getAllPins() {
    return Array.from(this.pins.values());
  }

  /**
   * Get pin for specific exhibitor
   */
  getPin(exhibitorId) {
    return this.pins.get(exhibitorId) || null;
  }

  /**
   * Hide all pins
   */
  hideAllPins() {
    this.pins.forEach((marker) => {
      marker.style.display = 'none';
    });
  }

  /**
   * Show all pins
   */
  showAllPins() {
    this.pins.forEach((marker) => {
      marker.style.display = 'block';
    });
  }

  /**
   * Filter pins by category
   */
  filterByCategory(category) {
    // This would require category data in the marker
    // For now, remove/add based on exhibitor data
    console.warn('filterByCategory not implemented - use removeAllPins + addPins with filtered data');
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.removeAllPins();
    this.pins = null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExhibitorPins;
} else {
  window.ExhibitorPins = ExhibitorPins;
}
