<script lang="ts">
console.log('Create Identity page component loaded');
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { getWalletAddress } from '$lib/stores/walletAuth';
import { identityStore, type IdentityInfo } from '$lib/stores/identityStore';
import { onMount, onDestroy } from 'svelte';
import type { Address } from 'viem';
import ActivationDialog from '$lib/components/ActivationDialog.svelte';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { Label } from "$lib/components/ui/label/index.js";
import { Textarea } from "$lib/components/ui/textarea/index.js";
import { Badge } from "$lib/components/ui/badge/index.js";
import { Alert, AlertDescription } from "$lib/components/ui/alert/index.js";
import type { Chain } from '$lib/services/activationService';
import { hasIdentityOnChain } from '$lib/services/userIdentityService';
import { switchChain } from 'wagmi/actions';
import { config } from '$lib/web3/config';

// Identity type definitions
const identityTypes = [
    { id: 'artist', name: 'Artist', description: 'For individual artists and creators' },
    { id: 'gallery', name: 'Gallery', description: 'For art galleries and exhibition spaces' },
    { id: 'institution', name: 'Institution', description: 'For museums and cultural institutions' },
    { id: 'collector', name: 'Collector', description: 'For art collectors and enthusiasts' },
    { id: 'custodian', name: 'Custodian', description: 'For custodians and caretakers of art collections' }
];

// Identity data fields
let selectedType: string | null = null;
let username = '';
let description = '';
let identityImage = '';
let links: { name: string; url: string }[] = [];
let tags: string[] = [];
let dob = '';
let location = '';
let addresses: string[] = [];
let availableChains: Chain[] = [];
let selectedChainId: number | null = null;
let selectedChain: Chain | null = null;

// Form state
let isValid = false;
let isLoading = true;
let errorMessage = '';
let imagePreview = '';
let dialogOpen = false;
let identityData: IdentityInfo | null = null;
let unsubscribeStore: (() => void) | undefined;

// Chain identity status
let chainIdentityStatus: Record<number, boolean> = {};
let walletAddress: Address | null = null;

// Force reactivity for validation state
function updateValidState(newState: boolean) {
    isValid = newState;
    console.log('Validation state updated:', isValid);
}

// Subscribe to the identity store
onMount(async () => {
    try {
        console.log('Create Identity page onMount started');

        // Get wallet address
        walletAddress = getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not found');
        }

        // Reset the identity store
        console.log('Resetting identity store...');
        identityStore.reset();

        // Subscribe to the identity store
        console.log('Setting up identity store subscription...');
        unsubscribeStore = identityStore.subscribe(state => {
            identityData = state;
            console.log('Identity store state updated:', state);
        });

        // Load available chains
        console.log('Starting to load available chains...');
        await loadAvailableChains();
        console.log('Available chains loaded successfully');

        // Check which chains the user already has identities on
        await checkExistingIdentities();

        // Run initial validation
        setTimeout(() => {
            validateForm();
            console.log('Initial validation completed');
        }, 500);
    } catch (error) {
        console.error('Error in onMount:', error);
        errorMessage = error instanceof Error ? error.message : 'An error occurred while loading the page';
    } finally {
        // Always set isLoading to false, even if there's an error
        console.log('Setting isLoading to false in finally block');
        isLoading = false;
        console.log('onMount completed, isLoading set to false');
    }
});

onDestroy(() => {
    if (unsubscribeStore) unsubscribeStore();
});

