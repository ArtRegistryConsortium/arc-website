import { redirect } from '@sveltejs/kit';

export function fallback() {
  // This function handles requests that don't match any other route
  // Redirect to the work-in-progress page
  throw redirect(302, '/work-in-progress');
} 