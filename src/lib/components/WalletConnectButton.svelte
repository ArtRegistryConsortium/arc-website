<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { web3Store } from "$lib/stores/web3";
  import { walletAuthStore, checkExistingSession, clearSession } from "$lib/stores/walletAuth";
  import { disconnect, connect } from "wagmi/actions";
  import { injected, walletConnect } from "wagmi/connectors";
  import { config } from "$lib/web3/config";
  import { truncateAddress } from "$lib/utils/web3";
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  // Get WalletConnect project ID from environment variable
  const projectId = PUBLIC_WALLETCONNECT_ID || '';

  // State for popup visibility
  let showPopup = false;
  
  // Auth state
  let isVerified = false;
  let unsubscribeAuth: (() => void) | undefined;
  
  // Current path
  let currentPath = '';
  
  onMount(() => {
    // Get current path
    if (typeof window !== 'undefined') {
      currentPath = window.location.pathname;
    }
  });

  // Function to handle MetaMask connection
  async function connectMetamask() {
    try {
      await connect(config, { connector: injected() });
      showPopup = false;
      
      // Check if the wallet is verified, if not redirect to verify page
      if (!isVerified) {
        goto('/verify-wallet');
      }
    } catch (error) {
      console.error("Failed to connect with MetaMask:", error);
    }
  }

  // Function to handle WalletConnect connection
  async function connectWalletConnect() {
    try {
      await connect(config, { connector: walletConnect({ projectId }) });
      showPopup = false;
      
      // Check if the wallet is verified, if not redirect to verify page
      if (!isVerified) {
        goto('/verify-wallet');
      }
    } catch (error) {
      console.error("Failed to connect with WalletConnect:", error);
    }
  }

  // Function to handle wallet disconnection
  async function handleDisconnect() {
    try {
      // First clear the auth session
      clearSession();
      
      // Then disconnect the wallet
      await disconnect(config);
      
      // If we're on the verify-wallet page, redirect to homepage
      if (currentPath === '/verify-wallet') {
        goto('/');
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }

  // Toggle popup visibility
  function togglePopup() {
    showPopup = !showPopup;
  }

  // Close popup when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (showPopup && !target.closest('.wallet-popup') && !target.closest('.connect-button')) {
      showPopup = false;
    }
  }

  // Add event listener for outside clicks
  let clickOutsideHandler: ((event: MouseEvent) => void) | undefined;
  
  onMount(() => {
    // Check for existing session
    checkExistingSession();
    
    // Subscribe to auth store
    unsubscribeAuth = walletAuthStore.subscribe(state => {
      isVerified = state.isVerified;
    });
    
    clickOutsideHandler = (event: MouseEvent) => handleClickOutside(event);
    document.addEventListener('click', clickOutsideHandler);
    
    // Update current path when it changes
    if (typeof window !== 'undefined') {
      currentPath = window.location.pathname;
      
      // Listen for path changes
      const handleLocationChange = () => {
        currentPath = window.location.pathname;
      };
      
      window.addEventListener('popstate', handleLocationChange);
      
      return () => {
        window.removeEventListener('popstate', handleLocationChange);
      };
    }
  });
  
  onDestroy(() => {
    if (clickOutsideHandler) {
      document.removeEventListener('click', clickOutsideHandler);
    }
    
    if (unsubscribeAuth) {
      unsubscribeAuth();
    }
  });
  
  // Watch for wallet connection and redirect if needed
  $: if ($web3Store.isConnected && !isVerified) {
    goto('/verify-wallet');
  }
</script>

{#if $web3Store.isConnected}
  <Button variant="default" class="shadow-sm" on:click={handleDisconnect}>
    <div class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {#if $web3Store.address}
        {truncateAddress($web3Store.address)}
      {:else}
        Disconnect
      {/if}
    </div>
  </Button>
{:else if $web3Store.isConnecting}
  <Button variant="default" class="shadow-sm" disabled>
    <div class="flex items-center">
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Connecting...
    </div>
  </Button>
{:else}
  <div class="relative">
    <Button variant="default" class="shadow-sm connect-button" on:click={togglePopup}>
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Connect Wallet
      </div>
    </Button>
    
    {#if showPopup}
      <div class="wallet-popup absolute right-0 mt-2 w-64 bg-[#09090b] rounded-md shadow-lg z-50 border border-border overflow-hidden">
        <div class="p-4">
          <h3 class="text-sm font-medium text-white mb-3">Connect Wallet</h3>
          <div class="space-y-2">
            <button 
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-[#1a1a1a] transition-colors text-white"
              on:click={connectMetamask}
            >
              <div class="flex items-center">
                <img src="/images/metamask-logo.png" alt="MetaMask" class="h-6 w-6 mr-2 object-contain" />
                <span class="text-sm font-medium">MetaMask</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button 
              class="w-full flex items-center justify-between p-3 rounded-md hover:bg-[#1a1a1a] transition-colors text-white"
              on:click={connectWalletConnect}
            >
              <div class="flex items-center">
                <img src="/images/walletconnect-logo.png" alt="WalletConnect" class="h-6 w-6 mr-2 object-contain" />
                <span class="text-sm font-medium">WalletConnect</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .wallet-popup {
    animation: fadeIn 0.2s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style> 