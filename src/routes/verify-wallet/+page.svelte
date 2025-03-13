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
        goto('/');
      }, 2000);
    }
    
    // If we're verified and on the verify page, redirect to home
    if (isVerified && !isRedirecting && !isInitializing) {
      isRedirecting = true;
      setTimeout(() => {
        goto('/');
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
    
    // Redirect to homepage
    goto('/');
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
  goto('/');
}
</script>

<svelte:head>
  <title>Verify Your Wallet</title>
</svelte:head>

<div class="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center p-4">
  <!-- Close button -->
  <Button 
    variant="ghost" 
    class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
    on:click={closePage}
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </Button>
  
  <div class="max-w-md w-full mx-auto text-center">
    <h1 class="text-3xl font-bold text-white mb-8">Verify Your Wallet</h1>
    
    {#if isVerified}
      <div class="bg-green-900/20 p-6 rounded-lg border border-green-500/30 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <p class="text-white mb-2">Wallet successfully verified!</p>
        <p class="text-gray-400 text-sm">Redirecting you back...</p>
      </div>
    {:else if isConnected}
      {#if isVerifying}
        <div class="mb-6">
          <div class="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-white">Verifying your wallet...</p>
        </div>
      {:else}
        <p class="text-white mb-6">Sign a message to confirm ownership. This won't cost gas.</p>
        
        <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6 text-left">
          <p class="text-gray-400 mb-2 text-sm">Wallet Address:</p>
          <p class="text-white font-mono mb-4">{walletAddress ? truncateAddress(walletAddress) : ''}</p>
          
          {#if verificationMessage}
            <p class="text-gray-400 mb-2 text-sm">Verification Message:</p>
            <pre class="bg-gray-900 p-3 rounded text-white text-sm font-mono overflow-x-auto">{verificationMessage.split('\n').slice(0, 1).join('\n')}</pre>
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
          class="mt-4 text-gray-400 hover:text-white text-sm"
          on:click={disconnectWallet}
        >
          Disconnect Wallet
        </Button>
      {/if}
    {:else if isInitializing}
      <div class="mb-6">
        <div class="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-white">Initializing wallet connection...</p>
      </div>
    {:else}
      <p class="text-white mb-6">Connect your wallet to verify ownership</p>
      
      {#if showWalletOptions}
        <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-6">
          <div class="space-y-3">
            <Button 
              variant="ghost"
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-[#1a1a1a] text-white"
              on:click={() => connectWallet('injected')}
            >
              <div class="flex items-center">
                <img src="/images/metamask-logo.png" alt="MetaMask" class="h-6 w-6 mr-2 object-contain" />
                <span class="text-sm font-medium">MetaMask</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            
            <Button 
              variant="ghost"
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-[#1a1a1a] text-white"
              on:click={() => connectWallet('walletconnect')}
            >
              <div class="flex items-center">
                <img src="/images/walletconnect-logo.png" alt="WalletConnect" class="h-6 w-6 mr-2 object-contain" />
                <span class="text-sm font-medium">WalletConnect</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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