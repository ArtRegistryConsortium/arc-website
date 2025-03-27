<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Input } from '$lib/components/ui/input/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';

  // Types
  interface Identity {
    id: number;
    chain_id: number;
    name: string;
    description: string | null;
    identity_image: string | null;
    type: string;
    created_at: string | null;
    wallet_address: string;
    chains?: {
      name: string;
      icon_url: string | null;
    };
  }

  interface Pagination {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }

  // State
  let identities: Identity[] = [];
  let isLoading = true;
  let error: string | null = null;

  // Pagination
  let pagination: Pagination = {
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0
  };

  // Filters
  let searchQuery = '';
  let selectedType = '';
  let selectedChainId = '';

  // Function to fetch identities
  async function fetchIdentities() {
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

      if (selectedType) {
        params.append('type', selectedType);
      }

      if (selectedChainId) {
        params.append('chainId', selectedChainId);
      }

      // Fetch identities
      const response = await fetch(`/api/registry/identities?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch identities');
      }

      identities = result.identities;
      pagination = result.pagination;
    } catch (err) {
      console.error('Error fetching identities:', err);
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isLoading = false;
    }
  }

  // Function to handle view details click
  function handleViewDetails(identity: Identity) {
    goto(`/registry/identities/${identity.id}/${identity.chain_id}`);
  }

  // Function to handle filter changes
  function applyFilters() {
    pagination.page = 1; // Reset to first page when filters change
    fetchIdentities();
  }

  // Function to handle pagination
  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;
    pagination.page = page;
    fetchIdentities();
  }

  // Initialize
  onMount(() => {
    fetchIdentities();
  });
</script>

<div class="space-y-6">
  <div class="mb-6">
    <h1 class="text-2xl font-bold mb-4">Registry Identities</h1>

    <div class="p-4 bg-muted/30 rounded-lg border border-border">
      <div class="flex flex-col sm:flex-row gap-4 items-end">
        <div class="w-full sm:w-1/3">
          <label for="search" class="block text-sm font-medium mb-1">Search</label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name..."
            class="w-full"
            bind:value={searchQuery}
            on:keyup={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <div class="w-full sm:w-1/4">
          <label for="type" class="block text-sm font-medium mb-1">Identity Type</label>
          <Select bind:value={selectedType}>
            <SelectTrigger id="type" class="w-full">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="Artist">Artist</SelectItem>
              <SelectItem value="Gallery">Gallery</SelectItem>
              <SelectItem value="Institution">Institution</SelectItem>
              <SelectItem value="Collector">Collector</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
              <SelectItem value="Custodian">Custodian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button on:click={applyFilters} class="px-6">Apply Filters</Button>

        {#if searchQuery || selectedType || selectedChainId}
          <Button variant="outline" on:click={() => {
            searchQuery = '';
            selectedType = '';
            selectedChainId = '';
            fetchIdentities();
          }}>Clear</Button>
        {/if}
      </div>
    </div>
  </div>

  {#if isLoading}
    <div class="py-16 flex flex-col items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p class="mt-4 text-muted-foreground">Loading identities...</p>
    </div>
  {:else if error}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium text-red-700 dark:text-red-300">Error Loading Identities</h3>
        <p class="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
      <Button variant="outline" on:click={fetchIdentities}>Try Again</Button>
    </div>
  {:else if identities.length === 0}
    <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center px-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <div>
        <h3 class="text-lg font-medium">No Identities Found</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-2">No identities match your search criteria.</p>
      </div>
      <Button variant="outline" on:click={() => {
        searchQuery = '';
        selectedType = '';
        selectedChainId = '';
        fetchIdentities();
      }}>Clear Filters</Button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each identities as identity}
        <div class="rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow">
          <!-- Card Header with Image -->
          <div class="aspect-square relative overflow-hidden bg-muted">
            {#if identity.identity_image}
              <img
                src={identity.identity_image}
                alt={identity.name}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center bg-muted">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}

            <!-- Chain Badge -->
            <div class="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
              {#if identity.chains?.icon_url}
                <img
                  src={identity.chains.icon_url}
                  alt={identity.chains.name || `Chain ${identity.chain_id}`}
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
              <span>{identity.chains?.name || `Chain ${identity.chain_id}`}</span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-medium text-lg truncate">{identity.name}</h3>
              <span class="text-xs px-2 py-1 bg-muted rounded-full">{identity.type}</span>
            </div>

            {#if identity.description}
              <p class="text-sm text-muted-foreground line-clamp-2 mb-4">{identity.description}</p>
            {:else}
              <p class="text-sm text-muted-foreground italic mb-4">No description available</p>
            {/if}

            <div class="flex justify-between items-center">
              <span class="text-xs text-muted-foreground">
                {identity.created_at ? new Date(identity.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <Button variant="outline" size="sm" class="text-xs touch-target" on:click={() => handleViewDetails(identity)}>View Details</Button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Pagination -->
    {#if pagination.totalPages > 1}
      <div class="mt-6 px-4 sm:px-6 py-4 border-t border-border flex justify-between items-center">
        <div class="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} identities
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
