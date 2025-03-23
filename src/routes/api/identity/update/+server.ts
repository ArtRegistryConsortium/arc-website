import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider, Contract, Wallet } from 'ethers';
import { env } from '$env/dynamic/private';
import type { UpdateIdentityRequest } from '$lib/services/identityService';

// ABI for the Identity contract's updateIdentity function
const IDENTITY_ABI = [
  "function updateIdentity(uint256 identityId, uint8 identityType, string name, string description, string identityImage, string links, string[] tags, uint256 dob, uint256 dod, string location, string addresses, string representedBy, string representedArtists) external"
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

    // Map the identity type to the enum value
    let identityType = 0; // Default to Artist (0)
    switch (identityData.type) {
      case 'artist':
        identityType = 0;
        break;
      case 'gallery':
        identityType = 1;
        break;
      case 'institution':
        identityType = 2;
        break;
      case 'collector':
        identityType = 3;
        break;
    }

    // Call the updateIdentity function
    console.log('Updating identity on-chain with parameters:', {
      identityId,
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

    // Update the identity on-chain
    const tx = await identityContract.updateIdentity(
      identityId,
      identityType,
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

    // Map the numeric identity type back to a string for the database
    let typeString = 'artist';
    switch (identityType) {
      case 0:
        typeString = 'artist';
        break;
      case 1:
        typeString = 'gallery';
        break;
      case 2:
        typeString = 'institution';
        break;
      case 3:
        typeString = 'collector';
        break;
    }

    const updateData = {
      name: name,
      description: description,
      identity_image: identityImage,
      links: links,
      tags: tags,
      type: typeString, // Update the identity type in the database
      updated_at: now
    };

    // Add type-specific fields based on the new identity type
    if (typeString === 'artist') {
      Object.assign(updateData, {
        dob: dob,
        dod: dod,
        location: location,
        represented_by: representedBy ? JSON.parse(representedBy) : null,
        // Clear non-Artist fields
        addresses: null,
        represented_artists: null
      });
    } else if (typeString === 'gallery' || typeString === 'institution') {
      Object.assign(updateData, {
        addresses: addresses,
        represented_artists: representedArtists ? JSON.parse(representedArtists) : null,
        // Clear Artist fields
        dob: null,
        dod: null,
        location: null,
        represented_by: null
      });
    } else if (typeString === 'collector') {
      Object.assign(updateData, {
        // Clear all type-specific fields
        dob: null,
        dod: null,
        location: null,
        represented_by: null,
        addresses: null,
        represented_artists: null
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
