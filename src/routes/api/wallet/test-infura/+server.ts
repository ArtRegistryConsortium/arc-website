import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

/**
 * API endpoint to test Infura connection
 * This is for development/testing purposes only and should be removed in production
 */
export const GET: RequestHandler = async () => {
  try {
    const results = [];
    
    // Check if Infura API key is set
    const infuraApiKey = env.INFURA_API_KEY;
    results.push(`Infura API Key: ${infuraApiKey ? '✓ Found' : '✗ Missing'}`);
    
    // Check if Infura URL is set
    const infuraUrl = env.INFURA_URL;
    results.push(`Infura URL: ${infuraUrl ? '✓ Found' : '✗ Missing'}`);
    
    if (!infuraUrl) {
      return json({ 
        success: false, 
        message: 'Infura URL is not configured',
        results
      });
    }
    
    // Create a test client
    const testClient = createPublicClient({
      chain: mainnet,
      transport: http(infuraUrl)
    });
    
    // Try to get the latest block number
    const blockNumber = await testClient.getBlockNumber();
    results.push(`Connected to Infura successfully!`);
    results.push(`Current block number: ${blockNumber.toString()}`);
    
    // Try to get gas price
    const gasPrice = await testClient.getGasPrice();
    results.push(`Current gas price: ${gasPrice.toString()} wei`);
    
    return json({ 
      success: true, 
      message: 'Infura connection test successful',
      blockNumber: blockNumber.toString(),
      gasPrice: gasPrice.toString(),
      results
    });
  } catch (error) {
    console.error('Error testing Infura connection:', error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to Infura'
    }, { status: 500 });
  }
};
