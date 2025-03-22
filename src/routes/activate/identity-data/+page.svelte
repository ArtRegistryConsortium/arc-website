<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession, getWalletAddress } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import PaymentCheck from '$lib/components/PaymentCheck.svelte';
import { identityStore } from '$lib/stores/identityStore';
import { updateSetupProgress } from '$lib/services/setupProgressService';
import { onMount } from 'svelte';

// Identity data fields
let username = '';
let description = '';
let identityImage = '';
let links = [''];
let tags = [''];
let dob = '';
let dod = '';
let location = '';
let addresses = [''];
let representedBy = '';
let representedArtists = '';

// Form state
let isValid = false;
let isUpdatingProgress = false;
let errorMessage = '';
let identityType = '';
let imagePreview = '';

// Function to convert date string to timestamp
function dateToTimestamp(dateStr: string): number | undefined {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : Math.floor(date.getTime() / 1000);
}

// On mount, update the setup progress and load previous input if available
onMount(async () => {
    // Load previously entered data from store if available
    const unsubscribe = identityStore.subscribe(state => {
        identityType = state.identityType || '';

        if (state.username) {
            username = state.username;
        }

        if (state.description) {
            description = state.description;
        }

        if (state.identityImage) {
            identityImage = state.identityImage;
            imagePreview = state.identityImage;
        }

        if (state.links && state.links.length > 0) {
            links = state.links;
        }

        if (state.tags && state.tags.length > 0) {
            tags = state.tags;
        }

        if (state.dob) {
            const date = new Date(state.dob * 1000);
            dob = date.toISOString().split('T')[0];
        }

        if (state.dod) {
            const date = new Date(state.dod * 1000);
            dod = date.toISOString().split('T')[0];
        }

        if (state.location) {
            location = state.location;
        }

        if (state.addresses && state.addresses.length > 0) {
            addresses = state.addresses;
        }

        if (state.representedBy) {
            representedBy = JSON.stringify(state.representedBy);
        }

        if (state.representedArtists) {
            representedArtists = JSON.stringify(state.representedArtists);
        }

        // Validate form
        validateForm();
        console.log('Loaded previously entered data');
    });

    // Unsubscribe to avoid memory leaks
    unsubscribe();

    const walletAddress = getWalletAddress();
    if (walletAddress) {
        try {
            isUpdatingProgress = true;
            const result = await updateSetupProgress(walletAddress, 2);
            if (!result.success) {
                console.error('Failed to update setup progress:', result.error);
                errorMessage = 'Failed to update setup progress. Please try again.';
            }
        } catch (error) {
            console.error('Error updating setup progress:', error);
            errorMessage = 'An error occurred. Please try again.';
        } finally {
            isUpdatingProgress = false;
        }
    }
});

function validateUsername(value: string): boolean {
    // Only allow lowercase letters, numbers, and hyphens
    const regex = /^[a-z0-9-]+$/;
    return regex.test(value) && value.length >= 3 && value.length <= 20;
}

function validateForm(): boolean {
    // Basic validation for required fields
    const isUsernameValid = validateUsername(username);
    const isDescriptionValid = description.trim().length > 0;

    // Validate links (must be valid URLs)
    const areLinksValid = links.every(link => {
        if (!link) return true; // Empty links are allowed
        try {
            new URL(link);
            return true;
        } catch {
            return false;
        }
    });

    // Validate dates if provided
    let isDobValid = true;
    if (dob) {
        const dobDate = new Date(dob);
        isDobValid = !isNaN(dobDate.getTime());
    }

    let isDodValid = true;
    if (dod) {
        const dodDate = new Date(dod);
        isDodValid = !isNaN(dodDate.getTime());
    }

    // Type-specific validation
    let isTypeSpecificValid = true;
    if (identityType === 'artist') {
        // For artists, location is required
        isTypeSpecificValid = location.trim().length > 0;
    } else if (identityType === 'gallery' || identityType === 'institution') {
        // For galleries and institutions, at least one address is required
        isTypeSpecificValid = addresses.some(addr => addr.trim().length > 0);
    }

    // Set overall validity
    isValid = isUsernameValid && isDescriptionValid && areLinksValid && isDobValid && isDodValid && isTypeSpecificValid;
    return isValid;
}

function handleUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value.toLowerCase();
    validateForm();
}

function handleDescriptionInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    description = input.value;
    validateForm();
}

function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                identityImage = e.target.result;
                imagePreview = e.target.result;
                validateForm();
            }
        };
        reader.readAsDataURL(file);
    }
}

function addLink() {
    links = [...links, ''];
}

function removeLink(index: number) {
    links = links.filter((_, i) => i !== index);
    validateForm();
}

function handleLinkInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    links = links.map((link, i) => i === index ? input.value : link);
    validateForm();
}

function addTag() {
    tags = [...tags, ''];
}

function removeTag(index: number) {
    tags = tags.filter((_, i) => i !== index);
    validateForm();
}

function handleTagInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    tags = tags.map((tag, i) => i === index ? input.value : tag);
    validateForm();
}

function addAddress() {
    addresses = [...addresses, ''];
}

function removeAddress(index: number) {
    addresses = addresses.filter((_, i) => i !== index);
    validateForm();
}

function handleAddressInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    addresses = addresses.map((address, i) => i === index ? input.value : address);
    validateForm();
}

async function handleContinue() {
    if (validateForm()) {
        // Store all the data in the store
        identityStore.setUsername(username);
        identityStore.setDescription(description);
        identityStore.setIdentityImage(identityImage);
        identityStore.setLinks(links.filter(link => link.trim().length > 0));
        identityStore.setTags(tags.filter(tag => tag.trim().length > 0));

        // Store type-specific data
        if (identityType === 'artist') {
            identityStore.setDob(dateToTimestamp(dob));
            identityStore.setDod(dateToTimestamp(dod));
            identityStore.setLocation(location);
            // Parse representedBy if provided
            if (representedBy.trim()) {
                try {
                    const parsedRepresentedBy = JSON.parse(representedBy);
                    identityStore.setRepresentedBy(parsedRepresentedBy);
                } catch (e) {
                    console.error('Error parsing representedBy JSON:', e);
                    // Store as string if parsing fails
                    identityStore.setRepresentedBy(representedBy);
                }
            }
        } else if (identityType === 'gallery' || identityType === 'institution') {
            identityStore.setAddresses(addresses.filter(addr => addr.trim().length > 0));
            // Parse representedArtists if provided
            if (representedArtists.trim()) {
                try {
                    const parsedRepresentedArtists = JSON.parse(representedArtists);
                    identityStore.setRepresentedArtists(parsedRepresentedArtists);
                } catch (e) {
                    console.error('Error parsing representedArtists JSON:', e);
                    // Store as string if parsing fails
                    identityStore.setRepresentedArtists(representedArtists);
                }
            }
        }

        // Update setup progress to the next step (3 - Select Chain)
        const walletAddress = getWalletAddress();
        if (walletAddress) {
            try {
                const result = await updateSetupProgress(walletAddress, 3);
                if (!result.success) {
                    console.error('Failed to update setup progress:', result.error);
                }
            } catch (error) {
                console.error('Error updating setup progress:', error);
            }
        }

        goto('/activate/select-chain');
    }
}

// Function to close the page and return to home
async function closePage() {
    // Set the flag to prevent automatic redirection back to activate pages
    setUserClosedActivatePage(true);
    console.log('Closing identity-data page, flag set to prevent auto-redirect');

    // Use goto for cleaner navigation
    await goto('/');
}

