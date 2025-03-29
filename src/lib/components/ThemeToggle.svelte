<script lang="ts">
  import { themeStore, type Theme } from '$lib/stores/theme';
  import Sun from './icons/Sun.svelte';
  import Moon from './icons/Moon.svelte';
  import Computer from './icons/Computer.svelte';
  import { cn } from '$lib/utils';
  
  export let className: string | undefined = undefined;
  
  let currentTheme: Theme;
  
  // Subscribe to the theme store
  themeStore.subscribe(value => {
    currentTheme = value;
  });
  
  // Toggle between themes
  function toggleTheme() {
    if (currentTheme === 'light') {
      themeStore.set('dark');
    } else if (currentTheme === 'dark') {
      themeStore.set('system');
    } else {
      themeStore.set('light');
    }
  }
</script>

<div class={cn("flex items-center gap-2", className)}>
  <span class="text-xs text-gray-500 dark:text-gray-400">
    {#if currentTheme === 'light'}
      Light:
    {:else if currentTheme === 'dark'}
      Dark:
    {:else}
      System:
    {/if}
  </span>
  <button
    type="button"
    class="inline-flex h-9 w-9 items-center justify-center border border-input bg-background p-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-800 dark:bg-[#09090b]"
    on:click={toggleTheme}
    aria-label="Toggle theme"
  >
    {#if currentTheme === 'light'}
      <Sun className="h-4 w-4" />
      <span class="sr-only">Switch to dark theme</span>
    {:else if currentTheme === 'dark'}
      <Moon className="h-4 w-4 text-white" />
      <span class="sr-only">Switch to system theme</span>
    {:else}
      <Computer className="h-4 w-4" />
      <span class="sr-only">Switch to light theme</span>
    {/if}
  </button>
</div> 