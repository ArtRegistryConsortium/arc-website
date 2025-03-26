import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ params }) => {
  const { chainId, contractAddress } = params;

  if (!chainId || !contractAddress) {
    throw error(400, 'Missing required parameters');
  }

  try {
    // Get contract information from the database
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('art_contracts')
      .select(`
        contract_address,
        identity_id,
        chain_id,
        created_at,
        identities (
          id,
          name,
          description,
          identity_image,
          type
        )
      `)
      .eq('contract_address', contractAddress)
      .eq('chain_id', parseInt(chainId))
      .single();

    if (contractError) {
      console.error('Error fetching contract:', contractError);
      throw error(404, 'Contract not found');
    }

    if (!contract) {
      throw error(404, 'Contract not found');
    }

    // Get chain information
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', parseInt(chainId))
      .single();

    if (chainError) {
      console.error('Error fetching chain:', chainError);
      throw error(404, 'Chain not found');
    }

    // Get art tokens for this contract
    const { data: artTokens, error: artTokensError } = await supabaseAdmin
      .from('art_tokens')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_id', parseInt(chainId))
      .order('created_at', { ascending: false });

    if (artTokensError) {
      console.error('Error fetching art tokens:', artTokensError);
      // Don't throw an error here, just return an empty array
      return {
        contract,
        chain,
        artTokens: []
      };
    }

    // Generate the symbol from the artist's name (ensure it's uppercase)
    const symbol = ('ARC' + (contract.identities?.name?.charAt(0) || '')).toUpperCase();

    return {
      contract: { ...contract, symbol },
      chain,
      artTokens: artTokens || []
    };
  } catch (err) {
    console.error('Error in load function:', err);
    throw error(500, 'Internal server error');
  }
};
