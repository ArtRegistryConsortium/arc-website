<script lang="ts">
  import { fontStore, type Font, fontNames } from '$lib/stores/font';
  import { cn } from '$lib/utils';
  import { onMount } from 'svelte';

  export let className: string | undefined = undefined;

  let currentFont: Font;
  let isDarkMode = false;

  onMount(() => {
    // Check initial dark mode
    isDarkMode = document.documentElement.classList.contains('dark');

    // Set up a mutation observer to detect theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          isDarkMode = document.documentElement.classList.contains('dark');
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => {
      observer.disconnect();
    };
  });

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
    <span class="hidden sm:inline mr-1">Font:</span>
    <select
      class="bg-background border border-input pl-3 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring dark:border-gray-800 dark:bg-[#09090b] appearance-none relative"
      value={currentFont}
      on:change={handleFontChange}
      aria-label="Select font"
      class:dark-caret={isDarkMode}
      style="background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 0.75em;"
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

<style>
  select {
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23888%22%20d%3D%22M10.3%203.3L6%207.6%201.7%203.3c-.4-.4-1-.4-1.4%200s-.4%201%200%201.4l5%205c.2.2.4.3.7.3s.5-.1.7-.3l5-5c.4-.4.4-1%200-1.4s-1-.4-1.4%200z%22%2F%3E%3C%2Fsvg%3E');
  }

  .dark-caret {
    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23ccc%22%20d%3D%22M10.3%203.3L6%207.6%201.7%203.3c-.4-.4-1-.4-1.4%200s-.4%201%200%201.4l5%205c.2.2.4.3.7.3s.5-.1.7-.3l5-5c.4-.4.4-1%200-1.4s-1-.4-1.4%200z%22%2F%3E%3C%2Fsvg%3E') !important;
  }
</style>
