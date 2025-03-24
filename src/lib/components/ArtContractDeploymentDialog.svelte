<script lang="ts">
  import { onMount } from 'svelte';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { deployArtContract } from '$lib/services/artContractService';
  import { getUserIdentities } from '$lib/services/userIdentityService';
  import { writeContract, waitForTransaction, getAccount, switchChain, getChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import type { Address } from 'viem';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  import { fetchChainInfo } from '$lib/services/chainService';
  import type { ChainInfo } from '$lib/services/chainService';

  // Props
  export let open = false;
  export let identity: UserIdentity | null = null;
  export let onSuccess: (contractAddress: Address) => void = () => {};

  // State
  let isProcessing = false;
  let currentStep = 1; // 1: Confirm, 2: Processing, 3: Success
  let errorMessage = '';
  let contractAddress: Address | null = null;
  let transactionHash = '';
  let symbol = '';
  let chainInfo: ChainInfo | null = null;
  let artistIdentities: UserIdentity[] = [];
  let selectedIdentityId: string = '';

  // Generate symbol from identity name
  $: if (identity && identity.name) {
    // Get the first letter of the first word in the name
    const initial = identity.name.trim().charAt(0).toUpperCase();

    // Set symbol to ARC + initial
    symbol = `ARC${initial}`;
  }

  // Load artist identities when dialog opens
  $: if (open) {
    resetDialog();
    loadArtistIdentities();
  }

  // Load artist identities
  async function loadArtistIdentities() {
    try {
      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Load user identities
      const identities = await getUserIdentities(walletAddress);

      // Filter for artist identities only
      artistIdentities = identities.filter(identity => identity.type === 'artist');

      // Set the selected identity
      if (artistIdentities.length > 0) {
        const currentIdentity = identity;
        if (currentIdentity && artistIdentities.some(i => i.id === currentIdentity.id)) {
          selectedIdentityId = currentIdentity.id.toString();
        } else {
          selectedIdentityId = artistIdentities[0].id.toString();
          identity = artistIdentities[0];
        }
      }
    } catch (error) {
      console.error('Error loading artist identities:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to load artist identities';
    }
  }

  // Fetch chain info when identity changes
  $: if (identity && typeof identity.chain_id === 'number') {
    const chainId = identity.chain_id;
    fetchChainInfo(chainId).then(info => {
      chainInfo = info;
      console.log('Chain info for chain ID', chainId, ':', info);
    }).catch(error => {
      console.error('Error fetching chain info:', error);
    });
  }

  function resetDialog() {
    isProcessing = false;
    currentStep = 1;
    errorMessage = '';
    contractAddress = null;
    transactionHash = '';
    selectedIdentityId = '';
    // Don't reset identity here, as it's set by the parent component
    // and will be reset when loadArtistIdentities() is called
  }

  // Get chain name
  function getChainName(chainId?: number) {
    if (!chainId) return 'Unknown';

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

  // Handle deploy contract
  async function deployContract() {
    try {
      if (!identity) {
        throw new Error('No identity selected');
      }

      // Ensure identity ID is valid
      if (typeof identity.id !== 'number' || isNaN(identity.id) || identity.id <= 0) {
        throw new Error('Invalid identity ID. Please select a valid identity.');
      }

      // Log identity information for debugging
      console.log('Deploying with identity:', identity);
      console.log('Identity ID:', identity.id, 'Type:', typeof identity.id);

      isProcessing = true;
      currentStep = 2;
      errorMessage = '';

      // Get the current wallet address
      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Check if we need to switch chains
      const currentChainId = await getChainId(config);
      if (currentChainId !== identity.chain_id) {
        await switchChain(config, { chainId: identity.chain_id as 1 | 10 | 42161 | 8453 | 11155111 | 421614 });
      }

      // Verify that we have contract information for this chain
      const contractInfo = await fetch(`/api/contracts?chainId=${identity.chain_id}`).then(res => res.json());
      console.log('Contract info for deployment:', contractInfo);

      if (!contractInfo.success || !contractInfo.contract || !contractInfo.contract.art_factory_contract_address) {
        throw new Error(`ART Factory contract is not configured for chain ${getChainName(identity.chain_id)}. Please select a different chain.`);
      }

      // Convert identity ID to a number explicitly to ensure it's not a string
      const identityId = Number(identity.id);

      try {
        // Log the parameters being sent to deployArtContract
        console.log('Deploying ART contract with parameters:', {
          walletAddress,
          identityId,
          symbol,
          chainId: identity.chain_id
        });

        const result = await deployArtContract({
          walletAddress,
          identityId,
          symbol,
          chainId: identity.chain_id as 1 | 10 | 42161 | 8453 | 11155111 | 421614
        });

        console.log('Deployment result:', result);

        // Check if we have a transaction hash, even if there was an error
        if (result.transactionHash) {
          transactionHash = result.transactionHash;
        }

        // Check if we have a contract address
        if (result.contractAddress) {
          contractAddress = result.contractAddress;
        }

        // If the deployment was not successful, show the error but don't throw
        if (!result.success) {
          errorMessage = result.error || 'Failed to deploy ART contract';

          // Check if the error message indicates a transaction was actually sent
          const wasTransactionSent =
            transactionHash ||
            (typeof result.error === 'string' && result.error.includes('transaction hash'));

          // Check if this is a server configuration error (private key issue)
          const isServerConfigError =
            typeof result.error === 'string' &&
            (result.error.includes('invalid private key') ||
             result.error.includes('PRIVATE_KEY'));

          if (isServerConfigError) {
            console.log('Server configuration error detected. Showing friendly message.');
            errorMessage = 'The server is not properly configured to complete this operation. Please contact support.';

            // If we have a transaction hash, still show partial success
            if (wasTransactionSent) {
              console.log('Transaction was sent despite server error. Showing partial success.');
              currentStep = 3; // Move to success step with warning
            } else {
              throw new Error(errorMessage);
            }
          }
          // If we have a transaction hash or the error suggests a transaction was sent, consider it a partial success
          else if (wasTransactionSent) {
            console.log('Transaction was sent but encountered an issue. Showing partial success.');
            currentStep = 3; // Move to success step with warning
          } else {
            throw new Error(errorMessage);
          }
        } else {
          // Clear any error message on success
          errorMessage = '';
          currentStep = 3; // Move to success step
        }
      } catch (deployError) {
        console.error('Error in deployArtContract:', deployError);
        throw deployError; // Re-throw to be caught by the outer try-catch
      }

      // Call the success callback
      if (contractAddress) {
        onSuccess(contractAddress);
      }
    } catch (error) {
      console.error('Error deploying contract:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to deploy contract';
      currentStep = 1; // Go back to the confirmation step
    } finally {
      isProcessing = false;
    }
  }

  function handleClose() {
    if (!isProcessing) {
      open = false;
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>Deploy ART Contract</Dialog.Title>
      <Dialog.Description>
        {#if currentStep === 1}
          Deploy a new ART contract for your catalogue raisonné.
        {:else if currentStep === 2}
          Deploying your ART contract...
        {:else if currentStep === 3}
          ART contract deployed successfully!
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="p-4 space-y-6">
      {#if currentStep === 1}
        <div class="space-y-6">
          <div>
            <p class="text-sm font-medium mb-2">Select Identity</p>
            {#if artistIdentities.length > 1}
              <div class="grid grid-cols-1 gap-2">
                {#each artistIdentities as artistIdentity}
                  <Button
                    variant={selectedIdentityId === artistIdentity.id.toString() ? "default" : "outline"}
                    class="w-full justify-between items-center h-auto py-3 px-4 transition-colors hover:bg-accent hover:text-accent-foreground {selectedIdentityId === artistIdentity.id.toString() ? 'bg-primary/5 border-2 border-primary text-primary dark:bg-accent/60 dark:border-primary dark:text-white' : ''}"
                    on:click={() => {
                      console.log('Selected identity:', artistIdentity);
                      selectedIdentityId = artistIdentity.id.toString();
                      identity = {...artistIdentity}; // Create a new object to ensure reactivity
                      // Generate symbol based on the selected identity
                      if (identity && identity.name) {
                        const initial = identity.name.trim().charAt(0).toUpperCase();
                        symbol = `ARC${initial}`;
                      }
                      chainInfo = null;
                    }}
                  >
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {#if artistIdentity.identity_image}
                          <img
                            src={artistIdentity.identity_image}
                            alt={artistIdentity.name}
                            class="w-full h-full object-cover"
                            on:error={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.onerror = null;
                              img.src = `https://placehold.co/32x32/svg?text=${artistIdentity.name.charAt(0).toUpperCase()}`;
                            }}
                          />
                        {:else}
                          <div class="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground">
                            {artistIdentity.name.charAt(0).toUpperCase()}
                          </div>
                        {/if}
                      </div>
                      <div class="flex flex-col items-start gap-1">
                        <span class="font-medium {selectedIdentityId === artistIdentity.id.toString() ? 'text-primary dark:text-white' : ''}">{artistIdentity.name}</span>
                        <div class="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Artist</span>
                          <span>•</span>
                          <div class="flex items-center gap-1.5">
                            {#await fetchChainInfo(artistIdentity.chain_id) then chainInfo}
                              {#if chainInfo.icon_url}
                                <img
                                  src={chainInfo.icon_url}
                                  alt={chainInfo.name}
                                  class="w-3.5 h-3.5"
                                  on:error={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.onerror = null;
                                    img.src = `https://placehold.co/14x14/svg?text=${artistIdentity.chain_id}`;
                                  }}
                                />
                              {:else}
                                <div class="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center text-[8px]">
                                  {artistIdentity.chain_id}
                                </div>
                              {/if}
                              <span>{chainInfo.name}</span>
                            {/await}
                          </div>
                        </div>
                      </div>
                    </div>
                    {#if selectedIdentityId === artistIdentity.id.toString()}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0 text-primary dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    {/if}
                  </Button>
                {/each}
              </div>
            {:else}
              <p class="text-sm">{identity?.name || 'Unknown'}</p>
            {/if}
          </div>

          <div class="grid gap-6 p-4 border rounded-lg bg-muted/50">
            <div>
              <p class="text-sm font-medium mb-1.5">Contract Details</p>
              <div class="grid gap-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Name</span>
                  <span class="text-sm font-medium">ARC / {identity?.name || 'Unknown'}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Symbol</span>
                  <span class="text-sm font-medium">{symbol}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-muted-foreground">Chain</span>
                  <div class="flex items-center gap-2">
                    {#if chainInfo}
                      {#if chainInfo.icon_url}
                        <img
                          src={chainInfo.icon_url}
                          alt={chainInfo.name}
                          class="w-4 h-4"
                          on:error={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = `https://placehold.co/16x16/svg?text=${identity?.chain_id}`;
                          }}
                        />
                      {:else}
                        <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                          {identity?.chain_id}
                        </div>
                      {/if}
                      <span class="text-sm font-medium">{chainInfo.name}</span>
                    {:else}
                      <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                        {identity?.chain_id}
                      </div>
                      <span class="text-sm font-medium">{getChainName(identity?.chain_id)}</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {#if errorMessage}
            <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          {/if}
        </div>
      {:else if currentStep === 2}
        <div class="flex flex-col items-center justify-center py-8">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p class="mt-4 text-sm text-muted-foreground">Deploying your ART contract. Please wait...</p>
        </div>
      {:else if currentStep === 3}
        <div class="space-y-6">
          <div class="flex flex-col items-center justify-center py-6">
            <div class="h-12 w-12 rounded-full {errorMessage ? 'bg-yellow-500/20' : 'bg-green-500/20'} flex items-center justify-center">
              {#if errorMessage}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
            <h3 class="text-lg font-semibold mt-4">Transaction Sent</h3>
            <p class="text-sm text-muted-foreground mt-1">
              {#if errorMessage}
                Your transaction was sent, but there may have been an issue with the contract deployment.
              {:else}
                Your ART contract has been deployed successfully.
              {/if}
            </p>
          </div>

          <div class="grid gap-6 p-4 border rounded-lg bg-muted/50">
            <div>
              <p class="text-sm font-medium mb-1.5">Deployment Details</p>
              <div class="grid gap-4">
                <div>
                  <p class="text-sm text-muted-foreground mb-1">Contract Address</p>
                  <p class="text-sm font-mono bg-muted p-2 rounded break-all">{contractAddress || 'Unknown'}</p>
                </div>
                <div>
                  <p class="text-sm text-muted-foreground mb-1">Transaction Hash</p>
                  <p class="text-sm font-mono bg-muted p-2 rounded break-all">{transactionHash || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>

          {#if errorMessage}
            <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-500">
              <p class="font-medium mb-1">Warning:</p>
              <p>{errorMessage}</p>
              <p class="mt-2">Your transaction was sent successfully, but there may have been an issue with recording it in our database. You can still view your transaction on the blockchain explorer.</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      {#if currentStep === 1}
        <Button variant="outline" on:click={handleClose} disabled={isProcessing}>Cancel</Button>
        <Button on:click={deployContract} disabled={isProcessing || !identity || typeof identity.id !== 'number' || isNaN(identity.id)}>Deploy Contract</Button>
      {:else if currentStep === 2}
        <Button variant="outline" on:click={handleClose} disabled={true}>Cancel</Button>
        <Button disabled={true}>Deploying...</Button>
      {:else}
        <Button on:click={handleClose}>Close</Button>
      {/if}
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
