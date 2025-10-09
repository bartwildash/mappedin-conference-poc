import React from 'react';
import { X, Navigation, Share2 } from 'lucide-react';
import './ExhibitorCard.css';

interface ExhibitorCardProps {
  space: any;
  exhibitorData: Record<string, any[]>;
  showNavPanel: boolean;
  onDirections: () => void;
  onClose: () => void;
}

const ExhibitorCard: React.FC<ExhibitorCardProps> = ({
  space,
  exhibitorData,
  showNavPanel,
  onDirections,
  onClose
}) => {
  const exhibitors = exhibitorData[space.externalId] || [];
  const hasExhibitors = exhibitors.length > 0;

  const handleShare = () => {
    const url = `${window.location.origin}?booth=${space.externalId}`;
    navigator.clipboard.writeText(url);
    alert('Booth URL copied to clipboard!');
  };

  return (
    <div className={`exhibitor-card ${showNavPanel ? 'compact' : ''}`}>
      <div className="card-header">
        <div>
          <div className="card-title">
            {hasExhibitors
              ? exhibitors.length === 1
                ? exhibitors[0].name
                : `Booth ${space.externalId} - Co-Exhibitors`
              : space.name || 'Unnamed Space'}
          </div>
          {space.externalId && (
            <div className="card-booth">📍 Booth {space.externalId}</div>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {!showNavPanel && (
        <>
          {/* Primary Actions */}
          <div className="card-actions">
            <button className="action-btn" onClick={onDirections}>
              <Navigation size={18} />
              Directions
            </button>
            {space.externalId && (
              <button className="action-btn" onClick={handleShare}>
                <Share2 size={18} />
                Share URL
              </button>
            )}
          </div>

          {/* Exhibitor Info */}
          <div className="card-description">
            {hasExhibitors ? (
              exhibitors.length === 1 ? (
                // Single exhibitor
                <div>
                  <div className="exhibitor-country">
                    <strong>🌍 {exhibitors[0].country}</strong>
                  </div>
                  <p>{exhibitors[0].description}</p>
                  {exhibitors[0].website && (
                    <p>
                      <a href={exhibitors[0].website} target="_blank" rel="noopener noreferrer">
                        🌐 Visit Website
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                // Multiple co-exhibitors
                exhibitors.map((ex, index) => (
                  <div key={index} className="co-exhibitor">
                    <strong>{ex.name}</strong>
                    <div className="exhibitor-country">🌍 {ex.country}</div>
                    <p>{ex.description}</p>
                    {ex.website && (
                      <a href={ex.website} target="_blank" rel="noopener noreferrer">
                        🌐 Visit Website
                      </a>
                    )}
                  </div>
                ))
              )
            ) : (
              <p>{space.description || `This is ${space.name || 'a space'} in the venue.`}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExhibitorCard;
