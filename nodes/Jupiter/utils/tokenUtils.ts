/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Token Utilities
 * Helper functions for working with Solana tokens
 */

import { Connection, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { COMMON_TOKENS, TOKEN_MINTS, TokenInfo } from '../constants/tokens';

/**
 * Token account info
 */
export interface TokenAccountInfo {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  isNative: boolean;
  delegatedAmount?: string;
  closeAuthority?: string;
}

/**
 * Get associated token address for a wallet and mint
 * @param walletAddress - Wallet public key
 * @param mintAddress - Token mint address
 * @returns Associated token address
 */
export async function getTokenAddress(
  walletAddress: string,
  mintAddress: string,
): Promise<string> {
  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(mintAddress);
  
  const ata = await getAssociatedTokenAddress(
    mint,
    wallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  
  return ata.toBase58();
}

/**
 * Get token account balance
 * @param connection - Solana connection
 * @param tokenAccountAddress - Token account address
 * @returns Token account info
 */
export async function getTokenAccountBalance(
  connection: Connection,
  tokenAccountAddress: string,
): Promise<TokenAccountInfo | null> {
  try {
    const tokenAccount = new PublicKey(tokenAccountAddress);
    const account = await getAccount(connection, tokenAccount);
    
    // Get mint info for decimals
    const mintInfo = await connection.getParsedAccountInfo(account.mint);
    const decimals = (mintInfo.value?.data as any)?.parsed?.info?.decimals || 0;
    
    return {
      mint: account.mint.toBase58(),
      owner: account.owner.toBase58(),
      amount: account.amount.toString(),
      decimals,
      isNative: account.isNative,
      delegatedAmount: account.delegatedAmount?.toString(),
      closeAuthority: account.closeAuthority?.toBase58(),
    };
  } catch {
    return null;
  }
}

/**
 * Get all token accounts for a wallet
 * @param connection - Solana connection
 * @param walletAddress - Wallet address
 * @returns Array of token account info
 */
export async function getWalletTokenAccounts(
  connection: Connection,
  walletAddress: string,
): Promise<TokenAccountInfo[]> {
  const wallet = new PublicKey(walletAddress);
  
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, {
    programId: TOKEN_PROGRAM_ID,
  });
  
  return tokenAccounts.value.map((account) => {
    const info = account.account.data.parsed.info;
    return {
      mint: info.mint,
      owner: info.owner,
      amount: info.tokenAmount.amount,
      decimals: info.tokenAmount.decimals,
      isNative: info.isNative || false,
    };
  });
}

/**
 * Get SOL balance for a wallet
 * @param connection - Solana connection
 * @param walletAddress - Wallet address
 * @returns Balance in lamports
 */
export async function getSolBalance(
  connection: Connection,
  walletAddress: string,
): Promise<bigint> {
  const wallet = new PublicKey(walletAddress);
  const balance = await connection.getBalance(wallet);
  return BigInt(balance);
}

/**
 * Find token info by symbol
 * @param symbol - Token symbol
 * @returns Token info or undefined
 */
export function findTokenBySymbol(symbol: string): TokenInfo | undefined {
  const upperSymbol = symbol.toUpperCase();
  return COMMON_TOKENS[upperSymbol];
}

/**
 * Find token info by mint address
 * @param mint - Token mint address
 * @returns Token info or undefined
 */
export function findTokenByMint(mint: string): TokenInfo | undefined {
  return Object.values(COMMON_TOKENS).find((token) => token.mint === mint);
}

/**
 * Validate token mint address
 * @param mint - Token mint address
 * @returns True if valid
 */
export function isValidMint(mint: string): boolean {
  try {
    new PublicKey(mint);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate any Solana public key
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format token amount for display
 * @param amount - Raw amount (as string or bigint)
 * @param decimals - Token decimals
 * @param maxDecimals - Maximum decimal places to display
 * @returns Formatted amount string
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number,
  maxDecimals = 6,
): string {
  const amountBig = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = amountBig / divisor;
  const fraction = amountBig % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr
    .slice(0, maxDecimals)
    .replace(/0+$/, '');
  
  if (!trimmedFraction) {
    return whole.toString();
  }
  
  return `${whole}.${trimmedFraction}`;
}

/**
 * Parse token amount from display format to raw
 * @param amount - Display amount (e.g., "1.5")
 * @param decimals - Token decimals
 * @returns Raw amount as string
 */
export function parseTokenAmount(amount: string | number, decimals: number): string {
  const amountStr = amount.toString();
  const [whole, fraction = ''] = amountStr.split('.');
  
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const raw = whole + paddedFraction;
  
  // Remove leading zeros but keep at least one digit
  return raw.replace(/^0+/, '') || '0';
}

/**
 * Calculate USD value of token amount
 * @param amount - Raw amount
 * @param decimals - Token decimals
 * @param price - Token price in USD
 * @returns USD value
 */
export function calculateUsdValue(
  amount: string | bigint,
  decimals: number,
  price: number,
): number {
  const amountNum = Number(BigInt(amount)) / 10 ** decimals;
  return amountNum * price;
}

/**
 * Get token symbol from mint address
 * @param mint - Token mint address
 * @returns Symbol or shortened mint address
 */
export function getTokenSymbol(mint: string): string {
  const token = findTokenByMint(mint);
  if (token) {
    return token.symbol;
  }
  // Return shortened address
  return `${mint.slice(0, 4)}...${mint.slice(-4)}`;
}

/**
 * Check if token is a stablecoin
 * @param mint - Token mint address
 * @returns True if stablecoin
 */
export function isStablecoin(mint: string): boolean {
  const stablecoinMints = [
    TOKEN_MINTS.USDC,
    TOKEN_MINTS.USDT,
  ];
  return stablecoinMints.includes(mint);
}

/**
 * Check if token is wrapped SOL
 * @param mint - Token mint address
 * @returns True if wrapped SOL
 */
export function isWrappedSol(mint: string): boolean {
  return mint === TOKEN_MINTS.SOL;
}

/**
 * Sort tokens by common usage
 * @param tokens - Array of token mints
 * @returns Sorted array
 */
export function sortTokensByPopularity(tokens: string[]): string[] {
  const popularOrder = [
    TOKEN_MINTS.SOL,
    TOKEN_MINTS.USDC,
    TOKEN_MINTS.USDT,
    TOKEN_MINTS.JUP,
    TOKEN_MINTS.mSOL,
    TOKEN_MINTS.jitoSOL,
    TOKEN_MINTS.BONK,
    TOKEN_MINTS.WIF,
  ];
  
  return tokens.sort((a, b) => {
    const indexA = popularOrder.indexOf(a);
    const indexB = popularOrder.indexOf(b);
    
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

/**
 * Get token metadata from mint info
 * @param connection - Solana connection
 * @param mint - Token mint address
 * @returns Token metadata
 */
export async function getTokenMetadata(
  connection: Connection,
  mint: string,
): Promise<{
  supply: string;
  decimals: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
}> {
  const mintPubkey = new PublicKey(mint);
  const info = await connection.getParsedAccountInfo(mintPubkey);
  
  if (!info.value) {
    throw new Error(`Token mint not found: ${mint}`);
  }
  
  const data = info.value.data as any;
  const parsed = data.parsed?.info;
  
  return {
    supply: parsed?.supply || '0',
    decimals: parsed?.decimals || 0,
    mintAuthority: parsed?.mintAuthority || null,
    freezeAuthority: parsed?.freezeAuthority || null,
  };
}

export default {
  getTokenAddress,
  getTokenAccountBalance,
  getWalletTokenAccounts,
  getSolBalance,
  findTokenBySymbol,
  findTokenByMint,
  isValidMint,
  isValidPublicKey,
  formatTokenAmount,
  parseTokenAmount,
  calculateUsdValue,
  getTokenSymbol,
  isStablecoin,
  isWrappedSol,
  sortTokensByPopularity,
  getTokenMetadata,
};
