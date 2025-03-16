import { writable } from 'svelte/store';
import type { WalletSetupStatus } from '../services/walletService';
import { getWalletSetupStatus } from '../services/walletService';
import type { Address } from 'viem';

// Initial state
const initialState: {
  isLoading: boolean;
  status: WalletSetupStatus | null;
  error: Error | null;
} = {
  isLoading: false,
  status: null,
  error: null
};

// Create the store
export const setupStatusStore = writable(initialState);

// Function to check setup status
export async function checkSetupStatus(walletAddress: Address): Promise<void> {
  try {
    setupStatusStore.update(state => ({
      ...state,
      isLoading: true,
      error: null
    }));

    const status = await getWalletSetupStatus(walletAddress);

    setupStatusStore.update(state => ({
      ...state,
      isLoading: false,
      status
    }));

    console.log('Setup status updated:', status);
  } catch (error) {
    console.error('Error checking setup status:', error);
    setupStatusStore.update(state => ({
      ...state,
      isLoading: false,
      error: error instanceof Error ? error : new Error('Unknown error checking setup status')
    }));
  }
}

// Function to get the redirect URL based on setup step
export function getSetupRedirectUrl(status: WalletSetupStatus): string {
  if (status.setup_completed) {
    return '/'; // No redirect needed if setup is completed
  }

  // Redirect based on setup step
  switch (status.setup_step) {
    case 0:
      return '/activate';
    case 1:
      return '/activate/select-chain';
    case 2:
      return '/activate/create-identity';
    case 3:
      return '/activate/confirmation';
    default:
      return '/activate';
  }
}

// Function to reset the store
export function resetSetupStatus(): void {
  setupStatusStore.set(initialState);
}
