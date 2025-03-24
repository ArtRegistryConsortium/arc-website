// This script calculates the keccak256 hash of an event signature
// Usage: node calculate-event-signature.mjs

import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';

// The event signature string
const eventSignature = 'ArtContractDeployed(address,uint256)';

// Calculate the keccak256 hash
const hash = keccak256(toUtf8Bytes(eventSignature));

console.log(`Event signature: ${eventSignature}`);
console.log(`Keccak256 hash: ${hash}`);
