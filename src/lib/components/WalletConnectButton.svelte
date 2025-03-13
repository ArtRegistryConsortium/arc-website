<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { web3Store } from "$lib/stores/web3";
  import { disconnect, connect } from "wagmi/actions";
  import { injected, walletConnect } from "wagmi/connectors";
  import { config } from "$lib/web3/config";
  import { truncateAddress } from "$lib/utils/web3";
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';

  // Get WalletConnect project ID from environment variable
  const projectId = PUBLIC_WALLETCONNECT_ID || '';

  // Function to handle wallet connection
  async function handleConnect() {
    try {
      // First try injected connector (MetaMask, etc.)
      await connect(config, { connector: injected() });
    } catch (error) {
      console.error("Failed to connect with injected wallet:", error);
      try {
        // Fall back to WalletConnect
        await connect(config, { connector: walletConnect({ projectId }) });
      } catch (walletConnectError) {
        console.error("Failed to connect with WalletConnect:", walletConnectError);
      }
    }
  }

  // Function to handle wallet disconnection
  async function handleDisconnect() {
    try {
      await disconnect(config);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  }
</script>

{#if $web3Store.isConnected}
  <Button variant="default" class="shadow-sm" onclick={handleDisconnect}>
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
  <Button variant="default" class="shadow-sm" onclick={handleConnect}>
    <div class="flex items-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
      </svg>
      Connect Wallet
    </div>
  </Button>
{/if} 