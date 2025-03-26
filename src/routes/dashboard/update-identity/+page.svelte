<script lang="ts">
console.log('Update Identity page component loaded');
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { getWalletAddress } from '$lib/stores/walletAuth';
import { identityStore, type IdentityInfo } from '$lib/stores/identityStore';
import { onMount, onDestroy } from 'svelte';
import type { Address } from 'viem';
import UpdateActivationDialog from '$lib/components/UpdateActivationDialog.svelte';
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
import { page } from '$app/stores';
import { getUserIdentities, type UserIdentity } from '$lib/services/userIdentityService';

// Identity data fields
let selectedType: string | null = null;
let username = '';
let description = '';
let identityImage = '';
let links: { name: string; url: string }[] = [];
let tags: string[] = [];
let dob = '';
let dod = '';
let location = '';
let addresses: string[] = [];
let selectedChain: Chain | null = null;
let identityId: number | null = null;
let chainId: number | null = null;

// Form state
let isValid = false;
let isLoading = true;
let errorMessage = '';
let imagePreview = '';
let dialogOpen = false;
let identityData: IdentityInfo | null = null;
let unsubscribeStore: (() => void) | undefined;

// Chain identity status
let walletAddress: Address | null = null;
let currentIdentity: UserIdentity | null = null;

// Identity type definitions
const identityTypes = [
    { id: 'artist', name: 'Artist', description: 'For individual artists and creators' },
    { id: 'gallery', name: 'Gallery', description: 'For art galleries and exhibition spaces' },
    { id: 'institution', name: 'Institution', description: 'For museums and cultural institutions' },
    { id: 'collector', name: 'Collector', description: 'For art collectors and enthusiasts' },
    { id: 'custodian', name: 'Custodian', description: 'For custodians and caretakers of art collections' }
];

// Force reactivity for validation state
function updateValidState(newState: boolean) {
    isValid = newState;
    console.log('Validation state updated:', isValid);
}

