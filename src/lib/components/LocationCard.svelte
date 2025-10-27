<script lang="ts">
  import Card from '$lib/components/ui/card.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Separator from '$lib/components/ui/separator.svelte';
  import { selectedLocation, locationCardOpen, directionsOpen } from '$lib/stores/ui';
  import { pathfindingTo } from '$lib/stores/map';
  import { slide } from 'svelte/transition';
  import { isReactNativeWebView, notifyExhibitorSelected } from '$lib/utils/webview-bridge';
  import { isInIframe, notifyExhibitorClicked } from '$lib/utils/iframe-bridge';

  let coExhibitorsExpanded = $state(false);

  const showOpenInAppButton = isReactNativeWebView() || isInIframe();

  function closeCard() {
    locationCardOpen.set(false);
    selectedLocation.set(null);
    coExhibitorsExpanded = false;
  }

  function openDirections() {
    // Set the selected location as the "To" destination
    if ($selectedLocation && $selectedLocation.mapObject) {
      pathfindingTo.set($selectedLocation.mapObject);
    }
    directionsOpen.set(true);
  }

  function toggleCoExhibitors() {
    coExhibitorsExpanded = !coExhibitorsExpanded;
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
</script>

{#if $locationCardOpen && $selectedLocation}
  <div class="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto md:left-auto md:right-4" transition:slide={{ duration: 300 }}>
    <Card class="shadow-2xl border-2">
      <div class="p-6 space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            {#if $selectedLocation.exhibitors && $selectedLocation.exhibitors.length > 0}
              <!-- Show booth number as main title for exhibitors -->
              <h2 class="text-2xl font-bold">{$selectedLocation.type}</h2>
            {:else}
              <h2 class="text-2xl font-bold">{$selectedLocation.name}</h2>
              {#if $selectedLocation.type}
                <p class="text-sm text-muted-foreground mt-1">
                  {$selectedLocation.type}
                </p>
              {/if}
            {/if}
          </div>
          <button
            onclick={closeCard}
            class="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close location card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

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

          <div class="space-y-3 max-h-72 overflow-y-auto">
            <!-- Main Exhibitors -->
            {#each mainExhibitors as exhibitor}
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
      </div>
    </Card>
  </div>
{/if}
