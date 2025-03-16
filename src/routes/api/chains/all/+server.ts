import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch all chains, including those without wallets
 */
export const GET: RequestHandler = async () => {
  try {
    // Get all chains from the database
    const { data: chains, error: chainsError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .order('is_testnet', { ascending: true })
      .order('name');

    if (chainsError) {
      console.error('Error fetching chains:', chainsError);
      return json({ 
        success: false, 
        error: 'Database error when fetching chains' 
      }, { status: 500 });
    }

    return json({
      success: true,
      chains: chains || []
    });
  } catch (error) {
    console.error('Server error fetching all chains:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
