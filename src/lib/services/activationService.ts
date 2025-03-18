import type { Address } from 'viem';

/**
 * Interface for a blockchain chain
 */
export interface Chain {
  chain_id: number;
  name: string;
  symbol?: string;
  icon_url?: string;
  explorer_url?: string;
  rpc_url?: string;
  is_testnet?: boolean;
  is_active?: boolean;
}

/**
 * Interface for the activation status response
 */
export interface ActivationStatus {
  success: boolean;
  status: 'awaiting_payment' | 'payment_verified' | 'payment_confirmed' | 'registration_created';
  cryptoAmount?: number;
  validTo?: string;
  arcWalletAddress?: string;
  nextStep?: string;
  error?: string;
  message?: string;
  chain?: Chain;
  availableChains?: Chain[];
}

/**
 * Fetches available chains for payment
 * @returns Array of available chains
 */
export async function fetchAvailableChains(): Promise<Chain[]> {
  try {
    const response = await fetch('/api/chains');

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch chains');
    }

    return result.chains || [];
  } catch (error) {
    console.error('Failed to fetch available chains:', error);
    return [];
  }
}

/**
 * Checks the activation status for a wallet
 * @param walletAddress The wallet address to check
 * @param chainId Optional chain ID to check for a specific chain
 * @returns The activation status
 */
export async function checkActivationStatus(walletAddress: Address, chainId?: number, transactionHash?: string): Promise<ActivationStatus> {
  try {
    console.log('Checking activation status for wallet:', walletAddress, 'on chain:', chainId || 'any');

    const response = await fetch('/api/wallet/activation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, chainId, transactionHash })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Activation status result:', result);

    if (!result.success) {
      return {
        success: false,
        status: 'awaiting_payment',
        error: result.error || 'Unknown error'
      };
    }

    return result as ActivationStatus;
  } catch (error) {
    console.error('Failed to check activation status:', error);
    return {
      success: false,
      status: 'awaiting_payment',
      error: error instanceof Error ? error.message : 'Unknown error checking activation status'
    };
  }
}

/**
 * Formats a crypto amount to a user-friendly string with limited decimal places
 * @param amount The crypto amount as a number
 * @param decimals Number of decimal places to show
 * @returns Formatted crypto amount string
 */
export function formatCryptoAmount(amount: number | undefined, decimals: number = 6): string {
  if (amount === undefined) return '0';
  return amount.toFixed(decimals);
}
