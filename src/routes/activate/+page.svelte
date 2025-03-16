<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import { onMount, onDestroy } from 'svelte';
import { getAccount, reconnect } from 'wagmi/actions';
import type { Address } from 'viem';
import { checkActivationStatus, formatCryptoAmount, fetchAvailableChains, type Chain } from '$lib/services/activationService';
import { startPaymentMonitor, stopPaymentMonitor } from '$lib/services/paymentMonitorService';
import { checkExistingSession } from '$lib/stores/walletAuth';
// Comment out the missing UI components for now
// import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "$lib/components/ui/select";

// State variables
let cryptoAmount = 0;
let usdEquivalent = 5;
let arcWalletAddress = '';
let validTo = '';
let isLoading = true;
let errorMessage = '';
let paymentStatus = 'checking'; // 'checking', 'awaiting_payment', 'payment_verified', 'payment_confirmed'
let walletAddress: Address | undefined;
let isMonitoring = false;
let availableChains: Chain[] = [];
let selectedChain: Chain | undefined;
let selectedChainId: number | undefined;

// Format the valid until date
$: formattedValidUntil = validTo ? new Date(validTo).toLocaleString() : '';

// Format the crypto symbol
$: cryptoSymbol = selectedChain?.symbol || 'ETH';

// Function to load available chains
async function loadAvailableChains() {
    try {
        const chains = await fetchAvailableChains();
        availableChains = chains;

        // If chains are available, select the first one by default
        if (chains.length > 0 && !selectedChain) {
            selectedChain = chains[0];
            selectedChainId = chains[0].chain_id;
        }

        console.log('Available chains loaded:', availableChains);
    } catch (error) {
        console.error('Failed to load available chains:', error);
        errorMessage = 'Failed to load available payment chains. Please try again.';
    }
}

// Function to handle chain selection
function handleChainSelect(event: CustomEvent<string>) {
    const chainId = parseInt(event.detail);
    selectedChainId = chainId;
    selectedChain = availableChains.find(chain => chain.chain_id === chainId);
    console.log('Selected chain:', selectedChain);

    // Refresh activation status with the new chain
    if (walletAddress) {
        checkWalletActivationStatus();
    }
}

// Function to check activation status
async function checkWalletActivationStatus() {
    try {
        isLoading = true;
        errorMessage = '';

        // Get the current wallet address
        const account = getAccount(config);
        console.log('Current account state:', account);

        // Check if we have a wallet address from the account
        if (account.address) {
            walletAddress = account.address;
            console.log('Using wallet address from account:', walletAddress);
        }
        // If not, try to get it from localStorage (session)
        else {
            const sessionAddress = localStorage.getItem('wallet_session_address');
            console.log('Session address from localStorage:', sessionAddress);

            if (sessionAddress) {
                walletAddress = sessionAddress as Address;
                console.log('Using wallet address from session:', walletAddress);
            }
        }

        if (!walletAddress) {
            errorMessage = 'No wallet connected. Please connect your wallet first.';
            console.error('No wallet address found in account or session');
            isLoading = false;
            return;
        }

        // Load available chains if not already loaded
        if (availableChains.length === 0) {
            await loadAvailableChains();
        }

        // Call the activation service with the selected chain
        const result = await checkActivationStatus(walletAddress, selectedChainId);

        if (!result.success) {
            throw new Error(result.error || 'Failed to check activation status');
        }

        // Update UI based on status
        paymentStatus = result.status;

        // Update available chains if provided
        if (result.availableChains && result.availableChains.length > 0) {
            availableChains = result.availableChains;
        }

        // Update selected chain if provided
        if (result.chain) {
            selectedChain = result.chain;
            selectedChainId = result.chain.chain_id;
        }

        if (result.status === 'awaiting_payment' || result.status === 'registration_created') {
            cryptoAmount = result.cryptoAmount || 0;
            validTo = result.validTo || '';
            arcWalletAddress = result.arcWalletAddress || '';

            // Start monitoring for payment if not already monitoring
            if (!isMonitoring && walletAddress) {
                startMonitoring(walletAddress, selectedChainId);
            }
        } else if (result.status === 'payment_verified' || result.status === 'payment_confirmed') {
            // Redirect to next step
            await goto(result.nextStep || '/activate/select-chain');
        }
    } catch (error) {
        console.error('Error checking activation status:', error);
        errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
        isLoading = false;
    }
}

// Function to copy ARC wallet address to clipboard
async function copyArcWalletAddress() {
    try {
        await navigator.clipboard.writeText(arcWalletAddress);
        alert('ARC wallet address copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy address:', error);
        alert('Failed to copy address. Please copy it manually.');
    }
}

// Start monitoring for payment
function startMonitoring(address: Address, chainId?: number) {
    isMonitoring = true;

    // Start the payment monitor
    startPaymentMonitor(
        address,
        // Success callback
        () => {
            console.log('Payment confirmed!');
            goto('/activate/select-chain');
        },
        // Error callback
        (error) => {
            console.error('Payment monitor error:', error);
            // Don't show errors from the monitor to the user
            // Just keep checking manually
        },
        // Chain ID
        chainId
    );
}

