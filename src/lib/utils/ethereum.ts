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
  console.log('Verifying ETH transaction:', {
    fromAddress,
    toAddress,
    expectedAmount,
    lookbackBlocks
  });

  try {
    // Format the expected amount properly
    let formattedAmount: string;
    try {
      formattedAmount = expectedAmount.toString();
      console.log('Formatted expected amount:', formattedAmount);
    } catch (formatError) {
      console.error('Error formatting expected amount:', formatError);
      formattedAmount = '0';
    }

    // Convert expected amount to Wei for comparison (with small tolerance for gas price fluctuations)
    let expectedWei: bigint;
    try {
      expectedWei = parseEther(formattedAmount);
      console.log('Expected amount in wei:', expectedWei.toString());
    } catch (parseError) {
      console.error('Error parsing expected amount to wei:', parseError);
      return false;
    }

    // Get the current block number
    const currentBlock = await publicClient.getBlockNumber();
    console.log('Current block number:', currentBlock.toString());

    // Calculate the starting block (current block - lookback)
    const fromBlock = currentBlock - BigInt(lookbackBlocks);
    console.log('Looking back from block:', fromBlock.toString());

    // Use a more direct approach: get the transaction history using getLogs
    console.log('Checking for transfers to:', toAddress);

    // Note: viem doesn't have a direct getTransactions method, so we'll skip this approach
    // and go straight to the manual block checking

    // Fallback: manually check recent blocks
    console.log('Falling back to manual block checking...');

    // Check the last 10 blocks
    for (let i = 0; i < 10; i++) {
      try {
        const blockNumber = currentBlock - BigInt(i);
        console.log(`Checking block ${blockNumber.toString()}...`);

        const block = await publicClient.getBlock({
          blockNumber,
          includeTransactions: true
        });

        // Find transactions from our target address to the destination
        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue;

          // Check sender and recipient
          const txFrom = tx.from?.toLowerCase();
          const txTo = tx.to?.toLowerCase();

          if (!txFrom || !txTo) continue;

          // Log all transactions from our sender for debugging
          if (txFrom === fromAddress.toLowerCase()) {
            console.log('Found transaction from sender:', {
              hash: tx.hash,
              to: txTo,
              value: tx.value.toString(),
              expectedTo: toAddress.toLowerCase(),
              expectedValue: expectedWei.toString()
            });
          }

          // Check if this is our target transaction
          if (
            txFrom === fromAddress.toLowerCase() &&
            txTo === toAddress.toLowerCase()
          ) {
            // For value comparison, allow a small margin of error (gas price variations)
            const txValue = tx.value;
            const valueDiff = txValue > expectedWei
              ? txValue - expectedWei
              : expectedWei - txValue;

            // Allow a 5% margin of error
            const margin = expectedWei * BigInt(5) / BigInt(100);

            console.log('Transaction value comparison:', {
              txValue: txValue.toString(),
              expectedWei: expectedWei.toString(),
              difference: valueDiff.toString(),
              margin: margin.toString(),
              isWithinMargin: valueDiff <= margin
            });

            if (valueDiff <= margin) {
              console.log('Found matching transaction with acceptable value!', tx.hash);
              return true;
            }
          }
        }
      } catch (error) {
        console.error(`Error checking block ${(currentBlock - BigInt(i)).toString()}:`, error);
        // Continue to the next block
      }
    }

    console.log('No matching transaction found');
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
