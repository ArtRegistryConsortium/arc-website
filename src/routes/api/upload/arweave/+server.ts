import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Arweave from 'arweave';
import { env } from '$env/dynamic/private';
import { createRateLimit } from '$lib/utils/rateLimit';

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

// Initialize Arweave client
const arweave = Arweave.init({
  host: (env.ARWEAVE_GATEWAY_URL || 'arweave.net').replace(/^https?:\/\//, ''),
  port: 443,
  protocol: 'https'
});

// Log the Arweave configuration for debugging
console.log('Arweave client initialized with host:', (env.ARWEAVE_GATEWAY_URL || 'arweave.net').replace(/^https?:\/\//, ''));

// Configure rate limiting for Arweave uploads
// Get rate limit configuration from environment variables or use defaults
const RATE_LIMIT_MAX = parseInt(env.ARWEAVE_RATE_LIMIT_MAX || '5', 10); // Default: 5 uploads
const RATE_LIMIT_WINDOW_HOURS = parseInt(env.ARWEAVE_RATE_LIMIT_WINDOW_HOURS || '1', 10); // Default: 1 hour

const arweaveRateLimit = createRateLimit({
  max: RATE_LIMIT_MAX,
  windowMs: RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000, // Convert hours to milliseconds
  message: 'Too many image uploads. Please try again later.',
  skipInDevelopment: env.NODE_ENV === 'development' // Skip in development mode
});

// Log rate limit configuration on startup
console.log(`Arweave upload rate limit: ${RATE_LIMIT_MAX} uploads per ${RATE_LIMIT_WINDOW_HOURS} hour(s)${env.NODE_ENV === 'development' ? ' (disabled in development)' : ''}`);

/**
 * API endpoint to upload an image to Arweave
 * This keeps the Arweave wallet key secure on the server
 * Rate limited to prevent abuse
 */
export const POST: RequestHandler = async (event) => {
  // Apply rate limiting
  console.log('Applying rate limiting to Arweave upload request');
  const rateLimitResult = await arweaveRateLimit(event);
  if (rateLimitResult) {
    console.log('Rate limit applied, returning response');
    return rateLimitResult;
  }

  const { request } = event;
  try {
    // Get the image data from the request
    const { imageData } = await request.json();

    if (!imageData) {
      return json({
        success: false,
        error: 'Image data is required'
      }, { status: 400 });
    }

    // Validate the image data
    if (!imageData.startsWith('data:')) {
      return json({
        success: false,
        error: 'Invalid image data format. Must be a base64 data URL.'
      }, { status: 400 });
    }

    // Parse the base64 data URL
    const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return json({
        success: false,
        error: 'Invalid base64 image data'
      }, { status: 400 });
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return json({
        success: false,
        error: `File size exceeds maximum allowed size of ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB`
      }, { status: 400 });
    }

    // Validate content type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return json({
        success: false,
        error: 'File type not supported. Please upload a JPEG, PNG, GIF, WebP, or SVG image.'
      }, { status: 400 });
    }

    // Get wallet key from environment variable
    const walletKey = env.ARWEAVE_WALLET_KEY;
    console.log('Arweave wallet key exists:', !!walletKey);

    // In development mode, we can use a fallback if no wallet key is available
    if (!walletKey) {
      console.error('Arweave wallet key not found in environment variables');

      if (env.NODE_ENV === 'development') {
        console.warn('Using fallback image URL in development mode due to missing wallet key');
        return json({
          success: true,
          url: 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ',
          fallback: true
        });
      }

      return json({
        success: false,
        error: 'Server configuration error: Missing Arweave wallet key'
      }, { status: 500 });
    }

    // Parse wallet key
    let wallet;
    try {
      // Log the first few characters of the key for debugging (don't log the full key for security)
      console.log('Attempting to parse wallet key, starts with:', walletKey.substring(0, 15) + '...');
      wallet = JSON.parse(walletKey);
      console.log('Wallet key parsed successfully, contains keys:', Object.keys(wallet).join(', '));
    } catch (error) {
      console.error('Error parsing Arweave wallet key:', error);

      if (env.NODE_ENV === 'development') {
        console.warn('Using fallback image URL in development mode due to wallet key parsing error');
        return json({
          success: true,
          url: 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ',
          fallback: true
        });
      }

      return json({
        success: false,
        error: 'Server configuration error: Invalid Arweave wallet key format'
      }, { status: 500 });
    }

    // Create transaction
    let transaction;
    try {
      console.log('Creating Arweave transaction...');
      transaction = await arweave.createTransaction({ data: buffer }, wallet);
      console.log('Transaction created successfully');

      // Add tags
      transaction.addTag('Content-Type', contentType);
      transaction.addTag('App-Name', 'ArtRegistryConsortium');
      console.log('Tags added to transaction');

      // Sign transaction
      console.log('Signing transaction...');
      await arweave.transactions.sign(transaction, wallet);
      console.log('Transaction signed successfully');

      // Submit transaction
      console.log('Submitting transaction to Arweave...');
      const response = await arweave.transactions.post(transaction);
      console.log('Transaction submission response:', response.status, response.statusText);

      if (response.status !== 200 && response.status !== 202) {
        console.error('Failed to submit transaction:', response.statusText);

        if (env.NODE_ENV === 'development') {
          console.warn('Using fallback image URL in development mode due to transaction submission failure');
          return json({
            success: true,
            url: 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ',
            fallback: true
          });
        }

        return json({
          success: false,
          error: 'Failed to upload to Arweave: ' + response.statusText
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error during Arweave transaction process:', error);

      if (env.NODE_ENV === 'development') {
        console.warn('Using fallback image URL in development mode due to transaction error');
        return json({
          success: true,
          url: 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ',
          fallback: true
        });
      }

      return json({
        success: false,
        error: 'Error processing Arweave transaction: ' + (error instanceof Error ? error.message : 'Unknown error')
      }, { status: 500 });
    }

    // Get transaction ID and construct URL
    const transactionId = transaction.id;
    const arweaveUrl = `https://arweave.net/${transactionId}`;

    console.log('Arweave upload complete:', arweaveUrl);

    return json({
      success: true,
      url: arweaveUrl
    });
  } catch (error) {
    console.error('Error in Arweave upload API:', error);

    // In development mode, return a fallback URL if upload fails
    if (env.NODE_ENV === 'development') {
      console.warn('Using fallback image URL in development mode due to general error');
      return json({
        success: true,
        url: 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ',
        fallback: true
      });
    }

    // Provide more detailed error information
    let errorMessage = 'Unknown error during upload';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error details:', error.stack);
    }

    return json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
};
