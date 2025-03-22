import { writable } from 'svelte/store';
import type { Chain } from '$lib/services/activationService';

export interface IdentityInfo {
  identityType: 'artist' | 'gallery' | 'institution' | 'collector' | null;
  username: string;
  description: string;
  identityImage: string;
  links: string[];
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

    // Set the description
    setDescription: (description: string) => {
      update(state => ({ ...state, description }));
    },

    // Set the identity image
    setIdentityImage: (identityImage: string) => {
      update(state => ({ ...state, identityImage }));
    },

    // Set the links
    setLinks: (links: string[]) => {
      update(state => ({ ...state, links }));
    },

    // Set the tags
    setTags: (tags: string[]) => {
      update(state => ({ ...state, tags }));
    },

    // Set the date of birth
    setDob: (dob?: number) => {
      update(state => ({ ...state, dob }));
    },

    // Set the date of death
    setDod: (dod?: number) => {
      update(state => ({ ...state, dod }));
    },

    // Set the location
    setLocation: (location: string) => {
      update(state => ({ ...state, location }));
    },

    // Set the addresses
    setAddresses: (addresses: string[]) => {
      update(state => ({ ...state, addresses }));
    },

    // Set the represented by
    setRepresentedBy: (representedBy: any) => {
      update(state => ({ ...state, representedBy }));
    },

    // Set the represented artists
    setRepresentedArtists: (representedArtists: any) => {
      update(state => ({ ...state, representedArtists }));
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
