<script lang="ts">
  import { cn } from '$lib/utils/cn';

  let className: string | undefined = undefined;
  export { className as class };
</script>

<div
  class={cn(
    "shrink-0 bg-border h-[1px] w-full",
    className
  )}
  {...$$restProps}
/>
