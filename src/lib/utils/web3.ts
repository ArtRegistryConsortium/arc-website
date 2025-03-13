import type { Address } from 'viem';

/**
 * Truncates an Ethereum address for display purposes
 * @param address The full Ethereum address
 * @param startLength Number of characters to show at the start
 * @param endLength Number of characters to show at the end
 * @returns Truncated address string
 */
export function truncateAddress(
  address: Address,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return '';
  
  const start = address.substring(0, startLength + 2); // +2 for '0x'
  const end = address.substring(address.length - endLength);
  
  return `${start}...${end}`;
}

/**
 * Gets the network name from a chain ID
 * @param chainId The chain ID
 * @returns The network name
 */
export function getNetworkName(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    // Add more networks as needed
  };
  
  return networks[chainId] || `Unknown Network (${chainId})`;
} 