// Function to log out and return to home
async function handleLogout() {
    try {
        // Set the flag to prevent automatic redirection back to activate pages
        setUserClosedActivatePage(true);

        // Clear the auth session
        clearSession();

        // Disconnect the wallet
        await disconnect(config);

        console.log('Logged out from identity-data page');

        // Navigate to home page
        await goto('/');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative">
    <PaymentCheck currentStep={3} />
    <!-- Close button -->
    <Button
        variant="outline"
        size="icon"
        class="absolute top-4 right-4 rounded-full border-border hover:bg-accent hover:text-accent-foreground transition-colors"
        on:click={() => closePage()}
        aria-label="Close"
    >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </Button>
    <!-- Progress indicator -->
    <ProgressSteps currentStep={3} />

    <!-- Main content -->
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Identity Data</h1>

        <p class="text-lg mb-6">
            Enter information for your on-chain identity
        </p>

        <!-- Basic Information Section -->
        <div class="mb-8 text-left">
            <h2 class="text-xl font-semibold mb-4">Basic Information</h2>

            <!-- Name/Username -->
            <div class="mb-4">
                <label for="username" class="block text-sm font-medium mb-1">Name</label>
                <input
                    id="username"
                    type="text"
                    placeholder="Enter your name or alias"
                    class="w-full p-3 rounded-lg border-2 bg-background
                        {validateUsername(username) ? 'border-primary' : 'border-border'}
                        focus:outline-none focus:border-primary transition-colors"
                    value={username}
                    on:input={handleUsernameInput}
                />
                <p class="text-xs text-muted-foreground mt-1">
                    3-20 characters, lowercase letters, numbers, and hyphens only
                </p>
            </div>

            <!-- Description -->
            <div class="mb-4">
                <label for="description" class="block text-sm font-medium mb-1">Description</label>
                <textarea
                    id="description"
                    placeholder="Brief description of the identity"
                    class="w-full p-3 rounded-lg border-2 bg-background border-border
                        focus:outline-none focus:border-primary transition-colors"
                    rows="3"
                    value={description}
                    on:input={handleDescriptionInput}
                ></textarea>
            </div>

            <!-- Image Upload -->
            <div class="mb-4">
                <label for="image" class="block text-sm font-medium mb-1">Profile Image</label>
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            class="w-full p-2 rounded-lg border-2 bg-background border-border
                                focus:outline-none focus:border-primary transition-colors"
                            on:change={handleImageUpload}
                        />
                    </div>
                    {#if imagePreview}
                        <div class="w-16 h-16 rounded-md overflow-hidden border border-border">
                            <img src={imagePreview} alt="Preview" class="w-full h-full object-cover" />
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Links and Tags Section -->
        <div class="mb-8 text-left">
            <h2 class="text-xl font-semibold mb-4">Links & Tags</h2>

            <!-- Links -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Links</label>
                <div class="space-y-2">
                    {#each links as link, i}
                        <div class="flex gap-2">
                            <input
                                type="url"
                                placeholder="https://example.com"
                                class="flex-1 p-2 rounded-lg border-2 bg-background border-border
                                    focus:outline-none focus:border-primary transition-colors"
                                value={link}
                                on:input={(e) => handleLinkInput(i, e)}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                class="h-10 w-10"
                                on:click={() => removeLink(i)}
                                disabled={links.length === 1 && !links[0]}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    {/each}
                    <Button
                        variant="outline"
                        size="sm"
                        class="w-full mt-1"
                        on:click={addLink}
                    >
                        Add Link
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    Website or social media URLs
                </p>
            </div>

            <!-- Tags -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Tags</label>
                <div class="space-y-2">
                    {#each tags as tag, i}
                        <div class="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter a tag"
                                class="flex-1 p-2 rounded-lg border-2 bg-background border-border
                                    focus:outline-none focus:border-primary transition-colors"
                                value={tag}
                                on:input={(e) => handleTagInput(i, e)}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                class="h-10 w-10"
                                on:click={() => removeTag(i)}
                                disabled={tags.length === 1 && !tags[0]}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    {/each}
                    <Button
                        variant="outline"
                        size="sm"
                        class="w-full mt-1"
                        on:click={addTag}
                    >
                        Add Tag
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                    Keywords associated with the identity
                </p>
            </div>
        </div>

        <!-- Type-specific Fields -->
        {#if identityType === 'artist'}
            <div class="mb-8 text-left">
                <h2 class="text-xl font-semibold mb-4">Artist Information</h2>

                <!-- Date of Birth -->
                <div class="mb-4">
                    <label for="dob" class="block text-sm font-medium mb-1">Date of Birth</label>
                    <input
                        id="dob"
                        type="date"
                        class="w-full p-3 rounded-lg border-2 bg-background border-border
                            focus:outline-none focus:border-primary transition-colors"
                        value={dob}
                        on:input={(e) => { dob = (e.target as HTMLInputElement).value; validateForm(); }}
                    />
                </div>

                <!-- Date of Death (if applicable) -->
                <div class="mb-4">
                    <label for="dod" class="block text-sm font-medium mb-1">Date of Death (if applicable)</label>
                    <input
                        id="dod"
                        type="date"
                        class="w-full p-3 rounded-lg border-2 bg-background border-border
                            focus:outline-none focus:border-primary transition-colors"
                        value={dod}
                        on:input={(e) => { dod = (e.target as HTMLInputElement).value; validateForm(); }}
                    />
                </div>

                <!-- Location -->
                <div class="mb-4">
                    <label for="location" class="block text-sm font-medium mb-1">Location</label>
                    <input
                        id="location"
                        type="text"
                        placeholder="City, Country"
                        class="w-full p-3 rounded-lg border-2 bg-background border-border
                            focus:outline-none focus:border-primary transition-colors"
                        value={location}
                        on:input={(e) => { location = (e.target as HTMLInputElement).value; validateForm(); }}
                    />
                </div>

                <!-- Represented By -->
                <div class="mb-4">
                    <label for="representedBy" class="block text-sm font-medium mb-1">Represented By (JSON)</label>
                    <textarea
                        id="representedBy"
                        placeholder={`[{"id": 1, "name": "Gallery Name"}]`}
                        class="w-full p-3 rounded-lg border-2 bg-background border-border
                            focus:outline-none focus:border-primary transition-colors"
                        rows="3"
                        value={representedBy}
                        on:input={(e) => { representedBy = (e.target as HTMLTextAreaElement).value; validateForm(); }}
                    ></textarea>
                    <p class="text-xs text-muted-foreground mt-1">
                        JSON array of gallery/institution identity IDs representing the artist
                    </p>
                </div>
            </div>
        {:else if identityType === 'gallery' || identityType === 'institution'}
            <div class="mb-8 text-left">
                <h2 class="text-xl font-semibold mb-4">{identityType === 'gallery' ? 'Gallery' : 'Institution'} Information</h2>

                <!-- Physical Addresses -->
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1">Physical Addresses</label>
                    <div class="space-y-2">
                        {#each addresses as address, i}
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter address"
                                    class="flex-1 p-2 rounded-lg border-2 bg-background border-border
                                        focus:outline-none focus:border-primary transition-colors"
                                    value={address}
                                    on:input={(e) => handleAddressInput(i, e)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    class="h-10 w-10"
                                    on:click={() => removeAddress(i)}
                                    disabled={addresses.length === 1 && !addresses[0]}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                        {/each}
                        <Button
                            variant="outline"
                            size="sm"
                            class="w-full mt-1"
                            on:click={addAddress}
                        >
                            Add Address
                        </Button>
                    </div>
                </div>

                <!-- Represented Artists -->
                <div class="mb-4">
                    <label for="representedArtists" class="block text-sm font-medium mb-1">Represented Artists (JSON)</label>
                    <textarea
                        id="representedArtists"
                        placeholder={`[{"id": 1, "name": "Gallery Name"}]`}
                        class="w-full p-3 rounded-lg border-2 bg-background border-border
                            focus:outline-none focus:border-primary transition-colors"
                        rows="3"
                        value={representedArtists}
                        on:input={(e) => { representedArtists = (e.target as HTMLTextAreaElement).value; validateForm(); }}
                    ></textarea>
                    <p class="text-xs text-muted-foreground mt-1">
                        JSON array of artist identity IDs represented by the gallery/institution
                    </p>
                </div>
            </div>
        {/if}

        <!-- Continue Button -->
        <Button
            class="w-full mb-4"
            disabled={!isValid}
            on:click={handleContinue}
        >
            Continue
        </Button>

        {#if errorMessage}
            <div class="text-red-500 mb-4">{errorMessage}</div>
        {/if}

        <!-- Log out button -->
        <Button
          variant="ghost"
          class="mt-4 text-muted-foreground hover:text-foreground text-sm"
          on:click={handleLogout}
        >
          Disconnect Wallet
        </Button>
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>
