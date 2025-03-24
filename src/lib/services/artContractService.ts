import type { Address } from 'viem';
import { writeContract, readContract, waitForTransaction } from 'wagmi/actions';
import { config } from '$lib/web3/config';
import { getContractInfo } from './contractService';

/**
 * Interface for ART contract deployment request
 */
export interface DeployArtContractRequest {
  walletAddress: Address;
  identityId: number;
  symbol: string;
  chainId: number;
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

    // Deploy the ART contract
    // Ensure identityId is a valid BigInt
    let identityId;
    try {
      identityId = BigInt(request.identityId);
    } catch (error) {
      console.error('Error converting identityId to BigInt:', error);
      return {
        success: false,
        error: `Invalid identity ID: ${request.identityId}. Cannot convert to BigInt.`
      };
    }

    const { hash } = await writeContract(config, {
      address: contractInfo.art_factory_contract_address as Address,
      abi: ART_FACTORY_ABI,
      functionName: 'deployArtContract',
      args: [identityId, request.symbol],
      chainId: request.chainId
    });

    console.log('ART contract deployment transaction hash:', hash);

    // Wait for the transaction to be mined
    const receipt = await waitForTransaction(config, {
      hash,
      chainId: request.chainId
    });

    console.log('ART contract deployment transaction receipt:', receipt);

    // Extract the contract address from the transaction receipt
    // This would typically be done by parsing the logs for the ArtContractDeployed event
    // For now, we'll use the server-side API to get the contract address

    // Call the server-side API to record the deployment and get the contract address
    const response = await fetch('/api/contracts/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress: request.walletAddress,
        identityId: request.identityId,
        symbol: request.symbol,
        chainId: request.chainId,
        transactionHash: hash
      })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
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
export async function getArtContractsByArtist(artistIdentityId: number, chainId: number): Promise<Address[]> {
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
export async function getArtContractInfo(contractAddress: Address, chainId: number): Promise<ArtContractInfo | null> {
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
