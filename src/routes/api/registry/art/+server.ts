import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch all ART tokens for the registry
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const offset = (page - 1) * pageSize;

    // Get filter parameters
    const search = url.searchParams.get('search');
    const chainId = url.searchParams.get('chainId');
    const contractAddress = url.searchParams.get('contractAddress');

    // Build the query
    let query = supabaseAdmin
      .from('art_tokens')
      .select(`
        *,
        art_contracts(
          contract_address,
          identity_id,
          chain_id,
          identities(
            name,
            type,
            identity_image
          )
        )
      `, { count: 'exact' });

    // Apply filters if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (chainId) {
      query = query.eq('chain_id', parseInt(chainId));
    }

    if (contractAddress) {
      query = query.eq('contract_address', contractAddress);
    }

    // Apply pagination
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    // Create a mutable copy of the data
    let artTokens = data;

    if (error) {
      console.error('Error fetching ART tokens:', error);
      return json({
        success: false,
        error: 'Failed to fetch ART tokens'
      }, { status: 500 });
    }

    // Process the tokens to ensure all required fields are present
    if (artTokens && artTokens.length > 0) {
      console.log('First ART token before processing:', JSON.stringify(artTokens[0], null, 2));

      // Create a new array with processed tokens
      artTokens = artTokens.map(token => {
        // Create a new object with default values
        return {
          ...token,
          // Ensure chain_id is always present
          chain_id: token.chain_id ||
                   (token.art_contracts && token.art_contracts.length > 0 ? token.art_contracts[0].chain_id : 0),
          // Ensure year is a number or null
          year: token.year ? Number(token.year) || null : null,
          // Ensure title is present
          title: token.title || 'Untitled',
          // Ensure description is present
          description: token.description || 'No description available'
        };
      });

      console.log('First ART token after processing:', JSON.stringify(artTokens[0], null, 2));
    }

    return json({
      success: true,
      artTokens: artTokens || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      }
    });
  } catch (error) {
    console.error('Server error fetching ART tokens:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
