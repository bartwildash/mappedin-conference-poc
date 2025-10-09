import React, { useState } from 'react';
import { Route, MapPin, Accessibility, X } from 'lucide-react';
import './NavigationPanel.css';

interface NavigationPanelProps {
  destination: any;
  accessibleMode: boolean;
  onAccessibleToggle: () => void;
  mapData: any;
  mapView: any;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  destination,
  accessibleMode,
  onAccessibleToggle,
  mapData,
  mapView
}) => {
  const [fromLocation, setFromLocation] = useState<any>(null);
  const [fromInput, setFromInput] = useState('');
  const [showPath, setShowPath] = useState(false);

  const handlePinDrop = () => {
    alert('Click on the map to set your starting location');

    const handleClick = (event: any) => {
      if (event.spaces?.length > 0) {
        const space = event.spaces[0];
        setFromLocation(space);
        setFromInput(space.name || space.externalId || 'Selected Location');
      } else if (event.coordinate) {
        setFromLocation(event.coordinate);
        setFromInput(`Pin location (${event.coordinate.latitude.toFixed(4)}, ${event.coordinate.longitude.toFixed(4)})`);
      }

      mapView.off('click', handleClick);
    };

    mapView.on('click', handleClick);
  };

  const handleGetDirections = async () => {
    if (!fromLocation || !destination || !mapData || !mapView) {
      alert('Please select a starting location');
      return;
    }

    try {
      const directions = await mapData.getDirections(fromLocation, destination, {
        accessible: accessibleMode
      });

      // Draw the path
      mapView.Navigation.draw(directions, {
        pathOptions: {
          nearRadius: 1.5,
          farRadius: 0.8,
          color: '#667eea'
        },
        animatedPathOptions: {
          color: '#667eea',
          animationDuration: 2000
        }
      });

      // Zoom to show path
      if (directions.path && directions.path.length > 0) {
        mapView.Camera.focusOn(directions.path, {
          minZoom: 1000,
          maxZoom: 3000,
          animationDuration: 800
        });
      }

      setShowPath(true);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Failed to calculate route');
    }
  };

  const handleClearPath = () => {
    if (mapView) {
      mapView.Navigation.clear();
      setShowPath(false);
    }
  };

  return (
    <div className="navigation-panel">
      {/* To Field */}
      <div className="nav-field">
        <label>To:</label>
        <input
          type="text"
          value={destination.name || destination.externalId || 'Selected Location'}
          readOnly
          className="nav-input readonly"
        />
      </div>

      {/* From Field */}
      <div className="nav-field">
        <label>From:</label>
        <div className="input-with-icon">
          <input
            type="text"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            placeholder="Search location or drop pin..."
            className="nav-input"
          />
          <MapPin
            size={16}
            className="input-icon pin-icon"
            onClick={handlePinDrop}
          />
        </div>
      </div>

      {/* Accessible Toggle */}
      <div className="accessible-toggle">
        <label>
          <div className="toggle-label">
            <Accessibility size={16} />
            <span>Accessible Route</span>
          </div>
          <input
            type="checkbox"
            checked={accessibleMode}
            onChange={onAccessibleToggle}
          />
        </label>
        <div className="toggle-status">
          {accessibleMode
            ? '♿ Prefers elevators and ramps'
            : '🚶 All routes (may include stairs)'}
        </div>
      </div>

      {/* Get Directions Button */}
      {!showPath && (
        <button className="get-directions-btn" onClick={handleGetDirections}>
          <Route size={16} />
          Get Directions
        </button>
      )}

      {/* Clear Path Button */}
      {showPath && (
        <button className="clear-path-btn" onClick={handleClearPath}>
          <X size={16} />
          Clear Path
        </button>
      )}
    </div>
  );
};

export default NavigationPanel;
