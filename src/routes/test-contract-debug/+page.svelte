<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select/index.js';
  import { web3Store } from '$lib/stores/web3';
  import { walletAuthStore, getWalletAddress } from '$lib/stores/walletAuth';
  import { connect, disconnect, getAccount, getChainId, switchChain, readContract, writeContract, waitForTransaction } from 'wagmi/actions';
  import { injected, walletConnect } from 'wagmi/connectors';
  import { config } from '$lib/web3/config';
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
  import { truncateAddress } from '$lib/utils/web3';
  import { IDENTITY_ABI } from '$lib/services/contractService';
  import type { Address } from 'viem';
  import { mainnet, sepolia, optimism, arbitrum, base } from 'viem/chains';

  // State variables
  let isConnected = false;
  let isConnecting = false;
  let walletAddress: Address | null = null;
  let chainId: number | null = null;
  let chainName = '';
  let contractAddress = '';
  let functionName = '';
  let functionArgs = '';
  let debugOutput = '';
  let isLoading = false;
  let transactionHash = '';
  let transactionReceipt: any = null;
  let contractResponse: any = null;

  // Chain options
  const chains = [
    { id: mainnet.id, name: 'Ethereum Mainnet' },
    { id: sepolia.id, name: 'Sepolia Testnet' },
    { id: optimism.id, name: 'Optimism' },
    { id: arbitrum.id, name: 'Arbitrum' },
    { id: base.id, name: 'Base' }
  ] as const;

  // Common contract functions
  const commonFunctions = [
    { name: 'createIdentity', args: '[0, "Test Name", "Test Description", "https://example.com/image.jpg", [], [], 0, 0, "", [], "", ""]' },
    { name: 'getIdentity', args: '1' },
    { name: 'getIdentityCount', args: '' },
    { name: 'getIdentitiesByOwner', args: '' }
  ];

  // Subscribe to web3 store
  web3Store.subscribe(state => {
    isConnected = state.isConnected;
    isConnecting = state.isConnecting;
    walletAddress = state.address;
    chainId = state.chainId;
  });

  // Function to connect wallet
  async function connectWallet(type: 'injected' | 'walletconnect') {
    try {
      isConnecting = true;
      appendToDebug(`Connecting with ${type === 'injected' ? 'MetaMask' : 'WalletConnect'}...`);

      if (type === 'injected') {
        await connect(config, { connector: injected() });
      } else {
        await connect(config, { connector: walletConnect({ projectId: PUBLIC_WALLETCONNECT_ID }) });
      }

      const account = getAccount(config);
      if (account.isConnected && account.address) {
        walletAddress = account.address;
        chainId = account.chainId ?? null;
        updateChainName();
        appendToDebug(`Connected to wallet: ${truncateAddress(account.address)}`);
        appendToDebug(`Chain ID: ${account.chainId}`);
      }
    } catch (error) {
      appendToDebug(`Error connecting wallet: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isConnecting = false;
    }
  }

  // Function to disconnect wallet
  async function disconnectWallet() {
    try {
      appendToDebug('Disconnecting wallet...');
      await disconnect(config);
      appendToDebug('Wallet disconnected');
    } catch (error) {
      appendToDebug(`Error disconnecting wallet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Function to switch chain
  async function handleSwitchChain(event: CustomEvent) {
    try {
      const newChainId = parseInt(event.detail);
      appendToDebug(`Switching to chain ID: ${newChainId}`);

      await switchChain(config, { chainId: newChainId as typeof chains[number]['id'] });

      chainId = newChainId;
      updateChainName();
      appendToDebug(`Switched to chain: ${chainName}`);
    } catch (error) {
      appendToDebug(`Error switching chain: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Function to update chain name
  function updateChainName() {
    const chain = chains.find(c => c.id === chainId);
    chainName = chain ? chain.name : `Unknown Chain (${chainId})`;
  }

  // Function to select a common function
  function selectCommonFunction(event: CustomEvent) {
    const selected = commonFunctions.find(f => f.name === event.detail);
    if (selected) {
      functionName = selected.name;
      functionArgs = selected.args;
      appendToDebug(`Selected function: ${functionName} with args: ${functionArgs}`);
    }
  }

  // Function to read from contract
  async function readFromContract() {
    if (!isConnected || !contractAddress || !functionName) {
      appendToDebug('Please connect wallet, enter contract address and function name');
      return;
    }

    try {
      isLoading = true;
      appendToDebug(`Reading from contract ${contractAddress}...`);
      appendToDebug(`Function: ${functionName}`);

      // Parse arguments if provided
      let args: any[] = [];
      if (functionArgs.trim()) {
        try {
          args = JSON.parse(`[${functionArgs}]`);
          appendToDebug(`Arguments: ${JSON.stringify(args)}`);
        } catch (e) {
          appendToDebug(`Error parsing arguments: ${e instanceof Error ? e.message : String(e)}`);
          return;
        }
      }

      // Read from contract
      const result = await readContract(config, {
        address: contractAddress as Address,
        abi: IDENTITY_ABI,
        functionName,
        args
      });

      contractResponse = result;
      appendToDebug(`Contract response: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      appendToDebug(`Error reading from contract: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isLoading = false;
    }
  }

  // Function to write to contract
  async function writeToContract() {
    if (!isConnected || !contractAddress || !functionName) {
      appendToDebug('Please connect wallet, enter contract address and function name');
      return;
    }

    try {
      isLoading = true;
      appendToDebug(`Writing to contract ${contractAddress}...`);
      appendToDebug(`Function: ${functionName}`);

      // Parse arguments if provided
      let args: any[] = [];
      if (functionArgs.trim()) {
        try {
          args = JSON.parse(`[${functionArgs}]`);
          appendToDebug(`Arguments: ${JSON.stringify(args)}`);
        } catch (e) {
          appendToDebug(`Error parsing arguments: ${e instanceof Error ? e.message : String(e)}`);
          return;
        }
      }

      // Write to contract
      const hash = await writeContract(config, {
        address: contractAddress as Address,
        abi: IDENTITY_ABI,
        functionName,
        args
      });

      transactionHash = hash as string;
      appendToDebug(`Transaction sent: ${transactionHash}`);

      // Wait for transaction to be mined
      appendToDebug('Waiting for transaction to be mined...');
      const receipt = await waitForTransaction(config, {
        hash,
        confirmations: 1
      });

      transactionReceipt = receipt;
      appendToDebug(`Transaction mined: ${JSON.stringify(receipt, null, 2)}`);
    } catch (error) {
      appendToDebug(`Error writing to contract: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isLoading = false;
    }
  }

  // Function to append to debug output
  function appendToDebug(message: string) {
    const timestamp = new Date().toISOString();
    debugOutput += `[${timestamp}] ${message}\n`;
    // Auto-scroll to bottom
    setTimeout(() => {
      const debugElement = document.getElementById('debug-output');
      if (debugElement) {
        debugElement.scrollTop = debugElement.scrollHeight;
      }
    }, 0);
  }

  // Function to clear debug output
  function clearDebug() {
    debugOutput = '';
  }

  // Initialize on mount
  onMount(async () => {
    appendToDebug('Page initialized');

    // Check if wallet is already connected
    const account = getAccount(config);
    if (account.isConnected && account.address) {
      walletAddress = account.address;
      chainId = account.chainId ?? null;
      updateChainName();
      appendToDebug(`Already connected to wallet: ${truncateAddress(account.address)}`);
      appendToDebug(`Chain ID: ${account.chainId}`);
    }

    // Get contract address from URL query params if available
    const urlParams = new URLSearchParams(window.location.search);
    const contractParam = urlParams.get('contract');
    if (contractParam) {
      contractAddress = contractParam;
      appendToDebug(`Contract address set from URL: ${contractAddress}`);
    }
  });
</script>

<svelte:head>
  <title>Test Contract Debug</title>
</svelte:head>

<div class="container mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-6">Test Contract Debug</h1>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left Column: Controls -->
    <div class="space-y-6">
      <!-- Wallet Connection -->
      <Card class="p-6">
        <h2 class="text-xl font-semibold mb-4">Wallet Connection</h2>

        {#if isConnected}
          <div class="mb-4">
            <p class="text-sm text-muted-foreground mb-1">Connected Address:</p>
            <p class="font-mono bg-muted p-2 rounded">{walletAddress}</p>
          </div>
          <div class="mb-4">
            <p class="text-sm text-muted-foreground mb-1">Chain:</p>
            <p class="font-mono bg-muted p-2 rounded">{chainName} (ID: {chainId})</p>
          </div>
          <div class="flex space-x-2">
            <Button variant="destructive" on:click={disconnectWallet} disabled={isConnecting}>
              Disconnect Wallet
            </Button>
          </div>
        {:else}
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button on:click={() => connectWallet('injected')} disabled={isConnecting}>
              {#if isConnecting}
                <span class="animate-spin mr-2">⟳</span>
              {/if}
              Connect MetaMask
            </Button>
            <Button on:click={() => connectWallet('walletconnect')} disabled={isConnecting}>
              {#if isConnecting}
                <span class="animate-spin mr-2">⟳</span>
              {/if}
              Connect WalletConnect
            </Button>
          </div>
        {/if}
      </Card>

      <!-- Chain Selection -->
      {#if isConnected}
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Chain Selection</h2>
          <div class="mb-4">
            <p class="text-sm font-medium mb-2">Select Chain</p>
            <Select on:valueChange={handleSwitchChain}>
              <SelectTrigger>
                <span>{chainName || 'Select a chain'}</span>
              </SelectTrigger>
              <SelectContent>
                {#each chains as chain}
                  <SelectItem value={chain.id.toString()}>{chain.name}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
        </Card>
      {/if}

      <!-- Contract Interaction -->
      <Card class="p-6">
        <h2 class="text-xl font-semibold mb-4">Contract Interaction</h2>

        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium mb-2">Contract Address</p>
            <input
              type="text"
              bind:value={contractAddress}
              placeholder="0x..."
              class="w-full p-2 border rounded-md bg-background"
            />
          </div>

          <div>
            <p class="text-sm font-medium mb-2">Common Functions</p>
            <Select on:valueChange={selectCommonFunction}>
              <SelectTrigger>
                <span>{functionName || 'Select a function'}</span>
              </SelectTrigger>
              <SelectContent>
                {#each commonFunctions as func}
                  <SelectItem value={func.name}>{func.name}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>

          <div>
            <p class="text-sm font-medium mb-2">Function Name</p>
            <input
              type="text"
              bind:value={functionName}
              placeholder="e.g., createIdentity"
              class="w-full p-2 border rounded-md bg-background"
            />
          </div>

          <div>
            <p class="text-sm font-medium mb-2">Function Arguments (comma-separated)</p>
            <Textarea bind:value={functionArgs} placeholder="e.g., 0, &quot;Name&quot;, &quot;Description&quot;" rows={3} />
          </div>

          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button on:click={readFromContract} disabled={isLoading || !isConnected}>
              {#if isLoading}
                <span class="animate-spin mr-2">⟳</span>
              {/if}
              Read Contract
            </Button>
            <Button variant="destructive" on:click={writeToContract} disabled={isLoading || !isConnected}>
              {#if isLoading}
                <span class="animate-spin mr-2">⟳</span>
              {/if}
              Write Contract
            </Button>
          </div>
        </div>
      </Card>
    </div>

    <!-- Right Column: Debug Output -->
    <div class="space-y-6">
      <Card class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Debug Output</h2>
          <Button variant="outline" size="sm" on:click={clearDebug}>Clear</Button>
        </div>
        <div id="debug-output" class="font-mono text-sm bg-muted p-4 rounded h-[500px] overflow-auto whitespace-pre-wrap">
          {debugOutput || 'No debug output yet. Connect a wallet to begin.'}
        </div>
      </Card>

      {#if contractResponse}
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Contract Response</h2>
          <div class="font-mono text-sm bg-muted p-4 rounded overflow-auto max-h-[300px] whitespace-pre-wrap">
            {JSON.stringify(contractResponse, null, 2)}
          </div>
        </Card>
      {/if}

      {#if transactionHash}
        <Card class="p-6">
          <h2 class="text-xl font-semibold mb-4">Transaction Details</h2>
          <div class="mb-4">
            <p class="text-sm text-muted-foreground mb-1">Transaction Hash:</p>
            <p class="font-mono bg-muted p-2 rounded break-all">{transactionHash}</p>
          </div>

          {#if transactionReceipt}
            <div>
              <p class="text-sm text-muted-foreground mb-1">Transaction Receipt:</p>
              <div class="font-mono text-sm bg-muted p-4 rounded overflow-auto max-h-[300px] whitespace-pre-wrap">
                {JSON.stringify(transactionReceipt, null, 2)}
              </div>
            </div>
          {/if}
        </Card>
      {/if}
    </div>
  </div>
</div>
