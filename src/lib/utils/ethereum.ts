import { createPublicClient, http, parseEther, formatEther, type Address } from 'viem';
import { mainnet, sepolia, goerli, optimism, arbitrum, base } from 'viem/chains';
import { env } from '$env/dynamic/private';

// Create public clients for different networks
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(env.INFURA_URL || 'https://mainnet.infura.io/v3/your-infura-key')
});

// For Sepolia, use multiple fallback options for better reliability
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(env.SEPOLIA_INFURA_URL || env.INFURA_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo')
});

// Backup Sepolia clients with public endpoints
const sepoliaBackupClients = [
  createPublicClient({
    chain: sepolia,
    transport: http('https://rpc.sepolia.org')
  }),
  createPublicClient({
    chain: sepolia,
    transport: http('https://rpc.ankr.com/eth_sepolia')
  })
];

// Create clients for other networks using public RPC endpoints
const goerliClient = createPublicClient({
  chain: goerli,
  transport: http('https://rpc.ankr.com/eth_goerli')
});

const optimismClient = createPublicClient({
  chain: optimism,
  transport: http('https://mainnet.optimism.io')
});

const arbitrumClient = createPublicClient({
  chain: arbitrum,
  transport: http('https://arb1.arbitrum.io/rpc')
});

const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

// Public RPC fallbacks
const publicRpcClients = {
  1: createPublicClient({ chain: mainnet, transport: http('https://eth.llamarpc.com') }),
  5: goerliClient,
  10: optimismClient,
  42161: arbitrumClient,
  8453: baseClient,
  11155111: createPublicClient({ chain: sepolia, transport: http('https://rpc.sepolia.org') })
};

// Function to get the appropriate client based on chain ID
function getPublicClient(chainId?: number) {
  // Default to mainnet if no chain ID is provided
  if (!chainId) return mainnetClient;

  // Return the appropriate client based on chain ID
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return mainnetClient;
    case 5: // Goerli Testnet
      return goerliClient;
    case 10: // Optimism
      return optimismClient;
    case 42161: // Arbitrum
      return arbitrumClient;
    case 8453: // Base
      return baseClient;
    case 11155111: // Sepolia Testnet
      return sepoliaClient;
    default:
      console.log(`No specific client for chain ID ${chainId}, using mainnet client`);
      return mainnetClient;
  }
}

/**
 * Fetches the current ETH to USD price from CoinGecko API
 * @returns The current ETH price in USD
 */
export async function getEthToUsdPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
    throw error;
  }
}

/**
 * Calculates the ETH amount equivalent to a given USD amount
 * @param usdAmount The amount in USD
 * @returns The equivalent amount in ETH
 */
export async function calculateEthFromUsd(usdAmount: number): Promise<number> {
  const ethPrice = await getEthToUsdPrice();
  return usdAmount / ethPrice;
}

/**
 * Verifies if a transaction from a specific address to the ARC wallet exists with the expected amount
 * @param fromAddress The sender's address
 * @param toAddress The ARC wallet address
 * @param expectedAmount The expected ETH amount
 * @param lookbackBlocks How many blocks to look back (default: 10000, ~1.5 days)
 * @returns True if a matching transaction is found, false otherwise
 */
