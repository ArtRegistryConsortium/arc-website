import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabase/server';
import { JsonRpcProvider, Contract, Wallet } from 'ethers';
import { env } from '$env/dynamic/private';
import type { Address } from 'viem';

// ABI for the ART Factory contract's deployArtContract function
const ART_FACTORY_ABI = [
  "function deployArtContract(uint256 artistIdentityId, string symbol) external returns (address)"
];

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get request data
    const requestData = await request.json();
    console.log('Received ART contract deployment request:', requestData);

    const {
      walletAddress,
      identityId,
      symbol,
      chainId,
      transactionHash
    } = requestData;

    // Validate required fields
    if (!walletAddress || !identityId || !symbol || !chainId || !transactionHash) {
      return json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Get chain information
    const { data: chain, error: chainError } = await supabaseAdmin
      .from('chains')
      .select('*')
      .eq('chain_id', chainId)
      .single();

    if (chainError) {
      console.error('Error fetching chain information:', chainError);
      return json({
        success: false,
        error: 'Chain not found'
      }, { status: 404 });
    }

    // Get contract information
    const { data: contract, error: contractError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('chain_id', chainId)
      .single();

    if (contractError) {
      console.error('Error fetching contract information:', contractError);
      return json({
        success: false,
        error: 'Contract not found for the specified chain'
      }, { status: 404 });
    }

    // Get identity information
    const { data: identity, error: identityError } = await supabaseAdmin
      .from('identities')
      .select('*')
      .eq('id', identityId)
      .eq('chain_id', chainId)
      .single();

    if (identityError) {
      console.error('Error fetching identity information:', identityError);
      return json({
        success: false,
        error: 'Identity not found'
      }, { status: 404 });
    }

    // Verify that the identity belongs to the wallet
    if (identity.wallet_address !== walletAddress) {
      return json({
        success: false,
        error: 'Identity does not belong to the wallet'
      }, { status: 403 });
    }

    // Verify that the identity is of type 'artist'
    if (identity.type !== 'artist') {
      return json({
        success: false,
        error: 'Only artist identities can deploy ART contracts'
      }, { status: 403 });
    }

    // Create a provider
    const provider = new JsonRpcProvider(chain.rpc_url);

    // Create a contract instance
    const artFactoryContract = new Contract(
      contract.art_factory_contract_address,
      ART_FACTORY_ABI,
      provider
    );

    // Get the transaction receipt to extract the contract address
    const receipt = await provider.getTransactionReceipt(transactionHash);

    if (!receipt) {
      return json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Extract the contract address from the logs
    // This is a simplified approach - in a production environment, you would parse the logs
    // to find the ArtContractDeployed event and extract the contract address
    let contractAddress: Address | null = null;

    // For now, we'll use a placeholder approach
    // In a real implementation, you would parse the logs to find the ArtContractDeployed event
    // and extract the contract address from it

    // Create a wallet to sign transactions
    const wallet = new Wallet(env.PRIVATE_KEY, provider);

    // Call the contract to get the deployed contract address
    // This is a workaround - in a real implementation, you would parse the logs
    const deployedContracts = await artFactoryContract.connect(wallet).getArtContractsByArtist(identityId);

    if (deployedContracts.length === 0) {
      return json({
        success: false,
        error: 'No deployed contracts found for the artist'
      }, { status: 404 });
    }

    // Use the most recently deployed contract
    contractAddress = deployedContracts[deployedContracts.length - 1];

    console.log('Extracted contract address:', contractAddress);

    // Create a record in the art_contracts table
    const { data: artContract, error: artContractError } = await supabaseAdmin
      .from('art_contracts')
      .insert({
        contract_address: contractAddress,
        identity_id: identityId,
        chain_id: chainId
      })
      .select()
      .single();

    if (artContractError) {
      console.error('Error creating art contract record:', artContractError);
      return json({
        success: false,
        error: 'Failed to create art contract record'
      }, { status: 500 });
    }

    return json({
      success: true,
      contractAddress,
      artContract
    });
  } catch (error) {
    console.error('Server error deploying ART contract:', error);
    return json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
};
