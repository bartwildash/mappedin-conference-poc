<script lang="ts">
  import Card from '$lib/components/ui/card.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import Badge from '$lib/components/ui/badge.svelte';
  import { selectedExhibitor } from '$lib/stores/exhibitors';
  import { exhibitorCardOpen, directionsOpen } from '$lib/stores/ui';
  import { pathfindingTo } from '$lib/stores/map';
  import { slide } from 'svelte/transition';

  function closeCard() {
    exhibitorCardOpen.set(false);
    selectedExhibitor.set(null);
  }

  function openDirections() {
    // Set this exhibitor's location as the destination
    if ($selectedExhibitor) {
      // We'll set the pathfindingTo in the parent when we find the location
      directionsOpen.set(true);
    }
  }
</script>

{#if $exhibitorCardOpen && $selectedExhibitor}
  <div class="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto md:left-auto md:right-4" transition:slide={{ duration: 300 }}>
    <Card class="shadow-2xl border-2">
      <div class="p-6 space-y-4">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h2 class="text-2xl font-bold">{$selectedExhibitor.name}</h2>
            <p class="text-sm text-muted-foreground mt-1">
              Booth {$selectedExhibitor.boothNumber}
            </p>
          </div>
          <button
            on:click={closeCard}
            class="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close exhibitor card"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Category Badge -->
        {#if $selectedExhibitor.category}
          <Badge variant="secondary">{$selectedExhibitor.category}</Badge>
        {/if}

        <!-- Description -->
        {#if $selectedExhibitor.description}
          <p class="text-sm text-foreground/80">
            {$selectedExhibitor.description}
          </p>
        {/if}

        <!-- Contact Info -->
        {#if $selectedExhibitor.contact}
          <div class="space-y-2 text-sm">
            {#if $selectedExhibitor.contact.email}
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <a href="mailto:{$selectedExhibitor.contact.email}" class="text-primary hover:underline">
                  {$selectedExhibitor.contact.email}
                </a>
              </div>
            {/if}
            {#if $selectedExhibitor.contact.phone}
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <a href="tel:{$selectedExhibitor.contact.phone}" class="text-primary hover:underline">
                  {$selectedExhibitor.contact.phone}
                </a>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Website -->
        {#if $selectedExhibitor.website}
          <Button
            variant="outline"
            class="w-full"
            on:click={() => window.open($selectedExhibitor?.website, '_blank')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            Visit Website
          </Button>
        {/if}

        <!-- Directions Button -->
        <Button class="w-full" on:click={openDirections}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
          Get Directions
        </Button>
      </div>
    </Card>
  </div>
{/if}
