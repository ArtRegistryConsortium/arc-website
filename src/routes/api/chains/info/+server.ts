import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';

/**
 * API endpoint to fetch information about a specific chain
 */
export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get chain ID from query parameter
    const chainId = url.searchParams.get('chainId');
    
    if (!chainId) {
      return json({ 
        success: false, 
        error: 'Chain ID is required' 
      }, { status: 400 });
    }
    
    // Get chain information from the database
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', chainId)
      .single();

    if (chainError) {
      console.error('Error fetching chain information:', chainError);
      
      // If the chain is not found, return a default mapping for common chains
      const defaultChains: Record<string, { name: string, icon_url: string }> = {
        '1': { 
          name: 'Ethereum', 
          icon_url: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png' 
        },
        '10': { 
          name: 'Optimism', 
          icon_url: 'https://optimism.io/assets/images/red-op.svg' 
        },
        '42161': { 
          name: 'Arbitrum', 
          icon_url: 'https://arbitrum.io/wp-content/uploads/2023/03/cropped-Arbitrum_Favicon-32x32.png' 
        },
        '8453': { 
          name: 'Base', 
          icon_url: 'https://base.org/favicon.ico' 
        },
        '11155111': { 
          name: 'Sepolia', 
          icon_url: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png' 
        }
      };
      
      if (defaultChains[chainId]) {
        return json({
          success: true,
          chain: {
            chain_id: parseInt(chainId),
            ...defaultChains[chainId]
          }
        });
      }
      
      return json({ 
        success: false, 
        error: 'Chain not found' 
      }, { status: 404 });
    }

    return json({
      success: true,
      chain
    });
  } catch (error) {
    console.error('Server error fetching chain information:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};
