<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect, getAccount, reconnect, sendTransaction, waitForTransaction } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import { onMount, onDestroy } from 'svelte';
import { parseEther, type Address } from 'viem';
import { checkActivationStatus, formatCryptoAmount, fetchAvailableChains, type Chain } from '$lib/services/activationService';
import { startPaymentMonitor, stopPaymentMonitor } from '$lib/services/paymentMonitorService';
import { checkExistingSession } from '$lib/stores/walletAuth';

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
let isSendingTransaction = false;
let transactionHash = '';
let transactionError = '';
let transactionStatus = ''; // 'pending', 'confirmed', 'failed'
let isCheckingTransaction = false;
let transactionCheckCount = 0;
let isManuallyVerifying = false;

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
        // Prefer mainnet chains over testnets
        if (chains.length > 0 && !selectedChain) {
            // First try to find a mainnet chain
            const mainnetChain = chains.find(chain => !chain.is_testnet);

            if (mainnetChain) {
                selectedChain = mainnetChain;
                selectedChainId = mainnetChain.chain_id;
            } else {
                // If no mainnet chain is available, use the first chain
                selectedChain = chains[0];
                selectedChainId = chains[0].chain_id;
            }

            console.log('Selected default chain:', selectedChain);
        }

        console.log('Available chains loaded:', availableChains);
    } catch (error) {
        console.error('Failed to load available chains:', error);
        errorMessage = 'Failed to load available payment chains. Please try again.';
    }
}

