import { writable } from 'svelte/store';
import type { UserIdentity } from '$lib/services/userIdentityService';
import { getUserIdentities } from '$lib/services/userIdentityService';
import type { Address } from 'viem';

interface UserIdentityState {
  identities: UserIdentity[];
  primaryIdentity: UserIdentity | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserIdentityState = {
  identities: [],
  primaryIdentity: null,
  isLoading: false,
  error: null
};

function createUserIdentityStore() {
  const { subscribe, set, update } = writable<UserIdentityState>(initialState);

  return {
    subscribe,
    
    /**
     * Loads identities for a wallet address
     * @param walletAddress The wallet address to load identities for
     */
    loadIdentities: async (walletAddress: Address) => {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const identities = await getUserIdentities(walletAddress);
        const primaryIdentity = identities.length > 0 ? identities[0] : null;
        
        update(state => ({
          ...state,
          identities,
          primaryIdentity,
          isLoading: false
        }));
      } catch (error) {
        console.error('Error loading identities:', error);
        update(state => ({
          ...state,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error loading identities'
        }));
      }
    },
    
    /**
     * Resets the store to its initial state
     */
    reset: () => {
      set(initialState);
    }
  };
}

export const userIdentityStore = createUserIdentityStore();
