import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import Arweave from 'arweave';
import { env } from '$env/dynamic/private';
import { supabaseAdmin } from '$lib/supabase/server';

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

// Rate limiting for Arweave uploads has been removed

/**
 * API endpoint to upload an image to Arweave
 * This keeps the Arweave wallet key secure on the server
 */
export const POST: RequestHandler = async (event) => {
  const { request } = event;
  let userWalletAddress: string | undefined;

  try {
    // Get the image data and wallet address from the request
    const { imageData, walletAddress } = await request.json();

    console.log('Received upload request with wallet address:', walletAddress);

    if (!imageData) {
      return json({
        success: false,
        error: 'Image data is required'
      }, { status: 400 });
    }

    // Store walletAddress in a variable accessible to all scopes
    userWalletAddress = walletAddress;

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
        const fallbackUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';

        // Save the fallback URL and wallet address to the database if a wallet address was provided
        if (userWalletAddress) {
          try {
            const { data, error } = await supabaseAdmin
              .from('arweave_uploads')
              .insert({
                url: fallbackUrl,
                wallet_address: userWalletAddress
              });

            if (error) {
              console.error('Error saving fallback Arweave upload to database:', error);
              // Continue with the response even if database save fails
            } else {
              console.log('Fallback Arweave upload saved to database successfully');
            }
          } catch (dbError) {
            console.error('Exception when saving fallback Arweave upload to database:', dbError);
            // Continue with the response even if database save fails
          }
        }

        return json({
          success: true,
          url: fallbackUrl,
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
      // The wallet key should be a JSON string, parse it to get the wallet object
      console.log('Attempting to parse wallet key as JSON');
      // Check if the wallet key is empty or undefined
      if (!walletKey || walletKey.trim() === '') {
        console.error('Wallet key is empty or undefined');
        throw new Error('Empty wallet key');
      }

      // Log the length and first few characters of the key for debugging (don't log the full key for security)
      console.log(`Wallet key length: ${walletKey.length}, starts with: ${walletKey.substring(0, 15)}...`);

      // Try to parse the wallet key
      try {
        wallet = JSON.parse(walletKey);
      } catch (parseError) {
        console.error('JSON parse error:', parseError instanceof Error ? parseError.message : 'Unknown parse error');
        // If the key is very long, it might be double-encoded
        if (walletKey.startsWith('"') && walletKey.endsWith('"')) {
          console.log('Attempting to parse double-encoded JSON...');
          // Try to remove the extra quotes and parse again
          const unescaped = walletKey.slice(1, -1).replace(/\\(.)/g, '$1');
          wallet = JSON.parse(unescaped);
        } else {
          throw parseError;
        }
      }

      console.log('Wallet key processed successfully, type:', typeof wallet);
    } catch (error) {
      console.error('Error processing Arweave wallet key:', error);

      // Use fallback in development mode or if ALLOW_FALLBACK_IN_PRODUCTION is set
      const allowFallbackInProduction = env.ALLOW_FALLBACK_IN_PRODUCTION === 'true';

      if (env.NODE_ENV === 'development' || allowFallbackInProduction) {
        console.warn(`Using fallback image URL due to wallet key processing error (in ${env.NODE_ENV} mode)`);
        const fallbackUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';

        // Save the fallback URL and wallet address to the database if a wallet address was provided
        if (userWalletAddress) {
          try {
            const { data, error } = await supabaseAdmin
              .from('arweave_uploads')
              .insert({
                url: fallbackUrl,
                wallet_address: userWalletAddress
              });

            if (error) {
              console.error('Error saving fallback Arweave upload to database:', error);
              // Continue with the response even if database save fails
            } else {
              console.log('Fallback Arweave upload saved to database successfully');
            }
          } catch (dbError) {
            console.error('Exception when saving fallback Arweave upload to database:', dbError);
            // Continue with the response even if database save fails
          }
        }

        return json({
          success: true,
          url: fallbackUrl,
          fallback: true
        });
      }

      return json({
        success: false,
        error: 'Server configuration error: Invalid Arweave wallet key format. Please check server logs.'
      }, { status: 500 });
    }

    // Create transaction
    let transaction;
    try {
      console.log('Creating Arweave transaction...');
      console.log('Wallet object type:', typeof wallet);
      console.log('Wallet object has keys:', wallet ? Object.keys(wallet).join(', ') : 'null');
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
          const fallbackUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';

          // Save the fallback URL and wallet address to the database if a wallet address was provided
          if (userWalletAddress) {
            try {
              const { data, error } = await supabaseAdmin
                .from('arweave_uploads')
                .insert({
                  url: fallbackUrl,
                  wallet_address: userWalletAddress
                });

              if (error) {
                console.error('Error saving fallback Arweave upload to database:', error);
                // Continue with the response even if database save fails
              } else {
                console.log('Fallback Arweave upload saved to database successfully');
              }
            } catch (dbError) {
              console.error('Exception when saving fallback Arweave upload to database:', dbError);
              // Continue with the response even if database save fails
            }
          }

          return json({
            success: true,
            url: fallbackUrl,
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

      // Use fallback in development mode or if ALLOW_FALLBACK_IN_PRODUCTION is set
      const allowFallbackInProduction = env.ALLOW_FALLBACK_IN_PRODUCTION === 'true';

      if (env.NODE_ENV === 'development' || allowFallbackInProduction) {
        console.warn(`Using fallback image URL due to transaction error (in ${env.NODE_ENV} mode)`);
        const fallbackUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';

        // Save the fallback URL and wallet address to the database if a wallet address was provided
        if (userWalletAddress) {
          try {
            const { data, error } = await supabaseAdmin
              .from('arweave_uploads')
              .insert({
                url: fallbackUrl,
                wallet_address: userWalletAddress
              });

            if (error) {
              console.error('Error saving fallback Arweave upload to database:', error);
              // Continue with the response even if database save fails
            } else {
              console.log('Fallback Arweave upload saved to database successfully');
            }
          } catch (dbError) {
            console.error('Exception when saving fallback Arweave upload to database:', dbError);
            // Continue with the response even if database save fails
          }
        }

        return json({
          success: true,
          url: fallbackUrl,
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

    // Save the URL and wallet address to the database if a wallet address was provided
    if (userWalletAddress) {
      try {
        const { data, error } = await supabaseAdmin
          .from('arweave_uploads')
          .insert({
            url: arweaveUrl,
            wallet_address: userWalletAddress
          });

        if (error) {
          console.error('Error saving Arweave upload to database:', error);
          // Continue with the response even if database save fails
        } else {
          console.log('Arweave upload saved to database successfully');
        }
      } catch (dbError) {
        console.error('Exception when saving Arweave upload to database:', dbError);
        // Continue with the response even if database save fails
      }
    } else {
      console.log('No wallet address provided, skipping database save');
    }

    return json({
      success: true,
      url: arweaveUrl
    });
  } catch (error) {
    console.error('Error in Arweave upload API:', error);

    // Use fallback in development mode or if ALLOW_FALLBACK_IN_PRODUCTION is set
    const allowFallbackInProduction = env.ALLOW_FALLBACK_IN_PRODUCTION === 'true';

    if (env.NODE_ENV === 'development' || allowFallbackInProduction) {
      console.warn(`Using fallback image URL due to general error (in ${env.NODE_ENV} mode)`);
      const fallbackUrl = 'https://arweave.net/hbBeH-lC5iZOqUkCh6kVKEN_3bAwstkYD-7VCPgwSIQ';

      // Save the fallback URL and wallet address to the database if a wallet address was provided
      if (userWalletAddress) {
        try {
          const { data, error } = await supabaseAdmin
            .from('arweave_uploads')
            .insert({
              url: fallbackUrl,
              wallet_address: userWalletAddress
            });

          if (error) {
            console.error('Error saving fallback Arweave upload to database:', error);
            // Continue with the response even if database save fails
          } else {
            console.log('Fallback Arweave upload saved to database successfully');
          }
        } catch (dbError) {
          console.error('Exception when saving fallback Arweave upload to database:', dbError);
          // Continue with the response even if database save fails
        }
      }

      return json({
        success: true,
        url: fallbackUrl,
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
