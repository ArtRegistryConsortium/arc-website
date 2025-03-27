<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import type { UserIdentity } from '$lib/services/userIdentityService';

  // Get data from server-side load function
  export let data;

  // Extract identity and chain info from data
  const identity = data.identity as UserIdentity;
  const chainInfo = data.chainInfo;

  // Parse JSON fields if they're stored as strings
  if (identity) {
    // Parse links if it's a string
    if (typeof identity.links === 'string') {
      try {
        identity.links = JSON.parse(identity.links);
      } catch (e) {
        console.error('Error parsing links JSON:', e);
        identity.links = [];
      }
    }

    // Parse tags if it's a string
    if (typeof identity.tags === 'string') {
      try {
        identity.tags = JSON.parse(identity.tags);
      } catch (e) {
        console.error('Error parsing tags JSON:', e);
        identity.tags = [];
      }
    }

    // Parse addresses if it's a string
    if (typeof identity.addresses === 'string') {
      try {
        identity.addresses = JSON.parse(identity.addresses);
      } catch (e) {
        console.error('Error parsing addresses JSON:', e);
        identity.addresses = [];
      }
    }

    // Parse represented_artists if it's a string
    if (typeof identity.represented_artists === 'string') {
      try {
        identity.represented_artists = JSON.parse(identity.represented_artists);
      } catch (e) {
        console.error('Error parsing represented_artists JSON:', e);
        identity.represented_artists = [];
      }
    }
  }

  console.log('Registry identity page data loaded:', { identity, chainInfo });

  // Log specific fields for debugging
  if (identity?.type === 'Artist') {
    console.log('Artist-specific fields:', {
      dob: identity.dob,
      dod: identity.dod,
      location: identity.location,
      represented_by: identity.represented_by
    });
    console.log('Types:', {
      dob_type: typeof identity.dob,
      dod_type: typeof identity.dod
    });
  }

  // Format date function
  function formatDate(timestamp: number | string | null | undefined): string {
    if (timestamp === null || timestamp === undefined) return 'N/A';

    // If it's a string that looks like a date, parse it
    if (typeof timestamp === 'string' && timestamp.includes('-')) {
      return new Date(timestamp).toLocaleDateString();
    }

    // If it's a number, assume it's a Unix timestamp
    if (typeof timestamp === 'number') {
      return new Date(timestamp * 1000).toLocaleDateString();
    }

    // If we can't parse it, return as is
    return String(timestamp);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" on:click={() => goto('/registry/identities')}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Registry
      </Button>
    </div>
  </div>

  {#if identity}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Column - Image and Basic Info -->
      <div class="md:col-span-1 space-y-6">
        <div class="rounded-lg overflow-hidden border border-border bg-card">
          <div class="aspect-square w-full relative">
            {#if identity?.identity_image}
              <img src={identity.identity_image} alt={identity.name} class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}

            <!-- Chain Badge -->
            <div class="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
              {#if chainInfo?.icon_url}
                <img
                  src={chainInfo.icon_url}
                  alt={chainInfo.name}
                  class="w-4 h-4 rounded-full"
                  onerror={(e) => {
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
              <span>{chainInfo?.name || `Chain ${identity.chain_id}`}</span>
            </div>
          </div>

          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h1 class="text-2xl font-bold">{identity.name}</h1>
              <Badge variant="outline">{identity.type}</Badge>
            </div>

            {#if identity?.description}
              <p class="text-muted-foreground mb-4">{identity.description}</p>
            {:else}
              <p class="text-muted-foreground italic mb-4">No description available</p>
            {/if}

            <div class="text-sm text-muted-foreground">
              Created: {identity?.created_at ? new Date(identity.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        <!-- Links Section -->
        {#if identity?.links && Array.isArray(identity.links) && identity.links.length > 0}
          <div class="rounded-lg border border-border p-4 bg-card">
            <h2 class="text-lg font-semibold mb-3">Links</h2>
            <ul class="space-y-2">
              {#each identity.links as link}
                {#if link && link.url}
                  <li>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 text-primary hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {link.name || link.url}
                    </a>
                  </li>
                {/if}
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Tags Section -->
        {#if identity?.tags && Array.isArray(identity.tags) && identity.tags.length > 0}
          <div class="rounded-lg border border-border p-4 bg-card">
            <h2 class="text-lg font-semibold mb-3">Tags</h2>
            <div class="flex flex-wrap gap-2">
              {#each identity.tags as tag}
                {#if tag}
                  <Badge variant="secondary">{tag}</Badge>
                {/if}
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

          {#if identity?.type === 'Artist'}
            <div class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                  <p class="mt-1">{formatDate(identity.dob)}</p>
                </div>

                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Date of Death</h3>
                  <p class="mt-1">{formatDate(identity.dod)}</p>
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
          {:else if identity?.type === 'Gallery' || identity?.type === 'Institution'}
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                <p class="mt-1">{identity.location || 'Not specified'}</p>
              </div>

              {#if identity?.addresses && Array.isArray(identity.addresses) && identity.addresses.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Addresses</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.addresses as address}
                      {#if address}
                        <li class="p-2 bg-muted/50 rounded-md">{address}</li>
                      {/if}
                    {/each}
                  </ul>
                </div>
              {/if}

              {#if identity?.represented_artists && Array.isArray(identity.represented_artists) && identity.represented_artists.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Represented Artists</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.represented_artists as artist}
                      {#if artist}
                        <li class="p-2 bg-muted/50 rounded-md">{artist}</li>
                      {/if}
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {:else if identity?.type === 'Collector' || identity?.type === 'Other' || identity?.type === 'Custodian'}
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Location</h3>
                <p class="mt-1">{identity.location || 'Not specified'}</p>
              </div>

              {#if identity?.addresses && Array.isArray(identity.addresses) && identity.addresses.length > 0}
                <div>
                  <h3 class="text-sm font-medium text-muted-foreground">Addresses</h3>
                  <ul class="mt-1 space-y-2">
                    {#each identity.addresses as address}
                      {#if address}
                        <li class="p-2 bg-muted/50 rounded-md">{address}</li>
                      {/if}
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
              <p class="mt-1">{chainInfo?.name || `Chain ${identity.chain_id}`} (ID: {identity.chain_id})</p>
            </div>

            <div class="sm:col-span-2">
              <h3 class="text-sm font-medium text-muted-foreground">Wallet Address</h3>
              <p class="mt-1 break-all text-xs">{identity.wallet_address}</p>
            </div>
          </div>
        </div>

        <!-- ART Tokens Section (if applicable) -->
        {#if identity?.type === 'Artist'}
          <div class="rounded-lg border border-border p-6 bg-card">
            <h2 class="text-xl font-semibold mb-4">ART Tokens</h2>
            <p class="text-muted-foreground">
              View this artist's ART tokens in the <a href="/registry/art" class="text-primary hover:underline">Registry ART section</a>.
            </p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>
