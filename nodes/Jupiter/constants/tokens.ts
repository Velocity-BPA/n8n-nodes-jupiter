/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Common Token Mint Addresses on Solana
 * These are the most commonly traded tokens on Jupiter
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
  coingeckoId?: string;
  tags?: string[];
}

/**
 * Native SOL (wrapped)
 */
export const NATIVE_SOL: TokenInfo = {
  symbol: 'SOL',
  name: 'Wrapped SOL',
  mint: 'So11111111111111111111111111111111111111112',
  decimals: 9,
  coingeckoId: 'solana',
  tags: ['native', 'wrapped'],
};

/**
 * Stablecoins
 */
export const STABLECOINS: Record<string, TokenInfo> = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    coingeckoId: 'usd-coin',
    tags: ['stablecoin', 'verified'],
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    coingeckoId: 'tether',
    tags: ['stablecoin', 'verified'],
  },
  PYUSD: {
    symbol: 'PYUSD',
    name: 'PayPal USD',
    mint: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
    decimals: 6,
    coingeckoId: 'paypal-usd',
    tags: ['stablecoin', 'verified'],
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    mint: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCCb39w6e8rqw',
    decimals: 8,
    coingeckoId: 'dai',
    tags: ['stablecoin', 'wormhole'],
  },
};

/**
 * Major Cryptocurrencies (Bridged)
 */
export const MAJOR_TOKENS: Record<string, TokenInfo> = {
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    mint: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
    decimals: 8,
    coingeckoId: 'wrapped-bitcoin',
    tags: ['bridged', 'wormhole'],
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
    decimals: 8,
    coingeckoId: 'weth',
    tags: ['bridged', 'wormhole'],
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum (Portal)',
    mint: '2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk',
    decimals: 6,
    coingeckoId: 'ethereum',
    tags: ['bridged', 'portal'],
  },
};

/**
 * Jupiter Ecosystem Tokens
 */
export const JUPITER_TOKENS: Record<string, TokenInfo> = {
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    coingeckoId: 'jupiter-exchange-solana',
    tags: ['governance', 'verified'],
  },
  JLP: {
    symbol: 'JLP',
    name: 'Jupiter LP',
    mint: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
    decimals: 6,
    tags: ['lp-token', 'verified'],
  },
};

/**
 * Liquid Staking Tokens
 */
export const LST_TOKENS: Record<string, TokenInfo> = {
  mSOL: {
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    decimals: 9,
    coingeckoId: 'msol',
    tags: ['lst', 'verified'],
  },
  stSOL: {
    symbol: 'stSOL',
    name: 'Lido Staked SOL',
    mint: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    decimals: 9,
    coingeckoId: 'lido-staked-sol',
    tags: ['lst', 'verified'],
  },
  bSOL: {
    symbol: 'bSOL',
    name: 'BlazeStake Staked SOL',
    mint: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
    decimals: 9,
    coingeckoId: 'blazestake-staked-sol',
    tags: ['lst', 'verified'],
  },
  jitoSOL: {
    symbol: 'jitoSOL',
    name: 'Jito Staked SOL',
    mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
    decimals: 9,
    coingeckoId: 'jito-staked-sol',
    tags: ['lst', 'verified'],
  },
  INF: {
    symbol: 'INF',
    name: 'Sanctum Infinity',
    mint: '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',
    decimals: 9,
    coingeckoId: 'sanctum-infinity',
    tags: ['lst', 'verified'],
  },
};

/**
 * Popular Meme/Community Tokens
 */
export const MEME_TOKENS: Record<string, TokenInfo> = {
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    coingeckoId: 'bonk',
    tags: ['meme', 'verified'],
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    coingeckoId: 'dogwifcoin',
    tags: ['meme', 'verified'],
  },
  POPCAT: {
    symbol: 'POPCAT',
    name: 'Popcat',
    mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    decimals: 9,
    coingeckoId: 'popcat',
    tags: ['meme'],
  },
};

/**
 * DeFi Protocol Tokens
 */
export const DEFI_TOKENS: Record<string, TokenInfo> = {
  RAY: {
    symbol: 'RAY',
    name: 'Raydium',
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    decimals: 6,
    coingeckoId: 'raydium',
    tags: ['defi', 'verified'],
  },
  ORCA: {
    symbol: 'ORCA',
    name: 'Orca',
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    decimals: 6,
    coingeckoId: 'orca',
    tags: ['defi', 'verified'],
  },
  MNDE: {
    symbol: 'MNDE',
    name: 'Marinade',
    mint: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',
    decimals: 9,
    coingeckoId: 'marinade',
    tags: ['defi', 'verified'],
  },
  HNT: {
    symbol: 'HNT',
    name: 'Helium',
    mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
    decimals: 8,
    coingeckoId: 'helium',
    tags: ['infrastructure', 'verified'],
  },
  PYTH: {
    symbol: 'PYTH',
    name: 'Pyth Network',
    mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
    decimals: 6,
    coingeckoId: 'pyth-network',
    tags: ['infrastructure', 'verified'],
  },
};

/**
 * All common tokens combined
 */
export const COMMON_TOKENS: Record<string, TokenInfo> = {
  SOL: NATIVE_SOL,
  ...STABLECOINS,
  ...MAJOR_TOKENS,
  ...JUPITER_TOKENS,
  ...LST_TOKENS,
  ...MEME_TOKENS,
  ...DEFI_TOKENS,
};

/**
 * Token mint addresses for quick lookup
 */
export const TOKEN_MINTS = {
  SOL: NATIVE_SOL.mint,
  USDC: STABLECOINS.USDC.mint,
  USDT: STABLECOINS.USDT.mint,
  JUP: JUPITER_TOKENS.JUP.mint,
  JLP: JUPITER_TOKENS.JLP.mint,
  mSOL: LST_TOKENS.mSOL.mint,
  jitoSOL: LST_TOKENS.jitoSOL.mint,
  BONK: MEME_TOKENS.BONK.mint,
  WIF: MEME_TOKENS.WIF.mint,
};

// Convenience exports for specific tokens
export const JUP_TOKEN_MINT = JUPITER_TOKENS.JUP.mint;
export const SOL_MINT = NATIVE_SOL.mint;
export const USDC_MINT = STABLECOINS.USDC.mint;
// JLP_TOKEN_MINT is exported from programs.ts

/**
 * Default slippage values (in basis points)
 */
export const DEFAULT_SLIPPAGE = {
  LOW: 10, // 0.1%
  MEDIUM: 50, // 0.5%
  HIGH: 100, // 1%
  VERY_HIGH: 500, // 5%
};

export default {
  NATIVE_SOL,
  STABLECOINS,
  MAJOR_TOKENS,
  JUPITER_TOKENS,
  LST_TOKENS,
  MEME_TOKENS,
  DEFI_TOKENS,
  COMMON_TOKENS,
  TOKEN_MINTS,
  DEFAULT_SLIPPAGE,
};
