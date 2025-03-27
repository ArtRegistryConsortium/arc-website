import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ params }) => {
  try {
    const identityId = parseInt(params.id);
    const chainId = parseInt(params.chainId);

    console.log('Server-side loading registry identity with ID:', identityId, 'and Chain ID:', chainId);

    console.log('Fetching identity with ID:', identityId, 'and Chain ID:', chainId);

    // Fetch the identity from the database
    const { data: identity, error: identityError } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('id', identityId)
      .eq('chain_id', chainId)
      .single();

    console.log('Identity data from database:', identity);

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

    const chainInfo = chainError ? null : {
      name: chain.name || `Chain ${chainId}`,
      icon_url: chain.icon_url || null
    };

    // Process the identity data to ensure proper format
    const processedIdentity = identity ? {
      ...identity,
      // Convert date fields to proper format if needed
      dob: identity.dob,
      dod: identity.dod,
      // Ensure JSON fields are parsed
      links: typeof identity.links === 'string' ? JSON.parse(identity.links || '[]') : identity.links,
      tags: typeof identity.tags === 'string' ? JSON.parse(identity.tags || '[]') : identity.tags,
      addresses: typeof identity.addresses === 'string' ? JSON.parse(identity.addresses || '[]') : identity.addresses,
      represented_artists: typeof identity.represented_artists === 'string' ?
        JSON.parse(identity.represented_artists || '[]') : identity.represented_artists
    } : null;

    console.log('Processed identity data:', processedIdentity);

    return {
      identity: processedIdentity,
      chainInfo
    };
  } catch (err) {
    console.error('Server error loading identity details:', err);
    throw error(500, 'Failed to load identity details');
  }
};
