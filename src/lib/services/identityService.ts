import type { Address } from 'viem';
import type { Chain } from './activationService';

/**
 * Enum for identity types that matches the contract's enum
 */
export enum IdentityType {
  Artist = 0,
  Gallery = 1,
  Institution = 2,
  Collector = 3
}

/**
 * Interface for identity creation request
 */
export interface CreateIdentityRequest {
  walletAddress: Address;
  identityType: IdentityType;
  name: string;
  chainId: number;
  description?: string;
  identityImage?: string;
  links?: string[];
  tags?: string[];
  dob?: number; // Only for Artists
  dod?: number; // Only for Artists, optional
  location?: string; // Only for Artists
  addresses?: string[]; // Only for Galleries/Institutions
  representedBy?: string; // JSON string, only for Artists
  representedArtists?: string; // JSON string, only for Galleries
  onChainIdentityId?: number; // The identity ID from the blockchain
}

/**
 * Interface for identity update request
 */
export interface UpdateIdentityRequest {
  walletAddress: Address;
  identityId: number;
  chainId: number;
  identityType?: IdentityType;
  name: string;
  description?: string;
  identityImage?: string;
  links?: string[];
  tags?: string[];
  dob?: number; // Only for Artists
  dod?: number; // Only for Artists, optional
  location?: string; // Only for Artists
  addresses?: string[]; // Only for Galleries/Institutions
  representedBy?: string; // JSON string, only for Artists
  representedArtists?: string; // JSON string, only for Galleries
}

/**
 * Interface for identity creation/update response
 */
export interface CreateIdentityResponse {
  success: boolean;
  identityId?: number;
  transactionHash?: string;
  error?: string;
  message?: string;
}

/**
 * Interface for identity update response
 */
export interface UpdateIdentityResponse {
  success: boolean;
  identityId?: number;
  transactionHash?: string;
  error?: string;
  message?: string;
}

/**
 * Creates an identity on-chain and in the database
 * @param request The identity creation request
 * @returns The identity creation response
 */
export async function createIdentity(request: CreateIdentityRequest): Promise<CreateIdentityResponse> {
  try {
    console.log('Creating identity with request:', request);

    const response = await fetch('/api/identity/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Identity creation result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown error'
      };
    }

    return result as CreateIdentityResponse;
  } catch (error) {
    console.error('Failed to create identity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating identity'
    };
  }
}

/**
 * Updates an identity on-chain and in the database
 * @param request The identity update request
 * @returns The identity update response
 */
export async function updateIdentity(request: UpdateIdentityRequest): Promise<UpdateIdentityResponse> {
  try {
    console.log('Updating identity with request:', request);

    const response = await fetch('/api/identity/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Identity update result:', result);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Unknown error'
      };
    }

    return result as UpdateIdentityResponse;
  } catch (error) {
    console.error('Failed to update identity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating identity'
    };
  }
}

/**
 * Maps a string identity type to the enum value
 * @param type The string identity type
 * @returns The enum identity type
 */
export function mapIdentityType(type: string): IdentityType {
  switch (type) {
    case 'artist':
      return IdentityType.Artist;
    case 'gallery':
      return IdentityType.Gallery;
    case 'institution':
      return IdentityType.Institution;
    case 'collector':
      return IdentityType.Collector;
    default:
      throw new Error(`Invalid identity type: ${type}`);
  }
}
