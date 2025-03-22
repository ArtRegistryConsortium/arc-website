<script lang="ts">
  import { userIdentityStore } from '$lib/stores/userIdentityStore';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { goto } from '$app/navigation';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  
  let identities: UserIdentity[] = [];
  
  // Subscribe to the user identity store
  userIdentityStore.subscribe(state => {
    identities = state.identities;
  });
  
  function getIdentityTypeIcon(type: string) {
    switch (type) {
      case 'artist':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>`;
      case 'gallery':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>`;
      case 'institution':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>`;
      case 'collector':
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>`;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold">My Identities</h1>
    <Button on:click={() => goto('/activate')}>Create New Identity</Button>
  </div>
  
  {#if identities.length === 0}
    <Card class="p-6 text-center">
      <div class="flex flex-col items-center justify-center space-y-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 class="text-lg font-medium">No Identities Found</h3>
        <p class="text-gray-500 dark:text-gray-400">You haven't created any identities yet.</p>
        <Button on:click={() => goto('/activate')}>Create Your First Identity</Button>
      </div>
    </Card>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each identities as identity}
        <Card class="overflow-hidden">
          <div class="relative h-40 bg-gray-200 dark:bg-gray-700">
            {#if identity.identity_image}
              <img src={identity.identity_image} alt={identity.name} class="w-full h-full object-cover" />
            {:else}
              <div class="flex items-center justify-center h-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            {/if}
            <div class="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
              {@html getIdentityTypeIcon(identity.type)}
            </div>
          </div>
          <div class="p-4">
            <h3 class="text-lg font-semibold">{identity.name}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">{identity.type}</p>
            {#if identity.description}
              <p class="mt-2 text-sm line-clamp-2">{identity.description}</p>
            {/if}
            <div class="mt-4 flex flex-wrap gap-2">
              {#if identity.tags && identity.tags.length > 0}
                {#each identity.tags.slice(0, 3) as tag}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {tag}
                  </span>
                {/each}
                {#if identity.tags.length > 3}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    +{identity.tags.length - 3} more
                  </span>
                {/if}
              {/if}
            </div>
            <div class="mt-4 flex justify-end">
              <Button variant="outline" size="sm">View Details</Button>
            </div>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>
