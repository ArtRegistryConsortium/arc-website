import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabaseDB';
import { env } from '$env/dynamic/private';

// Create a Supabase client with the service key for server-side operations
// This client has admin privileges and should ONLY be used in server-side code
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);
