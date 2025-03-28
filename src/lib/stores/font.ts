import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Font =
  | 'system'
  | 'dm-sans'
  | 'inter'
  | 'space-grotesk'
  | 'montserrat'
  | 'roboto'
  | 'outfit'
  | 'bricolage-grotesque'
  | 'urbanist'
  | 'plus-jakarta-sans'
  | 'libre-baskerville'
  | 'libre-franklin'
  | 'cormorant'
  | 'dm-serif-display'
  | 'merriweather'
  | 'cormorant-garamond'
  | 'playfair-display'
  | 'lora'
  | 'noto-serif'
  | 'crimson-text'
  | 'open-sans'
  | 'lato'
  | 'poppins';

// Font display names for UI
export const fontNames: Record<Font, string> = {
  'system': 'System Font',
  'dm-sans': 'DM Sans',
  'inter': 'Inter',
  'space-grotesk': 'Space Grotesk',
  'montserrat': 'Montserrat',
  'roboto': 'Roboto',
  'outfit': 'Outfit',
  'bricolage-grotesque': 'Bricolage Grotesque',
  'urbanist': 'Urbanist',
  'plus-jakarta-sans': 'Plus Jakarta Sans',
  'libre-baskerville': 'Libre Baskerville',
  'libre-franklin': 'Libre Franklin',
  'cormorant': 'Cormorant',
  'dm-serif-display': 'DM Serif Display',
  'merriweather': 'Merriweather',
  'cormorant-garamond': 'Cormorant Garamond',
  'playfair-display': 'Playfair Display',
  'lora': 'Lora',
  'noto-serif': 'Noto Serif',
  'crimson-text': 'Crimson Text',
  'open-sans': 'Open Sans',
  'lato': 'Lato',
  'poppins': 'Poppins'
};

// Initialize font from localStorage or use system font
function getInitialFont(): Font {
  if (!browser) return 'inter';

  const storedFont = localStorage.getItem('font') as Font | null;
  return storedFont || 'inter';
}

// Create the font store
const fontStore = writable<Font>(getInitialFont());

// Function to update the document with the current font
function updateFont(font: Font) {
  if (!browser) return;

  // Remove all font classes
  document.documentElement.classList.remove(
    'font-dm-sans',
    'font-inter',
    'font-space-grotesk',
    'font-montserrat',
    'font-roboto',
    'font-outfit',
    'font-bricolage-grotesque',
    'font-urbanist',
    'font-plus-jakarta-sans',
    'font-libre-baskerville',
    'font-libre-franklin',
    'font-cormorant',
    'font-dm-serif-display',
    'font-merriweather',
    'font-cormorant-garamond',
    'font-playfair-display',
    'font-lora',
    'font-noto-serif',
    'font-crimson-text',
    'font-open-sans',
    'font-lato',
    'font-poppins'
  );

  // Add the selected font class if not system
  if (font !== 'system') {
    document.documentElement.classList.add(`font-${font}`);
  }

  localStorage.setItem('font', font);
}

// Subscribe to font changes and update the document
if (browser) {
  fontStore.subscribe(updateFont);
}

export { fontStore };
