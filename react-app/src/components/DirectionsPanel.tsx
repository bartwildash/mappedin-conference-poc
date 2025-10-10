/**
 * Directions Panel Component
 *
 * Interactive directions with map click, search, and GPS
 * Combines features from:
 * - public/js/directions-interactive.js
 * - Neeth-N/Mappedin-demo NavigationPanel
 */

import { useState, useEffect } from 'react';
import { Navigation, MapPin, Accessibility, X, Loader } from 'lucide-react';
import { SearchService } from '@/services/SearchService';
import { GPSLocationService } from '@/services/GPSLocationService';
import type { LocationSelection, DirectionsResult, SearchSuggestion } from '@/types';
import './DirectionsPanel.css';

interface DirectionsPanelProps {
  mapData: any;
  mapView: any;
  initialDestination?: LocationSelection;
  onClose?: () => void;
}

export function DirectionsPanel({
  mapData,
  mapView,
  initialDestination,
  onClose,
}: DirectionsPanelProps) {
  const [fromLocation, setFromLocation] = useState<LocationSelection | null>(null);
  const [toLocation, setToLocation] = useState<LocationSelection | null>(
    initialDestination || null
  );
  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState(initialDestination?.name || '');
  const [fromSuggestions, setFromSuggestions] = useState<SearchSuggestion[]>([]);
  const [toSuggestions, setToSuggestions] = useState<SearchSuggestion[]>([]);
  const [accessibleMode, setAccessibleMode] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMapSelecting, setIsMapSelecting] = useState(false);
  const [isGPSLoading, setIsGPSLoading] = useState(false);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);

  const searchService = new SearchService(mapData);
  const gpsService = new GPSLocationService(mapData);

  // Handle search for "From" field
  useEffect(() => {
    if (fromQuery.length < 2) {
      setFromSuggestions([]);
      return;
    }

    const search = async () => {
      const results = await searchService.getSuggestions(fromQuery);
      setFromSuggestions(results);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [fromQuery]);

  // Handle search for "To" field
  useEffect(() => {
    if (toQuery.length < 2) {
      setToSuggestions([]);
      return;
    }

    const search = async () => {
      const results = await searchService.getSuggestions(toQuery);
      setToSuggestions(results);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [toQuery]);

  // Handle map click for destination selection
  useEffect(() => {
    if (!isMapSelecting || !mapView) return;

    const handleMapClick = (event: any) => {
      // Priority 1: Space click
      if (event.spaces?.length > 0) {
        const space = event.spaces[0];
        setToLocation({
          name: space.name || space.externalId || 'Selected Space',
          type: 'space',
          node: space,
          externalId: space.externalId,
        });
        setToQuery(space.name || space.externalId || 'Selected Space');
        setIsMapSelecting(false);
        return;
      }

      // Priority 2: Location click
      if (event.locations?.length > 0) {
        const location = event.locations[0];
        setToLocation({
          name:
            location.details?.name ||
            location.details?.externalId ||
            'Selected Location',
          type: 'location',
          node: location,
          externalId: location.details?.externalId,
        });
        setToQuery(
          location.details?.name ||
            location.details?.externalId ||
            'Selected Location'
        );
        setIsMapSelecting(false);
        return;
      }

      // Priority 3: Coordinate (drop pin)
      if (event.coordinate) {
        setToLocation({
          name: `Pin (${event.coordinate[0].toFixed(1)}, ${event.coordinate[1].toFixed(1)})`,
          type: 'coordinate',
          node: event.coordinate,
          coordinate: event.coordinate,
        });
        setToQuery(
          `Pin (${event.coordinate[0].toFixed(1)}, ${event.coordinate[1].toFixed(1)})`
        );
        setIsMapSelecting(false);
      }
    };

    mapView.on('click', handleMapClick);
    return () => {
      mapView.off('click', handleMapClick);
    };
  }, [isMapSelecting, mapView]);

  const handleGPSLocation = async () => {
    setIsGPSLoading(true);

    try {
      const { gps, nearestSpace } = await gpsService.getLocationAndNearestEntrance();

      if (nearestSpace) {
        setFromLocation({
          name: nearestSpace.name,
          type: 'space',
          node: nearestSpace,
        });
        setFromQuery(
          `${nearestSpace.name} (${GPSLocationService.formatDistance(nearestSpace.distance)} away)`
        );
      } else {
        alert('Could not find nearest entrance. Please search manually.');
      }
    } catch (error: any) {
      alert(error.message || 'Could not get location');
    } finally {
      setIsGPSLoading(false);
    }
  };

  const handleFromSelect = (suggestion: SearchSuggestion) => {
    setFromLocation({
      name: suggestion.name,
      type: suggestion.type as any,
      node: suggestion.node,
      externalId: suggestion.externalId,
    });
    setFromQuery(suggestion.name);
    setFromSuggestions([]);

    if (suggestion.node && mapView) {
      mapView.Camera.focusOn(suggestion.node);
    }
  };

  const handleToSelect = (suggestion: SearchSuggestion) => {
    setToLocation({
      name: suggestion.name,
      type: suggestion.type as any,
      node: suggestion.node,
      externalId: suggestion.externalId,
    });
    setToQuery(suggestion.name);
    setToSuggestions([]);

    if (suggestion.node && mapView) {
      mapView.Camera.focusOn(suggestion.node);
    }
  };

  const handleCalculateDirections = async () => {
    if (!fromLocation || !toLocation) {
      alert('Please select both from and to locations');
      return;
    }

    setIsCalculating(true);

    try {
      const result = await mapData.getDirections(
        fromLocation.node,
        toLocation.node,
        { accessible: accessibleMode }
      );

      // Draw path on map
      mapView.Navigation.draw(result, {
        pathOptions: {
          nearRadius: 1.5,
          farRadius: 0.8,
          color: '#667eea',
          displayArrowsOnPath: true,
          animateArrowsOnPath: true,
        },
      });

      // Focus camera on path
      if (result.path && result.path.length > 0) {
        mapView.Camera.focusOn(result.path, {
          minZoom: 1000,
          maxZoom: 3000,
          animationDuration: 800,
        });
      }

      setDirections(result);
    } catch (error) {
      console.error('Directions error:', error);
      alert('Could not calculate directions. Please try different locations.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleClearPath = () => {
    mapView.Navigation.clear();
    setDirections(null);
  };

  return (
    <div className="directions-panel">
      <div className="directions-header">
        <h3>Get Directions</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* From Field */}
      <div className="directions-field">
        <label>From:</label>
        <div className="route-row">
          <span className="pin pin--from" />
          <div className="input-wrapper">
            <input
              type="text"
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
              placeholder="Search or use GPS..."
              autoComplete="off"
            />
            <button
              className="gps-btn"
              onClick={handleGPSLocation}
              disabled={isGPSLoading}
              title="Use my location"
            >
              {isGPSLoading ? <Loader size={16} className="spinning" /> : <Navigation size={16} />}
            </button>
          </div>
        </div>

        {fromSuggestions.length > 0 && (
          <div className="suggestions">
            {fromSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="suggestion-item"
                onClick={() => handleFromSelect(suggestion)}
              >
                <span className="suggestion-name">{suggestion.name}</span>
                <span className="suggestion-type">
                  {SearchService.getDisplayType(suggestion.type)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* To Field */}
      <div className="directions-field">
        <label>To:</label>
        <div className="route-row">
          <span className="pin pin--to" />
          <div className={`input-wrapper ${isMapSelecting ? 'selecting' : ''}`}>
            <input
              type="text"
              value={toQuery}
              onChange={(e) => setToQuery(e.target.value)}
              placeholder="Search or click map..."
              autoComplete="off"
            />
            <button
              className={`map-select-btn ${isMapSelecting ? 'active' : ''}`}
              onClick={() => setIsMapSelecting(!isMapSelecting)}
              title="Click map to select"
            >
              <MapPin size={16} />
            </button>
          </div>
        </div>

        {isMapSelecting && (
          <div className="selection-hint">
            <span className="pulse-icon">📍</span>
            Click on the map to select destination
          </div>
        )}

        {toSuggestions.length > 0 && (
          <div className="suggestions">
            {toSuggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="suggestion-item"
                onClick={() => handleToSelect(suggestion)}
              >
                <span className="suggestion-name">{suggestion.name}</span>
                <span className="suggestion-type">
                  {SearchService.getDisplayType(suggestion.type)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="divider" />

      {/* Accessible Mode Toggle */}
      <div className="accessible-toggle">
        <label>
          <input
            type="checkbox"
            checked={accessibleMode}
            onChange={(e) => setAccessibleMode(e.target.checked)}
          />
          <Accessibility size={16} />
          <span>Accessible Route</span>
        </label>
        <div className="toggle-description">
          {accessibleMode
            ? '♿ Prefers elevators and ramps'
            : '🚶 All routes (may include stairs)'}
        </div>
      </div>

      <hr className="divider" />

      {/* Action Buttons */}
      {!directions ? (
        <button
          className={`get-directions-btn ${fromLocation && toLocation ? 'ready' : ''}`}
          onClick={handleCalculateDirections}
          disabled={!fromLocation || !toLocation || isCalculating}
        >
          {isCalculating ? (
            <>
              <Loader size={16} className="spinning" />
              Calculating...
            </>
          ) : (
            <>
              <Navigation size={16} />
              Get Directions
            </>
          )}
        </button>
      ) : (
        <>
          <div className="directions-summary">
            <div className="summary-stat">
              <strong>{Math.round(directions.distance)}m</strong>
              <span>Distance</span>
            </div>
            <div className="summary-stat">
              <strong>{Math.ceil(directions.distance / 1.4 / 60)} min</strong>
              <span>Walk Time</span>
            </div>
            <div className="summary-stat">
              <strong>{directions.instructions?.length || 0}</strong>
              <span>Steps</span>
            </div>
          </div>
          <button className="clear-path-btn" onClick={handleClearPath}>
            <X size={16} />
            Clear Path
          </button>
        </>
      )}
    </div>
  );
}
