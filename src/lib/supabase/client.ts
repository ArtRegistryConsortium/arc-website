import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabaseDB';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Create a Supabase client with the anon key for client-side operations
// This client has limited privileges and is safe to use in browser code
export const supabaseClient = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    },
    db: {
      schema: 'public'
    }
  }
);
