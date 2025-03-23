<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import { Card } from '$lib/components/ui/card/index.js';
  import { Textarea } from '$lib/components/ui/textarea/index.js';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select/index.js';
  import { web3Store } from '$lib/stores/web3';
  import { walletAuthStore, getWalletAddress } from '$lib/stores/walletAuth';
  import { connect, disconnect, getAccount, getChainId, switchChain, readContract, writeContract, waitForTransaction } from 'wagmi/actions';
  import { injected, walletConnect } from 'wagmi/connectors';
  import { config } from '$lib/web3/config';
  import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';
  import { truncateAddress } from '$lib/utils/web3';
  import { IDENTITY_ABI, getContractInfo, type ContractInfo } from '$lib/services/contractService';
  import type { Address } from 'viem';
  import { mainnet, sepolia, optimism, arbitrum, arbitrumSepolia, base } from 'viem/chains';
  import type { Chain } from '$lib/services/activationService';

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
  let dbChains: Chain[] = [];
  let isLoadingChains = false;
  let chainsError = '';
  let contractInfo: ContractInfo | null = null;
  let isLoadingContracts = false;
  let contractsError = '';
  let selectedContractType: 'identity' | 'art' | 'artFactory' = 'identity';

  // Default chain options (fallback)
  const defaultChains = [
    { id: mainnet.id, name: 'Ethereum Mainnet' },
    { id: sepolia.id, name: 'Sepolia Testnet' },
    { id: optimism.id, name: 'Optimism' },
    { id: arbitrum.id, name: 'Arbitrum' },
    { id: base.id, name: 'Base' }
  ] as const;

  // Supported chain IDs type
  type SupportedChainId = typeof mainnet.id | typeof sepolia.id | typeof optimism.id | typeof arbitrum.id | typeof arbitrumSepolia.id | typeof base.id;
  const supportedChainIds: SupportedChainId[] = [mainnet.id, sepolia.id, optimism.id, arbitrum.id, arbitrumSepolia.id, base.id];

  // Common contract functions
  const commonFunctions = [
    { name: 'createIdentity', args: '[0, "Test Name", "Test Description", "https://example.com/image.jpg", "", [], 0, 0, "", "", "", ""]' },
    { name: 'getIdentityById', args: '1' },
    { name: 'getIdentityByAddress', args: '"0x0000000000000000000000000000000000000000"' },
    { name: 'getAllIdentities', args: '' },
    { name: 'getIdentityCount', args: '' }
  ];

  // Subscribe to web3 store
  web3Store.subscribe(state => {
    isConnected = state.isConnected;
    isConnecting = state.isConnecting;
    walletAddress = state.address;

    // If chain ID changed, update the chain name and selected chain in dropdown
    if (chainId !== state.chainId) {
      chainId = state.chainId;
      updateChainName();
      updateSelectedChain();
    }
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
        const newChainId = account.chainId as 1 | 11155111 | 10 | 42161 | 8453 | 421614 | null;
        if (newChainId === null || [1, 11155111, 10, 42161, 8453, 421614].includes(newChainId)) {
          chainId = newChainId;
          updateChainName();
          updateSelectedChain();
          appendToDebug(`Connected to wallet: ${truncateAddress(account.address)}`);
          appendToDebug(`Chain ID: ${account.chainId}`);
        }
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
  async function handleSwitchChain(event: CustomEvent<string>) {
    try {
      const newChainId = parseInt(event.detail);
      appendToDebug(`Switching to chain ID: ${newChainId}`);

      // Check if the chain is supported in the config
      if (!supportedChainIds.includes(newChainId as SupportedChainId)) {
        appendToDebug(`Warning: Chain ID ${newChainId} is not configured in the wagmi config. Adding EIP-3085 parameters.`);

        // Find the chain in our database chains
        const dbChain = dbChains.find(c => c.chain_id === newChainId);

        if (dbChain) {
          // Create EIP-3085 parameters for the chain
          const addEthereumChainParameter = {
            chainId: `0x${newChainId.toString(16)}`, // Convert to hex string
            chainName: dbChain.name,
            nativeCurrency: {
              name: dbChain.symbol || 'ETH',
              symbol: dbChain.symbol || 'ETH',
              decimals: 18
            },
            rpcUrls: [dbChain.rpc_url || ''],
            blockExplorerUrls: dbChain.explorer_url ? [dbChain.explorer_url] : undefined,
            iconUrls: dbChain.icon_url ? [dbChain.icon_url] : undefined
          };

          // Try to add the chain to the wallet
          appendToDebug(`Attempting to add chain to wallet: ${dbChain.name}`);

          // Get the ethereum provider from window
          const provider = (window as any).ethereum;
          if (provider && provider.request) {
            try {
              // Request to add the chain
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [addEthereumChainParameter]
              });
              appendToDebug(`Successfully added chain: ${dbChain.name}`);

              // Now try to switch to it
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${newChainId.toString(16)}` }]
              });

              // Update local state
              chainId = newChainId;
              updateChainName();
              appendToDebug(`Switched to chain: ${chainName}`);

              // Fetch contract addresses for the new chain
              await fetchContractAddresses();
              return;
            } catch (addChainError) {
              appendToDebug(`Error adding chain to wallet: ${addChainError instanceof Error ? addChainError.message : String(addChainError)}`);
              // Continue with normal switchChain below
            }
          }
        }
      }

      // Try the standard switchChain method
      appendToDebug(`Attempting to switch chain using wagmi switchChain...`);
      await switchChain(config, { chainId: newChainId as SupportedChainId });

      // Update local state
      chainId = newChainId;
      updateChainName();
      appendToDebug(`Switched to chain: ${chainName}`);

      // Fetch contract addresses for the new chain
      await fetchContractAddresses();
    } catch (error) {
      appendToDebug(`Error switching chain: ${error instanceof Error ? error.message : String(error)}`);
      // If the chain switch fails, we should update the UI to reflect the current chain
      const account = getAccount(config);
      if (account.isConnected && account.chainId !== undefined) {
        chainId = account.chainId;
        updateChainName();
        appendToDebug(`Reverted to current chain: ${chainName}`);
      }
    }
  }

  // Function to update the selected chain in the dropdown to match the wallet's chain
  function updateSelectedChain() {
    if (chainId) {
      appendToDebug(`Updating selected chain to match wallet's chain: ${chainId}`);
      // The chain selection will be updated in the UI when the component re-renders
    }
  }

  // Function to update chain name
  function updateChainName() {
    // First check in database chains
    const dbChain = dbChains.find(c => c.chain_id === chainId);
    if (dbChain) {
      chainName = dbChain.name;
      return;
    }

    // Fallback to default chains
    const defaultChain = defaultChains.find(c => c.id === chainId);
    chainName = defaultChain ? defaultChain.name : `Unknown Chain (${chainId})`;
  }

  // Function to fetch contract addresses for the selected chain
  async function fetchContractAddresses() {
    if (!chainId) {
      appendToDebug('No chain selected. Cannot fetch contract addresses.');
      return;
    }

    try {
      isLoadingContracts = true;
      contractsError = '';
      contractInfo = null;
      contractAddress = ''; // Reset contract address

      appendToDebug(`Fetching contract addresses for chain ID: ${chainId}...`);

      const info = await getContractInfo(chainId);

      if (!info) {
        throw new Error(`No contract information found for chain ID: ${chainId}`);
      }

      contractInfo = info;
      appendToDebug(`Found contract addresses for chain ID: ${chainId}`);
      appendToDebug(`Identity Contract: ${info.identity_contract_address}`);
      appendToDebug(`Art Factory Contract: ${info.art_factory_contract_address}`);
      appendToDebug(`Art Contract: ${info.art_contract_address}`);

      // Set the contract address based on the selected contract type
      updateContractAddress();
    } catch (error) {
      contractsError = error instanceof Error ? error.message : 'Unknown error fetching contract addresses';
      appendToDebug(`Error fetching contract addresses: ${contractsError}`);
      console.error('Error fetching contract addresses:', error);
    } finally {
      isLoadingContracts = false;
    }
  }

  // Function to update the contract address based on the selected contract type
  function updateContractAddress() {
    if (!contractInfo) return;

    switch (selectedContractType) {
      case 'identity':
        contractAddress = contractInfo.identity_contract_address;
        break;
      case 'art':
        contractAddress = contractInfo.art_contract_address;
        break;
      case 'artFactory':
        contractAddress = contractInfo.art_factory_contract_address;
        break;
    }

    appendToDebug(`Selected ${selectedContractType} contract: ${contractAddress}`);
  }

  // Function to handle contract type selection
  function handleContractTypeSelect(event: CustomEvent<string>) {
    selectedContractType = event.detail as 'identity' | 'art' | 'artFactory';
    appendToDebug(`Selected contract type: ${selectedContractType}`);
    updateContractAddress();
  }

  // Function to fetch all chains from the database
  async function fetchAllChains() {
    try {
      isLoadingChains = true;
      chainsError = '';
      appendToDebug('Fetching all chains from database...');

      const response = await fetch('/api/chains/all');

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch chains');
      }

      dbChains = result.chains || [];
      appendToDebug(`Fetched ${dbChains.length} chains from database`);
    } catch (error) {
      chainsError = error instanceof Error ? error.message : 'Unknown error fetching chains';
      appendToDebug(`Error fetching chains: ${chainsError}`);
      console.error('Error fetching chains:', error);
    } finally {
      isLoadingChains = false;
    }
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

      // Serialize BigInt values before storing and displaying
      const serializedResult = serializeBigInt(result);
      contractResponse = serializedResult;
      appendToDebug(`Contract response: ${JSON.stringify(serializedResult, null, 2)}`);
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

      // Serialize BigInt values before storing and displaying
      const serializedReceipt = serializeBigInt(receipt);
      transactionReceipt = serializedReceipt;
      appendToDebug(`Transaction mined: ${JSON.stringify(serializedReceipt, null, 2)}`);
    } catch (error) {
      appendToDebug(`Error writing to contract: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isLoading = false;
    }
  }

  // Helper function to handle BigInt serialization
  function serializeBigInt(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'bigint') {
      return data.toString();
    }

    if (Array.isArray(data)) {
      return data.map(item => serializeBigInt(item));
    }

    if (typeof data === 'object') {
      const result: Record<string, any> = {};
      for (const key in data) {
        result[key] = serializeBigInt(data[key]);
      }
      return result;
    }

    return data;
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

    // Fetch all chains from the database
    await fetchAllChains();

    // Check if wallet is already connected
    const account = getAccount(config);
    if (account.isConnected && account.address) {
      walletAddress = account.address;
      const newChainId = account.chainId as 1 | 11155111 | 10 | 42161 | 8453 | 421614 | null;
      if (newChainId === null || [1, 11155111, 10, 42161, 8453, 421614].includes(newChainId)) {
        chainId = newChainId;
        updateChainName();
        updateSelectedChain();
        appendToDebug(`Already connected to wallet: ${truncateAddress(account.address)}`);
        appendToDebug(`Chain ID: ${account.chainId}`);

        // Fetch contract addresses for the current chain
        if (chainId) {
          await fetchContractAddresses();
        }
      }
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
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Chain Selection</h2>
            <Button variant="outline" size="sm" on:click={fetchAllChains} disabled={isLoadingChains}>
              {#if isLoadingChains}
                <span class="animate-spin mr-2">⟳</span>
              {:else}
                <span class="mr-2">⟳</span>
              {/if}
              Refresh Chains
            </Button>
          </div>
          <div class="mb-4">
            <p class="text-sm font-medium mb-2">Select Chain</p>
            <Select on:valueChange={handleSwitchChain}>
              <SelectTrigger class="{isLoadingChains ? 'opacity-70' : ''}">
                <SelectValue placeholder={isLoadingChains ? 'Loading chains...' : chainId ? chainName : 'Select a chain'} />
              </SelectTrigger>
              <SelectContent>
                {#if isLoadingChains}
                  <SelectItem value="loading" disabled>Loading chains...</SelectItem>
                {:else if chainsError}
                  <SelectItem value="error" disabled>Error: {chainsError}</SelectItem>
                {:else if dbChains.length > 0}
                  {#each dbChains as chain}
                    <SelectItem value={chain.chain_id.toString()}>{chain.name} {chain.is_testnet ? '(Testnet)' : ''}</SelectItem>
                  {/each}
                {:else}
                  <!-- Fallback to default chains if no database chains are available -->
                  {#each defaultChains as chain}
                    <SelectItem value={chain.id.toString()}>{chain.name}</SelectItem>
                  {/each}
                {/if}
              </SelectContent>
            </Select>
          </div>
          {#if dbChains.length > 0}
            <p class="text-xs text-muted-foreground">{dbChains.length} chains loaded from database</p>
          {/if}
        </Card>
      {/if}

      <!-- Contract Interaction -->
      <Card class="p-6">
        <h2 class="text-xl font-semibold mb-4">Contract Interaction</h2>

        <div class="space-y-4">
          {#if isConnected && chainId}
            <div>
              <p class="text-sm font-medium mb-2">Contract Type</p>
              <div class="flex items-center space-x-2">
                <Select on:valueChange={handleContractTypeSelect} items={[{ value: selectedContractType }]}>
                  <SelectTrigger class="{isLoadingContracts ? 'opacity-70' : ''}">
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identity">Identity Contract</SelectItem>
                    <SelectItem value="art">Art Contract</SelectItem>
                    <SelectItem value="artFactory">Art Factory Contract</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" on:click={fetchContractAddresses} disabled={isLoadingContracts || !chainId}>
                  {#if isLoadingContracts}
                    <span class="animate-spin mr-2">⟳</span>
                  {:else}
                    <span class="mr-2">⟳</span>
                  {/if}
                  Refresh
                </Button>
              </div>
              {#if contractsError}
                <p class="text-xs text-destructive mt-1">{contractsError}</p>
              {/if}
            </div>
          {/if}

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
                <SelectValue placeholder="Select a function" />
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
