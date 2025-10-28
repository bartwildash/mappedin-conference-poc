<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import { mapView, mapData, currentFloor } from '$lib/stores/map';
  import { slide } from 'svelte/transition';

  let floors = $state<any[]>([]);
  let isExpanded = $state(false);

  $effect(() => {
    if ($mapData) {
      floors = $mapData.getByType('floor');
    }
  });

  function changeFloor(floorId: string) {
    if ($mapView) {
      const floor = floors.find(f => f.id === floorId);
      if (floor) {
        $mapView.setFloor(floor.id);
        currentFloor.set(floorId);
      }
    }
  }

  let currentFloorName = $derived(
    floors.find(f => f.id === $currentFloor)?.name ||
    floors.find(f => f.id === $currentFloor)?.shortName ||
    'Floor'
  );
</script>

{#if floors.length > 1}
  <!-- Inset top-right corner with responsive spacing -->
  <div
    class="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 lg:top-6 lg:right-6 z-20"
    style="padding-top: max(0.75rem, env(safe-area-inset-top)); padding-right: max(0.75rem, env(safe-area-inset-right));"
  >
    <!-- Mobile: Compact horizontal selector with inset shadow -->
    <div class="md:hidden">
      <Card class="backdrop-blur-md bg-background/98 border-2 shadow-2xl rounded-xl p-2 ring-1 ring-black/5">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-muted-foreground px-2 tracking-wide">LEVEL</span>
          <div class="flex gap-1.5">
            {#each floors as floor}
              <button
                onclick={() => changeFloor(floor.id)}
                class="px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 active:scale-95 {
                  $currentFloor === floor.id
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 ring-2 ring-primary/20'
                    : 'bg-muted/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:scale-102'
                }"
              >
                {floor.shortName || floor.name || 'F'}
              </button>
            {/each}
          </div>
        </div>
      </Card>
    </div>

    <!-- Desktop: Vertical stack with expand/collapse and elegant inset styling -->
    <div class="hidden md:block">
      <Card class="backdrop-blur-md bg-background/98 border-2 shadow-2xl rounded-xl ring-1 ring-black/5 overflow-hidden">
        <div class="p-2.5">
          <!-- Header with current floor and elegant styling -->
          <button
            onclick={() => isExpanded = !isExpanded}
            class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/80 transition-all duration-300 group"
          >
            <div class="flex items-center gap-2.5">
              <div class="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-primary">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <span class="text-sm font-bold tracking-wide">{currentFloorName}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              class="text-muted-foreground group-hover:text-foreground transition-all duration-300 {isExpanded ? 'rotate-180' : ''}"
            >
              <path d="m18 15-6-6-6 6"></path>
            </svg>
          </button>

          <!-- Expanded floor list with smooth animations -->
          {#if isExpanded}
            <div class="mt-2 space-y-1.5 max-h-80 overflow-y-auto overscroll-contain scroll-smooth" transition:slide={{ duration: 250, opacity: 0.95 }}>
              {#each floors as floor}
                <button
                  onclick={() => {
                    changeFloor(floor.id);
                    isExpanded = false;
                  }}
                  class="w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-all duration-300 active:scale-95 group/floor {
                    $currentFloor === floor.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-primary/20'
                      : 'hover:bg-accent hover:text-accent-foreground hover:shadow-md hover:pl-4'
                  }"
                >
                  <span class="block transition-transform duration-300 {$currentFloor === floor.id ? '' : 'group-hover/floor:translate-x-0.5'}">
                    {floor.name || floor.shortName || 'Floor'}
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </Card>
    </div>
  </div>
{/if}
