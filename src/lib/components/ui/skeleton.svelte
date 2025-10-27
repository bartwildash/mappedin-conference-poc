<script lang="ts">
  import { cn } from '$lib/utils/cn';

  let className: string | undefined = undefined;
  export { className as class };
</script>

<div
  class={cn(
    "animate-pulse rounded-md bg-muted",
    className
  )}
  {...$$restProps}
/>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
