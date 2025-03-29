<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { onMount, onDestroy } from 'svelte';
import { goto } from '$app/navigation';
import { web3Store } from '$lib/stores/web3';
import {
  walletAuthStore,
  checkExistingSession,
  createVerificationSession,
  signWalletMessage,
  verifyWalletSignature,
  clearSession
} from '$lib/stores/walletAuth';
import { setupStatusStore, getSetupRedirectUrl, checkSetupStatus } from '$lib/stores/setupStatus';
import { connect, disconnect, reconnect } from 'wagmi/actions';
import { injected, walletConnect } from 'wagmi/connectors';
import { config } from '$lib/web3/config';
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
import { truncateAddress } from '$lib/utils/web3';
import type { Address } from 'viem';

// Get WalletConnect project ID from environment variable
const projectId = PUBLIC_WALLETCONNECT_ID || '';

// State variables
let showWalletOptions = false;
let verificationMessage = '';
let isRedirecting = false;
let messageReady = false;
let isInitializing = true;
let setupStatus: import('$lib/services/walletService').WalletSetupStatus | null = null;
let unsubscribeSetup: (() => void) | undefined;

// Subscribe to stores
let isConnected = false;
let walletAddress: Address | null = null;
let isVerified = false;
let isVerifying = false;

// Unsubscribe functions
let unsubscribeWeb3: (() => void) | undefined;
let unsubscribeAuth: (() => void) | undefined;

// Reset local state when disconnected
function resetLocalState() {
  verificationMessage = '';
  messageReady = false;
  showWalletOptions = true;
}

onMount(() => {
  // Initialize wallet connection
  initializeWallet();

  // Subscribe to web3Store
  unsubscribeWeb3 = web3Store.subscribe((state: any) => {
    const wasConnected = isConnected;
    isConnected = state.isConnected;
    walletAddress = state.address;

    console.log('Web3Store update on verify-wallet page:', {
      isConnected: state.isConnected,
      address: state.address ? truncateAddress(state.address) : null,
      isVerified,
      isVerifying,
      messageReady
    });

    // If wallet is connected but not verified, prepare verification message
    // but don't automatically start the verification process
    if (isConnected && walletAddress && !isVerified && !isVerifying && !messageReady) {
      console.log('Conditions met to prepare verification message');
      prepareVerificationMessage();
    }

    // If wallet was connected but is now disconnected, reset local state
    if (wasConnected && !isConnected) {
      console.log('Wallet disconnected, resetting state and redirecting');
      resetLocalState();

      // Redirect to homepage when disconnected
      goto('/');
    }

    // If we're initializing and not connected, show wallet options
    if (isInitializing && !isConnected) {
      console.log('Initializing without connection, showing wallet options');
      showWalletOptions = true;
      isInitializing = false;
    }

    // If we're initializing and connected, hide wallet options
    if (isInitializing && isConnected) {
      console.log('Initializing with connection, hiding wallet options');
      showWalletOptions = false;
      isInitializing = false;
    }
  });

  // Subscribe to walletAuthStore
  unsubscribeAuth = walletAuthStore.subscribe((state: any) => {
    const wasVerified = isVerified;
    isVerified = state.isVerified;
    isVerifying = state.isVerifying;

    console.log('WalletAuthStore update on verify-wallet page:', {
      isVerified: state.isVerified,
      isVerifying: state.isVerifying,
      hasSessionToken: !!state.sessionToken,
      isRedirecting
    });

    // If verification is complete, we'll handle redirection based on setup status
    // This is now handled in the setupStatusStore subscription

    // If we're verified and on the verify page, we'll check setup status
    if (isVerified && !isRedirecting && !isInitializing) {
      console.log('Already verified, checking setup status');
    }
  });

  // Subscribe to setupStatusStore
  unsubscribeSetup = setupStatusStore.subscribe((state: any) => {
    setupStatus = state.status;

    console.log('SetupStatusStore update on verify-wallet page:', {
      status: state.status,
      isLoading: state.isLoading,
      isVerified,
      isRedirecting
    });

    // If we're verified and have setup status, redirect to the appropriate page
    if (isVerified && setupStatus && !isRedirecting) {
      isRedirecting = true;

      // Get the appropriate redirect URL based on setup status
      const redirectUrl = getSetupRedirectUrl(setupStatus);
      console.log('Redirecting based on setup status:', redirectUrl);

      // Add a short delay to show the success message
      setTimeout(() => {
        console.log('Executing redirect to:', redirectUrl);
        window.location.href = redirectUrl;
      }, 2000);
    }
  });

  return () => {
    if (unsubscribeWeb3) unsubscribeWeb3();
    if (unsubscribeAuth) unsubscribeAuth();
    if (unsubscribeSetup) unsubscribeSetup();
  };
});

// Initialize wallet connection
async function initializeWallet() {
  // Check for existing session
  const hasValidSession = checkExistingSession();
  console.log('Existing session checked on verify page:', hasValidSession);

  // Try to reconnect to the previously connected wallet
  try {
    await reconnect(config);

    // Check if we have a verified wallet flag in localStorage
    const isWalletVerified = localStorage.getItem('wallet_verified') === 'true';

    // If we have a valid session and the wallet is verified, but the isVerified state is false,
    // this might be due to the store not being updated yet, so we'll force an update
    if (hasValidSession && isWalletVerified && !isVerified) {
      console.log('Forcing wallet verification state update on verify page');
      walletAuthStore.update((state: any) => ({
        ...state,
        isVerified: true
      }));
    }
  } catch (error) {
    console.error('Failed to reconnect wallet:', error);
  }
}

