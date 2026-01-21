/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Solana Network Configurations
 * Contains RPC endpoints and network-specific settings for Jupiter
 */

export interface NetworkConfig {
  name: string;
  rpcEndpoint: string;
  wsEndpoint: string;
  explorerUrl: string;
  jupiterApiUrl: string;
  priceApiUrl: string;
  tokenListUrl: string;
  chainId: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Solana Mainnet',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com',
    wsEndpoint: 'wss://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    jupiterApiUrl: 'https://quote-api.jup.ag/v6',
    priceApiUrl: 'https://price.jup.ag/v6',
    tokenListUrl: 'https://token.jup.ag/all',
    chainId: 'mainnet-beta',
  },
  devnet: {
    name: 'Solana Devnet',
    rpcEndpoint: 'https://api.devnet.solana.com',
    wsEndpoint: 'wss://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com?cluster=devnet',
    jupiterApiUrl: 'https://quote-api.jup.ag/v6',
    priceApiUrl: 'https://price.jup.ag/v6',
    tokenListUrl: 'https://token.jup.ag/all',
    chainId: 'devnet',
  },
};

/**
 * Jupiter API Endpoints
 */
export const JUPITER_ENDPOINTS = {
  // Quote API
  QUOTE_API: 'https://quote-api.jup.ag/v6',
  
  // Price API
  PRICE_API: 'https://price.jup.ag/v6',
  
  // Token API
  TOKEN_API: 'https://token.jup.ag',
  
  // Stats API
  STATS_API: 'https://stats.jup.ag',
  
  // Limit Order API
  LIMIT_ORDER_API: 'https://jup.ag/api/limit/v1',
  
  // DCA API
  DCA_API: 'https://dca-api.jup.ag',
  
  // Perpetuals API
  PERP_API: 'https://perp-api.jup.ag',
  
  // JLP API
  JLP_API: 'https://jlp-api.jup.ag',
  
  // Governance API
  GOVERNANCE_API: 'https://governance-api.jup.ag',
  
  // Referral API
  REFERRAL_API: 'https://referral-api.jup.ag',
  
  // Ultra API
  ULTRA_API: 'https://ultra-api.jup.ag',
};

/**
 * Default commitment levels
 */
export const COMMITMENT_LEVELS = ['processed', 'confirmed', 'finalized'] as const;
export type CommitmentLevel = (typeof COMMITMENT_LEVELS)[number];

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  commitment: 'confirmed' as CommitmentLevel,
  skipPreflight: false,
  maxRetries: 3,
  confirmRetries: 30,
  confirmRetryDelay: 1000,
  timeout: 30000,
};

/**
 * Rate limit configurations by tier
 */
export const RATE_LIMITS = {
  free: {
    requestsPerSecond: 10,
    requestsPerMinute: 600,
  },
  basic: {
    requestsPerSecond: 50,
    requestsPerMinute: 3000,
  },
  pro: {
    requestsPerSecond: 200,
    requestsPerMinute: 12000,
  },
  enterprise: {
    requestsPerSecond: 1000,
    requestsPerMinute: 60000,
  },
};

/**
 * Solana constants
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Jupiter API URL
 */
export const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

/**
 * Jupiter Program IDs
 */
export const JUPITER_PROGRAM_IDS = {
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  LIMIT_ORDER: 'j1o2qRpjcyUwEvwtcfhS9NCHT98t5XphAoHGpPmS2u2',
  DCA: 'DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M',
  PERPETUALS: 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu',
  JLP: 'JLPmnnnZ37pMmqaWtHrVb2TJP7Wphw3eJDPJyT7m9ux',
  GOVERNANCE: 'GovHgfDPyQ1GwazJTDY2avSVY8GGcpmCapmmCsymRaGe',
  VOTE_ESCROW: 'voTpe3tHQ7AjQHMapgSue2HJFAh2cGsdokqN3XqmVSj',
  REFERRAL: 'REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3',
};

export default NETWORKS;
