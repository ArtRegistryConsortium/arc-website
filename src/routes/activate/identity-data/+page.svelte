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
let links: { name: string; url: string }[] = [];
let tags: string[] = [];
let dob = '';
let location = '';
let addresses: string[] = [];
// Removed representedBy and representedArtists fields

// Form state
let isValid = false;
let isUpdatingProgress = false;
let errorMessage = '';
let identityType = '';
let imagePreview = '';

// Force reactivity for validation state
function updateValidState(newState: boolean) {
    isValid = newState;
    console.log('Validation state updated:', isValid);
}

// Function to convert date string to timestamp
function dateToTimestamp(dateStr: string): number | undefined {
    if (!dateStr) return undefined;
    // Convert from dd-mm-yyyy to yyyy-mm-dd for Date parsing
    const [day, month, year] = dateStr.split('-');
    // Create date at local midnight to avoid timezone issues
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? undefined : Math.floor(date.getTime() / 1000);
}

// Function to format timestamp to dd-mm-yyyy string
function timestampToDateString(timestamp: number | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    // Use UTC methods to avoid timezone issues
    return `${String(date.getUTCDate()).padStart(2, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${date.getUTCFullYear()}`;
}

// Function to format links for the contract
function formatLinksForContract(links: { name: string; url: string }[]): string[] {
    return links.filter(link => link.url.trim().length > 0)
        .map(link => {
            // Format as "name|url" or just "url" if name is empty
            return link.name.trim() ? `${link.name.trim()}|${link.url.trim()}` : link.url.trim();
        });
}

// Reactive statement to validate form when required fields change
$: {
    console.log('Reactive validation check - fields:', { username, description, imagePreview: !!imagePreview });
    const valid = validateForm();
    updateValidState(valid);
}

// On mount, update the setup progress and load previous input if available
onMount(async () => {
    console.log('Component mounted');

    // Load previously entered data from store if available
    const unsubscribe = identityStore.subscribe(state => {
        console.log('Loading data from store:', state);
        identityType = state.identityType || '';
        console.log('Identity type loaded:', identityType);

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
            // Handle both old format (string[]) and new format ({ name: string; url: string }[])
            if (typeof state.links[0] === 'string') {
                // Convert old format to new format
                links = (state.links as unknown as string[]).map(url => ({ name: '', url }));
            } else {
                // Make a deep copy to ensure reactivity
                links = JSON.parse(JSON.stringify(state.links));
            }
            console.log('Loaded links:', links);
        }

        if (state.tags && state.tags.length > 0) {
            // Make a deep copy to ensure reactivity
            tags = [...state.tags];
            console.log('Loaded tags:', tags);
        }

        if (state.dob) {
            dob = timestampToDateString(state.dob);
        }

        if (state.location) {
            location = state.location;
        }

        if (state.addresses && state.addresses.length > 0) {
            addresses = state.addresses;
        }

        // Removed loading of representedBy and representedArtists
    });

    // Unsubscribe to avoid memory leaks
    unsubscribe();

    // Validate form after all data is loaded and component is fully mounted
    // Use a slightly longer timeout to ensure everything is rendered
    setTimeout(() => {
        console.log('Initial validation after mount');
        const valid = validateForm();
        updateValidState(valid);
        console.log('Initial validation result:', valid);
    }, 300);

    const walletAddress = getWalletAddress();
    if (walletAddress) {
        try {
            // First get the current setup step
            const response = await fetch('/api/wallet/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ walletAddress })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();

            // Only update if current step is less than this page's step (2)
            if (result.success && result.data && result.data.setup_step < 2) {
                isUpdatingProgress = true;
                const updateResult = await updateSetupProgress(walletAddress, 2);
                if (!updateResult.success) {
                    console.error('Failed to update setup progress:', updateResult.error);
                    errorMessage = 'Failed to update setup progress. Please try again.';
                }
            } else {
                console.log('Not updating setup step as current step is already at or beyond this page\'s step');
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
    // Only check if not empty and not more than 100 characters
    const isValid = value.trim().length > 0 && value.length <= 100;
    console.log('Username validation:', {
        value,
        length: value.length,
        isValid
    });
    return isValid;
}

function validateForm(): boolean {
    console.log('Running validateForm() with current values:', {
        username,
        description,
        imagePreview: !!imagePreview,
        identityImage: !!identityImage
    });

    // Basic validation for required fields
    const isUsernameValid = validateUsername(username);
    const isDescriptionValid = description.trim().length > 0;
    const isImageValid = !!imagePreview || !!identityImage;

    // Log validation state for debugging
    console.log('Validation results:', {
        isUsernameValid,
        isDescriptionValid,
        isImageValid,
        usernameLength: username.length,
        descriptionLength: description.trim().length,
        hasImagePreview: !!imagePreview,
        hasIdentityImage: !!identityImage
    });

    // Update the validation state - only name, description and image are required
    const newIsValid = isUsernameValid && isDescriptionValid && isImageValid;
    console.log('Final validation result:', newIsValid);

    updateValidState(newIsValid);
    return newIsValid;
}

function handleUsernameInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
    console.log('Username changed:', username);
    validateForm();
}

function handleDescriptionInput(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    description = input.value;
    console.log('Description changed:', description);
    validateForm();
}

function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
        const file = input.files[0];
        console.log('Image file selected:', {
            name: file.name,
            size: file.size,
            type: file.type,
            sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
        });
        
        // Check file size (1MB = 1024 * 1024 bytes)
        const maxSize = 1024 * 1024; // 1MB in bytes
        if (file.size > maxSize) {
            console.log('File too large:', {
                fileSize: file.size,
                maxSize: maxSize,
                sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
            });
            errorMessage = `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) must be less than 1MB`;
            // Reset the input
            input.value = '';
            return;
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            console.log('Invalid file type:', file.type);
            errorMessage = 'Please select an image file (JPG, PNG, GIF)';
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                identityImage = e.target.result;
                imagePreview = e.target.result;
                errorMessage = ''; // Clear any previous error messages
                console.log('Image loaded successfully, preview set');
                validateForm();
            }
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            errorMessage = 'Error reading file. Please try again.';
            input.value = '';
        };
        reader.readAsDataURL(file);
    } else {
        console.log('No file selected or file input is null');
    }
}