// Function to handle chain selection
function handleChainSelect(chainId: number) {
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

        console.log('Checking activation status with params:', {
            walletAddress,
            selectedChainId,
            currentStatus: paymentStatus
        });

        // Call the activation service with the selected chain
        const result = await checkActivationStatus(walletAddress, selectedChainId);
        console.log('Activation status result:', result);

        if (!result.success) {
            throw new Error(result.error || 'Failed to check activation status');
        }

        // Update UI based on status
        const previousStatus = paymentStatus;
        paymentStatus = result.status;
        console.log(`Payment status updated: ${previousStatus} -> ${paymentStatus}`);

        // Update available chains if provided
        if (result.availableChains && result.availableChains.length > 0) {
            availableChains = result.availableChains;
            console.log('Available chains updated:', availableChains.length);
        }

        // Update selected chain if provided
        if (result.chain) {
            selectedChain = result.chain;
            selectedChainId = result.chain.chain_id;
            console.log('Selected chain updated:', selectedChain.name);
        }

        if (result.status === 'awaiting_payment' || result.status === 'registration_created') {
            cryptoAmount = result.cryptoAmount || 0;
            validTo = result.validTo || '';
            arcWalletAddress = result.arcWalletAddress || '';
            console.log('Payment details updated:', {
                cryptoAmount,
                validTo,
                arcWalletAddress: arcWalletAddress.substring(0, 10) + '...'
            });

            // Start monitoring for payment if not already monitoring
            if (!isMonitoring && walletAddress) {
                console.log('Starting payment monitoring...');
                startMonitoring(walletAddress, selectedChainId);
            }
        } else if (result.status === 'payment_verified' || result.status === 'payment_confirmed') {
            console.log('Payment confirmed! Redirecting to next step...');
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

// Function to manually verify payment
async function manuallyVerifyPayment() {
    if (!walletAddress) {
        errorMessage = 'No wallet connected. Please connect your wallet first.';
        return;
    }

    try {
        isManuallyVerifying = true;
        errorMessage = '';

        console.log('Manually verifying payment for wallet:', walletAddress);

        const response = await fetch('/api/wallet/manual-verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                walletAddress,
                transactionHash
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to manually verify payment');
        }

        console.log('Manual verification successful:', result);

        // Update UI based on result
        paymentStatus = result.status;

        // Redirect to next step
        if (result.status === 'payment_verified' || result.status === 'payment_confirmed') {
            await goto(result.nextStep || '/activate/select-chain');
        }
    } catch (error) {
        console.error('Error manually verifying payment:', error);
        errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
        isManuallyVerifying = false;
    }
}



// Function to check transaction status
async function checkTransactionStatus(hash: string) {
    if (isCheckingTransaction || !hash) return;

    try {
        isCheckingTransaction = true;
        transactionCheckCount++;

        console.log(`Checking transaction status (attempt ${transactionCheckCount})...`);

        // Get transaction receipt
        const receipt = await waitForTransaction(config, {
            hash,
            timeout: 15000 // 15 seconds timeout
        });

        console.log('Transaction receipt:', receipt);

        // Check transaction status - receipt.status is a number (0 = failure, 1 = success)
        if (receipt && receipt.status === 1) {
            console.log('Transaction confirmed successfully!');
            transactionStatus = 'confirmed';

            // Check activation status to update UI
            await checkWalletActivationStatus();

            // If the activation status check didn't detect the payment, manually check again after a delay
            // This gives the backend time to process the transaction
            if (paymentStatus !== 'payment_verified' && paymentStatus !== 'payment_confirmed') {
                console.log('Payment not yet detected by backend, scheduling another check...');
                setTimeout(async () => {
                    console.log('Performing delayed activation status check...');
                    await checkWalletActivationStatus();
                }, 5000); // Check again after 5 seconds
            }
        } else {
            console.log('Transaction failed or is still pending');
            transactionStatus = receipt && receipt.status === 0 ? 'failed' : 'pending';

            // If still pending and we haven't checked too many times, check again
            if (transactionStatus === 'pending' && transactionCheckCount < 10) {
                setTimeout(() => checkTransactionStatus(hash), 10000); // Check again in 10 seconds
            }
        }
    } catch (error) {
        console.error('Error checking transaction status:', error);

        // If it's a timeout error, the transaction might still be pending
        if (error.message?.includes('timeout') && transactionCheckCount < 10) {
            transactionStatus = 'pending';
            setTimeout(() => checkTransactionStatus(hash), 10000); // Check again in 10 seconds
        } else {
            transactionStatus = 'unknown';
        }
    } finally {
        isCheckingTransaction = false;
    }
}

// Function to send the transaction
async function sendPayment() {
    // Check if wallet is connected
    const account = getAccount(config);
    if (!account.isConnected || !account.address) {
        transactionError = 'Wallet not connected. Please connect your wallet first.';
        return;
    }

    // Ensure we have all required parameters
    if (!arcWalletAddress) {
        transactionError = 'ARC wallet address not found. Please refresh the page.';
        return;
    }

    if (cryptoAmount <= 0) {
        transactionError = `Invalid amount: ${cryptoAmount}. Please refresh the page.`;
        return;
    }

    try {
        isSendingTransaction = true;
        transactionError = '';
        transactionHash = '';

        // Use the current connected wallet address
        const currentWalletAddress = account.address;

        // Debug the values
        console.log('Debug values:', {
            cryptoAmount,
            arcWalletAddress,
            selectedChainId,
            currentWalletAddress
        });

        // Ensure cryptoAmount is a valid number and format it properly
        if (typeof cryptoAmount !== 'number' || isNaN(cryptoAmount) || cryptoAmount <= 0) {
            throw new Error(`Invalid crypto amount: ${cryptoAmount}`);
        }

        // Format with fixed precision to avoid scientific notation
        // Remove trailing zeros to avoid parsing issues
        const formattedAmount = cryptoAmount.toString();
        console.log('Formatted amount:', formattedAmount);

        // Try different parsing approaches
        let amount: bigint;
        try {
            // First try the standard parseEther
            amount = parseEther(formattedAmount);
        } catch (parseError) {
            console.error('Error with parseEther:', parseError);

            // Fallback: manually calculate the wei amount (1 ETH = 10^18 wei)
            try {
                // Convert to a number with 18 decimal places
                const ethValue = Number(formattedAmount);
                // Convert to wei (multiply by 10^18)
                const weiValue = Math.floor(ethValue * 1e18).toString();
                amount = BigInt(weiValue);
            } catch (fallbackError) {
                console.error('Error with fallback calculation:', fallbackError);
                throw new Error(`Failed to convert ${formattedAmount} to wei: ${fallbackError.message}`);
            }
        }

        console.log('Parsed amount (wei):', amount.toString());

        console.log(`Sending ${formattedAmount} ${selectedChain?.symbol || 'ETH'} to ${arcWalletAddress}`);

        // Prepare transaction parameters
        const txParams: {
            to: Address;
            value: bigint;
            chainId?: number;
        } = {
            to: arcWalletAddress as Address,
            value: amount
        };

        // Only add chainId if it's defined
        if (selectedChainId !== undefined) {
            txParams.chainId = selectedChainId;
        }

        console.log('Transaction params:', txParams);

        // Send the transaction
        const { hash } = await sendTransaction(config, txParams);

        console.log('Transaction sent:', hash);
        transactionHash = hash;
        transactionStatus = 'pending';

        // Start checking transaction status
        checkTransactionStatus(hash);

        // Don't wait for confirmation here - we'll check status separately
        // This allows the UI to remain responsive
    } catch (error) {
        console.error('Error sending transaction:', error);

        // Log detailed error information
        if (error instanceof Error) {
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            // Check for specific error types
            if (error.message.includes('BigInt')) {
                console.error('BigInt conversion error detected. Current values:', {
                    cryptoAmount,
                    formattedAmount,
                    amount: amount?.toString() || 'undefined'
                });
                transactionError = 'Error with crypto amount conversion. Please try a different amount or chain.';
            } else {
                transactionError = error.message;
            }
        } else {
            transactionError = 'Failed to send transaction: Unknown error';
        }
    } finally {
        isSendingTransaction = false;
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

            {#if availableChains.length > 0}
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-3 text-center">Select payment chain:</label>
                    <div class="flex flex-wrap gap-2 justify-center">
                        {#each availableChains as chain}
                            <button
                                type="button"
                                class="flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors
                                       ${selectedChainId === chain.chain_id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/50'}"
                                on:click={() => handleChainSelect(chain.chain_id)}
                            >
                                {#if chain.icon_url}
                                    <img
                                        src={chain.icon_url}
                                        alt={chain.name}
                                        class="w-5 h-5"
                                        on:error={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.onerror = null;
                                            img.src = `https://placehold.co/20x20/svg?text=${chain.symbol || 'ETH'}`;
                                        }}
                                    />
                                {:else}
                                    <div class="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                        {chain.symbol || 'ETH'}
                                    </div>
                                {/if}
                                <span>{chain.name}</span>
                                {#if chain.is_testnet}
                                    <span class="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Test</span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="text-3xl font-bold mb-4">
                {formatCryptoAmount(cryptoAmount)} {cryptoSymbol}
            </div>

            <div class="bg-muted p-4 rounded-md mb-6 text-left">
                {#if selectedChain}
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-background rounded-md mb-3">
                        {#if selectedChain.icon_url}
                            <img
                                src={selectedChain.icon_url}
                                alt={selectedChain.name}
                                class="w-5 h-5"
                                on:error={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.onerror = null;
                                    img.src = `https://placehold.co/20x20/svg?text=${selectedChain.symbol || 'ETH'}`;
                                }}
                            />
                        {:else}
                            <div class="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {selectedChain.symbol || 'ETH'}
                            </div>
                        {/if}
                        <span class="font-medium text-sm">{selectedChain.name}</span>
                        {#if selectedChain.is_testnet}
                            <span class="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Test</span>
                        {/if}
                    </div>
                {/if}

                <p class="text-sm mb-2">Send exactly <span class="font-bold">{formatCryptoAmount(cryptoAmount)} {cryptoSymbol}</span> to:</p>
                <div class="flex items-center gap-2 mb-3">
                    <code class="bg-background p-2 rounded text-xs flex-1 overflow-hidden text-ellipsis">{arcWalletAddress}</code>
                    <Button variant="outline" size="sm" on:click={copyArcWalletAddress}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </Button>
                </div>

                <div class="bg-background p-3 rounded mb-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-muted-foreground">Amount:</span>
                        <span class="text-sm font-medium">{formatCryptoAmount(cryptoAmount)} {cryptoSymbol}</span>
                    </div>
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-muted-foreground">USD Value:</span>
                        <span class="text-sm">${usdEquivalent}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-muted-foreground">Valid until:</span>
                        <span class="text-sm">{formattedValidUntil}</span>
                    </div>
                </div>

                <p class="text-xs text-muted-foreground">Make sure to send the exact amount from your connected wallet.</p>

                {#if transactionHash}
                    <div class="mt-3 p-3 rounded-md
                        {transactionStatus === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                         transactionStatus === 'failed' ? 'bg-destructive/10 text-destructive' :
                         'bg-primary/10 text-primary'}">
                        <div class="flex items-center gap-2 mb-1">
                            {#if transactionStatus === 'pending'}
                                <span class="inline-block h-3 w-3 animate-pulse rounded-full bg-primary"></span>
                                <p class="text-sm font-medium">Transaction Pending</p>
                            {:else if transactionStatus === 'confirmed'}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <p class="text-sm font-medium">Transaction Confirmed!</p>
                            {:else if transactionStatus === 'failed'}
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <p class="text-sm font-medium">Transaction Failed</p>
                            {:else}
                                <p class="text-sm font-medium">Transaction Sent!</p>
                            {/if}
                        </div>

                        <p class="text-xs mb-2">
                            {#if transactionStatus === 'pending'}
                                Your transaction is being processed. This may take a few minutes.
                            {:else if transactionStatus === 'confirmed'}
                                Your payment has been confirmed! You can now proceed to the next step.
                            {:else if transactionStatus === 'failed'}
                                Your transaction failed. Please try again or send the payment manually.
                            {:else}
                                Your transaction has been submitted to the blockchain.
                            {/if}
                        </p>

                        <div class="flex items-center gap-2">
                            <span class="text-xs text-muted-foreground">Tx Hash:</span>
                            <code class="text-xs bg-background p-1 rounded flex-1 overflow-hidden text-ellipsis">{transactionHash}</code>
                        </div>
                    </div>
                {/if}

                {#if transactionError}
                    <div class="mt-3 p-3 bg-destructive/10 text-destructive rounded-md">
                        <p class="text-sm font-medium mb-1">Transaction Failed</p>
                        <p class="text-xs">{transactionError}</p>
                    </div>
                {/if}
            </div>

            <div class="flex flex-col gap-3">
                {#if transactionStatus === 'confirmed'}
                    <!-- Show next step button when transaction is confirmed -->
                    <Button
                        class="w-full"
                        variant="default"
                        on:click={() => goto('/activate/select-chain')}
                    >
                        Continue to Next Step
                    </Button>
                {:else if transactionStatus === 'pending'}
                    <!-- Show checking status when transaction is pending -->
                    <Button
                        class="w-full"
                        variant="default"
                        disabled={isCheckingTransaction}
                        on:click={() => checkTransactionStatus(transactionHash)}
                    >
                        {#if isCheckingTransaction}
                            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Checking Status...
                        {:else}
                            Check Transaction Status
                        {/if}
                    </Button>

                    <Button
                        class="w-full"
                        variant="outline"
                        on:click={checkWalletActivationStatus}
                    >
                        I've Completed the Payment
                    </Button>

                    <Button
                        class="w-full mt-2"
                        variant="destructive"
                        disabled={isManuallyVerifying}
                        on:click={manuallyVerifyPayment}
                    >
                        {#if isManuallyVerifying}
                            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Verifying...
                        {:else}
                            Force Verification (Admin)
                        {/if}
                    </Button>
                {:else}
                    <!-- Show send payment button when no transaction or transaction failed -->
                    <Button
                        class="w-full"
                        variant="default"
                        disabled={isSendingTransaction}
                        on:click={sendPayment}
                    >
                        {#if isSendingTransaction}
                            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Sending...
                        {:else}
                            Send {formatCryptoAmount(cryptoAmount)} {cryptoSymbol}
                        {/if}
                    </Button>

                    <Button
                        class="w-full"
                        variant="outline"
                        disabled={isSendingTransaction}
                        on:click={checkWalletActivationStatus}
                    >
                        I've Sent the Payment Manually
                    </Button>

                    <Button
                        class="w-full mt-2"
                        variant="destructive"
                        disabled={isManuallyVerifying}
                        on:click={manuallyVerifyPayment}
                    >
                        {#if isManuallyVerifying}
                            <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                            Verifying...
                        {:else}
                            Force Verification (Admin)
                        {/if}
                    </Button>
                {/if}
            </div>
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