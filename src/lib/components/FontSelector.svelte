<script lang="ts">
  import { fontStore, type Font, fontNames } from '$lib/stores/font';
  import { cn } from '$lib/utils';

  export let className: string | undefined = undefined;

  let currentFont: Font;

  // Subscribe to the font store
  fontStore.subscribe(value => {
    currentFont = value;
  });

  // Set the font
  function handleFontChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    fontStore.set(select.value as Font);
  }
</script>

<div class={cn("flex items-center gap-2", className)}>
  <div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
    <span class="hidden sm:inline">Font:</span>
    <select
      class="bg-background border border-input rounded-md px-2 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-800 dark:bg-[#09090b]"
      value={currentFont}
      on:change={handleFontChange}
      aria-label="Select font"
    >
      {#each Object.entries(fontNames) as [value, name]}
        <option
          value={value}
          class={value !== 'system' ? `font-${value}` : ''}
        >
          {name}
        </option>
      {/each}
    </select>
  </div>
</div>
