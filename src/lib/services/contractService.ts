/**
 * Service for fetching contract information
 */

/**
 * Interface for contract information
 */
export interface ContractInfo {
  identity_contract_address: string;
  art_factory_contract_address: string;
  art_contract_address: string;
  chain_id: number;
}

/**
 * Fetches contract information for a specific chain
 * @param chainId The chain ID
 * @returns The contract information or null if not found
 */
export async function getContractInfo(chainId: number): Promise<ContractInfo | null> {
  try {
    console.log('Fetching contract info for chain ID:', chainId);

    const response = await fetch(`/api/contracts?chainId=${chainId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Contract info result:', result);

    if (!result.success || !result.contract) {
      return null;
    }

    return result.contract as ContractInfo;
  } catch (error) {
    console.error('Failed to fetch contract info:', error);
    return null;
  }
}

// Identity contract ABI
export const IDENTITY_ABI = [
  // createIdentity function
  {
    "inputs": [
      { "internalType": "uint8", "name": "identityType", "type": "uint8" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "identityImage", "type": "string" },
      { "internalType": "string", "name": "links", "type": "string" },
      { "internalType": "string[]", "name": "tags", "type": "string[]" },
      { "internalType": "uint256", "name": "dob", "type": "uint256" },
      { "internalType": "uint256", "name": "dod", "type": "uint256" },
      { "internalType": "string", "name": "location", "type": "string" },
      { "internalType": "string", "name": "addresses", "type": "string" },
      { "internalType": "string", "name": "representedBy", "type": "string" },
      { "internalType": "string", "name": "representedArtists", "type": "string" }
    ],
    "name": "createIdentity",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // updateIdentity function
  {
    "inputs": [
      { "internalType": "uint256", "name": "identityId", "type": "uint256" },
      { "internalType": "uint8", "name": "identityType", "type": "uint8" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "string", "name": "identityImage", "type": "string" },
      { "internalType": "string", "name": "links", "type": "string" },
      { "internalType": "string[]", "name": "tags", "type": "string[]" },
      { "internalType": "uint256", "name": "dob", "type": "uint256" },
      { "internalType": "uint256", "name": "dod", "type": "uint256" },
      { "internalType": "string", "name": "location", "type": "string" },
      { "internalType": "string", "name": "addresses", "type": "string" },
      { "internalType": "string", "name": "representedBy", "type": "string" },
      { "internalType": "string", "name": "representedArtists", "type": "string" }
    ],
    "name": "updateIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getIdentityByAddress function
  {
    "inputs": [
      { "internalType": "address", "name": "walletAddress", "type": "address" }
    ],
    "name": "getIdentityByAddress",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "uint8", "name": "identityType", "type": "uint8" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "identityImage", "type": "string" },
          { "internalType": "string", "name": "links", "type": "string" },
          { "internalType": "string[]", "name": "tags", "type": "string[]" },
          { "internalType": "uint256", "name": "dob", "type": "uint256" },
          { "internalType": "uint256", "name": "dod", "type": "uint256" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "addresses", "type": "string" },
          { "internalType": "string", "name": "representedBy", "type": "string" },
          { "internalType": "string", "name": "representedArtists", "type": "string" }
        ],
        "internalType": "struct IIdentity.Identity",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getIdentityById function
  {
    "inputs": [
      { "internalType": "uint256", "name": "identityId", "type": "uint256" }
    ],
    "name": "getIdentityById",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "uint8", "name": "identityType", "type": "uint8" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "identityImage", "type": "string" },
          { "internalType": "string", "name": "links", "type": "string" },
          { "internalType": "string[]", "name": "tags", "type": "string[]" },
          { "internalType": "uint256", "name": "dob", "type": "uint256" },
          { "internalType": "uint256", "name": "dod", "type": "uint256" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "addresses", "type": "string" },
          { "internalType": "string", "name": "representedBy", "type": "string" },
          { "internalType": "string", "name": "representedArtists", "type": "string" }
        ],
        "internalType": "struct IIdentity.Identity",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getAllIdentities function
  {
    "inputs": [],
    "name": "getAllIdentities",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "walletAddress", "type": "address" },
          { "internalType": "uint8", "name": "identityType", "type": "uint8" },
          { "internalType": "string", "name": "name", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "identityImage", "type": "string" },
          { "internalType": "string", "name": "links", "type": "string" },
          { "internalType": "string[]", "name": "tags", "type": "string[]" },
          { "internalType": "uint256", "name": "dob", "type": "uint256" },
          { "internalType": "uint256", "name": "dod", "type": "uint256" },
          { "internalType": "string", "name": "location", "type": "string" },
          { "internalType": "string", "name": "addresses", "type": "string" },
          { "internalType": "string", "name": "representedBy", "type": "string" },
          { "internalType": "string", "name": "representedArtists", "type": "string" }
        ],
        "internalType": "struct IIdentity.Identity[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // getIdentityCount function
  {
    "inputs": [],
    "name": "getIdentityCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  // IdentityCreated event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "walletAddress", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "identityType", "type": "uint8" }
    ],
    "name": "IdentityCreated",
    "type": "event"
  },
  // IdentityUpdated event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "walletAddress", "type": "address" }
    ],
    "name": "IdentityUpdated",
    "type": "event"
  }
];
