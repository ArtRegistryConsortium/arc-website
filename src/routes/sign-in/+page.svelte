<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { onMount, onDestroy } from 'svelte';
import { goto } from '$app/navigation';
import { web3Store } from '$lib/stores/web3';
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
let isInitializing = true;
let setupStatus: import('$lib/services/walletService').WalletSetupStatus | null = null;
let unsubscribeSetup: (() => void) | undefined;

// Subscribe to stores
let isConnected = false;
let walletAddress: Address | null = null;

// Unsubscribe functions
let unsubscribeWeb3: (() => void) | undefined;

onMount(() => {
  // Initialize wallet connection
  initializeWallet();

  // Subscribe to web3Store
  unsubscribeWeb3 = web3Store.subscribe((state: any) => {
    isConnected = state.isConnected;
    walletAddress = state.address;

    console.log('Web3Store update on sign-in page:', {
      isConnected: state.isConnected,
      address: state.address ? truncateAddress(state.address) : null
    });

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

  // Subscribe to setupStatusStore
  unsubscribeSetup = setupStatusStore.subscribe((state: any) => {
    setupStatus = state.status;

    console.log('SetupStatusStore update on sign-in page:', {
      status: state.status,
      isLoading: state.isLoading,
      isConnected
    });

    // If we're connected and have setup status, redirect to the appropriate page
    if (isConnected && setupStatus) {
      const redirectUrl = getSetupRedirectUrl(setupStatus);
      console.log('Redirecting based on setup status:', redirectUrl);
      window.location.href = redirectUrl;
    }
  });

  return () => {
    if (unsubscribeWeb3) unsubscribeWeb3();
    if (unsubscribeSetup) unsubscribeSetup();
  };
});

// Initialize wallet connection
async function initializeWallet() {
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
    console.log(`Connecting with ${type} on sign-in page...`);

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

    console.log(`${type} connection successful on sign-in page`);

    // Check setup status after connection
    if (walletAddress) {
      await checkSetupStatus(walletAddress);
    }
  } catch (error) {
    console.error(`Failed to connect with ${type}:`, error);
    // Show wallet options again if connection failed
    showWalletOptions = true;
  }
}

// Function to disconnect wallet
async function disconnectWallet() {
  try {
    await disconnect(config);
    window.location.href = '/';
  } catch (error) {
    console.error("Failed to disconnect wallet:", error);
  }
}
</script>

<div class="container mx-auto px-4 py-8 md:py-24">
  <div class="max-w-md mx-auto ">
    <h1 class="text-3xl font-bold text-center mb-8">Sign In</h1>
    
    {#if isConnected}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div class="text-center mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">Connected as</p>
          <p class="font-mono text-lg">{walletAddress ? truncateAddress(walletAddress) : ''}</p>
        </div>
        <Button
          variant="outline"
          class="w-full"
          on:click={disconnectWallet}
        >
          Disconnect Wallet
        </Button>
      </div>
    {:else}
      <div class="bg-background border shadow-md p-6">
        
        <Button
              variant="ghost"
              class="w-full flex items-center justify-between p-3 hover:bg-accent text-foreground mb-2"
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
    {/if}
    <div class="mt-4 text-center">
      <a 
        href="https://discord.com/invite/kNmQCnNWSp" 
        target="_blank" 
        rel="noopener noreferrer"
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Having trouble signing in?
      </a>
    </div>
  </div>
</div> 