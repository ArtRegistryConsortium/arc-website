import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createPaymentCheckLoader } from '../check-payment';

export const load: PageServerLoad = async (event) => {
  try {
    // First check if payment is completed
    await createPaymentCheckLoader()(event);

    // If payment check passes, redirect to the new route
    throw redirect(301, '/activate/identity-data');
  } catch (error) {
    // If the error is a redirect to the payment page, let it pass through
    if (error instanceof Response && error.status === 302 && error.headers.get('location') === '/activate') {
      throw error;
    }

    // Otherwise, redirect to the new route
    throw redirect(301, '/activate/identity-data');
  }
};
