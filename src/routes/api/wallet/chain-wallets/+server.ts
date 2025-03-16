import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch all chain wallets
 */
export const GET: RequestHandler = async () => {
  try {
    // Get all wallets from the database
    const { data: wallets, error: walletsError } = await supabaseAdmin
      .from('arc_wallets')
      .select('*')
      .order('chain_id');

    if (walletsError) {
      console.error('Error fetching chain wallets:', walletsError);
      return json({ 
        success: false, 
        error: 'Database error when fetching chain wallets' 
      }, { status: 500 });
    }

    return json({
      success: true,
      wallets: wallets || []
    });
  } catch (error) {
    console.error('Server error fetching chain wallets:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
