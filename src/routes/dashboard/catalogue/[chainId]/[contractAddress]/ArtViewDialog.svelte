<script lang="ts">
  import { onMount } from 'svelte';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { config } from '$lib/web3/config';
  import type { Address } from 'viem';
  import type { ArtToken } from '$lib/types/art';
  import { fetchChainInfo } from '$lib/services/chainService';

  // Props
  export let open = false;
  export let token: ArtToken | null = null;
  export let contractAddress: string;
  export let chainId: number;
  export let artistName: string = '';

  // State
  let isLoading = false;
  let errorMessage = '';
  let explorerUrl = '';
  let openSeaUrl = '';

  // Format date
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  }

  // These functions have been removed as status field is no longer used

  // Format royalties
  function formatRoyalties(royalties: number | null) {
    if (royalties === null || royalties === undefined) return 'Not set';
    return `${royalties / 100}%`;
  }

  // Handle close
  function handleClose() {
    open = false;
  }

  // Get explorer URL for the current chain
  async function getExplorerUrl() {
    try {
      const chainInfo = await fetchChainInfo(chainId);
      if (chainInfo && chainInfo.explorer_url) {
        explorerUrl = chainInfo.explorer_url;

        // Determine OpenSea URL based on chain
        if (chainId === 1) {
          // Ethereum Mainnet
          openSeaUrl = `https://opensea.io/assets/ethereum/${contractAddress}/${token?.token_id}`;
        } else if (chainId === 10) {
          // Optimism
          openSeaUrl = `https://opensea.io/assets/optimism/${contractAddress}/${token?.token_id}`;
        } else if (chainId === 42161) {
          // Arbitrum
          openSeaUrl = `https://opensea.io/assets/arbitrum/${contractAddress}/${token?.token_id}`;
        } else if (chainId === 8453) {
          // Base
          openSeaUrl = `https://opensea.io/assets/base/${contractAddress}/${token?.token_id}`;
        } else if (chainId === 11155111) {
          // Sepolia
          openSeaUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${token?.token_id}`;
        } else if (chainId === 421614) {
          // Arbitrum Sepolia
          openSeaUrl = `https://testnets.opensea.io/assets/arbitrum-sepolia/${contractAddress}/${token?.token_id}`;
        } else {
          // Default to Ethereum
          openSeaUrl = `https://opensea.io/assets/ethereum/${contractAddress}/${token?.token_id}`;
        }
      }
    } catch (error) {
      console.error('Error fetching explorer URL:', error);
    }
  }

  // Reset state when dialog opens
  $: if (open) {
    isLoading = false;
    errorMessage = '';
    getExplorerUrl();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400/50 dark:scrollbar-thumb-neutral-900/90 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50 dark:hover:scrollbar-thumb-neutral-800/90">
    <Dialog.Header class="pb-4">
      <Dialog.Title>Artwork Details</Dialog.Title>
      <Dialog.Description>
        View details of this artwork in the catalogue raisonné.
      </Dialog.Description>
    </Dialog.Header>

    {#if errorMessage}
      <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
        <p class="text-red-800 dark:text-red-300">{errorMessage}</p>
      </div>
    {/if}

    {#if isLoading}
      <div class="py-12 flex flex-col items-center justify-center space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p class="text-muted-foreground">Loading artwork details...</p>
      </div>
    {:else if token}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Column: Image -->
        <div class="space-y-4">
          <div class="aspect-square w-full bg-muted rounded-md overflow-hidden relative">
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

          <div class="flex flex-wrap gap-2">
            {#if token.royalties !== null && token.royalties !== undefined}
              <Badge variant="outline">Royalties: {formatRoyalties(token.royalties)}</Badge>
            {/if}
            {#if token.created_at}
              <Badge variant="outline">Minted: {formatDate(token.created_at)}</Badge>
            {/if}
          </div>
        </div>

        <!-- Right Column: Details -->
        <div class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold">{token.title || 'Untitled'}</h2>
            <p class="text-muted-foreground">By {artistName || 'Unknown Artist'}</p>
          </div>

          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-muted-foreground">Description</h3>
              <p class="mt-1">{token.description || 'No description provided.'}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Year</h3>
                <p class="mt-1">{token.year || 'Unknown'}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Medium</h3>
                <p class="mt-1">{token.medium || 'Not specified'}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Dimensions</h3>
                <p class="mt-1">{token.dimensions || 'Not specified'}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Edition</h3>
                <p class="mt-1">{token.edition || 'Not specified'}</p>
              </div>
            </div>

            {#if token.series}
              <div>
                <h3 class="text-sm font-medium text-muted-foreground">Series</h3>
                <p class="mt-1">{token.series}</p>
              </div>
            {/if}


          </div>
        </div>
      </div>

      <Separator class="my-6" />

      <!-- Additional Information -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold">Additional Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">


          {#if token.exhibition_history}
            <div>
              <h4 class="text-sm font-medium text-muted-foreground">Exhibition History</h4>
              <p class="mt-1">
                {#if typeof token.exhibition_history === 'string'}
                  {token.exhibition_history}
                {:else if token.exhibition_history && typeof token.exhibition_history === 'object'}
                  {JSON.stringify(token.exhibition_history, null, 2)}
                {/if}
              </p>
            </div>
          {/if}

          {#if token.bibliography}
            <div>
              <h4 class="text-sm font-medium text-muted-foreground">Bibliography</h4>
              <p class="mt-1">
                {#if typeof token.bibliography === 'string'}
                  {token.bibliography}
                {:else if token.bibliography && typeof token.bibliography === 'object'}
                  {JSON.stringify(token.bibliography, null, 2)}
                {/if}
              </p>
            </div>
          {/if}

          {#if token.condition_reports}
            <div>
              <h4 class="text-sm font-medium text-muted-foreground">Condition Reports</h4>
              <p class="mt-1">
                {#if typeof token.condition_reports === 'string'}
                  {token.condition_reports}
                {:else if token.condition_reports && typeof token.condition_reports === 'object'}
                  {JSON.stringify(token.condition_reports, null, 2)}
                {/if}
              </p>
            </div>
          {/if}

          {#if token.location_collection}
            <div>
              <h4 class="text-sm font-medium text-muted-foreground">Location/Collection</h4>
              <p class="mt-1">
                {#if typeof token.location_collection === 'string'}
                  {token.location_collection}
                {:else if token.location_collection && typeof token.location_collection === 'object'}
                  {JSON.stringify(token.location_collection, null, 2)}
                {/if}
              </p>
            </div>
          {/if}



          {#if token.note}
            <div>
              <h4 class="text-sm font-medium text-muted-foreground">Notes</h4>
              <p class="mt-1">{token.note}</p>
            </div>
          {/if}
        </div>
      </div>

      <Separator class="my-6" />

      <!-- Blockchain Information -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Blockchain Information</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-muted-foreground">Contract Address</h4>
            <p class="mt-1 font-mono text-sm">
              {#if explorerUrl}
                <a href="{explorerUrl}/address/{contractAddress}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                  {contractAddress}
                </a>
              {:else}
                {contractAddress}
              {/if}
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-muted-foreground">Token ID</h4>
            <p class="mt-1 font-mono text-sm">{token.token_id}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-muted-foreground">Chain ID</h4>
            <p class="mt-1 font-mono text-sm">{chainId}</p>
          </div>
          {#if explorerUrl}
          <div>
            <h4 class="text-sm font-medium text-muted-foreground">View on Explorer</h4>
            <p class="mt-1">
              <a href="{explorerUrl}/nft/{contractAddress}/{token.token_id}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                View on Etherscan
              </a>
            </p>
          </div>
          {/if}
          {#if openSeaUrl}
          <div>
            <h4 class="text-sm font-medium text-muted-foreground">View on OpenSea</h4>
            <p class="mt-1">
              <a href="{openSeaUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                View on OpenSea
              </a>
            </p>
          </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="py-12 flex flex-col items-center justify-center space-y-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <p class="text-muted-foreground">No artwork data available.</p>
      </div>
    {/if}

    <div class="flex justify-end gap-3 pt-4 border-t">
      <Button variant="outline" on:click={handleClose}>Close</Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
