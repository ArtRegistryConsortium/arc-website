<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { goto } from '$app/navigation';
import { setUserClosedActivatePage } from '$lib/stores/navigationState';
import { disconnect, getAccount, reconnect, sendTransaction, waitForTransaction, getChainId, switchChain, watchChainId, connect } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { clearSession } from '$lib/stores/walletAuth';
import ProgressSteps from '$lib/components/ProgressSteps.svelte';
import { onMount, onDestroy } from 'svelte';
import { parseEther, type Address } from 'viem';
import { checkActivationStatus, formatCryptoAmount, fetchAvailableChains, type Chain } from '$lib/services/activationService';
import { startPaymentMonitor, stopPaymentMonitor } from '$lib/services/paymentMonitorService';
import { checkExistingSession, getWalletAddress, setWalletAddressCookie } from '$lib/stores/walletAuth';
import { updateSetupProgress } from '$lib/services/setupProgressService';
import { web3Store } from '$lib/stores/web3';
import { injected, walletConnect } from 'wagmi/connectors';
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
import { truncateAddress } from '$lib/utils/web3';

// Get WalletConnect project ID from environment variable
const projectId = PUBLIC_WALLETCONNECT_ID || '';

// State variables
let cryptoAmount = 0;
let usdEquivalent = 5;
let arcWalletAddress = '';
let validTo = '';
let isLoading = true; // Only for initial page load
let errorMessage = '';
let statusMessage = ''; // For neutral status messages like switching chains
let isVerifying = false; // For transaction verification
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
let transactionWasSent = false; // Track if transaction was sent using the button

// Wallet connection state
let showWalletOptions = false;
let isConnected = false;

// Subscribe to web3Store
$: {
    isConnected = $web3Store.isConnected;

    // When wallet is connected, set the wallet address cookie
    if (isConnected && $web3Store.address) {
        setWalletAddressCookie($web3Store.address);
    }
}

// Format the valid until date
$: formattedValidUntil = validTo ? new Date(validTo).toLocaleString() : '';

// Format the crypto symbol
$: cryptoSymbol = selectedChain?.symbol || 'ETH';

