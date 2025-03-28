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

let username = '';
let isValid = false;
let isUpdatingProgress = false;
let errorMessage = '';

// On mount, update the setup progress and load previous input if available
onMount(async () => {
    // Load previously entered username from store if available
    const unsubscribe = identityStore.subscribe(state => {
        if (state.username) {
            username = state.username;
            isValid = validateUsername(username);
            console.log('Loaded previously entered username:', username);
        }
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

function validateUsername(value: string) {
    // Allow letters (both uppercase and lowercase), numbers, and hyphens
    const regex = /^[a-zA-Z0-9-]+$/;
    return regex.test(value) && value.length >= 3 && value.length <= 20;
}

function handleInput(event: Event) {
    const input = event.target as HTMLInputElement;
    username = input.value;
    isValid = validateUsername(username);
}

async function handleContinue() {
    if (isValid) {
        // Store the username in the store
        identityStore.setUsername(username);

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
    console.log('Closing create-identity page, flag set to prevent auto-redirect');

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

        console.log('Logged out from create-identity page');

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
    <ProgressSteps currentStep={3} />

    <!-- Main content -->
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Identity Data</h1>

        <p class="text-lg mb-8">
            Choose your username for your on-chain identity
        </p>

        <div class="mb-8">
            <input
                type="text"
                placeholder="username"
                class="w-full p-4 text-lg border-2 bg-background
                    {isValid ? 'border-primary' : 'border-border'}
                    focus:outline-none focus:border-primary transition-colors"
                value={username}
                on:input={handleInput}
            />
            <p class="text-sm text-muted-foreground mt-2">
                3-20 characters, lowercase letters, numbers, and hyphens only
            </p>
        </div>

        <Button
            class="w-full"
            disabled={!isValid}
            on:click={handleContinue}
        >
            Continue
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