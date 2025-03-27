<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { goto } from '$app/navigation';
  import type { ArtToken } from '$lib/types/art';

  // Get parameters from URL
  const chainId = parseInt($page.params.chainId);
  const contractAddress = $page.params.contractAddress;
  const tokenId = parseInt($page.params.tokenId);

  // State
  let token: ArtToken | null = null;
  let isLoading = true;
  let error: string | null = null;
  let artistName = '';

  // Function to fetch token details
  async function fetchTokenDetails() {
    isLoading = true;
    error = null;

    try {
      // Fetch token details
      const response = await fetch(`/api/art/token?contractAddress=${contractAddress}&chainId=${chainId}&tokenId=${tokenId}`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch token details');
      }

      token = result.token;

      // Fetch artist name
      if (token) {
        const artContractResponse = await fetch(`/api/art/contract?contractAddress=${contractAddress}&chainId=${chainId}`);
        if (artContractResponse.ok) {
          const artContractResult = await artContractResponse.json();
          if (artContractResult.success && artContractResult.contract?.identities?.name) {
            artistName = artContractResult.contract.identities.name;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching token details:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  // Initialize
  onMount(() => {
    fetchTokenDetails();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" on:click={() => goto('/registry/art')}>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to ART Tokens
    </Button>
  </div>

  {#if isLoading}
    <div class="py-16 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p class="mt-4 text-muted-foreground">Loading ART token details...</p>
    </div>
  {:else if error}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium text-red-700 dark:text-red-300">Error Loading ART Token</h3>
        <p class="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
      <Button variant="outline" on:click={fetchTokenDetails}>Try Again</Button>
    </div>
  {:else if token}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Image -->
      <div class="flex flex-col">
        <div class="aspect-square w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
          {#if token.image_url}
            <img src={token.image_url} alt={token.title} class="w-full h-full object-contain" />
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          {/if}
        </div>
      </div>

      <!-- Details -->
      <div class="space-y-6">
        <div>
          <h1 class="text-3xl font-bold">{token.title}</h1>
          <p class="text-lg text-muted-foreground mt-1">{artistName || 'Unknown Artist'}, {token.year}</p>
        </div>

        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-medium text-muted-foreground">Description</h3>
            <p class="mt-1">{token.description}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
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

            <div>
              <h3 class="text-sm font-medium text-muted-foreground">Series</h3>
              <p class="mt-1">{token.series || 'Not specified'}</p>
            </div>
          </div>

          {#if token.bibliography || token.condition_reports || token.exhibition_history || token.keywords || token.location_collection || token.note}
            <div class="pt-4 border-t border-border">
              <h3 class="text-lg font-medium mb-4">Additional Information</h3>

              {#if token.bibliography}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Bibliography</h4>
                  <p class="mt-1 whitespace-pre-line">{JSON.stringify(token.bibliography, null, 2)}</p>
                </div>
              {/if}

              {#if token.exhibition_history}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Exhibition History</h4>
                  <p class="mt-1 whitespace-pre-line">{JSON.stringify(token.exhibition_history, null, 2)}</p>
                </div>
              {/if}

              {#if token.condition_reports}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Condition Reports</h4>
                  <p class="mt-1 whitespace-pre-line">{JSON.stringify(token.condition_reports, null, 2)}</p>
                </div>
              {/if}

              {#if token.keywords}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Keywords</h4>
                  <div class="flex flex-wrap gap-2 mt-1">
                    {#if Array.isArray(token.keywords)}
                      {#each token.keywords as keyword}
                        <span class="px-2 py-1 bg-muted rounded-md text-xs">{keyword}</span>
                      {/each}
                    {:else}
                      <p class="mt-1">{token.keywords}</p>
                    {/if}
                  </div>
                </div>
              {/if}

              {#if token.location_collection}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Location/Collection</h4>
                  <p class="mt-1 whitespace-pre-line">{JSON.stringify(token.location_collection, null, 2)}</p>
                </div>
              {/if}

              {#if token.note}
                <div class="mb-4">
                  <h4 class="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p class="mt-1 whitespace-pre-line">{token.note}</p>
                </div>
              {/if}
            </div>
          {/if}

          <div class="pt-4 border-t border-border">
            <h3 class="text-lg font-medium mb-4">Blockchain Information</h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-muted-foreground">Chain</h4>
                <p class="mt-1">ID: {token.chain_id}</p>
              </div>

              <div>
                <h4 class="text-sm font-medium text-muted-foreground">Token ID</h4>
                <p class="mt-1">{token.token_id}</p>
              </div>

              <div class="col-span-2">
                <h4 class="text-sm font-medium text-muted-foreground">Contract Address</h4>
                <p class="mt-1 break-all text-xs">{token.contract_address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium">ART Token Not Found</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2">The requested ART token could not be found.</p>
      </div>
      <Button variant="outline" on:click={() => goto('/registry/art')}>Back to ART Tokens</Button>
    </div>
  {/if}
</div>
