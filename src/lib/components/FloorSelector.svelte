<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import { mapView, mapData, currentFloor } from '$lib/stores/map';

  let floors: any[] = [];

  $: if ($mapData) {
    floors = $mapData.getByType('floor');
  }

  function changeFloor(floorId: string) {
    if ($mapView) {
      const floor = floors.find(f => f.id === floorId);
      if (floor) {
        $mapView.setFloor(floor.id);
        currentFloor.set(floorId);
      }
    }
  }
</script>

{#if floors.length > 1}
  <div class="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
    {#each floors as floor}
      <Button
        variant={$currentFloor === floor.id ? 'default' : 'outline'}
        size="icon"
        on:click={() => changeFloor(floor.id)}
        class="w-12 h-12 shadow-lg"
      >
        <span class="font-bold">{floor.name || floor.shortName || 'F'}</span>
      </Button>
    {/each}
  </div>
{/if}
