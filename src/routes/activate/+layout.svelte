<script lang="ts">
  import '../../app.css';
  import Web3Provider from '$lib/components/Web3Provider.svelte';
  import { onMount } from 'svelte';
  import { themeStore } from '$lib/stores/theme';
  import { goto } from '$app/navigation';
  import { getWalletAddress } from '$lib/stores/walletAuth';
  import { getWalletSetupStatus } from '$lib/services/walletService';

  let { children } = $props();

  // Initialize the theme and check wallet setup status
  onMount(async () => {
    // Force a theme update on mount
    themeStore.update(theme => theme);

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
  });
</script>

<Web3Provider>
  <div class="min-h-screen">
    {@render children()}
  </div>
</Web3Provider>