// Function to toggle wallet options
function toggleWalletOptions() {
  showWalletOptions = !showWalletOptions;
}

// Function to connect wallet
async function connectWallet(type: 'injected' | 'walletconnect') {
  try {
    console.log(`Connecting with ${type} on verify-wallet page...`);

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

    console.log(`${type} connection successful on verify-wallet page`);

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

// Function to disconnect wallet
async function disconnectWallet() {
  try {
    // First clear the auth session
    clearSession();

    // Then disconnect the wallet
    await disconnect(config);

    // Reset local state
    resetLocalState();

    // Use window.location for a hard redirect to ensure it works
    window.location.href = '/';
  } catch (error) {
    console.error("Failed to disconnect wallet:", error);
  }
}

// Function to prepare verification message without starting verification
async function prepareVerificationMessage() {
  if (!walletAddress) {
    console.log('Cannot prepare verification message: wallet address is null');
    return;
  }

  console.log('Preparing verification message for wallet:', walletAddress);
  try {
    // Create a verification session and get a nonce
    const nonce = await createVerificationSession(walletAddress);
    console.log('Verification session created with nonce:', nonce);

    // Create a message to sign
    verificationMessage = `Sign this message to verify your wallet ownership.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis won't cost any gas.`;
    messageReady = true;
    console.log('Verification message prepared and ready for signing');
  } catch (error) {
    console.error("Failed to prepare verification message:", error);
  }
}

// Function to sign message and verify
async function signAndVerify() {
  if (!walletAddress || !verificationMessage) return;

  try {
    // Sign the message
    const signature = await signWalletMessage(walletAddress, verificationMessage);

    if (signature) {
      // Extract nonce from the message
      const nonceMatch = verificationMessage.match(/Nonce: (.*)\n/);
      const nonce = nonceMatch ? nonceMatch[1] : '';

      if (nonce) {
        // Verify the signature
        const verified = await verifyWalletSignature(walletAddress, signature, nonce);

        if (verified) {
          // Check the wallet setup status after successful verification
          console.log('Signature verified, checking setup status for redirection');

          // Explicitly check setup status to trigger the redirection
          await checkSetupStatus(walletAddress);

          // The setupStatusStore subscription should handle the redirection
          // But as a fallback, we'll also implement direct redirection here
          if (!isRedirecting && setupStatus) {
            isRedirecting = true;
            const redirectUrl = getSetupRedirectUrl(setupStatus);
            console.log('Direct redirection fallback to:', redirectUrl);
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 2000);
          } else if (!isRedirecting) {
            // If we still don't have setup status, wait a bit and redirect to activate page
            isRedirecting = true;
            console.log('Fallback redirection to activate page');
            setTimeout(() => {
              window.location.href = '/activate';
            }, 2000);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to sign and verify:", error);
  }
}

// Function to close the page and disconnect wallet
async function closePage() {
  try {
    // If wallet is connected, disconnect it
    if (isConnected) {
      // First clear the auth session
      clearSession();

      // Then disconnect the wallet
      await disconnect(config);

      // Reset local state
      resetLocalState();

      console.log('Wallet disconnected when closing verify page');
    }

    // Use window.location for a hard redirect to ensure it works
    window.location.href = '/';
  } catch (error) {
    console.error('Error when closing verify page:', error);
    // Still redirect even if there's an error
    window.location.href = '/';
  }
}
</script>

<svelte:head>
  <title>Verify Your Wallet</title>
</svelte:head>

<div class="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
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

  <div class="max-w-xl w-full mx-auto text-center">
    <h1 class="text-3xl font-bold text-foreground mb-8">Verify Your Wallet</h1>

    {#if isVerified}
      <div class="bg-green-500/20 p-6 border border-green-500/50 mb-6">
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
          </div>
      </div>
        <p class="text-foreground mb-2">Wallet successfully verified!</p>
        <p class="text-muted-foreground text-sm">Redirecting you back...</p>
      </div>
    {:else if isConnected}
      {#if isVerifying}
        <div class="mb-6">
          <div class="animate-spin h-12 w-12 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-foreground">Verifying your wallet...</p>
        </div>
      {:else}
        <p class="text-foreground mb-6">Sign a message to confirm ownership. This won't cost gas.</p>

        <div class="bg-muted/50 p-4 border border-border mb-6 text-left">
          <p class="text-muted-foreground mb-2 text-sm">Wallet Address:</p>
          <p class="text-foreground font-mono mb-4">{walletAddress ? truncateAddress(walletAddress) : ''}</p>

          {#if verificationMessage}
            <p class="text-muted-foreground mb-2 text-sm">Verification Message:</p>
            <pre class="bg-muted p-3 text-foreground text-sm font-mono overflow-x-auto">{verificationMessage.split('\n').slice(0, 1).join('\n')}</pre>
          {/if}
        </div>

        <Button
          variant="default"
          class="w-full"
          on:click={signAndVerify}
        >
          Sign Message
        </Button>

        <Button
          variant="ghost"
          class="mt-4 text-muted-foreground hover:text-foreground text-sm"
          on:click={disconnectWallet}
        >
          Disconnect Wallet
        </Button>
      {/if}
    {:else if isInitializing}
      <div class="mb-6">
        <div class="animate-spin h-12 w-12 border-4 border-foreground border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-foreground">Initializing wallet connection...</p>
      </div>
    {:else}
      <p class="text-foreground mb-6">Connect your wallet to verify ownership</p>

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
          on:click={toggleWalletOptions}
        >
          Connect Wallet
        </Button>
      {/if}
    {/if}
  </div>
</div>