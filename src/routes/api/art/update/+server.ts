import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to update an existing ART token
 */
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Parse request data
    const requestData = await request.json();

    // Extract required fields
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

    // Update the token in the database
    const { error: updateError } = await supabaseAdmin
      .from('art_tokens')
      .update({
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
        updated_at: new Date().toISOString(),
        bibliography: requestData.bibliography || null,
        condition_reports: requestData.conditionReports || null,
        exhibition_history: requestData.exhibitionHistory || null,
        keywords: requestData.keywords || null,
        location_collection: requestData.locationCollection || null,
        note: requestData.note || null
        // Do not store transaction_hash in the database
      })
      .eq('contract_address', contractAddress)
      .eq('chain_id', chainId)
      .eq('token_id', tokenId);

    if (updateError) {
      console.error('Error updating token:', updateError);
      return json({
        success: false,
        error: 'Failed to update token in database'
      }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Token updated successfully'
    });
  } catch (error) {
    console.error('Server error updating token:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
