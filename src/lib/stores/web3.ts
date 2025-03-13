import { writable } from 'svelte/store';
import type { Address } from 'viem';

interface Web3State {
  isConnected: boolean;
  address: Address | null;
  chainId: number | null;
  isConnecting: boolean;
  error: Error | null;
}

const initialState: Web3State = {
  isConnected: false,
  address: null,
  chainId: null,
  isConnecting: false,
  error: null
};

export const web3Store = writable<Web3State>(initialState);

export const resetWeb3Store = () => {
  web3Store.set(initialState);
};

export const setConnected = (address: Address, chainId: number) => {
  web3Store.update((state) => ({
    ...state,
    isConnected: true,
    address,
    chainId,
    isConnecting: false,
    error: null
  }));
};

export const setConnecting = (isConnecting: boolean) => {
  web3Store.update((state) => ({
    ...state,
    isConnecting
  }));
};

export const setError = (error: Error) => {
  web3Store.update((state) => ({
    ...state,
    error,
    isConnecting: false
  }));
};

export const setDisconnected = () => {
  web3Store.update((state) => ({
    ...state,
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false
  }));
}; 