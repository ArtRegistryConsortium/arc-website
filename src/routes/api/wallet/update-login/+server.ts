import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const updateData = {
      last_login: now,
      updated_at: now
    };

    // Update the wallet last login time
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select();

    if (error) {
      console.error('Server error updating wallet last login:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }

    return json({ success: true, data });
  } catch (error) {
    console.error('Server error in wallet update-login endpoint:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
