/**
 * Exhibitor Card Controller
 *
 * Handles exhibitor data management and map interaction
 * Resolves exhibitors from map clicks and manages card display
 *
 * Based on ExhibitorCardController.ts pattern
 */

class ExhibitorCardController {
  constructor(mapData, mapView, exhibitorData, options = {}) {
    this.mapData = mapData;
    this.mapView = mapView;
    this.options = options;

    // Build exhibitor database with indexes
    this.exhibitorDB = this.buildDatabase(exhibitorData);

    // Callbacks
    this.onExhibitorSelected = options.onExhibitorSelected;
    this.onCardClosed = options.onCardClosed;

    // State
    this.currentExhibitor = null;
    this.currentSpace = null;
  }

  /**
   * Build indexed database from exhibitor data
   */
  buildDatabase(exhibitorData) {
    const db = {
      byId: {},
      byExternalId: {},
      bySpaceId: {},
      all: []
    };

    // Handle both array and object formats
    const exhibitors = Array.isArray(exhibitorData)
      ? exhibitorData
      : Object.values(exhibitorData);

    exhibitors.forEach(exhibitor => {
      // Index by ID
      db.byId[exhibitor.id] = exhibitor;
      db.all.push(exhibitor);

      // Index by externalId (booth number)
      if (exhibitor.externalId) {
        db.byExternalId[exhibitor.externalId.toUpperCase()] = exhibitor.id;
      }

      // Index by spaceIds
      if (exhibitor.spaceIds) {
        exhibitor.spaceIds.forEach(spaceId => {
          if (!db.bySpaceId[spaceId]) {
            db.bySpaceId[spaceId] = [];
          }
          db.bySpaceId[spaceId].push(exhibitor.id);
        });
      }
    });

    console.log('📊 Exhibitor database built:', {
      total: db.all.length,
      withExternalId: Object.keys(db.byExternalId).length,
      withSpaceIds: Object.keys(db.bySpaceId).length
    });

    return db;
  }

  /**
   * Initialize map click listener
   */
  init() {
    this.mapView.on('click', (event) => {
      this.handleMapClick(event);
    });

    console.log('✅ Exhibitor card controller initialized');
    return this;
  }

  /**
   * Handle map click events
   */
  handleMapClick(event) {
    const exhibitor = this.resolveExhibitorFromMapHit(event);

    if (!exhibitor) {
      return; // No exhibitor found at this location
    }

    // Find associated space
    const space = this.findSpaceForExhibitor(exhibitor, event);

    // Find floor
    const floor = space
      ? this.mapData.getByType('floor').find(f => f.id === space.floorId)
      : null;

    // Store current selection
    this.currentExhibitor = exhibitor;
    this.currentSpace = space;

    // Trigger callback
    if (this.onExhibitorSelected) {
      this.onExhibitorSelected({
        exhibitor,
        space,
        floor
      });
    }

    // Optional: Focus camera on space
    if (space && this.options.autoFocus !== false) {
      this.focusOnSpace(space);
    }

    console.log('📍 Exhibitor selected:', exhibitor.name, {
      externalId: exhibitor.externalId,
      spaceId: space?.id,
      floor: floor?.name
    });
  }

  /**
   * Resolve exhibitor from map click hit
   */
  resolveExhibitorFromMapHit(hit) {
    // Try multiple sources for externalId
    const externalId =
      hit.location?.externalId ||
      hit.location?.details?.externalId ||
      hit.space?.externalId ||
      hit.spaces?.[0]?.externalId ||
      hit.place?.externalId ||
      null;

    // Try to match by externalId first (most reliable)
    if (externalId) {
      const normalizedId = externalId.toUpperCase();
      const exhibitorId = this.exhibitorDB.byExternalId[normalizedId];

      if (exhibitorId) {
        return this.exhibitorDB.byId[exhibitorId];
      }
    }

    // Fallback: match by space ID
    const spaceId =
      hit.space?.id ||
      hit.spaces?.[0]?.id ||
      hit.location?.spaces?.[0]?.id ||
      null;

    if (spaceId) {
      const exhibitorIds = this.exhibitorDB.bySpaceId[spaceId];
      if (exhibitorIds && exhibitorIds.length > 0) {
        return this.exhibitorDB.byId[exhibitorIds[0]];
      }
    }

    return null;
  }

