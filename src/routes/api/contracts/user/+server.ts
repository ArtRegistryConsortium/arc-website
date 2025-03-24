import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Fetch ART contracts for the wallet address by joining with identities table
    const { data: contracts, error } = await supabaseAdmin
      .from('art_contracts')
      .select(`
        contract_address,
        identity_id,
        chain_id,
        created_at,
        identities!inner(name, wallet_address)
      `)
      .eq('identities.wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ART contracts:', error);
      return json({ success: false, error: 'Failed to fetch ART contracts' }, { status: 500 });
    }

    // Format the contracts for the response
    const formattedContracts = contracts.map(contract => ({
      address: contract.contract_address,
      artistIdentityId: contract.identity_id,
      name: `ARC / ${contract.identities?.name || 'Unknown'}`,
      symbol: 'ARC' + (contract.identities?.name?.charAt(0) || ''),  // Generate symbol from name
      chainId: contract.chain_id,
      deployedAt: contract.created_at
    }));

    return json({
      success: true,
      contracts: formattedContracts || []
    });
  } catch (error) {
    console.error('Server error fetching ART contracts:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
