import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabaseDB';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Log Supabase configuration status
console.log('Supabase client initialized with URL:', supabaseUrl ? 'Valid URL' : 'Missing URL');
console.log('Supabase client initialized with key:', supabaseAnonKey ? 'Valid key' : 'Missing key');

// Export a function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const isConfigured = (
    supabaseUrl !== '' &&
    supabaseAnonKey !== '' &&
    supabaseUrl !== undefined &&
    supabaseAnonKey !== undefined
  );

  console.log('Supabase configuration check:', isConfigured ? 'Configured' : 'Not configured');
  if (!isConfigured) {
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
    console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set');
  }

  return isConfigured;
}

// Test the Supabase connection
export async function testSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase is not properly configured');
    return false;
  }

  try {
    // Try to get the database schema
    const { data, error } = await supabase.from('wallets').select('wallet_address').limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error.message);
      console.error('Error details:', error);
      return false;
    }

    console.log('Supabase connection test successful');
    console.log('Test query result:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

// Run the connection test immediately
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.addEventListener('load', () => {
    console.log('Testing Supabase connection...');
    testSupabaseConnection().then(success => {
      if (success) {
        console.log('Supabase is properly configured and connected');
      } else {
        console.warn('Supabase connection test failed - check your configuration');
      }
    });
  });
}
