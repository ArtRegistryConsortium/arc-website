<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  onMount(() => {
    // Redirect to identities page by default
    goto('/dashboard/identities');
  });
</script>

<div class="flex items-center justify-center h-full">
  <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
</div>
