<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { uploadImageToArweave } from '$lib/services/arweaveService';
  import { mapIdentityType } from '$lib/services/identityService';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { getContractInfo, IDENTITY_ABI } from '$lib/services/contractService';
  import { writeContract, readContract, waitForTransaction, getAccount } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import { parseEther, type Address } from 'viem';

  // Props
  export let open = false;
  export let identityData: any;

  // State
  let currentStep = 1;
  let isProcessing = false;
  let errorMessage = '';
  let arweaveUrl = '';
  let transactionHash = '';
  let identityId = 0;

  // Reset state when dialog opens
  $: if (open) {
    currentStep = 1;
    isProcessing = false;
    errorMessage = '';
    arweaveUrl = '';
    transactionHash = '';
    identityId = identityData?.identityId || 0;
  }

  async function handleUploadToArweave() {
    try {
      isProcessing = true;
      errorMessage = '';

      // If we have an image, upload it to Arweave
      if (identityData?.identityImage) {
        arweaveUrl = await uploadImageToArweave(identityData.identityImage);
      } else {
        // If no image, use the ARC favicon as default
        arweaveUrl = 'https://www.artregistryconsortium.com/favicon.jpg';
      }

      // Move to the next step
      currentStep = 2;
    } catch (error) {
      console.error('Error uploading to Arweave:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to upload to Arweave';
    } finally {
      isProcessing = false;
    }
  }

  async function handleUpdateIdentity() {
    try {
      isProcessing = true;
      errorMessage = '';

      // Get the wallet address
      const walletAddress = getWalletAddress();
      if (!walletAddress) {
        throw new Error('Wallet address not found');
      }

      // Get the chain ID
      const chainId = identityData.selectedChain?.chain_id;
      if (!chainId) {
        throw new Error('Chain ID not found');
      }

      // Get the contract info
      const contractInfo = await getContractInfo(chainId);
      if (!contractInfo) {
        throw new Error('Contract info not found');
      }

      // Prepare the data for the contract call
      const displayData = {
        ...identityData,
        identityImage: arweaveUrl || identityData.identityImage
      };

      // Convert links to JSON string
      const linksJson = displayData.links && displayData.links.length > 0
        ? JSON.stringify(displayData.links.filter((link: any) => link.url.trim().length > 0))
        : '[]';

      // Convert addresses to JSON string
      const addressesJson = displayData.addresses && displayData.addresses.length > 0
        ? JSON.stringify(displayData.addresses.filter((addr: string) => addr.trim().length > 0))
        : '[]';

      // Prepare the contract data
      const contractData = {
        identityId: identityId,
        name: displayData.username,
        description: displayData.description || '',
        identityImage: displayData.identityImage || '',
        links: linksJson,
        tags: displayData.tags ? displayData.tags.filter((tag: string) => tag.trim().length > 0) : [],
        dob: displayData.dob || 0,
        dod: displayData.dod || 0,
        location: displayData.location || '',
        addresses: addressesJson,
        representedBy: displayData.representedBy ? (typeof displayData.representedBy === 'string' ? displayData.representedBy : JSON.stringify(displayData.representedBy)) : '',
        representedArtists: displayData.representedArtists ? (typeof displayData.representedArtists === 'string' ? displayData.representedArtists : JSON.stringify(displayData.representedArtists)) : ''
      };

      console.log('Contract data for transaction:', contractData);

      // Prepare the arguments for the contract call
      const args = [
        contractData.identityId,
        contractData.name,
        contractData.description,
        contractData.identityImage,
        contractData.links,  // This is now a JSON string as expected by the contract
        contractData.tags,
        contractData.dob,
        contractData.dod,
        contractData.location,
        contractData.addresses,  // This is now a JSON string as expected by the contract
        contractData.representedBy,
        contractData.representedArtists
      ];

      // Call the contract
      const { hash } = await writeContract(config, {
        address: contractInfo.identity_contract_address as Address,
        abi: IDENTITY_ABI,
        functionName: 'updateIdentity',
        args,
      });

      console.log('Transaction hash:', hash);
      transactionHash = hash;

      // Wait for the transaction to be mined
      const receipt = await waitForTransaction(config, {
        hash: hash as Address,
      });

      console.log('Transaction receipt:', receipt);

      // Move to the next step
      currentStep = 3;
    } catch (error) {
      console.error('Error updating identity:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to update identity';
    } finally {
      isProcessing = false;
    }
  }

  async function handleComplete() {
    try {
      isProcessing = true;
      errorMessage = '';

      // Close the dialog first
      open = false;

      // Force a page reload to ensure server-side checks are performed
      // This is more reliable than using goto() which might not trigger server-side checks
      window.location.href = '/dashboard/identities';
    } catch (error) {
      console.error('Error navigating to identities dashboard:', error);
      errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
      isProcessing = false;
    }
  }

  function handleClose() {
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content class="sm:max-w-[550px] w-[95vw] max-h-[90vh] overflow-y-auto">
      <Dialog.Header>
        <Dialog.Title>Update Your Identity</Dialog.Title>
        <Dialog.Description>
          Complete these steps to update your identity on the blockchain.
        </Dialog.Description>
      </Dialog.Header>

      {#if errorMessage}
        <div class="p-4 mb-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg overflow-auto max-h-48">
          <p class="break-words whitespace-normal">{errorMessage}</p>
        </div>
      {/if}

      <div class="py-4">
        <!-- Progress Steps -->
        <div class="relative mb-8">
          <!-- Progress Line -->
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0"></div>

          <!-- Step 1: Upload to Arweave -->
          <div class="flex items-start space-x-3">
            <div class={`rounded-full w-8 h-8 flex items-center justify-center z-10 ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {#if currentStep > 1}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else}
                1
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="text-base font-medium">Upload to Arweave</h3>
              <p class="text-sm text-muted-foreground">
                {#if currentStep === 1}
                  Uploading your profile image to decentralized storage.
                {:else if currentStep > 1}
                  Profile image uploaded to Arweave.
                {:else}
                  Upload your profile image to decentralized storage.
                {/if}
              </p>
              {#if currentStep === 1}
                <div class="mt-2">
                  <Button 
                    on:click={handleUploadToArweave} 
                    disabled={isProcessing}
                    class="w-full"
                  >
                    {#if isProcessing}
                      Uploading...
                    {:else}
                      Upload to Arweave
                    {/if}
                  </Button>
                </div>
              {/if}
            </div>
          </div>

          <!-- Step 2: Update Identity -->
          <div class="flex items-start space-x-3 mt-6">
            <div class={`rounded-full w-8 h-8 flex items-center justify-center z-10 ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {#if currentStep > 2}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else}
                2
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="text-base font-medium">Update Identity</h3>
              <p class="text-sm text-muted-foreground">
                {#if currentStep === 2}
                  Updating your identity on the blockchain.
                {:else if currentStep > 2}
                  Identity updated on the blockchain.
                {:else}
                  Update your identity on the blockchain.
                {/if}
              </p>
              {#if currentStep === 2}
                <div class="mt-2">
                  <Button 
                    on:click={handleUpdateIdentity} 
                    disabled={isProcessing}
                    class="w-full"
                  >
                    {#if isProcessing}
                      Updating...
                    {:else}
                      Update Identity
                    {/if}
                  </Button>
                </div>
              {/if}
              {#if transactionHash && currentStep > 2}
                <div class="mt-2 text-xs text-muted-foreground break-all">
                  Transaction: {transactionHash}
                </div>
              {/if}
            </div>
          </div>

          <!-- Step 3: Complete -->
          <div class="flex items-start space-x-3 mt-6">
            <div class={`rounded-full w-8 h-8 flex items-center justify-center z-10 ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {#if currentStep > 3}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else}
                3
              {/if}
            </div>
            <div class="flex-1">
              <h3 class="text-base font-medium">Complete</h3>
              <p class="text-sm text-muted-foreground">
                {#if currentStep === 3}
                  Your identity has been updated successfully.
                {:else}
                  Complete the update process.
                {/if}
              </p>
              {#if currentStep === 3}
                <div class="mt-2">
                  <Button 
                    on:click={handleComplete} 
                    disabled={isProcessing}
                    class="w-full"
                  >
                    {#if isProcessing}
                      Completing...
                    {:else}
                      Return to Identities
                    {/if}
                  </Button>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" on:click={handleClose} disabled={isProcessing}>
          Cancel
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
