import { writable } from 'svelte/store';
import type { Address } from 'viem';
import { signMessage } from 'wagmi/actions';
import { config } from '$lib/web3/config';

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
    return false;
  }
  
  // Check if session is expired
  const expiryTime = parseInt(sessionExpiry, 10);
  if (Date.now() > expiryTime) {
    // Clear expired session
    clearSession();
    return false;
  }
  
  // Session is valid, update the store
  walletAuthStore.update(state => ({
    ...state,
    isVerified: true,
    sessionToken
  }));
  
  return true;
}

// Clear the session
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('wallet_session_token');
  localStorage.removeItem('wallet_session_address');
  localStorage.removeItem('wallet_session_expiry');
  
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
    
    // Set expiry to 24 hours from now
    const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
    
    // Store in localStorage
    localStorage.setItem('wallet_session_token', sessionToken);
    localStorage.setItem('wallet_session_address', address as string);
    localStorage.setItem('wallet_session_expiry', expiryTime.toString());
    
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