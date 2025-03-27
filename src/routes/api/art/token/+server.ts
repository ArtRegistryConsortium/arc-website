import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch a single ART token
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get parameters from query string
    const contractAddress = url.searchParams.get('contractAddress');
    const chainId = url.searchParams.get('chainId');
    const tokenId = url.searchParams.get('tokenId');
    
    // Validate required parameters
    if (!contractAddress || !chainId || !tokenId) {
      return json({
        success: false,
        error: 'Missing required parameters: contractAddress, chainId, tokenId'
      }, { status: 400 });
    }
    
    // Fetch the token from the database
    const { data: token, error } = await supabaseAdmin
      .from('art_tokens')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_id', parseInt(chainId))
      .eq('token_id', parseInt(tokenId))
      .single();
    
    if (error) {
      console.error('Error fetching token:', error);
      return json({
        success: false,
        error: 'Token not found'
      }, { status: 404 });
    }
    
    return json({
      success: true,
      token
    });
  } catch (error) {
    console.error('Server error fetching token:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
