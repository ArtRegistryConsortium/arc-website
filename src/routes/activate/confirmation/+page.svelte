<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession, getWalletAddress } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import PaymentCheck from '$lib/components/PaymentCheck.svelte';
import { identityStore, type IdentityInfo } from '$lib/stores/identityStore';
import { updateSetupProgress } from '$lib/services/setupProgressService';
import { onMount } from 'svelte';
import type { Address } from 'viem';
import ActivationDialog from '$lib/components/ActivationDialog.svelte';

let isUpdatingProgress = false;
let errorMessage = '';
let dialogOpen = false;

// Identity data from store
let identityData: IdentityInfo;

// Subscribe to the identity store
let unsubscribeStore: () => void;

// On mount, update the setup progress and get identity info from store
onMount(() => {
    // Get identity info from store
    unsubscribeStore = identityStore.subscribe(state => {
        identityData = state;
    });

    // Update setup progress
    const updateProgress = async () => {
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

                // Only update if current step is less than this page's step (4)
                if (result.success && result.data && result.data.setup_step < 4) {
                    isUpdatingProgress = true;
                    const updateResult = await updateSetupProgress(walletAddress, 4);
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
    };

    // Call the async function
    updateProgress();

    // Return cleanup function
    return () => {
        if (unsubscribeStore) unsubscribeStore();
    };
});

function handleActivate() {
    // Open the activation dialog
    dialogOpen = true;
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

        <div class="space-y-8 mb-8 text-left">
            <!-- Step 1: Identity Type -->
            <div class="p-5 rounded-lg border border-border/30 bg-neutral-50 dark:bg-neutral-900/40 shadow-sm">
                <h3 class="text-lg font-semibold mb-3 pb-2 border-b border-border/50">Identity Type</h3>
                <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                    <p class="text-sm text-muted-foreground">Type</p>
                    <p class="text-base font-medium capitalize">{identityData?.identityType || 'Not selected'}</p>
                </div>
            </div>

            <!-- Step 2: Identity Data -->
            <div class="p-5 rounded-lg border border-border/30 bg-neutral-50 dark:bg-neutral-900/40 shadow-sm">
                <h3 class="text-lg font-semibold mb-3 pb-2 border-b border-border/50">Identity Data</h3>

                <!-- Basic Information Section -->
                <div class="{(identityData?.links && identityData.links.filter(l => l.url.trim()).length > 0) || (identityData?.tags && identityData.tags.filter(t => t.trim()).length > 0) ||
                    (identityData?.identityType === 'artist' && (identityData?.dob || identityData?.location)) ||
                    ((identityData?.identityType === 'gallery' || identityData?.identityType === 'institution') && identityData?.addresses && identityData.addresses.filter(a => a.trim()).length > 0) ? 'mb-4' : 'mb-0'}">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Basic Information</h4>
                    <div class="space-y-3">
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Name</p>
                            <p class="text-base font-medium">{identityData?.username || 'Not set'}</p>
                        </div>

                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Description</p>
                            <p class="text-base">{identityData?.description || 'Not set'}</p>
                        </div>

                        {#if identityData?.identityImage}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Profile Image</p>
                            <div class="mt-2 w-24 h-24 rounded-md overflow-hidden border border-border/50">
                                <img src={identityData.identityImage} alt="Identity" class="w-full h-full object-cover" />
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>

                <!-- Links & Tags Section -->
                {#if (identityData?.links && identityData.links.filter(l => l.url.trim()).length > 0) || (identityData?.tags && identityData.tags.filter(t => t.trim()).length > 0)}
                <div class="{(identityData?.identityType === 'artist' && (identityData?.dob || identityData?.location)) ||
                    ((identityData?.identityType === 'gallery' || identityData?.identityType === 'institution') && identityData?.addresses && identityData.addresses.filter(a => a.trim()).length > 0) ? 'mb-4' : 'mb-0'}">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Links & Tags</h4>
                    <div class="space-y-3">
                        {#if identityData?.links && identityData.links.filter(l => l.url.trim()).length > 0}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Links</p>
                            <ul class="mt-2 list-disc list-inside">
                                {#each identityData.links.filter(l => l.url.trim()) as link}
                                    <li class="text-sm truncate">
                                        <a href={link.url} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
                                            {link.name ? `${link.name}: ${link.url}` : link.url}
                                        </a>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                        {/if}

                        {#if identityData?.tags && identityData.tags.filter(t => t.trim()).length > 0}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Tags</p>
                            <div class="mt-2 flex flex-wrap gap-2">
                                {#each identityData.tags.filter(t => t.trim()) as tag}
                                    <span class="px-2 py-1 text-xs bg-muted rounded-full">{tag}</span>
                                {/each}
                            </div>
                        </div>
                        {/if}
                    </div>
                </div>
                {/if}

                <!-- Type-Specific Information -->
                {#if identityData?.identityType === 'artist' && (identityData?.dob || identityData?.location)}
                <div class="mb-0">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">Artist Information</h4>
                    <div class="space-y-3">
                        {#if identityData?.dob}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Date of Birth</p>
                            <p class="text-base">{new Date(identityData.dob * 1000).toLocaleDateString()}</p>
                        </div>
                        {/if}

                        {#if identityData?.location}
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Location</p>
                            <p class="text-base">{identityData.location}</p>
                        </div>
                        {/if}
                    </div>
                </div>
                {/if}

                {#if (identityData?.identityType === 'gallery' || identityData?.identityType === 'institution') && identityData?.addresses && identityData.addresses.filter(a => a.trim()).length > 0}
                <div class="mb-0">
                    <h4 class="text-sm font-medium text-muted-foreground mb-2">{identityData.identityType === 'gallery' ? 'Gallery' : 'Institution'} Information</h4>
                    <div class="space-y-3">
                        <div class="p-3 rounded-lg bg-white/80 dark:bg-neutral-800/50 border border-border/30">
                            <p class="text-sm text-muted-foreground">Physical Addresses</p>
                            <ul class="mt-2 list-disc list-inside">
                                {#each identityData.addresses.filter(a => a.trim()) as address}
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
                    <p class="text-base font-medium">{identityData?.selectedChain?.name || 'Not selected'}</p>
                </div>
            </div>
        </div>

        <div class="flex flex-col gap-3">
            <Button
                class="w-full {!(isUpdatingProgress || !identityData?.identityType || !identityData?.username || !identityData?.selectedChain?.chain_id) ? 'bg-primary hover:bg-primary/90' : ''}"
                disabled={isUpdatingProgress || !identityData?.identityType || !identityData?.username || !identityData?.selectedChain?.chain_id}
                on:click={handleActivate}
            >
                Activate Profile
            </Button>

            <!-- Mobile Back Button -->
            <Button
                variant="outline"
                class="w-full md:hidden"
                on:click={() => goto('/activate/select-chain')}
            >
                Back
            </Button>
        </div>

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

<!-- Activation Dialog -->
{#if identityData}
<ActivationDialog bind:open={dialogOpen} identityData={identityData} />
{/if}