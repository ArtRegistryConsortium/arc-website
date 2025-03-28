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
      title,
      description,
      yearOfCreation,
      medium,
      dimensions,
      edition,
      series,
      imageUrl,
      tokenUri,
      royalties
    } = requestData;

    // Validate required fields
    if (!contractAddress || !chainId || !tokenId || !title || !description || !imageUrl || !tokenUri) {
      return json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // No status conversion needed as we're not using status anymore

    // Record the token in the database
    const { error: insertError } = await supabaseAdmin
      .from('art_tokens')
      .insert({
        contract_address: contractAddress,
        chain_id: chainId,
        token_id: tokenId,
        title,
        description,
        year: yearOfCreation,
        medium,
        dimensions,
        edition,
        series,
        image_url: imageUrl,
        token_uri: tokenUri,
        royalties,
        created_at: new Date().toISOString(),
        bibliography: requestData.bibliography || null,
        condition_reports: requestData.conditionReports || null,
        exhibition_history: requestData.exhibitionHistory || null,
        keywords: requestData.keywords || null,
        location_collection: requestData.locationCollection || null,
        note: requestData.note || null
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
