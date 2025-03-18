import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Get wallet status from database
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('setup_completed, setup_step, fee_paid')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Server error getting wallet status:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }

    console.log('Wallet status data from database:', data);

    return json({
      success: true,
      data: {
        setup_completed: data.setup_completed || false,
        setup_step: data.setup_step || 0,
        fee_paid: data.fee_paid || false
      }
    });
  } catch (error) {
    console.error('Server error in wallet status endpoint:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
