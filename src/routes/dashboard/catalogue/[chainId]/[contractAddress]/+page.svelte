<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ArtMintDialog from './ArtMintDialog.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  // State
  let isLoading = true;
  let mintDialogOpen = false;
  let errorMessage = '';
  let walletAddress: string | null = null;

  onMount(async () => {
    try {
      walletAddress = getWalletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Additional initialization if needed

    } catch (error) {
      console.error('Error initializing page:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while loading data';
    } finally {
      isLoading = false;
    }
  });

  // Format date
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  }

  // Handle mint button click
  function handleOpenMintDialog() {
    mintDialogOpen = true;
  }

  // Handle mint success
  async function handleMintSuccess() {
    // Reload the page to show the new token
    window.location.reload();
  }

  // Truncate address for display
  function truncateAddress(address: string) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
</script>

<div class="space-y-8">
  <!-- Header with back button and title -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        class="h-8 w-8 sm:h-9 sm:w-9"
        on:click={() => goto('/dashboard/catalogue')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span class="sr-only">Back</span>
      </Button>
      <h1 class="text-xl sm:text-2xl font-bold">Catalogue Raisonné</h1>
    </div>
    <Button on:click={handleOpenMintDialog} class="w-full sm:w-auto touch-target">Mint New ART</Button>
  </div>

  {#if isLoading}
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="flex flex-col items-center justify-center py-8 sm:py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p class="mt-4 text-sm">Loading contract details...</p>
        </div>
      </div>
    </div>
  {:else if errorMessage}
    <div class="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden bg-red-50 dark:bg-red-900/20">
      <div class="bg-red-100/50 dark:bg-red-900/30 px-6 py-4 border-b border-red-200 dark:border-red-800">
        <div class="flex flex-col items-center justify-center py-8 sm:py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 sm:h-16 sm:w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="text-lg sm:text-xl font-medium text-center mt-4">Error Loading Data</h3>
          <p class="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base max-w-md mt-2">
            {errorMessage}
          </p>
          <Button class="mt-4" on:click={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    </div>
  {:else}
    <!-- Contract Details Card -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-primary/20">
            {#if data.contract.identities?.identity_image}
              <img
                src={data.contract.identities.identity_image}
                alt={data.contract.identities.name || 'Artist'}
                class="w-full h-full object-cover"
                on:error={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.onerror = null;
                  img.src = `https://placehold.co/40x40/svg?text=${(data.contract.identities?.name || 'A').charAt(0).toUpperCase()}`;
                }}
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                {(data.contract.identities?.name || 'A').charAt(0).toUpperCase()}
              </div>
            {/if}
          </div>
          <div>
            <CardTitle>ARC / {data.contract.identities?.name || 'Unknown Artist'}</CardTitle>
            <CardDescription>
              <div class="flex items-center gap-2 mt-1">
                <span>Contract: {truncateAddress(data.contract.contract_address)}</span>
                <span>•</span>
                <div class="flex items-center gap-1.5">
                  {#if data.chain?.icon_url}
                    <img
                      src={data.chain.icon_url}
                      alt={data.chain.name}
                      class="w-4 h-4"
                      on:error={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.onerror = null;
                        img.src = `https://placehold.co/16x16/svg?text=${data.contract.chain_id}`;
                      }}
                    />
                  {:else}
                    <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                      {data.contract.chain_id}
                    </div>
                  {/if}
                  <span>{data.chain?.name || `Chain ${data.contract.chain_id}`}</span>
                </div>
                <span>•</span>
                <span>Deployed: {formatDate(data.contract.created_at)}</span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Artworks Section -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold">Artworks</h2>
          {#if data.artTokens && data.artTokens.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each data.artTokens as token}
                <Card class="overflow-hidden">
                  <div class="aspect-square w-full bg-muted relative">
                    {#if token.image_url}
                      <img
                        src={token.image_url}
                        alt={token.title || 'Artwork'}
                        class="w-full h-full object-cover"
                        on:error={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.onerror = null;
                          img.src = `https://placehold.co/400x400/svg?text=${(token.title || 'A').charAt(0).toUpperCase()}`;
                        }}
                      />
                    {:else}
                      <div class="w-full h-full flex items-center justify-center text-2xl font-medium text-muted-foreground">
                        {(token.title || 'A').charAt(0).toUpperCase()}
                      </div>
                    {/if}
                    <div class="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                      #{token.token_id}
                    </div>
                  </div>
                  <CardHeader class="p-3">
                    <CardTitle class="text-base">{token.title || 'Untitled'}</CardTitle>
                    <CardDescription class="line-clamp-2 text-xs">
                      {token.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter class="p-3 pt-0 flex justify-between">
                    <span class="text-xs text-muted-foreground">{formatDate(token.created_at)}</span>
                    <Button variant="outline" size="sm" class="h-8 text-xs">View Details</Button>
                  </CardFooter>
                </Card>
              {/each}
            </div>
          {:else}
            <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center px-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <h3 class="text-lg sm:text-xl font-medium">No Artworks Found</h3>
                <p class="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base max-w-md mt-2">
                  This catalogue raisonné doesn't have any artworks yet. Click the "Mint New ART" button to add your first artwork.
                </p>
              </div>
            </div>
          {/if}
        </div>

        <Separator class="my-6" />

        <!-- Contract Details Section -->
        <div class="space-y-6">
          <h2 class="text-lg font-semibold">Contract Details</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground">Contract Address</h3>
              <p class="text-sm font-mono bg-muted p-2 rounded break-all">{data.contract.contract_address}</p>
            </div>
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground">Chain</h3>
              <div class="flex items-center gap-2">
                {#if data.chain?.icon_url}
                  <img
                    src={data.chain.icon_url}
                    alt={data.chain.name}
                    class="w-5 h-5"
                  />
                {/if}
                <p class="text-sm">{data.chain?.name || `Chain ${data.contract.chain_id}`} (ID: {data.contract.chain_id})</p>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground">Symbol</h3>
              <p class="text-sm">{data.contract.symbol || 'Unknown'}</p>
            </div>
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground">Artist Identity ID</h3>
              <p class="text-sm">{data.contract.identity_id}</p>
            </div>
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground">Deployment Date</h3>
              <p class="text-sm">{formatDate(data.contract.created_at)}</p>
            </div>
          </div>

          <Separator />

          <div class="space-y-2">
            <h3 class="text-sm font-medium text-muted-foreground">Artist Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">Name</p>
                <p class="text-sm">{data.contract.identities?.name || 'Unknown'}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground">Type</p>
                <p class="text-sm">{data.contract.identities?.type === 'artist' ? 'Artist' : data.contract.identities?.type || 'Unknown'}</p>
              </div>
              <div class="space-y-1 md:col-span-2">
                <p class="text-xs text-muted-foreground">Description</p>
                <p class="text-sm">{data.contract.identities?.description || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<!-- ART Mint Dialog -->
<ArtMintDialog
  bind:open={mintDialogOpen}
  contractAddress={data.contract?.contract_address || ''}
  chainId={Number(data.contract?.chain_id || 0)}
  artistIdentityId={Number(data.contract?.identity_id || 0)}
  onSuccess={handleMintSuccess}
/>
