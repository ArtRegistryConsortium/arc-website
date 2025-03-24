import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

export const GET: RequestHandler = async () => {
  try {
    // Check if the table already exists
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('art_contracts')
      .select('*')
      .limit(1);

    if (!checkError) {
      return json({
        success: true,
        message: 'Table art_contracts already exists'
      });
    }

    // Create the art_contracts table
    const { error: createError } = await supabaseAdmin.rpc('create_art_contracts_table');

    if (createError) {
      console.error('Error creating art_contracts table:', createError);
      return json({
        success: false,
        error: 'Failed to create art_contracts table'
      }, { status: 500 });
    }

    return json({
      success: true,
      message: 'Table art_contracts created successfully'
    });
  } catch (error) {
    console.error('Server error creating art_contracts table:', error);
    return json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
};

// SQL function to create the art_contracts table
// This should be created in the Supabase SQL editor:
/*
CREATE OR REPLACE FUNCTION create_art_contracts_table()
RETURNS void AS $$
BEGIN
  -- Create the art_contracts table
  CREATE TABLE IF NOT EXISTS art_contracts (
    id SERIAL PRIMARY KEY,
    contract_address TEXT NOT NULL,
    identity_id INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_address, chain_id)
  );

  -- Add foreign key constraint to identities table
  ALTER TABLE art_contracts
    ADD CONSTRAINT fk_art_contracts_identities
    FOREIGN KEY (identity_id, chain_id)
    REFERENCES identities(id, chain_id)
    ON DELETE CASCADE;

  -- Add foreign key constraint to chains table
  ALTER TABLE art_contracts
    ADD CONSTRAINT fk_art_contracts_chains
    FOREIGN KEY (chain_id)
    REFERENCES chains(chain_id)
    ON DELETE CASCADE;

  -- No need for updated_at trigger as we're not using that column
END;
$$ LANGUAGE plpgsql;
*/
