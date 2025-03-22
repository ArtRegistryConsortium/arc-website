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

let isProcessing = false;
let isUpdatingProgress = false;
let errorMessage = '';
let successMessage = '';
let transactionHash = '';
let identityId = 0;

// Subscribe to the identity store
let identityType = '';
let username = '';
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

        // Create the identity
        const result = await createIdentity({
            walletAddress,
            identityType: mapIdentityType(identityType),
            name: username,
            chainId,
            description: `${username} on ${chainName}`,
            links: [],
            tags: [identityType]
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
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Ready to Activate</h1>

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

        <div class="space-y-6 mb-8 text-left">
            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Identity Type</p>
                <p class="text-lg font-bold capitalize">{identityType || 'Not selected'}</p>
            </div>

            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Username</p>
                <p class="text-lg font-bold">{username || 'Not set'}</p>
            </div>

            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Chain</p>
                <p class="text-lg font-bold">{chainName || 'Not selected'}</p>
            </div>
        </div>

        <Button
            class="w-full"
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