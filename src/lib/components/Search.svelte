<script lang="ts">
  import { onMount } from 'svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import { mapView, mapData, searchAmenities } from '$lib/stores/map';
  import type { AmenityItem } from '$lib/stores/map';
  import { exhibitors, selectedExhibitor, searchExhibitors } from '$lib/stores/exhibitors';
  import { exhibitorCardOpen } from '$lib/stores/ui';
  import type { ExhibitorData } from '$lib/types/mappedin';

  interface SearchResult {
    type: 'exhibitor' | 'amenity';
    exhibitor?: ExhibitorData;
    amenity?: AmenityItem;
    name: string;
    subtitle: string;
    badge?: string;
  }

  let searchQuery = $state('');
  let searchResults = $state<SearchResult[]>([]);
  let showResults = $state(false);
  let isSearching = $state(false);
  let searchTimeout: ReturnType<typeof setTimeout>;
  let selectedIndex = $state(-1);

  // Debounced search with loading state - searches both exhibitors and amenities
  function handleSearch() {
    clearTimeout(searchTimeout);

    if (searchQuery.length >= 2) {
      isSearching = true;
      searchTimeout = setTimeout(() => {
        const results: SearchResult[] = [];

        // Search exhibitors
        const unsubExhibitors = searchExhibitors.subscribe(searcher => {
          const exhibitorResults = searcher(searchQuery);
          exhibitorResults.forEach(exhibitor => {
            results.push({
              type: 'exhibitor',
              exhibitor,
              name: exhibitor.name,
              subtitle: `Booth ${exhibitor.boothNumber}`,
              badge: exhibitor.category
            });
          });
        });
        unsubExhibitors();

        // Search amenities
        const unsubAmenities = searchAmenities.subscribe(searcher => {
          const amenityResults = searcher(searchQuery);
          amenityResults.forEach(amenity => {
            results.push({
              type: 'amenity',
              amenity,
              name: amenity.name,
              subtitle: amenity.type.charAt(0).toUpperCase() + amenity.type.slice(1),
              badge: 'Amenity'
            });
          });
        });
        unsubAmenities();

        searchResults = results;
        console.log('Search results:', results.length, '(exhibitors + amenities)');
        showResults = true;
        isSearching = false;
        selectedIndex = -1;
      }, 200);
    } else {
      searchResults = [];
      showResults = false;
      isSearching = false;
      selectedIndex = -1;
    }
  }

  // Keyboard navigation
  function handleKeyDown(e: KeyboardEvent) {
    if (!showResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, searchResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectResult(searchResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      showResults = false;
    }
  }

  async function selectResult(result: SearchResult) {
    searchQuery = result.name;
    showResults = false;

    const view = $mapView;
    const data = $mapData;
    if (!view || !data) return;

    if (result.type === 'exhibitor' && result.exhibitor) {
      // Handle exhibitor selection
      selectedExhibitor.set(result.exhibitor);
      exhibitorCardOpen.set(true);

      // Find location by externalId
      const locations = data.getByType('location');
      const location = locations.find(loc => loc.profile?.externalId === result.exhibitor!.externalId);

      if (location && location.space) {
        view.Camera.focusOn({
          nodes: [location.space],
          minZoom: 22,
          animate: true
        });

        view.Markers.removeAll();
        view.Markers.add(location.space, `
          <div class="bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg font-semibold">
            ${result.exhibitor.name}
          </div>
        `);
      }
    } else if (result.type === 'amenity' && result.amenity) {
      // Handle amenity selection
      const amenity = result.amenity;

      view.Camera.focusOn({
        nodes: [amenity.space],
        minZoom: 22,
        animate: true
      });

      view.Markers.removeAll();
      view.Markers.add(amenity.space, `
        <div class="bg-teal-500 text-white px-3 py-2 rounded-lg shadow-lg font-semibold">
          ${amenity.name}
        </div>
      `);
    }
  }

  function clearSearch() {
    searchQuery = '';
    searchResults = [];
    showResults = false;
  }
</script>

<div class="absolute top-4 left-4 right-4 z-10 max-w-md mx-auto md:max-w-lg">
  <div class="relative">
    <!-- Search Icon -->
    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>

    <Input
      bind:value={searchQuery}
      oninput={handleSearch}
      onfocus={() => searchResults.length > 0 && (showResults = true)}
      onkeydown={handleKeyDown}
      placeholder="Search exhibitors, booths..."
      class="pl-10 pr-10 shadow-lg h-12 text-base"
    />

    <!-- Loading or Clear Button -->
    <div class="absolute right-3 top-1/2 -translate-y-1/2">
      {#if isSearching}
        <div class="animate-spin text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        </div>
      {:else if searchQuery}
        <button
          onclick={clearSearch}
          class="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m15 9-6 6"></path>
            <path d="m9 9 6 6"></path>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Search Results -->
    {#if showResults && searchResults.length > 0}
      <Card class="absolute top-full mt-2 w-full max-h-96 overflow-y-auto shadow-2xl border-2">
        <div class="text-xs font-medium text-muted-foreground px-4 py-2 bg-muted/50">
          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
        </div>
        {#each searchResults as result, index}
          <button
            onclick={() => selectResult(result)}
            class="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 {selectedIndex === index ? 'bg-accent' : ''}"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">{result.name}</div>
                <div class="text-sm text-muted-foreground mt-0.5">{result.subtitle}</div>
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
    {:else if showResults && searchQuery.length >= 2}
      <Card class="absolute top-full mt-2 w-full shadow-xl border-2 p-4 text-center text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mx-auto mb-2 opacity-50">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p class="text-sm">No exhibitors found</p>
      </Card>
    {/if}
  </div>
</div>
