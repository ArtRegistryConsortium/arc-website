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
  unsubscribeWeb3 = web3Store.subscribe(state => {
    const wasConnected = isConnected;
    isConnected = state.isConnected;
    walletAddress = state.address;
    
    // If wallet is connected but not verified, prepare verification message
    // but don't automatically start the verification process
    if (isConnected && walletAddress && !isVerified && !isVerifying && !messageReady) {
      prepareVerificationMessage();
    }
    
    // If wallet was connected but is now disconnected, reset local state
    if (wasConnected && !isConnected) {
      resetLocalState();
      
      // Redirect to homepage when disconnected
      goto('/');
    }
    
    // If we're initializing and not connected, show wallet options
    if (isInitializing && !isConnected) {
      showWalletOptions = true;
      isInitializing = false;
    }
    
    // If we're initializing and connected, hide wallet options
    if (isInitializing && isConnected) {
      showWalletOptions = false;
      isInitializing = false;
    }
  });
  
  // Subscribe to walletAuthStore
  unsubscribeAuth = walletAuthStore.subscribe(state => {
    isVerified = state.isVerified;
    isVerifying = state.isVerifying;
    
    // If verification is complete, redirect after a short delay
    if (isVerified && !isRedirecting) {
      isRedirecting = true;
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
    
    // If we're verified and on the verify page, redirect to home
    if (isVerified && !isRedirecting && !isInitializing) {
      isRedirecting = true;
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  });
  
  return () => {
    if (unsubscribeWeb3) unsubscribeWeb3();
    if (unsubscribeAuth) unsubscribeAuth();
  };
});

// Initialize wallet connection
async function initializeWallet() {
  // Check for existing session
  checkExistingSession();
  
  // Try to reconnect to the previously connected wallet
  try {
    await reconnect(config);
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
    if (type === 'injected') {
      await connect(config, { connector: injected() });
    } else {
      await connect(config, { connector: walletConnect({ projectId }) });
    }
    showWalletOptions = false;
  } catch (error) {
    console.error(`Failed to connect with ${type}:`, error);
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
  if (!walletAddress) return;
  
  try {
    // Create a verification session and get a nonce
    const nonce = await createVerificationSession(walletAddress);
    
    // Create a message to sign
    verificationMessage = `Sign this message to verify your wallet ownership.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis won't cost any gas.`;
    messageReady = true;
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
        await verifyWalletSignature(walletAddress, signature, nonce);
      }
    }
  } catch (error) {
    console.error("Failed to sign and verify:", error);
  }
}

// Function to close the page
function closePage() {
  // Use window.location for a hard redirect to ensure it works
  window.location.href = '/';
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
    on:click={closePage}
    aria-label="Close"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </Button>
  
  <div class="max-w-xl w-full mx-auto text-center">
    <h1 class="text-3xl font-bold text-foreground mb-8">Verify Your Wallet</h1>
    
    {#if isVerified}
      <div class="bg-green-500/20 p-6 rounded-lg border border-green-500/50 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
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
        
        <div class="bg-muted/50 p-4 rounded-lg border border-border mb-6 text-left">
          <p class="text-muted-foreground mb-2 text-sm">Wallet Address:</p>
          <p class="text-foreground font-mono mb-4">{walletAddress ? truncateAddress(walletAddress) : ''}</p>
          
          {#if verificationMessage}
            <p class="text-muted-foreground mb-2 text-sm">Verification Message:</p>
            <pre class="bg-muted p-3 rounded text-foreground text-sm font-mono overflow-x-auto">{verificationMessage.split('\n').slice(0, 1).join('\n')}</pre>
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
        <div class="bg-muted/50 p-4 rounded-lg border border-border mb-6">
          <div class="space-y-3">
            <Button 
              variant="ghost"
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent text-foreground"
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
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-accent text-foreground"
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