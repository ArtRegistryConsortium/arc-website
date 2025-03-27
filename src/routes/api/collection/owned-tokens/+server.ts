import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider, Contract } from 'ethers';
import { env } from '$env/dynamic/private';

/**
 * API endpoint to fetch tokens owned by a wallet
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get wallet address from query parameter
    const walletAddress = url.searchParams.get('walletAddress');

    if (!walletAddress) {
      return json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 });
    }

    // Get all contracts
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('art_contracts')
      .select('contract_address, chain_id')
      .order('created_at', { ascending: false });

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      return json({
        success: false,
        error: 'Failed to fetch contracts'
      }, { status: 500 });
    }

    const ownedTokens = [];

    // For each contract, get tokens and check ownership
    for (const contract of contracts) {
      // Get RPC URL for the chain
      const { data: chainData, error: chainError } = await supabaseAdmin
        .from('chains')
        .select('rpc_url')
        .eq('chain_id', contract.chain_id)
        .single();

      if (chainError) {
        console.error(`Error fetching RPC URL for chain ${contract.chain_id}:`, chainError);
        continue;
      }

      const rpcUrl = chainData.rpc_url;

      // Get tokens for this contract
      const { data: tokens, error: tokensError } = await supabaseAdmin
        .from('art_tokens')
        .select('*')
        .eq('contract_address', contract.contract_address)
        .eq('chain_id', contract.chain_id);

      if (tokensError) {
        console.error(`Error fetching tokens for contract ${contract.contract_address}:`, tokensError);
        continue;
      }

      // Check ownership for each token
      for (const token of tokens) {
        try {
          const provider = new JsonRpcProvider(rpcUrl);

          // ABI for ownerOf function
          const abi = [
            "function ownerOf(uint256 tokenId) view returns (address)"
          ];

          // Create contract instance
          const contractInstance = new Contract(contract.contract_address, abi, provider);

          // Call ownerOf function
          const owner = await contractInstance.ownerOf(token.token_id);

          // Check if the wallet owns this token
          if (owner.toLowerCase() === walletAddress.toLowerCase()) {
            ownedTokens.push(token);
          }
        } catch (error) {
          console.error(`Error checking ownership for token ${token.token_id} on contract ${contract.contract_address}:`, error);
          // Continue with next token
        }
      }
    }

    return json({
      success: true,
      tokens: ownedTokens
    });
  } catch (error) {
    console.error('Error fetching owned tokens:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
