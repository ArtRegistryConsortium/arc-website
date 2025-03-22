import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: LayoutServerLoad = async ({ request, cookies }) => {
  try {
    // Get the wallet address from cookies
    const walletAddress = cookies.get('wallet_address');
    
    if (!walletAddress) {
      // If no wallet address, allow access to the activate page
      // The client-side code will handle showing the wallet connection UI
      return {};
    }
    
    // Check if the wallet setup is completed
    const { data, error } = await supabaseAdmin
      .from('wallets')
      .select('setup_completed')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      console.error('Error checking wallet setup status:', error);
      // If there's an error, allow access and let client-side handle it
      return {};
    }
    
    // If setup is completed, redirect to dashboard
    if (data && data.setup_completed) {
      console.log('Wallet setup is already completed, redirecting to dashboard');
      throw redirect(302, '/dashboard');
    }
    
    // Otherwise, allow access to the activate pages
    return {};
  } catch (error) {
    if (error instanceof Response) {
      // This is a redirect, let it pass through
      throw error;
    }
    
    console.error('Error in activate layout server load:', error);
    // If there's an unexpected error, allow access and let client-side handle it
    return {};
  }
};