// Function to load available chains
async function loadAvailableChains() {
    try {
        console.log('loadAvailableChains: Starting to fetch chains...');
        const response = await fetch('/api/chains');
        console.log('loadAvailableChains: API response received:', response.status);

        if (!response.ok) {
            console.error('loadAvailableChains: API error:', response.status, response.statusText);
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('loadAvailableChains: API response data:', data);

        if (data.success) {
            availableChains = data.chains || [];
            console.log('loadAvailableChains: Available chains set:', availableChains);

            // Don't select a chain by default here - we'll do it after checking existing identities
            if (availableChains.length === 0) {
                console.warn('loadAvailableChains: No chains available from API');
                errorMessage = 'No blockchain networks are available. Please try again later.';
            }
        } else {
            console.error('loadAvailableChains: API returned error:', data.error);
            errorMessage = data.error || 'Failed to load chains';
        }
    } catch (error) {
        console.error('loadAvailableChains: Error fetching chains:', error);
        errorMessage = error instanceof Error ? error.message : 'Failed to load chains';
    }
}

// Function to handle identity type selection
function handleTypeSelect(type: string) {
    selectedType = type;
    console.log('Type selected:', type);

    // Force validation after type selection
    setTimeout(() => {
        validateForm();
    }, 0);
}

// Function to handle chain selection
async function handleChainSelect(chainId: number) {
    try {
        // Check if user already has an identity on this chain
        if (chainIdentityStatus[chainId]) {
            console.log('User already has an identity on chain:', chainId);
            return; // Don't allow selection
        }

        // Find the selected chain
        const chain = availableChains.find(c => c.chain_id === chainId);
        if (!chain) {
            console.error('Chain not found:', chainId);
            return;
        }

        // Switch to the selected chain
        console.log('Switching to chain:', chain.name);
        await switchChain(config, {
            chainId: chainId as any
        });

        // Update the selected chain
        selectedChainId = chainId;
        selectedChain = chain;
        console.log('Chain selected:', { chainId, selectedChain });

        // Force validation after chain selection
        setTimeout(() => {
            validateForm();
        }, 0);
    } catch (error) {
        console.error('Error switching chain:', error);
        errorMessage = 'Failed to switch to the selected chain. Please try again.';
    }
}

// Function to check which chains the user already has identities on
async function checkExistingIdentities() {
    if (!walletAddress) return;

    try {
        console.log('Checking existing identities for wallet:', walletAddress);

        // Check each available chain
        for (const chain of availableChains) {
            const status = await hasIdentityOnChain(walletAddress, chain.chain_id);
            chainIdentityStatus[chain.chain_id] = status.hasIdentity;
            console.log(`Chain ${chain.name} (${chain.chain_id}) identity status:`, status.hasIdentity);
        }

        console.log('Chain identity status map:', chainIdentityStatus);
    } catch (error) {
        console.error('Error checking existing identities:', error);
    }
}

// Function to select the first available chain that doesn't have an identity
function selectFirstAvailableChain() {
    console.log('Selecting first available chain without existing identity');

    // Reset current selection
    selectedChainId = null;
    selectedChain = null;

    // Find the first chain that doesn't have an identity
    const availableChain = availableChains.find(chain => !chainIdentityStatus[chain.chain_id]);

    if (availableChain) {
        selectedChainId = availableChain.chain_id;
        selectedChain = availableChain;
        console.log('Selected first available chain:', selectedChain);
    } else {
        console.log('No available chains without existing identities found');
    }
}

// Function to handle image upload
function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const result = e.target?.result as string;
            imagePreview = result;
            identityImage = result;
            console.log('Image uploaded successfully');
            // Force validation after image is loaded
            setTimeout(() => {
                validateForm();
            }, 100);
        };

        reader.readAsDataURL(file);
    } else {
        console.log('No file selected or file selection canceled');
    }
}

// Function to remove image
function removeImage() {
    imagePreview = '';
    identityImage = '';
    console.log('Image removed');
    validateForm();
}

// Function to add a new link field
function addLink() {
    links = [...links, { name: '', url: '' }];
}

// Function to remove a link field
function removeLink(index: number) {
    links = links.filter((_, i) => i !== index);
    validateForm();
}

// Function to update a link field
function updateLink(index: number, field: 'name' | 'url', value: string) {
    links = links.map((link, i) => {
        if (i === index) {
            return { ...link, [field]: value };
        }
        return link;
    });
    validateForm();
}

// Function to add a new tag field
function addTag() {
    tags = [...tags, ''];
}

// Function to remove a tag field
function removeTag(index: number) {
    tags = tags.filter((_, i) => i !== index);
    validateForm();
}

// Function to update a tag field
function updateTag(index: number, value: string) {
    tags = tags.map((tag, i) => i === index ? value : tag);
    validateForm();
}

// Function to add a new address field
function addAddress() {
    addresses = [...addresses, ''];
}

// Function to remove an address field
function removeAddress(index: number) {
    addresses = addresses.filter((_, i) => i !== index);

    // If all addresses are removed, keep the array empty
    if (addresses.length === 0) {
        addresses = [];
    }

    validateForm();
}

// Function to update an address field
function updateAddress(index: number, value: string) {
    addresses = addresses.map((address, i) => i === index ? value : address);
    validateForm();
}

// Function to handle username input
function handleUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
    console.log('Username changed:', username);
    validateForm();
}

// Function to handle description input
function handleDescriptionInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    description = input.value;
    console.log('Description changed:', description);
    validateForm();
}

