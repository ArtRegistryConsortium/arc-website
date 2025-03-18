import { writable } from 'svelte/store';
import type { Chain } from '$lib/services/activationService';

export interface IdentityInfo {
  identityType: 'artist' | 'gallery' | 'institution' | 'collector' | null;
  username: string;
  selectedChain: Chain | null;
}

// Create the initial store with default values
const createIdentityStore = () => {
  const initialState: IdentityInfo = {
    identityType: null,
    username: '',
    selectedChain: null
  };

  const { subscribe, set, update } = writable<IdentityInfo>(initialState);

  return {
    subscribe,
    
    // Set the identity type
    setIdentityType: (type: 'artist' | 'gallery' | 'institution' | 'collector') => {
      update(state => ({ ...state, identityType: type }));
    },
    
    // Set the username
    setUsername: (username: string) => {
      update(state => ({ ...state, username }));
    },
    
    // Set the selected chain
    setSelectedChain: (chain: Chain) => {
      update(state => ({ ...state, selectedChain: chain }));
    },
    
    // Reset the store to initial state
    reset: () => {
      set(initialState);
    }
  };
};

// Export the store
export const identityStore = createIdentityStore();
