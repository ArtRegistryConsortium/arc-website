import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  // Skip the root layout for the verify-wallet page
  if (url.pathname === '/verify-wallet') {
    return {
      skipLayout: true
    };
  }
  
  return {};
} 