// Function to validate username
function validateUsername(value: string): boolean {
    const trimmedValue = value.trim();
    const isValid = trimmedValue.length >= 1 && trimmedValue.length <= 50;
    console.log('Username validation:', {
        value,
        trimmedLength: trimmedValue.length,
        isValid
    });
    return isValid;
}

// Function to validate description
function validateDescription(value: string): boolean {
    const trimmedValue = value.trim();
    const isValid = trimmedValue.length > 0;
    console.log('Description validation:', {
        value,
        trimmedLength: trimmedValue.length,
        isValid
    });
    return isValid;
}

// Function to validate the form
function validateForm(): boolean {
    // Log all current values
    console.log('Form validation - Current values:', {
        selectedType,
        username,
        description,
        imagePreview: !!imagePreview,
        identityImage: !!identityImage,
        selectedChainId,
        selectedChain
    });

    // Basic validation for required fields only
    const isTypeValid = !!selectedType;
    const isUsernameValid = validateUsername(username);
    const isDescriptionValid = validateDescription(description);

    // Image is required - consider valid if either imagePreview or identityImage is set
    // This allows for both uploaded images and URLs
    const isImageValid = !!imagePreview || !!identityImage;

    // Check if any chain is available and selected
    const isChainValid = !!selectedChainId && !!selectedChain;

    // Check if there are any available chains that don't already have identities
    const hasAvailableChains = availableChains.some(chain => !chainIdentityStatus[chain.chain_id]);

    // Log individual validation results
    console.log('Form validation - Individual checks:', {
        isTypeValid,
        isUsernameValid,
        isDescriptionValid,
        isImageValid,
        isChainValid,
        hasAvailableChains,
        usernameLength: username.trim().length,
        descriptionLength: description.trim().length
    });

    // Update the validation state - only check required fields
    // Also ensure there are available chains to select from
    const newIsValid = isTypeValid && isUsernameValid && isDescriptionValid && isImageValid && isChainValid && hasAvailableChains;

    // If there are no available chains without identities, show an error message
    if (!hasAvailableChains && availableChains.length > 0) {
        errorMessage = 'You already have identities on all available chains. You can only have one identity per blockchain network.';
    } else {
        errorMessage = '';
    }
    console.log('Form validation - Final result:', newIsValid);

    // Force reactivity by creating a new boolean
    isValid = newIsValid;
    return newIsValid;
}

