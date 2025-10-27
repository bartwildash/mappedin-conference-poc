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
  <div class="absolute top-4 right-4 z-20" style="padding-top: env(safe-area-inset-top); padding-right: env(safe-area-inset-right);">
    <!-- Mobile: Compact horizontal selector -->
    <div class="md:hidden">
      <Card class="backdrop-blur-sm bg-background/95 border-2 shadow-xl p-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-muted-foreground px-2">Floor:</span>
          <div class="flex gap-1">
            {#each floors as floor}
              <button
                onclick={() => changeFloor(floor.id)}
                class="px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 {
                  $currentFloor === floor.id
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }"
              >
                {floor.shortName || floor.name || 'F'}
              </button>
            {/each}
          </div>
        </div>
      </Card>
    </div>

    <!-- Desktop: Vertical stack with expand/collapse -->
    <div class="hidden md:block">
      <Card class="backdrop-blur-sm bg-background/95 border-2 shadow-xl">
        <div class="p-2">
          <!-- Header with current floor -->
          <button
            onclick={() => isExpanded = !isExpanded}
            class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-primary">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span class="text-sm font-semibold">{currentFloorName}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="text-muted-foreground transition-transform {isExpanded ? 'rotate-180' : ''}"
            >
              <path d="m18 15-6-6-6 6"></path>
            </svg>
          </button>

          <!-- Expanded floor list -->
          {#if isExpanded}
            <div class="mt-2 space-y-1" transition:slide={{ duration: 200 }}>
              {#each floors as floor}
                <button
                  onclick={() => {
                    changeFloor(floor.id);
                    isExpanded = false;
                  }}
                  class="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all duration-200 {
                    $currentFloor === floor.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }"
                >
                  {floor.name || floor.shortName || 'Floor'}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </Card>
    </div>
  </div>
{/if}
