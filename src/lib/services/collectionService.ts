import { supabaseClient } from '$lib/supabase/client';
import { readContract } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import type { Address } from 'viem';
import type { ArtToken } from '$lib/types/art';

/**
 * Service for handling collection-related operations
 */

/**
 * Fetches all ART contracts from the database
 * @returns Array of contract addresses and chain IDs
 */
export async function getAllArtContracts() {
  try {
    const { data, error } = await supabaseClient
      .from('art_contracts')
      .select('contract_address, chain_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ART contracts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllArtContracts:', error);
    return [];
  }
}

/**
 * Checks if a wallet owns a specific token
 * @param contractAddress The contract address
 * @param chainId The chain ID
 * @param tokenId The token ID
 * @param walletAddress The wallet address to check
 * @returns True if the wallet owns the token
 */
export async function isTokenOwnedByWallet(
  contractAddress: string,
  chainId: number,
  tokenId: number,
  walletAddress: Address
): Promise<boolean> {
  try {
    // Call ownerOf function on the contract
    const owner = await readContract(config, {
      address: contractAddress as Address,
      abi: [
        {
          inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
          name: 'ownerOf',
          outputs: [{ internalType: 'address', name: '', type: 'address' }],
          stateMutability: 'view',
          type: 'function'
        }
      ],
      functionName: 'ownerOf',
      args: [BigInt(tokenId)],
      chainId: chainId as 1 | 10 | 42161 | 8453 | 11155111 | 421614
    });

    // Compare the owner address with the wallet address (case-insensitive)
    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error(`Error checking ownership for token ${tokenId} on contract ${contractAddress}:`, error);
    return false;
  }
}

/**
 * Gets all tokens for a specific contract
 * @param contractAddress The contract address
 * @param chainId The chain ID
 * @returns Array of token IDs
 */
export async function getTokensForContract(contractAddress: string, chainId: number): Promise<number[]> {
  try {
    // First try to get tokens from the database
    const { data, error } = await supabaseClient
      .from('art_tokens')
      .select('token_id')
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId);

    if (error) {
      console.error('Error fetching tokens from database:', error);
      return [];
    }

    return data.map(item => item.token_id);
  } catch (error) {
    console.error(`Error getting tokens for contract ${contractAddress}:`, error);
    return [];
  }
}

/**
 * Gets token details from the database
 * @param contractAddress The contract address
 * @param chainId The chain ID
 * @param tokenId The token ID
 * @returns Token details or null if not found
 */
export async function getTokenDetails(
  contractAddress: string,
  chainId: number,
  tokenId: number
): Promise<ArtToken | null> {
  try {
    const { data, error } = await supabaseClient
      .from('art_tokens')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId)
      .eq('token_id', tokenId)
      .single();

    if (error) {
      console.error('Error fetching token details:', error);
      return null;
    }

    return data as ArtToken;
  } catch (error) {
    console.error(`Error getting details for token ${tokenId} on contract ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Gets all tokens owned by a wallet across all contracts
 * @param walletAddress The wallet address
 * @returns Array of owned tokens with their details
 */
export async function getOwnedTokens(walletAddress: Address): Promise<ArtToken[]> {
  try {
    // Get all contracts
    const contracts = await getAllArtContracts();
    const ownedTokens: ArtToken[] = [];

    // For each contract, get all tokens and check ownership
    for (const contract of contracts) {
      const tokenIds = await getTokensForContract(contract.contract_address, contract.chain_id);

      // Check ownership for each token
      for (const tokenId of tokenIds) {
        const isOwned = await isTokenOwnedByWallet(
          contract.contract_address,
          contract.chain_id,
          tokenId,
          walletAddress
        );

        if (isOwned) {
          const tokenDetails = await getTokenDetails(contract.contract_address, contract.chain_id, tokenId);
          if (tokenDetails) {
            ownedTokens.push(tokenDetails);
          }
        }
      }
    }

    return ownedTokens;
  } catch (error) {
    console.error('Error in getOwnedTokens:', error);
    return [];
  }
}
