<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { walletAuthStore, getWalletAddress, disconnectWallet } from '$lib/stores/walletAuth';
  import { setupStatusStore } from '$lib/stores/setupStatus';
  import { userIdentityStore } from '$lib/stores/userIdentityStore';
  import { web3Store } from '$lib/stores/web3';
  import { truncateAddress } from '$lib/utils/web3';
  import type { Address } from 'viem';
  import { getChainId, watchChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';

  let { children, data } = $props();
  let isAuthenticated = true; // We assume authentication is valid since server-side check passed
  let setupCompleted = true; // We assume setup is completed since server-side check passed
  let walletAddress = $state<Address | null>(data.walletAddress as Address || null);
  let chainId = $state<number | null>(null);
  let chainIcon = $state<string | null>(null);
  let chainName = $state<string | null>(null);
  let isMobileMenuOpen = $state(false);

  onMount(() => {
    // Subscribe to wallet auth store
    const unsubscribeAuth = walletAuthStore.subscribe(state => {
      isAuthenticated = state.isVerified;
    });

    // Subscribe to setup status store
    const unsubscribeSetup = setupStatusStore.subscribe(state => {
      setupCompleted = state.status?.setup_completed || false;
    });

    // Subscribe to user identity store
    const unsubscribeIdentity = userIdentityStore.subscribe(state => {
      // We don't want to set isLoading here anymore, as it's handled by each page
      // This prevents the entire dashboard from showing loading when only identities are loading
    });

    // If we don't have a wallet address from server data, try to get it from the store
    if (!walletAddress) {
      walletAddress = getWalletAddress() as Address;
    }

    // Load user identities
    if (walletAddress) {
      userIdentityStore.loadIdentities(walletAddress);
    }

    // We don't need client-side redirects anymore since we have server-side protection
    console.log('Dashboard loaded with wallet address:', walletAddress);

    return () => {
      unsubscribeAuth();
      unsubscribeSetup();
      unsubscribeIdentity();
    };
  });

  // Handle async operations separately
  onMount(() => {
    let unwatch: (() => void) | undefined;

    // Set up chain watcher
    const setupChainWatcher = async () => {
      try {
        chainId = await getChainId(config);
        console.log('Current chain ID:', chainId);

        // Fetch chain information
        if (chainId) {
          const response = await fetch(`/api/chains/info?chainId=${chainId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.chain) {
              chainIcon = data.chain.icon_url || null;
              chainName = data.chain.name || null;
              console.log('Chain info:', data.chain);
            }
          }
        }

        // Set up chain change watcher
        unwatch = watchChainId(config, {
          onChange: async (newChainId) => {
            console.log('Chain changed to:', newChainId);
            chainId = newChainId;

            // Fetch updated chain information
            const response = await fetch(`/api/chains/info?chainId=${newChainId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.chain) {
                chainIcon = data.chain.icon_url || null;
                chainName = data.chain.name || null;
                console.log('Updated chain info:', data.chain);
              }
            }
          }
        });
      } catch (error) {
        console.error('Error getting chain ID:', error);
      }
    };

    setupChainWatcher();

    // Return cleanup function
    return () => {
      if (unwatch) unwatch();
    };
  });

  // Function to handle logout
  async function handleLogout() {
    await disconnectWallet();
    goto('/');
  }

  // Function to toggle mobile menu
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  // Close mobile menu when route changes
  $effect(() => {
    if ($page.url.pathname) {
      isMobileMenuOpen = false;
    }
  });
</script>

<div class="md:min-h-screen bg-background">
  <!-- Mobile Header - Only visible on small screens -->
  <div class="hidden md:hidden flex items-center justify-between p-4 border-b border-border md:sticky top-0 z-10 bg-background">
    <h2 class="font-semibold text-gray-800 dark:text-white">Dashboard</h2>
    <button
      type="button"
      class="p-2 rounded-md hover:bg-muted/50 transition-colors"
      on:click={toggleMobileMenu}
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {#if isMobileMenuOpen}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        {/if}
      </svg>
    </button>
  </div>

  <div class="flex md:min-h-[calc(100vh-56px)] md:min-h-screen">
    <!-- Sidebar - Hidden on mobile by default, shown when menu is open -->
    <div
      class="bg-background border-r border-border fixed md:sticky md:h-screen z-20 transition-all duration-300 transform
             md:transform-none md:translate-x-0 md:w-72 w-72 top-[65px] md:top-[4.65rem] right-0
             {isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}"
    >
      <div class="p-4 border-b border-border px-6">
        <h2 class="font-semibold text-gray-800 dark:text-white">Dashboard</h2>
      </div>
      <nav class="mt-4 flex flex-col justify-between md:h-[calc(100%-4rem)]">
        <div>
          <a
            href="/dashboard/identities"
            class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
            class:active={$page.url.pathname === '/dashboard/identities' || $page.url.pathname === '/dashboard/create-identity' || $page.url.pathname === '/dashboard/update-identity'}
          >
            Identities
          </a>
          <a
            href="/dashboard/catalogue"
            class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
            class:active={$page.url.pathname === '/dashboard/catalogue'}
          >
            Catalogue Raisonné
          </a>
          <a
            href="/dashboard/collection"
            class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
            class:active={$page.url.pathname === '/dashboard/collection'}
          >
            My Collection
          </a>
          {#if walletAddress}
            <hr class="mt-4 mb-6 border-border" />
            <div class="text-gray-500 dark:text-neutral-500 flex items-center mb-1 pl-6 text-sm">
              {#if chainIcon}
                <img
                  src={chainIcon}
                  alt={chainName || 'Chain'}
                  class="w-4 h-4 mr-2"
                  on:error={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = `https://placehold.co/16x16/svg?text=${chainId}`;
                  }}
                />
              {:else if chainId}
                <div class="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] mr-2">
                  {chainId}
                </div>
              {/if}
              <span>{truncateAddress(walletAddress)}</span>
            </div>
            <button
              type="button"
              class="w-full text-left text-sm px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
              on:click={handleLogout}
            >
              Disconnect Wallet
            </button>
          {/if}
        </div>
      </nav>
    </div>

    <!-- Overlay for mobile menu -->
    {#if isMobileMenuOpen}
      <div
        class="fixed inset-0 bg-black/20 dark:bg-black/50 z-10 md:hidden"
        on:click={toggleMobileMenu}
        aria-hidden="true"
      ></div>
    {/if}

    <!-- Main Content -->
    <div class="flex-1 w-full py-6 md:py-0">
      <div class=" p-4 sm:p-6 md:p-8 lg:p-10 md:min-h-screen" >
        {@render children()}
      </div>
    </div>
  </div>
</div>

<style>
  .active {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 6px;
    text-decoration-thickness: 2px;
    font-weight: 600;
  }
</style>

