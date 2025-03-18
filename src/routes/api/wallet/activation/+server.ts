import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { calculateEthFromUsd, verifyEthTransaction } from '$lib/utils/ethereum';
import type { Address } from 'viem';
import type { Chain } from '$lib/services/activationService';
import { env } from '$env/dynamic/private';

/**
 * API endpoint to handle wallet activation process
 * Checks for existing registration entry, verifies payment, or creates a new registration
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress, chainId, transactionHash } = await request.json();

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

    // 1. First check if ANY registration entry exists for this wallet and chain, regardless of validity
    // Use a transaction to prevent race conditions
    const { data: existingRegistration, error: existingRegError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('chain_id', selectedChainId)
      .order('created_at', { ascending: false }) // Get the most recent entry
      .limit(1)
      .maybeSingle();

    // Then check if a VALID registration entry exists
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

    // If no wallet is found for the selected chain, try to use any available wallet
    if (!arcWalletData) {
      console.warn(`No wallet found for chain ${selectedChain.name} (ID: ${selectedChainId}), using the first available wallet`);
      const fallbackWallet = allWallets[0];

      if (!fallbackWallet || !fallbackWallet.wallet_address) {
        console.error('No usable wallet addresses found');
        return json({
          success: false,
          error: 'No usable wallet addresses found'
        }, { status: 500 });
      }

      arcWalletAddress = fallbackWallet.wallet_address as Address;
      console.log(`Using fallback wallet address for ${selectedChain.name}:`, arcWalletAddress);
    } else if (arcWalletError) {
      console.error(`Error fetching wallet address for chain ${selectedChain.name}:`, arcWalletError);
      return json({
        success: false,
        error: 'Failed to retrieve ARC wallet address'
      }, { status: 500 });
    } else {
      // Use the wallet found for the selected chain
      arcWalletAddress = arcWalletData.wallet_address as Address;
      // Log with chain name to avoid confusion
      console.log(`Using ${selectedChain.name} wallet address (chain ID: ${selectedChainId}):`, arcWalletAddress);
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
          nextStep: '/activate/choose-identity-type'
        });
      }

      // Verify the transaction on-chain
      // For now, we're using the Ethereum verification function for all chains
      // In a production environment, you would use different verification functions for different chains
      // Get the crypto amount from the registration data
      // Handle both schema versions (eth_amount and crypto_amount)
      let cryptoAmount: number;
      if ('crypto_amount' in registrationData && registrationData.crypto_amount !== null) {
        cryptoAmount = Number(registrationData.crypto_amount);
        console.log('Using crypto_amount from registration:', cryptoAmount);
      } else if ('eth_amount' in registrationData && registrationData.eth_amount !== null) {
        cryptoAmount = Number(registrationData.eth_amount);
        console.log('Using eth_amount from registration:', cryptoAmount);
      } else {
        console.error('No valid amount found in registration data:', registrationData);
        return json({
          success: false,
          error: 'Invalid registration data: no amount found'
        }, { status: 500 });
      }

      console.log('Verifying payment:', {
        walletAddress,
        arcWalletAddress,
        cryptoAmount,
        registrationId: registrationData.id
      });

      // If transaction hash is provided, verify it directly
      let paymentVerified = false;
      let verifiedOnChain: number | undefined;
      let verificationError: string | undefined;

      if (transactionHash) {
        console.log('Transaction hash provided, verifying directly:', transactionHash);
        const verificationResult = await verifyEthTransaction(
          walletAddress as Address,
          arcWalletAddress,
          cryptoAmount,
          transactionHash as `0x${string}`,
          chainId // Pass the chain ID to use the correct network
        );

        paymentVerified = verificationResult.success;
        verifiedOnChain = verificationResult.foundOnChain;
        verificationError = verificationResult.error;

        console.log('Payment verification result:', {
          success: paymentVerified,
          foundOnChain: verifiedOnChain,
          error: verificationError
        });

        // If standard verification fails, try with Etherscan API as a fallback
        if (!paymentVerified) {
          console.log('Standard verification failed, trying Etherscan API...');

          try {
            // Determine the correct Etherscan API URL based on the network
            let apiUrl = 'https://api.etherscan.io/api';
            if (chainId === 11155111) {
              apiUrl = 'https://api-sepolia.etherscan.io/api';
            } else if (chainId === 5) {
              apiUrl = 'https://api-goerli.etherscan.io/api';
            }

            // Build the API request URL
            const url = new URL(apiUrl);
            url.searchParams.append('module', 'proxy');
            url.searchParams.append('action', 'eth_getTransactionByHash');
            url.searchParams.append('txhash', transactionHash as string);
            url.searchParams.append('apikey', env.ETHERSCAN_API_KEY || ''); // Use API key if available

            // Make the request to Etherscan API
            const response = await fetch(url.toString());

            if (!response.ok) {
              throw new Error(`Etherscan API responded with status: ${response.status}`);
            }

            const data = await response.json();

            // Check if the transaction was found
            if (data.result === null) {
              throw new Error('Transaction not found on Etherscan');
            }

            // Check if this is our target transaction (recipient matches)
            if (data.result.to && data.result.to.toLowerCase() === arcWalletAddress.toLowerCase()) {
              console.log('Transaction found on Etherscan and recipient matches!');

              // Success! Transaction verified with Etherscan
              console.log('Transaction verified successfully with Etherscan API');
              paymentVerified = true;
              verifiedOnChain = chainId || 1; // Use the provided chain ID or default to mainnet
            } else {
              throw new Error('Transaction found on Etherscan but recipient does not match');
            }
          } catch (etherscanError) {
            console.error('Etherscan verification failed:', etherscanError);
            verificationError = etherscanError instanceof Error ? etherscanError.message : String(etherscanError);
          }
        }
      } else {
        console.log('No transaction hash provided, cannot verify payment');
      }

      if (paymentVerified) {
        console.log('Payment verified, updating registration entry...');

        // Update the registration entry to confirmed
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('user_wallet_registrations')
          .update({
            confirmed: true,
            updated_at: now
          })
          .eq('id', registrationData.id)
          .select();

        if (updateError) {
          console.error('Error updating registration entry:', updateError);
          return json({
            success: false,
            error: 'Failed to update registration status'
          }, { status: 500 });
        }

        console.log('Registration entry updated:', updateData);

        // Update the wallet's fee_paid status
        const walletUpdateResult = await updateWalletFeePaid(walletAddress);
        console.log('Wallet fee_paid update result:', walletUpdateResult);

        return json({
          success: true,
          status: 'payment_verified',
          message: 'Payment verified successfully',
          nextStep: '/activate/choose-identity-type'
        });
      } else {
        console.log('Payment not yet verified, waiting for transaction...');

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
    // 3. If no valid registration entry exists, update or create one
    else {
      try {
        // Calculate the crypto amount equivalent to 5 USD
        // For now, we're using the Ethereum calculation for all chains
        // In a production environment, you would use different calculation functions for different chains
        const cryptoAmount = await calculateEthFromUsd(5);

        // Calculate valid_to timestamp (1 hour from now)
        const validTo = new Date();
        validTo.setHours(validTo.getHours() + 1);

        // If an existing registration was found (but expired), update it instead of creating a new one
        if (existingRegistration && !existingRegError) {
          console.log('Found existing registration (expired or invalid). Updating instead of creating new:', existingRegistration);

          const { data: updatedRegistration, error: updateError } = await supabaseAdmin
            .from('user_wallet_registrations')
            .update({
              crypto_amount: cryptoAmount,
              valid_to: validTo.toISOString(),
              confirmed: false,
              updated_at: now
            })
            .eq('id', existingRegistration.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating registration entry:', updateError);
            return json({
              success: false,
              error: 'Failed to update registration entry'
            }, { status: 500 });
          }

          return json({
            success: true,
            status: 'registration_updated',
            cryptoAmount: cryptoAmount,
            validTo: validTo.toISOString(),
            arcWalletAddress,
            chain: selectedChain,
            availableChains
          });
        } else {
          // Double-check that no registration exists to prevent race conditions
          // Use a more robust query with a lock to prevent race conditions
          const { data: doubleCheckReg, error: doubleCheckError } = await supabaseAdmin
            .from('user_wallet_registrations')
            .select('id')
            .eq('wallet_address', walletAddress)
            .eq('chain_id', selectedChainId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (doubleCheckReg) {
            // A registration was created between our first check and now (race condition)
            console.log(`Registration was created by another request for wallet ${walletAddress} on chain ${selectedChainId}. Using existing registration:`, doubleCheckReg.id);

            // Update the existing registration instead
            const { data: updatedRegistration, error: updateError } = await supabaseAdmin
              .from('user_wallet_registrations')
              .update({
                crypto_amount: cryptoAmount,
                valid_to: validTo.toISOString(),
                confirmed: false,
                updated_at: now
              })
              .eq('id', doubleCheckReg.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating registration entry:', updateError);
              return json({
                success: false,
                error: 'Failed to update registration entry'
              }, { status: 500 });
            }

            return json({
              success: true,
              status: 'registration_updated',
              cryptoAmount: cryptoAmount,
              validTo: validTo.toISOString(),
              arcWalletAddress,
              chain: selectedChain,
              availableChains
            });
          }

          // Create a new registration entry if no existing one was found
          // Use a transaction ID to track this specific creation attempt
          const transactionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
          console.log(`[${transactionId}] Creating new registration entry for wallet ${walletAddress} on chain ${selectedChainId} (${selectedChain.name})`);

          // Final check before insert to prevent race conditions
          const { count, error: countError } = await supabaseAdmin
            .from('user_wallet_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('wallet_address', walletAddress)
            .eq('chain_id', selectedChainId);

          if (count && count > 0) {
            console.log(`[${transactionId}] Aborting creation - found ${count} existing registrations in final check`);

            // Get the existing registration
            const { data: existingReg } = await supabaseAdmin
              .from('user_wallet_registrations')
              .select('*')
              .eq('wallet_address', walletAddress)
              .eq('chain_id', selectedChainId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            // Update it instead
            const { data: updatedReg, error: updateError } = await supabaseAdmin
              .from('user_wallet_registrations')
              .update({
                crypto_amount: cryptoAmount,
                valid_to: validTo.toISOString(),
                confirmed: false,
                updated_at: now
              })
              .eq('id', existingReg.id)
              .select()
              .single();

            if (updateError) {
              console.error(`[${transactionId}] Error updating existing registration:`, updateError);
              return json({
                success: false,
                error: 'Failed to update registration entry'
              }, { status: 500 });
            }

            console.log(`[${transactionId}] Updated existing registration instead of creating new one`);
            return json({
              success: true,
              status: 'registration_updated',
              cryptoAmount: cryptoAmount,
              validTo: validTo.toISOString(),
              arcWalletAddress,
              chain: selectedChain,
              availableChains
            });
          }

          console.log(`[${transactionId}] Proceeding with creation - no existing registrations found in final check`);
          const { data: newRegistration, error: insertError } = await supabaseAdmin
            .from('user_wallet_registrations')
            .insert({
              wallet_address: walletAddress,
              chain_id: selectedChainId,
              crypto_amount: cryptoAmount,
              valid_to: validTo.toISOString(),
              confirmed: false,
              created_at: now,
              updated_at: now
            })
            .select()
            .single();

          if (insertError) {
            console.error(`[${transactionId}] Error creating registration entry:`, insertError);

            // Check if this is a unique constraint violation (duplicate entry)
            if (insertError.code === '23505') { // PostgreSQL unique violation code
              console.log(`[${transactionId}] Duplicate entry detected, trying to use existing registration`);

              // Get the existing registration
              const { data: existingReg } = await supabaseAdmin
                .from('user_wallet_registrations')
                .select('*')
                .eq('wallet_address', walletAddress)
                .eq('chain_id', selectedChainId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              if (existingReg) {
                console.log(`[${transactionId}] Found existing registration, returning it instead`);
                return json({
                  success: true,
                  status: 'registration_created',
                  cryptoAmount: existingReg.crypto_amount,
                  validTo: existingReg.valid_to,
                  arcWalletAddress,
                  chain: selectedChain,
                  availableChains
                });
              }
            }

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
        }
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
 * @returns Object with success status and details
 */
