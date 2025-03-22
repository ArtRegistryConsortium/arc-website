import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: LayoutServerLoad = async ({ request, cookies }) => {
  try {
    // Get the wallet address from cookies
    const walletAddress = cookies.get('wallet_address');
    
    if (!walletAddress) {
      console.log('No wallet address found in cookies, redirecting to home');
      throw redirect(302, '/');
    }
    
    // Check if the wallet setup is completed
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('setup_completed')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      console.error('Error checking wallet setup status:', error);
      throw redirect(302, '/');
    }
    
    // If setup is not completed, redirect to home
    if (!data || !data.setup_completed) {
      console.log('Wallet setup is not completed, redirecting to home');
      throw redirect(302, '/');
    }
    
    // If we get here, the user is authenticated and setup is completed
    console.log('User authenticated and setup completed, allowing access to dashboard');
    
    // Return the wallet address for use in the layout
    return {
      walletAddress
    };
  } catch (error) {
    if (error instanceof Response) {
      // This is a redirect, let it pass through
      throw error;
    }
    
    console.error('Error in dashboard layout server load:', error);
    // For any other error, redirect to home
    throw redirect(302, '/');
  }
};
