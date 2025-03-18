import type { Address } from 'viem';

/**
 * Interface for the setup progress update response
 */
export interface SetupProgressResponse {
  success: boolean;
  error?: string;
  message?: string;
  currentStep?: number;
}

/**
 * Updates the setup progress for a wallet
 * @param walletAddress The wallet address
 * @param setupStep The current setup step (1-5)
 * @returns The setup progress update response
 */
export async function updateSetupProgress(
  walletAddress: Address, 
  setupStep: number
): Promise<SetupProgressResponse> {
  try {
    console.log(`Updating setup progress for wallet ${walletAddress} to step ${setupStep}`);

    const response = await fetch('/api/wallet/update-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress, setupStep })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Setup progress update result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown error'
      };
    }

    return result as SetupProgressResponse;
  } catch (error) {
    console.error('Failed to update setup progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating setup progress'
    };
  }
}
