import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to add an Ethereum wallet to the arc_wallets table
 * This is for development/testing purposes only and should be secured or removed in production
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Check if an Ethereum wallet already exists
    const { data: existingWallet, error: checkError } = await supabaseAdmin
      .from('arc_wallets')
      .select('*')
      .eq('chain_id', 1)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing Ethereum wallet:', checkError);
      return json({ 
        success: false, 
        error: 'Database error when checking for existing wallet' 
      }, { status: 500 });
    }

    // If an Ethereum wallet exists, update it
    if (existingWallet) {
      const { error: updateError } = await supabaseAdmin
        .from('arc_wallets')
        .update({ 
          wallet_address: walletAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWallet.id);

      if (updateError) {
        console.error('Error updating Ethereum wallet:', updateError);
        return json({ 
          success: false, 
          error: 'Failed to update Ethereum wallet' 
        }, { status: 500 });
      }

      return json({
        success: true,
        message: 'Ethereum wallet updated successfully',
        wallet: {
          id: existingWallet.id,
          chain_id: 1,
          wallet_address: walletAddress
        }
      });
    }
    
    // If no Ethereum wallet exists, create one
    const { data: newWallet, error: insertError } = await supabaseAdmin
      .from('arc_wallets')
      .insert({
        chain_id: 1,
        wallet_address: walletAddress,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating Ethereum wallet:', insertError);
      return json({ 
        success: false, 
        error: 'Failed to create Ethereum wallet' 
      }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Ethereum wallet created successfully',
      wallet: newWallet
    });
  } catch (error) {
    console.error('Server error adding Ethereum wallet:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
