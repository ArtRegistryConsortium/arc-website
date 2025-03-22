import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch contract information for a specific chain
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get chain ID from query parameter
    const chainId = url.searchParams.get('chainId');
    
    if (!chainId) {
      return json({ 
        success: false, 
        error: 'Chain ID is required' 
      }, { status: 400 });
    }
    
    // Get chain information from the database
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', parseInt(chainId))
      .single();

    if (chainError) {
      console.error('Error fetching chain information:', chainError);
      return json({ 
        success: false, 
        error: 'Chain not found for the specified chain' 
      }, { status: 404 });
    }

    // Get contract information from the database
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('chain_id', parseInt(chainId))
      .single();

    if (contractError) {
      console.error('Error fetching contract information:', contractError);
      return json({ 
        success: false, 
        error: 'Contract not found for the specified chain' 
      }, { status: 404 });
    }

    return json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('Server error fetching contract information:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
