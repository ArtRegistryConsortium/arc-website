<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { uploadImageToArweave } from '$lib/services/arweaveService';
  import { mapIdentityType } from '$lib/services/identityService';
  // Removed completeWalletSetup import as it's no longer needed
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { getContractInfo, IDENTITY_ABI } from '$lib/services/contractService';
  import { writeContract, readContract, waitForTransaction, getAccount } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import { parseEther, type Address } from 'viem';
  import type { IdentityInfo } from '$lib/stores/identityStore';

  export let open = false;
  export let identityData: IdentityInfo = {
    identityType: null,
    username: '',
    description: '',
    identityImage: '',
    links: [],
    tags: [],
    dob: undefined,
    dod: undefined,
    location: '',
    addresses: [],
    representedBy: undefined,
    representedArtists: undefined,
    selectedChain: null
  };

  // Dialog state
  let currentStep = 1;
  let totalSteps = 3;
  let isProcessing = false;
  let errorMessage = '';
  let arweaveUrl = '';
  let transactionHash: string = '';
  let identityId = 0;

  // Reset the dialog state when it opens
  $: if (open) {
    currentStep = 1;
    isProcessing = false;
    errorMessage = '';
    arweaveUrl = '';
    transactionHash = '';
    identityId = 0;
  }

  async function handleUploadToArweave() {
    try {
      isProcessing = true;
      errorMessage = '';

      // If we have an image, upload it to Arweave via server-side API
      if (identityData?.identityImage) {
        console.log('Uploading image to Arweave via server API...');
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

  async function handleCreateIdentity() {
    // Check if wallet is connected
    const account = getAccount(config);
    if (!account.isConnected || !account.address) {
      errorMessage = 'Wallet not connected. Please connect your wallet first.';
      return;
    }

    if (!identityData?.identityType || !identityData?.username || !identityData?.selectedChain?.chain_id) {
      errorMessage = 'Missing identity information. Please go back and complete all steps.';
      return;
    }

    try {
      isProcessing = true;
      errorMessage = '';

      // Get contract info for the selected chain
      const contractInfo = await getContractInfo(identityData.selectedChain.chain_id);
      if (!contractInfo || !contractInfo.identity_contract_address) {
        errorMessage = 'Contract information not found for the selected chain.';
        isProcessing = false;
        return;
      }

      // Prepare the contract data for display and for the contract call
      // For display: keep the original format
      const displayData = {
        identityType: mapIdentityType(identityData?.identityType || 'artist'),
        name: identityData?.username || '',
        description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
        identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
        links: identityData?.links || [],
        tags: identityData?.tags?.length > 0 ? identityData.tags : [],
        dob: identityData?.dob || 0,
        dod: identityData?.dod || 0,
        location: identityData?.location || '',
        addresses: identityData?.addresses || [],
        representedBy: identityData?.representedBy,
        representedArtists: identityData?.representedArtists
      };

      // For contract: convert to the format expected by the contract
      const contractData = {
        identityType: displayData.identityType,
        name: displayData.name,
        description: displayData.description,
        identityImage: displayData.identityImage,
        // Convert links from {name, url} objects to JSON string for the contract
        links: JSON.stringify(displayData.links || []),
        tags: displayData.tags,
        dob: displayData.dob,
        dod: displayData.dod,
        location: displayData.location,
        // Convert addresses to JSON string for the contract
        addresses: JSON.stringify(displayData.addresses || []),
        representedBy: displayData.representedBy ? (typeof displayData.representedBy === 'string' ? displayData.representedBy : JSON.stringify(displayData.representedBy)) : '',
        representedArtists: displayData.representedArtists ? (typeof displayData.representedArtists === 'string' ? displayData.representedArtists : JSON.stringify(displayData.representedArtists)) : ''
      };

      console.log('Contract data for transaction:', contractData);

      // Prepare the arguments for the contract call
      const args = [
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

      console.log('Creating identity with args:', args);
      console.log('Using contract address:', contractInfo.identity_contract_address);

      // Send the transaction using the connected wallet
      const hash = await writeContract(config, {
        address: contractInfo.identity_contract_address as Address,
        abi: IDENTITY_ABI,
        functionName: 'createIdentity',
        args,
        chainId: identityData.selectedChain.chain_id as 1 | 11155111 | 10 | 42161 | 8453
      });

      console.log('Transaction sent:', hash);
      transactionHash = hash as string;

      // Wait for the transaction to be mined
      const receipt = await waitForTransaction(config, {
        hash,
        confirmations: 1
      });

      console.log('Transaction confirmed:', receipt);

      // Always get the identity ID by calling getIdentityByAddress
      let onChainIdentityId = 0;

      // Call getIdentityByAddress to get the identity ID
      try {
        console.log('Getting identity ID by calling getIdentityByAddress');
        const onChainIdentityData = await readContract(config, {
          address: contractInfo.identity_contract_address as Address,
          abi: IDENTITY_ABI,
          functionName: 'getIdentityByAddress',
          args: [account.address],
          chainId: identityData.selectedChain.chain_id as 1 | 11155111 | 10 | 42161 | 8453
        });

        if (onChainIdentityData && typeof onChainIdentityData === 'object' && 'id' in onChainIdentityData) {
          onChainIdentityId = Number(onChainIdentityData.id);
          console.log('Retrieved on-chain identity ID from getIdentityByAddress:', onChainIdentityId);
        } else {
          console.error('Failed to get identity ID from getIdentityByAddress, unexpected response format:', onChainIdentityData);
        }
      } catch (error) {
        console.error('Error calling getIdentityByAddress:', error);
      }

      if (!onChainIdentityId) {
        console.error('Failed to retrieve identity ID from blockchain');
      }

      // Create an entry in the database
      const identityTypeEnum = mapIdentityType(identityData?.identityType || 'artist');
      const dbResult = await createIdentityInDatabase(account.address, identityTypeEnum, receipt, onChainIdentityId);

      if (dbResult.success) {
        identityId = dbResult.identityId || 0;
        // Move to the next step
        currentStep = 3;
      } else {
        errorMessage = dbResult.error || 'Failed to create identity in database. Please try again.';
      }
    } catch (error) {
      console.error('Error creating identity:', error);

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
        } else if (errorMsg.length > 300) {
          // If error message is too long, truncate it
          errorMessage = 'Transaction error: ' + errorMsg.substring(0, 300) + '...';
        } else {
          errorMessage = errorMsg;
        }
      } else {
        errorMessage = 'An unknown error occurred while creating your identity. Please try again.';
      }
    } finally {
      isProcessing = false;
    }
  }

  // Function to create an identity entry in the database after the transaction is confirmed
  // Note: We no longer store the transaction hash in the database
  async function createIdentityInDatabase(walletAddress: Address, identityType: number, receipt: any, onChainIdentityId: number) {
    try {
      // Prepare the database data - ensure links and addresses are in the correct format for JSONB
      const dbData = {
        identityType: identityType,
        name: identityData?.username || '',
        description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
        identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
        // Ensure links are objects for the database JSONB column
        links: identityData?.links || [],
        tags: identityData?.tags?.length > 0 ? identityData.tags : [],
        dob: identityData?.dob || 0,
        dod: identityData?.dod || 0,
        location: identityData?.location || '',
        // Ensure addresses are in the correct format for JSONB
        addresses: identityData?.addresses || [],
        representedBy: identityData?.representedBy,
        representedArtists: identityData?.representedArtists
      };

      // Ensure all JSON fields are properly formatted for database
      // If links is a string (JSON), parse it to an object
      if (typeof dbData.links === 'string') {
        try {
          dbData.links = JSON.parse(dbData.links as unknown as string);
        } catch (e) {
          console.error('Error parsing links JSON:', e);
          dbData.links = [];
        }
      }

      // If addresses is a string (JSON), parse it to an object
      if (typeof dbData.addresses === 'string') {
        try {
          dbData.addresses = JSON.parse(dbData.addresses as unknown as string);
        } catch (e) {
          console.error('Error parsing addresses JSON:', e);
          dbData.addresses = [];
        }
      }

      console.log('Database record data:', dbData);

      // Ensure all data is in the correct format before sending to the API
      const apiData = {
        walletAddress,
        identityType: dbData.identityType,
        name: dbData.name,
        chainId: identityData?.selectedChain?.chain_id || 0,
        description: dbData.description,
        identityImage: dbData.identityImage,
        // Send links as JSON objects for JSONB
        links: dbData.links,
        tags: dbData.tags,
        dob: dbData.dob,
        dod: dbData.dod,
        location: dbData.location,
        // Send addresses as JSON objects for JSONB
        addresses: dbData.addresses,
        representedBy: dbData.representedBy,
        representedArtists: dbData.representedArtists,
        // Include the on-chain identity ID
        onChainIdentityId: onChainIdentityId
        // Removed transactionHash as requested
      };

      console.log('Sending data to API:', apiData);

      const response = await fetch('/api/identity/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to create identity in database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating identity in database'
      };
    }
  }

  async function handleComplete() {
    try {
      isProcessing = true;
      errorMessage = '';

      // Setup is already marked as completed in the API endpoint
      console.log('Redirecting to identities dashboard page - setup already completed in database');

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
        <Dialog.Title>Activate Your Identity</Dialog.Title>
        <Dialog.Description>
          Complete these steps to activate your identity on the blockchain.
        </Dialog.Description>
      </Dialog.Header>

      {#if errorMessage}
        <div class="p-4 mb-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg overflow-auto max-h-48">
          <p class="break-words whitespace-normal">{errorMessage}</p>
        </div>
      {/if}

      <!-- Vertical Steps -->
      <div class="flex flex-col space-y-4 py-4">
        <!-- Step indicators -->
        <div class="flex flex-col space-y-6 relative">
          <!-- Vertical line connecting steps -->
          <div class="absolute left-[15px] top-[24px] bottom-[24px] w-0.5 bg-muted-foreground/20 z-0"></div>

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
                  Image uploaded successfully.
                {:else}
                  Waiting to start...
                {/if}
              </p>

              {#if currentStep === 1}
                <div class="mt-2">
                  {#if isProcessing}
                    <div class="flex items-center space-x-2">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span class="text-sm">Uploading...</span>
                    </div>
                  {:else}
                    <Button
                      size="sm"
                      class="mt-2 w-full"
                      on:click={handleUploadToArweave}
                      disabled={isProcessing}
                    >
                      Start Upload
                    </Button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- Step 2: Create Identity -->
          <div class="flex items-start space-x-3">
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
              <h3 class="text-base font-medium">Create Identity</h3>
              <p class="text-sm text-muted-foreground">
                {#if currentStep === 2}
                  Creating your identity on the {identityData?.selectedChain?.name || ''} blockchain.
                {:else if currentStep > 2}
                  Identity created successfully.
                  {#if transactionHash}
                    <br>
                    <a
                      href={`https://${identityData?.selectedChain?.chain_id === 1 ? '' : identityData?.selectedChain?.name?.toLowerCase() + '.'}etherscan.io/tx/${transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      View transaction
                    </a>
                  {/if}
                {:else}
                  Waiting for previous step...
                {/if}
              </p>

              {#if currentStep === 2}
                <div class="mt-2">
                  {#if isProcessing}
                    <div class="flex items-center space-x-2">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span class="text-sm">Creating identity...</span>
                    </div>
                  {:else}
                    <!-- Display contract data for verification -->
                    <div class="mt-2 mb-4 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-md text-xs font-mono overflow-auto max-h-60">
                      <h4 class="text-sm font-medium mb-2">Contract Data Preview:</h4>
                      <div class="mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                        <h5 class="text-xs font-medium mb-1">Database Data (JSONB Format):</h5>
                        <pre class="whitespace-pre-wrap break-all">{JSON.stringify({
                          identityType: mapIdentityType(identityData?.identityType || 'artist'),
                          name: identityData?.username || '',
                          description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
                          identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
                          // Links stored as JSON objects in database (JSONB)
                          links: identityData?.links || [],
                          tags: identityData?.tags?.length > 0 ? identityData.tags : [],
                          dob: identityData?.dob || 0,
                          dod: identityData?.dod || 0,
                          location: identityData?.location || '',
                          // Addresses stored as JSON objects in database (JSONB)
                          addresses: identityData?.addresses || [],
                          representedBy: identityData?.representedBy,
                          representedArtists: identityData?.representedArtists
                        }, null, 2)}</pre>
                      </div>

                      <div>
                        <h5 class="text-xs font-medium mb-1">Contract Data (Blockchain Format):</h5>
                        <pre class="whitespace-pre-wrap break-all">{JSON.stringify({
                          identityType: mapIdentityType(identityData?.identityType || 'artist'),
                          name: identityData?.username || '',
                          description: identityData?.description || `${identityData?.username || ''} on ${identityData?.selectedChain?.name || ''}`,
                          identityImage: arweaveUrl || identityData?.identityImage || 'https://www.artregistryconsortium.com/favicon.jpg',
                          // Links converted to JSON string for contract
                          links: JSON.stringify(identityData?.links || []),
                          tags: identityData?.tags?.length > 0 ? identityData.tags : [],
                          dob: identityData?.dob || 0,
                          dod: identityData?.dod || 0,
                          location: identityData?.location || '',
                          // Addresses as JSON string for contract
                          addresses: JSON.stringify(identityData?.addresses || []),
                          representedBy: identityData?.representedBy ? (typeof identityData.representedBy === 'string' ? identityData.representedBy : JSON.stringify(identityData.representedBy)) : '',
                          representedArtists: identityData?.representedArtists ? (typeof identityData.representedArtists === 'string' ? identityData.representedArtists : JSON.stringify(identityData.representedArtists)) : ''
                        }, null, 2)}</pre>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      class="mt-2 w-full"
                      on:click={handleCreateIdentity}
                      disabled={isProcessing}
                    >
                      Create Identity
                    </Button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

          <!-- Step 3: Completed -->
          <div class="flex items-start space-x-3">
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
              <h3 class="text-base font-medium">Completed</h3>
              <p class="text-sm text-muted-foreground">
                {#if currentStep === 3}
                  Your identity has been created successfully! Your setup is now complete.
                {:else}
                  Waiting for previous steps...
                {/if}
              </p>

              {#if currentStep === 3}
                <div class="mt-2">
                  {#if isProcessing}
                    <div class="flex items-center space-x-2">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      <span class="text-sm">Redirecting to identities dashboard...</span>
                    </div>
                  {:else}
                    <Button
                      size="sm"
                      class="mt-2"
                      on:click={handleComplete}
                      disabled={isProcessing}
                    >
                      Go to Identities Dashboard
                    </Button>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" on:click={handleClose} disabled={isProcessing}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
