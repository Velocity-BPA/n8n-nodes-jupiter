/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * DEX (Decentralized Exchange) Information
 * Contains information about DEXes supported by Jupiter for routing
 */

export interface DexInfo {
  id: string;
  label: string;
  programId: string;
  type: 'amm' | 'clmm' | 'orderbook' | 'hybrid';
  website?: string;
  description?: string;
}

/**
 * Supported DEXes on Jupiter
 */
export const SUPPORTED_DEXES: Record<string, DexInfo> = {
  ORCA_WHIRLPOOL: {
    id: 'Whirlpool',
    label: 'Orca Whirlpool',
    programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    type: 'clmm',
    website: 'https://www.orca.so',
    description: 'Orca concentrated liquidity pools',
  },
  RAYDIUM_AMM: {
    id: 'Raydium',
    label: 'Raydium AMM',
    programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
    type: 'amm',
    website: 'https://raydium.io',
    description: 'Raydium constant product AMM',
  },
  RAYDIUM_CLMM: {
    id: 'Raydium CLMM',
    label: 'Raydium CLMM',
    programId: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
    type: 'clmm',
    website: 'https://raydium.io',
    description: 'Raydium concentrated liquidity market maker',
  },
  METEORA_DLMM: {
    id: 'Meteora DLMM',
    label: 'Meteora DLMM',
    programId: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
    type: 'clmm',
    website: 'https://meteora.ag',
    description: 'Meteora dynamic liquidity market maker',
  },
  METEORA_POOLS: {
    id: 'Meteora',
    label: 'Meteora Pools',
    programId: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
    type: 'amm',
    website: 'https://meteora.ag',
    description: 'Meteora standard pools',
  },
  PHOENIX: {
    id: 'Phoenix',
    label: 'Phoenix',
    programId: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
    type: 'orderbook',
    website: 'https://phoenix.trade',
    description: 'Phoenix on-chain order book',
  },
  LIFINITY: {
    id: 'Lifinity V2',
    label: 'Lifinity V2',
    programId: '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
    type: 'amm',
    website: 'https://lifinity.io',
    description: 'Lifinity proactive market maker',
  },
  OPENBOOK: {
    id: 'OpenBook',
    label: 'OpenBook',
    programId: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
    type: 'orderbook',
    website: 'https://openbookdex.com',
    description: 'OpenBook decentralized order book',
  },
  SABER: {
    id: 'Saber',
    label: 'Saber',
    programId: 'SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ',
    type: 'amm',
    website: 'https://saber.so',
    description: 'Saber stablecoin AMM',
  },
  MARINADE: {
    id: 'Marinade',
    label: 'Marinade',
    programId: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
    type: 'amm',
    website: 'https://marinade.finance',
    description: 'Marinade liquid staking',
  },
  SANCTUM: {
    id: 'Sanctum',
    label: 'Sanctum',
    programId: 'stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq',
    type: 'amm',
    website: 'https://sanctum.so',
    description: 'Sanctum LST router',
  },
  FLUXBEAM: {
    id: 'FluxBeam',
    label: 'FluxBeam',
    programId: 'FLUXubRmkEi2q6K3Y9kBPg9248ggaZVsoSFhtJHSrm1X',
    type: 'amm',
    description: 'FluxBeam AMM pools',
  },
  INVARIANT: {
    id: 'Invariant',
    label: 'Invariant',
    programId: 'HyaB3W9q6XdA5xwpU4XnSZV94htfmbmqJXZcEbRaJutt',
    type: 'clmm',
    website: 'https://invariant.app',
    description: 'Invariant concentrated liquidity',
  },
  GOOSEFX: {
    id: 'GooseFX',
    label: 'GooseFX',
    programId: 'GFXSwT6YHZLXoP7gRPqsjgBT17GdMNzWqjuKvaWyK7qU',
    type: 'hybrid',
    website: 'https://goosefx.io',
    description: 'GooseFX DEX and perps',
  },
  CREMA: {
    id: 'Crema',
    label: 'Crema',
    programId: 'CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR',
    type: 'clmm',
    website: 'https://crema.finance',
    description: 'Crema concentrated liquidity',
  },
  ALDRIN: {
    id: 'Aldrin',
    label: 'Aldrin',
    programId: 'AMM55ShdkoGRB5jVYPjWziwk8m5MpwyDgsMWHaMSQWH6',
    type: 'amm',
    website: 'https://aldrin.com',
    description: 'Aldrin AMM',
  },
  STEP: {
    id: 'Step',
    label: 'Step Finance',
    programId: 'STEPNq2UGeGSzCyGVr2nMQAzf8xuejwqebd84wcksCK',
    type: 'amm',
    website: 'https://step.finance',
    description: 'Step Finance pools',
  },
};

/**
 * DEX type descriptions
 */
export const DEX_TYPES = {
  amm: 'Automated Market Maker - Uses constant product formula (x*y=k)',
  clmm: 'Concentrated Liquidity Market Maker - Allows LPs to concentrate liquidity in price ranges',
  orderbook: 'Order Book - Matches buy and sell orders directly',
  hybrid: 'Hybrid - Combines multiple market making mechanisms',
};

/**
 * Get DEX IDs as array for filtering
 */
export const DEX_IDS = Object.values(SUPPORTED_DEXES).map((dex) => dex.id);

/**
 * DEX labels for display
 */
export const DEX_LABELS = Object.values(SUPPORTED_DEXES).reduce(
  (acc, dex) => {
    acc[dex.id] = dex.label;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * Popular DEX combinations for routing
 */
export const POPULAR_DEX_COMBINATIONS = {
  // High liquidity DEXes
  highLiquidity: ['Whirlpool', 'Raydium', 'Raydium CLMM', 'Meteora DLMM', 'Phoenix'],
  
  // Stablecoin optimized
  stablecoin: ['Saber', 'Whirlpool', 'Raydium CLMM', 'Meteora'],
  
  // LST optimized
  lst: ['Sanctum', 'Marinade', 'Whirlpool', 'Meteora DLMM'],
  
  // All DEXes
  all: DEX_IDS,
};

export default {
  SUPPORTED_DEXES,
  DEX_TYPES,
  DEX_IDS,
  DEX_LABELS,
  POPULAR_DEX_COMBINATIONS,
};
