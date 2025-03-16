import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Check if wallet exists
    const { data: existingWallet, error: checkError } = await supabaseAdmin
      .from('wallets')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .single();

    const now = new Date().toISOString();

    // If wallet doesn't exist, create it
    if (checkError && checkError.code === 'PGRST116') {
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
      const { data: newWallet, error: insertError } = await supabaseAdmin
        .from('wallets')
        .insert(walletData)
        .select();

      if (insertError) {
        console.error('Server error creating wallet entry:', insertError);
        return json({ success: false, error: 'Database error during creation' }, { status: 500 });
      }

      return json({ success: true, created: true, data: newWallet });
    } else if (checkError) {
      console.error('Server error checking wallet existence:', checkError);
      return json({ success: false, error: 'Database error during check' }, { status: 500 });
    }

    // Wallet exists, update the last login time
    const updateData = {
      last_login: now,
      updated_at: now
    };

    const { data: updatedWallet, error: updateError } = await supabaseAdmin
      .from('wallets')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select();

    if (updateError) {
      console.error('Server error updating wallet last login:', updateError);
      return json({ success: false, error: 'Database error during update' }, { status: 500 });
    }

    return json({ success: true, created: false, data: updatedWallet });
  } catch (error) {
    console.error('Server error in wallet ensure endpoint:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
