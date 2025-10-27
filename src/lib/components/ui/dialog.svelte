<script lang="ts">
  import { cn } from '$lib/utils/cn';

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
  <div
    class="fixed inset-0 z-50 bg-black/80"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg rounded-lg">
      <slot />
    </div>
  </div>
{/if}
