import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch available chains
 */
export const GET: RequestHandler = async () => {
  try {
    console.log('API: Fetching available chains...');

    // Get active chains from the database
    const { data: chains, error: chainsError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('is_active', true)
      .order('chain_id');

    console.log('API: Active chains result:', { count: chains?.length || 0, error: chainsError });

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

    console.log('API: ARC wallets result:', { count: arcWallets?.length || 0, error: walletsError });

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
    let availableChains = chains.filter(chain => chainsWithWallets.has(chain.chain_id));

    // If no chains with wallets are found, return all active chains as a fallback
    if (availableChains.length === 0 && chains.length > 0) {
      console.log('API: No chains with wallets found, using all active chains as fallback');
      availableChains = chains;
    }

    console.log('API: Returning available chains:', { count: availableChains.length });
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
