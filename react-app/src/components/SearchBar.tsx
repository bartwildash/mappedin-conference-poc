/**
 * Search Bar Component
 *
 * Live search with autocomplete suggestions
 * Ported from public/js/search-module.js
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Hash, Store, Building2, MapPin } from 'lucide-react';
import { SearchService } from '@/services/SearchService';
import type { SearchSuggestion } from '@/types';
import './SearchBar.css';

interface SearchBarProps {
  mapData: any;
  mapView: any;
  onSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
}

export function SearchBar({
  mapData,
  mapView,
  onSelect,
  placeholder = 'Search exhibitors, booths, amenities...',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchService = useRef(new SearchService(mapData)).current;
  const debounceTimer = useRef<number>();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      const results = await searchService.getSuggestions(query);
      setSuggestions(results);
      setIsLoading(false);
      setShowSuggestions(true);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, searchService]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);

    // Focus camera on selection
    if (suggestion.node && mapView) {
      mapView.Camera.focusOn(suggestion.node);
    }

    onSelect?.(suggestion);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booth':
        return <Hash size={20} />;
      case 'enterpriseLocation':
      case 'location':
        return <Store size={20} />;
      case 'place':
        return <Building2 size={20} />;
      default:
        return <MapPin size={20} />;
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
      </div>

      {showSuggestions && (
        <div className="search-suggestions">
          {isLoading ? (
            <div className="search-loading">
              <div className="loading-spinner" />
              <span>Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="search-suggestion"
                onClick={() => handleSelect(suggestion)}
              >
                <div className="suggestion-icon">{getIcon(suggestion.type)}</div>
                <div className="suggestion-content">
                  <div className="suggestion-name">{suggestion.name}</div>
                  <div className="suggestion-type">
                    {SearchService.getDisplayType(suggestion.type)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">No results found</div>
              <div className="empty-state-description">
                Try a different search term
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
