import type { Address } from 'viem';

export interface UserIdentity {
  id: number;
  wallet_address: string;
  chain_id: number;
  name: string;
  description: string | null;
  identity_image: string | null;
  links: any | null;
  tags: string[] | null;
  type: string;
  created_at: string | null;
  updated_at: string | null;
  dob?: number | null;
  dod?: number | null;
  location?: string | null;
  addresses?: any | null;
  represented_artists?: any | null;
  represented_by?: any | null;
}

export interface ChainIdentityStatus {
  hasIdentity: boolean;
  identity?: UserIdentity;
}

/**
 * Fetches all identities for a wallet address
 * @param walletAddress The wallet address to fetch identities for
 * @returns An array of identities
 */
export async function getUserIdentities(walletAddress: Address): Promise<UserIdentity[]> {
  try {
    const response = await fetch('/api/identity/user', {
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

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch identities');
    }

    return result.identities;
  } catch (error) {
    console.error('Error fetching user identities:', error);
    // Throw the error so it can be caught by the store
    throw error;
  }
}

/**
 * Gets the primary identity for a wallet address (the most recently created one)
 * @param walletAddress The wallet address to fetch the primary identity for
 * @returns The primary identity or null if none exists
 */
export async function getPrimaryIdentity(walletAddress: Address): Promise<UserIdentity | null> {
  try {
    const identities = await getUserIdentities(walletAddress);

    if (identities.length === 0) {
      return null;
    }

    // Return the most recently created identity
    return identities[0];
  } catch (error) {
    console.error('Error fetching primary identity:', error);
    return null;
  }
}

/**
 * Checks if a user already has an identity on a specific chain
 * @param walletAddress The wallet address to check
 * @param chainId The chain ID to check
 * @returns Object with hasIdentity flag and the identity if it exists
 */
export async function hasIdentityOnChain(walletAddress: Address, chainId: number): Promise<ChainIdentityStatus> {
  try {
    const identities = await getUserIdentities(walletAddress);

    // Find an identity with the matching chain ID
    const existingIdentity = identities.find(identity => identity.chain_id === chainId);

    return {
      hasIdentity: !!existingIdentity,
      identity: existingIdentity
    };
  } catch (error) {
    console.error(`Error checking if user has identity on chain ${chainId}:`, error);
    return { hasIdentity: false };
  }
}
