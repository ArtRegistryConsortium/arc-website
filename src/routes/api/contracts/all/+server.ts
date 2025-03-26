import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch all contract information for all chains
 */
export const GET: RequestHandler = async () => {
  try {
    // Get all contract information from the database
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select(`
        identity_contract_address,
        art_factory_contract_address,
        art_contract_address,
        chain_id,
        chains(name, explorer_url)
      `)
      .order('chain_id');

    if (contractsError) {
      console.error('Error fetching contract information:', contractsError);
      return json({ 
        success: false, 
        error: 'Failed to fetch contract information' 
      }, { status: 500 });
    }

    return json({
      success: true,
      contracts: contracts || []
    });
  } catch (error) {
    console.error('Server error fetching contract information:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
