<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
  import { goto } from '$app/navigation';
  import type { Json } from '@supabase/supabase-js';
  import { fetchChainInfo } from '$lib/services/chainService';

  // Types
  interface ArtToken {
    contract_address: string;
    chain_id: number;
    token_id: number;
    title: string;
    description: string;
    year: number;
    medium: string;
    dimensions: string | null;
    image_url: string | null;
    created_at: string | null;
    art_contracts: Array<{
      contract_address: string;
      identity_id: number;
      identities: {
        name: string | null;
        type: string | null;
        identity_image: string | null;
      };
    }>;
  }

  interface Pagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }

  // State
  let artTokens: ArtToken[] = [];
  let isLoading = true;
  let error: string | null = null;
  let searchQuery = '';
  let selectedChainId = '';
  
  // Pagination state
  let pagination: Pagination = {
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0
  };

  // Filters
  let chains: Array<{ chain_id: number; name: string }> = [];

  // Function to fetch ART tokens from the API
  async function fetchArtTokens() {
    isLoading = true;
    error = null;

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('pageSize', pagination.pageSize.toString());

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (selectedChainId) {
        params.append('chainId', selectedChainId);
      }

      // Fetch ART tokens
      const response = await fetch(`/api/registry/art?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch ART tokens');
      }

      if (result.artTokens && result.artTokens.length > 0) {
        console.log('ART tokens response sample:', JSON.stringify(result.artTokens[0], null, 2));
      } else {
        console.log('No ART tokens returned');
      }

      artTokens = result.artTokens;
      pagination = result.pagination;
    } catch (err) {
      console.error('Error fetching ART tokens:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  // Function to view ART token details
  function viewArtToken(token: ArtToken) {
    goto(`/registry/art/${token.chain_id}/${token.contract_address}/${token.token_id}`);
  }

  // Function to handle filter changes
  function applyFilters() {
    pagination.page = 1; // Reset to first page when filters change
    fetchArtTokens();
  }

  // Function to handle pagination
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.page = page;
    fetchArtTokens();
  }

  // Initialize
  onMount(async () => {
    // Fetch available chains for filtering
    try {
      const response = await fetch('/api/chains');
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch chains');
      }
      
      chains = result.chains || [];
    } catch (err) {
      console.error('Error fetching chains:', err);
    }
    
    // Fetch initial ART tokens
    await fetchArtTokens();
  });
</script>

<div class="space-y-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-4">Registry ART Tokens</h1>

    <div class="p-4 bg-muted/30 rounded-lg border border-border">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="w-full sm:w-1/2">
          <label for="search" class="block text-sm font-medium mb-1">Search</label>
          <Input
            id="search"
            type="text"
            placeholder="Search by title or description..."
            class="w-full"
            bind:value={searchQuery}
            on:keyup={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <Button on:click={applyFilters} class="px-6">Apply Filters</Button>

        {#if searchQuery || selectedChainId}
          <Button variant="outline" on:click={() => {
            searchQuery = '';
            selectedChainId = '';
            fetchArtTokens();
          }}>Clear</Button>
        {/if}
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="py-16 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p class="mt-4 text-muted-foreground">Loading ART tokens...</p>
    </div>
  {:else if error}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium text-red-700 dark:text-red-300">Error Loading ART Tokens</h3>
        <p class="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
      <Button variant="outline" on:click={fetchArtTokens}>Try Again</Button>
    </div>
  {:else if artTokens.length === 0}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center px-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium">No ART Tokens Found</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2">No ART tokens match your search criteria.</p>
      </div>
      <Button variant="outline" on:click={() => {
        searchQuery = '';
        selectedChainId = '';
        fetchArtTokens();
      }}>Clear Filters</Button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each artTokens as token}
        <div class="rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
          <!-- Card Header with Image -->
          <div class="aspect-square relative overflow-hidden bg-muted">
            {#if token.image_url}
              <img
                src={token.image_url}
                alt={token.title}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            {/if}

            <!-- Chain Badge -->
            <div class="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
              {#await fetchChainInfo(token.chain_id) then chainInfo}
                {#if chainInfo.icon_url}
                  <img
                    src={chainInfo.icon_url}
                    alt={chainInfo.name}
                    class="w-4 h-4"
                    on:error={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.onerror = null;
                      img.src = `https://placehold.co/16x16/svg?text=${token.chain_id}`;
                    }}
                  />
                {:else}
                  <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                    {token.chain_id}
                  </div>
                {/if}
                <span>{chainInfo.name}</span>
              {/await}
            </div>

            <!-- Year Badge -->
            <div class="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs">
              {token.year || 'N/A'}
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4">
            <div class="mb-2">
              <h3 class="font-medium text-lg truncate">{token.title || 'Untitled'}</h3>
              <p class="text-sm text-muted-foreground truncate">{token.art_contracts?.[0]?.identities?.name || 'Unknown Artist'}</p>
            </div>

            {#if token.description}
              <p class="text-sm text-muted-foreground line-clamp-2 mb-4">{token.description}</p>
            {:else}
              <p class="text-sm text-muted-foreground italic mb-4">No description available</p>
            {/if}

            <div class="flex justify-between items-center">
              <span class="text-xs text-muted-foreground">
                {token.medium || 'Mixed Media'}
              </span>
              <Button variant="outline" size="sm" class="text-xs touch-target" on:click={() => viewArtToken(token)}>View Details</Button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if pagination.totalPages > 1}
      <div class="mt-6 px-4 sm:px-6 py-4 border-t border-border flex justify-between items-center">
        <div class="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} ART tokens
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            on:click={() => goToPage(pagination.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.totalPages}
            on:click={() => goToPage(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>
