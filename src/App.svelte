<script lang="ts">
  import MapView from '$lib/components/MapView.svelte';
  import MapLabels from '$lib/components/MapLabels.svelte';
  import Search from '$lib/components/Search.svelte';
  import ExhibitorCard from '$lib/components/ExhibitorCard.svelte';
  import LocationCard from '$lib/components/LocationCard.svelte';
  import DirectionsModal from '$lib/components/DirectionsModal.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import FloorSelector from '$lib/components/FloorSelector.svelte';
  import AccessibilityToggle from '$lib/components/AccessibilityToggle.svelte';
</script>

<main class="relative w-full h-screen overflow-hidden">
  <!-- 3D Map Container -->
  <MapView />
  <MapLabels />

  <!-- UI Overlay Components -->
  <Search />
  <StatusBar />
  <ExhibitorCard />
  <LocationCard />
  <DirectionsModal />
  <FloorSelector />
  <AccessibilityToggle />

  <!-- Branding -->
  <div class="absolute bottom-4 left-4 text-sm text-muted-foreground/60 z-10 select-none">
    Powered by <span class="font-semibold">Mappedin</span>
  </div>
</main>