// Function to handle form submission
async function handleSubmit() {
    if (validateForm()) {
        // Store all the data in the store
        identityStore.setIdentityType(selectedType as 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian');
        identityStore.setUsername(username);
        identityStore.setDescription(description);
        identityStore.setIdentityImage(identityImage);
        identityStore.setLinks(links.filter(link => link.url.trim().length > 0));
        identityStore.setTags(tags.filter(tag => tag.trim().length > 0));

        // Store type-specific data
        if (selectedType === 'artist') {
            identityStore.setDob(dateToTimestamp(dob));
            identityStore.setLocation(location);
        } else if (selectedType === 'gallery' || selectedType === 'institution') {
            identityStore.setAddresses(addresses.filter(addr => addr.trim().length > 0));
        }

        // Store the selected chain
        if (selectedChain) {
            identityStore.setSelectedChain(selectedChain);
        }

        // Open the activation dialog
        dialogOpen = true;
    }
}

// Function to convert date string to timestamp
function dateToTimestamp(dateStr: string): number {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    return Math.floor(date.getTime() / 1000);
}

// Function to format timestamp to date string
function timestampToDate(timestamp: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toISOString().split('T')[0];
}
</script>

<div class="md:min-h-screen">
    <div class="container py-4 sm:py-8 px-4 sm:px-6 max-w-4xl mx-auto">
        <div class="space-y-8">
            <!-- Header with back button and title -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex items-center gap-2 mb-7">
                    <Button
                        variant="outline"
                        size="icon"
                        class="h-8 w-8 sm:h-9 sm:w-9"
                        on:click={() => goto('/dashboard/identities')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        <span class="sr-only">Back</span>
                    </Button>
                    <h1 class="text-xl sm:text-2xl font-bold">Create Identity</h1>
                </div>
            </div>
        </div>

        {#if errorMessage}
            <div class="p-4 mb-6 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                <p>{errorMessage}</p>
            </div>
        {/if}

        {#if isLoading}
            <div class="flex flex-col justify-center items-center py-12 gap-4">
                <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                <p class="text-sm text-muted-foreground">Loading page content...</p>
            </div>
        {:else}
            <div class="bg-card rounded-lg border border-border p-4 sm:p-6 mb-6 sm:mb-8 space-y-6 sm:space-y-8">
                <!-- Identity Type Section -->
                <div>
                    <h2 class="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Choose Identity Type</h2>
                    <p class="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Select the type of identity you want to create</p>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {#each identityTypes as type}
                            <button
                                class="p-3 sm:p-4 rounded-lg border-2 transition-all flex flex-col items-start text-left touch-target
                                    {selectedType === type.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
                                on:click={() => handleTypeSelect(type.id)}
                            >
                                <span class="text-base sm:text-lg font-medium mb-1">{type.name}</span>
                                <span class="text-xs sm:text-sm text-muted-foreground">{type.description}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Basic Information Section -->
                <div>
                    <h2 class="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Basic Information</h2>
                    <p class="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Enter the basic details for your identity</p>

                    <div class="space-y-6">
                        <!-- Name Field -->
                        <div>
                            <Label for="username">Name <span class="text-red-500">*</span></Label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                on:input={handleUsernameInput}
                                placeholder="Enter name"
                                class="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            {#if username && !validateUsername(username)}
                                <p class="text-sm text-red-500 mt-1">Name must be between 1 and 50 characters</p>
                            {/if}
                        </div>

                        <!-- Description Field -->
                        <div>
                            <Label for="description">Description <span class="text-red-500">*</span></Label>
                            <textarea
                                id="description"
                                value={description}
                                on:input={handleDescriptionInput}
                                placeholder="Enter description"
                                class="mt-1 flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <!-- Image Upload -->
                        <div>
                            <Label>Profile Image <span class="text-red-500">*</span></Label>
                            <div class="mt-1 flex items-center gap-4">
                                {#if imagePreview}
                                    <div class="relative">
                                        <img src={imagePreview} alt="Preview" class="w-24 h-24 object-cover rounded-md" />
                                    </div>
                                {/if}
                                <div>
                                    <Button variant="outline" class="relative overflow-hidden" type="button">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            on:change={handleImageUpload}
                                            class="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        {imagePreview ? 'Change Image' : 'Upload Image'}
                                    </Button>
                                    <p class="text-xs text-muted-foreground mt-1">Recommended: Square image, 500x500px or larger</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Additional Details Section -->
                <div>
                    <h2 class="text-xl font-semibold mb-4">Additional Details</h2>
                    <p class="text-muted-foreground mb-6">Add more information to your identity profile</p>

                    <div class="space-y-6">
                        <!-- Links Section -->
                        <div>
                            <Label>Links <span class="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                            <div class="space-y-3 mt-2">
                                {#if links.length > 0}
                                    {#each links as link, i}
                                        <div class="flex gap-2">
                                            <Input
                                                placeholder="Platform (e.g., Instagram)"
                                                value={link.name}
                                                on:input={(e) => updateLink(i, 'name', (e.target as HTMLInputElement).value)}
                                                class="flex-1"
                                            />
                                            <Input
                                                placeholder="URL"
                                                value={link.url}
                                                on:input={(e) => updateLink(i, 'url', (e.target as HTMLInputElement).value)}
                                                class="flex-1"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                on:click={() => removeLink(i)}
                                                class="shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                </svg>
                                            </Button>
                                        </div>
                                    {/each}
                                {:else}
                                    <div class="text-sm text-muted-foreground mb-2">No links added yet</div>
                                {/if}
                                <Button variant="outline" size="sm" on:click={addLink} class="mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                    </svg>
                                    Add Link
                                </Button>
                            </div>
                        </div>

                        <!-- Tags Section -->
                        <div>
                            <Label>Tags <span class="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                            <div class="space-y-3 mt-2">
                                {#if tags.length > 0}
                                    {#each tags as tag, i}
                                        <div class="flex gap-2">
                                            <Input
                                                placeholder="Tag (e.g., Contemporary Art)"
                                                value={tag}
                                                on:input={(e) => updateTag(i, (e.target as HTMLInputElement).value)}
                                                class="flex-1"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                on:click={() => removeTag(i)}
                                                class="shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                </svg>
                                            </Button>
                                        </div>
                                    {/each}
                                {:else}
                                    <div class="text-sm text-muted-foreground mb-2">No tags added yet</div>
                                {/if}
                                <Button variant="outline" size="sm" on:click={addTag} class="mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                    </svg>
                                    Add Tag
                                </Button>
                            </div>
                        </div>

                        <!-- Type-specific fields -->
                        {#if selectedType === 'artist'}
                            <!-- Artist-specific fields -->
                            <div class="space-y-4">
                                <div>
                                    <h3 class="text-sm font-medium mb-2">Date of birth</h3>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={dob}
                                        on:input={(e) => {
                                            dob = (e.target as HTMLInputElement).value;
                                            validateForm();
                                        }}
                                        class="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label for="location">Location <span class="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                                    <Input
                                        id="location"
                                        value={location}
                                        on:input={(e) => {
                                            location = (e.target as HTMLInputElement).value;
                                            validateForm();
                                        }}
                                        placeholder="City, Country"
                                        class="mt-1"
                                    />
                                </div>
                            </div>
                        {:else if selectedType === 'gallery' || selectedType === 'institution'}
                            <!-- Gallery/Institution-specific fields -->
                            <div>
                                <Label>Addresses <span class="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                                <div class="space-y-3 mt-2">
                                    {#if addresses.length > 0}
                                        {#each addresses as address, i}
                                            <div class="flex gap-2">
                                                <Input
                                                    placeholder="Address"
                                                    value={address}
                                                    on:input={(e) => updateAddress(i, (e.target as HTMLInputElement).value)}
                                                    class="flex-1"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    on:click={() => removeAddress(i)}
                                                    class="shrink-0"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                    </svg>
                                                </Button>
                                            </div>
                                        {/each}
                                    {:else}
                                        <div class="text-sm text-muted-foreground mb-2">No addresses added yet</div>
                                    {/if}
                                    <Button variant="outline" size="sm" on:click={addAddress} class="mt-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                                        </svg>
                                        Add Address
                                    </Button>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Chain Selection Section -->
                <div>
                    <h2 class="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Select Blockchain</h2>
                    <p class="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">Choose the blockchain where your identity will be created</p>

                    {#if availableChains.length > 0}
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                            {#each availableChains as chain}
                                <button
                                    class="p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center gap-2
                                        {selectedChainId === chain.chain_id ? 'border-primary bg-primary/10' :
                                         chainIdentityStatus[chain.chain_id] ? 'border-border bg-muted/50 opacity-70 cursor-not-allowed' :
                                         'border-border hover:border-primary/50'}"
                                    on:click={() => handleChainSelect(chain.chain_id)}
                                    disabled={chainIdentityStatus[chain.chain_id]}
                                    title={chainIdentityStatus[chain.chain_id] ? 'You already have an identity on this chain' : 'Select this chain'}
                                >
                                    {#if chain.icon_url}
                                        <img
                                            src={chain.icon_url}
                                            alt={chain.name}
                                            class="h-12 w-12 mb-2"
                                            on:error={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.onerror = null;
                                                img.src = `https://placehold.co/48x48/svg?text=${chain.symbol || 'ETH'}`;
                                            }}
                                        />
                                    {:else}
                                        <div class="h-12 w-12 mb-2 bg-muted rounded-full flex items-center justify-center text-xl font-bold">
                                            {chain.symbol || 'ETH'}
                                        </div>
                                    {/if}
                                    <span class="text-lg font-medium">{chain.name}</span>
                                    {#if chain.is_testnet}
                                        <Badge variant="outline" class="bg-muted text-muted-foreground border-border">
                                            Testnet
                                        </Badge>
                                    {/if}
                                    {#if chainIdentityStatus[chain.chain_id]}
                                        <Badge variant="secondary" class="bg-gray-100 text-gray-700 border-gray-200 font-medium">
                                            Identity Exists
                                        </Badge>
                                    {/if}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <div class="p-4 bg-muted rounded-lg text-center">
                            <p>No chains available. Please try again later.</p>
                        </div>
                    {/if}

                    {#if errorMessage}
                        <div class="p-4 mb-6 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                            <p>{errorMessage}</p>
                        </div>
                    {/if}

                    <Alert class="mt-4 bg-muted/50">
                        <AlertDescription>
                            You can only create one identity per blockchain network. Chains where you already have an identity are disabled.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            <!-- Form Actions -->
            <div class="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8">
                <Button variant="outline" on:click={() => goto('/dashboard/identities')} class="w-full sm:w-auto touch-target">Cancel</Button>
                <Button
                    on:click={handleSubmit}
                    disabled={!isValid}
                    class="w-full sm:w-auto touch-target"
                >
                    Create Identity
                </Button>
            </div>
        {/if}
    </div>
</div>

<!-- Activation Dialog -->
{#if identityData}
<ActivationDialog bind:open={dialogOpen} identityData={identityData} />
{/if}
