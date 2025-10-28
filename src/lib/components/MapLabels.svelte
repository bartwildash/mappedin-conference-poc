<script lang="ts">
  import { onMount } from 'svelte';
  import { mapView, mapData, isMapReady, pathfindingFrom, pathfindingTo, amenities } from '$lib/stores/map';
  import type { AmenityItem } from '$lib/stores/map';
  import { exhibitors } from '$lib/stores/exhibitors';
  import { selectedLocation, locationCardOpen, selectingFromLocation, selectingToLocation } from '$lib/stores/ui';
  import { getIconSVG, getAmenityIcon } from '$lib/utils/icons';

  // Label system using Mappedin's collision ranking tiers (TCollisionRankingTier) + zoom-based visibility:
  // - 'high' rank, 14px text, zoom 18+: Exhibitors (highest priority, earliest visibility)
  // - 'high' rank, 14px text, zoom 19+: Special Areas (stages, lounges)
  // - 'high' rank, 11px text, zoom 19+: Food & Drink (high priority for user needs)
  // - 'medium' rank, 11px text, zoom 20+: POIs, Elevators, Stairs
  // - 'low' rank, 9px blue text, zoom 22: Restrooms (lowest priority, maximum zoom only)

  onMount(() => {
    const unsubView = mapView.subscribe(view => {
      const unsubData = mapData.subscribe(data => {
        const unsubExhibitors = exhibitors.subscribe(exh => {
          if (view && data && exh.length > 0) {
            addLabelsAndMarkers(view, data, exh);
            setupClickHandlers(view, data);
          }
        });
        return unsubExhibitors;
      });
      return unsubData;
    });
    return unsubView;
  });

  function setupClickHandlers(view: any, data: any) {
    // Make all spaces interactive and clickable
    const spaces = data.getByType('space');
    spaces.forEach((space: any) => {
      view.updateState(space, {
        interactive: true,
        hoverColor: '#14b8a6'
      });
    });

    // Make all objects interactive and clickable
    const objects = data.getByType('object');
    objects.forEach((obj: any) => {
      view.updateState(obj, {
        interactive: true,
        hoverColor: '#14b8a6'
      });
    });

    // Add click event listener
    view.on('click', (event: any) => {
      // Check if we're in direction selection mode
      let isSelectingFrom = false;
      let isSelectingTo = false;
      selectingFromLocation.subscribe(val => { isSelectingFrom = val; })();
      selectingToLocation.subscribe(val => { isSelectingTo = val; })();

      if (event.spaces && event.spaces.length > 0) {
        const space = event.spaces[0];

        // If in selection mode, fill the direction field
        if (isSelectingFrom) {
          pathfindingFrom.set(space);
          selectingFromLocation.set(false);
          console.log('✅ Set FROM location:', space.name);
          return;
        } else if (isSelectingTo) {
          pathfindingTo.set(space);
          selectingToLocation.set(false);
          console.log('✅ Set TO location:', space.name);
          return;
        }

        // Otherwise show location card
        selectedLocation.set({
          name: space.name || 'Unknown',
          type: 'Space',
          categories: space.categories || [],
          description: space.description,
          mapObject: space
        });
        locationCardOpen.set(true);
      } else if (event.objects && event.objects.length > 0) {
        const obj = event.objects[0];

        // If in selection mode, fill the direction field
        if (isSelectingFrom) {
          pathfindingFrom.set(obj);
          selectingFromLocation.set(false);
          console.log('✅ Set FROM location:', obj.name);
          return;
        } else if (isSelectingTo) {
          pathfindingTo.set(obj);
          selectingToLocation.set(false);
          console.log('✅ Set TO location:', obj.name);
          return;
        }

        // Look up exhibitor data for this object
        let exhibitorList: any[] = [];
        let boothNumber = '';

        const unsubExhibitors = exhibitors.subscribe(exhs => {
          // Find all exhibitors matching this object name (may be multiple co-exhibitors)
          exhibitorList = exhs.filter((exhibitor: any) => {
            const exhibitorName = (exhibitor.name || '').toLowerCase().trim();
            const objectName = (obj.name || '').toLowerCase().trim();
            return exhibitorName.includes(objectName) || objectName.includes(exhibitorName);
          });

          if (exhibitorList.length > 0) {
            boothNumber = exhibitorList[0].boothNumber || '';
          }
        });
        unsubExhibitors();

        // Show location card with exhibitor info
        selectedLocation.set({
          name: obj.name || 'Unknown',
          type: boothNumber ? `Booth ${boothNumber}` : 'Exhibitor',
          exhibitors: exhibitorList,
          categories: [],
          description: obj.description,
          mapObject: obj
        });
        locationCardOpen.set(true);
      }
    });
  }

  function addLabelsAndMarkers(view: any, data: any, exhibitorData: any[]) {

    // Remove any default Mappedin labels first
    try {
      view.Labels.removeAll();
    } catch (e) {
      // No default labels to clear
    }

    let successCount = 0;

    // 1. Add labels to ALL objects (exhibitors are objects!)
    const objects = data.getByType('object') || [];

    objects.forEach((obj: any) => {
      // Skip restrooms - they're handled in the amenity section with zoom 50
      const objNameLower = (obj.name || '').toLowerCase();
      if (objNameLower.includes('restroom') || objNameLower.includes('washroom') ||
          objNameLower.includes('bathroom') || objNameLower.includes('toilet') ||
          objNameLower.includes('wc')) {
        return; // Skip this object
      }

      // Determine if this is an exhibitor or a special area
      let rank = 'high'; // Default: Special Area (high rank)
      let labelColor = '#4a5568'; // Grey for special areas

      // Check if this object is an exhibitor (flexible name matching)
      const isExhibitor = exhibitorData.some((exhibitor: any) => {
        const exhibitorName = (exhibitor.name || '').toLowerCase().trim();
        const objectName = (obj.name || '').toLowerCase().trim();

        return (
          // Exact match
          exhibitor.name === obj.name ||
          // Partial match (exhibitor name contains object name or vice versa)
          exhibitorName.includes(objectName) ||
          objectName.includes(exhibitorName) ||
          // ExternalId match
          exhibitor.externalId === obj.id ||
          // Booth number match
          exhibitor.boothNumber === obj.name
        );
      });

      if (isExhibitor) {
        rank = 'high'; // Exhibitor (high priority with zoom threshold)
        labelColor = '#2d4a3e'; // Dark green/grey for exhibitors
      }

      // Add label with appropriate rank and zoom visibility
      if (obj.name) {
        try {
          const appearance: any = {
            textSize: 14,
            color: labelColor,
            textStrokeColor: 'rgba(255, 255, 255, 0.6)',
            textStrokeWidth: 1.5
          };

          // Set visibility threshold based on rank and type
          if (rank === 'high') {
            // Exhibitors and special areas: Progressive visibility
            if (isExhibitor) {
              // Exhibitors: Start showing at zoom 18
              appearance.textVisibleAtZoomLevel = 18;
            } else {
              // Special areas: Visible at zoom 19
              appearance.textVisibleAtZoomLevel = 19;
            }
          }

          view.Labels.add(obj, obj.name, {
            interactive: false,
            rank: rank,
            appearance: appearance
          });
          successCount++;
        } catch (error) {
          console.error('❌ Failed to add label for object:', obj.name, error);
        }
      }
    });

    // Count and identify each type (using same flexible matching)
    const exhibitorObjects = objects.filter((obj: any) =>
      exhibitorData.some((exhibitor: any) => {
        const exhibitorName = (exhibitor.name || '').toLowerCase().trim();
        const objectName = (obj.name || '').toLowerCase().trim();
        return (
          exhibitor.name === obj.name ||
          exhibitorName.includes(objectName) ||
          objectName.includes(exhibitorName) ||
          exhibitor.externalId === obj.id ||
          exhibitor.boothNumber === obj.name
        );
      })
    );
    const specialAreaObjects = objects.filter((obj: any) =>
      obj.name && !exhibitorData.some((exhibitor: any) => {
        const exhibitorName = (exhibitor.name || '').toLowerCase().trim();
        const objectName = (obj.name || '').toLowerCase().trim();
        return (
          exhibitor.name === obj.name ||
          exhibitorName.includes(objectName) ||
          objectName.includes(exhibitorName) ||
          exhibitor.externalId === obj.id ||
          exhibitor.boothNumber === obj.name
        );
      })
    );


    // 2. Add amenity labels (restrooms, cafes, etc.)
    addAmenityLabels(view, data);
  }

  function addAmenityLabels(view: any, data: any) {
    let amenityCount = 0;
    const foundAmenities: AmenityItem[] = [];

    // Get all SPACES (not locations) - amenities are spaces with categories
    const spaces = data.getByType('space');

    spaces.forEach((space: any) => {
      const name = space.name?.toLowerCase() || '';
      const categories = space.categories || [];

      let amenityType = null;
      let amenityName = null;
      let rank = 'medium'; // Default rank for amenities

      // Check for Food & Drink (high priority - early visibility)
      const isFoodDrink = categories.some((cat: any) =>
        cat.name?.toLowerCase().includes('food') ||
        cat.name?.toLowerCase().includes('drink') ||
        cat.name?.toLowerCase().includes('cafe')
      ) || name.includes('cafe') || name.includes('coffee') ||
         name.includes('restaurant') || name.includes('food') || name.includes('drink');

      if (isFoodDrink) {
        amenityType = 'cafe';
        amenityName = space.name || 'Food & Drink';
        rank = 'high'; // High priority for early visibility
      }
      // Check for Prayer Rooms
      else if (name.includes('prayer')) {
        amenityType = 'prayer';
        amenityName = space.name || 'Prayer Room';
        rank = 'medium';
      }
      // Check for Media/Press
      else if (name.includes('media') || name.includes('press')) {
        amenityType = 'media';
        amenityName = space.name || 'Media Centre';
        rank = 'medium';
      }
      // Check for Meeting/Business Rooms
      else if (name.includes('business suite') || name.includes('boardroom') ||
               name.includes('meeting') || name.includes('conference room')) {
        amenityType = 'meeting';
        amenityName = space.name || 'Meeting Room';
        rank = 'medium';
      }
      // Check for Customer Service
      else if (name.includes('customer service') || name.includes('service desk')) {
        amenityType = 'service';
        amenityName = space.name || 'Customer Service';
        rank = 'medium';
      }
      // Check for Security
      else if (name.includes('security')) {
        amenityType = 'security';
        amenityName = space.name || 'Security';
        rank = 'medium';
      }
      // Check for POIs
      else if (name.includes('atm') || name.includes('information') ||
               name.includes('info') || name.includes('help') ||
               name.includes('desk') || name.includes('reception')) {
        amenityType = name.includes('atm') ? 'atm'
          : name.includes('reception') ? 'reception'
          : 'information';
        amenityName = name.includes('atm') ? 'ATM'
          : name.includes('information') || name.includes('info')
          ? 'Information'
          : name.includes('reception')
          ? 'Reception'
          : space.name || 'Point of Interest';
        rank = 'medium';
      }
      // Check for restrooms (LOWEST PRIORITY)
      else if (name.includes('restroom') || name.includes('washroom') ||
          name.includes('bathroom') || name.includes('toilet') ||
          name.includes('wc')) {
        amenityType = name.includes('accessible') || name.includes('ada') || name.includes('wheelchair')
          ? 'accessible'
          : 'restroom';
        amenityName = name.includes('women') || name.includes('female') || name.includes('lady') || name.includes('ladies')
          ? 'Women\'s Restroom'
          : name.includes('men') || name.includes('male') || name.includes('gents')
          ? 'Men\'s Restroom'
          : name.includes('accessible') || name.includes('ada') || name.includes('wheelchair')
          ? 'Accessible Restroom'
          : 'Restroom';
        rank = 'low'; // LOWEST priority for toilets
      }

      // Add label with icon if it's an amenity
      if (amenityType && amenityName && space) {
        const iconName = getAmenityIcon(amenityType);

        // Size and color based on priority
        let textSize = 11;
        let iconSize = 16;
        let strokeWidth = 1.5;
        let textColor = '#333';
        let iconColor = '#333';

        if (rank === 'low') {
          // Restrooms: smallest and BLUE for visibility
          textSize = 9;
          iconSize = 12;
          strokeWidth = 0.8;
          textColor = '#3b82f6'; // Blue text
          iconColor = '#3b82f6'; // Blue icon
        }

        const iconSVG = getIconSVG(iconName, iconColor, iconSize);

        const appearance: any = {
          textSize: textSize,
          color: textColor,
          textStrokeColor: 'rgba(255, 255, 255, 0.9)',
          textStrokeWidth: strokeWidth,
          icon: iconSVG,
          iconSize: iconSize
        };

        // Set visibility thresholds based on rank and amenity type
        if (rank === 'high') {
          // High priority amenities (food & drink): Visible at zoom 19+
          appearance.textVisibleAtZoomLevel = 19;
          appearance.iconVisibleAtZoomLevel = 19;
        } else if (rank === 'medium') {
          // Medium priority (prayer rooms, POIs, etc): Visible at zoom 20+
          appearance.textVisibleAtZoomLevel = 20;
          appearance.iconVisibleAtZoomLevel = 20;
        } else if (rank === 'low') {
          // Low priority (restrooms): Visible at zoom 22 (max zoom only)
          appearance.textVisibleAtZoomLevel = 22;
          appearance.iconVisibleAtZoomLevel = 22;
        }

        view.Labels.add(space, amenityName, {
          interactive: false,
          rank: rank,
          appearance: appearance
        });

        // Add to searchable amenities
        foundAmenities.push({
          name: amenityName,
          type: amenityType as any,
          space: space,
          categories: categories.map((c: any) => c.name || '')
        });

        amenityCount++;
      }
    });

    // Add connection labels (elevators, stairs - rank 3)
    const connections = data.getByType('connection') || [];
    connections.forEach((connection: any) => {
      const type = connection.type?.toLowerCase() || '';
      let amenityName = null;
      let amenityType = null;

      if (type.includes('elevator')) {
        amenityName = 'Elevator';
        amenityType = 'elevator';
      } else if (type.includes('stair')) {
        amenityName = 'Stairs';
        amenityType = 'stairs';
      } else if (type.includes('escalator')) {
        amenityName = 'Escalator';
        amenityType = 'escalator';
      } else if (type.includes('ramp')) {
        amenityName = 'Ramp';
        amenityType = 'ramp';
      }

      if (amenityName && amenityType && connection.coordinate) {
        const iconName = getAmenityIcon(amenityType);
        const iconSVG = getIconSVG(iconName, '#333', 16);

        view.Labels.add(connection.coordinate, amenityName, {
          interactive: false,
          rank: 'medium', // Medium priority like other amenities
          appearance: {
            textSize: 11, // Match other amenities (smaller than exhibitors)
            color: '#333',
            textStrokeColor: 'rgba(255, 255, 255, 0.8)',
            textStrokeWidth: 1.5,
            icon: iconSVG,
            iconSize: 16,
            textVisibleAtZoomLevel: 20, // Visible at zoom 20+
            iconVisibleAtZoomLevel: 20
          }
        });
        amenityCount++;
      }
    });

    // Update amenities store for search
    amenities.set(foundAmenities);
  }
</script>
