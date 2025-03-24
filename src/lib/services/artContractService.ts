import type { Address } from 'viem';
import { writeContract, readContract, waitForTransaction } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { getContractInfo } from './contractService';

// Add ChainId type
type ChainId = 1 | 11155111 | 10 | 42161 | 421614 | 8453;

/**
 * Interface for ART contract deployment request
 */
export interface DeployArtContractRequest {
  walletAddress: Address;
  identityId: number;
  symbol: string;
  chainId: ChainId;
}

/**
 * Interface for ART contract deployment response
 */
export interface DeployArtContractResponse {
  success: boolean;
  contractAddress?: Address;
  transactionHash?: string;
  error?: string;
}

/**
 * Interface for ART contract information
 */
export interface ArtContractInfo {
  address: Address;
  artistIdentityId: number;
  name: string;
  symbol: string;
  chainId: number;
  deployedAt: string;
}

// ART Factory contract ABI
export const ART_FACTORY_ABI = [
  // deployArtContract function
  {
    "inputs": [
      { "internalType": "uint256", "name": "artistIdentityId", "type": "uint256" },
      { "internalType": "string", "name": "symbol", "type": "string" }
    ],
    "name": "deployArtContract",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getArtContractsByArtist function
  {
    "inputs": [
      { "internalType": "uint256", "name": "artistIdentityId", "type": "uint256" }
    ],
    "name": "getArtContractsByArtist",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  // getAllArtContracts function
  {
    "inputs": [],
    "name": "getAllArtContracts",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  // getArtContractCount function
  {
    "inputs": [],
    "name": "getArtContractCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // ArtContractDeployed event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "artContractAddress", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "artistIdentityId", "type": "uint256" }
    ],
    "name": "ArtContractDeployed",
    "type": "event"
  }
];

// Event signature for ArtContractDeployed event
// This should match the one in the server-side code
export const ART_CONTRACT_DEPLOYED_EVENT_SIGNATURE = "0xb8404e00b0196506b8eed6392cd6195314860737075712144ba3ff6c5cfae465";

// ART Contract ABI (minimal for getting basic info)
export const ART_CONTRACT_ABI = [
  // name function
  {
    "inputs": [],
    "name": "name",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  // symbol function
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  // getArtistIdentityId function
  {
    "inputs": [],
    "name": "getArtistIdentityId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

/**
 * Deploys a new ART contract
 * @param request The deployment request
 * @returns The deployment response
 */
export async function deployArtContract(request: DeployArtContractRequest): Promise<DeployArtContractResponse> {
  try {
    console.log('Deploying ART contract with request:', request);

    // Get contract info for the chain
    const contractInfo = await getContractInfo(request.chainId);
    if (!contractInfo) {
      return {
        success: false,
        error: `No contract information found for chain ID ${request.chainId}`
      };
    }

    // Validate that art_factory_contract_address exists and is not empty
    if (!contractInfo.art_factory_contract_address) {
      console.error('ART Factory contract address is undefined or empty for chain ID:', request.chainId);
      return {
        success: false,
        error: `ART Factory contract address is not configured for chain ID ${request.chainId}`
      };
    }

    // Deploy the ART contract
    // Validate identityId before conversion
    if (request.identityId === undefined || request.identityId === null) {
      console.error('Identity ID is undefined or null');
      return {
        success: false,
        error: 'Identity ID is missing. Please select a valid identity.'
      };
    }

    // Ensure identityId is a valid BigInt
    let identityId;
    try {
      // Convert to number first to handle string inputs
      const numericId = Number(request.identityId);
      if (isNaN(numericId) || numericId <= 0) {
        throw new Error('Invalid numeric value');
      }
      identityId = BigInt(numericId);
      console.log('Successfully converted identity ID to BigInt:', identityId);
    } catch (error) {
      console.error('Error converting identityId to BigInt:', error, 'Value:', request.identityId, 'Type:', typeof request.identityId);
      return {
        success: false,
        error: `Invalid identity ID: ${request.identityId}. Cannot convert to BigInt.`
      };
    }

    // Log the contract address and parameters
    console.log('ART Factory contract address:', contractInfo.art_factory_contract_address);
    console.log('Identity ID (BigInt):', identityId);
    console.log('Symbol:', request.symbol);
    console.log('Chain ID:', request.chainId);

    // Prepare the contract parameters - use explicit types to avoid conversion issues
    const contractAddress = contractInfo.art_factory_contract_address as Address;
    const chainId = request.chainId as ChainId; // Ensure chainId is the correct type

    // Log the parameters with their types
    console.log('Contract parameters:', {
      address: contractAddress,
      addressType: typeof contractAddress,
      identityId: identityId.toString(),
      identityIdType: typeof identityId,
      symbol: request.symbol,
      symbolType: typeof request.symbol,
      chainId: chainId,
      chainIdType: typeof chainId
    });

    // Use try-catch to get more specific error information
    let hash: `0x${string}` | undefined;
    try {
      // Check if the contract address is valid
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        console.error('Invalid contract address:', contractAddress);
        return {
          success: false,
          error: 'Invalid ART Factory contract address'
        };
      }

      console.log('Calling writeContract with address:', contractAddress);
      const result = await writeContract(config, {
        address: contractAddress,
        abi: ART_FACTORY_ABI,
        functionName: 'deployArtContract',
        args: [identityId, request.symbol],
        chainId: chainId
      });

      console.log('writeContract returned result:', result);

      // Handle different return formats
      if (typeof result === 'string') {
        // If result is a string, it's likely the transaction hash directly
        hash = result as `0x${string}`;
      } else if (result && typeof result === 'object' && 'hash' in result) {
        // If result is an object with a hash property
        hash = (result as { hash: `0x${string}` }).hash;
      } else {
        console.error('writeContract returned invalid result:', result);
        return {
          success: false,
          error: 'Contract deployment failed: No transaction hash returned'
        };
      }

      console.log('Got transaction hash:', hash);
    } catch (error) {
      console.error('Error in writeContract:', error);
      // Try to extract more detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: `Failed to deploy contract: ${errorMessage}`
      };
    }

    console.log('ART contract deployment transaction hash:', hash);

    // Wait for the transaction to be mined
    let receipt;
    if (hash) {
      try {
        console.log('Waiting for transaction with hash:', hash);
        receipt = await waitForTransaction(config, {
          hash,
          chainId: chainId
        });
        console.log('Transaction confirmed with receipt:', receipt);
      } catch (error) {
        console.error('Error waiting for transaction:', error);
        // Continue with the process even if waiting fails
        // The transaction might still be successful

        // If the error is about converting to BigInt, the hash might be in the wrong format
        if (error instanceof Error && error.message.includes('BigInt')) {
          console.log('Trying to fix transaction hash format...');
          try {
            // Try to format the hash correctly if it's missing the 0x prefix
            const formattedHash = hash.startsWith('0x') ? hash : `0x${hash}` as `0x${string}`;
            console.log('Reformatted hash:', formattedHash);

            receipt = await waitForTransaction(config, {
              hash: formattedHash,
              chainId: chainId
            });
            console.log('Transaction confirmed with reformatted hash. Receipt:', receipt);
          } catch (retryError) {
            console.error('Error waiting for transaction with reformatted hash:', retryError);
          }
        }
      }
    } else {
      console.error('Transaction hash is undefined, cannot wait for transaction');
      // Return early with an error
      return {
        success: false,
        error: 'Failed to get transaction hash from contract deployment'
      };
    }

    console.log('ART contract deployment transaction receipt:', receipt);

    // If we have a transaction hash but no receipt, we can still return a partial success
    if (hash && !receipt) {
      console.log('Transaction was sent but receipt not available. Returning partial success.');
      return {
        success: true,
        transactionHash: hash,
        error: 'Transaction was sent, but receipt is not available yet. Check the blockchain explorer for confirmation.'
      };
    }

    // Extract the contract address from the transaction receipt
    // This would typically be done by parsing the logs for the ArtContractDeployed event
    // For now, we'll use the server-side API to get the contract address

    // Call the server-side API to record the deployment and get the contract address
    try {
      // Verify that we have a transaction hash
      if (!hash) {
        console.error('Cannot call API without a transaction hash');
        return {
          success: false,
          error: 'Transaction hash is required for API call'
        };
      }

      // Prepare the request payload
      const payload = {
        walletAddress: request.walletAddress,
        identityId: Number(request.identityId), // Ensure identityId is a number
        symbol: request.symbol,
        chainId: chainId, // Use the converted chainId
        transactionHash: hash
      };

      // Log the API request payload for debugging
      console.log('API request payload:', payload);
      console.log('API request payload JSON:', JSON.stringify(payload));

      // Add a delay to ensure the transaction has time to be processed
      console.log('Waiting 2 seconds before calling API to ensure transaction is processed...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Log the response status and headers
      console.log('API response status:', response.status);
      console.log('API response status text:', response.statusText);

      if (!response.ok) {
        // Get the response status and statusText
        console.error(`API error: ${response.status} ${response.statusText}`);

        // Clone the response before reading its body
        const responseClone = response.clone();

        // Try to get more details about the error
        try {
          const errorData = await response.json();
          console.error('API error details:', errorData);

          // Check if this is a server configuration error (private key issue)
          if (errorData.error && typeof errorData.error === 'string' &&
              (errorData.error.includes('invalid private key') ||
               errorData.error.includes('PRIVATE_KEY'))) {
            console.log('Server configuration error detected');

            // If we have a transaction hash, return a partial success
            if (hash) {
              return {
                success: true,
                transactionHash: hash,
                error: 'The server is not properly configured to complete this operation. Your transaction was sent, but contract details could not be recorded.'
              };
            }
          }

          return {
            success: false,
            error: errorData.error || `Server responded with status: ${response.status}`
          };
        } catch (parseError) {
          // If we can't parse the error response as JSON
          try {
            const errorText = await responseClone.text();
            console.error('API error text:', errorText);
            return {
              success: false,
              error: `Server responded with status: ${response.status}. Response: ${errorText}`
            };
          } catch (textError) {
            // If we can't read the response as text either
            return {
              success: false,
              error: `Server responded with status: ${response.status}`
            };
          }
        }
      }

      const result = await response.json();
      console.log('ART contract deployment result:', result);

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Unknown error'
        };
      }

      return {
        success: true,
        contractAddress: result.contractAddress,
        transactionHash: hash
      };
    } catch (error) {
      console.error('Error in API call:', error);
      // If we have a transaction hash but the API call failed, still return success
      // This allows the user to see the transaction hash even if the server-side processing failed
      if (hash) {
        return {
          success: true,
          transactionHash: hash,
          error: 'Transaction was sent, but there was an error recording it in the database.'
        };
      }
      throw error; // Re-throw if we don't have a hash
    }
  } catch (error) {
    console.error('Error deploying ART contract:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Gets all ART contracts for an artist
 * @param artistIdentityId The artist's identity ID
 * @param chainId The chain ID
 * @returns An array of ART contract addresses
 */
export async function getArtContractsByArtist(artistIdentityId: number, chainId: ChainId): Promise<Address[]> {
  try {
    console.log('Getting ART contracts for artist:', artistIdentityId, 'on chain:', chainId);

    // Get contract info for the chain
    const contractInfo = await getContractInfo(chainId);
    if (!contractInfo) {
      console.error(`No contract information found for chain ID ${chainId}`);
      return [];
    }

    // Call the getArtContractsByArtist function
    const contracts = await readContract(config, {
      address: contractInfo.art_factory_contract_address as Address,
      abi: ART_FACTORY_ABI,
      functionName: 'getArtContractsByArtist',
      args: [artistIdentityId],
      chainId
    });

    console.log('ART contracts for artist:', contracts);
    return contracts as Address[];
  } catch (error) {
    console.error('Error getting ART contracts for artist:', error);
    return [];
  }
}

/**
 * Gets information about an ART contract
 * @param contractAddress The ART contract address
 * @param chainId The chain ID
 * @returns The ART contract information
 */
export async function getArtContractInfo(contractAddress: Address, chainId: ChainId): Promise<ArtContractInfo | null> {
  try {
    console.log('Getting ART contract info for address:', contractAddress, 'on chain:', chainId);

    // Call the name function
    const name = await readContract(config, {
      address: contractAddress,
      abi: ART_CONTRACT_ABI,
      functionName: 'name',
      chainId
    });

    // Call the symbol function
    const symbol = await readContract(config, {
      address: contractAddress,
      abi: ART_CONTRACT_ABI,
      functionName: 'symbol',
      chainId
    });

    // Call the getArtistIdentityId function
    const artistIdentityId = await readContract(config, {
      address: contractAddress,
      abi: ART_CONTRACT_ABI,
      functionName: 'getArtistIdentityId',
      chainId
    });

    return {
      address: contractAddress,
      artistIdentityId: Number(artistIdentityId),
      name: name as string,
      symbol: symbol as string,
      chainId,
      deployedAt: new Date().toISOString() // This would ideally come from the database
    };
  } catch (error) {
    console.error('Error getting ART contract info:', error);
    return null;
  }
}

/**
 * Gets all ART contracts for a user from the database
 * @param walletAddress The wallet address
 * @returns An array of ART contract information
 */
export async function getUserArtContracts(walletAddress: Address): Promise<ArtContractInfo[]> {
  try {
    console.log('Getting ART contracts for user:', walletAddress);

    const response = await fetch('/api/contracts/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ walletAddress })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('User ART contracts result:', result);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch ART contracts');
    }

    return result.contracts;
  } catch (error) {
    console.error('Error fetching user ART contracts:', error);
    return [];
  }
}