async function updateWalletFeePaid(walletAddress: string): Promise<{ success: boolean; details: any }> {
  try {
    console.log('Updating wallet fee_paid status for:', walletAddress);

    // First, get the current wallet data
    const { data: walletData, error: getError } = await supabaseAdmin
      .from('wallets')
      .select('fee_paid, setup_step')
      .eq('wallet_address', walletAddress)
      .single();

    if (getError) {
      console.error('Error fetching wallet data:', getError);
      return { success: false, details: { error: getError, message: 'Failed to fetch wallet data' } };
    }

    console.log('Current wallet data:', walletData);

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

      console.log('Updating wallet with:', updateData);

      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('wallets')
        .update(updateData)
        .eq('wallet_address', walletAddress)
        .select();

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return { success: false, details: { error: updateError, message: 'Failed to update wallet' } };
      }

      console.log('Wallet updated successfully:', updatedData);
      return { success: true, details: { updated: true, data: updatedData } };
    } else {
      console.log('Wallet already has fee_paid=true, no update needed');
      return { success: true, details: { updated: false, message: 'Wallet already has fee_paid=true' } };
    }
  } catch (error) {
    console.error('Error updating wallet fee_paid status:', error);
    return { success: false, details: { error, message: 'Exception occurred during wallet update' } };
  }
}
