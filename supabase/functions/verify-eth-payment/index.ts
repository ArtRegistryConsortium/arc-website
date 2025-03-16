import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const infuraApiKey = Deno.env.get('INFURA_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VerifyPaymentRequest {
  walletAddress: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: 204,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // Parse request body
    const { walletAddress } = await req.json() as VerifyPaymentRequest;

    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Wallet address is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get current timestamp
    const now = new Date().toISOString();

    // 1. Check if a valid registration entry exists
    const { data: registrationData, error: registrationError } = await supabase
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .gte('valid_to', now) // Only get entries that are still valid
      .not('eth_amount', 'is', null) // Ensure eth_amount is not null
      .order('created_at', { ascending: false }) // Get the most recent entry
      .limit(1)
      .single();

    if (registrationError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No valid registration found',
        details: registrationError
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // First, check if there are any wallets in the table
    const { data: allWallets, error: allWalletsError } = await supabase
      .from('arc_wallets')
      .select('*');

    if (allWalletsError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to query ARC wallets table',
        details: allWalletsError
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!allWallets || allWallets.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No ARC wallets configured. Please add wallet addresses to the arc_wallets table.'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Get the ARC wallet address for Ethereum
    const { data: arcWalletData, error: arcWalletError } = await supabase
      .from('arc_wallets')
      .select('wallet_address')
      .eq('chain_id', 1) // Ethereum mainnet chain ID
      .maybeSingle(); // Use maybeSingle instead of single

    // Declare the wallet address variable
    let arcWalletAddress: string;

    // If no Ethereum wallet is found, try to use any available wallet
    if (!arcWalletData) {
      console.log('No Ethereum wallet found, using the first available wallet');
      const fallbackWallet = allWallets[0];

      if (!fallbackWallet || !fallbackWallet.wallet_address) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No usable wallet addresses found'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      arcWalletAddress = fallbackWallet.wallet_address;
      console.log('Using fallback wallet address:', arcWalletAddress);
    } else if (arcWalletError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to retrieve ARC wallet address',
        details: arcWalletError
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    } else {
      // Use the Ethereum wallet if found
      arcWalletAddress = arcWalletData.wallet_address;
      console.log('Using Ethereum wallet address:', arcWalletAddress);
    }

    // 2. Verify the transaction on-chain using Infura
    const paymentVerified = await verifyEthTransaction(
      walletAddress,
      arcWalletAddress,
      registrationData.eth_amount
    );

    if (paymentVerified) {
      // Update the registration entry to confirmed
      await supabase
        .from('user_wallet_registrations')
        .update({
          confirmed: true,
          updated_at: now
        })
        .eq('id', registrationData.id);

      // Update the wallet's fee_paid status
      await updateWalletFeePaid(walletAddress);

      return new Response(JSON.stringify({
        success: true,
        status: 'payment_verified',
        message: 'Payment verified successfully',
        nextStep: '/activate/select-chain'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Payment not yet verified
      return new Response(JSON.stringify({
        success: true,
        status: 'awaiting_payment',
        ethAmount: registrationData.eth_amount,
        validTo: registrationData.valid_to,
        arcWalletAddress
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Server error in payment verification:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

/**
 * Verifies if a transaction from a specific address to the ARC wallet exists with the expected amount
 */
async function verifyEthTransaction(
  fromAddress: string,
  toAddress: string,
  expectedAmount: number,
): Promise<boolean> {
  try {
    // Use Infura API to check for transactions
    const infuraUrl = `https://mainnet.infura.io/v3/${infuraApiKey}`;

    // Get the current block number
    const blockNumberResponse = await fetch(infuraUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      })
    });

    const blockNumberData = await blockNumberResponse.json();
    const currentBlock = parseInt(blockNumberData.result, 16);

    // Look back 10000 blocks (approximately 1.5 days)
    const fromBlock = Math.max(0, currentBlock - 10000).toString(16);

    // Get transactions for the address
    const txResponse = await fetch(infuraUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getLogs',
        params: [{
          fromBlock: `0x${fromBlock}`,
          toBlock: 'latest',
          address: toAddress,
          topics: []
        }]
      })
    });

    const txData = await txResponse.json();

    if (!txData.result || !Array.isArray(txData.result)) {
      return false;
    }

    // Check each transaction
    for (const log of txData.result) {
      // Get the transaction details
      const txDetailsResponse = await fetch(infuraUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'eth_getTransactionByHash',
          params: [log.transactionHash]
        })
      });

      const txDetails = await txDetailsResponse.json();

      if (txDetails.result) {
        const tx = txDetails.result;

        // Check if this transaction is from our target address with the expected amount
        if (
          tx.from.toLowerCase() === fromAddress.toLowerCase() &&
          tx.to.toLowerCase() === toAddress.toLowerCase()
        ) {
          // Convert value from hex to decimal and from wei to ETH
          const txValueWei = parseInt(tx.value, 16);
          const txValueEth = txValueWei / 1e18;

          // Compare with a small tolerance (0.0001 ETH)
          if (Math.abs(txValueEth - expectedAmount) < 0.0001) {
            return true;
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to verify ETH transaction:', error);
    return false;
  }
}

/**
 * Updates the wallet's fee_paid status to true and increments setup_step if needed
 */
async function updateWalletFeePaid(walletAddress: string): Promise<void> {
  try {
    // First, get the current wallet data
    const { data: walletData, error: getError } = await supabase
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

      await supabase
        .from('wallets')
        .update(updateData)
        .eq('wallet_address', walletAddress);
    }
  } catch (error) {
    console.error('Error updating wallet fee_paid status:', error);
  }
}
