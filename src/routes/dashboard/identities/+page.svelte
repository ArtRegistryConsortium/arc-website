<script lang="ts">
  import { userIdentityStore } from '$lib/stores/userIdentityStore';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { goto } from '$app/navigation';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  import { onMount } from 'svelte';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  let identities: UserIdentity[] = [];
  let isLoading = true;
  let error: string | null = null;
  let chainIcons: Record<number, { icon_url: string, name: string }> = {};
  let showTooltip = false;
  let tooltipPosition = { x: 0, y: 0 };
  let tooltipButton: HTMLDivElement;

  // Subscribe to the user identity store
  userIdentityStore.subscribe(state => {
    identities = state.identities;
    isLoading = state.isLoading;
    error = state.error;
  });

  // Function to fetch chain information
  async function fetchChainInfo(chainId: number) {
    if (chainIcons[chainId]) return chainIcons[chainId];

    try {
      const response = await fetch(`/api/chains/info?chainId=${chainId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.chain) {
          chainIcons[chainId] = {
            icon_url: data.chain.icon_url || '',
            name: data.chain.name || `Chain ${chainId}`
          };
          return chainIcons[chainId];
        }
      }
      return { icon_url: '', name: `Chain ${chainId}` };
    } catch (error) {
      console.error('Error fetching chain info:', error);
      return { icon_url: '', name: `Chain ${chainId}` };
    }
  }

  // Function to handle view details click
  function handleViewDetails(identity: UserIdentity) {
    console.log('Viewing identity details:', identity);
    const url = `/dashboard/identities/${identity.id}/${identity.chain_id}`;
    console.log('Navigating to:', url);
    goto(url);
  }

  function handleMouseEnter(event: MouseEvent) {
    const button = event.currentTarget as HTMLDivElement;
    const rect = button.getBoundingClientRect();
    tooltipPosition = {
      x: rect.left + (rect.width / 2),
      y: rect.bottom + 8
    };
    showTooltip = true;
  }

  function handleMouseLeave() {
    showTooltip = false;
  }

  // Ensure identities are loaded when the component mounts
  onMount(async () => {
    const walletAddress = getWalletAddress();
    if (walletAddress) {
      // Force reload identities
      await userIdentityStore.loadIdentities(walletAddress);

      // Fetch chain info for all identities
      const uniqueChainIds = [...new Set(identities.map(identity => identity.chain_id))];
      for (const chainId of uniqueChainIds) {
        await fetchChainInfo(chainId);
      }
    }
  });
</script>

<div class="space-y-8 md:min-h-screen">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
    <div class="flex items-center gap-2">
      <h1 class="text-xl sm:text-2xl font-bold">My Identities</h1>
      <div class="relative inline-block">
        <div
          bind:this={tooltipButton}
          class="cursor-help w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-medium text-muted-foreground transition-colors"
          on:mouseenter={handleMouseEnter}
          on:mouseleave={handleMouseLeave}
        >
          ?
        </div>
        {#if showTooltip}
          <div
            class="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-4 max-w-[calc(100vw-32px)] sm:max-w-sm"
            style="left: {tooltipPosition.x}px; top: {tooltipPosition.y}px; transform: translateX(-50%);"
          >
            <div class="space-y-2">
              <p>An Identity in the ARC system is a blockchain-verified profile that represents a participant in the ARC ecosystem. Each identity has a unique ID and is associated with a wallet address, ensuring proper authentication and authorization throughout the system.</p>
              <p>ARC supports four types of identities:</p>
              <ul class="list-disc pl-4 space-y-1">
                <li><strong>Artist:</strong> Creators who deploy their own ART Contracts and mint ARTs</li>
                <li><strong>Gallery:</strong> Entities that represent artists and facilitate art sales</li>
                <li><strong>Institution:</strong> Museums, foundations, and other organizations that exhibit or preserve art</li>
                <li><strong>Collector:</strong> Individuals or entities who own artworks and their corresponding ARTs</li>
              </ul>
            </div>
            <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-background"></div>
          </div>
        {/if}
      </div>
    </div>
    <Button on:click={() => goto('/dashboard/create-identity')} class="w-full sm:w-auto touch-target">Create New Identity</Button>
  </div>

  {#if isLoading}
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="grid grid-cols-12 gap-2 sm:gap-4 font-medium text-sm text-muted-foreground">
          <div class="col-span-6 sm:col-span-4">Name</div>
          <div class="col-span-3 hidden sm:block">Type</div>
          <div class="col-span-2 hidden sm:block">Chain</div>
          <div class="col-span-3 sm:col-span-1">Created</div>
          <div class="col-span-3 sm:col-span-2 text-right">Actions</div>
        </div>
      </div>

      <div class="py-16 flex flex-col justify-center items-center space-y-6 text-center">
        <!-- SVG spinner (same as in activate page) -->
        <svg class="animate-spin h-16 w-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>

        <div>
          <!-- Loading message -->
          <p class="text-lg font-medium text-primary/80">Loading identities...</p>
          <p class="text-sm text-muted-foreground mt-2">This may take a moment</p>
        </div>
      </div>
    </div>
  {:else if error}
    <div class="rounded-lg border border-red-200 dark:border-red-800 overflow-hidden bg-red-50 dark:bg-red-900/20">
      <div class="bg-red-100/50 dark:bg-red-900/30 px-6 py-4 border-b border-red-200 dark:border-red-800">
        <div class="grid grid-cols-12 gap-4 font-medium text-sm text-red-700 dark:text-red-300">
          <div class="col-span-12">Error Loading Identities</div>
        </div>
      </div>

      <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="text-lg font-medium text-red-700 dark:text-red-300">Error Loading Identities</h3>
          <p class="text-red-600 dark:text-red-400 mt-2">{error}</p>
        </div>
        <Button variant="outline" on:click={() => {
          const walletAddress = getWalletAddress();
          if (walletAddress) userIdentityStore.loadIdentities(walletAddress);
        }}>Try Again</Button>
      </div>
    </div>
  {:else if identities.length === 0}
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="grid grid-cols-12 gap-2 sm:gap-4 font-medium text-sm text-muted-foreground">
          <div class="col-span-6 sm:col-span-4">Name</div>
          <div class="col-span-3 hidden sm:block">Type</div>
          <div class="col-span-2 hidden sm:block">Chain</div>
          <div class="col-span-3 sm:col-span-1">Created</div>
          <div class="col-span-3 sm:col-span-2 text-right">Actions</div>
        </div>
      </div>

      <div class="py-16 flex flex-col items-center justify-center space-y-6 text-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <div>
          <h3 class="text-lg font-medium">No Identities Found</h3>
          <p class="text-gray-500 dark:text-gray-400 mt-2">You haven't created any identities yet.</p>
        </div>
        <Button on:click={() => goto('/dashboard/create-identity')} class="touch-target">Create Your First Identity</Button>
      </div>
    </div>
  {:else}
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="grid grid-cols-12 gap-2 sm:gap-4 font-medium text-sm text-muted-foreground">
          <div class="col-span-6 sm:col-span-4">Name</div>
          <div class="col-span-3 hidden sm:block">Type</div>
          <div class="col-span-2 hidden sm:block">Chain</div>
          <div class="col-span-3 sm:col-span-1">Created</div>
          <div class="col-span-3 sm:col-span-2 text-right">Actions</div>
        </div>
      </div>

      <div class="divide-y divide-border">
        {#each identities as identity}
          <div class="px-4 sm:px-6 py-4 hover:bg-muted/30 transition-colors">
            <div class="grid grid-cols-12 gap-2 sm:gap-4 items-center">
              <!-- Name and image -->
              <div class="col-span-6 sm:col-span-4 flex items-center gap-2 sm:gap-3">
                <div class="relative flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-primary/20">
                  {#if identity.identity_image}
                    <img src={identity.identity_image} alt={identity.name} class="w-full h-full object-cover" />
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  {/if}
                  <!-- Removed type icon -->
                </div>
                <div class="truncate">
                  <div class="font-medium truncate text-sm sm:text-base">{identity.name}</div>
                  {#if identity.tags && identity.tags.length > 0}
                    <div class="hidden sm:flex flex-wrap gap-1.5 mt-1.5">
                      {#each identity.tags.slice(0, 2) as tag}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-foreground/70 hover:bg-primary/20 transition-colors duration-200">
                          {tag}
                        </span>
                      {/each}
                      {#if identity.tags.length > 2}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground/70 hover:bg-muted/80 transition-colors duration-200">
                          +{identity.tags.length - 2}
                        </span>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Type -->
              <div class="col-span-3 hidden sm:block">
                <span class="capitalize">{identity.type}</span>
              </div>

              <!-- Chain -->
              <div class="col-span-2 hidden sm:block">
                {#if identity.chain_id}
                  {#await fetchChainInfo(identity.chain_id) then chainInfo}
                    {#if chainInfo.icon_url}
                      <div class="flex items-center gap-1.5">
                        <img
                          src={chainInfo.icon_url}
                          alt={chainInfo.name}
                          class="w-4 h-4"
                          on:error={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = `https://placehold.co/16x16/svg?text=${identity.chain_id}`;
                          }}
                        />
                        <span class="text-sm">{chainInfo.name}</span>
                      </div>
                    {:else}
                      <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                          {identity.chain_id}
                        </div>
                        <span class="text-sm">{chainInfo.name}</span>
                      </div>
                    {/if}
                  {/await}
                {:else}
                  <span class="text-muted-foreground">-</span>
                {/if}
              </div>

              <!-- Created date -->
              <div class="col-span-3 sm:col-span-1 text-xs sm:text-sm text-muted-foreground">
                {#if identity.created_at}
                  {new Date(identity.created_at).toLocaleDateString()}
                {:else}
                  -
                {/if}
              </div>

              <!-- Actions -->
              <div class="col-span-3 sm:col-span-2 flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" size="sm" class="text-xs sm:text-sm touch-target" on:click={() => handleViewDetails(identity)}>View</Button>
                <Button variant="outline" size="sm" class="text-xs sm:text-sm touch-target" on:click={() => goto(`/dashboard/update-identity?id=${identity.id}&chainId=${identity.chain_id}`)}>Edit</Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
