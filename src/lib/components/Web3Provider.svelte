<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createWeb3Modal } from '@web3modal/wagmi';
  import { config } from '$lib/web3/config';
  import { setConnected, setDisconnected, setConnecting, setError } from '$lib/stores/web3';
  import { watchAccount } from 'wagmi/actions';
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';

  // Get WalletConnect project ID from environment variable
  const projectId = PUBLIC_WALLETCONNECT_ID || '';

  let unwatch: (() => void) | undefined;

  onMount(() => {
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

    // Watch for account changes
    unwatch = watchAccount(config, {
      onChange(account) {
        if (account.isConnected && account.address && account.chainId) {
          setConnected(account.address, account.chainId);
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