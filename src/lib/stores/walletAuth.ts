import { writable } from 'svelte/store';
import type { Address } from 'viem';
import { signMessage } from 'wagmi/actions';
import { config } from '../web3/config';
import { ensureWalletExists, getWalletSetupStatus } from '../services/walletService';
import { checkSetupStatus } from './setupStatus';

// Define the authentication state interface
interface WalletAuthState {
  isVerified: boolean;
  sessionToken: string | null;
  nonce: string | null;
  isVerifying: boolean;
  error: Error | null;
}

// Initial state
const initialState: WalletAuthState = {
  isVerified: false,
  sessionToken: null,
  nonce: null,
  isVerifying: false,
  error: null
};

// Create the store
export const walletAuthStore = writable<WalletAuthState>(initialState);

// Generate a secure nonce (timestamp + random string)
export function generateNonce(): string {
  const timestamp = Date.now().toString();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}`;
}

// Check if a session token exists in localStorage
export function checkExistingSession(): boolean {
  if (typeof window === 'undefined') return false;

  const sessionToken = localStorage.getItem('wallet_session_token');
  const sessionAddress = localStorage.getItem('wallet_session_address');
  const sessionExpiry = localStorage.getItem('wallet_session_expiry');

  if (!sessionToken || !sessionAddress || !sessionExpiry) {
    console.log('Missing session data');
    return false;
  }

  // Check if session is expired
  const expiryTime = parseInt(sessionExpiry, 10);
  if (Date.now() > expiryTime) {
    // Clear expired session
    console.log('Session expired');
    clearSession();
    return false;
  }

  // Session is valid, update the store
  walletAuthStore.update(state => ({
    ...state,
    isVerified: true,
    sessionToken
  }));

  console.log('Valid session found for address:', sessionAddress);

  // Check if wallet exists in Supabase and create it if it doesn't
  // We're doing this asynchronously and not waiting for the result
  // because checkExistingSession is a synchronous function
  if (sessionAddress) {
    const address = sessionAddress as Address;
    ensureWalletExists(address)
      .then(success => {
        if (success) {
          console.log('Wallet entry confirmed or updated during session check');

          // Check the wallet setup status
          checkSetupStatus(address)
            .then(() => {
              console.log('Wallet setup status checked during session check');
            })
            .catch(setupError => {
              console.error('Error checking setup status during session check:', setupError);
            });
        } else {
          console.warn('Failed to confirm or update wallet entry during session check');
        }
      })
      .catch(error => {
        console.error('Error interacting with database during session check:', error);
      });
  }

  return true;
}

// Clear the session
export function clearSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('wallet_session_token');
  localStorage.removeItem('wallet_session_address');
  localStorage.removeItem('wallet_session_expiry');
  localStorage.removeItem('wallet_verified');

  // Clear the wallet address cookie
  document.cookie = 'wallet_address=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';

  console.log('Wallet session cleared');
  walletAuthStore.set(initialState);
}

// Create a new verification session
export async function createVerificationSession(address: Address): Promise<string> {
  const nonce = generateNonce();

  walletAuthStore.update(state => ({
    ...state,
    nonce,
    isVerifying: false, // Set to false initially since we're just preparing the message
    error: null
  }));

  return nonce;
}

// Verify wallet signature and create session token
export async function verifyWalletSignature(address: Address, signature: string, nonce: string): Promise<boolean> {
  try {
    // Set isVerifying to true when starting the verification process
    walletAuthStore.update(state => ({
      ...state,
      isVerifying: true
    }));

    // In a real application, you would verify the signature on the server
    // For this example, we'll just create a session token locally

    // Create a session token (in a real app, this would come from the server)
    const sessionToken = generateSessionToken();

    // Set expiry to 7 days from now (increased from 24 hours for better persistence)
    const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Store in localStorage
    localStorage.setItem('wallet_session_token', sessionToken);
    localStorage.setItem('wallet_session_address', address as string);
    localStorage.setItem('wallet_session_expiry', expiryTime.toString());

    // Also store a flag to indicate this wallet has been verified
    localStorage.setItem('wallet_verified', 'true');

    // Set the wallet address cookie
    setWalletAddressCookie(address);

    console.log('Wallet verification successful, session created for:', address);

    // Check if wallet exists in database and create it if it doesn't
    try {
      console.log('Starting wallet check/creation for address:', address);

      // Ensure the wallet entry exists
      console.log('Calling ensureWalletExists...');
      const walletCreated = await ensureWalletExists(address);

      if (walletCreated) {
        console.log('Wallet entry created or updated for:', address);

        // Check the wallet setup status
        console.log('Checking wallet setup status...');
        await checkSetupStatus(address);
      } else {
        console.warn('Failed to create or update wallet entry for:', address);
      }
    } catch (dbError) {
      console.error('Error interacting with database:', dbError);
      if (dbError instanceof Error) {
        console.error('Error message:', dbError.message);
        console.error('Error stack:', dbError.stack);
      }
      // Continue with local authentication even if database interaction fails
    }

    // Update the store
    walletAuthStore.update(state => ({
      ...state,
      isVerified: true,
      sessionToken,
      isVerifying: false,
      nonce: null,
      error: null
    }));

    return true;
  } catch (error) {
    console.error('Wallet verification failed:', error);
    walletAuthStore.update(state => ({
      ...state,
      isVerifying: false,
      error: error instanceof Error ? error : new Error('Unknown error during verification')
    }));
    return false;
  }
}

// Sign a message with the wallet
export async function signWalletMessage(address: Address, message: string): Promise<string | null> {
  try {
    walletAuthStore.update(state => ({
      ...state,
      isVerifying: true,
      error: null
    }));

    const signature = await signMessage(config, {
      message,
      account: address
    });

    return signature;
  } catch (error) {
    walletAuthStore.update(state => ({
      ...state,
      isVerifying: false,
      error: error instanceof Error ? error : new Error('Failed to sign message')
    }));
    return null;
  }
}

// Generate a secure session token
function generateSessionToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestampPart = Date.now().toString(36);
  return `${randomPart}${timestampPart}`;
}

// Get the wallet address from localStorage
export function getWalletAddress(): Address | null {
  if (typeof window === 'undefined') return null;

  const sessionAddress = localStorage.getItem('wallet_session_address');
  if (!sessionAddress) return null;

  return sessionAddress as Address;
}

// Set the wallet address cookie
export function setWalletAddressCookie(address: Address): void {
  if (typeof window === 'undefined') return;

  try {
    // Set a cookie with the wallet address that expires in 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    document.cookie = `wallet_address=${address}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    console.log('Wallet address cookie set from walletAuth:', address);
  } catch (error) {
    console.error('Error setting wallet address cookie from walletAuth:', error);
  }
}