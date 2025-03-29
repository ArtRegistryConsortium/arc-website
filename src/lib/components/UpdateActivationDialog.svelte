<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { uploadImageToArweave } from '$lib/services/arweaveService';
  import { mapIdentityType } from '$lib/services/identityService';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { getContractInfo, IDENTITY_ABI } from '$lib/services/contractService';
  import { writeContract, readContract, waitForTransaction, getAccount, switchChain, getChainId } from 'wagmi/actions';
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
  let chainId = 0;
  let originalImageUrl = '';

  // Reset state when dialog opens
  $: if (open) {
    currentStep = 1;
    isProcessing = false;
    errorMessage = '';
    arweaveUrl = '';
    transactionHash = '';
    // Make sure identityId and chainId are valid numbers
    identityId = identityData?.identityId ? Number(identityData.identityId) : 0;
    chainId = identityData?.chainId ? Number(identityData.chainId) : 0;
    // Store the original image URL for comparison
    originalImageUrl = identityData?.originalImageUrl || '';
    console.log('Dialog opened with identityId:', identityId);
    console.log('Dialog opened with chainId:', chainId);
    console.log('Dialog opened with identity data:', identityData);
    console.log('Original image URL:', originalImageUrl);
  }

  async function handleUploadToArweave() {
    try {
      isProcessing = true;
      errorMessage = '';

      // Check if the image has changed by comparing with the original image URL
      if (identityData?.identityImage && originalImageUrl && identityData.identityImage === originalImageUrl) {
        // Image hasn't changed, skip upload and use the original URL
        console.log('Image has not changed, skipping Arweave upload');
        arweaveUrl = originalImageUrl;
      } else if (identityData?.identityImage) {
        // Image has changed, upload to Arweave
        console.log('Image has changed, uploading to Arweave via server API...');
        arweaveUrl = await uploadImageToArweave(identityData.identityImage);
        console.log('Image uploaded successfully:', arweaveUrl);
      } else {
        // If no image, use the ARC favicon as default
        console.log('No image provided, using default image');
        arweaveUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';
      }

      // Move to the next step
      currentStep = 2;
    } catch (error) {
      console.error('Error uploading to Arweave:', error);

      // Format error message for better user experience
      if (error instanceof Error) {
        const errorMsg = error.message;

        if (errorMsg.includes('File size exceeds')) {
          errorMessage = errorMsg; // Already formatted nicely
        } else if (errorMsg.includes('File type not supported')) {
          errorMessage = errorMsg; // Already formatted nicely
        } else if (errorMsg.includes('Server configuration error')) {
          errorMessage = 'The server is not properly configured for image uploads. Please check the server logs and ensure the ARWEAVE_WALLET_KEY is properly set.';
        } else if (errorMsg.length > 200) {
          // If error message is too long, truncate it
          errorMessage = 'Upload error: ' + errorMsg.substring(0, 200) + '...';
        } else {
          errorMessage = errorMsg;
        }
      } else {
        errorMessage = 'Failed to upload image to Arweave. Please try again or use a different image.';
      }
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

      // Get the chain ID from the identity data
      if (!chainId) {
        // Fallback to selectedChain if chainId is not directly provided
        chainId = identityData.selectedChain?.chain_id;
        if (!chainId) {
          throw new Error('Chain ID not found');
        }
      }
      console.log('Target chain ID for update:', chainId);

      // Check current chain and switch if needed
      const currentChainId = await getChainId(config);
      console.log('Current chain ID:', currentChainId);

      if (currentChainId !== chainId) {
        console.log(`Switching from chain ${currentChainId} to chain ${chainId}`);
        try {
          await switchChain(config, { chainId: chainId as 1 | 11155111 | 10 | 42161 | 421614 | 8453 });
          console.log('Chain switched successfully');
        } catch (switchError) {
          console.error('Error switching chain:', switchError);
          throw new Error(`Failed to switch to the correct blockchain network. Please switch to ${identityData.selectedChain?.name} manually and try again.`);
        }
      }

      // Get the contract info
      const contractInfo = await getContractInfo(chainId);
      if (!contractInfo) {
        throw new Error('Contract info not found');
      }
      console.log('Contract info:', contractInfo);

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
        identityId: Number(identityId) || 0, // Ensure it's a valid number
        identityType: mapIdentityType(displayData.identityType || 'artist'), // Map the identity type to the enum value
        name: displayData.username,
        description: displayData.description || '',
        identityImage: displayData.identityImage || '',
        links: linksJson,
        tags: displayData.tags ? displayData.tags.filter((tag: string) => tag.trim().length > 0) : [],
        dob: Number(displayData.dob) || 0, // Ensure it's a valid number
        dod: Number(displayData.dod) || 0, // Ensure it's a valid number
        location: displayData.location || '',
        addresses: addressesJson,
        representedBy: displayData.representedBy ? (typeof displayData.representedBy === 'string' ? displayData.representedBy : JSON.stringify(displayData.representedBy)) : '',
        representedArtists: displayData.representedArtists ? (typeof displayData.representedArtists === 'string' ? displayData.representedArtists : JSON.stringify(displayData.representedArtists)) : ''
      };

      console.log('Identity ID for contract call:', contractData.identityId, typeof contractData.identityId);

      console.log('Contract data for transaction:', contractData);

      // Prepare the arguments for the contract call
      const args = [
        contractData.identityId,
        contractData.identityType,
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

      // Validate all arguments before calling the contract
      for (let i = 0; i < args.length; i++) {
        console.log(`Argument ${i}:`, args[i], typeof args[i]);
        // Make sure numeric values are valid
        if (i === 0 || i === 1 || i === 7 || i === 8) { // identityId, identityType, dob, dod
          if (args[i] === undefined || args[i] === null) {
            console.warn(`Argument ${i} is ${args[i]}, setting to 0`);
            args[i] = 0;
          }
        }
      }

      console.log('Final contract arguments:', args);

      // Call the contract
      console.log('Calling updateIdentity on contract at address:', contractInfo.identity_contract_address);
      const hash = await writeContract(config, {
        address: contractInfo.identity_contract_address as Address,
        abi: IDENTITY_ABI,
        functionName: 'updateIdentity',
        args,
        gas: BigInt(3000000), // Set a gas limit explicitly
      });

      console.log('Transaction hash:', hash);
      transactionHash = hash;

      // Wait for the transaction to be mined
      console.log('Waiting for transaction to be mined...');
      try {
        const receipt = await waitForTransaction(config, {
          hash: hash as Address,
          timeout: 60_000, // 60 seconds timeout
        });

        console.log('Transaction receipt:', receipt);

        // Check if the transaction was successful
        if (receipt.status === 'reverted') {
          throw new Error('Transaction was reverted by the blockchain. This could be due to a contract error or gas issues.');
        }
      } catch (waitError) {
        console.warn('Error waiting for transaction:', waitError);

        // Format the error message
        if (waitError instanceof Error) {
          const errorMsg = waitError.message;

          if (errorMsg.includes('timeout')) {
            console.warn('Timeout waiting for transaction, but continuing anyway');
            // Continue anyway, as the transaction might still be processed
          } else if (errorMsg.includes('reverted')) {
            throw new Error('Transaction was reverted by the blockchain. This could be due to a contract error or gas issues.');
          } else {
            throw waitError; // Re-throw other errors to be caught by the outer catch block
          }
        } else {
          // Continue anyway if it's not a critical error
          console.warn('Unknown error type while waiting for transaction, continuing anyway');
        }
      }

      // Update the identity in the database
      console.log('Updating identity in database...');
      try {
        // Prepare the data for the database update
        const dbUpdateData = {
          identityId: contractData.identityId,
          walletAddress,
          identityType: contractData.identityType, // Include the identity type
          name: contractData.name,
          description: contractData.description,
          identityImage: contractData.identityImage,
          links: contractData.links,
          tags: contractData.tags,
          dob: contractData.dob,
          dod: contractData.dod,
          location: contractData.location,
          addresses: contractData.addresses,
          representedBy: contractData.representedBy,
          representedArtists: contractData.representedArtists,
          chainId: chainId,
          transactionHash: hash
        };

        const dbResponse = await fetch('/api/identity/update-db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dbUpdateData)
        });

        const dbResult = await dbResponse.json();
        console.log('Database update result:', dbResult);

        if (!dbResult.success) {
          console.warn('Warning: Database update failed:', dbResult.error);
          // Continue anyway, as the blockchain update was successful
        }
      } catch (dbError) {
        console.error('Error updating database:', dbError);
        // Continue anyway, as the blockchain update was successful
      }

      // Move to the next step
      currentStep = 3;
    } catch (error) {
      console.error('Error updating identity:', error);

      // Format the error message to be more user-friendly
      if (error instanceof Error) {
        const errorMsg = error.message;

        // Check for common wallet errors
        if (errorMsg.includes('User rejected the request')) {
          errorMessage = 'Transaction was rejected. Please try again and approve the transaction in your wallet.';
        } else if (errorMsg.includes('insufficient funds')) {
          errorMessage = 'Your wallet has insufficient funds to complete this transaction. Please add funds and try again.';
        } else if (errorMsg.includes('nonce')) {
          errorMessage = 'Transaction nonce error. Please refresh the page and try again.';
        } else if (errorMsg.includes('gas')) {
          errorMessage = 'Gas estimation failed. The transaction might fail or the contract may have an issue.';
        } else if (errorMsg.includes('execution reverted')) {
          // Extract the revert reason if available
          const revertMatch = errorMsg.match(/execution reverted: ([^"]+)/i);
          if (revertMatch && revertMatch[1]) {
            errorMessage = `Transaction failed: ${revertMatch[1]}`;
          } else {
            errorMessage = 'Transaction failed: The contract reverted the transaction.';
          }
        } else if (errorMsg.length > 300) {
          // If error message is too long, truncate it
          errorMessage = 'Transaction error: ' + errorMsg.substring(0, 300) + '...';
        } else {
          errorMessage = errorMsg;
        }
      } else {
        errorMessage = 'An unknown error occurred while updating your identity. Please try again.';
      }
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
        <div class="p-4 mb-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg overflow-auto max-h-48 w-full">
          <p class="break-words whitespace-normal text-sm md:text-base">{errorMessage}</p>
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
                  {#if isProcessing}
                    <div class="flex items-center space-x-2">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span class="text-sm">Updating...</span>
                    </div>
                  {:else}
                    <!-- Display contract data for verification -->
                    <div class="mt-2 mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-xs font-mono overflow-auto max-h-60">
                      <h4 class="text-sm font-medium mb-2">Contract Data Preview:</h4>
                      <div class="mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                        <h5 class="text-xs font-medium mb-1">Database Data (JSONB Format):</h5>
                        <pre class="whitespace-pre-wrap break-all">{JSON.stringify({
                          identityId: Number(identityId) || 0,
                          identityType: mapIdentityType(identityData?.identityType || 'artist'),
                          name: identityData?.username || '',
                          description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
                          identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
                          // Links stored as JSON objects in database (JSONB)
                          links: identityData?.links || [],
                          tags: identityData?.tags?.length > 0 ? identityData.tags : [],
                          // Type-specific fields
                          ...(identityData?.identityType === 'artist' ? {
                            dob: identityData?.dob || 0,
                            dod: identityData?.dod || 0,
                            location: identityData?.location || ''
                          } : {}),
                          ...((identityData?.identityType === 'gallery' || identityData?.identityType === 'institution') ? {
                            addresses: identityData?.addresses || []
                          } : {})
                        }, null, 2)}</pre>
                      </div>

                      <div>
                        <h5 class="text-xs font-medium mb-1">Contract Data (Blockchain Format):</h5>
                        <pre class="whitespace-pre-wrap break-all">{JSON.stringify({
                          identityId: Number(identityId) || 0,
                          identityType: mapIdentityType(identityData?.identityType || 'artist'),
                          name: identityData?.username || '',
                          description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
                          identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
                          // Links converted to JSON string for contract
                          links: JSON.stringify(identityData?.links || []),
                          tags: identityData?.tags?.length > 0 ? identityData.tags : [],
                          // Type-specific fields
                          ...(identityData?.identityType === 'artist' ? {
                            dob: identityData?.dob || 0,
                            dod: identityData?.dod || 0,
                            location: identityData?.location || ''
                          } : {}),
                          ...((identityData?.identityType === 'gallery' || identityData?.identityType === 'institution') ? {
                            addresses: JSON.stringify(identityData?.addresses || [])
                          } : {})
                        }, null, 2)}</pre>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      class="mt-2 w-full"
                      on:click={handleUpdateIdentity}
                      disabled={isProcessing}
                    >
                      Update Identity
                    </Button>
                  {/if}
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
