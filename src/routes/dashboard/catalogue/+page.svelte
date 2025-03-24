<script lang="ts">
  import { onMount } from 'svelte';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { getUserIdentities } from '$lib/services/userIdentityService';
  import { getUserArtContracts } from '$lib/services/artContractService';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import ArtContractDeploymentDialog from '$lib/components/ArtContractDeploymentDialog.svelte';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  import type { ArtContractInfo } from '$lib/services/artContractService';
  import type { Address } from 'viem';
  import { goto } from '$app/navigation';

  // State
  let isLoading = true;
  let artistIdentities: UserIdentity[] = [];
  let artContracts: ArtContractInfo[] = [];
  let selectedIdentity: UserIdentity | null = null;
  let deploymentDialogOpen = false;
  let errorMessage = '';
  let showTooltip = false;
  let tooltipPosition = { x: 0, y: 0 };
  let tooltipButton: HTMLDivElement;

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

  // Load data on mount
  onMount(async () => {
    try {
      await loadData();
    } catch (error) {
      console.error('Error loading data:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while loading data';
    } finally {
      isLoading = false;
    }
  });

  // Load user identities and ART contracts
  async function loadData() {
    const walletAddress = getWalletAddress();
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    // Load user identities
    const identities = await getUserIdentities(walletAddress);

    // Filter for artist identities only
    artistIdentities = identities.filter(identity => identity.type === 'artist');

    // Load ART contracts
    artContracts = await getUserArtContracts(walletAddress);
  }

  // Handle deploy button click
  function handleOpenDeployDialog() {
    // Default to the first artist identity if available
    selectedIdentity = artistIdentities.length > 0 ? artistIdentities[0] : null;
    deploymentDialogOpen = true;
  }

  // Handle deployment success
  async function handleDeploymentSuccess(contractAddress: Address) {
    // Reload data after successful deployment
    await loadData();
  }

  // Format date
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  // Get chain name
  function getChainName(chainId: number) {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 10: return 'Optimism';
      case 42161: return 'Arbitrum';
      case 8453: return 'Base';
      case 11155111: return 'Sepolia';
      case 421614: return 'Arbitrum Sepolia';
      default: return `Chain ${chainId}`;
    }
  }
</script>

<div class="space-y-8 md:min-h-screen">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
    <div class="flex items-center gap-2">
      <h1 class="text-xl sm:text-2xl font-bold">Catalogue Raisonné</h1>
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
              <p>A catalogue raisonné is a comprehensive, annotated listing of all the known artworks by an artist. In the ARC system, each artist deploys their own ART Contract, which serves as their digital catalogue raisonné on the blockchain.</p>
              <p>Once you deploy an ART Contract, you can mint ART tokens for each of your artworks, documenting their provenance, history, and metadata in a permanent and verifiable way.</p>
            </div>
            <div class="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-background"></div>
          </div>
        {/if}
      </div>
    </div>
    {#if artistIdentities.length > 0}
      <Button on:click={handleOpenDeployDialog} class="w-full sm:w-auto touch-target">Deploy ART Contract</Button>
    {:else}
      <p class="text-sm text-gray-500 dark:text-gray-400">You need an artist identity to deploy ART contracts.</p>
    {/if}
  </div>

  {#if isLoading}
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="flex flex-col items-center justify-center py-8 sm:py-12">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p class="mt-4 text-sm">Loading your catalogue raisonné...</p>
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
          <Button class="mt-4" on:click={loadData}>Retry</Button>
        </div>
      </div>
    </div>
  {:else}
    <!-- ART Contracts Section -->
    <div class="rounded-lg border border-border overflow-hidden">
      <div class="bg-muted/50 px-4 sm:px-6 py-4 border-b border-border">
        <div class="flex flex-col space-y-6">
          <h2 class="text-lg font-semibold">Your ART Contracts</h2>

          <Separator />

          {#if artContracts.length === 0}
            <div class="flex flex-col items-center justify-center py-8 sm:py-12">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 class="text-lg sm:text-xl font-medium text-center mt-4">No ART Contracts Found</h3>
              <p class="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base max-w-md mt-2">
                You haven't deployed any ART contracts yet. Deploy your first contract to start building your catalogue raisonné.
              </p>
            </div>
          {:else}
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="border-b border-border">
                    <th class="text-left py-2 px-4 font-medium text-sm">Name</th>
                    <th class="text-left py-2 px-4 font-medium text-sm">Symbol</th>
                    <th class="text-left py-2 px-4 font-medium text-sm">Chain</th>
                    <th class="text-left py-2 px-4 font-medium text-sm">Deployed</th>
                    <th class="text-left py-2 px-4 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each artContracts as contract}
                    <tr class="border-b border-border hover:bg-muted/30 transition-colors">
                      <td class="py-3 px-4 text-sm">{contract.name}</td>
                      <td class="py-3 px-4 text-sm">{contract.symbol}</td>
                      <td class="py-3 px-4 text-sm">{getChainName(contract.chainId)}</td>
                      <td class="py-3 px-4 text-sm">{formatDate(contract.deployedAt)}</td>
                      <td class="py-3 px-4 text-sm">
                        <Button size="sm" variant="outline" class="text-xs sm:text-sm touch-target">View</Button>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- ART Contract Deployment Dialog -->
<ArtContractDeploymentDialog
  bind:open={deploymentDialogOpen}
  identity={selectedIdentity}
  onSuccess={handleDeploymentSuccess}
/>
