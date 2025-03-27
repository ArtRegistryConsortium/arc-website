import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch a single ART contract
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get parameters from query string
    const contractAddress = url.searchParams.get('contractAddress');
    const chainId = url.searchParams.get('chainId');
    
    // Validate required parameters
    if (!contractAddress || !chainId) {
      return json({
        success: false,
        error: 'Missing required parameters: contractAddress, chainId'
      }, { status: 400 });
    }
    
    // Fetch the contract from the database
    const { data: contract, error } = await supabaseAdmin
      .from('art_contracts')
      .select(`
        *,
        identities(
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
    
    if (error) {
      console.error('Error fetching contract:', error);
      return json({
        success: false,
        error: 'Contract not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Server error fetching contract:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
