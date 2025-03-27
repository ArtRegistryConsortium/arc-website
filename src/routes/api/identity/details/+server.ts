import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch a single identity by ID and chain ID
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get parameters from query string
    const id = url.searchParams.get('id');
    const chainId = url.searchParams.get('chainId');

    // Validate required parameters
    if (!id || !chainId) {
      return json({
        success: false,
        error: 'Missing required parameters: id, chainId'
      }, { status: 400 });
    }

    console.log('Fetching identity with ID:', id, 'and Chain ID:', chainId);

    // Fetch the identity from the database
    const { data: identity, error } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('id', parseInt(id))
      .eq('chain_id', parseInt(chainId))
      .single();

    console.log('Database response:', { identity, error });

    if (error) {
      console.error('Error fetching identity:', error);
      return json({
        success: false,
        error: 'Identity not found'
      }, { status: 404 });
    }

    return json({
      success: true,
      identity
    });
  } catch (error) {
    console.error('Server error fetching identity:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
