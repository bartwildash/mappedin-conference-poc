/**
 * Map Helper Functions
 *
 * Utility functions for map operations
 * Based on helpers.ts pattern
 */

/**
 * Calculate polygon centroid (2D with z coordinate)
 */
function polygonCentroid(polygon) {
  if (!polygon || polygon.length === 0) {
    return [0, 0, 0];
  }

  let x = 0, y = 0;

  for (const point of polygon) {
    x += point[0];
    y += point[1];
  }

  x /= polygon.length;
  y /= polygon.length;
  const z = polygon[0]?.[2] ?? 0;

  return [x, y, z];
}

/**
 * Get anchor point for a map object
 * Returns { target, coordinate, space }
 */
function getObjectAnchor(obj, mapData) {
  // Priority 1: If object can be used directly as target
  if (obj && obj.id) {
    return { target: obj };
  }

  // Priority 2: If object has geometry, compute centroid
  const ring =
    obj?.polygon ||
    obj?.footprint ||
    obj?.geometry?.polygon ||
    obj?.coordinates ||
    undefined;

  if (ring && ring.length > 0) {
    return { coordinate: polygonCentroid(ring) };
  }

  // Priority 3: Find parent space and use its centroid
  const spaceId = obj?.spaceId || obj?.parentSpaceId || obj?.space?.id;

  if (spaceId && mapData) {
    const spaces = mapData.getByType('space');
    const space = spaces.find(s => s.id === spaceId);

    if (space?.polygon && space.polygon.length > 0) {
      return {
        coordinate: polygonCentroid(space.polygon),
        space
      };
    }
  }

  // Fallback: empty object
  return {};
}

/**
 * Get space by external ID
 */
function getSpaceByExternalId(externalId, mapData) {
  if (!externalId || !mapData) return null;

  const spaces = mapData.getByType('space');
  return spaces.find(s =>
    s.externalId?.toUpperCase() === externalId.toUpperCase()
  ) || null;
}

/**
 * Get location by external ID
 */
function getLocationByExternalId(externalId, mapData) {
  if (!externalId || !mapData) return null;

  const locations = mapData.getByType('location');
  return locations.find(l =>
    l.details?.externalId?.toUpperCase() === externalId.toUpperCase()
  ) || null;
}

/**
 * Get floor by ID
 */
function getFloorById(floorId, mapData) {
  if (!floorId || !mapData) return null;

  const floors = mapData.getByType('floor');
  return floors.find(f => f.id === floorId) || null;
}

/**
 * Get floor by space
 */
function getFloorBySpace(space, mapData) {
  if (!space || !mapData) return null;

  const floorId = space.floorId;
  return getFloorById(floorId, mapData);
}

/**
 * Calculate distance between two points (2D)
 */
function calculateDistance(point1, point2) {
  const dx = point2[0] - point1[0];
  const dy = point2[1] - point1[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate bounding box for polygon
 */
function getBoundingBox(polygon) {
  if (!polygon || polygon.length === 0) {
    return null;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return {
    min: [minX, minY],
    max: [maxX, maxY],
    width: maxX - minX,
    height: maxY - minY,
    center: [(minX + maxX) / 2, (minY + maxY) / 2]
  };
}

/**
 * Check if point is inside polygon (2D)
 */
function isPointInPolygon(point, polygon) {
  if (!point || !polygon || polygon.length < 3) {
    return false;
  }

  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Format distance for display
 */
function formatDistance(meters) {
  if (meters < 1) {
    return `${Math.round(meters * 100)}cm`;
  } else if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Format distance in feet
 */
function formatDistanceFeet(meters) {
  const feet = meters * 3.28084;

  if (feet < 100) {
    return `${Math.round(feet)}ft`;
  } else {
    return `${Math.round(feet / 10) * 10}ft`;
  }
}

/**
 * Estimate walk time (assuming 1.4 m/s average speed)
 */
function estimateWalkTime(meters) {
  const seconds = meters / 1.4;

  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    polygonCentroid,
    getObjectAnchor,
    getSpaceByExternalId,
    getLocationByExternalId,
    getFloorById,
    getFloorBySpace,
    calculateDistance,
    getBoundingBox,
    isPointInPolygon,
    formatDistance,
    formatDistanceFeet,
    estimateWalkTime
  };
} else {
  window.MapHelpers = {
    polygonCentroid,
    getObjectAnchor,
    getSpaceByExternalId,
    getLocationByExternalId,
    getFloorById,
    getFloorBySpace,
    calculateDistance,
    getBoundingBox,
    isPointInPolygon,
    formatDistance,
    formatDistanceFeet,
    estimateWalkTime
  };
}