// Function to close the page and return to home
async function closePage() {
    // Set the flag to prevent automatic redirection back to activate pages
    setUserClosedActivatePage(true);
    console.log('Closing activate page, flag set to prevent auto-redirect');

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

        console.log('Logged out from activate page');

        // Navigate to home page
        await goto('/');
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Function to manually reconnect wallet
async function reconnectWallet() {
    try {
        console.log('Attempting to reconnect wallet...');
        isLoading = true;

        // Check for existing session first
        const hasSession = checkExistingSession();
        console.log('Has existing session:', hasSession);

        // Try to reconnect using wagmi
        await reconnect(config);

        // Get the account after reconnection
        const account = getAccount(config);
        console.log('Account after reconnection:', account);

        // Check activation status again
        await checkWalletActivationStatus();
    } catch (error) {
        console.error('Error reconnecting wallet:', error);
        errorMessage = 'Failed to reconnect wallet. Please try connecting manually.';
    } finally {
        isLoading = false;
    }
}

// Check activation status on mount and clean up on destroy
onMount(async () => {
    // Load available chains first
    await loadAvailableChains();

    // Try to reconnect wallet, then check activation status
    reconnectWallet();
});

onDestroy(() => {
    // Stop payment monitoring when component is destroyed
    if (walletAddress && isMonitoring) {
        stopPaymentMonitor(walletAddress);
        isMonitoring = false;
    }
});
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
    <ProgressSteps currentStep={1} />

    <!-- Main content -->
    <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Activate Your Profile</h1>

        {#if isLoading}
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        {:else if errorMessage}
            <div class="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                <p>{errorMessage}</p>
            </div>
            <div class="flex flex-col gap-3">
                <Button
                    class="w-full"
                    on:click={checkWalletActivationStatus}
                >
                    Try Again
                </Button>

                {#if errorMessage.includes('No wallet connected')}
                    <Button
                        variant="outline"
                        class="w-full"
                        on:click={reconnectWallet}
                    >
                        Reconnect Wallet
                    </Button>

                    <Button
                        variant="ghost"
                        class="w-full"
                        on:click={() => {
                            // Open Web3Modal for manual connection
                            const w3mButton = document.querySelector('w3m-button');
                            if (w3mButton) {
                                // @ts-ignore - This is a custom element method
                                w3mButton.click();
                            } else {
                                console.error('Web3Modal button not found');
                            }
                        }}
                    >
                        Connect Manually
                    </Button>
                {/if}
            </div>
        {:else if paymentStatus === 'awaiting_payment' || paymentStatus === 'registration_created'}
            <p class="text-lg mb-4">
                A one-time ${usdEquivalent} USD fee is required to register on ARC.
            </p>

            {#if availableChains.length > 1}
                <div class="mb-6">
                    <label for="chain-select" class="block text-sm font-medium mb-2">Select payment chain:</label>
                    <!-- Temporarily replaced with a simple select element -->
                    <select
                        id="chain-select"
                        class="w-full p-2 rounded-md border border-input bg-background"
                        value={selectedChainId?.toString()}
                        on:change={(e) => {
                            const target = e.target as HTMLSelectElement;
                            if (target) {
                                handleChainSelect(new CustomEvent('valueChange', { detail: target.value }));
                            }
                        }}
                    >
                        {#each availableChains as chain}
                            <option value={chain.chain_id.toString()}>
                                {chain.name} {chain.is_testnet ? '(Testnet)' : ''}
                            </option>
                        {/each}
                    </select>
                </div>
            {/if}

            <div class="text-3xl font-bold mb-4">
                {formatCryptoAmount(cryptoAmount)} {cryptoSymbol}
            </div>

            <div class="bg-muted p-4 rounded-md mb-6 text-left">
                <p class="text-sm mb-2">Send exactly <span class="font-bold">{formatCryptoAmount(cryptoAmount)} {cryptoSymbol}</span> to:</p>
                <div class="flex items-center gap-2 mb-2">
                    <code class="bg-background p-2 rounded text-xs flex-1 overflow-hidden text-ellipsis">{arcWalletAddress}</code>
                    <Button variant="outline" size="sm" on:click={copyArcWalletAddress}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </Button>
                </div>
                {#if selectedChain}
                    <p class="text-xs mb-1">Network: <span class="font-semibold">{selectedChain.name}</span></p>
                {/if}
                <p class="text-xs text-muted-foreground">Valid until: {formattedValidUntil}</p>
            </div>

            <Button
                class="w-full"
                on:click={checkWalletActivationStatus}
            >
                I've Sent the Payment
            </Button>
        {:else}
            <div class="bg-primary/10 text-primary p-4 rounded-md mb-6">
                <p>Checking payment status...</p>
            </div>
            <Button
                class="w-full"
                on:click={checkWalletActivationStatus}
            >
                Check Again
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