<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createWeb3Modal } from '@web3modal/wagmi';
  import { config } from '$lib/web3/config';
  import { setConnected, setDisconnected, setConnecting, setError } from '$lib/stores/web3';
  import { watchAccount, reconnect, getAccount } from 'wagmi/actions';
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
  import { checkExistingSession, walletAuthStore } from '$lib/stores/walletAuth';
  import { browser } from '$app/environment';
  import { get } from 'svelte/store';

  // Get WalletConnect project ID from environment variable
  const projectId = PUBLIC_WALLETCONNECT_ID || '';

  let unwatch: (() => void) | undefined;
  let isSessionChecked = false;

  // Function to handle wallet reconnection and session validation
  async function handleWalletReconnection() {
    if (!browser) return;

    // First check for existing auth session
    const hasValidSession = checkExistingSession();
    isSessionChecked = hasValidSession;
    console.log('Existing session checked:', hasValidSession);

    // Get the current path
    const currentPath = window.location.pathname;
    console.log('Current path during reconnection:', currentPath);

    // Try to reconnect to the previously connected wallet
    try {
      await reconnect(config);

      // After reconnection, check if the wallet address matches the session
      const account = getAccount(config);
      const sessionAddress = localStorage.getItem('wallet_session_address');
      const isWalletVerified = localStorage.getItem('wallet_verified') === 'true';

      console.log('Wallet reconnection status:', {
        isConnected: account.isConnected,
        address: account.address ? account.address.substring(0, 10) + '...' : null,
        hasValidSession,
        isWalletVerified,
        currentPath
      });

      if (account.isConnected && account.address) {
        // Update the web3 store with the connected account
        setConnected(account.address, account.chainId || 1);

        // Check if we need to redirect to verify-wallet page
        if ((!hasValidSession || !isWalletVerified) && currentPath !== '/verify-wallet') {
          console.log('Redirecting to verify-wallet page after reconnection');
          // Use a short timeout to ensure state is updated before redirect
          setTimeout(() => {
            window.location.href = '/verify-wallet';
          }, 100);
          return;
        }

        // Validate that the reconnected wallet matches the session address
        if (hasValidSession && sessionAddress && sessionAddress.toLowerCase() !== account.address.toLowerCase()) {
          console.warn('Wallet address mismatch with stored session');
          // Redirect to verify page if addresses don't match
          if (currentPath !== '/verify-wallet') {
            console.log('Redirecting to verify-wallet page due to address mismatch');
            setTimeout(() => {
              window.location.href = '/verify-wallet';
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error('Failed to reconnect wallet:', error);
    }
  }

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

    // Handle wallet reconnection
    await handleWalletReconnection();

    // Watch for account changes
    unwatch = watchAccount(config, {
      onChange(account) {
        console.log('Account change detected:', {
          isConnected: account.isConnected,
          address: account.address ? account.address.substring(0, 10) + '...' : null,
          chainId: account.chainId,
          isConnecting: account.isConnecting,
          hasError: 'error' in account
        });

        if (account.isConnected && account.address && account.chainId) {
          console.log('Setting connected state with address:', account.address.substring(0, 10) + '...');
          setConnected(account.address, account.chainId);

          // Check if we need to redirect to verify-wallet page
          if (browser) {
            const hasValidSession = localStorage.getItem('wallet_session_token') !== null;
            const isWalletVerified = localStorage.getItem('wallet_verified') === 'true';
            const currentPath = window.location.pathname;

            console.log('Checking if redirect needed:', { hasValidSession, isWalletVerified, currentPath });

            // If not verified and not already on verify-wallet page, redirect
            if ((!hasValidSession || !isWalletVerified) && currentPath !== '/verify-wallet') {
              console.log('Redirecting to verify-wallet page from Web3Provider');
              // Use a short timeout to ensure state is updated before redirect
              setTimeout(() => {
                window.location.href = '/verify-wallet';
              }, 100);
            }
          }
        } else if (!account.isConnected) {
          console.log('Setting disconnected state');
          setDisconnected();
        }

        if (account.isConnecting) {
          console.log('Setting connecting state');
          setConnecting(true);
        }

        // Handle errors if they exist
        if ('error' in account && account.error instanceof Error) {
          console.error('Account error:', account.error);
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