// Function to load available chains
async function loadAvailableChains() {
    try {
        const chains = await fetchAvailableChains();
        availableChains = chains;

        // Get the current chain ID from the connected wallet
        const currentChainId = await getChainId(config);
        console.log('Current wallet chain ID:', currentChainId);

        // If chains are available, select the appropriate one
        if (chains.length > 0 && !selectedChain) {
            // First try to match the current wallet chain
            const walletChain = chains.find(chain => chain.chain_id === currentChainId);

            if (walletChain) {
                // Use the chain that matches the wallet's current chain
                selectedChain = walletChain;
                selectedChainId = walletChain.chain_id;
                console.log('Selected chain matching wallet:', selectedChain);
            } else {
                // If wallet chain is not supported, try to find a mainnet chain
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
        }

        console.log('Available chains loaded:', availableChains);
    } catch (error) {
        console.error('Failed to load available chains:', error);
        errorMessage = 'Failed to load available payment chains. Please try again.';
    }
}

// Function to handle chain selection
async function handleChainSelect(chainId: number) {
    try {
        // Update the selected chain in the UI
        selectedChainId = chainId;
        selectedChain = availableChains.find(chain => chain.chain_id === chainId);
        console.log('Selected chain:', selectedChain);

        // Reset transaction-related flags when changing chains
        transactionWasSent = false;

        // Get the current chain ID from the wallet
        const currentChainId = await getChainId(config);

        // If the selected chain is different from the current wallet chain, switch the chain
        if (currentChainId !== chainId) {
            console.log(`Switching wallet from chain ${currentChainId} to chain ${chainId}...`);

            try {
                // Show switching message
                statusMessage = 'Switching chain in wallet...';
                errorMessage = ''; // Clear any existing error messages

                // Request the wallet to switch to the selected chain
                // Cast chainId to support all our chains
                await switchChain(config, { chainId: chainId as 1 | 11155111 | 10 | 42161 | 8453 });

                console.log('Chain switched successfully');
                statusMessage = ''; // Clear the status message on success
            } catch (switchError) {
                console.error('Failed to switch chain:', switchError);
                errorMessage = 'Failed to switch chain. Please switch manually in your wallet.';
                statusMessage = ''; // Clear the status message on error
            }
        }

        // Refresh activation status with the new chain to get the correct ARC wallet address
        if (walletAddress) {
            console.log(`Checking activation status for chain ${chainId} to get the correct ARC wallet address`);
            await checkWalletActivationStatus(false);
        }
    } catch (error) {
        console.error('Error handling chain selection:', error);
        errorMessage = 'Error selecting chain. Please try again.';
    }
}

// Variable to track verification interval
let verificationInterval: number | null = null;

// Function to start periodic verification
function startPeriodicVerification() {
    // Clear any existing interval
    if (verificationInterval) {
        clearInterval(verificationInterval);
    }

    // Set isVerifying state
    isVerifying = true;

    // Do an immediate check
    checkWalletActivationStatus(false);

    // Set up interval to check every 10 seconds
    verificationInterval = setInterval(() => {
        checkWalletActivationStatus(false);
    }, 10000) as unknown as number; // Cast to number for TypeScript
}

// Function to stop periodic verification
function stopPeriodicVerification() {
    if (verificationInterval) {
        clearInterval(verificationInterval);
        verificationInterval = null;
    }
    isVerifying = false;
}

// Function to check activation status
async function checkWalletActivationStatus(startPeriodic = false) {
    try {
        // Only start periodic verification if explicitly requested
        // This prevents automatic verification on page load
        if (startPeriodic && !isVerifying) {
            startPeriodicVerification();
        }
        errorMessage = '';
        statusMessage = '';

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

        // Call the activation service with the selected chain and transaction hash if provided
        const result = await checkActivationStatus(walletAddress, selectedChainId, transactionHash || undefined);
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
                arcWalletAddress: arcWalletAddress,
                chainId: selectedChainId
            });

            // Log the ARC wallet address in different formats for debugging
            console.log('ARC wallet address formats:', {
                original: arcWalletAddress,
                lowercase: arcWalletAddress.toLowerCase(),
                checksummed: arcWalletAddress,
                length: arcWalletAddress.length,
                chainId: selectedChainId
            });

            // Start monitoring for payment if not already monitoring
            if (!isMonitoring && walletAddress) {
                console.log('Starting payment monitoring...');
                startMonitoring(walletAddress, selectedChainId);
            }
        } else if (result.status === 'payment_verified' || result.status === 'payment_confirmed') {
            console.log('Payment confirmed! Showing success message...');
            // Stop periodic verification
            stopPeriodicVerification();
            // Set payment status to confirmed
            paymentStatus = 'payment_confirmed';

            // Check for existing identities on all chains
            if (walletAddress) {
                try {
                    console.log('Checking for existing identities on all chains after payment confirmation...');

                    // Check for existing identities on all chains
                    const checkResponse = await fetch('/api/identity/check-all-chains', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ walletAddress })
                    });

                    if (!checkResponse.ok) {
                        console.error(`Server responded with status: ${checkResponse.status}`);
                    } else {
                        const checkResult = await checkResponse.json();
                        console.log('Identity check result after payment:', checkResult);

                        // If identities were found, we'll let the user click the continue button
                        // which will redirect them to the dashboard
                        if (checkResult.success && checkResult.identitiesFound > 0) {
                            console.log(`Found ${checkResult.identitiesFound} existing identities on blockchain.`);
                            // Don't redirect automatically - let the user click the continue button
                        }
                    }

                    // Ensure setup_step is updated to 1 when payment is confirmed
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

                    const statusResult = await response.json();

                    // Only update if current step is less than 1
                    if (statusResult.success && statusResult.data && statusResult.data.setup_step < 1) {
                        console.log('Automatically updating setup progress to step 1 after payment confirmation');
                        const progressResult = await updateSetupProgress(walletAddress, 1);
                        if (!progressResult.success) {
                            console.error('Failed to update setup progress after payment confirmation:', progressResult.error);
                        } else {
                            console.log('Setup progress updated successfully after payment confirmation');
                        }
                    } else {
                        console.log('Not updating setup step as current step is already at or beyond step 1');
                    }
                } catch (updateError) {
                    console.error('Error updating setup progress after payment confirmation:', updateError);
                }
            }

            // Don't redirect automatically - show success message and continue button instead
        }
    } catch (error) {
        console.error('Error checking activation status:', error);
        errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
        // Only reset verification state if we're not doing periodic verification
        // or if there was an error
        if (errorMessage || !verificationInterval) {
            isVerifying = false;
        }

        // Only set isLoading to false if this is the initial page load
        if (paymentStatus === 'checking') {
            isLoading = false;
        }
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

// Function to check transaction status
async function checkTransactionStatus(hash: `0x${string}`) {
    if (isCheckingTransaction || !hash) return;

    // Start periodic verification
    startPeriodicVerification();

    try {
        isCheckingTransaction = true;
        transactionCheckCount++;

        console.log(`Checking transaction status (attempt ${transactionCheckCount})...`);

        // Get transaction receipt with a longer timeout
        const receipt = await waitForTransaction(config, {
            hash,
            timeout: 30000 // 30 seconds timeout
        });

        console.log('Transaction receipt:', receipt);

        // Check transaction status - receipt.status is a number (0 = failure, 1 = success)
        if (receipt && Number(receipt.status) === 1) {
            console.log('Transaction confirmed successfully!');
            transactionStatus = 'confirmed';

            // Check for existing identities on all chains
            const address = getWalletAddress();
            if (address) {
                try {
                    console.log('Checking for existing identities on all chains after transaction confirmation...');

                    // Check for existing identities on all chains
                    const checkResponse = await fetch('/api/identity/check-all-chains', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ walletAddress: address })
                    });

                    if (!checkResponse.ok) {
                        console.error(`Server responded with status: ${checkResponse.status}`);
                    } else {
                        const checkResult = await checkResponse.json();
                        console.log('Identity check result after transaction confirmation:', checkResult);

                        // If identities were found, we'll let the user click the continue button
                        // which will redirect them to the dashboard
                        if (checkResult.success && checkResult.identitiesFound > 0) {
                            console.log(`Found ${checkResult.identitiesFound} existing identities on blockchain.`);
                            // Don't redirect automatically - let the user click the continue button
                        }
                    }

                    // Ensure setup_step is updated to 1 when transaction is confirmed
                    const response = await fetch('/api/wallet/status', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ walletAddress: address })
                    });

                    if (!response.ok) {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }

                    const statusResult = await response.json();

                    // Only update if current step is less than 1
                    if (statusResult.success && statusResult.data && statusResult.data.setup_step < 1) {
                        console.log('Updating setup progress to step 1 after transaction confirmation');
                        const progressResult = await updateSetupProgress(address, 1);
                        if (!progressResult.success) {
                            console.error('Failed to update setup progress after transaction confirmation:', progressResult.error);
                        } else {
                            console.log('Setup progress updated successfully after transaction confirmation');
                        }
                    } else {
                        console.log('Not updating setup step as current step is already at or beyond step 1');
                    }
                } catch (updateError) {
                    console.error('Error updating setup progress after transaction confirmation:', updateError);
                }
            }

            // Check activation status to update UI
            await checkWalletActivationStatus();

            // If the activation status check didn't detect the payment, manually check again after a delay
            // This gives the backend time to process the transaction
            if (paymentStatus !== 'payment_verified' && paymentStatus !== 'payment_confirmed') {
                console.log('Payment not yet detected by backend, scheduling another check...');
                setTimeout(async () => {
                    console.log('Performing delayed activation status check...');
                    await checkWalletActivationStatus();

                    // If payment is now verified, show success message
                    if (paymentStatus === 'payment_verified' || paymentStatus === 'payment_confirmed') {
                        console.log('Payment now verified, showing success message...');
                        // No automatic redirection - user will click the continue button
                    }
                }, 5000); // Check again after 5 seconds
            } else {
                // If payment is already verified, show success message
                console.log('Payment verified, showing success message...');
                // No automatic redirection - user will click the continue button
            }
        } else {
            console.log('Transaction failed or is still pending');
            transactionStatus = receipt && Number(receipt.status) === 0 ? 'failed' : 'pending';

            if (transactionStatus === 'failed') {
                transactionError = 'Transaction failed. Please try again or send the payment manually.';
            }

            // If still pending and we haven't checked too many times, check again
            if (transactionStatus === 'pending' && transactionCheckCount < 20) { // Increased max attempts
                setTimeout(() => checkTransactionStatus(hash), 10000); // Check again in 10 seconds
            }
        }
    } catch (error) {
        console.error('Error checking transaction status:', error);

        // If it's a timeout error, the transaction might still be pending
        if (error instanceof Error && error.message.includes('timeout') && transactionCheckCount < 20) { // Increased max attempts
            transactionStatus = 'pending';
            setTimeout(() => checkTransactionStatus(hash), 10000); // Check again in 10 seconds
        } else {
            transactionStatus = 'unknown';
            transactionError = error instanceof Error ? error.message : 'Unknown error checking transaction';
        }
    } finally {
        isCheckingTransaction = false;
        // Don't reset verification state here - let the periodic verification continue
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

    // Log the ARC wallet address and chain ID for debugging
    console.log('Sending payment to ARC wallet:', {
        arcWalletAddress,
        chainId: selectedChainId
    });

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

        // Format the amount properly to ensure it works with parseEther
        // Use toFixed to get a string representation with exact decimal places
        const formattedAmount = cryptoAmount.toFixed(18).replace(/\.?0+$/, '');
        console.log('Formatted amount:', formattedAmount);

        // Parse the amount to wei
        let amount: bigint;
        try {
            // Use parseEther which handles the conversion to wei (1 ETH = 10^18 wei)
            amount = parseEther(formattedAmount);
            console.log('Parsed amount (wei):', amount.toString());
        } catch (parseError) {
            console.error('Error parsing ETH amount:', parseError);
            throw new Error(`Failed to convert ${formattedAmount} to wei. Please try again.`);
        }

        console.log(`Sending ${formattedAmount} ${selectedChain?.symbol || 'ETH'} to ${arcWalletAddress}`);

        // Prepare transaction parameters
        const txParams = {
            to: arcWalletAddress as Address,
            value: amount
        };

        // Note: chainId is handled automatically by wagmi

        console.log('Transaction params:', txParams);

        // Send the transaction
        const result = await sendTransaction(config, txParams);
        // The hash is a `0x${string}` type
        const hash = result;

        console.log('Transaction sent:', hash);
        transactionHash = hash as string;
        transactionStatus = 'pending';
        transactionWasSent = true; // Set flag to indicate transaction was sent using the button

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
                const localFormattedAmount = cryptoAmount.toString();
                console.error('BigInt conversion error detected. Current values:', {
                    cryptoAmount,
                    formattedAmount: localFormattedAmount,
                    amountString: 'conversion failed'
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
        async () => {
            console.log('Payment confirmed!');
            // Update payment status to show success message instead of redirecting
            paymentStatus = 'payment_confirmed';
            // Stop periodic verification if it's running
            stopPeriodicVerification();

            // Check for existing identities on all chains
            try {
                console.log('Checking for existing identities on all chains after payment monitor confirmation...');

                // Check for existing identities on all chains
                const checkResponse = await fetch('/api/identity/check-all-chains', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ walletAddress: address })
                });

                if (!checkResponse.ok) {
                    console.error(`Server responded with status: ${checkResponse.status}`);
                } else {
                    const checkResult = await checkResponse.json();
                    console.log('Identity check result after payment monitor:', checkResult);

                    // If identities were found, we'll let the user click the continue button
                    // which will redirect them to the dashboard
                    if (checkResult.success && checkResult.identitiesFound > 0) {
                        console.log(`Found ${checkResult.identitiesFound} existing identities on blockchain.`);
                        // Don't redirect automatically - let the user click the continue button
                    }
                }

                // Ensure setup_step is updated to 1 when payment is confirmed via monitor
                const response = await fetch('/api/wallet/status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ walletAddress: address })
                });

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const statusResult = await response.json();

                // Only update if current step is less than 1
                if (statusResult.success && statusResult.data && statusResult.data.setup_step < 1) {
                    console.log('Updating setup progress to step 1 after payment monitor confirmation');
                    const progressResult = await updateSetupProgress(address, 1);
                    if (!progressResult.success) {
                        console.error('Failed to update setup progress after payment monitor confirmation:', progressResult.error);
                    } else {
                        console.log('Setup progress updated successfully after payment monitor confirmation');
                    }
                } else {
                    console.log('Not updating setup step as current step is already at or beyond step 1');
                }
            } catch (updateError) {
                console.error('Error updating setup progress after payment monitor confirmation:', updateError);
            }
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

