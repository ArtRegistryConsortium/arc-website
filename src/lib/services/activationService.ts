import type { Address } from 'viem';

/**
 * Interface for the activation status response
 */
export interface ActivationStatus {
  success: boolean;
  status: 'awaiting_payment' | 'payment_verified' | 'payment_confirmed' | 'registration_created';
  ethAmount?: number;
  validTo?: string;
  arcWalletAddress?: string;
  nextStep?: string;
  error?: string;
  message?: string;
}

/**
 * Checks the activation status for a wallet
 * @param walletAddress The wallet address to check
 * @returns The activation status
 */
export async function checkActivationStatus(walletAddress: Address): Promise<ActivationStatus> {
  try {
    console.log('Checking activation status for wallet:', walletAddress);

    const response = await fetch('/api/wallet/activation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress })
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
 * Formats an ETH amount to a user-friendly string with limited decimal places
 * @param ethAmount The ETH amount as a number
 * @param decimals Number of decimal places to show
 * @returns Formatted ETH amount string
 */
export function formatEthAmount(ethAmount: number | undefined, decimals: number = 6): string {
  if (ethAmount === undefined) return '0';
  return ethAmount.toFixed(decimals);
}
