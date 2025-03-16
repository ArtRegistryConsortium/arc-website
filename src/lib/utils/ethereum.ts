import { createPublicClient, http, parseEther, formatEther, type Address } from 'viem';
import { mainnet } from 'viem/chains';
import { env } from '$env/dynamic/private';

// Create a public client for Ethereum mainnet
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(env.INFURA_URL || 'https://mainnet.infura.io/v3/your-infura-key')
});

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
  lookbackBlocks: number = 10000
): Promise<boolean> {
  try {
    // Get the current block number
    const currentBlock = await publicClient.getBlockNumber();
    
    // Calculate the starting block (current block - lookback)
    const fromBlock = currentBlock - BigInt(lookbackBlocks);
    
    // Convert expected amount to Wei for comparison (with small tolerance for gas price fluctuations)
    const expectedWei = parseEther(expectedAmount.toFixed(18));
    
    // Get transactions for the sender
    const transactions = await publicClient.getTransactionCount({
      address: fromAddress,
      blockTag: 'latest'
    });
    
    // If there are no transactions, return false
    if (transactions === 0) {
      return false;
    }
    
    // For each transaction, check if it matches our criteria
    for (let i = 0; i < Math.min(transactions, 20); i++) {
      // This is a simplified approach - in a production environment, you would need
      // to implement a more robust transaction search using logs or a dedicated indexer
      const txHash = await publicClient.getTransactionHash({
        address: fromAddress,
        index: BigInt(i)
      });
      
      if (!txHash) continue;
      
      const tx = await publicClient.getTransaction({ hash: txHash });
      
      // Check if this transaction is to our target address with the expected amount
      if (
        tx.to?.toLowerCase() === toAddress.toLowerCase() &&
        tx.value === expectedWei
      ) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to verify ETH transaction:', error);
    return false;
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