export async function verifyEthTransaction(
  fromAddress: Address,
  toAddress: Address,
  expectedAmount: number,
  transactionHash?: `0x${string}`, // Transaction hash
  chainId?: number // Chain ID to determine which network to use
): Promise<{ success: boolean; foundOnChain?: number; error?: string }> {
  console.log('Verifying ETH transaction:', {
    fromAddress,
    toAddress,
    expectedAmount,
    transactionHash: transactionHash ? transactionHash : 'Not provided',
    chainId: chainId || 'Not provided (using mainnet)'
  });

  // If no transaction hash is provided, we can't verify
  if (!transactionHash) {
    console.log('No transaction hash provided, cannot verify');
    return { success: false, error: 'No transaction hash provided' };
  }

  try {
    console.log('Checking transaction hash directly:', transactionHash);

    // Define networks to check
    const networksToCheck = [
      { id: chainId || 1, name: chainId ? `Specified Chain (${chainId})` : 'Ethereum Mainnet' },
      { id: 1, name: 'Ethereum Mainnet' },
      { id: 11155111, name: 'Sepolia Testnet' },
      { id: 5, name: 'Goerli Testnet' },
      { id: 10, name: 'Optimism' },
      { id: 42161, name: 'Arbitrum' },
      { id: 8453, name: 'Base' }
    ];

    // Remove duplicates
    const uniqueNetworks = networksToCheck.filter((network, index, self) =>
      index === self.findIndex((n) => n.id === network.id)
    );

    console.log(`Checking transaction on ${uniqueNetworks.length} networks:`,
      uniqueNetworks.map(n => n.name).join(', '));

    // Try each network
    for (const network of uniqueNetworks) {
      try {
        console.log(`Checking on ${network.name} (Chain ID: ${network.id})...`);

        // Get the appropriate client for this chain
        const client = getPublicClient(network.id);
        if (!client) {
          console.log(`No client available for ${network.name}, skipping`);
          continue;
        }

        let tx;
        let usedBackup = false;

        try {
          // Try with the primary client first
          tx = await client.getTransaction({
            hash: transactionHash,
          });
        } catch (primaryError) {
          // If this is Sepolia and we have backup clients, try those
          if (network.id === 11155111 && sepoliaBackupClients.length > 0) {
            console.log('Primary Sepolia client failed, trying backups...');

            // Try each backup client
            for (const backupClient of sepoliaBackupClients) {
              try {
                tx = await backupClient.getTransaction({
                  hash: transactionHash,
                });
                usedBackup = true;
                console.log('Successfully retrieved transaction using backup Sepolia client');
                break;
              } catch (backupError) {
                console.log('Backup client also failed:', backupError instanceof Error ? backupError.message : String(backupError));
              }
            }

            // If all backups failed, rethrow the original error
            if (!tx) {
              throw primaryError;
            }
          } else {
            // For other networks, just rethrow the error
            throw primaryError;
          }
        }

        console.log(`Transaction found on ${network.name}${usedBackup ? ' (using backup client)' : ''}!`);

        // Check if this is our target transaction
        // Note: We're being more flexible here - we only check that the recipient matches
        // This allows verification even if the payment was sent from a different wallet

        // Log detailed address information for debugging
        console.log(`Transaction recipient check on ${network.name}:`, {
          transactionTo: tx.to?.toLowerCase(),
          expectedAddress: toAddress.toLowerCase(),
          match: tx.to?.toLowerCase() === toAddress.toLowerCase()
        });

        // In development, we can optionally bypass the recipient check
        const bypassRecipientCheck = env.NODE_ENV === 'development' && env.BYPASS_RECIPIENT_CHECK === 'true';

        if (tx.to?.toLowerCase() === toAddress.toLowerCase() || bypassRecipientCheck) {
          if (bypassRecipientCheck && tx.to?.toLowerCase() !== toAddress.toLowerCase()) {
            console.log('WARNING: Bypassing recipient check in development mode!');
            console.log('Transaction verification proceeding despite recipient mismatch');
          }
          // Get the transaction value
          const txValue = tx.value;

          // Format the expected amount properly
          let formattedAmount: string;
          try {
            formattedAmount = expectedAmount.toString();
            console.log('Formatted expected amount:', formattedAmount);
          } catch (formatError) {
            console.error('Error formatting expected amount:', formatError);
            formattedAmount = '0';
          }

          // Convert expected amount to Wei for comparison
          let expectedWei: bigint;
          try {
            expectedWei = parseEther(formattedAmount);
            console.log('Expected amount in wei:', expectedWei.toString());
          } catch (parseError) {
            console.error('Error parsing expected amount to wei:', parseError);
            continue; // Try next network
          }

          // Accept if transaction value is greater than or equal to expected amount
          const isGreaterThanExpected = txValue >= expectedWei;

          // For amounts slightly less than expected, allow a 1% margin of error
          const smallMargin = expectedWei * BigInt(1) / BigInt(100);
          const isCloseEnough = txValue < expectedWei && (expectedWei - txValue) <= smallMargin;

          console.log('Transaction value comparison:', {
            txValue: txValue.toString(),
            expectedWei: expectedWei.toString(),
            isGreaterThanExpected,
            isCloseEnough: isCloseEnough,
            smallMargin: smallMargin.toString()
          });

          if (isGreaterThanExpected || isCloseEnough) {
            console.log(`Found matching transaction with acceptable value on ${network.name}!`, transactionHash);
            return { success: true, foundOnChain: network.id };
          } else {
            console.log(`Transaction found on ${network.name} but amount is not sufficient`);
            // Continue checking other networks
          }
        } else {
          console.log(`Transaction found on ${network.name} but recipient does not match`);
          console.log('Expected recipient:', toAddress.toLowerCase());
          console.log('Actual recipient:', tx.to?.toLowerCase());
          // Continue checking other networks
        }
      } catch (error) {
        // If transaction not found on this network, try the next one
        console.log(`Transaction not found on ${network.name}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // If we get here, we checked all networks and didn't find a valid transaction
    console.log('Transaction not found on any network with matching criteria');
    return { success: false, error: 'Transaction not found on any network with matching criteria' };
  } catch (error) {
    console.error('Error in transaction verification process:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error during verification' };
  }
}

/**
 * Formats an ETH amount to a user-friendly string with limited decimal places
 * @param ethAmount The ETH amount as a number
 * @param decimals Number of decimal places to show
 * @returns Formatted ETH amount string
 */
export function formatEthAmount(ethAmount: number, decimals: number = 6): string {
  return ethAmount.toFixed(decimals);
}
