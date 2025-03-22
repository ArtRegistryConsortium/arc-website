import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update the wallet's setup_completed field to true
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .update({
        setup_completed: true,
        updated_at: now
      })
      .eq('wallet_address', walletAddress)
      .select('setup_completed');

    if (error) {
      console.error('Server error updating wallet setup completion:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }

    console.log('Wallet setup completed for:', walletAddress);
    return json({
      success: true,
      data: {
        setup_completed: data?.[0]?.setup_completed || true
      }
    });
  } catch (error) {
    console.error('Server error in wallet complete setup endpoint:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