// Function to handle identity type selection
function handleTypeSelect(type: string) {
    selectedType = type;
    console.log('Type selected:', type);
    identityStore.setIdentityType(type as 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian');

    // Reset type-specific fields when changing type
    if (type === 'artist') {
        dob = '';
        dod = '';
        location = '';
        addresses = [];
        identityStore.setDob(undefined);
        identityStore.setDod(undefined);
        identityStore.setLocation('');
        identityStore.setAddresses([]);
    } else if (type === 'gallery' || type === 'institution') {
        dob = '';
        dod = '';
        location = '';
        addresses = [''];
        identityStore.setDob(undefined);
        identityStore.setDod(undefined);
        identityStore.setLocation('');
        identityStore.setAddresses(['']);
    }

    // Force validation after type selection
    setTimeout(() => {
        validateForm();
    }, 0);
}

// Subscribe to the identity store
onMount(async () => {
    try {
        console.log('Update Identity page onMount started');

        // Get wallet address
        walletAddress = getWalletAddress();
        if (!walletAddress) {
            throw new Error('Wallet address not found');
        }

        // Get identity ID and chain ID from URL
        const idParam = $page.url.searchParams.get('id');
        const chainParam = $page.url.searchParams.get('chainId');
        if (!idParam) {
            throw new Error('Identity ID not found in URL');
        }
        if (!chainParam) {
            throw new Error('Chain ID not found in URL');
        }
        identityId = parseInt(idParam);
        chainId = parseInt(chainParam);

        // Reset the identity store
        console.log('Resetting identity store...');
        identityStore.reset();

        // Subscribe to the identity store
        console.log('Setting up identity store subscription...');
        unsubscribeStore = identityStore.subscribe(state => {
            identityData = state;
            console.log('Identity store state updated:', state);
        });

        // Load the identity data
        await loadIdentityData();

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

// Clean up the subscription when the component is destroyed
onDestroy(() => {
    if (unsubscribeStore) {
        unsubscribeStore();
    }
});

// Load the identity data
async function loadIdentityData() {
    if (!walletAddress || !identityId || !chainId) {
        throw new Error('Wallet address, identity ID, or chain ID not found');
    }

    // Get the identity data
    const identities = await getUserIdentities(walletAddress);
    currentIdentity = identities.find(identity => identity.id === identityId && identity.chain_id === chainId) || null;

    if (!currentIdentity) {
        throw new Error('Identity not found with the specified ID and chain ID');
    }

    // Set the identity type
    selectedType = currentIdentity.type;

    // Set the basic identity data
    username = currentIdentity.name;
    description = currentIdentity.description || '';
    identityImage = currentIdentity.identity_image || '';

    // Set image preview if there's an image
    if (identityImage) {
        imagePreview = identityImage;
    }

    // Parse links
    if (currentIdentity.links) {
        try {
            const parsedLinks = typeof currentIdentity.links === 'string'
                ? JSON.parse(currentIdentity.links)
                : currentIdentity.links;

            if (Array.isArray(parsedLinks)) {
                links = parsedLinks.map(link => ({
                    name: link.name || link.title || '',
                    url: link.url || ''
                }));
            } else if (parsedLinks.links && Array.isArray(parsedLinks.links)) {
                links = parsedLinks.links.map((link: { name?: string; title?: string; url?: string }) => ({
                    name: link.name || link.title || '',
                    url: link.url || ''
                }));
            }
        } catch (e) {
            console.error('Error parsing links:', e);
            links = [];
        }
    } else {
        links = [];
    }

    // Parse tags
    tags = currentIdentity.tags || [];

    // Set type-specific fields
    if (selectedType === 'artist') {
        dob = currentIdentity.dob ? new Date(currentIdentity.dob * 1000).toISOString().split('T')[0] : '';
        dod = currentIdentity.dod ? new Date(currentIdentity.dod * 1000).toISOString().split('T')[0] : '';
        location = currentIdentity.location || '';
    } else if (selectedType === 'gallery' || selectedType === 'institution') {
        if (currentIdentity.addresses) {
            try {
                const parsedAddresses = typeof currentIdentity.addresses === 'string'
                    ? JSON.parse(currentIdentity.addresses)
                    : currentIdentity.addresses;

                if (Array.isArray(parsedAddresses)) {
                    addresses = parsedAddresses;
                } else if (parsedAddresses.addresses && Array.isArray(parsedAddresses.addresses)) {
                    addresses = parsedAddresses.addresses;
                }
            } catch (e) {
                console.error('Error parsing addresses:', e);
                addresses = [];
            }
        }
    }

    // Ensure there's at least one empty address for galleries/institutions
    if ((selectedType === 'gallery' || selectedType === 'institution') && addresses.length === 0) {
        addresses = [''];
    }

    // Get the chain information
    try {
        const response = await fetch(`/api/chains/info?chainId=${chainId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.chain) {
                selectedChain = data.chain;
            }
        }
    } catch (error) {
        console.error('Error fetching chain info:', error);
    }

    // Store the data in the identity store
    identityStore.setIdentityType(selectedType as 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian');
    identityStore.setUsername(username);
    identityStore.setDescription(description);
    identityStore.setIdentityImage(identityImage);
    identityStore.setLinks(links);
    identityStore.setTags(tags);

    if (selectedType === 'artist') {
        identityStore.setDob(currentIdentity.dob || undefined);
        identityStore.setDod(currentIdentity.dod || undefined);
        identityStore.setLocation(location);
    } else if (selectedType === 'gallery' || selectedType === 'institution') {
        identityStore.setAddresses(addresses);
    }

    if (selectedChain) {
        identityStore.setSelectedChain(selectedChain);
    }
}

// Handle image upload
function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                imagePreview = e.target.result;
                identityImage = e.target.result;
                identityStore.setIdentityImage(e.target.result);
                validateForm();
            }
        };

        reader.readAsDataURL(file);
    }
}

// Handle image URL input
function handleImageUrlInput(event: Event) {
    const input = event.target as HTMLInputElement;
    identityImage = input.value;

    // If the URL is valid, set it as the preview
    if (identityImage && (identityImage.startsWith('http://') || identityImage.startsWith('https://'))) {
        imagePreview = identityImage;
    } else {
        imagePreview = '';
    }

    identityStore.setIdentityImage(identityImage);
    validateForm();
}

// Add a new link field
function addLink() {
    links = [...links, { name: '', url: '' }];
}

// Remove a link field
function removeLink(index: number) {
    links = links.filter((_, i) => i !== index);
    identityStore.setLinks(links);
    validateForm();
}

// Handle link input
function handleLinkInput(index: number, field: 'name' | 'url', value: string) {
    links[index][field] = value;
    links = [...links]; // Force reactivity
    identityStore.setLinks([...links]); // Create a new array to ensure reactivity
    validateForm();
}

// Add a new tag
function addTag(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
        event.preventDefault();
        const input = event.target as HTMLInputElement;
        const value = input.value.trim();

        if (value && !tags.includes(value)) {
            tags = [...tags, value];
            identityStore.setTags(tags);
            input.value = '';
            validateForm();
        }
    }
}

// Remove a tag
function removeTag(index: number) {
    tags = tags.filter((_, i) => i !== index);
    identityStore.setTags(tags);
    validateForm();
}

// Add a new address field (for galleries/institutions)
function addAddress() {
    addresses = [...addresses, ''];
}

// Remove an address field
function removeAddress(index: number) {
    addresses = addresses.filter((_, i) => i !== index);
    identityStore.setAddresses(addresses);
    validateForm();
}

// Handle address input
function handleAddressInput(index: number, value: string) {
    addresses[index] = value;
    addresses = [...addresses]; // Force reactivity
    identityStore.setAddresses([...addresses]); // Create a new array to ensure reactivity
    validateForm();
}

// Handle date of birth input
function handleDobInput(event: Event) {
    // dob is already bound to the input value via bind:value
    // Convert date to timestamp
    if (dob) {
        const timestamp = Math.floor(new Date(dob).getTime() / 1000);
        identityStore.setDob(timestamp);
    } else {
        identityStore.setDob(undefined);
    }

    validateForm();
}

// Handle date of death input
function handleDodInput(event: Event) {
    // dod is already bound to the input value via bind:value
    // Convert date to timestamp
    if (dod) {
        const timestamp = Math.floor(new Date(dod).getTime() / 1000);
        identityStore.setDod(timestamp);
    } else {
        identityStore.setDod(undefined);
    }

    validateForm();
}

// Handle location input
function handleLocationInput(event: Event) {
    // location is already bound to the input value via bind:value
    identityStore.setLocation(location);
    validateForm();
}

// Validate username
function validateUsername(value: string): boolean {
    return value.trim().length >= 2;
}

// Validate description
function validateDescription(value: string): boolean {
    return value.trim().length >= 1;
}

// Validate the form
function validateForm(): boolean {
    console.log('Validating form...');

    // Basic validation for required fields only
    const isTypeValid = !!selectedType;
    const isUsernameValid = validateUsername(username);
    const isDescriptionValid = validateDescription(description);

    // Image is required - consider valid if either imagePreview or identityImage is set
    // This allows for both uploaded images and URLs
    const isImageValid = !!imagePreview || !!identityImage;

    // Update the validation state - only check required fields
    const newIsValid = isTypeValid && isUsernameValid && isDescriptionValid && isImageValid;

    console.log('Form validation - Final result:', newIsValid);

    // Force reactivity by creating a new boolean
    isValid = newIsValid;
    return newIsValid;
}

// Function to handle form submission
async function handleSubmit() {
    if (validateForm()) {
        console.log('Form submitted with values:', {
            selectedType,
            username,
            description,
            identityImage,
            links,
            tags,
            dob,
            dod,
            location,
            addresses
        });

        // Store all the data in the store
        identityStore.setIdentityType(selectedType as 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian');
        identityStore.setUsername(username);
        identityStore.setDescription(description);
        identityStore.setIdentityImage(identityImage);
        identityStore.setLinks(links.filter(link => link.url.trim().length > 0));
        identityStore.setTags(tags.filter(tag => tag.trim().length > 0));

        // Store type-specific data
        if (selectedType === 'artist') {
            const dobTimestamp = dob ? Math.floor(new Date(dob).getTime() / 1000) : 0;
            const dodTimestamp = dod ? Math.floor(new Date(dod).getTime() / 1000) : 0;
            identityStore.setDob(dobTimestamp);
            identityStore.setDod(dodTimestamp);
            identityStore.setLocation(location);
        } else if (selectedType === 'gallery' || selectedType === 'institution') {
            identityStore.setAddresses(addresses.filter(addr => addr.trim().length > 0));
        }

        // Set the identity ID and original image URL
        if (currentIdentity) {
            // Create a new object that combines IdentityInfo with the identityId and originalImageUrl
            const dialogData = {
                ...identityData!,
                identityId: Number(currentIdentity.id), // Ensure it's a valid number
                chainId: Number(currentIdentity.chain_id), // Pass the chain ID
                originalImageUrl: currentIdentity.identity_image || '' // Pass the original image URL for comparison
            };
            identityData = dialogData;
            console.log('Setting identityId for dialog:', dialogData.identityId, typeof dialogData.identityId);
            console.log('Setting originalImageUrl for dialog:', dialogData.originalImageUrl);
        }

        // Open the activation dialog
        dialogOpen = true;
    }
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
                    <h1 class="text-xl sm:text-2xl font-bold">Update Identity</h1>
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
                    <h2 class="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Identity Type</h2>
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
                                bind:value={username}
                                on:input={() => {
                                    identityStore.setUsername(username);
                                    validateForm();
                                }}
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
                                bind:value={description}
                                on:input={() => {
                                    identityStore.setDescription(description);
                                    validateForm();
                                }}
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
                                                bind:value={link.name}
                                                on:input={(e) => handleLinkInput(i, 'name', link.name)}
                                                class="flex-1"
                                            />
                                            <Input
                                                placeholder="URL"
                                                bind:value={link.url}
                                                on:input={(e) => handleLinkInput(i, 'url', link.url)}
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
                                                bind:value={tags[i]}
                                                on:input={() => {
                                                    identityStore.setTags([...tags]); // Create a new array to ensure reactivity
                                                    validateForm();
                                                }}
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
                                <Button variant="outline" size="sm" on:click={() => {
                                    tags = [...tags, ''];
                                    validateForm();
                                }} class="mt-2">
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
                                        bind:value={dob}
                                        on:input={handleDobInput}
                                        class="mt-1"
                                    />
                                </div>
                                <div>
                                    <h3 class="text-sm font-medium mb-2">Date of death</h3>
                                    <Input
                                        id="dod"
                                        type="date"
                                        bind:value={dod}
                                        on:input={handleDodInput}
                                        class="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label for="location">Location <span class="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                                    <Input
                                        id="location"
                                        bind:value={location}
                                        on:input={handleLocationInput}
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
                                                    bind:value={addresses[i]}
                                                    on:input={(e) => handleAddressInput(i, (e.target as HTMLInputElement).value)}
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

                <!-- Blockchain Network -->
                <div>
                    <h2 class="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Blockchain Network</h2>
                    <p class="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">The blockchain network cannot be changed after identity creation</p>

                    {#if selectedChain}
                        <div class="p-4 border border-border rounded-md bg-muted/30">
                            <div class="flex items-center gap-2">
                                {#if selectedChain.icon_url}
                                    <img src={selectedChain.icon_url} alt={selectedChain.name} class="w-6 h-6" />
                                {/if}
                                <span class="font-medium">{selectedChain.name}</span>
                            </div>
                        </div>
                    {:else}
                        <p class="text-muted-foreground">No blockchain network selected.</p>
                    {/if}
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
                    Update Identity
                </Button>
            </div>
        {/if}
    </div>
</div>

<!-- Update Activation Dialog -->
{#if identityData}
<UpdateActivationDialog bind:open={dialogOpen} identityData={identityData} />
{/if}
