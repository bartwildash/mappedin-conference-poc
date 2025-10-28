<script lang="ts">
  import { onMount } from 'svelte';
  import { mapView } from '$lib/stores/map';
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { BlueDot } from '@mappedin/blue-dot';

  let blueDot: BlueDot | null = $state(null);
  let isEnabled = $state(false);
  let isFollowing = $state(false);
  let hasError = $state(false);
  let currentPosition = $state<{ latitude: number; longitude: number; accuracy: number } | null>(null);

  // Initialize BlueDot when mapView is ready
  $effect(() => {
    if ($mapView && !blueDot) {
      const instance = new BlueDot($mapView);
      blueDot = instance;

      const positionHandler = (e: any) => {
        currentPosition = {
          latitude: e.coordinate?.latitude || 0,
          longitude: e.coordinate?.longitude || 0,
          accuracy: e.accuracy || 0
        };
        hasError = false;
      };

      const errorHandler = (e: any) => {
        console.error('BlueDot error:', e);
        hasError = true;
        isEnabled = false;
        isFollowing = false;
      };

      const statusHandler = (e: any) => {
        console.log('BlueDot status:', e.status);
      };

      // Listen to events
      instance.on('position-update', positionHandler);
      instance.on('error', errorHandler);
      instance.on('status-change', statusHandler);

      // Cleanup function to prevent memory leaks
      return () => {
        if (instance) {
          instance.off('position-update', positionHandler);
          instance.off('error', errorHandler);
          instance.off('status-change', statusHandler);

          // Disable and cleanup BlueDot
          try {
            if (isEnabled || isFollowing) {
              instance.unfollow();
              instance.disable();
            }
          } catch (e) {
            console.warn('BlueDot cleanup warning:', e);
          }
        }
        blueDot = null;
      };
    }
  });

  function toggleBlueDot() {
    if (!blueDot) return;

    if (!isEnabled) {
      // Enable blue dot with custom styling
      blueDot.enable({
        color: '#14b8a6', // Teal color matching app theme
        debug: false,
        accuracyRing: {
          color: '#14b8a6',
          opacity: 0.2,
        },
        heading: {
          color: '#14b8a6',
          opacity: 0.8,
        },
        inactiveColor: '#94a3b8',
        timeout: 30000,
      });
      isEnabled = true;
      hasError = false;
    } else if (!isFollowing) {
      // Enable follow mode
      blueDot.follow('position-only');
      isFollowing = true;
    } else {
      // Disable everything
      blueDot.unfollow();
      blueDot.disable();
      isEnabled = false;
      isFollowing = false;
      currentPosition = null;
    }
  }

  // Get status text for tooltip
  let statusText = $derived.by(() => {
    if (hasError) return 'Location Error';
    if (isFollowing) return 'Following Location';
    if (isEnabled) return 'Location Enabled';
    return 'Enable Location';
  });

  // Get icon based on state
  let buttonVariant = $derived.by(() => {
    if (hasError) return 'destructive';
    if (isFollowing) return 'default';
    if (isEnabled) return 'secondary';
    return 'outline';
  });
</script>

<!-- Floating button positioned bottom left (opposite side from floor selector) -->
<div
  class="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-5 md:left-5 lg:bottom-6 lg:left-6 z-20"
  style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); padding-left: max(0.75rem, env(safe-area-inset-left));"
>
  <div class="flex flex-col gap-2 items-start">
    <!-- Main blue dot button -->
    <Card class="backdrop-blur-md bg-background/98 border-2 shadow-2xl rounded-xl p-1 ring-1 ring-black/5">
      <Button
        variant={buttonVariant}
        size="icon"
        class="h-12 w-12 rounded-lg transition-all duration-300 active:scale-95 relative"
        onclick={toggleBlueDot}
        aria-label={statusText}
      >
        {#if hasError}
          <!-- Error icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        {:else if isFollowing}
          <!-- Following icon (crosshair + arrow) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="animate-pulse">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
          </svg>
        {:else if isEnabled}
          <!-- Enabled icon (location pin) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        {:else}
          <!-- Disabled icon (location pin outline) -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        {/if}
      </Button>
    </Card>

    <!-- Status indicator (optional, shown when active) -->
    {#if (isEnabled || isFollowing) && currentPosition && !hasError}
      <Card class="backdrop-blur-md bg-background/98 border-2 shadow-lg rounded-lg px-3 py-1.5 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span class="font-medium text-muted-foreground">
            {#if isFollowing}
              Following
            {:else}
              Active
            {/if}
            {#if currentPosition.accuracy < 50}
              <span class="text-green-600 ml-1">●</span>
            {:else if currentPosition.accuracy < 150}
              <span class="text-yellow-600 ml-1">●</span>
            {:else}
              <span class="text-red-600 ml-1">●</span>
            {/if}
          </span>
        </div>
      </Card>
    {/if}
  </div>
</div>
