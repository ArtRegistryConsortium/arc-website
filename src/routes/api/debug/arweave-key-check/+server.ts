import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Debug endpoint to check if the Arweave wallet key is properly formatted
 * This should only be used during development and removed in production
 */
export const GET: RequestHandler = async () => {
  // Only allow this endpoint in development mode or if explicitly enabled
  const allowInProduction = env.ALLOW_DEBUG_ENDPOINTS === 'true';
  if (env.NODE_ENV !== 'development' && !allowInProduction) {
    return json({
      success: false,
      error: 'This endpoint is only available in development mode or when explicitly enabled'
    }, { status: 403 });
  }

  try {
    // Check if the wallet key exists
    const walletKey = env.ARWEAVE_WALLET_KEY;
    
    if (!walletKey) {
      return json({
        success: false,
        error: 'ARWEAVE_WALLET_KEY is not set'
      }, { status: 404 });
    }

    // Check the format of the wallet key
    const keyInfo = {
      length: walletKey.length,
      firstChars: walletKey.substring(0, 10) + '...',
      lastChars: '...' + walletKey.substring(walletKey.length - 10),
      startsWithQuote: walletKey.startsWith('"'),
      endsWithQuote: walletKey.endsWith('"'),
      startsWithBrace: walletKey.trim().startsWith('{'),
      endsWithBrace: walletKey.trim().endsWith('}'),
      containsEscapedQuotes: walletKey.includes('\\"'),
      isValidJSON: false,
      jsonParseError: null,
      keysIfObject: null
    };

    // Try to parse the wallet key
    try {
      const parsed = JSON.parse(walletKey);
      keyInfo.isValidJSON = true;
      
      if (typeof parsed === 'object' && parsed !== null) {
        keyInfo.keysIfObject = Object.keys(parsed);
      }
    } catch (error) {
      keyInfo.jsonParseError = error instanceof Error ? error.message : 'Unknown error';
      
      // Try to parse with double-encoding handling
      if (walletKey.startsWith('"') && walletKey.endsWith('"')) {
        try {
          const unescaped = walletKey.slice(1, -1).replace(/\\(.)/g, '$1');
          const parsed = JSON.parse(unescaped);
          keyInfo.isValidJSON = true;
          keyInfo.keysIfObject = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : null;
        } catch (innerError) {
          // Still not valid JSON even after unescaping
        }
      }
    }

    return json({
      success: true,
      keyInfo
    });
  } catch (error) {
    console.error('Error in Arweave key check API:', error);
    
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
