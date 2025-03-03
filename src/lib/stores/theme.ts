import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark' | 'system';

// Get the user's preferred color scheme
function getSystemTheme(): 'light' | 'dark' {
  if (!browser) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Initialize theme from localStorage or use system preference
function getInitialTheme(): Theme {
  if (!browser) return 'system';
  
  const storedTheme = localStorage.getItem('theme') as Theme | null;
  return storedTheme || 'system';
}

// Create the theme store
const themeStore = writable<Theme>(getInitialTheme());

// Function to update the document with the current theme
function updateTheme(theme: Theme) {
  if (!browser) return;
  
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
  
  if (resolvedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  localStorage.setItem('theme', theme);
}

// Subscribe to theme changes and update the document
if (browser) {
  themeStore.subscribe(updateTheme);
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = localStorage.getItem('theme') as Theme | null;
    if (currentTheme === 'system') {
      updateTheme('system');
    }
  });
}

export { themeStore, type Theme }; 