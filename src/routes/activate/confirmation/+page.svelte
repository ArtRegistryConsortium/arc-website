<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';

let isProcessing = false;

async function handleActivate() {
    isProcessing = true;
    // Here you would typically make API calls to process the activation
    // For now, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    goto('/');
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

        <div class="space-y-6 mb-8 text-left">
            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Fee</p>
                <p class="text-lg font-bold">0.004 ETH ($5)</p>
            </div>

            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Chain</p>
                <p class="text-lg font-bold">Ethereum 🔷</p>
            </div>

            <div class="p-4 rounded-lg border-2 border-border">
                <p class="text-sm text-muted-foreground">Username</p>
                <p class="text-lg font-bold">username.arc</p>
            </div>
        </div>

        <Button
            class="w-full"
            disabled={isProcessing}
            on:click={handleActivate}
        >
            {isProcessing ? 'Processing...' : 'Activate Profile'}
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