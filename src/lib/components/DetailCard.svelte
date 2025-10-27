<script lang="ts">
  import Card from '$lib/components/ui/card.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import Separator from '$lib/components/ui/separator.svelte';
  import { selectedLocation, locationCardOpen, exhibitorCardOpen, directionsOpen } from '$lib/stores/ui';
  import { selectedExhibitor } from '$lib/stores/exhibitors';
  import { pathfindingTo } from '$lib/stores/map';
  import { slide } from 'svelte/transition';
  import { isReactNativeWebView, notifyExhibitorSelected } from '$lib/utils/webview-bridge';
  import { isInIframe, notifyExhibitorClicked } from '$lib/utils/iframe-bridge';

  let coExhibitorsExpanded = $state(false);

  // Determine if card should show (either exhibitor OR location)
  let isOpen = $derived($exhibitorCardOpen || $locationCardOpen);

  // Get the active item (prefer exhibitor, fallback to location)
  let activeItem = $derived($selectedExhibitor || $selectedLocation);

  // Determine if we're showing an exhibitor with full details
  let isExhibitor = $derived(!!$selectedExhibitor);

  const showOpenInAppButton = isReactNativeWebView() || isInIframe();

  function closeCard() {
    locationCardOpen.set(false);
    exhibitorCardOpen.set(false);
    selectedLocation.set(null);
    selectedExhibitor.set(null);
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
    // Get exhibitor data from either source
    const exhibitor = $selectedExhibitor || $selectedLocation?.exhibitors?.[0];
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

{#if isOpen && activeItem}
  <div class="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto md:left-auto md:right-4 md:max-w-lg" transition:slide={{ duration: 300, opacity: 0.95 }}>
    <Card class="shadow-2xl border-2 bg-background">
      <div class="p-4 md:p-6 space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            {#if isExhibitor}
              <!-- Exhibitor view -->
              <h2 class="text-xl md:text-2xl font-bold truncate">{$selectedExhibitor.name}</h2>
              <p class="text-sm md:text-base text-muted-foreground mt-1">
                Booth {$selectedExhibitor.boothNumber}
              </p>
              {#if $selectedExhibitor.category}
                <Badge variant="default" class="mt-2">{$selectedExhibitor.category}</Badge>
              {/if}
            {:else if $selectedLocation?.exhibitors && $selectedLocation.exhibitors.length > 0}
              <!-- Location with exhibitors view -->
              <h2 class="text-xl md:text-2xl font-bold">{$selectedLocation.type}</h2>
            {:else}
              <!-- Generic location view -->
              <h2 class="text-xl md:text-2xl font-bold truncate">{$selectedLocation.name}</h2>
              {#if $selectedLocation.type}
                <p class="text-sm text-muted-foreground mt-1">
                  {$selectedLocation.type}
                </p>
              {/if}
            {/if}
          </div>
          <button
            onclick={closeCard}
            class="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2 rounded-lg hover:bg-accent shrink-0"
            aria-label="Close detail card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Description -->
        {#if isExhibitor && $selectedExhibitor.description}
          <p class="text-sm text-foreground/80 line-clamp-3">
            {$selectedExhibitor.description}
          </p>
        {:else if $selectedLocation?.description}
          <p class="text-sm text-foreground/80">
            {$selectedLocation.description}
          </p>
        {/if}

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-2">
          <Button onclick={openDirections} class="flex-1 h-11">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            Get Directions
          </Button>

          {#if showOpenInAppButton && (isExhibitor || ($selectedLocation?.exhibitors && $selectedLocation.exhibitors.length > 0))}
            <Button onclick={handleOpenInApp} variant="outline" class="flex-1 h-11">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" x2="21" y1="14" y2="3"></line>
              </svg>
              Open in App
            </Button>
          {/if}
        </div>

        <!-- Exhibitor Details (from selectedExhibitor) -->
        {#if isExhibitor}
          {#if $selectedExhibitor.website}
            <Separator />
            <a
              href={$selectedExhibitor.website}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" x2="22" y1="12" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Visit Website
            </a>
          {/if}

          {#if $selectedExhibitor.contact}
            <Separator />
            <div class="space-y-2 text-sm">
              {#if $selectedExhibitor.contact.email}
                <a href="mailto:{$selectedExhibitor.contact.email}" class="flex items-center gap-2 text-primary hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                  </svg>
                  {$selectedExhibitor.contact.email}
                </a>
              {/if}
              {#if $selectedExhibitor.contact.phone}
                <a href="tel:{$selectedExhibitor.contact.phone}" class="flex items-center gap-2 text-primary hover:underline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  {$selectedExhibitor.contact.phone}
                </a>
              {/if}
            </div>
          {/if}
        {/if}

        <!-- Exhibitor List (from selectedLocation) -->
        {#if !isExhibitor && $selectedLocation?.exhibitors && $selectedLocation.exhibitors.length > 0}
          {@const mainExhibitors = $selectedLocation.exhibitors.filter(e => e.category === 'Exhibitor')}
          {@const coExhibitors = $selectedLocation.exhibitors.filter(e => e.category === 'Co-Exhibitor')}

          <div class="space-y-3 max-h-64 overflow-y-auto">
            <!-- Main Exhibitors -->
            {#each mainExhibitors as exhibitor}
              <div class="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 md:p-4">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="font-bold text-sm md:text-base flex-1">{exhibitor.name}</h3>
                  <Badge variant="default" class="shrink-0 text-xs">Main</Badge>
                </div>
                {#if exhibitor.description}
                  <p class="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                    {exhibitor.description}
                  </p>
                {/if}
                {#if exhibitor.website}
                  <a
                    href={exhibitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-xs md:text-sm font-medium text-primary hover:underline"
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
                  <span class="text-xs md:text-sm font-semibold text-muted-foreground">
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
                        <h3 class="font-semibold text-xs md:text-sm mb-1">{exhibitor.name}</h3>
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
        {:else if !isExhibitor}
          <!-- Categories for non-exhibitor locations -->
          {#if $selectedLocation?.categories && $selectedLocation.categories.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each $selectedLocation.categories as category}
                <Badge variant="secondary" class="text-xs">{category.name}</Badge>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </Card>
  </div>
{/if}
