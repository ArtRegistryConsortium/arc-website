import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider } from 'ethers';
import { env } from '$env/dynamic/private';
import type { Address } from 'viem';

// ABI for the ART Factory contract's deployArtContract function
const ART_FACTORY_ABI = [
  "function deployArtContract(uint256 artistIdentityId, string symbol) external returns (address)"
];

// Event signature for ArtContractDeployed event
// keccak256("ArtContractDeployed(address,uint256)")
const ART_CONTRACT_DEPLOYED_EVENT_SIGNATURE = "0xb8404e00b0196506b8eed6392cd6195314860737075712144ba3ff6c5cfae465";

// Function to decode hex data from logs
function decodeAddress(hexData: string): string {
  // Remove '0x' prefix if present and pad to 64 characters
  const cleanHex = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
  const paddedHex = cleanHex.padStart(64, '0');

  // For an address, we need to take the last 40 characters (20 bytes)
  return '0x' + paddedHex.slice(paddedHex.length - 40);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get request data
    const requestData = await request.json();
    console.log('Received ART contract deployment request:', requestData);

    const {
      walletAddress,
      identityId,
      symbol,
      chainId,
      transactionHash
    } = requestData;

    // Validate required fields with detailed error messages
    if (!walletAddress) {
      console.error('Missing walletAddress in request');
      return json({
        success: false,
        error: 'Missing required field: walletAddress'
      }, { status: 400 });
    }

    if (identityId === undefined || identityId === null) {
      console.error('Missing identityId in request');
      return json({
        success: false,
        error: 'Missing required field: identityId'
      }, { status: 400 });
    }

    if (!symbol) {
      console.error('Missing symbol in request');
      return json({
        success: false,
        error: 'Missing required field: symbol'
      }, { status: 400 });
    }

    // Ensure symbol is in uppercase
    if (symbol !== symbol.toUpperCase()) {
      console.error('Symbol must be in uppercase:', symbol);
      return json({
        success: false,
        error: 'Symbol must be in uppercase'
      }, { status: 400 });
    }

    if (chainId === undefined || chainId === null) {
      console.error('Missing chainId in request');
      return json({
        success: false,
        error: 'Missing required field: chainId'
      }, { status: 400 });
    }

    if (!transactionHash) {
      console.error('Missing transactionHash in request');
      return json({
        success: false,
        error: 'Missing required field: transactionHash'
      }, { status: 400 });
    }

    // Get chain information
    console.log('Fetching chain information for chainId:', chainId);
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', chainId)
      .single();

    if (chainError) {
      console.error('Error fetching chain information:', chainError);
      return json({
        success: false,
        error: `Chain not found for chainId: ${chainId}. Error: ${chainError.message}`
      }, { status: 404 });
    }

    if (!chain.rpc_url) {
      console.error('RPC URL is missing for chain:', chainId);
      return json({
        success: false,
        error: `RPC URL is missing for chain: ${chainId}`
      }, { status: 500 });
    }

    // Create a provider to verify the transaction
    const provider = new JsonRpcProvider(chain.rpc_url);

    // Wait for the transaction to be mined
    console.log('Waiting for transaction to be mined:', transactionHash);
    const receipt = await provider.waitForTransaction(transactionHash);

    if (!receipt) {
      console.error('Transaction receipt not found');
      return json({
        success: false,
        error: 'Transaction not found or failed'
      }, { status: 400 });
    }

    console.log('Transaction receipt:', JSON.stringify(receipt, null, 2));

    // Check if the transaction was successful
    if (receipt.status === 0) {
      console.error('Transaction failed with status 0');
      return json({
        success: false,
        error: 'Transaction failed'
      }, { status: 400 });
    }

    // Extract the contract address from the transaction receipt
    let contractAddress: Address | null = null;

    // First try to get the contract address from the receipt
    if (receipt.contractAddress) {
      contractAddress = receipt.contractAddress as Address;
    } else {
      // If not found in receipt, look for the ArtContractDeployed event in logs
      const logs = receipt.logs;
      console.log('Searching for ArtContractDeployed event in logs...');

      // First try with the event signature
      for (const log of logs) {
        console.log('Log topic[0]:', log.topics[0]);
        if (log.topics[0] === ART_CONTRACT_DEPLOYED_EVENT_SIGNATURE) {
          console.log('Found matching event signature, topics:', log.topics);
          // The contract address is in the first indexed parameter (topics[1])
          if (log.topics[1]) {
            contractAddress = decodeAddress(log.topics[1]) as Address;
            console.log('Extracted contract address from topics[1]:', contractAddress);
            break;
          }
        }
      }

      // If still not found, try a more generic approach by looking at all logs
      if (!contractAddress) {
        console.log('Event signature not found, trying alternative approach...');
        // Look for logs that might contain the contract address
        for (const log of logs) {
          // Check if this is a contract creation or event from the ART Factory
          if (log.topics.length > 0) {
            console.log('Examining log with topics:', log.topics);
            // Try to extract address from data or topics
            if (log.data && log.data !== '0x') {
              console.log('Log has data:', log.data);
              // Try to extract address from data
              // This is a simplified approach - in reality, you'd need to decode the ABI
              try {
                // If data contains an address, it might be in the first 32 bytes
                const potentialAddress = decodeAddress(log.data.slice(0, 66));
                console.log('Potential address from data:', potentialAddress);
                if (potentialAddress.startsWith('0x') && potentialAddress !== '0x0000000000000000000000000000000000000000') {
                  contractAddress = potentialAddress as Address;
                  console.log('Using address from data:', contractAddress);
                  break;
                }
              } catch (e) {
                console.error('Error extracting address from data:', e);
              }
            }

            // Try to extract from topics if there are at least 2 topics
            if (log.topics.length > 1) {
              try {
                const potentialAddress = decodeAddress(log.topics[1]);
                console.log('Potential address from topics[1]:', potentialAddress);
                if (potentialAddress.startsWith('0x') && potentialAddress !== '0x0000000000000000000000000000000000000000') {
                  contractAddress = potentialAddress as Address;
                  console.log('Using address from topics[1]:', contractAddress);
                  break;
                }
              } catch (e) {
                console.error('Error extracting address from topics:', e);
              }
            }
          }
        }
      }
    }

    if (!contractAddress) {
      // Log the receipt for debugging
      console.log('Transaction receipt:', receipt);
      console.log('Transaction logs:', receipt.logs);
      return json({
        success: false,
        error: 'No contract address found in transaction receipt or logs'
      }, { status: 400 });
    }

    // Record the contract deployment in the database
    const { error: insertError } = await supabaseAdmin
      .from('art_contracts')
      .insert({
        contract_address: contractAddress,
        identity_id: identityId,
        chain_id: chainId,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error recording contract deployment:', insertError);
      return json({
        success: false,
        error: `Failed to record contract deployment: ${insertError.message}`
      }, { status: 500 });
    }

    return json({
      success: true,
      contractAddress: contractAddress,
      transactionHash: transactionHash
    });

  } catch (error) {
    console.error('Error in contract deployment:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};
