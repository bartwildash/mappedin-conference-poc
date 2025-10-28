<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getMapData, show3dMap } from '@mappedin/mappedin-js';
  import '@mappedin/mappedin-js/lib/index.css';
  import { mapView, mapData, currentFloor, currentZoom, isMapReady } from '$lib/stores/map';
  import { loadExhibitors } from '$lib/stores/exhibitors';
  import { showStatus } from '$lib/stores/ui';

  let mapContainer: HTMLDivElement;

  // Mappedin credentials
  const MAP_CONFIG = {
    key: 'mik_iND9Ra87M1Ca4DD444be4063d',
    secret: 'mis_esa0RDim6GGkbO2f7m6jNca0ADvFcZc8IzigafkC2dq85341024',
    mapId: '688ea50e362b1d000ba0822b'
  };

  let cameraChangeHandler: ((event: any) => void) | null = null;

  onMount(async () => {
    try {
      showStatus('Loading map...', 'info', 0);

      // Load map data
      const data = await getMapData({
        key: MAP_CONFIG.key,
        secret: MAP_CONFIG.secret,
        mapId: MAP_CONFIG.mapId
      });

      // Initialize 3D map
      const view = await show3dMap(mapContainer, data);

      // Store in global state
      mapData.set(data);
      mapView.set(view);

      // Set initial floor
      if (data.getByType('floor').length > 0) {
        currentFloor.set(data.getByType('floor')[0].id);
      }

      // Load exhibitor data
      await loadExhibitors();

      // Listen to camera changes for zoom tracking
      cameraChangeHandler = (event: any) => {
        if (event.zoom !== undefined) {
          currentZoom.set(event.zoom);
        }
      };
      view.on('camera-change', cameraChangeHandler);

      showStatus('Map loaded successfully!', 'success', 2000);

    } catch (error) {
      console.error('Failed to load map:', error);
      showStatus('Failed to load map. Please refresh the page.', 'error', 0);
    }
  });

  onDestroy(() => {
    // Remove event listeners to prevent memory leaks
    const view = $mapView;
    if (view && cameraChangeHandler) {
      view.off('camera-change', cameraChangeHandler);
      cameraChangeHandler = null;
    }

    // Clean up map instance
    mapView.set(null);
    mapData.set(null);
  });
</script>

<div class="relative w-full h-screen">
  <div bind:this={mapContainer} id="mappedin-map" class="w-full h-full"></div>

  {#if !$isMapReady}
    <div class="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div class="text-center space-y-4">
        <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p class="text-lg font-medium">Loading 3D Map...</p>
      </div>
    </div>
  {/if}
</div>