  /**
   * Find best space for exhibitor
   */
  findSpaceForExhibitor(exhibitor, event) {
    // Priority 1: Space from click event
    if (event.space) {
      return event.space;
    }

    if (event.spaces && event.spaces.length > 0) {
      return event.spaces[0];
    }

    // Priority 2: Location's spaces
    if (event.location?.spaces && event.location.spaces.length > 0) {
      return event.location.spaces[0];
    }

    // Priority 3: Find by externalId
    if (exhibitor.externalId) {
      const spaces = this.mapData.getByType('space');
      const space = spaces.find(s =>
        s.externalId?.toUpperCase() === exhibitor.externalId.toUpperCase()
      );
      if (space) return space;
    }

    // Priority 4: Find by spaceIds
    if (exhibitor.spaceIds && exhibitor.spaceIds.length > 0) {
      const spaces = this.mapData.getByType('space');
      const space = spaces.find(s => exhibitor.spaceIds.includes(s.id));
      if (space) return space;
    }

    return null;
  }

  /**
   * Focus camera on space
   */
  focusOnSpace(space) {
    if (!space) return;

    // Use polygon if available
    if (space.polygon) {
      this.mapView.Camera.focusOn({
        polygons: [space.polygon],
        minZoom: 20,
        maxZoom: 22
      });
    } else if (space.coordinates) {
      // Fallback to coordinates
      this.mapView.Camera.focusOn({
        center: space.coordinates,
        zoomLevel: 21
      });
    } else {
      // Use space node directly
      this.mapView.Camera.focusOn(space);
    }
  }

  /**
   * Get exhibitor by ID
   */
  getExhibitorById(id) {
    return this.exhibitorDB.byId[id] || null;
  }

  /**
   * Get exhibitor by external ID (booth number)
   */
  getExhibitorByExternalId(externalId) {
    const normalizedId = externalId.toUpperCase();
    const exhibitorId = this.exhibitorDB.byExternalId[normalizedId];
    return exhibitorId ? this.exhibitorDB.byId[exhibitorId] : null;
  }

  /**
   * Get all exhibitors at a space
   */
  getExhibitorsBySpace(spaceId) {
    const exhibitorIds = this.exhibitorDB.bySpaceId[spaceId] || [];
    return exhibitorIds.map(id => this.exhibitorDB.byId[id]).filter(Boolean);
  }

  /**
   * Get current selection
   */
  getCurrentSelection() {
    return {
      exhibitor: this.currentExhibitor,
      space: this.currentSpace
    };
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    this.currentExhibitor = null;
    this.currentSpace = null;

    if (this.onCardClosed) {
      this.onCardClosed();
    }
  }

  /**
   * Search exhibitors by name
   */
  searchExhibitors(query) {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();

    return this.exhibitorDB.all
      .filter(ex =>
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.externalId?.toLowerCase().includes(lowerQuery) ||
        ex.categories?.some(cat => cat.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => {
        // Prioritize name matches
        const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery);
        const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery);

        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;

        return a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  }

  /**
   * Get co-exhibitors
   */
  getCoExhibitors(exhibitor) {
    if (!exhibitor.coExhibitorIds || exhibitor.coExhibitorIds.length === 0) {
      return [];
    }

    return exhibitor.coExhibitorIds
      .map(id => this.exhibitorDB.byId[id])
      .filter(Boolean);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExhibitorCardController;
} else {
  window.ExhibitorCardController = ExhibitorCardController;
}
