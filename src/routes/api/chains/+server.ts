import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch available chains
 */
export const GET: RequestHandler = async () => {
  try {
    // Get active chains from the database
    const { data: chains, error: chainsError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('is_active', true)
      .order('chain_id');

    if (chainsError) {
      console.error('Error fetching chains:', chainsError);
      return json({ 
        success: false, 
        error: 'Database error when fetching chains' 
      }, { status: 500 });
    }

    // Get chains that have ARC wallets
    const { data: arcWallets, error: walletsError } = await supabaseAdmin
      .from('arc_wallets')
      .select('chain_id');

    if (walletsError) {
      console.error('Error fetching ARC wallets:', walletsError);
      return json({ 
        success: false, 
        error: 'Database error when fetching ARC wallets' 
      }, { status: 500 });
    }

    // Create a set of chain IDs that have wallets
    const chainsWithWallets = new Set(arcWallets.map(wallet => wallet.chain_id));

    // Filter chains to only include those with wallets
    const availableChains = chains.filter(chain => chainsWithWallets.has(chain.chain_id));

    return json({
      success: true,
      chains: availableChains
    });
  } catch (error) {
    console.error('Server error fetching chains:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
