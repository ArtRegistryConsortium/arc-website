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

const identityTypes = [
    { id: 'artist', name: 'Artist', description: 'For individual artists and creators' },
    { id: 'gallery', name: 'Gallery', description: 'For art galleries and exhibition spaces' },
    { id: 'institution', name: 'Institution', description: 'For museums and cultural institutions' },
    { id: 'collector', name: 'Collector', description: 'For art collectors and enthusiasts' },
    { id: 'custodian', name: 'Custodian', description: 'For custodians and caretakers of art collections' }
];

let selectedType: string | null = null;
let isUpdatingProgress = false;
let errorMessage = '';

// On mount, update the setup progress and load previous selection if available
onMount(async () => {
    // Load previously selected identity type from store if available
    const unsubscribe = identityStore.subscribe(state => {
        if (state.identityType) {
            selectedType = state.identityType;
            console.log('Loaded previously selected identity type:', selectedType);
        }
    });

    // Unsubscribe to avoid memory leaks
    unsubscribe();

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

            // Only update if current step is less than this page's step (1)
            if (result.success && result.data && result.data.setup_step < 1) {
                isUpdatingProgress = true;
                const updateResult = await updateSetupProgress(walletAddress, 1);
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

async function handleContinue() {
    if (selectedType) {
        // Store the selected identity type in the store
        identityStore.setIdentityType(selectedType as 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian');

        // Update setup progress to the next step (2 - Identity Data)
        const walletAddress = getWalletAddress();
        if (walletAddress) {
            try {
                const result = await updateSetupProgress(walletAddress, 2);
                if (!result.success) {
                    console.error('Failed to update setup progress:', result.error);
                }
            } catch (error) {
                console.error('Error updating setup progress:', error);
            }
        }

        goto('/activate/identity-data');
    }
}

// Function to close the page and return to home
async function closePage() {
    // Set the flag to prevent automatic redirection back to activate pages
    setUserClosedActivatePage(true);
    console.log('Closing identity type page, flag set to prevent auto-redirect');

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

        console.log('Logged out from identity type page');

        // Navigate to home page
        await goto('/');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative">
    <PaymentCheck currentStep={2} />
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
    <ProgressSteps currentStep={2} />

    <!-- Main content -->
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Choose Identity Type</h1>

        <p class="text-lg mb-8">
            Select the type of identity you want to create
        </p>

        <div class="grid gap-4 mb-8">
            {#each identityTypes as type}
                <button
                    class="w-full p-4 rounded-lg border-2 transition-all flex flex-col items-start text-left
                        {selectedType === type.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}"
                    on:click={() => selectedType = type.id}
                >
                    <span class="text-xl font-medium mb-1">{type.name}</span>
                    <span class="text-sm text-muted-foreground">{type.description}</span>
                </button>
            {/each}
        </div>

        <Button
            class="w-full"
            disabled={!selectedType}
            on:click={handleContinue}
        >
            Continue
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
