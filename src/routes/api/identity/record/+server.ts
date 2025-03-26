import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import type { CreateIdentityRequest } from '$lib/services/identityService';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData = await request.json() as CreateIdentityRequest & { onChainIdentityId?: number };
    const { walletAddress, identityType, name, chainId, onChainIdentityId } = requestData;

    // Log the on-chain identity ID if provided
    if (onChainIdentityId) {
      console.log('Received on-chain identity ID:', onChainIdentityId);
    }

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
    // Removed transaction hash requirement

    // Extract other fields from the request
    const description = requestData.description || '';
    const identityImage = requestData.identityImage || '';

    // Handle links - ensure it's a proper JSON object for JSONB column
    let links = requestData.links || [];
    // If links is a string, try to parse it as JSON
    if (typeof links === 'string') {
      try {
        links = JSON.parse(links);
      } catch (e) {
        console.error('Error parsing links JSON:', e);
        links = [];
      }
    }

    const tags = requestData.tags || [];
    const dob = requestData.dob || 0;
    const dod = requestData.dod || 0;
    const location = requestData.location || '';

    // Handle addresses - ensure it's a proper JSON object for JSONB column
    let addresses = requestData.addresses || [];
    // If addresses is a string, try to parse it as JSON
    if (typeof addresses === 'string') {
      try {
        addresses = JSON.parse(addresses);
      } catch (e) {
        console.error('Error parsing addresses JSON:', e);
        addresses = [];
      }
    }

    // Handle representation data
    let representedBy = requestData.representedBy || null;
    // If representedBy is a string and not null, try to parse it as JSON
    if (typeof representedBy === 'string' && representedBy) {
      try {
        representedBy = JSON.parse(representedBy);
      } catch (e) {
        console.error('Error parsing representedBy JSON:', e);
        // Keep as string if parsing fails
      }
    }

    let representedArtists = requestData.representedArtists || null;
    // If representedArtists is a string and not null, try to parse it as JSON
    if (typeof representedArtists === 'string' && representedArtists) {
      try {
        representedArtists = JSON.parse(representedArtists);
      } catch (e) {
        console.error('Error parsing representedArtists JSON:', e);
        // Keep as string if parsing fails
      }
    }

    // Create an entry in the Supabase Identities table
    const now = new Date().toISOString();

    const identityData = {
      wallet_address: walletAddress,
      chain_id: chainId,
      name: name,
      description: description,
      identity_image: identityImage,
      links: links,
      tags: tags,
      type: ['artist', 'gallery', 'institution', 'collector', 'custodian'][identityType], // Convert enum to string
      created_at: now,
      updated_at: now,
      // Always include an id field, using onChainIdentityId if available or a temporary value
      id: typeof onChainIdentityId === 'number' && onChainIdentityId > 0 ? onChainIdentityId : 0
    };

    // Add type-specific fields
    if (identityType === 0) { // Artist
      Object.assign(identityData, {
        dob: dob,
        dod: dod,
        location: location,
        represented_by: representedBy
      });
    } else if (identityType === 1 || identityType === 2) { // Gallery or Institution
      Object.assign(identityData, {
        addresses: addresses,
        represented_artists: representedArtists
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

    // Update the wallet's setup step and set setup_completed to true
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({
        // Set setup_completed to true right away
        setup_completed: true,
        setup_step: 4,
        updated_at: now
      })
      .eq('wallet_address', walletAddress);

    if (updateError) {
      console.error('Error updating wallet setup status:', updateError);
      // Don't fail the request if this update fails
    } else {
      console.log('Wallet setup marked as completed for wallet:', walletAddress);
    }

    // Return the identity ID
    const returnedIdentityId = onChainIdentityId || insertedIdentity?.[0]?.id || 0;

    return json({
      success: true,
      identityId: returnedIdentityId,
      message: 'Identity recorded successfully'
    });
  } catch (error) {
    console.error('Server error creating identity record:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
};
