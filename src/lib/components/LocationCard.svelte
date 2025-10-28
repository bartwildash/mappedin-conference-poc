<script lang="ts">
  // Merged LocationCard with DirectionsModal functionality
  import Card from '$lib/components/ui/card.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Separator from '$lib/components/ui/separator.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import { selectedLocation, locationCardOpen, selectingFromLocation, selectingToLocation, showStatus } from '$lib/stores/ui';
  import { pathfindingTo, pathfindingFrom, mapView, mapData, accessibleMode, currentPath, searchAmenities } from '$lib/stores/map';
  import { searchExhibitors } from '$lib/stores/exhibitors';
  import { slide } from 'svelte/transition';
  import { isReactNativeWebView, notifyExhibitorSelected } from '$lib/utils/webview-bridge';
  import { isInIframe, notifyExhibitorClicked } from '$lib/utils/iframe-bridge';
  import type { ExhibitorData } from '$lib/types/mappedin';
  import type { AmenityItem } from '$lib/stores/map';

  interface SearchResult {
    type: 'exhibitor' | 'amenity';
    exhibitor?: ExhibitorData;
    amenity?: AmenityItem;
    name: string;
    subtitle: string;
    badge?: string;
    space?: any;
  }

  let coExhibitorsExpanded = $state(false);
  let mainExhibitorsExpanded = $state(false);
  let viewMode = $state<'details' | 'directions'>('details');

  // Directions state
  let fromSearch = $state('');
  let toSearch = $state('');
  let directions: any[] = $state([]);
  let fromResults = $state<SearchResult[]>([]);
  let toResults = $state<SearchResult[]>([]);
  let showFromResults = $state(false);
  let showToResults = $state(false);
  let fromSearchTimeout: ReturnType<typeof setTimeout>;
  let toSearchTimeout: ReturnType<typeof setTimeout>;

  const PREVIEW_COUNT = 3; // Show first 3 exhibitors by default

  const showOpenInAppButton = isReactNativeWebView() || isInIframe();

  // Update "to" field when location is selected and directions mode is active
  $effect(() => {
    if ($selectedLocation && viewMode === 'directions') {
      toSearch = $selectedLocation.name;
      if ($selectedLocation.mapObject) {
        pathfindingTo.set($selectedLocation.mapObject);
      }
    }
  });

  // Update search fields when locations are selected via map click
  $effect(() => {
    if ($pathfindingFrom) {
      fromSearch = $pathfindingFrom.name || 'Selected Location';
    }
  });

  $effect(() => {
    if ($pathfindingTo) {
      toSearch = $pathfindingTo.name || 'Selected Location';
    }
  });

  function closeCard() {
    locationCardOpen.set(false);
    selectedLocation.set(null);
    coExhibitorsExpanded = false;
    mainExhibitorsExpanded = false;
    viewMode = 'details';
    resetDirections();
  }

  function openDirections() {
    // Set the selected location as the "To" destination
    if ($selectedLocation && $selectedLocation.mapObject) {
      pathfindingTo.set($selectedLocation.mapObject);
      toSearch = $selectedLocation.name;
    }
    viewMode = 'directions';
  }

  function resetDirections() {
    fromSearch = '';
    toSearch = '';
    fromResults = [];
    toResults = [];
    showFromResults = false;
    showToResults = false;
    directions = [];
    selectingFromLocation.set(false);
    selectingToLocation.set(false);
  }

  function toggleCoExhibitors() {
    coExhibitorsExpanded = !coExhibitorsExpanded;
  }

  function toggleMainExhibitors() {
    mainExhibitorsExpanded = !mainExhibitorsExpanded;
  }

  function handleOpenInApp() {
    // Get exhibitor data
    const exhibitor = $selectedLocation?.exhibitors?.[0];
    if (!exhibitor) return;

    const data = {
      externalId: exhibitor.externalId,
      name: exhibitor.name,
      boothNumber: exhibitor.boothNumber,
      description: exhibitor.description,
      website: exhibitor.website
    };

    // Notify parent app (React Native or iframe)
    if (isReactNativeWebView()) {
      notifyExhibitorSelected(data);
    } else if (isInIframe()) {
      notifyExhibitorClicked({
        externalId: data.externalId,
        name: data.name,
        boothNumber: data.boothNumber
      });
    }

    closeCard();
  }

  // Debounced search for FROM field
  function handleFromSearch() {
    clearTimeout(fromSearchTimeout);
    fromSearchTimeout = setTimeout(() => {
      if (fromSearch.length >= 2) {
        const results: SearchResult[] = [];

        // Search exhibitors
        const unsubExhibitors = searchExhibitors.subscribe(searcher => {
          const exhibitorResults = searcher(fromSearch);
          exhibitorResults.forEach(exhibitor => {
            const data = $mapData;
            if (data) {
              const locations = data.getByType('location');
              const location = locations.find(loc => loc.id === exhibitor.externalId);
              if (location?.space) {
                results.push({
                  type: 'exhibitor',
                  exhibitor,
                  name: exhibitor.name,
                  subtitle: `Booth ${exhibitor.boothNumber}`,
                  badge: exhibitor.category,
                  space: location.space
                });
              }
            }
          });
        });
        unsubExhibitors();

        // Search amenities
        const unsubAmenities = searchAmenities.subscribe(searcher => {
          const amenityResults = searcher(fromSearch);
          amenityResults.forEach(amenity => {
            results.push({
              type: 'amenity',
              amenity,
              name: amenity.name,
              subtitle: amenity.type.charAt(0).toUpperCase() + amenity.type.slice(1),
              badge: 'Amenity',
              space: amenity.space
            });
          });
        });
        unsubAmenities();

        fromResults = results;
        showFromResults = true;
      } else {
        fromResults = [];
        showFromResults = false;
      }
    }, 200);
  }

  // Debounced search for TO field
  function handleToSearch() {
    clearTimeout(toSearchTimeout);
    toSearchTimeout = setTimeout(() => {
      if (toSearch.length >= 2) {
        const results: SearchResult[] = [];

        // Search exhibitors
        const unsubExhibitors = searchExhibitors.subscribe(searcher => {
          const exhibitorResults = searcher(toSearch);
          exhibitorResults.forEach(exhibitor => {
            const data = $mapData;
            if (data) {
              const locations = data.getByType('location');
              const location = locations.find(loc => loc.id === exhibitor.externalId);
              if (location?.space) {
                results.push({
                  type: 'exhibitor',
                  exhibitor,
                  name: exhibitor.name,
                  subtitle: `Booth ${exhibitor.boothNumber}`,
                  badge: exhibitor.category,
                  space: location.space
                });
              }
            }
          });
        });
        unsubExhibitors();

        // Search amenities
        const unsubAmenities = searchAmenities.subscribe(searcher => {
          const amenityResults = searcher(toSearch);
          amenityResults.forEach(amenity => {
            results.push({
              type: 'amenity',
              amenity,
              name: amenity.name,
              subtitle: amenity.type.charAt(0).toUpperCase() + amenity.type.slice(1),
              badge: 'Amenity',
              space: amenity.space
            });
          });
        });
        unsubAmenities();

        toResults = results;
        showToResults = true;
      } else {
        toResults = [];
        showToResults = false;
      }
    }, 200);
  }

  // Select FROM location
  function selectFromResult(result: SearchResult) {
    fromSearch = result.name;
    showFromResults = false;

    if (result.space) {
      pathfindingFrom.set(result.space);
    }
  }

  // Select TO location
  function selectToResult(result: SearchResult) {
    toSearch = result.name;
    showToResults = false;

    if (result.space) {
      pathfindingTo.set(result.space);
    }
  }

  async function calculateDirections() {
    // Validation checks
    if (!$mapView) {
      showStatus('Map not ready. Please try again.', 'error');
      return;
    }

    if (!$pathfindingFrom || !$pathfindingTo) {
      showStatus('Please select both start and end locations', 'warning');
      return;
    }

    // Check if start and end are the same
    if ($pathfindingFrom.id === $pathfindingTo.id) {
      showStatus('Start and destination cannot be the same location', 'warning');
      return;
    }

    try {
      showStatus('Calculating route...', 'info');

      const options = {
        accessible: $accessibleMode
      };

      const path = $mapView.getDirections($pathfindingFrom, $pathfindingTo, options);

      if (path && path.instructions && path.instructions.length > 0) {
        // Clear existing path if any
        if ($currentPath) {
          $mapView.Paths.remove($currentPath);
        }

        currentPath.set(path);
        $mapView.Paths.add(path, {
          color: '#14b8a6',
          nearRadius: 0.5,
          farRadius: 0.3
        });

        directions = path.instructions;
        showStatus(`Route found! ${path.instructions.length} steps`, 'success');
      } else {
        showStatus('No route found between these locations', 'warning');
        directions = [];
      }
    } catch (error) {
      console.error('Failed to calculate directions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showStatus(`Route calculation failed: ${errorMessage}`, 'error');
      directions = [];
    }
  }

  function clearDirections() {
    if ($mapView && $currentPath) {
      $mapView.Paths.remove($currentPath);
    }
    pathfindingFrom.set(null);
    pathfindingTo.set(null);
    currentPath.set(null);
    directions = [];
  }
</script>

{#if $locationCardOpen && $selectedLocation}
  <div class="absolute bottom-4 left-4 right-4 z-20 max-w-2xl mx-auto md:left-auto md:right-4 md:max-w-xl lg:max-w-2xl" transition:slide={{ duration: 300, opacity: 0.95 }}>
    <Card class="shadow-2xl border-2 backdrop-blur-sm bg-background/98 max-h-[85vh] overflow-y-auto overscroll-contain scroll-smooth">
      <div class="p-5 sm:p-6 space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            {#if $selectedLocation.exhibitors && $selectedLocation.exhibitors.length > 0}
              <!-- Show booth number as main title for exhibitors -->
              <h2 class="text-xl sm:text-2xl font-bold">{$selectedLocation.type}</h2>
            {:else}
              <h2 class="text-xl sm:text-2xl font-bold">{$selectedLocation.name}</h2>
              {#if $selectedLocation.type}
                <p class="text-xs sm:text-sm text-muted-foreground mt-1">
                  {$selectedLocation.type}
                </p>
              {/if}
            {/if}
          </div>
          <button
            onclick={closeCard}
            class="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Close location card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- View Mode Tabs -->
        <div class="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onclick={() => viewMode = 'details'}
            class="flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all {
              viewMode === 'details'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }"
          >
            Details
          </button>
          <button
            onclick={() => {
              viewMode = 'directions';
              openDirections();
            }}
            class="flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all {
              viewMode === 'directions'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }"
          >
            Directions
          </button>
        </div>

        {#if viewMode === 'details'}
        <!-- DETAILS VIEW -->
        <!-- Action Buttons -->
        <div class="flex gap-2">
          <Button onclick={openDirections} class="flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            Get Directions
          </Button>

          {#if showOpenInAppButton && $selectedLocation.exhibitors && $selectedLocation.exhibitors.length > 0}
            <Button onclick={handleOpenInApp} variant="outline" class="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" x2="21" y1="14" y2="3"></line>
              </svg>
              Open in App
            </Button>
          {/if}
        </div>

        <!-- Exhibitor List -->
        {#if $selectedLocation.exhibitors && $selectedLocation.exhibitors.length > 0}
          {@const mainExhibitors = $selectedLocation.exhibitors.filter(e => e.category === 'Exhibitor')}
          {@const coExhibitors = $selectedLocation.exhibitors.filter(e => e.category === 'Co-Exhibitor')}
          {@const visibleMainExhibitors = mainExhibitorsExpanded ? mainExhibitors : mainExhibitors.slice(0, PREVIEW_COUNT)}
          {@const hasMoreMain = mainExhibitors.length > PREVIEW_COUNT}

          <!-- Responsive scrollable container -->
          <div class="space-y-3 max-h-60 sm:max-h-72 md:max-h-80 lg:max-h-96 overflow-y-auto overscroll-contain scroll-smooth">
            <!-- Main Exhibitors - Always show preview -->
            {#each visibleMainExhibitors as exhibitor}
              <div class="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-base flex-1">{exhibitor.name}</h3>
                  <Badge variant="default" class="shrink-0">Main</Badge>
                </div>
                {#if exhibitor.description}
                  <p class="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {exhibitor.description}
                  </p>
                {/if}
                {#if exhibitor.website}
                  <a
                    href={exhibitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Visit Website
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" x2="21" y1="14" y2="3"></line>
                    </svg>
                  </a>
                {/if}
              </div>
            {/each}

            <!-- Show More Main Exhibitors Button -->
            {#if hasMoreMain && !mainExhibitorsExpanded}
              <button
                onclick={toggleMainExhibitors}
                class="w-full py-3 px-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all text-sm font-semibold text-primary flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
                Show {mainExhibitors.length - PREVIEW_COUNT} More Exhibitor{mainExhibitors.length - PREVIEW_COUNT !== 1 ? 's' : ''}
              </button>
            {/if}

            <!-- Show Less Button -->
            {#if mainExhibitorsExpanded && hasMoreMain}
              <button
                onclick={toggleMainExhibitors}
                class="w-full py-2 px-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="rotate-180">
                  <path d="m6 9 6 6 6-6"></path>
                </svg>
                Show Less
              </button>
            {/if}

            <!-- Co-Exhibitors - Collapsible -->
            {#if coExhibitors.length > 0}
              <Separator />
              <div>
                <button
                  onclick={toggleCoExhibitors}
                  class="w-full flex items-center justify-between py-2 text-left hover:bg-accent/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <span class="text-sm font-semibold text-muted-foreground">
                    Co-Exhibitors ({coExhibitors.length})
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="transition-transform {coExhibitorsExpanded ? 'rotate-180' : ''}"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>

                {#if coExhibitorsExpanded}
                  <div class="space-y-2 mt-2" transition:slide={{ duration: 200 }}>
                    {#each coExhibitors as exhibitor}
                      <div class="rounded-lg border bg-card p-3">
                        <h3 class="font-semibold text-sm mb-1">{exhibitor.name}</h3>
                        {#if exhibitor.description}
                          <p class="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {exhibitor.description}
                          </p>
                        {/if}
                        {#if exhibitor.website}
                          <a
                            href={exhibitor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            Website
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" x2="21" y1="14" y2="3"></line>
                            </svg>
                          </a>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Categories -->
          {#if $selectedLocation.categories && $selectedLocation.categories.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each $selectedLocation.categories as category}
                <Badge variant="secondary">{category.name}</Badge>
              {/each}
            </div>
          {/if}

          <!-- Description -->
          {#if $selectedLocation.description}
            <p class="text-sm text-foreground/80">
              {$selectedLocation.description}
            </p>
          {/if}
        {/if}
        {:else if viewMode === 'directions'}
        <!-- DIRECTIONS VIEW -->
        <!-- From/To Fields -->
        <div class="space-y-3">
          <!-- From -->
          <div class="relative">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm shrink-0">
                A
              </div>
              <label for="from-input" class="text-sm font-semibold">Starting Point</label>
            </div>
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <Input
                    id="from-input"
                    bind:value={fromSearch}
                    oninput={handleFromSearch}
                    onfocus={() => fromResults.length > 0 && (showFromResults = true)}
                    placeholder="Search exhibitor, amenity, or tap map..."
                    class="h-11 pl-10 pr-3 focus-visible:ring-primary"
                  />
                </div>
                {#if showFromResults && fromResults.length > 0}
                  <Card class="absolute top-full mt-2 w-full max-h-64 overflow-y-auto shadow-xl z-[100] border-2 bg-background">
                    <div class="px-3 py-2 bg-muted/50 border-b">
                      <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {fromResults.length} result{fromResults.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {#each fromResults as result}
                      <button
                        onclick={() => selectFromResult(result)}
                        class="w-full text-left px-4 py-3 hover:bg-accent/80 transition-all border-b last:border-b-0 group"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm truncate group-hover:text-primary transition-colors">{result.name}</div>
                            <div class="text-xs text-muted-foreground mt-0.5">{result.subtitle}</div>
                          </div>
                          {#if result.badge}
                            <Badge
                              variant={result.type === 'exhibitor'
                                ? (result.badge === 'Exhibitor' ? 'default' : 'secondary')
                                : 'outline'
                              }
                              class="text-xs shrink-0"
                            >
                              {result.badge}
                            </Badge>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </Card>
                {/if}
              </div>
              <Button
                variant={$selectingFromLocation ? 'default' : 'outline'}
                size="icon"
                class="h-11 w-11 shrink-0"
                onclick={() => {
                  selectingFromLocation.set(!$selectingFromLocation);
                  selectingToLocation.set(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </Button>
            </div>
            {#if $selectingFromLocation}
              <Badge variant="default" class="mt-2 animate-pulse">Tap anywhere on the map</Badge>
            {/if}
          </div>

          <!-- Swap Button -->
          <div class="flex justify-center -my-1">
            <Button
              variant="ghost"
              size="icon"
              class="h-10 w-10 rounded-full"
              onclick={() => {
                const temp = fromSearch;
                fromSearch = toSearch;
                toSearch = temp;
                const tempLoc = $pathfindingFrom;
                pathfindingFrom.set($pathfindingTo);
                pathfindingTo.set(tempLoc);
              }}
              aria-label="Swap start and end locations"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 16V4M7 4L3 8M7 4l4 4"></path>
                <path d="M17 8v12m0 0 4-4m-4 4-4-4"></path>
              </svg>
            </Button>
          </div>

          <!-- To -->
          <div class="relative">
            <div class="flex items-center gap-2 mb-2">
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-destructive text-destructive-foreground font-semibold text-sm shrink-0">
                B
              </div>
              <label for="to-input" class="text-sm font-semibold">Destination</label>
            </div>
            <div class="flex gap-2">
              <div class="flex-1 relative">
                <div class="relative">
                  <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                  <Input
                    id="to-input"
                    bind:value={toSearch}
                    oninput={handleToSearch}
                    onfocus={() => toResults.length > 0 && (showToResults = true)}
                    placeholder="Search exhibitor, amenity, or tap map..."
                    class="h-11 pl-10 pr-3 focus-visible:ring-destructive"
                  />
                </div>
                {#if showToResults && toResults.length > 0}
                  <Card class="absolute top-full mt-2 w-full max-h-64 overflow-y-auto shadow-xl z-[100] border-2 bg-background">
                    <div class="px-3 py-2 bg-muted/50 border-b">
                      <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {toResults.length} result{toResults.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {#each toResults as result}
                      <button
                        onclick={() => selectToResult(result)}
                        class="w-full text-left px-4 py-3 hover:bg-accent/80 transition-all border-b last:border-b-0 group"
                      >
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1 min-w-0">
                            <div class="font-semibold text-sm truncate group-hover:text-destructive transition-colors">{result.name}</div>
                            <div class="text-xs text-muted-foreground mt-0.5">{result.subtitle}</div>
                          </div>
                          {#if result.badge}
                            <Badge
                              variant={result.type === 'exhibitor'
                                ? (result.badge === 'Exhibitor' ? 'default' : 'secondary')
                                : 'outline'
                              }
                              class="text-xs shrink-0"
                            >
                              {result.badge}
                            </Badge>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </Card>
                {/if}
              </div>
              <Button
                variant={$selectingToLocation ? 'destructive' : 'outline'}
                size="icon"
                class="h-11 w-11 shrink-0"
                onclick={() => {
                  selectingToLocation.set(!$selectingToLocation);
                  selectingFromLocation.set(false);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </Button>
            </div>
            {#if $selectingToLocation}
              <Badge variant="destructive" class="mt-2 animate-pulse">Tap anywhere on the map</Badge>
            {/if}
          </div>
        </div>

        <!-- Accessibility Toggle -->
        <div class="flex items-center gap-2 p-3 bg-muted rounded-md">
          <input
            type="checkbox"
            id="accessible-route"
            bind:checked={$accessibleMode}
            class="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
          />
          <label for="accessible-route" class="text-sm font-medium cursor-pointer">
            Prefer accessible routes (elevators, ramps)
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2">
          <Button class="flex-1 h-12 text-base font-semibold" onclick={calculateDirections}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            Show Route
          </Button>
          {#if $currentPath}
            <Button variant="outline" class="h-12" onclick={clearDirections}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </Button>
          {/if}
        </div>

        <!-- Directions List -->
        {#if directions.length > 0}
          <Separator />
          <div class="space-y-2 max-h-60 overflow-y-auto scroll-smooth">
            <h3 class="font-semibold text-sm text-muted-foreground">Turn-by-turn directions</h3>
            {#each directions as direction, i}
              <div class="p-3 rounded-lg border bg-card">
                <div class="flex items-start gap-3">
                  <div class="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div class="flex-1">
                    <p class="text-sm">{direction.instruction}</p>
                    {#if direction.distance}
                      <p class="text-xs text-muted-foreground mt-1">{direction.distance}</p>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
        {/if}
      </div>
    </Card>
  </div>
{/if}
