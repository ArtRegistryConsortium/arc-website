import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { calculateEthFromUsd, verifyEthTransaction } from '$lib/utils/ethereum';
import type { Address } from 'viem';
import type { Chain } from '$lib/services/activationService';

/**
 * API endpoint to handle wallet activation process
 * Checks for existing registration entry, verifies payment, or creates a new registration
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress, chainId } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Get available chains
    const { data: availableChains, error: chainsError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('is_active', true)
      .order('chain_id');

    if (chainsError) {
      console.error('Error fetching chains:', chainsError);
      return json({
        success: false,
        error: 'Failed to fetch available chains'
      }, { status: 500 });
    }

    // If no chains are available, return an error
    if (!availableChains || availableChains.length === 0) {
      return json({
        success: false,
        error: 'No active chains available'
      }, { status: 500 });
    }

    // Get the current timestamp
    const now = new Date().toISOString();

    // Determine which chain to use
    let selectedChainId = chainId;
    let selectedChain: Chain | undefined;

    // If no chain ID is provided, use the first available chain
    if (!selectedChainId && availableChains.length > 0) {
      selectedChainId = availableChains[0].chain_id;
    }

    // Find the selected chain in the available chains
    if (selectedChainId) {
      const foundChain = availableChains.find(chain => chain.chain_id === selectedChainId);
      if (foundChain) {
        // Convert to Chain type to match the expected interface
        selectedChain = {
          chain_id: foundChain.chain_id,
          name: foundChain.name,
          // Handle optional properties safely with type assertion
          symbol: (foundChain as any).symbol,
          icon_url: (foundChain as any).icon_url,
          explorer_url: foundChain.explorer_url || undefined,
          rpc_url: foundChain.rpc_url || undefined,
          is_testnet: (foundChain as any).is_testnet || false,
          is_active: (foundChain as any).is_active || true
        };
      }
    }

    // If no chain is selected or the selected chain is not available, return an error
    if (!selectedChain) {
      return json({
        success: false,
        error: 'Selected chain is not available',
        availableChains
      }, { status: 400 });
    }

    // 1. Check if a valid registration entry exists
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('chain_id', selectedChainId)
      .gte('valid_to', now) // Only get entries that are still valid
      .not('crypto_amount', 'is', null) // Ensure crypto_amount is not null
      .order('created_at', { ascending: false }) // Get the most recent entry
      .limit(1)
      .maybeSingle();

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

    // Get the ARC wallet address for the selected chain
    const { data: arcWalletData, error: arcWalletError } = await supabaseAdmin
      .from('arc_wallets')
      .select('wallet_address')
      .eq('chain_id', selectedChainId)
      .maybeSingle()

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
      console.log('Found valid registration entry:', registrationData);
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
      // For now, we're using the Ethereum verification function for all chains
      // In a production environment, you would use different verification functions for different chains
      // Use eth_amount for now since the database schema might not be updated yet
      // In a production environment, you would use crypto_amount after updating the schema
      const cryptoAmount = 'crypto_amount' in registrationData
        ? (registrationData as any).crypto_amount
        : registrationData.eth_amount;

      const paymentVerified = await verifyEthTransaction(
        walletAddress as Address,
        arcWalletAddress,
        cryptoAmount
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
          cryptoAmount: cryptoAmount,
          validTo: registrationData.valid_to,
          arcWalletAddress,
          chain: selectedChain,
          availableChains
        });
      }
    }
    // 3. If no valid registration entry exists, create a new one
    else {
      try {
        // Calculate the crypto amount equivalent to 5 USD
        // For now, we're using the Ethereum calculation for all chains
        // In a production environment, you would use different calculation functions for different chains
        const cryptoAmount = await calculateEthFromUsd(5);

        // Calculate valid_to timestamp (24 hours from now)
        const validTo = new Date();
        validTo.setHours(validTo.getHours() + 24);

        // Create a new registration entry
        const { data: newRegistration, error: insertError } = await supabaseAdmin
          .from('user_wallet_registrations')
          .insert({
            wallet_address: walletAddress,
            // Use eth_amount for now since the database schema might not be updated yet
            eth_amount: cryptoAmount,
            // Add chain_id as a separate update after insert if needed
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
          cryptoAmount: cryptoAmount,
          validTo: validTo.toISOString(),
          arcWalletAddress,
          chain: selectedChain,
          availableChains
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
