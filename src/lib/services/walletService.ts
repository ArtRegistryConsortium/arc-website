import { supabase, isSupabaseConfigured } from '$lib/supabase/client';
import type { Address } from 'viem';

/**
 * Check if a wallet exists in the database
 * @param walletAddress The wallet address to check
 * @returns True if the wallet exists, false otherwise
 */
export async function checkWalletExists(walletAddress: Address): Promise<boolean> {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. Skipping wallet existence check.');
    return false; // Assume wallet doesn't exist to trigger creation attempt
  }

  try {
    console.log('Checking if wallet exists:', walletAddress);

    const { data, error } = await supabase
      .from('wallets')
      .select('wallet_address')
      .eq('wallet_address', walletAddress as string)
      .single();

    console.log('Wallet existence check result:', data, error ? `Error: ${error.message}` : 'No error');

    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 means no rows returned, which means the wallet doesn't exist
        console.log('Wallet does not exist in database');
        return false;
      }
      console.error('Error checking wallet existence:', error.message);
      console.error('Error details:', error);
      throw error;
    }

    console.log('Wallet exists in database:', !!data);
    return !!data;
  } catch (error) {
    console.error('Failed to check wallet existence:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Create a new wallet entry in the database
 * @param walletAddress The wallet address to create
 * @returns True if the wallet was created successfully, false otherwise
 */
export async function createWalletEntry(walletAddress: Address): Promise<boolean> {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. Skipping wallet creation.');
    return true; // Return true to not block the authentication flow
  }

  try {
    console.log('Creating wallet entry for address:', walletAddress);
    const now = new Date().toISOString();

    // Create the wallet entry data
    const walletData = {
      wallet_address: walletAddress as string,
      created_at: now,
      updated_at: now,
      last_login: now,
      fee_paid: false,
      setup_completed: false,
      setup_step: 0
    };

    console.log('Wallet data to insert:', JSON.stringify(walletData));

    // First, let's check if we can access the wallets table at all
    const { data: testData, error: testError } = await supabase
      .from('wallets')
      .select('wallet_address')
      .limit(1);

    console.log('Test query result:', testData, testError ? `Error: ${testError.message}` : 'No error');

    // Insert the wallet entry
    console.log('Attempting to insert wallet entry...');
    const { data, error, status } = await supabase
      .from('wallets')
      .insert(walletData)
      .select();

    console.log('Supabase insert response status:', status);
    console.log('Supabase insert response data:', data);

    if (error) {
      console.error('Error creating wallet entry:', error.message);
      console.error('Error details:', error);
      throw error;
    }

    console.log('Wallet entry created successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to create wallet entry:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Update the last login time for a wallet
 * @param walletAddress The wallet address to update
 * @returns True if the wallet was updated successfully, false otherwise
 */
export async function updateWalletLastLogin(walletAddress: Address): Promise<boolean> {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. Skipping wallet last login update.');
    return true; // Return true to not block the authentication flow
  }

  try {
    console.log('Updating wallet last login for:', walletAddress);
    const now = new Date().toISOString();

    const updateData = {
      last_login: now,
      updated_at: now
    };

    console.log('Update data:', updateData);

    const { data, error, status } = await supabase
      .from('wallets')
      .update(updateData)
      .eq('wallet_address', walletAddress as string)
      .select();

    console.log('Update response status:', status);
    console.log('Update response data:', data);

    if (error) {
      console.error('Error updating wallet last login:', error.message);
      console.error('Error details:', error);
      throw error;
    }

    console.log('Wallet last login updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update wallet last login:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Check if a wallet exists and create it if it doesn't
 * @param walletAddress The wallet address to check/create
 * @returns True if the wallet exists or was created successfully, false otherwise
 */
export async function ensureWalletExists(walletAddress: Address): Promise<boolean> {
  // Check if Supabase is properly configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase is not properly configured. Skipping wallet database operations.');
    return true; // Return true to not block the authentication flow
  }

  try {
    // Check if the wallet exists
    const exists = await checkWalletExists(walletAddress);

    if (!exists) {
      return await createWalletEntry(walletAddress);
    }

    // Update the last login time
    return await updateWalletLastLogin(walletAddress);
  } catch (error) {
    console.error('Failed to ensure wallet exists:', error);
    return false;
  }
}
