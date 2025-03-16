import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to save a chain wallet
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { chainId, walletAddress } = await request.json();

    if (!chainId) {
      return json({ success: false, error: 'Chain ID is required' }, { status: 400 });
    }

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return json({ 
        success: false, 
        error: 'Valid wallet address is required (must start with 0x)' 
      }, { status: 400 });
    }

    // Check if the chain exists
    const { data: chainData, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', chainId)
      .single();

    if (chainError) {
      console.error('Error checking chain:', chainError);
      return json({ 
        success: false, 
        error: 'Chain not found' 
      }, { status: 404 });
    }

    // Check if a wallet already exists for this chain
    const { data: existingWallet, error: checkError } = await supabaseAdmin
      .from('arc_wallets')
      .select('*')
      .eq('chain_id', chainId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing wallet:', checkError);
      return json({ 
        success: false, 
        error: 'Database error when checking for existing wallet' 
      }, { status: 500 });
    }

    const now = new Date().toISOString();

    // If a wallet exists for this chain, update it
    if (existingWallet) {
      const { error: updateError } = await supabaseAdmin
        .from('arc_wallets')
        .update({ 
          wallet_address: walletAddress,
          updated_at: now
        })
        .eq('id', existingWallet.id);

      if (updateError) {
        console.error('Error updating chain wallet:', updateError);
        return json({ 
          success: false, 
          error: 'Failed to update chain wallet' 
        }, { status: 500 });
      }

      return json({
        success: true,
        message: `Wallet for ${chainData.name} updated successfully`,
        wallet: {
          ...existingWallet,
          wallet_address: walletAddress,
          updated_at: now
        }
      });
    }
    
    // If no wallet exists for this chain, create one
    const { data: newWallet, error: insertError } = await supabaseAdmin
      .from('arc_wallets')
      .insert({
        chain_id: chainId,
        wallet_address: walletAddress,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating chain wallet:', insertError);
      return json({ 
        success: false, 
        error: 'Failed to create chain wallet' 
      }, { status: 500 });
    }

    return json({
      success: true,
      message: `Wallet for ${chainData.name} created successfully`,
      wallet: newWallet
    });
  } catch (error) {
    console.error('Server error saving chain wallet:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