function addLink() {
    links = [...links, { name: '', url: '' }];
}

function removeLink(index: number) {
    links = links.filter((_, i) => i !== index);
    validateForm();

    // If all links are removed, reset the array to empty
    if (links.length === 0) {
        links = [];
    }
}

function handleLinkNameInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    links = links.map((link, i) => i === index ? { ...link, name: input.value } : link);
    validateForm();
}

function handleLinkUrlInput(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    links = links.map((link, i) => i === index ? { ...link, url: input.value } : link);
    validateForm();
}

function addTag() {
    tags = [...tags, ''];
}

function removeTag(index: number) {
    tags = tags.filter((_, i) => i !== index);
    validateForm();

    // If all tags are removed, reset the array to empty
    if (tags.length === 0) {
        tags = [];
    }
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

// Function to handle DOB input with masking
function handleDobInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    // Apply mask dd-mm-yyyy
    if (value.length > 0) {
        if (value.length <= 2) {
            value = value;
        } else if (value.length <= 4) {
            value = value.slice(0, 2) + '-' + value.slice(2);
        } else if (value.length <= 8) {
            value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4);
        } else {
            value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 8);
        }
    }
    
    dob = value;
    validateForm();
}

async function handleContinue() {
    if (validateForm()) {
        // Store all the data in the store
        identityStore.setUsername(username);
        identityStore.setDescription(description);
        identityStore.setIdentityImage(identityImage);
        // Store links in the new format
        identityStore.setLinks(links.filter(link => link.url.trim().length > 0));

        // Note: When sending to the contract, we'll need to use formatLinksForContract(links)
        identityStore.setTags(tags.filter(tag => tag.trim().length > 0));

        // Store type-specific data
        if (identityType === 'artist') {
            identityStore.setDob(dateToTimestamp(dob));
            identityStore.setLocation(location);
            // Removed representedBy handling
        } else if (identityType === 'gallery' || identityType === 'institution') {
            identityStore.setAddresses(addresses.filter(addr => addr.trim().length > 0));
            // Removed representedArtists handling
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

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative bg-gradient-to-b from-background to-background/95">
    <PaymentCheck currentStep={3} />
    <!-- Close button -->
    <Button
        variant="outline"
        size="icon"
        class="absolute top-4 right-4 rounded-full border-border hover:bg-accent hover:text-accent-foreground transition-all duration-200 shadow-sm hover:shadow"
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
    <div class="w-full max-w-md md:max-w-lg text-center bg-white dark:bg-neutral-950/80">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">Identity Data</h1>

        <p class="text-base md:text-lg mb-8 text-muted-foreground">
            Enter information for your on-chain identity
        </p>

        <!-- Basic Information Section -->
        <div class="mb-10 text-left p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-border/30 shadow-sm">
            <h2 class="text-xl font-semibold mb-5 pb-2 border-b border-border/50">Basic Information <span class="text-sm font-normal text-muted-foreground ml-2">(Required)</span></h2>

            <!-- Name/Username -->
            <div class="mb-4">
                <label for="username" class="block text-sm font-medium mb-1.5 text-foreground/80">Name <span class="text-foreground/60">*</span></label>
                <input
                    id="username"
                    type="text"
                    placeholder="Enter your name or alias"
                    class="w-full p-3 border bg-white/90 dark:bg-neutral-800/50
                        focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    value={username}
                    on:input={handleUsernameInput}
                />
            </div>

            <!-- Description -->
            <div class="mb-4">
                <label for="description" class="block text-sm font-medium mb-1.5 text-foreground/80">Description <span class="text-foreground/60">*</span></label>
                <textarea
                    id="description"
                    placeholder="Brief description of the identity"
                    class="w-full p-3 border bg-white/90 dark:bg-neutral-800/50
                        focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    rows="3"
                    value={description}
                    on:input={handleDescriptionInput}
                ></textarea>
            </div>

            <!-- Image Upload -->
            <div class="mb-4">
                <label for="image" class="block text-sm font-medium mb-1.5 text-foreground/80">Profile Image <span class="text-foreground/60">*</span></label>
                <div class="mt-1 flex items-center gap-4">
                    {#if imagePreview}
                        <div class="w-24 h-24 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                            <img src={imagePreview} alt="Preview" class="max-w-full max-h-full object-contain" />
                        </div>
                    {/if}
                    <div class="flex-1">
                        <Button variant="outline" class="relative overflow-hidden" type="button">
                            <input
                                type="file"
                                accept="image/*"
                                on:change={handleImageUpload}
                                class="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {imagePreview ? 'Change Image' : 'Upload Image'}
                        </Button>
                        <p class="text-xs text-muted-foreground mt-1">Max size: 1MB. Supported formats: JPG, PNG, GIF</p>
                        {#if errorMessage}
                            <p class="text-xs text-red-500 mt-1">{errorMessage}</p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Links and Tags Section -->
        <div class="mb-10 text-left p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-border/30 shadow-sm">
            <h2 class="text-xl font-semibold mb-5 pb-2 border-b border-border/50">Links & Tags <span class="text-sm font-normal text-muted-foreground">(Optional)</span></h2>

            <!-- Links -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1.5 text-foreground/80">Links <span class="text-muted-foreground">(Optional)</span></label>
                <div class="space-y-2">
                    {#each links as link, i}
                        <div class="flex flex-col gap-2 mb-3 p-3 bg-white/50 dark:bg-neutral-800/20 border border-border/30">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-foreground/70">Link #{i+1}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-7 w-7 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                                    on:click={() => removeLink(i)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                            <div class="flex flex-col gap-2">
                                <input
                                    type="text"
                                    placeholder="Name (e.g. X, Instagram, Website)"
                                    class="w-full p-2 border bg-white/90 dark:bg-neutral-800/50 
                                        focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    value={link.name}
                                    on:input={(e) => handleLinkNameInput(i, e)}
                                />
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    class="w-full p-2 border bg-white/90 dark:bg-neutral-800/50
                                        focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    value={link.url}
                                    on:input={(e) => handleLinkUrlInput(i, e)}
                                />
                            </div>
                        </div>
                    {/each}
                    <Button
                        variant="outline"
                        class="w-full mt-2 bg-background/70 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                        on:click={addLink}
                    >
                        Add Link
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-2 ml-1">
                    Website or social media URLs
                </p>
            </div>

            <!-- Tags -->
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1.5 text-foreground/80">Tags <span class="text-muted-foreground">(Optional)</span></label>
                <div class="space-y-2">
                    {#each tags as tag, i}
                        <div class="flex gap-2">
                            <input
                                type="text"
                                placeholder="Enter a tag"
                                class="flex-1 p-2 border bg-white/90 dark:bg-neutral-800/50 
                                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                value={tag}
                                on:input={(e) => handleTagInput(i, e)}
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                class="h-11 w-11 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                                on:click={() => removeTag(i)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </Button>
                        </div>
                    {/each}
                    <Button
                        variant="outline"
                        class="w-full mt-2 bg-background/70 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                        on:click={addTag}
                    >
                        Add Tag
                    </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-2 ml-1">
                    Keywords associated with the identity
                </p>
            </div>
        </div>

        <!-- Type-specific Fields -->
        {#if identityType === 'artist'}
            <div class="mb-10 text-left p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-border/30 shadow-sm">
                <h2 class="text-xl font-semibold mb-5 pb-2 border-b border-border/50">Artist Information <span class="text-sm font-normal text-muted-foreground">(Optional)</span></h2>

                <!-- Date of Birth -->
                <div class="mb-4">
                    <label for="dob" class="block text-sm font-medium mb-1.5 text-foreground/80">Date of Birth <span class="text-muted-foreground">(Optional)</span></label>
                    <input
                        id="dob"
                        type="text"
                        placeholder="DD-MM-YYYY"
                        class="w-full p-3 border bg-white/90 dark:bg-neutral-800/50
                            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        value={dob}
                        on:input={handleDobInput}
                        maxlength="10"
                    />
                </div>

                <!-- Location -->
                <div class="mb-4">
                    <label for="location" class="block text-sm font-medium mb-1.5 text-foreground/80">Location <span class="text-muted-foreground">(Optional)</span></label>
                    <input
                        id="location"
                        type="text"
                        placeholder="City, Country"
                        class="w-full p-3 border bg-white/90 dark:bg-neutral-800/50
                            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        value={location}
                        on:input={(e) => { location = (e.target as HTMLInputElement).value; validateForm(); }}
                    />
                </div>
            </div>
        {:else if identityType === 'gallery' || identityType === 'institution'}
            <div class="mb-10 text-left p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-border/30 shadow-sm">
                <h2 class="text-xl font-semibold mb-5 pb-2 border-b border-border/50">{identityType === 'gallery' ? 'Gallery' : 'Institution'} Information <span class="text-sm font-normal text-muted-foreground">(Optional)</span></h2>

                <!-- Physical Addresses -->
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-1.5 text-foreground/80">Physical Addresses <span class="text-muted-foreground">(Optional)</span></label>
                    <div class="space-y-2">
                        {#each addresses as address, i}
                            <div class="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter address"
                                    class="flex-1 p-2 border bg-white/90 dark:bg-neutral-800/50
                                        focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    value={address}
                                    on:input={(e) => handleAddressInput(i, e)}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    class="h-11 w-11 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                                    on:click={() => removeAddress(i)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </Button>
                            </div>
                        {/each}
                        <Button
                            variant="outline"
                            class="w-full mt-2 bg-background/70 hover:bg-accent/80 hover:text-accent-foreground transition-colors duration-200"
                            on:click={addAddress}
                        >
                            Add Address
                        </Button>
                    </div>
                </div>


            </div>
        {/if}

        <!-- Continue Button -->
        <div class="flex flex-col gap-3">
            <Button
                class="w-full {isValid ? 'bg-primary hover:bg-primary/90' : ''}"
                disabled={!isValid}
                on:click={handleContinue}
            >
                {#if isValid}
                    Continue to Next Step
                {:else}
                    Please Complete Required Fields
                {/if}
            </Button>

            <!-- Mobile Back Button -->
            <Button
                variant="outline"
                class="w-full md:hidden"
                on:click={() => goto('/activate/choose-identity-type')}
            >
                Back
            </Button>
        </div>

        {#if errorMessage}
            <div class="text-red-500 mb-4">{errorMessage}</div>
        {/if}

       <!-- Log out button -->
       <Button
        variant="ghost"
        class="mt-4 mb-8 text-muted-foreground hover:text-foreground text-sm"
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

    /* Smooth transitions for form elements */
    input, textarea, button {
        transition: all 0.2s ease-in-out;
    }

    /* No hover effect for form sections */

    /* Improve focus visibility for accessibility */
    input:focus, textarea:focus {
        box-shadow: 0 0 0 2px rgba(var(--primary), 0.2);
    }
</style>
