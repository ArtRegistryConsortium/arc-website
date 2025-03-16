import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Address } from 'viem';

/**
 * API endpoint to manually verify a payment and update the database
 * This is a simplified approach that bypasses the blockchain verification
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress, transactionHash } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('Manual verification request:', { walletAddress, transactionHash });

    // Get the current timestamp
    const now = new Date().toISOString();

    // 1. Find the most recent registration for this wallet
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError) {
      console.error('Error finding registration:', registrationError);
      return json({ 
        success: false, 
        error: 'No registration found for this wallet' 
      }, { status: 404 });
    }

    console.log('Found registration:', registrationData);

    // 2. Update the registration to confirmed
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .update({ 
        confirmed: true,
        updated_at: now,
        // Store the transaction hash if provided
        ...(transactionHash ? { transaction_hash: transactionHash } : {})
      })
      .eq('id', registrationData.id)
      .select();

    if (updateError) {
      console.error('Error updating registration:', updateError);
      return json({ 
        success: false, 
        error: 'Failed to update registration' 
      }, { status: 500 });
    }

    console.log('Updated registration:', updateData);

    // 3. Update the wallet's fee_paid status
    const { data: walletData, error: getWalletError } = await supabaseAdmin
      .from('wallets')
      .select('fee_paid, setup_step')
      .eq('wallet_address', walletAddress)
      .single();

    if (getWalletError) {
      console.error('Error fetching wallet data:', getWalletError);
      return json({ 
        success: false, 
        error: 'Failed to fetch wallet data' 
      }, { status: 500 });
    }

    console.log('Current wallet data:', walletData);

    // Only update if fee_paid is false
    if (!walletData.fee_paid) {
      const updateData = {
        fee_paid: true,
        updated_at: now,
        // If setup_step is 0, increment it to 1
        ...(walletData.setup_step === 0 ? { setup_step: 1 } : {})
      };

      console.log('Updating wallet with:', updateData);

      const { data: updatedWallet, error: updateWalletError } = await supabaseAdmin
        .from('wallets')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select();

      if (updateWalletError) {
        console.error('Error updating wallet:', updateWalletError);
        return json({ 
          success: false, 
          error: 'Failed to update wallet' 
        }, { status: 500 });
      }

      console.log('Wallet updated successfully:', updatedWallet);
    } else {
      console.log('Wallet already has fee_paid=true, no update needed');
    }

    return json({
      success: true,
      status: 'payment_verified',
      message: 'Payment manually verified and database updated',
      nextStep: '/activate/select-chain'
    });
  } catch (error) {
    console.error('Server error in manual verification:', error);
    return json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
