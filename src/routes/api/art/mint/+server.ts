import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import type { Address } from 'viem';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get request data
    const requestData = await request.json();
    console.log('Received ART token mint request:', requestData);

    const {
      contractAddress,
      chainId,
      tokenId,
      walletAddress,
      title,
      description,
      yearOfCreation,
      medium,
      dimensions,
      edition,
      series,
      imageUrl,
      artistStatement,
      status,
      royalties,
      transactionHash
    } = requestData;

    // Validate required fields
    if (!contractAddress || !chainId || !tokenId || !walletAddress || !title || !description || !imageUrl) {
      return json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Record the token in the database
    const { error: insertError } = await supabaseAdmin
      .from('art_tokens')
      .insert({
        contract_address: contractAddress,
        chain_id: chainId,
        token_id: tokenId,
        owner_address: walletAddress,
        title,
        description,
        year_of_creation: yearOfCreation,
        medium,
        dimensions,
        edition,
        series,
        image_url: imageUrl,
        artist_statement: artistStatement,
        status,
        royalties,
        transaction_hash: transactionHash,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error recording token:', insertError);
      return json({
        success: false,
        error: `Failed to record token: ${insertError.message}`
      }, { status: 500 });
    }

    return json({
      success: true,
      tokenId
    });

  } catch (error) {
    console.error('Error in token mint:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
};
