<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { walletAuthStore, getWalletAddress } from '$lib/stores/walletAuth';
  import { setupStatusStore } from '$lib/stores/setupStatus';
  import { userIdentityStore } from '$lib/stores/userIdentityStore';
  import type { Address } from 'viem';

  let { children } = $props();
  let isAuthenticated = false;
  let setupCompleted = false;
  let isLoading = true;

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

    // Load user identities if authenticated
    if (isAuthenticated) {
      const walletAddress = getWalletAddress() as Address;
      if (walletAddress) {
        userIdentityStore.loadIdentities(walletAddress);
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
</script>

<div class="flex h-screen bg-gray-100 dark:bg-gray-900 pt-16 md:pt-20">
  <!-- Sidebar -->
  <div class="w-64 bg-white dark:bg-gray-800 shadow-md h-full">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
    </div>
    <nav class="mt-4">
      <a
        href="/dashboard/identities"
        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        class:active={$page.url.pathname === '/dashboard/identities'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Identities
      </a>
      <a
        href="/dashboard/catalogue"
        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        class:active={$page.url.pathname === '/dashboard/catalogue'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Catalogue Raisonné
      </a>
      <a
        href="/dashboard/collection"
        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        class:active={$page.url.pathname === '/dashboard/collection'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        My Collection
      </a>
      <a
        href="/"
        class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to Home
      </a>
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
    background-color: hsl(var(--primary) / 0.1);
    color: hsl(var(--primary));
    font-weight: 500;
  }
</style>
