<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { getWalletAddress, disconnectWallet } from '$lib/stores/walletAuth';
  import { userIdentityStore } from '$lib/stores/userIdentityStore';
  import { web3Store } from '$lib/stores/web3';
  import type { UserIdentity } from '$lib/services/userIdentityService';
  import type { Address } from 'viem';
  import { getChainId, watchChainId } from 'wagmi/actions';
  import { config } from '$lib/web3/config';

  // Define props using $props() for Svelte 5 runes mode
  let { primaryIdentity = null, isLoading = true } = $props<{
    primaryIdentity?: UserIdentity | null;
    isLoading?: boolean;
  }>();

  let isOpen = $state(false);
  let menuRef: HTMLDivElement;
  let buttonRef: HTMLButtonElement;
  let walletAddress = $state<string | null>(null);
  let chainId = $state<number | null>(null);
  let chainIcon = $state<string | null>(null);
  let chainName = $state<string | null>(null);

  // Function to toggle dropdown
  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // Function to handle logout
  async function handleLogout() {
    await disconnectWallet();
    isOpen = false;
    goto('/');
  }

  // Handle click outside to close dropdown
  function handleClickOutside(event: MouseEvent) {
    if (isOpen && menuRef && buttonRef &&
        !menuRef.contains(event.target as Node) &&
        !buttonRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  // Handle touch outside to close dropdown
  function handleTouchOutside(event: TouchEvent) {
    if (isOpen && menuRef && buttonRef &&
        !menuRef.contains(event.target as Node) &&
        !buttonRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  // Handle escape key to close dropdown
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  }

  onMount(() => {
    // Add event listeners
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('touchstart', handleTouchOutside);

    // Get the connected wallet address
    walletAddress = getWalletAddress() as string;

    // If primaryIdentity is not provided, load it from the store
    if (!primaryIdentity) {
      // Subscribe to user identity store
      const unsubscribe = userIdentityStore.subscribe(state => {
        primaryIdentity = state.primaryIdentity;
        isLoading = state.isLoading;
      });

      // Load user identities if not already loaded
      const walletAddress = getWalletAddress() as Address;
      if (walletAddress) {
        userIdentityStore.loadIdentities(walletAddress);
      }

      return () => {
        unsubscribe();
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeydown);
        document.removeEventListener('touchstart', handleTouchOutside);
      };
    }

    // Return cleanup function for when primaryIdentity is provided
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('touchstart', handleTouchOutside);
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
</script>

<div class="relative">
  <!-- User Menu Button -->
  <button
    bind:this={buttonRef}
    type="button"
    class="user-menu-button rounded-full overflow-hidden border border-primary/20 hover:border-primary/50 transition-all duration-200 p-0.5 cursor-pointer"
    on:click={toggleDropdown}
    aria-haspopup="true"
    aria-expanded={isOpen}
  >
    {#if isLoading}
      <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    {:else if primaryIdentity && primaryIdentity.identity_image}
      <img
        src={primaryIdentity.identity_image}
        alt={primaryIdentity.name}
        class="w-8 h-8 rounded-full object-cover"
      />
    {:else}
      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    {/if}
  </button>

  <!-- Custom Dropdown Menu -->
  {#if isOpen}
    <div
      bind:this={menuRef}
      class="absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white dark:bg-[#09090b] border border-gray-200 dark:border-neutral-800 z-[100] user-menu"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <!-- User Info Section -->
      {#if primaryIdentity}
        <div class="px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div class="flex items-center space-x-3">
            {#if primaryIdentity.identity_image}
              <img
                src={primaryIdentity.identity_image}
                alt={primaryIdentity.name}
                class="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-neutral-700"
              />
            {:else}
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-gray-200 dark:border-neutral-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            {/if}
            <div>
              <div class="font-medium text-gray-900 dark:text-white">{primaryIdentity.name}</div>
              <div class="text-xs text-gray-500 dark:text-neutral-400 capitalize">{primaryIdentity.type}</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Dashboard Section -->
      <div class="py-2">
        <div class="px-5 py-3 text-xs font-semibold uppercase tracking-wider">
          Dashboard
        </div>

        <button
          type="button"
          class="block w-full text-left px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white flex items-center"
          role="menuitem"
          on:click={() => { isOpen = false; goto('/dashboard/identities'); }}
        >
          Identities
        </button>

        <button
          type="button"
          class="block w-full text-left px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white flex items-center"
          role="menuitem"
          on:click={() => { isOpen = false; goto('/dashboard/catalogue'); }}
        >
          Catalogue Raisonné
        </button>

        <button
          type="button"
          class="block w-full text-left px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white flex items-center"
          role="menuitem"
          on:click={() => { isOpen = false; goto('/dashboard/collection'); }}
        >
          My Collection
        </button>
      </div>

      <!-- Logout Section -->
      <div class="py-2 border-t border-gray-100 dark:border-neutral-800">
        {#if walletAddress}
          <div class="px-5 py-2 text-xs text-gray-500 dark:text-neutral-500 font-mono flex items-center">
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
            <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
          </div>
        {/if}
        <button
          type="button"
          class="block w-full text-left px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white flex items-center"
          role="menuitem"
          on:click={handleLogout}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Add animation for dropdown */
  .user-menu {
    animation: dropdown-in 0.2s ease-out;
    transform-origin: top right;
    max-height: calc(100vh - 80px); /* Prevent overflow on small screens */
    overflow-y: auto; /* Allow scrolling if content is too tall */
  }

  @keyframes dropdown-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* Improve touch targets for mobile */
  @media (max-width: 640px) {
    .user-menu button {
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
    }
  }
</style>
