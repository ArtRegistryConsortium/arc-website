<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Redirect to identities page by default
    goto('/registry/identities');
  });
</script>

<div class="flex flex-col items-center justify-center min-h-[50vh]">
  <h1 class="text-3xl font-bold mb-4">ARC Registry</h1>
  <p class="text-center max-w-lg mb-8">
    The Art Registry Consortium (ARC) Registry provides a comprehensive view of all registered identities and artwork tokens in the ecosystem.
  </p>
  <div class="flex gap-4">
    <a href="/registry/identities" class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      Browse Identities
    </a>
    <a href="/registry/art" class="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
      Browse ART Tokens
    </a>
  </div>
</div>
