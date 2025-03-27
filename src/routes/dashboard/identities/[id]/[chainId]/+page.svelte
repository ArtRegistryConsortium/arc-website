<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';

  // Get data from server-side load function
  export let data;

  // Extract identity and chain info from data
  const identity: UserIdentity = data.identity;
  const chainInfo = data.chainInfo;

  console.log('Page data loaded:', { identity, chainInfo });

  // Check if identity has any details to display
  function hasDetailsToDisplay(identity: UserIdentity): boolean {
    if (!identity) return false;
    
    // Check for Artist-specific fields
    if (identity.type === 'Artist' && (identity.dob || identity.dod || identity.location || identity.represented_by)) {
      return true;
    }
    
    // Check for Gallery/Institution-specific fields
    if ((identity.type === 'Gallery' || identity.type === 'Institution') && 
        (identity.location || 
         (Array.isArray(identity.addresses) && identity.addresses.length > 0) || 
         (Array.isArray(identity.represented_artists) && identity.represented_artists.length > 0))) {
      return true;
    }
    
    // Check for Collector/Other/Custodian-specific fields
    if ((identity.type === 'Collector' || identity.type === 'Other' || identity.type === 'Custodian') && 
        (identity.location || 
         (Array.isArray(identity.addresses) && identity.addresses.length > 0))) {
      return true;
    }
    
    // For any other type, just check for location or addresses
    return !!identity.location || (Array.isArray(identity.addresses) && identity.addresses.length > 0);
  }

  // Format date function
  function formatDate(timestamp: number | null): string {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  }
</script>

<div class="space-y-8 md:min-h-screen">
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => goto('/dashboard/identities')}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Identities
      </Button>
    </div>

    {#if identity}
      <Button variant="outline" size="sm" on:click={() => goto(`/dashboard/update-identity?id=${identity.id}&chainId=${identity.chain_id}`)}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit Identity
      </Button>
    {/if}
  </div>

  {#if identity}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Column - Image and Basic Info -->
      <div class="md:col-span-1 space-y-6">
        <div class="rounded-lg overflow-hidden border border-border bg-card">
          <div class="aspect-square w-full relative">
            {#if identity.identity_image}
              <img src={identity.identity_image} alt={identity.name} class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}

            <!-- Chain Badge -->
            <div class="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm flex items-center gap-2 shadow-sm border border-border">
              {#if chainInfo && chainInfo.icon_url}
                <img
                  src={chainInfo.icon_url}
                  alt={chainInfo.name || `Chain ${identity.chain_id}`}
                  class="w-5 h-5 rounded-full"
                  on:error={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://placehold.co/20x20/svg?text=${identity.chain_id}`;
                  }}
                />
              {:else}
                <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-medium">
                  {identity.chain_id}
                </div>
              {/if}
              <span class="font-medium">{chainInfo?.name || `Chain ${identity.chain_id}`}</span>
            </div>
          </div>

          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h1 class="text-2xl font-bold">{identity.name || 'Unnamed Identity'}</h1>
              <Badge variant="outline">{identity.type || 'Unknown Type'}</Badge>
            </div>

            {#if identity.description}
              <p class="text-muted-foreground mb-4">{identity.description}</p>
            {:else}
              <p class="text-muted-foreground italic mb-4">No description available</p>
            {/if}

            <div class="text-sm text-muted-foreground">
              Created: {identity.created_at ? new Date(identity.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <!-- Links Section -->
        {#if identity.links && identity.links.length > 0}
          <div class="rounded-lg border border-border p-4 bg-card">
            <h2 class="text-lg font-semibold mb-3">Links</h2>
            <ul class="space-y-2">
              {#each identity.links as link}
                <li>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-primary hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {link.name || link.url}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Tags Section -->
        {#if identity.tags && identity.tags.length > 0}
          <div class="rounded-lg border border-border p-4 bg-card">
            <h2 class="text-lg font-semibold mb-3">Tags</h2>
            <div class="flex flex-wrap gap-2">
              {#each identity.tags as tag}
                <Badge variant="secondary">{tag}</Badge>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right Column - Detailed Information -->
      <div class="md:col-span-2 space-y-6">
        <!-- Type-specific Information -->
        <div class="rounded-lg border border-border p-6 bg-card">
          <h2 class="text-xl font-semibold mb-4">Identity Details</h2>
          {#if !hasDetailsToDisplay(identity)}
            <p class="text-muted-foreground italic">No additional details available for this identity.</p>
          {:else if identity.type === 'Artist'}
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                  <p class="mt-1">{identity.dob ? formatDate(identity.dob) : 'Not specified'}</p>
                </div>

                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Date of Death</h3>
                  <p class="mt-1">{identity.dod ? formatDate(identity.dod) : 'Not specified'}</p>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                <p class="mt-1">{identity.location || 'Not specified'}</p>
              </div>

              {#if identity.represented_by}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Represented By</h3>
                  <p class="mt-1">{identity.represented_by}</p>
                </div>
              {/if}
            </div>
          {:else if identity.type === 'Gallery' || identity.type === 'Institution'}
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                <p class="mt-1">{identity.location || 'Not specified'}</p>
              </div>

              {#if identity.addresses && Array.isArray(identity.addresses) && identity.addresses.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Addresses</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.addresses as address}
                      <li class="p-2 bg-muted/50 rounded-md">{address}</li>
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if identity.represented_artists && Array.isArray(identity.represented_artists) && identity.represented_artists.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Represented Artists</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.represented_artists as artist}
                      <li class="p-2 bg-muted/50 rounded-md">{artist}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {:else if identity.type === 'Collector' || identity.type === 'Other' || identity.type === 'Custodian'}
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                <p class="mt-1">{identity.location || 'Not specified'}</p>
              </div>

              {#if identity.addresses && Array.isArray(identity.addresses) && identity.addresses.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Addresses</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.addresses as address}
                      <li class="p-2 bg-muted/50 rounded-md">{address}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {:else}
            <!-- Default display when type is not recognized or is missing -->
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Type</h3>
                <p class="mt-1">{identity.type || 'Not specified'}</p>
              </div>
              
              {#if identity.location}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                  <p class="mt-1">{identity.location}</p>
                </div>
              {/if}
              
              {#if identity.addresses && Array.isArray(identity.addresses) && identity.addresses.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Addresses</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.addresses as address}
                      <li class="p-2 bg-muted/50 rounded-md">{address}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Blockchain Information -->
        <div class="rounded-lg border border-border p-6 bg-card">
          <h2 class="text-xl font-semibold mb-4">Blockchain Information</h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-medium text-muted-foreground">Identity ID</h3>
              <p class="mt-1">{identity.id}</p>
            </div>

            <div>
              <h3 class="text-sm font-medium text-muted-foreground">Chain</h3>
              <div class="mt-1 flex items-center gap-2">
                {#if chainInfo && chainInfo.icon_url}
                  <img
                    src={chainInfo.icon_url}
                    alt={chainInfo.name || `Chain ${identity.chain_id}`}
                    class="w-4 h-4 rounded-full"
                    on:error={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.onerror = null;
                      img.src = `https://placehold.co/16x16/svg?text=${identity.chain_id}`;
                    }}
                  />
                {:else}
                  <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                    {identity.chain_id}
                  </div>
                {/if}
                <span>{chainInfo?.name || 'Unknown Chain'} (ID: {identity.chain_id})</span>
              </div>
            </div>

            <div class="sm:col-span-2">
              <h3 class="text-sm font-medium text-muted-foreground">Wallet Address</h3>
              <p class="mt-1 break-all text-xs">{identity.wallet_address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
