<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getWalletAddress, setWalletAddressCookie } from '$lib/stores/walletAuth';
  import { getWalletSetupStatus } from '$lib/services/walletService';
  import type { Address } from 'viem';

  export let currentStep: number;

  // Using the setWalletAddressCookie function from walletAuth.ts

  onMount(async () => {
    try {
      // Get the wallet address from localStorage
      const walletAddress = getWalletAddress();

      if (!walletAddress) {
        console.log('No wallet address found, redirecting to payment step');
        goto('/activate');
        return;
      }

      // Set the wallet address cookie
      setWalletAddressCookie(walletAddress);

      // Check if the wallet has paid the fee
      const walletStatus = await getWalletSetupStatus(walletAddress);

      if (!walletStatus) {
        console.log('Could not get wallet status, redirecting to payment step');
        goto('/activate');
        return;
      }

      // If fee is not paid, redirect to payment step
      if (!walletStatus.fee_paid) {
        console.log('Fee not paid for wallet, redirecting to payment step');
        goto('/activate');
        return;
      }

      // Check if the user is trying to skip steps
      if (walletStatus.setup_step < currentStep - 1) {
        console.log('User trying to skip steps, redirecting to appropriate step');

        // Determine which step to redirect to based on setup_step
        let redirectStep = '/activate';

        switch (walletStatus.setup_step) {
          case 1:
            redirectStep = '/activate/choose-identity-type';
            break;
          case 2:
            redirectStep = '/activate/identity-data';
            break;
          case 3:
            redirectStep = '/activate/select-chain';
            break;
          case 4:
            redirectStep = '/activate/confirmation';
            break;
        }

        goto(redirectStep);
        return;
      }

      // If we get here, the user has paid the fee and is on the correct step
      console.log('Payment check passed, user can access this step');
    } catch (error) {
      console.error('Error in payment check:', error);
      goto('/activate');
    }
  });
</script>

<!-- This component doesn't render anything, it just performs the check -->
