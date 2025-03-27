<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { fetchChainInfo } from '$lib/services/chainService';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { writeContract, readContract, waitForTransaction, getAccount, switchChain, getChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import type { Address } from 'viem';
  import type { ArtToken } from '$lib/types/art';

  // State
  let isLoading = true;
  let errorMessage = '';
  let token: ArtToken | null = null;
  let contractAddress: string = $page.params.contractAddress;
  let chainId: number = parseInt($page.params.chainId);
  let tokenId: number = parseInt($page.params.tokenId);
  let artistName: string = '';
  let explorerUrl = '';
  let openSeaUrl = '';
  let isOwner = false;
  let walletAddress: Address | null = null;
  let tokenOwner: Address | null = null;

  // Transfer dialog state
  let transferDialogOpen = false;
  let recipientAddress = '';
  let isTransferring = false;
  let transferErrorMessage = '';
  let transferSuccess = false;
  let transactionHash = '';

  // Format date
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  }

  // Format royalties
  function formatRoyalties(royalties: number | null) {
    if (royalties === null || royalties === undefined) return 'Not set';
    return `${royalties / 100}%`;
  }

  // Handle back button
  function handleBack() {
    goto(`/dashboard/catalogue/${chainId}/${contractAddress}`);
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
          openSeaUrl = `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
        } else if (chainId === 10) {
          // Optimism
          openSeaUrl = `https://opensea.io/assets/optimism/${contractAddress}/${tokenId}`;
        } else if (chainId === 42161) {
          // Arbitrum
          openSeaUrl = `https://opensea.io/assets/arbitrum/${contractAddress}/${tokenId}`;
        } else if (chainId === 8453) {
          // Base
          openSeaUrl = `https://opensea.io/assets/base/${contractAddress}/${tokenId}`;
        } else if (chainId === 11155111) {
          // Sepolia
          openSeaUrl = `https://testnets.opensea.io/assets/sepolia/${contractAddress}/${tokenId}`;
        } else if (chainId === 421614) {
          // Arbitrum Sepolia
          openSeaUrl = `https://testnets.opensea.io/assets/arbitrum-sepolia/${contractAddress}/${tokenId}`;
        } else {
          // Default to Ethereum
          openSeaUrl = `https://opensea.io/assets/ethereum/${contractAddress}/${tokenId}`;
        }
      }
    } catch (error) {
      console.error('Error fetching explorer URL:', error);
    }
  }

  // Get the current owner of the token and check if the connected wallet is the owner
  async function checkOwnership() {
    try {
      walletAddress = await getWalletAddress();

      if (!contractAddress || !tokenId) {
        isOwner = false;
        return;
      }

      // Call ownerOf function on the contract
      const owner = await readContract(config, {
        address: contractAddress as Address,
        abi: [
          {
            inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
            name: 'ownerOf',
            outputs: [{ internalType: 'address', name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
        chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
      });

      // Store the token owner
      tokenOwner = owner as Address;

      // Compare the owner address with the wallet address (case-insensitive)
      if (walletAddress) {
        isOwner = owner.toLowerCase() === walletAddress.toLowerCase();
      } else {
        isOwner = false;
      }

      console.log('Token owner:', tokenOwner);
      console.log('Is owner:', isOwner);
    } catch (error) {
      console.error('Error checking ownership:', error);
      tokenOwner = null;
      isOwner = false;
    }
  }

  // Handle transfer token
  async function handleTransferToken() {
    try {
      transferErrorMessage = '';
      isTransferring = true;
      transferSuccess = false;

      if (!recipientAddress) {
        transferErrorMessage = 'Recipient address is required';
        isTransferring = false;
        return;
      }

      // Validate recipient address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
        transferErrorMessage = 'Invalid Ethereum address format';
        isTransferring = false;
        return;
      }

      // Ensure we're on the correct chain
      const currentChainId = await getChainId(config);
      if (currentChainId !== chainId) {
        await switchChain(config, { chainId: chainId as any });
        console.log(`Switched to chain ID: ${chainId}`);
      }

      // Call safeTransferFrom function on the contract
      const result = await writeContract(config, {
        address: contractAddress as Address,
        abi: [
          {
            inputs: [
              { internalType: 'address', name: 'from', type: 'address' },
              { internalType: 'address', name: 'to', type: 'address' },
              { internalType: 'uint256', name: 'tokenId', type: 'uint256' }
            ],
            name: 'safeTransferFrom',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'safeTransferFrom',
        args: [walletAddress as Address, recipientAddress as Address, BigInt(tokenId)],
        chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
      });

      // Handle different return formats
      let hash: `0x${string}` | undefined;
      if (typeof result === 'string') {
        hash = result as `0x${string}`;
      } else if (result && typeof result === 'object' && 'hash' in result) {
        hash = (result as { hash: `0x${string}` }).hash;
      } else {
        throw new Error('Invalid transaction result');
      }

      transactionHash = hash;
      console.log('Transaction hash:', transactionHash);

      // Wait for transaction to be confirmed
      const receipt = await waitForTransaction(config, {
        hash: hash,
        confirmations: 1
      });

      console.log('Transaction confirmed:', receipt);

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed');
      }

      transferSuccess = true;
      isOwner = false; // Update ownership status

      // Close dialog after a delay
      setTimeout(() => {
        transferDialogOpen = false;
        // Reload token data to reflect the new owner
        loadTokenData();
      }, 3000);

    } catch (error) {
      console.error('Error transferring token:', error);
      transferErrorMessage = error instanceof Error ? error.message : 'An error occurred while transferring the token';
    } finally {
      isTransferring = false;
    }
  }

  // Reset transfer dialog
  function resetTransferDialog() {
    recipientAddress = '';
    transferErrorMessage = '';
    transferSuccess = false;
    transactionHash = '';
  }

  // Load token data
  async function loadTokenData() {
    try {
      isLoading = true;
      errorMessage = '';

      // Fetch token data
      const response = await fetch(`/api/art/token?chainId=${chainId}&contractAddress=${contractAddress}&tokenId=${tokenId}`);
      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Failed to load token data');
      }

      token = data.token;

      // Fetch contract data to get artist info
      const contractResponse = await fetch(`/api/contracts?chainId=${chainId}`);
      const contractData = await contractResponse.json();

      if (contractData.success && contractData.contract) {
        artistName = contractData.contract.identities?.name || 'Unknown Artist';
      }

      await getExplorerUrl();
      await checkOwnership();

    } catch (error) {
      console.error('Error loading token data:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while loading data';
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadTokenData();
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex items-center gap-2 mb-6">
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 sm:h-9 sm:w-9"
      on:click={handleBack}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span class="sr-only">Back</span>
    </Button>
    <h1 class="text-xl sm:text-2xl font-bold">Artwork Details</h1>
  </div>

  {#if errorMessage}
    <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
      <p class="text-red-800 dark:text-red-300">{errorMessage}</p>
    </div>
  {/if}

  {#if isLoading}
    <div class="py-12 flex flex-col items-center justify-center space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p class="text-muted-foreground">Loading artwork details...</p>
    </div>
  {:else if token}
    <div class="bg-card border rounded-lg shadow-sm p-6">
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

          <div class="flex gap-2">
            {#if isOwner}
              <Button variant="default" size="sm" on:click={() => {
                resetTransferDialog();
                transferDialogOpen = true;
              }}>Transfer Token</Button>
            {/if}
            <a href="/dashboard/catalogue/{chainId}/{contractAddress}/{tokenId}/edit" class="inline-block">
              <Button variant="outline" size="sm">Edit Artwork</Button>
            </a>
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
              <div class="col-span-2">
                <h3 class="text-sm font-medium text-muted-foreground">Owner</h3>
                <p class="mt-1 font-mono text-sm break-all">
                  {#if tokenOwner}
                    {#if explorerUrl}
                      <a href="{explorerUrl}/address/{tokenOwner}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                        {tokenOwner}
                      </a>
                    {:else}
                      {tokenOwner}
                    {/if}
                    {#if isOwner}
                      <span class="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                        You
                      </span>
                    {/if}
                  {:else}
                    Loading owner...
                  {/if}
                </p>
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
    </div>
  {:else}
    <div class="py-12 flex flex-col items-center justify-center space-y-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      <p class="text-muted-foreground">No artwork data available.</p>
    </div>
  {/if}
</div>

<!-- Transfer Token Dialog -->
<Dialog.Root bind:open={transferDialogOpen} onOpenChange={(open) => {
  if (!open) resetTransferDialog();
}}>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/50 z-50" />
    <Dialog.Content class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
      <Dialog.Title class="text-lg font-semibold">
        Transfer Token
      </Dialog.Title>
      <Dialog.Description class="text-sm text-muted-foreground">
        Transfer this token to another wallet address.
      </Dialog.Description>

      {#if transferSuccess}
        <div class="py-4 flex flex-col items-center justify-center space-y-4">
          <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 class="text-lg font-medium">Transfer Successful</h3>
          <p class="text-muted-foreground text-center max-w-md">
            The token has been successfully transferred to the recipient address.
          </p>
          {#if transactionHash && explorerUrl}
            <a href="{explorerUrl}/tx/{transactionHash}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
              View transaction on explorer
            </a>
          {/if}
        </div>
      {:else}
        <form on:submit|preventDefault={handleTransferToken} class="space-y-4">
          <div class="space-y-2">
            <label for="recipientAddress" class="text-sm font-medium">Recipient Address</label>
            <Input
              id="recipientAddress"
              bind:value={recipientAddress}
              placeholder="0x..."
              disabled={isTransferring}
            />
            <p class="text-xs text-muted-foreground">Enter the Ethereum address of the recipient.</p>
          </div>

          {#if transferErrorMessage}
            <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p class="text-red-800 dark:text-red-300 text-sm">{transferErrorMessage}</p>
            </div>
          {/if}

          <div class="flex justify-end gap-2 pt-4">
            <Dialog.Close asChild>
              <Button variant="outline" disabled={isTransferring}>Cancel</Button>
            </Dialog.Close>
            <Button type="submit" disabled={isTransferring}>
              {#if isTransferring}
                <span class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                Transferring...
              {:else}
                Transfer
              {/if}
            </Button>
          </div>
        </form>
      {/if}

      <Dialog.Close class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
        <span class="sr-only">Close</span>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
