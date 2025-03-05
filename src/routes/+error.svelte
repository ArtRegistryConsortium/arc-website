<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Check if it's a 404 error
    if ($page.status === 404) {
      // Redirect to the work-in-progress page
      goto('/work-in-progress');
    }
  });
</script>

{#if $page.status === 404}
  <!-- This is just a fallback in case the redirect doesn't work immediately -->
  <div class="container mx-auto px-4 max-w-4xl md:pb-10 pt-12 md:pt-20">
    <p>Redirecting to Work in Progress page...</p>
  </div>
{:else}
  <!-- For other errors, show a generic error message -->
  <div class="container mx-auto px-4 max-w-4xl md:pb-10 pt-12 md:pt-20">
    <h1 class="text-3xl md:text-4xl font-extrabold mb-4 md:mb-6">Error {$page.status}</h1>
    <p class="mb-4 md:mb-6">Something went wrong. Please try again later.</p>
  </div>
{/if} 