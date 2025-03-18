<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession, getWalletAddress } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import { identityStore } from '$lib/stores/identityStore';
import { updateSetupProgress } from '$lib/services/setupProgressService';
import { onMount } from 'svelte';
import type { Chain } from '$lib/services/activationService';

let availableChains: Chain[] = [];
let selectedChainId: number | null = null;
let isLoading = true;
let isUpdatingProgress = false;
let errorMessage = '';

// On mount, fetch available chains and update the setup progress
onMount(async () => {
    const walletAddress = getWalletAddress();
    if (walletAddress) {
        try {
            isUpdatingProgress = true;
            const result = await updateSetupProgress(walletAddress, 3);
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

    // Fetch available chains
    try {
        const response = await fetch('/api/chains');
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            availableChains = data.chains;
        } else {
            errorMessage = data.error || 'Failed to load chains';
        }
    } catch (error) {
        console.error('Error fetching chains:', error);
        errorMessage = error instanceof Error ? error.message : 'Failed to load chains';
    } finally {
        isLoading = false;
    }
});

async function handleContinue() {
    if (selectedChainId) {
        // Find the selected chain object
        const selectedChain = availableChains.find(chain => chain.chain_id === selectedChainId);
        if (selectedChain) {
            // Store the selected chain in the store
            identityStore.setSelectedChain(selectedChain);

            // Update setup progress to the next step (4 - Confirmation)
            const walletAddress = getWalletAddress();
            if (walletAddress) {
                try {
                    const result = await updateSetupProgress(walletAddress, 4);
                    if (!result.success) {
                        console.error('Failed to update setup progress:', result.error);
                    }
                } catch (error) {
                    console.error('Error updating setup progress:', error);
                }
            }

            goto('/activate/confirmation');
        } else {
            errorMessage = 'Selected chain not found';
        }
    }
}

// Function to close the page and return to home
async function closePage() {
    // Set the flag to prevent automatic redirection back to activate pages
    setUserClosedActivatePage(true);
    console.log('Closing select-chain page, flag set to prevent auto-redirect');

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

        console.log('Logged out from select-chain page');

        // Navigate to home page
        await goto('/');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative">
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
    <ProgressSteps currentStep={4} />

    <!-- Main content -->
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Select Chain</h1>

        <p class="text-lg mb-8">
            Choose the blockchain where you want to create your identity
        </p>

        {#if isLoading}
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        {:else if errorMessage}
            <div class="p-4 mb-6 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg">
                <p>{errorMessage}</p>
            </div>
        {:else if availableChains.length === 0}
            <div class="p-4 mb-6 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg">
                <p>No chains available for identity creation. Please contact support.</p>
            </div>
        {:else}
            <div class="grid gap-4 mb-8">
                {#each availableChains as chain}
                    <button
                        class="w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between
                            {selectedChainId === chain.chain_id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
                        on:click={() => selectedChainId = chain.chain_id}
                    >
                        <span class="text-xl">{chain.name}</span>
                        {#if chain.icon_url}
                            <img src={chain.icon_url} alt={chain.name} class="h-6 w-6" />
                        {:else}
                            <span class="text-2xl">{chain.symbol || '⛓️'}</span>
                        {/if}
                    </button>
                {/each}
            </div>

            <Button
                class="w-full"
                disabled={!selectedChainId}
                on:click={handleContinue}
            >
                Continue
            </Button>
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