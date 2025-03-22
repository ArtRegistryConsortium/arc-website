import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, optimism, arbitrum, arbitrumSepolia, base } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';

// Get WalletConnect project ID from environment variable
const projectId = PUBLIC_WALLETCONNECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. WalletConnect functionality may be limited.');
}

// Create wagmi config
export const config = createConfig({
  chains: [mainnet, sepolia, optimism, arbitrum, arbitrumSepolia, base],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [base.id]: http(),
  },
  connectors: [
    injected({
      // Enable auto-connection for injected connectors
      shimDisconnect: true
    }),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'Art Registry Consortium',
        description: 'Art Registry Consortium Web3 Integration',
        url: 'https://artregistryconsortium.org', // Replace with your actual URL
        icons: ['https://artregistryconsortium.org/favicon.ico'] // Replace with your actual icon
      }
    })
  ],
  // Disable SSR for client-side only functionality
  ssr: false
});