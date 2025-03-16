import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
  // Skip the root layout for the verify-wallet and activate pages
  if (url.pathname === '/verify-wallet' || url.pathname.startsWith('/activate')) {
    return {
      skipLayout: true
    };
  }

  return {};
}