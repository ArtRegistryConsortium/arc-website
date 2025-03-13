<script lang="ts">
  import '../../app.css';
  import Web3Provider from '$lib/components/Web3Provider.svelte';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/theme';
  
  let { children } = $props();
  
  // Initialize the theme
  onMount(() => {
    // Force a theme update on mount
    themeStore.update(theme => theme);
  });
</script>

<Web3Provider>
  <div class="min-h-screen">
    {@render children()}
  </div>
</Web3Provider> 