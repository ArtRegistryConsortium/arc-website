import { calculateEthFromUsd, verifyEthTransaction } from '$lib/utils/ethereum';
import { supabaseAdmin } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * Test function to verify the activation process
 * This is for development/testing purposes only and should not be exposed in production
 */
async function testActivationProcess() {
  try {
    console.log('Testing activation process...');

    // 1. Test ETH price calculation
    const ethAmount = await calculateEthFromUsd(5);
    console.log(`5 USD is currently equivalent to ${ethAmount.toFixed(6)} ETH`);

    // 2. Test user_wallet_registrations table access
    const testWalletAddress = '0x1234567890123456789012345678901234567890';
    const now = new Date().toISOString();
    const validTo = new Date();
    validTo.setHours(validTo.getHours() + 1);

    // Create a test registration entry
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .insert({
        wallet_address: testWalletAddress,
        chain_id: 1, // Ethereum mainnet
        crypto_amount: ethAmount,
        valid_to: validTo.toISOString(),
        confirmed: false,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (registrationError) {
      console.error('Error creating test registration:', registrationError);
    } else {
      console.log('Test registration created:', registrationData);

      // Clean up the test data
      await supabaseAdmin
        .from('user_wallet_registrations')
        .delete()
        .eq('wallet_address', testWalletAddress);

      console.log('Test registration deleted');
    }

    // 3. Test ARC wallet retrieval
    // First, check what wallets are available in the table
    const { data: allWallets, error: allWalletsError } = await supabaseAdmin
      .from('arc_wallets')
      .select('*');

    if (allWalletsError) {
      console.error('Error fetching all ARC wallets:', allWalletsError);
    } else {
      console.log('Available ARC wallets:', allWallets);

      if (allWallets.length === 0) {
        console.error('No ARC wallets found in the table. Please add at least one wallet.');
      }
    }

    // Now try to get the Ethereum wallet specifically
    const { data: arcWalletData, error: arcWalletError } = await supabaseAdmin
      .from('arc_wallets')
      .select('wallet_address, chain_id')
      .eq('chain_id', 1) // Ethereum mainnet chain ID
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors if no row is found

    if (arcWalletError) {
      console.error('Error fetching Ethereum ARC wallet address:', arcWalletError);
    } else if (!arcWalletData) {
      console.error('No Ethereum wallet (chain_id = 1) found in arc_wallets table.');
      console.log('Please add an Ethereum wallet with the following SQL:');
      console.log("INSERT INTO arc_wallets (chain_id, wallet_address) VALUES (1, '0xYourEthereumWalletAddress');");
    } else {
      console.log('Ethereum ARC wallet address:', arcWalletData.wallet_address);
    }

    // 4. Test Infura connection
    try {
      console.log('Testing Infura connection with API key:', env.INFURA_API_KEY ? '✓ Key found' : '✗ Key missing');
      console.log('Infura URL:', env.INFURA_URL ? '✓ URL found' : '✗ URL missing');

      // Create a test client
      const testClient = createPublicClient({
        chain: mainnet,
        transport: http(env.INFURA_URL)
      });

      // Try to get the latest block number
      const blockNumber = await testClient.getBlockNumber();
      console.log('Successfully connected to Infura! Current block number:', blockNumber.toString());
    } catch (infuraError) {
      console.error('Error connecting to Infura:', infuraError);
    }

    console.log('Activation process test completed');
  } catch (error) {
    console.error('Error in activation process test:', error);
  }
}

// Run the test
testActivationProcess();
