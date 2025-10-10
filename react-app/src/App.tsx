/**
 * Main App Component
 *
 * Mappedin Conference POC - React + TypeScript Version
 * Based on vanilla JS implementation in ../index.html
 */

import { useState, useEffect, useRef } from 'react';
import { getMapData, show3dMap } from '@mappedin/mappedin-js';
import '@mappedin/mappedin-js/lib/index.css';
import { SearchBar } from './components/SearchBar';
import { DirectionsPanel } from './components/DirectionsPanel';
import type { LocationSelection } from './types';
import './App.css';

function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [mapView, setMapView] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsDestination, setDirectionsDestination] = useState<LocationSelection | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initMap = async () => {
      try {
        // Use venue credentials from .env
        const data = await getMapData({
          key: 'mik_Qar1NBX1qFjtljLDI52a09ac2',
          secret: 'mis_CXFS9WnkQkzQmy9GCt4uL1Wqa28lvY98xQF7qbe968c557a',
          mapId: '66ce20fdf42a3e000b1b0545',
        });

        const view = await show3dMap(mapContainerRef.current!, data);

        setMapData(data);
        setMapView(view);
        setIsLoading(false);

        console.log('✅ Map initialized successfully');
        console.log('🏢 Floors:', data.getByType('floor').length);
        console.log('📍 Spaces:', data.getByType('space').length);
      } catch (err: any) {
        console.error('❌ Map initialization error:', err);
        setError(err.message || 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  const handleDirectionsClick = (destination?: LocationSelection) => {
    setDirectionsDestination(destination || null);
    setShowDirections(true);
  };

  return (
    <div className="app">
      {/* Map Container */}
      <div ref={mapContainerRef} className="map-container" />

      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading map...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-overlay">
          <div className="error-message">
            <h3>❌ Error Loading Map</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {mapData && mapView && !isLoading && (
        <div className="search-container">
          <SearchBar
            mapData={mapData}
            mapView={mapView}
            onSelect={() => {
              // Optionally open directions when selecting from search
            }}
          />
        </div>
      )}

      {/* Directions Panel */}
      {mapData && mapView && showDirections && (
        <div className="directions-container">
          <DirectionsPanel
            mapData={mapData}
            mapView={mapView}
            initialDestination={directionsDestination || undefined}
            onClose={() => setShowDirections(false)}
          />
        </div>
      )}

      {/* Floating Action Button */}
      {mapData && mapView && !showDirections && (
        <button
          className="fab"
          onClick={() => handleDirectionsClick()}
          title="Get Directions"
        >
          🧭
        </button>
      )}

      {/* Version Switcher */}
      <a
        href="../"
        className="version-switcher"
        title="Switch to Vanilla JavaScript version"
      >
        <span>Vanilla JS</span>
      </a>

      {/* Footer Info */}
      <div className="footer-info">
        <span>Mappedin Conference POC</span>
        <span>•</span>
        <span>React + TypeScript</span>
        <span>•</span>
        <a
          href="https://github.com/your-repo"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}

export default App;
