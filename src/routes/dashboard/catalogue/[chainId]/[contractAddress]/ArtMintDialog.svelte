<script lang="ts">
  import { onMount } from 'svelte';
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { writeContract, readContract, waitForTransaction, getAccount, switchChain, getChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import type { Address } from 'viem';
  import { uploadImageToArweave } from '$lib/services/arweaveService';

  // Props
  export let open = false;
  export let contractAddress: string;
  export let chainId: number;
  export let artistIdentityId: number;
  export let onSuccess: () => void = () => {};

  // State
  let isProcessing = false;
  let currentStep = 1; // 1: Form, 2: Processing, 3: Success
  let errorMessage = '';
  let transactionHash = '';
  let tokenId: number | null = null;

  // Form data
  let title = '';
  let description = '';
  let yearOfCreation = new Date().getFullYear();
  let medium = '';
  let dimensions = '';
  let edition = '';
  let series = '';
  let catalogueInventory = '';
  let imageFile: File | null = null;
  let imagePreview = '';
  let imageArweaveUrl = '';
  let artistStatement = '';
  let status = 0; // 0: Available, 1: Not Available, 2: Sold
  let royalties = 1000; // 10% in basis points

  // Additional required fields
  let certificationMethod = 'Digital Certificate of Authenticity';

  // Optional fields
  let manualSalesInformation = '';
  let exhibitionHistory = '';
  let conditionReports = '';
  let bibliography = '';
  let keywords: string[] = [];
  let locationCollection = '';
  let note = '';

  // Reset form
  function resetForm() {
    title = '';
    description = '';
    yearOfCreation = new Date().getFullYear();
    medium = '';
    dimensions = '';
    edition = '';
    series = '';
    catalogueInventory = '';
    imageFile = null;
    imagePreview = '';
    imageArweaveUrl = '';
    artistStatement = '';
    status = 0;
    royalties = 1000;

    // Reset additional fields
    certificationMethod = 'Digital Certificate of Authenticity';
    manualSalesInformation = '';
    exhibitionHistory = '';
    conditionReports = '';
    bibliography = '';
    keywords = [];
    locationCollection = '';
    note = '';

    isProcessing = false;
    currentStep = 1;
    errorMessage = '';
    transactionHash = '';
    tokenId = null;
  }

  // Handle image upload
  function handleImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      imageFile = null;
      imagePreview = '';
      return;
    }

    const file = input.files[0];

    // Check file type
    if (!file.type.startsWith('image/')) {
      errorMessage = 'Please upload an image file';
      imageFile = null;
      imagePreview = '';
      return;
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      errorMessage = 'Image file size must be less than 1MB';
      imageFile = null;
      imagePreview = '';
      return;
    }

    imageFile = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Clear any error message
    errorMessage = '';
  }

  // Validate form
  function validateForm() {
    // Check required fields based on smart contract validation
    if (!title.trim()) {
      errorMessage = 'Title is required';
      return false;
    }

    if (!description.trim()) {
      errorMessage = 'Description is required';
      return false;
    }

    if (!yearOfCreation || yearOfCreation <= 0) {
      errorMessage = 'Year of creation must be set';
      return false;
    }

    if (!medium.trim()) {
      errorMessage = 'Medium is required';
      return false;
    }

    if (!dimensions.trim()) {
      errorMessage = 'Dimensions are required';
      return false;
    }

    if (!catalogueInventory.trim()) {
      errorMessage = 'Catalogue inventory is required';
      return false;
    }

    if (!imageFile && !imageArweaveUrl) {
      errorMessage = 'Image is required';
      return false;
    }

    if (!certificationMethod.trim()) {
      errorMessage = 'Certification method is required';
      return false;
    }

    if (!artistStatement.trim()) {
      errorMessage = 'Artist statement is required';
      return false;
    }

    if (royalties > 5000) {
      errorMessage = 'Royalties cannot exceed 50% (5000 basis points)';
      return false;
    }

    return true;
  }

  // Handle mint
  async function handleMint() {
    try {
      if (!validateForm()) {
        return;
      }

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
      if (currentChainId !== chainId) {
        await switchChain(config, { chainId: chainId as any });
      }

      // Step 1: Upload image to Arweave if needed
      let imageUrl = imageArweaveUrl;
      if (imageFile && !imageArweaveUrl) {
        try {
          imageUrl = await uploadImageToArweave(imageFile);
          if (!imageUrl) {
            throw new Error('Failed to upload image to Arweave');
          }
          imageArweaveUrl = imageUrl;
        } catch (error) {
          console.error('Error uploading image to Arweave:', error);
          // Use a fallback image URL if upload fails
          imageUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';
          errorMessage = 'Warning: Failed to upload image. Using fallback image.';
        }
      }

      // Step 2: Prepare metadata
      const metadata = {
        artistIdentityId: BigInt(artistIdentityId),
        title,
        description,
        yearOfCreation: BigInt(yearOfCreation),
        medium,
        dimensions,
        edition,
        series,
        catalogueInventory,
        image: imageUrl,
        manualSalesInformation,
        certificationMethod,
        exhibitionHistory,
        conditionReports,
        artistStatement,
        bibliography,
        keywords,
        locationCollection,
        status: Number(status),
        note,
        royalties: BigInt(royalties)
      } as const;

      console.log('Minting ART with metadata:', metadata);

      // Step 3: Call the mint function on the ART contract
      const result = await writeContract(config, {
        address: contractAddress as Address,
        abi: [
          {
            "inputs": [
              {
                "components": [
                  { "internalType": "uint256", "name": "artistIdentityId", "type": "uint256" },
                  { "internalType": "string", "name": "title", "type": "string" },
                  { "internalType": "string", "name": "description", "type": "string" },
                  { "internalType": "uint256", "name": "yearOfCreation", "type": "uint256" },
                  { "internalType": "string", "name": "medium", "type": "string" },
                  { "internalType": "string", "name": "dimensions", "type": "string" },
                  { "internalType": "string", "name": "edition", "type": "string" },
                  { "internalType": "string", "name": "series", "type": "string" },
                  { "internalType": "string", "name": "catalogueInventory", "type": "string" },
                  { "internalType": "string", "name": "image", "type": "string" },
                  { "internalType": "string", "name": "manualSalesInformation", "type": "string" },
                  { "internalType": "string", "name": "certificationMethod", "type": "string" },
                  { "internalType": "string", "name": "exhibitionHistory", "type": "string" },
                  { "internalType": "string", "name": "conditionReports", "type": "string" },
                  { "internalType": "string", "name": "artistStatement", "type": "string" },
                  { "internalType": "string", "name": "bibliography", "type": "string" },
                  { "internalType": "string[]", "name": "keywords", "type": "string[]" },
                  { "internalType": "string", "name": "locationCollection", "type": "string" },
                  { "internalType": "uint8", "name": "status", "type": "uint8" },
                  { "internalType": "string", "name": "note", "type": "string" },
                  { "internalType": "uint256", "name": "royalties", "type": "uint256" }
                ],
                "internalType": "struct IArtContract.ArtMetadata",
                "name": "metadata",
                "type": "tuple"
              }
            ],
            "name": "mint",
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'mint',
        args: [metadata],
        chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
      });

      console.log('Mint transaction result:', result);

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

      // Wait for the transaction to be mined
      const receipt = await waitForTransaction(config, {
        hash,
        chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
      });

      console.log('Mint transaction receipt:', receipt);

      // Extract the token ID from the transaction receipt by parsing the logs for the ArtMinted event
      // Event signature for ArtMinted event: keccak256("ArtMinted(uint256,uint256,address)")
      const ART_MINTED_EVENT_SIGNATURE = "0x5f7666f775f640ee5a82619ebba5e4a8f9f95f0fbc9f50bbbd3ca3c6fd4520a7";

      // Try to extract token ID from logs
      let extractedTokenId: number | null = null;

      if (receipt && receipt.logs) {
        for (const log of receipt.logs) {
          // Check if this log is from the ArtMinted event
          if (log.topics && log.topics[0] === ART_MINTED_EVENT_SIGNATURE) {
            // The token ID is the first indexed parameter (topics[1])
            if (log.topics[1]) {
              // Convert hex to number
              const hexTokenId = log.topics[1];
              extractedTokenId = parseInt(hexTokenId, 16);
              console.log('Extracted token ID from logs:', extractedTokenId);
              break;
            }
          }
        }
      }

      // If we couldn't extract the token ID from logs, try to get it from the return value
      if (extractedTokenId === null) {
        try {
          // The mint function returns the token ID
          const data = await readContract(config, {
            address: contractAddress as Address,
            abi: [{
              "inputs": [{
                "components": [
                  // ... ArtMetadata components ...
                ],
                "internalType": "struct IArtContract.ArtMetadata",
                "name": "metadata",
                "type": "tuple"
              }],
              "name": "mint",
              "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
              "stateMutability": "nonpayable",
              "type": "function"
            }],
            functionName: 'getArtCount',
            chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
          });

          // The token ID is likely to be (artCount - 1) since we just minted
          if (typeof data === 'bigint') {
            extractedTokenId = Number(data) - 1;
            console.log('Extracted token ID from art count:', extractedTokenId);
          }
        } catch (error) {
          console.error('Error getting art count:', error);
        }
      }

      // If we still couldn't extract the token ID, use a fallback approach
      if (extractedTokenId === null) {
        // Try to get the latest token ID by calling getAllArt and taking the last one
        try {
          const data = await readContract(config, {
            address: contractAddress as Address,
            abi: [{
              "inputs": [],
              "name": "getAllArt",
              "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
              "stateMutability": "view",
              "type": "function"
            }],
            functionName: 'getAllArt',
            chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
          });

          if (Array.isArray(data) && data.length > 0) {
            // Get the last token ID in the array
            extractedTokenId = Number(data[data.length - 1]);
            console.log('Extracted token ID from getAllArt:', extractedTokenId);
          }
        } catch (error) {
          console.error('Error getting all art:', error);
        }
      }

      // If all extraction methods failed, use a fallback value
      tokenId = extractedTokenId !== null ? extractedTokenId : 0;
      console.log('Final token ID:', tokenId);

      // Step 4: Record the token in the database
      const response = await fetch('/api/art/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contractAddress,
          chainId,
          tokenId,
          title,
          description,
          yearOfCreation,
          medium,
          dimensions,
          edition,
          series,
          imageUrl,
          artistStatement,
          status,
          royalties,
          // Additional fields from the form
          catalogueInventory,
          certificationMethod,
          bibliography,
          conditionReports,
          exhibitionHistory,
          keywords,
          locationCollection,
          manualSalesInformation: manualSalesInformation,
          note
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        errorMessage = 'Transaction was successful, but there was an error recording it in the database.';
      }

      // Move to success step
      currentStep = 3;

      // Call the success callback
      onSuccess();
    } catch (error) {
      console.error('Error minting ART:', error);
      errorMessage = error instanceof Error ? error.message : 'Failed to mint ART';
      currentStep = 1; // Go back to the form step
    } finally {
      isProcessing = false;
    }
  }

  function handleClose() {
    if (!isProcessing) {
      // If we're on the success step, don't reset the form immediately
      // so the user can see the success message and transaction details
      if (currentStep === 3) {
        open = false;
        // Only reset the form after the dialog animation completes
        setTimeout(resetForm, 300);
      } else {
        open = false;
        // Reset form when dialog is closed
        setTimeout(resetForm, 300);
      }
    }
  }

  // Reset form when dialog opens
  $: if (open) {
    resetForm();
  }
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
  <Dialog.Content class="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400/50 dark:scrollbar-thumb-neutral-900/90 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50 dark:hover:scrollbar-thumb-neutral-800/90">
    <Dialog.Header class="pb-4">
      <Dialog.Title>Mint New ART</Dialog.Title>
      <Dialog.Description>
        {#if currentStep === 1}
          Add a new artwork to your catalogue raisonné.
        {:else if currentStep === 2}
          Minting your ART token...
        {:else if currentStep === 3}
          ART token minted successfully!
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="p-4 space-y-6">
      {#if currentStep === 1}
        <div class="space-y-8">
          <!-- Image Upload -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Artwork Image <span class="text-red-500">*</span></h3>

            <div class="flex flex-col gap-4">
              {#if imagePreview}
                <div class="relative w-full">
                  <img src={imagePreview} alt="Preview" class="w-full h-full object-contain rounded-md bg-muted/50" />
                </div>
              {/if}
              <div>
                <Button variant="outline" class="relative overflow-hidden" type="button">
                  <input
                    type="file"
                    accept="image/*"
                    on:change={handleImageChange}
                    class="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                <p class="text-xs text-muted-foreground mt-1">Recommended: Square image, 500x500px or larger</p>
              </div>
            </div>
          </div>

          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Basic Information</h3>

            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Title <span class="text-red-500">*</span></div>
                <Input id="title" bind:value={title} placeholder="Enter artwork title" class="text-lg" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Description <span class="text-red-500">*</span></div>
                <Textarea id="description" bind:value={description} placeholder="Enter artwork description" rows={3} />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Year of Creation <span class="text-red-500">*</span></div>
                  <Input id="yearOfCreation" type="number" bind:value={yearOfCreation} min="1" max={new Date().getFullYear()} />
                </div>

                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Medium <span class="text-red-500">*</span></div>
                  <Input id="medium" bind:value={medium} placeholder="e.g., Oil on canvas" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Dimensions <span class="text-red-500">*</span></div>
                  <Input id="dimensions" bind:value={dimensions} placeholder="e.g., 24 x 36 inches" />
                </div>

                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Edition</div>
                  <Input id="edition" bind:value={edition} placeholder="e.g., 1/10" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Series</div>
                  <Input id="series" bind:value={series} placeholder="e.g., Summer Collection" />
                </div>

                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Catalogue Inventory <span class="text-red-500">*</span></div>
                  <Input id="catalogueInventory" bind:value={catalogueInventory} placeholder="e.g., ARC-2023-001" />
                </div>
              </div>
            </div>
          </div>

          <!-- Required Additional Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Required Additional Information</h3>

            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Artist Statement <span class="text-red-500">*</span></div>
                <Textarea id="artistStatement" bind:value={artistStatement} placeholder="Enter artist statement about this artwork" rows={3} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Certification Method <span class="text-red-500">*</span></div>
                <Input id="certificationMethod" bind:value={certificationMethod} placeholder="e.g., Digital Certificate of Authenticity" />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Status</div>
                  <select
                    id="status"
                    bind:value={status}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={0}>Available</option>
                    <option value={1}>Not Available</option>
                    <option value={2}>Sold</option>
                  </select>
                </div>

                <div class="space-y-2">
                  <div class="font-medium text-sm mb-1.5">Royalties (%)</div>
                  <Input
                    id="royalties"
                    type="number"
                    bind:value={royalties}
                    min="0"
                    max="5000"
                    step="100"
                    on:input={(e) => {
                      const value = parseInt(e.currentTarget.value);
                      if (value > 5000) royalties = 5000;
                      if (value < 0) royalties = 0;
                    }}
                  />
                  <p class="text-xs text-muted-foreground">Value in basis points (e.g., 1000 = 10%)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Optional Additional Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Optional Additional Information</h3>

            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Exhibition History</div>
                <Textarea id="exhibitionHistory" bind:value={exhibitionHistory} placeholder="Enter exhibition history" rows={2} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Condition Reports</div>
                <Textarea id="conditionReports" bind:value={conditionReports} placeholder="Enter condition reports" rows={2} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Bibliography</div>
                <Textarea id="bibliography" bind:value={bibliography} placeholder="Enter bibliography information" rows={2} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Manual Sales Information</div>
                <Textarea id="manualSalesInformation" bind:value={manualSalesInformation} placeholder="Enter sales information" rows={2} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Location/Collection</div>
                <Input id="locationCollection" bind:value={locationCollection} placeholder="e.g., Private Collection, New York" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Notes</div>
                <Textarea id="note" bind:value={note} placeholder="Enter any additional notes" rows={2} />
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
          <p class="mt-4 text-sm text-muted-foreground">Minting your ART token. Please wait...</p>
          <p class="mt-2 text-xs text-muted-foreground">This may take a few minutes.</p>
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
                Your transaction was sent, but there may have been an issue with recording it in the database.
              {:else}
                Your ART token has been minted successfully.
              {/if}
            </p>
          </div>

          <div class="grid gap-6 p-4 border rounded-lg bg-muted/50">
            <div>
              <p class="text-sm font-medium mb-1.5">Transaction Details</p>
              <div class="grid gap-4">
                {#if tokenId !== null}
                  <div>
                    <p class="text-sm text-muted-foreground mb-1">Token ID</p>
                    <p class="text-sm font-mono bg-muted p-2 rounded break-all">#{tokenId}</p>
                  </div>
                {/if}
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

    <div class="flex justify-end gap-3 pt-4 border-t">
      {#if currentStep === 1}
        <Button variant="outline" on:click={handleClose} disabled={isProcessing}>Cancel</Button>
        <Button on:click={handleMint} disabled={isProcessing}>Mint ART</Button>
      {:else if currentStep === 2}
        <Button variant="outline" on:click={handleClose} disabled={true}>Cancel</Button>
        <Button disabled={true}>Minting...</Button>
      {:else}
        <Button on:click={handleClose}>Close</Button>
        <Button variant="default" on:click={() => {
          // Reset form and go back to step 1 to mint another token
          resetForm();
          currentStep = 1;
        }}>Mint Another</Button>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>

<style>
  /* Custom scrollbar styling to match the view identity dialog */
  :global(.dark .scrollbar-thin::-webkit-scrollbar) {
    width: 9px;
  }

  :global(.dark .scrollbar-thin::-webkit-scrollbar-track) {
    background: transparent;
  }

  :global(.dark .scrollbar-thin::-webkit-scrollbar-thumb) {
    background-color: rgba(32, 32, 34, 0.65); /* Dark gray with minimal blue tint */
    border-radius: 4px;
  }

  :global(.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover) {
    background-color: rgba(45, 45, 48, 0.75); /* Slightly lighter with minimal blue tint on hover */
  }
</style>


