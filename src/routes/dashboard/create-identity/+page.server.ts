import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ cookies }) => {
  console.log('Server: Loading create-identity page');
  // Get the wallet address from cookies
  const walletAddress = cookies.get('wallet_address');
  console.log('Server: Wallet address from cookies:', walletAddress);

  // If no wallet address, redirect to home
  if (!walletAddress) {
    throw redirect(302, '/');
  }

  // Check if the wallet exists and setup is completed
  const { data: walletData, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('setup_completed, fee_paid')
    .eq('wallet_address', walletAddress)
    .single();

  // If there's an error or the wallet doesn't exist, redirect to home
  if (walletError || !walletData) {
    console.error('Error fetching wallet data or wallet not found:', walletError);
    throw redirect(302, '/');
  }

  // If setup is not completed or fee is not paid, redirect to activate
  if (!walletData.setup_completed || !walletData.fee_paid) {
    console.log('Wallet setup not completed or fee not paid, redirecting to activate');
    throw redirect(302, '/activate');
  }

  // Return the wallet address for the page
  console.log('Server: Returning wallet address for page');
  return {
    walletAddress
  };
};
