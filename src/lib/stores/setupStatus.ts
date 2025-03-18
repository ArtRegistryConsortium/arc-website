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
  console.log('Getting redirect URL for setup status:', status);

  if (status.setup_completed) {
    console.log('Setup is completed, redirecting to home');
    return '/'; // No redirect needed if setup is completed
  }

  // Redirect based on setup step
  let redirectUrl = '/activate';

  switch (status.setup_step) {
    case 0: // Payment
      redirectUrl = '/activate';
      break;
    case 1: // Identity Type
      redirectUrl = '/activate/choose-identity-type';
      break;
    case 2: // Create Identity
      redirectUrl = '/activate/create-identity';
      break;
    case 3: // Select Chain
      redirectUrl = '/activate/select-chain';
      break;
    case 4: // Confirmation
      redirectUrl = '/activate/confirmation';
      break;
    default:
      redirectUrl = '/activate';
      break;
  }

  console.log(`Redirecting to ${redirectUrl} for setup_step ${status.setup_step}`);
  return redirectUrl;
}

// Function to reset the store
export function resetSetupStatus(): void {
  setupStatusStore.set(initialState);
}
