import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { PUBLIC_WALLETCONNECT_ID } from '$env/static/public';

// Get WalletConnect project ID from environment variable
const projectId = PUBLIC_WALLETCONNECT_ID || '';

if (!projectId) {
  console.warn('WalletConnect Project ID is not set. WalletConnect functionality may be limited.');
}

// Create wagmi config
export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [
    injected(),
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
  ]
}); 