// Using the setWalletAddressCookie function from walletAuth.ts

// Function to handle continuing to the next step
async function handleContinueToNextStep() {
    try {
        // Get the wallet address
        const address = getWalletAddress();
        if (!address) {
            console.error('No wallet address found');
            return;
        }

        console.log('Checking for existing identities on all chains...');

        // Check for existing identities on all chains
        const checkResponse = await fetch('/api/identity/check-all-chains', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: address })
        });

        if (!checkResponse.ok) {
            throw new Error(`Server responded with status: ${checkResponse.status}`);
        }

        const checkResult = await checkResponse.json();
        console.log('Identity check result:', checkResult);

        // If identities were found, redirect to dashboard
        if (checkResult.success && checkResult.identitiesFound > 0) {
            console.log(`Found ${checkResult.identitiesFound} existing identities on blockchain. Redirecting to dashboard.`);

            // First check if setup is already marked as completed
            const setupResponse = await fetch('/api/wallet/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ walletAddress: address })
            });

            if (setupResponse.ok) {
                const setupResult = await setupResponse.json();

                // If setup is not already completed, mark it as completed
                if (setupResult.success && setupResult.data && !setupResult.data.setup_completed) {
                    console.log('Marking setup as completed before redirecting to dashboard');
                    await fetch('/api/wallet/complete-setup', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ walletAddress: address })
                    });
                }
            }

            // Redirect to dashboard/identities
            goto('/dashboard/identities');
            return;
        }

        console.log('No existing identities found. Continuing with normal activation flow.');
        console.log('Checking current setup step before updating to step 1 (Identity Type)');

        // First get the current setup step
        const response = await fetch('/api/wallet/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletAddress: address })
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const statusResult = await response.json();

        // Only update if current step is less than 1
        if (statusResult.success && statusResult.data && statusResult.data.setup_step < 1) {
            console.log('Updating setup progress to step 1 (Identity Type)');
            const result = await updateSetupProgress(address, 1);

            if (!result.success) {
                console.error('Failed to update setup progress:', result.error);
            } else {
                console.log('Setup progress updated successfully:', result);
            }
        } else {
            console.log('Not updating setup step as current step is already at or beyond step 1');
        }

        // Navigate to the next step
        goto('/activate/choose-identity-type');
    } catch (error) {
        console.error('Error handling continue to next step:', error);
    }
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

