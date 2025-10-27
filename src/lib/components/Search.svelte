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
      const location = locations.find(loc => loc.id === result.exhibitor!.externalId);

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

<div class="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 md:max-w-lg">
  <div class="relative">
    <!-- Search Icon -->
    <div class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </div>

    <Input
      bind:value={searchQuery}
      oninput={handleSearch}
      onfocus={() => searchResults.length > 0 && (showResults = true)}
      onkeydown={handleKeyDown}
      placeholder="Search exhibitors, amenities, booths..."
      class="pl-12 pr-12 shadow-xl border-2 h-14 text-base font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200"
    />

    <!-- Loading or Clear Button -->
    <div class="absolute right-4 top-1/2 -translate-y-1/2 z-10">
      {#if isSearching}
        <div class="animate-spin text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        </div>
      {:else if searchQuery}
        <button
          onclick={clearSearch}
          class="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95 p-1 rounded-md hover:bg-accent"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="m15 9-6 6"></path>
            <path d="m9 9 6 6"></path>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Search Results -->
    {#if showResults && searchResults.length > 0}
      <Card class="absolute top-full mt-3 w-full max-h-96 overflow-y-auto shadow-2xl border-2 backdrop-blur-sm bg-background/95">
        <div class="flex items-center justify-between px-4 py-3 bg-muted/50 border-b sticky top-0 z-10">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </span>
          <button
            onclick={() => showResults = false}
            class="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
        {#each searchResults as result, index}
          <button
            onclick={() => selectResult(result)}
            class="w-full text-left px-4 py-3.5 hover:bg-accent/80 transition-all duration-150 border-b last:border-b-0 {selectedIndex === index ? 'bg-accent' : ''} group"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-base truncate group-hover:text-primary transition-colors">{result.name}</div>
                <div class="text-sm text-muted-foreground mt-1">{result.subtitle}</div>
              </div>
              {#if result.badge}
                <Badge
                  variant={result.type === 'exhibitor'
                    ? (result.badge === 'Exhibitor' ? 'default' : 'secondary')
                    : 'outline'
                  }
                  class="text-xs shrink-0 font-medium"
                >
                  {result.badge}
                </Badge>
              {/if}
            </div>
          </button>
        {/each}
      </Card>
    {:else if showResults && searchQuery.length >= 2}
      <Card class="absolute top-full mt-3 w-full shadow-xl border-2 p-6 text-center text-muted-foreground backdrop-blur-sm bg-background/95">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-3 opacity-40">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p class="text-sm font-medium">No results found</p>
        <p class="text-xs text-muted-foreground/70 mt-1">Try searching for exhibitors or amenities</p>
      </Card>
    {/if}
  </div>
</div>
