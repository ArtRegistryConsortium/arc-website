import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress, setupStep } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    if (setupStep === undefined || setupStep < 0 || setupStep > 4) {
      return json({ success: false, error: 'Valid setup step (0-4) is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update the wallet's setup step
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .update({
        setup_step: setupStep,
        // No longer automatically setting setup_completed to true
        updated_at: now
      })
      .eq('wallet_address', walletAddress)
      .select('setup_step');

    if (error) {
      console.error('Server error updating wallet setup step:', error);
      return json({ success: false, error: 'Database error' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return json({ success: false, error: 'Wallet not found' }, { status: 404 });
    }

    return json({
      success: true,
      message: `Setup step updated to ${setupStep}`,
      currentStep: data[0].setup_step
    });
  } catch (error) {
    console.error('Server error in update-setup endpoint:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
};
