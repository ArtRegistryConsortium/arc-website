/**
 * Service for handling Arweave uploads via server-side API
 */
import { formatFileSize } from '$lib/utils';
import { get } from 'svelte/store';
import { web3Store } from '$lib/stores/web3';
import type { Address } from 'viem';

// Maximum file size in bytes (1MB)
const MAX_FILE_SIZE = 1024 * 1024;

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Validates an image file on the client side before sending to the server
 * @param file The file to validate
 * @returns Object with validation result and optional error message
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}` };
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please upload a JPEG, PNG, GIF, WebP, or SVG image.' };
  }

  return { valid: true };
}

/**
 * Uploads an image to Arweave via server-side API
 * @param imageData The image data to upload (base64 or file)
 * @param walletAddress Optional wallet address to associate with the upload
 * @returns A promise that resolves to the Arweave URL
 */
export async function uploadImageToArweave(imageData: string | File, walletAddress?: Address): Promise<string> {
  try {
    console.log('Starting Arweave upload process via server API');

    // Convert File to base64 if needed
    let base64Data: string;

    if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      // Already a base64 data URL
      base64Data = imageData;
    } else if (imageData instanceof File) {
      // Validate file before sending to server
      const validation = validateImageFile(imageData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convert File to base64
      base64Data = await fileToBase64(imageData);
    } else {
      throw new Error('Invalid image data format');
    }

    // Get the wallet address from the store if not provided
    const address = walletAddress || get(web3Store).address;
    console.log('Using wallet address for Arweave upload:', address);

    // Call the server-side API to handle the upload
    const response = await fetch('/api/upload/arweave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageData: base64Data,
        walletAddress: address
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown error during upload');
    }

    console.log('Arweave upload complete:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error uploading to Arweave:', error);
    throw error;
  }
}

/**
 * Converts a File object to a base64 data URL
 * @param file The file to convert
 * @returns A promise that resolves to a base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    reader.readAsDataURL(file);
  });
}
