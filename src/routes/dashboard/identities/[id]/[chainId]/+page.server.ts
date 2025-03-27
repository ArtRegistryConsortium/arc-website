import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const identityId = parseInt(params.id);
    const chainId = parseInt(params.chainId);
    
    console.log('Server-side loading identity with ID:', identityId, 'and Chain ID:', chainId);
    
    // Fetch the identity from the database
    const { data: identity, error: identityError } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('id', identityId)
      .eq('chain_id', chainId)
      .single();
    
    if (identityError) {
      console.error('Error fetching identity:', identityError);
      throw error(404, 'Identity not found');
    }
    
    // Fetch chain information
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('id', chainId)
      .single();
    
    if (chainError) {
      console.warn('Error fetching chain info:', chainError);
      // Continue without chain info, don't throw error
    }
    
    // Create chain info even if there was an error, providing defaults
    const chainInfo = {
      name: chain?.name || `Chain ${chainId}`,
      icon_url: chain?.icon_url || null,
      id: chainId
    };
    
    // Ensure identity fields are properly structured
    const processedIdentity = {
      ...identity,
      links: Array.isArray(identity.links) ? identity.links : [],
      tags: Array.isArray(identity.tags) ? identity.tags : [],
      addresses: Array.isArray(identity.addresses) ? identity.addresses : [],
      represented_artists: Array.isArray(identity.represented_artists) ? identity.represented_artists : [],
      // Ensure type is one of the expected values or set to "Other"
      type: ['Artist', 'Gallery', 'Institution', 'Collector', 'Custodian', 'Other'].includes(identity.type)
        ? identity.type
        : identity.type || 'Other'
    };
    
    console.log('Processed identity:', JSON.stringify(processedIdentity, null, 2));
    
    return {
      identity: processedIdentity,
      chainInfo
    };
  } catch (err) {
    console.error('Server error loading identity details:', err);
    throw error(500, 'Failed to load identity details');
  }
};
