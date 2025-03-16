import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create the wallet entry data
    const walletData = {
      wallet_address: walletAddress,
      created_at: now,
      updated_at: now,
      last_login: now,
      fee_paid: false,
      setup_completed: false,
      setup_step: 0
    };

    // Insert the wallet entry
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .insert(walletData)
      .select();

    if (error) {
      console.error('Server error creating wallet entry:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }

    return json({ success: true, data });
  } catch (error) {
    console.error('Server error in wallet create endpoint:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
