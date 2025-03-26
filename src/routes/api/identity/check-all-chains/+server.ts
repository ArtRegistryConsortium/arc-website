import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { env } from '$env/dynamic/private';
import { JsonRpcProvider, Contract } from 'ethers';

// ABI for the Identity contract's getIdentityByAddress function
const IDENTITY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "walletAddress",
        "type": "address"
      }
    ],
    "name": "getIdentityByAddress",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "uint8", "name": "identityType", "type": "uint8" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "identityImage", "type": "string" },
          { "internalType": "string", "name": "links", "type": "string" },
          { "internalType": "string[]", "name": "tags", "type": "string[]" },
          { "internalType": "uint256", "name": "dob", "type": "uint256" },
          { "internalType": "uint256", "name": "dod", "type": "uint256" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "addresses", "type": "string" },
          { "internalType": "string", "name": "representedBy", "type": "string" },
          { "internalType": "string", "name": "representedArtists", "type": "string" }
        ],
        "internalType": "struct IIdentity.Identity",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Map identity type from number to string
function mapIdentityTypeToString(typeNum: number): string {
  const types = ['artist', 'gallery', 'institution', 'collector', 'custodian'];
  return types[typeNum] || 'collector'; // Default to collector if unknown
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return json({ success: false, error: 'Wallet address is required' }, { status: 400 });
    }

    // Get all active chains
    const { data: chains, error: chainsError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('is_active', true);

    if (chainsError) {
      console.error('Error fetching active chains:', chainsError);
      return json({ success: false, error: 'Failed to fetch active chains' }, { status: 500 });
    }

    if (!chains || chains.length === 0) {
      return json({ success: true, message: 'No active chains found', identitiesFound: 0 });
    }

    console.log(`Checking for identities on ${chains.length} active chains for wallet ${walletAddress}`);

    const foundIdentities = [];
    const now = new Date().toISOString();

    // Check each chain for identities
    for (const chain of chains) {
      try {
        // Get the identity contract address for this chain
        const { data: contractData, error: contractError } = await supabaseAdmin
          .from('contracts')
          .select('identity_contract_address')
          .eq('chain_id', chain.chain_id)
          .single();

        if (contractError || !contractData?.identity_contract_address) {
          console.log(`No identity contract found for chain ${chain.chain_id}, skipping`);
          continue;
        }

        const identityContractAddress = contractData.identity_contract_address;

        // Check if identity already exists in database for this chain
        const { data: existingIdentity, error: existingIdentityError } = await supabaseAdmin
          .from('identities')
          .select('id, name')
          .eq('wallet_address', walletAddress)
          .eq('chain_id', chain.chain_id)
          .maybeSingle();

        if (existingIdentity) {
          console.log(`Identity already exists in database for chain ${chain.chain_id}, adding to found identities list`);
          // Add to found identities list even if it already exists in the database
          // This ensures we properly redirect users who already have identities
          foundIdentities.push({
            chain_id: chain.chain_id,
            chain_name: chain.name,
            identity_id: existingIdentity.id,
            name: existingIdentity.name
          });
          continue;
        }

        // Create provider and contract instance
        const provider = new JsonRpcProvider(chain.rpc_url);
        const identityContract = new Contract(identityContractAddress, IDENTITY_ABI, provider);

        // Try to get identity from blockchain
        try {
          console.log(`Checking for identity on chain ${chain.chain_id} at contract ${identityContractAddress}`);
          const onChainIdentity = await identityContract.getIdentityByAddress(walletAddress);

          if (onChainIdentity && onChainIdentity.id > 0) {
            console.log(`Found identity on chain ${chain.chain_id} with ID ${onChainIdentity.id}`);

            // Convert on-chain identity to database format
            const identityData = {
              id: Number(onChainIdentity.id),
              wallet_address: walletAddress,
              chain_id: chain.chain_id,
              name: onChainIdentity.name,
              description: onChainIdentity.description,
              identity_image: onChainIdentity.identityImage,
              links: onChainIdentity.links,
              tags: onChainIdentity.tags,
              type: mapIdentityTypeToString(Number(onChainIdentity.identityType)),
              created_at: now,
              updated_at: now
            };

            // Add type-specific fields
            if (Number(onChainIdentity.identityType) === 0) { // Artist
              Object.assign(identityData, {
                dob: Number(onChainIdentity.dob) > 0 ? Number(onChainIdentity.dob) : null,
                dod: Number(onChainIdentity.dod) > 0 ? Number(onChainIdentity.dod) : null,
                location: onChainIdentity.location || null,
                represented_by: onChainIdentity.representedBy || null
              });
            } else if (Number(onChainIdentity.identityType) === 1 || Number(onChainIdentity.identityType) === 2) { // Gallery or Institution
              Object.assign(identityData, {
                addresses: onChainIdentity.addresses || null,
                represented_artists: onChainIdentity.representedArtists || null
              });
            }

            // Insert the identity into the database
            const { data: insertedIdentity, error: insertError } = await supabaseAdmin
              .from('identities')
              .insert(identityData)
              .select();

            if (insertError) {
              console.error(`Error inserting identity for chain ${chain.chain_id}:`, insertError);
            } else {
              console.log(`Successfully added identity for chain ${chain.chain_id} to database`);
              foundIdentities.push({
                chain_id: chain.chain_id,
                chain_name: chain.name,
                identity_id: Number(onChainIdentity.id),
                name: onChainIdentity.name
              });
            }
          }
        } catch (error) {
          // This is expected if the user doesn't have an identity on this chain
          console.log(`No identity found on chain ${chain.chain_id} or error occurred:`, error);
        }
      } catch (error) {
        console.error(`Error checking chain ${chain.chain_id}:`, error);
      }
    }

    // If identities were found, update the wallet's setup status to completed
    if (foundIdentities.length > 0) {
      // First check if the wallet exists
      const { data: walletData, error: walletError } = await supabaseAdmin
        .from('wallets')
        .select('setup_completed')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (walletError) {
        console.error('Error checking wallet existence:', walletError);
      } else if (!walletData) {
        // Wallet doesn't exist, create it
        console.log(`Wallet ${walletAddress} doesn't exist, creating it with setup_completed=true`);
        const { error: insertError } = await supabaseAdmin
          .from('wallets')
          .insert({
            wallet_address: walletAddress,
            setup_completed: true,
            setup_step: 4, // Set to final step
            fee_paid: true, // Mark fee as paid since we found identities
            created_at: now,
            updated_at: now
          });

        if (insertError) {
          console.error('Error creating wallet:', insertError);
        } else {
          console.log(`Created wallet ${walletAddress} with setup_completed=true`);
        }
      } else if (!walletData.setup_completed) {
        // Wallet exists but setup not completed, update it
        console.log(`Updating wallet ${walletAddress} setup status to completed`);
        const { error: updateError } = await supabaseAdmin
          .from('wallets')
          .update({
            setup_completed: true,
            setup_step: 4, // Set to final step
            fee_paid: true, // Ensure fee is marked as paid
            updated_at: now
          })
          .eq('wallet_address', walletAddress);

        if (updateError) {
          console.error('Error updating wallet setup status:', updateError);
        } else {
          console.log(`Updated wallet ${walletAddress} setup status to completed`);
        }
      } else {
        console.log(`Wallet ${walletAddress} already has setup_completed=true, no update needed`);
      }
    }

    return json({
      success: true,
      identitiesFound: foundIdentities.length,
      identities: foundIdentities
    });
  } catch (error) {
    console.error('Server error checking identities on all chains:', error);
    return json({ success: false, error: 'Server error' }, { status: 500 });
  }
};
