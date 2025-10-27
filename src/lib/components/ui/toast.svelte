<script lang="ts">
  import { fly } from 'svelte/transition';
  import { toasts } from '$lib/stores/toast';
  import type { Toast } from '$lib/stores/toast';
  import { cn } from '$lib/utils/cn';

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-500 text-white'
  };

  const typeIcons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 16v-4"></path>
      <path d="M12 8h.01"></path>
    </svg>`
  };

  function handleDismiss(id: string) {
    toasts.dismiss(id);
  }
</script>

<!-- Toast Container -->
<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
  {#each $toasts as toast (toast.id)}
    <div
      class={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg pointer-events-auto",
        "transition-all duration-300 ease-in-out",
        typeStyles[toast.type]
      )}
      transition:fly={{ x: 300, duration: 300 }}
      role="alert"
    >
      <!-- Icon -->
      <div class="flex-shrink-0">
        {@html typeIcons[toast.type]}
      </div>

      <!-- Message -->
      <div class="flex-1 text-sm font-medium">
        {toast.message}
      </div>

      <!-- Close Button -->
      <button
        onclick={() => handleDismiss(toast.id)}
        class="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  {/each}
</div>
