<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  // Using API endpoint instead of client-side service
  import type { ArtToken } from '$lib/types/art';
  import type { Address } from 'viem';

  // State
  let isLoading = true;
  let errorMessage = '';
  let ownedTokens: ArtToken[] = [];
  let walletAddress: Address | null = null;

  // Format date
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  }

  // Load owned tokens
  async function loadOwnedTokens() {
    try {
      isLoading = true;
      errorMessage = '';

      // Get wallet address
      walletAddress = await getWalletAddress();

      if (!walletAddress) {
        errorMessage = 'Please connect your wallet to view your collection';
        isLoading = false;
        return;
      }

      // Get owned tokens from API
      const response = await fetch(`/api/collection/owned-tokens?walletAddress=${walletAddress}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch owned tokens');
      }

      ownedTokens = data.tokens;
      console.log('Owned tokens:', ownedTokens);
    } catch (error) {
      console.error('Error loading owned tokens:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while loading your collection';
    } finally {
      isLoading = false;
    }
  }

  // Handle view details button click
  function handleViewDetails(token: ArtToken) {
    goto(`/dashboard/catalogue/${token.chain_id}/${token.contract_address}/${token.token_id}`);
  }

  onMount(() => {
    loadOwnedTokens();
  });
</script>

<div class="space-y-6 sm:space-y-8 md:min-h-screen">
  <h1 class="text-xl sm:text-2xl font-bold">My Collection</h1>
  <p class="text-muted-foreground">Artworks you own across all contracts</p>

  <Separator />

  {#if errorMessage}
    <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
      <p class="text-red-800 dark:text-red-300">{errorMessage}</p>
    </div>
  {/if}

  {#if isLoading}
    <Card class="p-4 sm:p-8">
      <div class="py-12 flex flex-col items-center justify-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="text-muted-foreground">Loading your collection...</p>
      </div>
    </Card>
  {:else if ownedTokens.length === 0}
    <Card class="p-4 sm:p-8">
      <div class="flex flex-col items-center justify-center space-y-6 py-8 sm:py-12 px-2 sm:px-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="text-lg sm:text-xl font-medium text-center">No Artworks Found</h3>
        <p class="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base max-w-md">
          You don't own any ART tokens yet. Browse the catalogue to discover and collect artworks.
        </p>
      </div>
    </Card>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {#each ownedTokens as token (token.contract_address + '-' + token.chain_id + '-' + token.token_id)}
        <Card class="overflow-hidden h-full">
          <div class="aspect-square w-full bg-muted relative h-32 sm:h-40 md:h-48">
            {#if token.image_url}
              <img
                src={token.image_url}
                alt={token.title || 'Artwork'}
                class="w-full h-full object-contain"
                on:error={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null;
                  img.src = `https://placehold.co/600x600/svg?text=${(token.title || 'A').charAt(0).toUpperCase()}`;
                }}
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-4xl font-medium text-muted-foreground">
                {(token.title || 'A').charAt(0).toUpperCase()}
              </div>
            {/if}
            <div class="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
              #{token.token_id}
            </div>
          </div>

          <CardHeader class="p-2">
            <CardTitle class="text-sm">{token.title || 'Untitled'}</CardTitle>
            <CardDescription class="text-xs truncate">
              {token.medium || ''} {token.dimensions ? `• ${token.dimensions}` : ''}
            </CardDescription>
          </CardHeader>

          <CardFooter class="p-2 pt-0 flex justify-between items-center">
            <span class="text-xs text-muted-foreground">{formatDate(token.created_at)}</span>
            <div class="flex gap-1 items-center">
              <a href="/dashboard/catalogue/{token.chain_id}/{token.contract_address}/{token.token_id}" class="inline-flex">
                <Button variant="outline" size="sm" class="h-6 text-xs px-1.5 min-h-0">View</Button>
              </a>
            </div>
          </CardFooter>
        </Card>
      {/each}
    </div>
  {/if}

  <div class="mt-4">
    <Button variant="outline" on:click={() => loadOwnedTokens()}>Refresh Collection</Button>
  </div>
</div>
