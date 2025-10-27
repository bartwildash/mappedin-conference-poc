<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let open = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;

  function handleClose() {
    open = false;
    onOpenChange?.(false);
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }
</script>

{#if open}
  <!-- Backdrop with fade animation -->
  <div
    class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    transition:fade={{ duration: 200 }}
  >
    <!-- Dialog content with scale animation -->
    <div
      class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-2xl rounded-lg"
      transition:scale={{ duration: 200, easing: cubicOut, start: 0.95 }}
    >
      <slot />
    </div>
  </div>
{/if}
