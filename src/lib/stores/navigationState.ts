import { writable } from 'svelte/store';

// Initialize the store with values from localStorage if available
const initialState = {
  userClosedActivatePage: false
};

// Try to load state from localStorage
if (typeof window !== 'undefined') {
  const savedState = localStorage.getItem('navigationState');
  if (savedState) {
    try {
      const parsedState = JSON.parse(savedState);
      initialState.userClosedActivatePage = parsedState.userClosedActivatePage || false;
    } catch (e) {
      console.error('Failed to parse navigation state from localStorage:', e);
    }
  }
}

// Create a store to track navigation state
export const navigationState = writable(initialState);

// Subscribe to the store and save changes to localStorage
if (typeof window !== 'undefined') {
  navigationState.subscribe(state => {
    localStorage.setItem('navigationState', JSON.stringify(state));
  });
}

// Function to set the userClosedActivatePage flag
export function setUserClosedActivatePage(value: boolean): void {
  console.log('Setting userClosedActivatePage to:', value);
  navigationState.update(state => ({
    ...state,
    userClosedActivatePage: value
  }));
}

// Function to reset the navigation state
export function resetNavigationState(): void {
  console.log('Resetting navigation state');
  navigationState.update(() => ({
    userClosedActivatePage: false
  }));
}
