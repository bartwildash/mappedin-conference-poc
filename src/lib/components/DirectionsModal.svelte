<script lang="ts">
  import Dialog from '$lib/components/ui/dialog.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Separator from '$lib/components/ui/separator.svelte';
  import { directionsOpen, selectingFromLocation, selectingToLocation } from '$lib/stores/ui';
  import { mapView, mapData, accessibleMode, pathfindingFrom, pathfindingTo, currentPath, searchAmenities } from '$lib/stores/map';
  import { selectedExhibitor, searchExhibitors } from '$lib/stores/exhibitors';
  import { showStatus } from '$lib/stores/ui';
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

  let fromSearch = $state('');
  let toSearch = $state('');
  let directions: any[] = $state([]);
  let fromResults = $state<SearchResult[]>([]);
  let toResults = $state<SearchResult[]>([]);
  let showFromResults = $state(false);
  let showToResults = $state(false);
  let fromSearchTimeout: ReturnType<typeof setTimeout>;
  let toSearchTimeout: ReturnType<typeof setTimeout>;

  $effect(() => {
    if ($selectedExhibitor && $directionsOpen) {
      toSearch = $selectedExhibitor.name;
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

  // Debounced search for FROM field - searches both exhibitors and amenities
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

  // Debounced search for TO field - searches both exhibitors and amenities
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

  // Select FROM location (exhibitor or amenity)
  function selectFromResult(result: SearchResult) {
    fromSearch = result.name;
    showFromResults = false;

    if (result.space) {
      pathfindingFrom.set(result.space);
    }
  }

  // Select TO location (exhibitor or amenity)
  function selectToResult(result: SearchResult) {
    toSearch = result.name;
    showToResults = false;

    if (result.space) {
      pathfindingTo.set(result.space);
    }
  }

  function closeModal() {
    directionsOpen.set(false);
    fromSearch = '';
    toSearch = '';
    selectingFromLocation.set(false);
    selectingToLocation.set(false);
  }

  async function calculateDirections() {
    if (!$mapView || !$pathfindingFrom || !$pathfindingTo) {
      showStatus('Please select both start and end locations', 'warning');
      return;
    }

    try {
      const options = {
        accessible: $accessibleMode
      };

      const path = $mapView.getDirections($pathfindingFrom, $pathfindingTo, options);

      if (path) {
        currentPath.set(path);
        $mapView.Paths.add(path, {
          color: '#14b8a6',
          nearRadius: 0.5,
          farRadius: 0.3
        });

        directions = path.instructions || [];
        showStatus('Directions calculated!', 'success');
      }
    } catch (error) {
      console.error('Failed to calculate directions:', error);
      showStatus('Failed to calculate directions', 'error');
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

<Dialog open={$directionsOpen} onOpenChange={(open) => directionsOpen.set(open)}>
  <div class="space-y-4 overflow-visible">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold">Get Directions</h2>
        <p class="text-sm text-muted-foreground mt-1">Find your way to any exhibitor</p>
      </div>
      <button
        onclick={closeModal}
        class="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2 rounded-lg hover:bg-accent"
        aria-label="Close directions modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </div>

    <Separator />

    <!-- From/To Fields -->
    <div class="space-y-3 overflow-visible">
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
      <div class="space-y-2 max-h-64 overflow-y-auto">
        <h3 class="font-semibold text-sm text-muted-foreground">Turn-by-turn directions</h3>
        {#each directions as direction, i}
          <Card class="p-3">
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
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</Dialog>
