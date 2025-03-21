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

  let { children } = $props();
  let isAuthenticated = false;
  let setupCompleted = false;
  let isLoading = true;
  let walletAddress = $state<Address | null>(null);
  let chainId = $state<number | null>(null);
  let chainIcon = $state<string | null>(null);
  let chainName = $state<string | null>(null);

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
      isLoading = state.isLoading;
    });

    // Get the connected wallet address
    walletAddress = getWalletAddress() as Address;

    // Load user identities if authenticated
    if (isAuthenticated) {
      const walletAddr = getWalletAddress() as Address;
      if (walletAddr) {
        userIdentityStore.loadIdentities(walletAddr);
      }
    }

    // Check if user is authenticated and setup is completed
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to home');
      goto('/');
    } else if (!setupCompleted) {
      console.log('Setup not completed, redirecting to home');
      goto('/');
    } else {
      console.log('User authenticated and setup completed, showing dashboard');
    }

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
</script>

<div class="flex h-screen bg-background pt-2 h-[calc(100vh-80px)]">
  <!-- Sidebar -->
  <div class="w-64 bg-background border-r border-gray-200 dark:border-gray-800 h-full pt-1">
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 px-6">
      <h2 class="font-semibold text-gray-800 dark:text-white">Dashboard</h2>
    </div>
    <nav class="mt-4 flex flex-col justify-between h-[calc(100%-4rem)]">
      <div>
        <a
          href="/dashboard/identities"
          class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200"
          class:active={$page.url.pathname === '/dashboard/identities'}
        >
          Identities
        </a>
        <a
          href="/dashboard/catalogue"
          class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200"
          class:active={$page.url.pathname === '/dashboard/catalogue'}
        >
          Catalogue Raisonné
        </a>
        <a
          href="/dashboard/collection"
          class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200"
          class:active={$page.url.pathname === '/dashboard/collection'}
        >
          My Collection
        </a>
        {#if walletAddress}
          <hr class="mt-4 mb-6 border-gray-200 dark:border-gray-800" />
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
            class="w-full text-left text-sm px-6 py-2 text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
            on:click={handleLogout}
          >
            Disconnect Wallet
          </button>
        {/if}
      </div>

    </nav>
  </div>

  <!-- Main Content -->
  <div class="flex-1 overflow-auto h-full">
    {#if isLoading}
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    {:else}
      <div class="p-6">
        {@render children()}
      </div>
    {/if}
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

