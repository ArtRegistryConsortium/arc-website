<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createWeb3Modal } from '@web3modal/wagmi';
  import { config } from '$lib/web3/config';
  import { setConnected, setDisconnected, setConnecting, setError } from '$lib/stores/web3';
  import { watchAccount, reconnect } from 'wagmi/actions';
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
  import { checkExistingSession, walletAuthStore } from '$lib/stores/walletAuth';
  import { browser } from '$app/environment';

  // Get WalletConnect project ID from environment variable
  const projectId = PUBLIC_WALLETCONNECT_ID || '';

  let unwatch: (() => void) | undefined;
  let isSessionChecked = false;

  onMount(async () => {
    // Initialize Web3Modal
    createWeb3Modal({
      wagmiConfig: config,
      projectId,
      themeMode: 'light', // or 'dark'
      themeVariables: {
        '--w3m-accent': 'hsl(var(--primary))',
        '--w3m-border-radius-master': '0.5rem'
      }
    });

    // First check for existing auth session
    if (browser) {
      isSessionChecked = checkExistingSession();
      console.log('Existing session checked:', isSessionChecked);
    }

    // Try to reconnect to the previously connected wallet
    try {
      await reconnect(config);
    } catch (error) {
      console.error('Failed to reconnect wallet:', error);
    }

    // Watch for account changes
    unwatch = watchAccount(config, {
      onChange(account) {
        if (account.isConnected && account.address && account.chainId) {
          setConnected(account.address, account.chainId);
          
          // If we have a session but wallet address changed, check if it matches
          if (browser && isSessionChecked) {
            const sessionAddress = localStorage.getItem('wallet_session_address');
            if (sessionAddress && sessionAddress.toLowerCase() !== account.address.toLowerCase()) {
              console.log('Wallet address changed, session may be invalid');
              // You might want to verify the session again or clear it
            }
          }
        } else {
          setDisconnected();
        }

        if (account.isConnecting) {
          setConnecting(true);
        }

        // Handle errors if they exist
        if ('error' in account && account.error instanceof Error) {
          setError(account.error);
        }
      }
    });
  });

  onDestroy(() => {
    if (unwatch) {
      unwatch();
    }
  });
</script>

<slot /> 