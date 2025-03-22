import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider, Contract, Wallet } from 'ethers';
import { env } from '$env/dynamic/private';
import type { CreateIdentityRequest } from '$lib/services/identityService';

// ABI for the Identity contract's createIdentity function
const IDENTITY_ABI = [
  "function createIdentity(uint8 identityType, string name, string description, string identityImage, string[] links, string[] tags, uint256 dob, uint256 dod, string location, string[] addresses, string representedBy, string representedArtists) external returns (uint256)"
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData = await request.json() as CreateIdentityRequest;
    const { walletAddress, identityType, name, chainId } = requestData;

    // Validate required fields
    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }
    if (identityType === undefined) {
      return json({ success: false, error: 'Identity type is required' }, { status: 400 });
    }
    if (!name) {
      return json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!chainId) {
      return json({ success: false, error: 'Chain ID is required' }, { status: 400 });
    }

    // Check if payment is confirmed
    const { data: registrationData, error: registrationError } = await supabaseAdmin
      .from('user_wallet_registrations')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('chain_id', chainId)
      .eq('confirmed', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (registrationError || !registrationData) {
      console.error('Payment not confirmed:', registrationError);
      return json({
        success: false,
        error: 'Payment not confirmed. Please complete payment before creating an identity.'
      }, { status: 400 });
    }

    // Get the identity contract address for the selected chain
    const { data: contractData, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('identity_contract_address')
      .eq('chain_id', chainId)
      .single();

    if (contractError || !contractData) {
      console.error('Contract not found for chain:', contractError);
      return json({
        success: false,
        error: 'Identity contract not found for the selected chain.'
      }, { status: 400 });
    }

    const identityContractAddress = contractData.identity_contract_address;

    // Get the chain information for RPC URL
    const { data: chainData, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('rpc_url')
      .eq('chain_id', chainId)
      .single();

    if (chainError || !chainData || !chainData.rpc_url) {
      console.error('Chain RPC URL not found:', chainError);
      return json({
        success: false,
        error: 'Chain RPC URL not found.'
      }, { status: 400 });
    }

    // Get the private key from environment variables
    const privateKey = env.IDENTITY_CREATOR_PRIVATE_KEY;
    if (!privateKey) {
      console.error('Identity creator private key not found in environment variables');
      return json({
        success: false,
        error: 'Server configuration error.'
      }, { status: 500 });
    }

    // Create a provider and wallet
    const provider = new JsonRpcProvider(chainData.rpc_url);
    const wallet = new Wallet(privateKey, provider);

    // Create a contract instance
    const identityContract = new Contract(identityContractAddress, IDENTITY_ABI, wallet);

    // Prepare the parameters for the createIdentity function
    const description = requestData.description || '';
    const identityImage = requestData.identityImage || '';
    const links = requestData.links || [];
    const tags = requestData.tags || [];
    const dob = requestData.dob || 0;
    const dod = requestData.dod || 0;
    const location = requestData.location || '';
    const addresses = requestData.addresses || [];
    const representedBy = requestData.representedBy || '';
    const representedArtists = requestData.representedArtists || '';

    // Call the createIdentity function
    console.log('Creating identity on-chain with parameters:', {
      identityType,
      name,
      description,
      identityImage,
      links,
      tags,
      dob,
      dod,
      location,
      addresses,
      representedBy,
      representedArtists
    });

    // Create the identity on-chain
    const tx = await identityContract.createIdentity(
      identityType,
      name,
      description,
      identityImage,
      links,
      tags,
      dob,
      dod,
      location,
      addresses,
      representedBy,
      representedArtists,
      { gasLimit: 3000000 } // Set a gas limit to avoid transaction failures
    );

    // Wait for the transaction to be mined
    console.log('Transaction sent, waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Get the identity ID from the transaction logs
    let identityId = 0;
    if (receipt && receipt.logs) {
      // Parse the logs to find the IdentityCreated event
      // This is a simplified approach - in production, you'd want to decode the logs properly
      identityId = parseInt(receipt.logs[0].topics[1], 16);
    }

    if (!identityId) {
      console.error('Failed to get identity ID from transaction logs');
      return json({
        success: false,
        error: 'Failed to get identity ID from transaction.'
      }, { status: 500 });
    }

    // Create an entry in the Supabase Identities table
    const now = new Date().toISOString();

    const identityData = {
      id: identityId,
      wallet_address: walletAddress,
      chain_id: chainId,
      name: name,
      description: description,
      identity_image: identityImage,
      links: links,
      tags: tags,
      type: ['artist', 'gallery', 'institution', 'collector'][identityType], // Convert enum to string
      created_at: now,
      updated_at: now
    };

    // Add type-specific fields
    if (identityType === 0) { // Artist
      Object.assign(identityData, {
        dob: dob,
        dod: dod,
        location: location,
        represented_by: representedBy ? JSON.parse(representedBy) : null
      });
    } else if (identityType === 1 || identityType === 2) { // Gallery or Institution
      Object.assign(identityData, {
        addresses: addresses,
        represented_artists: representedArtists ? JSON.parse(representedArtists) : null
      });
    }

    // Insert the identity into the database
    const { data: insertedIdentity, error: insertError } = await supabaseAdmin
      .from('identities')
      .insert(identityData)
      .select();

    if (insertError) {
      console.error('Error inserting identity into database:', insertError);
      return json({
        success: false,
        error: 'Failed to store identity in database.'
      }, { status: 500 });
    }

    // Update the wallet's setup step only and explicitly set setup_completed to false
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({
        // Explicitly setting setup_completed to false as requested
        setup_completed: false,
        setup_step: 4,
        updated_at: now
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.error('Error updating wallet setup status:', updateError);
      // Don't fail the request if this update fails
    }

    return json({
      success: true,
      identityId: identityId,
      transactionHash: receipt.hash,
      message: 'Identity created successfully'
    });
  } catch (error) {
    console.error('Server error in create-identity endpoint:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
};
