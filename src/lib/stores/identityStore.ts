import { writable } from 'svelte/store';
import type { Chain } from '$lib/services/activationService';

export interface IdentityInfo {
  identityType: 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian' | null;
  username: string;
  description: string;
  identityImage: string;
  links: { name: string; url: string }[];
  tags: string[];
  // Artist-specific fields
  dob?: number; // Date of birth (timestamp)
  dod?: number; // Date of death (timestamp)
  location?: string;
  // Gallery/Institution-specific fields
  addresses?: string[];
  // Artist-specific
  representedBy?: any; // JSON for gallery/institution identity IDs
  // Gallery/Institution-specific
  representedArtists?: any; // JSON for artist identity IDs
  selectedChain: Chain | null;
}

// Create the initial store with default values
const createIdentityStore = () => {
  // Load initial state from localStorage if available
  const loadInitialState = (): IdentityInfo => {
    if (typeof window === 'undefined') return initialState;
    
    const savedState = localStorage.getItem('identityData');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error('Error loading identity data from localStorage:', e);
        return initialState;
      }
    }
    return initialState;
  };

  const initialState: IdentityInfo = {
    identityType: null,
    username: '',
    description: '',
    identityImage: '',
    links: [],
    tags: [],
    dob: undefined,
    dod: undefined,
    location: '',
    addresses: [],
    representedBy: undefined,
    representedArtists: undefined,
    selectedChain: null
  };

  const { subscribe, set, update } = writable<IdentityInfo>(loadInitialState());

  // Helper function to save state to localStorage
  const saveToLocalStorage = (state: IdentityInfo) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('identityData', JSON.stringify(state));
    } catch (e) {
      console.error('Error saving identity data to localStorage:', e);
    }
  };

  return {
    subscribe,

    // Set the identity type
    setIdentityType: (type: 'artist' | 'gallery' | 'institution' | 'collector' | 'custodian') => {
      update(state => {
        const newState = { ...state, identityType: type };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the username
    setUsername: (username: string) => {
      update(state => {
        const newState = { ...state, username };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the description
    setDescription: (description: string) => {
      update(state => {
        const newState = { ...state, description };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the identity image
    setIdentityImage: (identityImage: string) => {
      update(state => {
        const newState = { ...state, identityImage };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the links
    setLinks: (links: { name: string; url: string }[]) => {
      update(state => {
        const newState = { ...state, links };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the tags
    setTags: (tags: string[]) => {
      update(state => {
        const newState = { ...state, tags };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the date of birth
    setDob: (dob?: number) => {
      update(state => {
        const newState = { ...state, dob };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the date of death
    setDod: (dod?: number) => {
      update(state => {
        const newState = { ...state, dod };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the location
    setLocation: (location: string) => {
      update(state => {
        const newState = { ...state, location };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the addresses
    setAddresses: (addresses: string[]) => {
      update(state => {
        const newState = { ...state, addresses };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the represented by
    setRepresentedBy: (representedBy: any) => {
      update(state => {
        const newState = { ...state, representedBy };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the represented artists
    setRepresentedArtists: (representedArtists: any) => {
      update(state => {
        const newState = { ...state, representedArtists };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Set the selected chain
    setSelectedChain: (chain: Chain) => {
      update(state => {
        const newState = { ...state, selectedChain: chain };
        saveToLocalStorage(newState);
        return newState;
      });
    },

    // Reset the store to initial state
    reset: () => {
      set(initialState);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('identityData');
      }
    }
  };
};

// Export the store
export const identityStore = createIdentityStore();