// Function to connect wallet
async function connectWallet(type: 'injected' | 'walletconnect') {
    try {
        console.log(`Connecting with ${type} on activate page...`);

        // Store the connection promise
        let connectPromise;

        if (type === 'injected') {
            connectPromise = connect(config, { connector: injected() });
        } else {
            connectPromise = connect(config, { connector: walletConnect({ projectId }) });
        }

        // Hide wallet options immediately
        showWalletOptions = false;

        // Wait for connection to complete
        await connectPromise;

        console.log(`${type} connection successful on activate page`);

        // Get the connected wallet address and set the cookie
        const account = getAccount(config);
        if (account.isConnected && account.address) {
            setWalletAddressCookie(account.address);
        }

        // Force a page reload to ensure all state is properly updated
        // This is a more reliable approach than depending on reactive state
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (error) {
        console.error(`Failed to connect with ${type}:`, error);
        // Show wallet options again if connection failed
        showWalletOptions = true;
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

        // Set the wallet address cookie if connected
        if (account.isConnected && account.address) {
            setWalletAddressCookie(account.address);
        }

        // Check activation status again but don't start verification
        await checkWalletActivationStatus(false);
    } catch (error) {
        console.error('Error reconnecting wallet:', error);
        errorMessage = 'Failed to reconnect wallet. Please try connecting manually.';
    } finally {
        isLoading = false;
    }
}

// Import getWalletSetupStatus function
import { getWalletSetupStatus } from '$lib/services/walletService';

// Check activation status on mount and clean up on destroy
onMount(() => {
    let cleanup: (() => void) | undefined;

    // Create an async IIFE to handle the async operations
    (async () => {
        // Check if wallet is connected and setup is completed
        const walletAddr = getWalletAddress();
        if (walletAddr) {
            try {
                // Check wallet setup status
                const setupStatus = await getWalletSetupStatus(walletAddr);

                // If setup is completed, redirect to dashboard
                if (setupStatus?.setup_completed) {
                    console.log('Wallet setup is already completed, redirecting to dashboard');
                    await goto('/dashboard');
                    return;
                }
            } catch (error) {
                console.error('Error checking wallet setup status:', error);
            }
        }

        // Show wallet options by default if no wallet is connected
        if (!isConnected) {
            showWalletOptions = true;
        }

        // Load available chains first
        loadAvailableChains().then(() => {
            // Try to reconnect wallet, then check activation status
            reconnectWallet();
        });

        // Set up a listener for chain changes in the wallet
        const unwatch = watchChainId(config, {
            onChange: (chainId) => {
                console.log('Wallet chain changed to:', chainId);

                // Find the matching chain in our available chains
                const matchingChain = availableChains.find(chain => chain.chain_id === chainId);

                if (matchingChain) {
                    // Update the selected chain in the UI
                    selectedChain = matchingChain;
                    selectedChainId = chainId;
                    console.log('Updated selected chain to match wallet:', selectedChain);

                    // Refresh activation status with the new chain to get the correct ARC wallet address
                    if (walletAddress) {
                        console.log(`Checking activation status for chain ${chainId} to get the correct ARC wallet address`);
                        checkWalletActivationStatus(false).catch(err => {
                            console.error('Error checking wallet status after chain change:', err);
                        });
                    }
                } else {
                    console.log('Wallet switched to unsupported chain:', chainId);
                    // We could show a warning here if needed
                }
            }
        });

        // Store the cleanup function
        cleanup = () => {
            if (unwatch) unwatch();
        };
    })();

    // Return the cleanup function
    return () => {
        if (cleanup) cleanup();
    };
});

onDestroy(() => {
    // Stop payment monitoring when component is destroyed
    if (walletAddress && isMonitoring) {
        stopPaymentMonitor(walletAddress);
        isMonitoring = false;
    }

    // Clear any verification intervals
    if (verificationInterval) {
        console.log('Clearing verification interval...');
        clearInterval(verificationInterval);
        verificationInterval = null;
    }
});
</script>

<div class="min-h-screen bg-background flex flex-col items-center justify-start pt-16 px-4 relative transition-opacity duration-200 {isVerifying ? 'opacity-95' : 'opacity-100'}">
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

    {#if !isConnected}
        <!-- Wallet Connection UI -->
        <div class="max-w-xl w-full mx-auto text-center">
            <h1 class="text-3xl font-bold text-foreground mb-8">Connect Your Wallet</h1>
            <p class="text-foreground mb-6">Connect your wallet to access the activation process</p>

            {#if showWalletOptions}
                <div class="bg-muted/50 p-4 border border-border mb-6">
                    <div class="space-y-3">
                        <Button
                            variant="ghost"
                            class="w-full flex items-center justify-between p-3 hover:bg-accent text-foreground"
                            on:click={() => connectWallet('injected')}
                        >
                            <div class="flex items-center">
                                <img src="/images/metamask-logo.png" alt="MetaMask" class="h-6 w-6 mr-2 object-contain" />
                                <span class="text-sm font-medium">MetaMask</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>

                        <Button
                            variant="ghost"
                            class="w-full flex items-center justify-between p-3 hover:bg-accent text-foreground"
                            on:click={() => connectWallet('walletconnect')}
                        >
                            <div class="flex items-center">
                                <img src="/images/walletconnect-logo.png" alt="WalletConnect" class="h-6 w-6 mr-2 object-contain" />
                                <span class="text-sm font-medium">WalletConnect</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                </div>
            {:else}
                <Button
                    variant="default"
                    class="w-full"
                    on:click={() => showWalletOptions = true}
                >
                    Connect Wallet
                </Button>
            {/if}
        </div>
    {:else}
        <!-- Progress indicator -->
        <ProgressSteps currentStep={1} />

        <!-- Main content -->
        <div class="w-full max-w-md text-center">
        <h1 class="text-4xl font-bold mb-8">Activate Your Profile</h1>

        {#if isLoading}
            <div class="flex flex-col justify-center items-center py-8 relative">

                <!-- SVG spinner -->
                <svg class="animate-spin h-16 w-16 mb-9" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>

                <!-- Loading message -->
                <p class="text-lg font-medium text-primary/80">Loading payment interface...</p>
                <p class="text-sm text-muted-foreground mt-2">This may take a moment</p>
            </div>
        {:else if statusMessage}
            <div class="bg-muted p-4 mb-6 relative overflow-hidden">
                <!-- Subtle gradient background animation -->
                <div class="absolute inset-0 bg-gradient-to-r from-muted via-muted/80 to-muted bg-[length:200%_100%] animate-gradient-slow opacity-50"></div>

                <div class="relative z-10">
                    <p class="font-medium mb-3">{statusMessage}</p>
                    <div class="flex justify-center">
                        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </div>
            </div>
        {:else if errorMessage}
            <div class="bg-red-500/10 border border-red-200 p-4 mb-6">
                <p class="text-red-600 font-medium mb-2">Error</p>
                <p class="text-red-600">{errorMessage}</p>
                {#if errorMessage.includes('recipient does not match')}
                    <div class="mt-3 text-xs text-red-600">
                        <p>This error occurs when the transaction was sent to a different address than expected.</p>
                        <p class="mt-1">Please check that you sent the payment to the correct address.</p>
                    </div>
                {:else if errorMessage.includes('API Key')}
                    <div class="mt-3 text-xs text-red-600">
                        <p>There's an issue with the Etherscan API key configuration.</p>
                        <p class="mt-1">Please contact support to resolve this issue.</p>
                    </div>
                {/if}
            </div>
            <div class="flex flex-col gap-3">
                <Button
                    class="w-full"
                    on:click={() => checkWalletActivationStatus(false)}
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
        {:else if paymentStatus === 'payment_confirmed' || paymentStatus === 'payment_verified'}
            <!-- Payment success message -->
            <div class="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 p-6 mb-6 text-center">
                <div class="flex justify-center mb-4">
                    <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>
                <h3 class="text-xl font-bold text-green-800 dark:text-green-300 mb-2">Payment Confirmed!</h3>
                <p class="text-green-700 dark:text-green-400 mb-6">Your payment has been successfully verified. Click the button below to continue.</p>

                <Button
                    class="w-full"
                    variant="default"
                    on:click={handleContinueToNextStep}
                >
                    Continue
                </Button>
            </div>
        {:else if paymentStatus === 'awaiting_payment' || paymentStatus === 'registration_created'}
            <p class="text-lg mb-4">
                A one-time ${usdEquivalent} USD fee is required to register on ARC.
            </p>

            {#if availableChains.length > 0}
                <div class="mb-6">
                    <p class="block text-sm font-medium mb-3 text-center">Select payment chain:</p>
                    <div class="flex flex-wrap gap-2 justify-center">
                        {#each availableChains as chain}
                            <button
                                type="button"
                                class="flex items-center gap-2 px-3 py-2 border text-sm transition-colors
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
                                    <span class="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground">Test</span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <div class="text-3xl font-bold mb-4">
                {formatCryptoAmount(cryptoAmount)} {cryptoSymbol}
            </div>

            <div class="bg-muted p-4 mb-6 text-left">
                {#if selectedChain}
                    <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-background mb-3">
                        {#if selectedChain.icon_url}
                            <img
                                src={selectedChain.icon_url}
                                alt={selectedChain.name}
                                class="w-5 h-5"
                                on:error={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    img.onerror = null;
                                    img.src = `https://placehold.co/20x20/svg?text=${selectedChain?.symbol || 'ETH'}`;
                                }}
                            />
                        {:else}
                            <div class="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                {selectedChain.symbol || 'ETH'}
                            </div>
                        {/if}
                        <span class="font-medium text-sm">{selectedChain.name}</span>
                        {#if selectedChain.is_testnet}
                            <span class="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground">Test</span>
                        {/if}
                    </div>
                {/if}

                <p class="text-sm mb-2">Send exactly <span class="font-bold">{formatCryptoAmount(cryptoAmount)} {cryptoSymbol}</span> to:</p>
                <div class="flex items-center gap-2 mb-3">
                    <code class="bg-background p-2 text-xs flex-1 overflow-hidden text-ellipsis">{arcWalletAddress}</code>
                    <Button variant="outline" size="sm" on:click={copyArcWalletAddress}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </Button>
                </div>

                <div class="bg-background p-3 mb-3">
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

                <div class="mt-4">
                    <div class="p-3 bg-card dark:bg-card">
                        <p class="text-sm font-medium mb-2">Already sent payment?</p>
                        <div class="flex flex-col sm:flex-row gap-2 mb-3">
                            <input
                                type="text"
                                placeholder="Enter transaction hash (0x...)"
                                class="w-full flex-1 px-3 py-2 h-9 text-sm border {isVerifying ? 'border-primary/50 shadow-sm shadow-primary/20' : 'border-border'} bg-background transition-all duration-300 {isVerifying ? 'opacity-90' : ''}"
                                bind:value={transactionHash}
                                on:input={() => { if (transactionWasSent) transactionWasSent = false; }}
                                disabled={isVerifying}
                            />
                            <Button
                                variant="outline"
                                size="default"
                                class="bg-background hover:bg-accent w-full sm:w-auto py-2 h-9"
                                disabled={isVerifying || !transactionHash || transactionHash.length < 10}
                                on:click={startPeriodicVerification}
                            >
                                {#if isVerifying}
                                    <span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                    Verifying...
                                {:else}
                                    Verify
                                {/if}
                            </Button>
                        </div>

                        {#if transactionHash && transactionHash.length >= 10}
                            <div class="flex justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                                    on:click={() => window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')}
                                >
                                    View on Etherscan →
                                </Button>
                            </div>
                        {/if}
                    </div>
                </div>

                {#if transactionHash && (transactionWasSent || transactionStatus)}
                    <div class="mt-3 p-3
                        {transactionStatus === 'confirmed' ? 'bg-green-500/10 text-green-600' :
                         transactionStatus === 'failed' ? 'bg-muted' :
                         'bg-primary/10 text-primary'}">
                        <div class="flex items-center gap-2 mb-1">
                            {#if transactionStatus === 'pending'}
                                <span class="inline-block h-3 w-3 rounded-full bg-primary"></span>
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
                            <code class="text-xs bg-background p-1 flex-1 overflow-hidden text-ellipsis">{transactionHash}</code>
                        </div>
                    </div>
                {/if}

                {#if transactionError}
                    <div class="mt-3 p-3 bg-red-500/10 border border-red-200">
                        <p class="text-sm font-medium mb-1 text-red-600">Transaction Failed</p>
                        <p class="text-xs text-red-600">{transactionError}</p>
                        {#if transactionError.includes('recipient does not match')}
                            <div class="mt-2 text-xs text-red-600">
                                <p>This error occurs when the transaction was sent to a different address than expected.</p>
                                <p class="mt-1">Please check that you sent the payment to the correct address.</p>
                            </div>
                        {:else if transactionError.includes('API Key')}
                            <div class="mt-2 text-xs text-red-600">
                                <p>There's an issue with the Etherscan API key configuration.</p>
                                <p class="mt-1">Please contact support to resolve this issue.</p>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="flex flex-col gap-3">
                {#if transactionStatus === 'confirmed'}
                    <!-- Show next step button when transaction is confirmed -->
                    <Button
                        class="w-full"
                        variant="default"
                        on:click={handleContinueToNextStep}
                    >
                        Continue
                    </Button>
                {:else if transactionStatus === 'pending'}
                    <!-- Show checking status when transaction is pending -->
                    <Button
                        class="w-full"
                        variant="default"
                        disabled={isVerifying || isCheckingTransaction}
                        on:click={() => checkTransactionStatus(transactionHash as `0x${string}`)}
                    >
                        {#if isVerifying || isCheckingTransaction}
                            <svg class="mr-2 animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Checking Status...
                        {:else}
                            Check Transaction Status
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
                            <svg class="mr-2 animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                        {:else}
                            Send {formatCryptoAmount(cryptoAmount)} {cryptoSymbol}
                        {/if}
                    </Button>
                {/if}
            </div>
        {:else}
            <div class="bg-primary/10 text-primary p-4  mb-6 relative overflow-hidden">
                <!-- Subtle gradient background animation -->
                <div class="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 bg-[length:200%_100%] animate-gradient-slow opacity-50"></div>

                <div class="relative z-10 flex items-center justify-center gap-3">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Checking payment status...</p>
                </div>
            </div>
            <Button
                class="w-full"
                on:click={() => checkWalletActivationStatus(false)}
            >
                Check Again
            </Button>
        {/if}

        <!-- Help button -->
        <Button
          variant="ghost"
          class="mt-4 text-muted-foreground hover:text-foreground text-sm"
          on:click={() => window.open('https://discord.gg/SW2SnTzVaf', '_blank')}
        >
          Need help with payment?
        </Button>

        <!-- Log out button -->
        <Button
          variant="ghost"
          class="mt-2 mb-8 text-muted-foreground hover:text-foreground text-sm"
          on:click={handleLogout}
        >
          Disconnect Wallet
        </Button>
    </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
    }
</style>