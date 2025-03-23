import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider, Contract, Wallet } from 'ethers';
import { env } from '$env/dynamic/private';
import type { UpdateIdentityRequest } from '$lib/services/identityService';

// ABI for the Identity contract's updateIdentity function
const IDENTITY_ABI = [
  "function updateIdentity(uint256 identityId, string name, string description, string identityImage, string links, string[] tags, uint256 dob, uint256 dod, string location, string addresses, string representedBy, string representedArtists) external"
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData = await request.json() as UpdateIdentityRequest;
    const { walletAddress, identityId, name, chainId } = requestData;

    // Validate required fields
    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }
    if (!identityId) {
      return json({ success: false, error: 'Identity ID is required' }, { status: 400 });
    }
    if (!name) {
      return json({ success: false, error: 'Name is required' }, { status: 400 });
    }
    if (!chainId) {
      return json({ success: false, error: 'Chain ID is required' }, { status: 400 });
    }

    // Get the contract address for the specified chain
    const { data: contractData, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('identity_contract_address, rpc_url')
      .eq('chain_id', chainId)
      .single();

    if (contractError || !contractData) {
      console.error('Error fetching contract address:', contractError);
      return json({
        success: false,
        error: 'Failed to fetch contract address for the specified chain.'
      }, { status: 500 });
    }

    // Get the private key from environment variables
    const privateKey = env.CONTRACT_PRIVATE_KEY;
    if (!privateKey) {
      return json({
        success: false,
        error: 'Contract private key not found in environment variables.'
      }, { status: 500 });
    }

    // Create a provider and wallet
    const provider = new JsonRpcProvider(contractData.rpc_url);
    const wallet = new Wallet(privateKey, provider);

    // Create a contract instance
    const identityContract = new Contract(contractData.identity_contract_address, IDENTITY_ABI, wallet);

    // Prepare the parameters for the updateIdentity function
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

    // Call the updateIdentity function
    console.log('Updating identity on-chain with parameters:', {
      identityId,
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

    // Update the identity on-chain
    const tx = await identityContract.updateIdentity(
      identityId,
      name,
      description,
      identityImage,
      JSON.stringify(links),
      tags,
      dob,
      dod,
      location,
      JSON.stringify(addresses),
      representedBy,
      representedArtists,
      { gasLimit: 3000000 } // Set a gas limit to avoid transaction failures
    );

    // Wait for the transaction to be mined
    console.log('Transaction sent, waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt);

    // Update the entry in the Supabase Identities table
    const now = new Date().toISOString();

    // Get the identity type from the database
    const { data: identityData, error: identityError } = await supabaseAdmin
      .from('identities')
      .select('type')
      .eq('id', identityId)
      .eq('wallet_address', walletAddress)
      .single();

    if (identityError || !identityData) {
      console.error('Error fetching identity type:', identityError);
      return json({
        success: false,
        error: 'Failed to fetch identity type from database.'
      }, { status: 500 });
    }

    const updateData = {
      name: name,
      description: description,
      identity_image: identityImage,
      links: links,
      tags: tags,
      updated_at: now
    };

    // Add type-specific fields
    if (identityData.type === 'artist') {
      Object.assign(updateData, {
        dob: dob,
        dod: dod,
        location: location,
        represented_by: representedBy ? JSON.parse(representedBy) : null
      });
    } else if (identityData.type === 'gallery' || identityData.type === 'institution') {
      Object.assign(updateData, {
        addresses: addresses,
        represented_artists: representedArtists ? JSON.parse(representedArtists) : null
      });
    }

    // Update the identity in the database
    const { data: updatedIdentity, error: updateError } = await supabaseAdmin
      .from('identities')
      .update(updateData)
      .eq('id', identityId)
      .eq('wallet_address', walletAddress)
      .select();

    if (updateError) {
      console.error('Error updating identity in database:', updateError);
      return json({
        success: false,
        error: 'Failed to update identity in database.'
      }, { status: 500 });
    }

    return json({
      success: true,
      identityId: identityId,
      transactionHash: receipt.hash,
      message: 'Identity updated successfully'
    });
  } catch (error) {
    console.error('Error updating identity:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating identity'
    }, { status: 500 });
  }
};
