// NEAR Network Configuration

export type NetworkId = 'mainnet' | 'testnet';

// Selected network - change this to 'mainnet' for production
export const NETWORK_ID: NetworkId = 'testnet';

// Contract configuration
export const CONTRACTS = {
  mainnet: {
    // Add your mainnet contract addresses here
  },
  testnet: {
    // Add your testnet contract addresses here
  },
};

// RPC endpoints
export const RPC_ENDPOINTS = {
  mainnet: 'https://rpc.mainnet.near.org',
  testnet: 'https://rpc.testnet.near.org',
};

// Explorer URLs
export const EXPLORER_URLS = {
  mainnet: 'https://nearblocks.io',
  testnet: 'https://testnet.nearblocks.io',
};