import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Get the current timestamp
    const now = new Date().toISOString();

    // Check if a valid registration entry exists and is confirmed
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no confirmed registration found, check if wallet has fee_paid set to true
    if (registrationError) {
      // Check wallet fee_paid status directly
      const { data: walletData, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('fee_paid')
        .eq('wallet_address', walletAddress)
        .single();

      if (walletError) {
        return json({ 
          success: false, 
          error: 'Failed to retrieve wallet data' 
        }, { status: 500 });
      }

      // If fee is already paid, return success
      if (walletData.fee_paid) {
        return json({
          success: true,
          status: 'payment_confirmed',
          message: 'Payment already confirmed',
          feePaid: true
        });
      }

      // Otherwise, check for pending registrations
      const { data: pendingData, error: pendingError } = await supabaseAdmin
        .from('user_wallet_registrations')
        .select('*')
        .eq('wallet_address', walletAddress)
        .gte('valid_to', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingError) {
        return json({
          success: true,
          status: 'no_registration',
          message: 'No active registration found',
          feePaid: false
        });
      }

      return json({
        success: true,
        status: 'awaiting_payment',
        ethAmount: pendingData.eth_amount,
        validTo: pendingData.valid_to,
        feePaid: false
      });
    }

    // Registration is confirmed, update wallet if needed
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('fee_paid')
      .eq('wallet_address', walletAddress)
      .single();

    if (!walletError && !walletData.fee_paid) {
      // Update wallet fee_paid status
      await supabaseAdmin
        .from('wallets')
        .update({ 
          fee_paid: true,
          updated_at: now
        })
        .eq('wallet_address', walletAddress);
    }

    return json({
      success: true,
      status: 'payment_confirmed',
      message: 'Payment confirmed',
      feePaid: true
    });
  } catch (error) {
    console.error('Server error checking payment status:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
