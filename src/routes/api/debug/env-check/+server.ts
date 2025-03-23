import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Debug endpoint to check if environment variables are loaded correctly
 * This should only be used during development and removed in production
 */
export const GET: RequestHandler = async () => {
  // Only allow this endpoint in development mode
  if (env.NODE_ENV !== 'development') {
    return json({
      success: false,
      error: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }

  try {
    // Check for Arweave-related environment variables
    const envVars = {
      NODE_ENV: env.NODE_ENV || 'not set',
      ARWEAVE_GATEWAY_URL: env.ARWEAVE_GATEWAY_URL ? 'set' : 'not set',
      ARWEAVE_WALLET_KEY: env.ARWEAVE_WALLET_KEY ? 'exists (not showing for security)' : 'not set',
      ARWEAVE_RATE_LIMIT_MAX: env.ARWEAVE_RATE_LIMIT_MAX || 'not set',
      ARWEAVE_RATE_LIMIT_WINDOW_HOURS: env.ARWEAVE_RATE_LIMIT_WINDOW_HOURS || 'not set'
    };

    // Check if wallet key is valid JSON (without revealing the key)
    let walletKeyValid = false;
    if (env.ARWEAVE_WALLET_KEY) {
      try {
        const parsed = JSON.parse(env.ARWEAVE_WALLET_KEY);
        walletKeyValid = typeof parsed === 'object' && parsed !== null;
      } catch (e) {
        walletKeyValid = false;
      }
    }

    return json({
      success: true,
      environment: envVars,
      walletKeyValid,
      message: 'This is a debug endpoint to check environment variables. Do not use in production.'
    });
  } catch (error) {
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error checking environment variables'
    }, { status: 500 });
  }
};
