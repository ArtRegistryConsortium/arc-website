import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch all identities for the registry
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const offset = (page - 1) * pageSize;
    
    // Get filter parameters
    const type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const chainId = url.searchParams.get('chainId');
    
    // Build the query
    let query = supabaseAdmin
      .from('identities')
      .select(`
        *,
        chains(name, icon_url)
      `, { count: 'exact' });
    
    // Apply filters if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    if (chainId) {
      query = query.eq('chain_id', parseInt(chainId));
    }
    
    // Apply pagination
    const { data: identities, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error('Error fetching identities:', error);
      return json({
        success: false,
        error: 'Failed to fetch identities'
      }, { status: 500 });
    }
    
    return json({
      success: true,
      identities: identities || [],
      pagination: {
        page,
        pageSize,
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0
      }
    });
  } catch (error) {
    console.error('Server error fetching identities:', error);
    return json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
};
