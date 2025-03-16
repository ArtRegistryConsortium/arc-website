import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ exists: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Check if wallet exists in database
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 means no rows returned, which means the wallet doesn't exist
        return json({ exists: false });
      }
      console.error('Server error checking wallet existence:', error);
      return json({ exists: false, error: 'Database error' }, { status: 500 });
    }

    return json({ exists: !!data });
  } catch (error) {
    console.error('Server error in wallet check endpoint:', error);
    return json({ exists: false, error: 'Server error' }, { status: 500 });
  }
};
