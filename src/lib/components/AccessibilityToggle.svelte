<script lang="ts">
  import Button from '$lib/components/ui/button.svelte';
  import { accessibleMode } from '$lib/stores/map';

  function toggleAccessibility() {
    accessibleMode.update(v => !v);
  }
</script>

<div class="absolute top-20 right-4 z-10">
  <Button
    variant={$accessibleMode ? 'default' : 'outline'}
    size="sm"
    on:click={toggleAccessibility}
    class="shadow-lg gap-2"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="4" r="2"></circle>
      <path d="m16 8-4-4-4 4"></path>
      <path d="M16 8v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8"></path>
      <path d="M8 20h8"></path>
    </svg>
    {$accessibleMode ? 'Accessible' : 'Standard'}
  </Button>
</div>
