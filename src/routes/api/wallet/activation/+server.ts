import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { calculateEthFromUsd, verifyEthTransaction } from '$lib/utils/ethereum';
import type { Address } from 'viem';

/**
 * API endpoint to handle wallet activation process
 * Checks for existing registration entry, verifies payment, or creates a new registration
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Get the current timestamp
    const now = new Date().toISOString();

    // 1. Check if a valid registration entry exists
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .gte('valid_to', now) // Only get entries that are still valid
      .not('eth_amount', 'is', null) // Ensure eth_amount is not null
      .order('created_at', { ascending: false }) // Get the most recent entry
      .limit(1)
      .single();

    // First, check if there are any wallets in the table
    const { data: allWallets, error: allWalletsError } = await supabaseAdmin
      .from('arc_wallets')
      .select('*');

    if (allWalletsError) {
      console.error('Error fetching all ARC wallets:', allWalletsError);
      return json({
        success: false,
        error: 'Failed to query ARC wallets table'
      }, { status: 500 });
    }

    if (allWallets.length === 0) {
      console.error('No ARC wallets found in the table');
      return json({
        success: false,
        error: 'No ARC wallets configured. Please add wallet addresses to the arc_wallets table.'
      }, { status: 500 });
    }

    // Get the ARC wallet address for Ethereum
    const { data: arcWalletData, error: arcWalletError } = await supabaseAdmin
      .from('arc_wallets')
      .select('wallet_address')
      .eq('chain_id', 1) // Ethereum mainnet chain ID
      .maybeSingle(); // Use maybeSingle instead of single

    // Declare the wallet address variable
    let arcWalletAddress: Address;

    // If no Ethereum wallet is found, try to use any available wallet
    if (!arcWalletData) {
      console.warn('No Ethereum wallet found, using the first available wallet');
      const fallbackWallet = allWallets[0];

      if (!fallbackWallet || !fallbackWallet.wallet_address) {
        console.error('No usable wallet addresses found');
        return json({
          success: false,
          error: 'No usable wallet addresses found'
        }, { status: 500 });
      }

      arcWalletAddress = fallbackWallet.wallet_address as Address;
      console.log('Using fallback wallet address:', arcWalletAddress);
    } else if (arcWalletError) {
      console.error('Error fetching ARC wallet address:', arcWalletError);
      return json({
        success: false,
        error: 'Failed to retrieve ARC wallet address'
      }, { status: 500 });
    } else {
      // Use the Ethereum wallet if found
      arcWalletAddress = arcWalletData.wallet_address as Address;
      console.log('Using Ethereum wallet address:', arcWalletAddress);
    }

    // 2. If a valid registration entry exists
    if (registrationData && !registrationError) {
      // Check if payment has already been confirmed
      if (registrationData.confirmed) {
        // Update the wallet's fee_paid status if not already done
        await updateWalletFeePaid(walletAddress);

        return json({
          success: true,
          status: 'payment_confirmed',
          message: 'Payment already confirmed',
          nextStep: '/activate/select-chain'
        });
      }

      // Verify the transaction on-chain
      const paymentVerified = await verifyEthTransaction(
        walletAddress as Address,
        arcWalletAddress,
        registrationData.eth_amount
      );

      if (paymentVerified) {
        // Update the registration entry to confirmed
        await supabaseAdmin
          .from('user_wallet_registrations')
          .update({
            confirmed: true,
            updated_at: now
          })
          .eq('id', registrationData.id);

        // Update the wallet's fee_paid status
        await updateWalletFeePaid(walletAddress);

        return json({
          success: true,
          status: 'payment_verified',
          message: 'Payment verified successfully',
          nextStep: '/activate/select-chain'
        });
      } else {
        // Payment not yet verified
        return json({
          success: true,
          status: 'awaiting_payment',
          ethAmount: registrationData.eth_amount,
          validTo: registrationData.valid_to,
          arcWalletAddress
        });
      }
    }
    // 3. If no valid registration entry exists, create a new one
    else {
      try {
        // Calculate the ETH amount equivalent to 5 USD
        const ethAmount = await calculateEthFromUsd(5);

        // Calculate valid_to timestamp (24 hours from now)
        const validTo = new Date();
        validTo.setHours(validTo.getHours() + 24);

        // Create a new registration entry
        const { data: newRegistration, error: insertError } = await supabaseAdmin
          .from('user_wallet_registrations')
          .insert({
            wallet_address: walletAddress,
            eth_amount: ethAmount,
            valid_to: validTo.toISOString(),
            confirmed: false,
            created_at: now,
            updated_at: now
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating registration entry:', insertError);
          return json({
            success: false,
            error: 'Failed to create registration entry'
          }, { status: 500 });
        }

        return json({
          success: true,
          status: 'registration_created',
          ethAmount: ethAmount,
          validTo: validTo.toISOString(),
          arcWalletAddress
        });
      } catch (error) {
        console.error('Error in ETH calculation or registration creation:', error);
        return json({
          success: false,
          error: 'Failed to process registration'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Server error in activation process:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};

/**
 * Updates the wallet's fee_paid status to true and increments setup_step if needed
 * @param walletAddress The wallet address to update
 */
async function updateWalletFeePaid(walletAddress: string): Promise<void> {
  try {
    // First, get the current wallet data
    const { data: walletData, error: getError } = await supabaseAdmin
      .from('wallets')
      .select('fee_paid, setup_step')
      .eq('wallet_address', walletAddress)
      .single();

    if (getError) {
      console.error('Error fetching wallet data:', getError);
      return;
    }

    // Only update if fee_paid is false
    if (!walletData.fee_paid) {
      const updateData: {
        fee_paid: boolean;
        setup_step?: number;
        updated_at: string;
      } = {
        fee_paid: true,
        updated_at: new Date().toISOString()
      };

      // If setup_step is 0, increment it to 1
      if (walletData.setup_step === 0) {
        updateData.setup_step = 1;
      }

      await supabaseAdmin
        .from('wallets')
        .update(updateData)
        .eq('wallet_address', walletAddress);
    }
  } catch (error) {
    console.error('Error updating wallet fee_paid status:', error);
  }
}
