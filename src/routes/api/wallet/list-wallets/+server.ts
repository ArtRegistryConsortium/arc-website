import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to list all wallets in the arc_wallets table
 * This is for development/testing purposes only and should be secured or removed in production
 */
export const GET: RequestHandler = async () => {
  try {
    // Get all wallets from the database
    const { data, error } = await supabaseAdmin
      .from('arc_wallets')
      .select('*')
      .order('chain_id', { ascending: true });

    if (error) {
      console.error('Error fetching wallets:', error);
      return json({ 
        success: false, 
        error: 'Database error when fetching wallets' 
      }, { status: 500 });
    }

    return json({
      success: true,
      wallets: data
    });
  } catch (error) {
    console.error('Server error listing wallets:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
