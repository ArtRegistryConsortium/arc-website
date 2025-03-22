import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Fetch identities for the wallet address
    const { data: identities, error } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching identities:', error);
      return json({ success: false, error: 'Failed to fetch identities' }, { status: 500 });
    }

    return json({
      success: true,
      identities: identities || []
    });
  } catch (error) {
    console.error('Server error fetching identities:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
