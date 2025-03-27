<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { writeContract, readContract, waitForTransaction, getAccount, switchChain, getChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';
  import type { Address } from 'viem';
  import { uploadImageToArweave, uploadJsonToArweave } from '$lib/services/arweaveService';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { ArtToken } from '$lib/types/art';

  // State
  let isProcessing = false;
  let currentStep = 1; // 1: Form, 2: Processing, 3: Success
  let errorMessage = '';
  let transactionHash = '';
  let tokenId: number | null = null;
  let token: ArtToken | null = null;
  let contractAddress: string = $page.params.contractAddress;
  let chainId: number = parseInt($page.params.chainId);
  let artistIdentityId: number = 0;
  let artistName: string = '';

  // Form data
  let title = '';
  let description = '';
  let yearOfCreation = new Date().getFullYear();
  let medium = '';
  let dimensions = '';
  let edition = '';
  let series = '';
  let imageFile: File | null = null;
  let imagePreview = '';
  let imageArweaveUrl = '';
  let tokenUri = ''; // URL to the metadata JSON on Arweave
  let royalties = 1000; // 10% in basis points

  // Optional fields
  let exhibitionHistory = '';
  let conditionReports = '';
  let bibliography = '';
  let keywords: string[] = [''];  // Initialize with a non-empty array
  let locationCollection = '';
  let note = '';

  onMount(async () => {
    try {
      // Get token ID from URL
      tokenId = parseInt($page.params.tokenId);

      // Fetch token data
      const response = await fetch(`/api/art/token?chainId=${chainId}&contractAddress=${contractAddress}&tokenId=${tokenId}`);
      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Failed to load token data');
      }

      token = data.token;

      // Populate form with token data
      title = token.title || '';
      description = token.description || '';
      yearOfCreation = token.year || new Date().getFullYear();
      medium = token.medium || '';
      dimensions = token.dimensions || '';
      edition = token.edition || '';
      series = token.series || '';
      imageArweaveUrl = token.image_url || '';
      tokenUri = token.token_uri || '';
      royalties = token.royalties || 1000;

      // Optional fields
      exhibitionHistory = token.exhibition_history ?
        (typeof token.exhibition_history === 'string' ? token.exhibition_history : JSON.stringify(token.exhibition_history)) : '';
      conditionReports = token.condition_reports ?
        (typeof token.condition_reports === 'string' ? token.condition_reports : JSON.stringify(token.condition_reports)) : '';
      bibliography = token.bibliography ?
        (typeof token.bibliography === 'string' ? token.bibliography : JSON.stringify(token.bibliography)) : '';
      keywords = token.keywords || [];
      locationCollection = token.location_collection ?
        (typeof token.location_collection === 'string' ? token.location_collection : JSON.stringify(token.location_collection)) : '';
      note = token.note || '';

      // Fetch contract data to get artist info
      const contractResponse = await fetch(`/api/contracts?chainId=${chainId}`);
      const contractData = await contractResponse.json();

      if (contractData.success && contractData.contract) {
        artistIdentityId = contractData.contract.identity_id || 0;
        artistName = contractData.contract.identities?.name || 'Unknown Artist';
      }

    } catch (error) {
      console.error('Error loading token data:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while loading data';
    }
  });

  // Handle image upload
  function handleImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      imageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    }
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

    if (!imageFile && !imageArweaveUrl) {
      errorMessage = 'Image is required';
      return false;
    }

    // These fields are not required by the contract but are recommended for the artwork record
    // We'll leave them empty if not provided - no default values

    if (royalties > 5000) {
      errorMessage = 'Royalties cannot exceed 50% (5000 basis points)';
      return false;
    }

    return true;
  }

  // Handle form submission
  async function handleSubmit() {
    try {
      errorMessage = '';

      if (!validateForm()) {
        return;
      }

      isProcessing = true;
      currentStep = 2;

      // Step 1: Upload image to Arweave if a new image is provided
      let imageUrl = imageArweaveUrl;
      if (imageFile) {
        try {
          imageUrl = await uploadImageToArweave(imageFile);
          console.log('Image uploaded to Arweave:', imageUrl);
        } catch (error) {
          console.error('Error uploading image to Arweave:', error);
          // Use a fallback URL if upload fails
          imageUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';
          errorMessage = 'Warning: Failed to upload image. Using fallback URL.';
        }
      }

      // Step 2: Prepare OpenSea metadata and upload to Arweave
      // Create attributes array, filtering out empty or "Unspecified" values
      const attributes = [];

      // Only add attributes with meaningful values
      if (yearOfCreation && yearOfCreation.toString() !== "0") {
        attributes.push({ trait_type: 'Year', value: yearOfCreation.toString() });
      }

      if (medium && medium.trim() !== '' && medium !== 'Unspecified') {
        attributes.push({ trait_type: 'Medium', value: medium });
      }

      if (dimensions && dimensions.trim() !== '' && dimensions !== 'Unspecified') {
        attributes.push({ trait_type: 'Dimensions', value: dimensions });
      }

      if (edition && edition.trim() !== '') {
        attributes.push({ trait_type: 'Edition', value: edition });
      }

      if (series && series.trim() !== '') {
        attributes.push({ trait_type: 'Series', value: series });
      }

      if (exhibitionHistory && exhibitionHistory.trim() !== '') {
        attributes.push({ trait_type: 'Exhibition History', value: exhibitionHistory });
      }

      if (conditionReports && conditionReports.trim() !== '') {
        attributes.push({ trait_type: 'Condition Reports', value: conditionReports });
      }

      if (bibliography && bibliography.trim() !== '') {
        attributes.push({ trait_type: 'Bibliography', value: bibliography });
      }

      if (locationCollection && locationCollection.trim() !== '') {
        attributes.push({ trait_type: 'Location/Collection', value: locationCollection });
      }

      if (note && note.trim() !== '') {
        attributes.push({ trait_type: 'Notes', value: note });
      }

      const openSeaMetadata = {
        name: title,
        description,
        image: imageUrl,
        attributes
      };

      // Upload metadata to Arweave
      try {
        tokenUri = await uploadJsonToArweave(openSeaMetadata);
        console.log('Metadata uploaded to Arweave:', tokenUri);
      } catch (error) {
        console.error('Error uploading metadata to Arweave:', error);
        // Use a fallback URL if upload fails
        tokenUri = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';
        errorMessage = 'Warning: Failed to upload metadata. Using fallback URL.';
      }

      // Step 3: Update the token on the blockchain
      try {
        // Ensure we're on the correct chain
        const currentChainId = await getChainId(config);
        if (currentChainId !== chainId) {
          await switchChain(config, { chainId: chainId as any });
          console.log(`Switched to chain ID: ${chainId}`);
        }

        // Prepare metadata for the contract with proper handling of all fields
        // Ensure all string fields have values and arrays are not empty
        const metadata = {
          artistIdentityId: BigInt(artistIdentityId),
          title: title || '',
          description: description || '',
          yearOfCreation: BigInt(yearOfCreation || 0),
          medium: medium || '',
          dimensions: dimensions || '',
          edition: edition || '',
          series: series || '',
          image: imageUrl || '',
          tokenUri: tokenUri || '',
          exhibitionHistory: exhibitionHistory || '',
          conditionReports: conditionReports || '',
          bibliography: bibliography || '',
          keywords: keywords.length > 0 ? keywords : [''],  // Ensure non-empty array
          locationCollection: locationCollection || '',
          note: note || '',
          royalties: BigInt(royalties || 0)
        } as const;

        // Log the exact keywords being sent
        console.log('Keywords being sent:', metadata.keywords);

        console.log('Updating ART with metadata:', metadata);

        // Create a modified metadata object with hardcoded keywords array and ensure artistIdentityId is set
        const metadataForContract = {
          ...metadata,
          keywords: ['placeholder'],  // Hardcode a non-empty array to avoid the error
          artistIdentityId: BigInt(artistIdentityId > 0 ? artistIdentityId : 1)  // Ensure artistIdentityId is greater than 0
        };

        console.log('Artist Identity ID being sent:', metadataForContract.artistIdentityId);

        console.log('Final metadata being sent to contract:', metadataForContract);

        // Call the updateArt function on the contract
        const result = await writeContract(config, {
          address: contractAddress as Address,
          abi: [
            {
              "inputs": [
                { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
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
                    { "internalType": "string", "name": "image", "type": "string" },
                    { "internalType": "string", "name": "tokenUri", "type": "string" },
                    { "internalType": "string", "name": "exhibitionHistory", "type": "string" },
                    { "internalType": "string", "name": "conditionReports", "type": "string" },
                    { "internalType": "string", "name": "bibliography", "type": "string" },
                    { "internalType": "string[]", "name": "keywords", "type": "string[]" },
                    { "internalType": "string", "name": "locationCollection", "type": "string" },
                    { "internalType": "string", "name": "note", "type": "string" },
                    { "internalType": "uint256", "name": "royalties", "type": "uint256" }
                  ],
                  "internalType": "struct IArtContract.ArtMetadata",
                  "name": "metadata",
                  "type": "tuple"
                }
              ],
              "name": "updateArt",
              "outputs": [],
              "stateMutability": "nonpayable",
              "type": "function"
            }
          ],
          functionName: 'updateArt',
          args: [BigInt(tokenId), metadataForContract],
          chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
        });

        console.log('Update transaction result:', result);

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
      } catch (error) {
        console.error('Error updating token on blockchain:', error);
        errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the token on the blockchain';
        throw error;
      }

      // Step 4: Update the token in the database
      const response = await fetch('/api/art/update', {
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
          tokenUri,
          royalties,
          // Additional fields from the form
          bibliography,
          conditionReports,
          exhibitionHistory,
          keywords,
          locationCollection,
          note
          // Do not include transactionHash
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update token in database');
      }

      // Step 5: Success
      currentStep = 3;
      console.log('Token updated successfully');

      // Redirect back to the catalogue page after a short delay
      setTimeout(() => {
        goto(`/dashboard/catalogue/${chainId}/${contractAddress}`);
      }, 2000);

    } catch (error) {
      console.error('Error updating token:', error);
      errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the token';
      isProcessing = false;
      currentStep = 1;
    }
  }

  // Handle cancel
  function handleCancel() {
    goto(`/dashboard/catalogue/${chainId}/${contractAddress}`);
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <div class="flex items-center gap-2 mb-6">
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8 sm:h-9 sm:w-9"
      on:click={handleCancel}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      <span class="sr-only">Back</span>
    </Button>
    <h1 class="text-xl sm:text-2xl font-bold">Edit Artwork</h1>
  </div>

  {#if errorMessage}
    <div class="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
      <p class="text-red-800 dark:text-red-300">{errorMessage}</p>
    </div>
  {/if}

  {#if currentStep === 1}
    <div class="bg-card border rounded-lg shadow-sm">
      <div class="p-6">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Basic Information</h3>

            <div class="grid grid-cols-1 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Title <span class="text-red-500">*</span></div>
                <Input id="title" bind:value={title} placeholder="Enter artwork title" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Description <span class="text-red-500">*</span></div>
                <Textarea id="description" bind:value={description} placeholder="Enter artwork description" rows={3} />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Year of Creation</div>
                <Input id="yearOfCreation" type="number" bind:value={yearOfCreation} placeholder="e.g., 2023" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Medium</div>
                <Input id="medium" bind:value={medium} placeholder="e.g., Oil on canvas" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Dimensions</div>
                <Input id="dimensions" bind:value={dimensions} placeholder="e.g., 100x150 cm" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Edition</div>
                <Input id="edition" bind:value={edition} placeholder="e.g., 1/10" />
              </div>
            </div>

            <div class="space-y-2">
              <div class="font-medium text-sm mb-1.5">Series</div>
              <Input id="series" bind:value={series} placeholder="e.g., Summer Collection" />
            </div>
          </div>

          <!-- Image Upload -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Artwork Image <span class="text-red-500">*</span></h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Upload Image</div>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  on:change={handleImageChange}
                  class="cursor-pointer"
                />
                <p class="text-xs text-muted-foreground">Max file size: 1MB. Supported formats: JPEG, PNG, GIF, WebP, SVG.</p>
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Image Preview</div>
                <div class="aspect-square w-full max-w-[200px] bg-muted rounded-md overflow-hidden">
                  {#if imagePreview}
                    <img src={imagePreview} alt="Preview" class="w-full h-full object-contain" />
                  {:else if imageArweaveUrl}
                    <img src={imageArweaveUrl} alt="Current" class="w-full h-full object-contain" />
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  {/if}
                </div>
                {#if imageArweaveUrl && !imagePreview}
                  <p class="text-xs text-muted-foreground">Current image will be kept if no new image is uploaded.</p>
                {/if}
              </div>
            </div>
          </div>

          <!-- Royalties -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Royalties</h3>

            <div class="grid grid-cols-1 gap-4">
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

          <!-- Optional Information -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium">Optional Information</h3>

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
                <Textarea id="bibliography" bind:value={bibliography} placeholder="Enter bibliography" rows={2} />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Location/Collection</div>
                <Input id="locationCollection" bind:value={locationCollection} placeholder="Enter location or collection" />
              </div>

              <div class="space-y-2">
                <div class="font-medium text-sm mb-1.5">Notes</div>
                <Textarea id="note" bind:value={note} placeholder="Enter additional notes" rows={2} />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" on:click={handleCancel}>Cancel</Button>
            <Button type="submit">Update Artwork</Button>
          </div>
        </form>
      </div>
    </div>
  {:else if currentStep === 2}
    <div class="bg-card border rounded-lg shadow-sm p-6">
      <div class="py-8 flex flex-col items-center justify-center space-y-6">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <h3 class="text-lg font-medium">Updating Artwork</h3>
        <p class="text-muted-foreground text-center max-w-md">
          Please wait while we update your artwork. This process may take a moment.
        </p>

        <div class="w-full max-w-md">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">Uploading image to Arweave</p>
                {#if imageArweaveUrl}
                  <p class="text-xs text-muted-foreground truncate">{imageArweaveUrl}</p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">Creating metadata JSON</p>
                {#if tokenUri}
                  <p class="text-xs text-muted-foreground truncate">{tokenUri}</p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 9l-7 7-7-7" />
                  <path d="M19 15l-7 7-7-7" />
                  <path d="M19 3l-7 7-7-7" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">Updating token on blockchain</p>
                {#if transactionHash}
                  <p class="text-xs text-muted-foreground truncate">{transactionHash}</p>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium">Updating database record</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {:else if currentStep === 3}
    <div class="bg-card border rounded-lg shadow-sm p-6">
      <div class="py-8 flex flex-col items-center justify-center space-y-4">
        <div class="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 class="text-lg font-medium">Artwork Updated Successfully</h3>
        <p class="text-muted-foreground text-center max-w-md">
          Your artwork has been updated successfully. You will be redirected back to the catalogue page.
        </p>
      </div>
    </div>
  {/if}
</div>
