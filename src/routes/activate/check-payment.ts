import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * Shared function to check if a user has paid the fee before allowing access to activation steps
 * @returns A function that can be used as a PageServerLoad handler
 */
export function createPaymentCheckLoader(): PageServerLoad {
  return async ({ request, cookies, url }) => {
    try {
      // Get the wallet address from cookies
      const walletAddress = cookies.get('wallet_address');

      if (!walletAddress) {
        console.log('No wallet address found in cookies, redirecting to payment step');
        throw redirect(302, '/activate');
      }

      // Check if the wallet has paid the fee
      const { data, error } = await supabaseAdmin
        .from('wallets')
        .select('fee_paid')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.error('Error checking wallet fee status:', error);
        throw redirect(302, '/activate');
      }

      // If fee is not paid, redirect to payment step
      if (!data.fee_paid) {
        console.log('Fee not paid for wallet, redirecting to payment step');
        throw redirect(302, '/activate');
      }

      // Fee is paid, allow access to the page
      return {};
    } catch (error) {
      if (error instanceof Response) {
        // This is a redirect, let it pass through
        throw error;
      }

      console.error('Error in payment check loader:', error);
      throw redirect(302, '/activate');
    }
  };
}
