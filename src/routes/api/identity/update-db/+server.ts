import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const POST: RequestHandler = async ({ request }) => {
  try {

    // Get request data
    const requestData = await request.json();
    console.log('Received update request data:', requestData);

    const {
      identityId,
      walletAddress,
      identityType, // Add identityType
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
      chainId,
      transactionHash
    } = requestData;

    // Validate required fields
    if (!identityId || !walletAddress || !name) {
      return json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    console.log('Updating identity in database:', identityId);

    // Prepare the data for update
    const updateData: {
      name: string;
      description: string;
      identity_image: string;
      links: string;
      tags: any[];
      type?: string; // Add type field
      dob: number | null;
      dod: number | null;
      location: string;
      addresses: string;
      represented_by: string;
      represented_artists: string;
      updated_at: string;
    } = {
      name,
      description: description || '',
      identity_image: identityImage || '',
      links: typeof links === 'string' ? links : JSON.stringify(links),
      tags: Array.isArray(tags) ? tags : [],
      dob: dob ? new Date(dob).getTime() : null,
      dod: dod ? Number(dod) : null,
      location: location || '',
      addresses: typeof addresses === 'string' ? addresses : JSON.stringify(addresses),
      represented_by: representedBy || '',
      represented_artists: representedArtists || '',
      updated_at: new Date().toISOString()
    };

    // Map the numeric identity type to a string and add it to the update data
    if (identityType !== undefined) {
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
      updateData.type = typeString;
    }

    console.log('Update data:', updateData);

    // Update the identity in the database
    const { data, error } = await supabaseAdmin
      .from('identities')
      .update(updateData)
      .eq('id', identityId)
      .eq('wallet_address', walletAddress)
      .eq('chain_id', chainId);

    if (error) {
      console.error('Error updating identity in database:', error);
      return json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Identity updated in database successfully'
    });
  } catch (error) {
    console.error('Error in update-db endpoint:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }, { status: 500 });
  }
};
