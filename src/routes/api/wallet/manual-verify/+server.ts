import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Address } from 'viem';
import { verifyEthTransaction } from '$lib/utils/ethereum';
import { env } from '$env/dynamic/private';

/**
 * API endpoint to manually verify a payment and update the database
 * This is a simplified approach that bypasses the blockchain verification
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData = await request.json();
    const walletAddress = requestData.walletAddress;
    const transactionHash = requestData.transactionHash;
    const chainId = requestData.chainId;

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    console.log('Manual verification request:', { walletAddress, transactionHash, chainId });

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

    // Verify the transaction if a hash is provided
    if (transactionHash) {
      console.log('Transaction hash provided, verifying on blockchain:', transactionHash);

      // Get the ARC wallet address from the registration
      // Note: We're using the same address for both wallet_address and ARC wallet address in this implementation
      const arcWalletAddress = registrationData.wallet_address;

      if (!arcWalletAddress) {
        return json({
          success: false,
          error: 'ARC wallet address not found in registration'
        }, { status: 400 });
      }

      // Verify the transaction on the blockchain
      // Ensure transaction hash is properly formatted
      const formattedTxHash = transactionHash && transactionHash.startsWith('0x')
        ? (transactionHash as `0x${string}`)
        : undefined;

      // First try with our standard verification
      const verificationResult = await verifyEthTransaction(
        walletAddress as Address,
        arcWalletAddress as Address, // Cast to Address type
        registrationData.crypto_amount,
        formattedTxHash,
        chainId // Pass the chain ID to use the correct network
      );

      // If standard verification fails, try with Etherscan API as a fallback
      if (!verificationResult.success && formattedTxHash) {
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
          url.searchParams.append('txhash', formattedTxHash);
          url.searchParams.append('apikey', env.ETHERSCAN_API_KEY || ''); // Use API key if available

          // Make the request to Etherscan API
          const response = await fetch(url.toString());

          if (!response.ok) {
            throw new Error(`Etherscan API responded with status: ${response.status}`);
          }

          const data = await response.json();

          // Check if the response contains an error message
          if (data.error || data.message) {
            const errorMessage = data.error || data.message;
            console.error(`Etherscan API error: ${errorMessage}`);

            // Handle specific error cases
            if (errorMessage.includes('API Key')) {
              console.error('Missing or invalid Etherscan API key. Please configure a valid API key in your environment variables.');
              console.error('You can get a free API key at https://etherscan.io/apis');
              throw new Error('Etherscan API key error: ' + errorMessage);
            }

            throw new Error('Etherscan API error: ' + errorMessage);
          }

          // Check if the transaction was found
          if (data.result === null) {
            throw new Error('Transaction not found on Etherscan');
          }

          // Log the full transaction data for debugging
          console.log('Full transaction data from Etherscan:', data.result);

          // Check if this is our target transaction (recipient matches)
          // Log detailed address information for debugging
          console.log('Transaction recipient check:', {
            transactionTo: data.result.to?.toLowerCase(),
            expectedArcWallet: arcWalletAddress.toLowerCase(),
            match: data.result.to?.toLowerCase() === arcWalletAddress.toLowerCase()
          });

          if (data.result.to && data.result.to.toLowerCase() === arcWalletAddress.toLowerCase()) {
            console.log('Transaction found on Etherscan and recipient matches!');

            // Success! Transaction verified with Etherscan
            console.log('Transaction verified successfully with Etherscan API');
          } else {
            // In development, we can optionally bypass the recipient check
            const bypassRecipientCheck = env.NODE_ENV === 'development' && env.BYPASS_RECIPIENT_CHECK === 'true';

            if (bypassRecipientCheck) {
              console.log('WARNING: Bypassing recipient check in development mode!');
              console.log('Transaction verification forced to succeed despite recipient mismatch');
            } else {
              throw new Error('Transaction found on Etherscan but recipient does not match');
            }
          }
        } catch (etherscanError) {
          console.error('Etherscan verification failed:', etherscanError);

          return json({
            success: false,
            error: `Transaction verification failed: ${verificationResult.error}`,
            etherscanError: etherscanError instanceof Error ? etherscanError.message : String(etherscanError),
            details: {
              transactionHash,
              error: verificationResult.error
            }
          }, { status: 400 });
        }
      } else if (verificationResult.success) {
        console.log('Transaction verified successfully with standard verification!');
      } else {
        return json({
          success: false,
          error: `Transaction verification failed: ${verificationResult.error}`,
          details: {
            transactionHash,
            error: verificationResult.error
          }
        }, { status: 400 });
      }

      console.log('Transaction verified successfully on chain ID:', verificationResult.foundOnChain);
    }

    // 2. Update the registration to confirmed
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .update({
        confirmed: true,
        updated_at: now,
        // Store the transaction hash if provided
        tx_hash: transactionHash
      })
      .eq('id', registrationData.id)
      .select();

    // Log the update for debugging
    console.log('Manual verification update result:', { updateData, updateError });

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
      nextStep: '/activate/choose-identity-type'
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
