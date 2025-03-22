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
import { createIdentity, mapIdentityType } from '$lib/services/identityService';
import { onMount } from 'svelte';
import type { Address } from 'viem';
import { truncateAddress } from '$lib/utils/web3';

let isProcessing = false;
let isUpdatingProgress = false;
let errorMessage = '';
let successMessage = '';
let transactionHash = '';
let identityId = 0;

// Subscribe to the identity store
let identityType = '';
let username = '';
let description = '';
let identityImage = '';
let links: { name: string; url: string }[] = [];
let tags: string[] = [];
let dob: number | undefined;
let dod: number | undefined;
let location = '';
let addresses: string[] = [];
let representedBy: any;
let representedArtists: any;
let chainName = '';
let chainId = 0;

// Subscribe to the identity store
let unsubscribeStore: () => void;

// On mount, update the setup progress and get identity info from store
onMount(() => {
    // Get identity info from store
    unsubscribeStore = identityStore.subscribe(state => {
        identityType = state.identityType || '';
        username = state.username;
        description = state.description || '';
        identityImage = state.identityImage || '';
        links = state.links || [];
        tags = state.tags || [];
        dob = state.dob;
        dod = state.dod;
        location = state.location || '';
        addresses = state.addresses || [];
        representedBy = state.representedBy;
        representedArtists = state.representedArtists;
        chainName = state.selectedChain?.name || '';
        chainId = state.selectedChain?.chain_id || 0;
    });

    // Update setup progress
    const updateProgress = async () => {
        const walletAddress = getWalletAddress();
        if (walletAddress) {
            try {
                isUpdatingProgress = true;
                const result = await updateSetupProgress(walletAddress, 4);
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
    };

    // Call the async function
    updateProgress();

    // Return cleanup function
    return () => {
        if (unsubscribeStore) unsubscribeStore();
    };
});

async function handleActivate() {
    const walletAddress = getWalletAddress() as Address;
    if (!walletAddress) {
        errorMessage = 'Wallet address not found. Please reconnect your wallet.';
        return;
    }

    if (!identityType || !username || !chainId) {
        errorMessage = 'Missing identity information. Please go back and complete all steps.';
        return;
    }

    try {
        isProcessing = true;
        errorMessage = '';
        successMessage = '';

        // Format links for the contract (convert from {name, url} format to string format)
        const formattedLinks = links.filter(link => link.url.trim().length > 0)
            .map(link => {
                // Format as "name|url" or just "url" if name is empty
                return link.name.trim() ? `${link.name.trim()}|${link.url.trim()}` : link.url.trim();
            });

        // Create the identity
        const result = await createIdentity({
            walletAddress,
            identityType: mapIdentityType(identityType),
            name: username,
            chainId,
            description: description || `${username} on ${chainName}`,
            identityImage: identityImage,
            links: formattedLinks,
            tags: tags.length > 0 ? tags : [identityType],
            dob: dob || 0,
            dod: dod || 0,
            location: location,
            addresses: addresses,
            representedBy: representedBy ? JSON.stringify(representedBy) : '',
            representedArtists: representedArtists ? JSON.stringify(representedArtists) : ''
        });

        if (result.success) {
            successMessage = 'Identity created successfully!';
            transactionHash = result.transactionHash || '';
            identityId = result.identityId || 0;

            // Wait 3 seconds before redirecting to home
            setTimeout(() => {
                goto('/');
            }, 3000);
        } else {
            errorMessage = result.error || 'Failed to create identity. Please try again.';
        }
    } catch (error) {
        console.error('Error creating identity:', error);
        errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
        isProcessing = false;
    }
}

// Function to close the page and return to home
async function closePage() {
    // Set the flag to prevent automatic redirection back to activate pages
    setUserClosedActivatePage(true);
    console.log('Closing confirmation page, flag set to prevent auto-redirect');

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

        console.log('Logged out from confirmation page');

        // Navigate to home page
        await goto('/');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative">
    <PaymentCheck currentStep={5} />
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
    <ProgressSteps currentStep={5} />

    <!-- Main content -->
    <div class="w-full max-w-md md:max-w-lg text-center bg-white dark:bg-neutral-950/80">
        <h1 class="text-3xl md:text-4xl font-bold mb-4">Ready to Activate</h1>
        <p class="text-base md:text-lg mb-8 text-muted-foreground">Review your identity information before activation</p>

        {#if errorMessage}
            <div class="p-4 mb-6 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                <p>{errorMessage}</p>
            </div>
        {/if}

        {#if successMessage}
            <div class="p-4 mb-6 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
                <p>{successMessage}</p>
                {#if transactionHash}
                    <p class="mt-2 text-sm">Transaction: {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</p>
                {/if}
                <p class="mt-2 text-sm">Redirecting to home page...</p>
            </div>
        {/if}

        <div class="space-y-8 mb-8 text-left">
            <!-- Step 1: Identity Type -->
            <div class="p-5 rounded-lg border border-border/30 bg-neutral-50 dark:bg-neutral-900/40 shadow-sm">
                <h3 class="text-lg font-semibold mb-3 pb-2 border-b border-border/50">Identity Type</h3>
                <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                    <p class="text-sm text-muted-foreground">Type</p>
                    <p class="text-base font-medium capitalize">{identityType || 'Not selected'}</p>
                </div>
            </div>

            <!-- Step 2: Identity Data -->
            <div class="p-5 rounded-lg border border-border/30 bg-neutral-50 dark:bg-neutral-900/40 shadow-sm">
                <h3 class="text-lg font-semibold mb-3 pb-2 border-b border-border/50">Identity Data</h3>

                <!-- Basic Information Section -->
                <div class="{(links && links.filter(l => l.url.trim()).length > 0) || (tags && tags.filter(t => t.trim()).length > 0) ||
                    (identityType === 'artist' && (dob || location)) ||
                    ((identityType === 'gallery' || identityType === 'institution') && addresses && addresses.filter(a => a.trim()).length > 0) ? 'mb-4' : 'mb-0'}">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Basic Information</h4>
                    <div class="space-y-3">
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Name</p>
                            <p class="text-base font-medium">{username || 'Not set'}</p>
                        </div>

                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Description</p>
                            <p class="text-base">{description || 'Not set'}</p>
                        </div>

                        {#if identityImage}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Profile Image</p>
                            <div class="mt-2 w-24 h-24 rounded-md overflow-hidden border border-border/50">
                                <img src={identityImage} alt="Identity" class="w-full h-full object-cover" />
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>

                <!-- Links & Tags Section -->
                {#if (links && links.filter(l => l.url.trim()).length > 0) || (tags && tags.filter(t => t.trim()).length > 0)}
                <div class="{(identityType === 'artist' && (dob || location)) ||
                    ((identityType === 'gallery' || identityType === 'institution') && addresses && addresses.filter(a => a.trim()).length > 0) ? 'mb-4' : 'mb-0'}">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Links & Tags</h4>
                    <div class="space-y-3">
                        {#if links && links.filter(l => l.url.trim()).length > 0}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Links</p>
                            <ul class="mt-2 list-disc list-inside">
                                {#each links.filter(l => l.url.trim()) as link}
                                    <li class="text-sm truncate">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                                            {link.name ? `${link.name}: ${link.url}` : link.url}
                                        </a>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                        {/if}

                        {#if tags && tags.filter(t => t.trim()).length > 0}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Tags</p>
                            <div class="mt-2 flex flex-wrap gap-2">
                                {#each tags.filter(t => t.trim()) as tag}
                                    <span class="px-2 py-1 text-xs bg-muted rounded-full">{tag}</span>
                                {/each}
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>
                {/if}

                <!-- Type-Specific Information -->
                {#if identityType === 'artist' && (dob || location)}
                <div class="{((identityType === 'gallery' || identityType === 'institution') && addresses && addresses.filter(a => a.trim()).length > 0) ? 'mb-4' : 'mb-0'}">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Artist Information</h4>
                    <div class="space-y-3">
                        {#if dob}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Date of Birth</p>
                            <p class="text-base">{new Date(dob * 1000).toLocaleDateString()}</p>
                        </div>
                        {/if}

                        {#if location}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Location</p>
                            <p class="text-base">{location}</p>
                        </div>
                        {/if}
                    </div>
                </div>
                {/if}

                {#if (identityType === 'gallery' || identityType === 'institution') && addresses && addresses.filter(a => a.trim()).length > 0}
                <div class="mb-0">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">{identityType === 'gallery' ? 'Gallery' : 'Institution'} Information</h4>
                    <div class="space-y-3">
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Physical Addresses</p>
                            <ul class="mt-2 list-disc list-inside">
                                {#each addresses.filter(a => a.trim()) as address}
                                    <li class="text-sm">{address}</li>
                                {/each}
                            </ul>
                        </div>
                    </div>
                </div>
                {/if}
            </div>

            <!-- Step 3: Chain Selection -->
            <div class="p-5 rounded-lg border border-border/30 bg-neutral-50 dark:bg-neutral-900/40 shadow-sm">
                <h3 class="text-lg font-semibold mb-3 pb-2 border-b border-border/50">Chain Selection</h3>
                <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                    <p class="text-sm text-muted-foreground">Selected Chain</p>
                    <p class="text-base font-medium">{chainName || 'Not selected'}</p>
                </div>
            </div>
        </div>

        <Button
            class="w-full {!(isProcessing || !identityType || !username || !chainId || !!successMessage) ? 'bg-primary hover:bg-primary/90' : ''}"
            disabled={isProcessing || !identityType || !username || !chainId || !!successMessage}
            on:click={handleActivate}
        >
            {#if isProcessing}
                <div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Creating Identity...
            {:else}
                Activate Profile
            {/if}
        </Button>

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
</style>