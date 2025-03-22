import type { Address } from 'viem';

// Define the wallet setup status interface
export interface WalletSetupStatus {
  setup_completed: boolean;
  setup_step: number;
  fee_paid: boolean;
}

/**
 * Check if a wallet exists in the database
 * @param walletAddress The wallet address to check
 * @returns True if the wallet exists, false otherwise
 */
export async function checkWalletExists(walletAddress: Address): Promise<boolean> {
  try {
    console.log('Checking if wallet exists:', walletAddress);

    const response = await fetch('/api/wallet/check', {
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
    console.log('Wallet existence check result:', result);

    return result.exists;
  } catch (error) {
    console.error('Failed to check wallet existence:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Create a new wallet entry in the database
 * @param walletAddress The wallet address to create
 * @returns True if the wallet was created successfully, false otherwise
 */
export async function createWalletEntry(walletAddress: Address): Promise<boolean> {
  try {
    console.log('Creating wallet entry for address:', walletAddress);

    const response = await fetch('/api/wallet/create', {
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
    console.log('Wallet creation result:', result);

    return result.success;
  } catch (error) {
    console.error('Failed to create wallet entry:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Update the last login time for a wallet
 * @param walletAddress The wallet address to update
 * @returns True if the wallet was updated successfully, false otherwise
 */
export async function updateWalletLastLogin(walletAddress: Address): Promise<boolean> {
  try {
    console.log('Updating wallet last login for:', walletAddress);

    const response = await fetch('/api/wallet/update-login', {
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
    console.log('Wallet last login update result:', result);

    return result.success;
  } catch (error) {
    console.error('Failed to update wallet last login:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
}

/**
 * Check if a wallet exists and create it if it doesn't
 * @param walletAddress The wallet address to check/create
 * @returns True if the wallet exists or was created successfully, false otherwise
 */
export async function ensureWalletExists(walletAddress: Address): Promise<boolean> {
  try {
    console.log('Ensuring wallet exists for address:', walletAddress);

    // Use the dedicated endpoint that handles both checking and creating in one request
    const response = await fetch('/api/wallet/ensure', {
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
    console.log('Ensure wallet exists result:', result);

    return result.success;
  } catch (error) {
    console.error('Failed to ensure wallet exists:', error);
    return false;
  }
}

/**
 * Get the setup status for a wallet
 * @param walletAddress The wallet address to check
 * @returns The wallet setup status or null if there was an error
 */
export async function getWalletSetupStatus(walletAddress: Address): Promise<WalletSetupStatus | null> {
  try {
    console.log('Getting setup status for wallet:', walletAddress);

    const response = await fetch('/api/wallet/status', {
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
    console.log('Wallet setup status result:', result);

    if (!result.success) {
      return null;
    }

    return {
      setup_completed: result.data.setup_completed || false,
      setup_step: result.data.setup_step || 0,
      fee_paid: result.data.fee_paid || false
    };
  } catch (error) {
    console.error('Failed to get wallet setup status:', error);
    return null;
  }
}

/**
 * Mark a wallet's setup as completed
 * @param walletAddress The wallet address to update
 * @returns True if the wallet was updated successfully, false otherwise
 */
export async function completeWalletSetup(walletAddress: Address): Promise<boolean> {
  try {
    console.log('Marking wallet setup as completed for:', walletAddress);

    const response = await fetch('/api/wallet/complete-setup', {
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
    console.log('Wallet setup completion result:', result);

    return result.success;
  } catch (error) {
    console.error('Failed to complete wallet setup:', error);
    return false;
  }
}
