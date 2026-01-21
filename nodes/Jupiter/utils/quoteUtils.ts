/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Quote Utilities
 * Helper functions for working with Jupiter quotes
 */

import { DEFAULT_SLIPPAGE } from '../constants/tokens';

/**
 * Quote response from Jupiter API
 */
export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot?: number;
  timeTaken?: number;
}

/**
 * Route plan step in a quote
 */
export interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label?: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

/**
 * Quote parameters
 */
export interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  swapMode?: 'ExactIn' | 'ExactOut';
  dexes?: string[];
  excludeDexes?: string[];
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  platformFeeBps?: number;
  maxAccounts?: number;
  autoSlippage?: boolean;
  autoSlippageCollisionUsdValue?: number;
  restrictIntermediateTokens?: boolean;
}

/**
 * Calculate slippage basis points from percentage
 * @param percentage - Slippage percentage (e.g., 0.5 for 0.5%)
 * @returns Slippage in basis points
 */
export function percentageToBps(percentage: number): number {
  return Math.round(percentage * 100);
}

/**
 * Calculate percentage from basis points
 * @param bps - Basis points
 * @returns Percentage
 */
export function bpsToPercentage(bps: number): number {
  return bps / 100;
}

/**
 * Format amount with decimals
 * @param amount - Raw amount as string
 * @param decimals - Token decimals
 * @returns Formatted amount string
 */
export function formatAmount(amount: string, decimals: number): string {
  const amountNum = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = amountNum / divisor;
  const fraction = amountNum % divisor;
  
  if (fraction === BigInt(0)) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  return `${whole}.${trimmedFraction}`;
}

/**
 * Parse amount to raw (with decimals)
 * @param amount - Human readable amount
 * @param decimals - Token decimals
 * @returns Raw amount string
 */
export function parseAmount(amount: string | number, decimals: number): string {
  const amountStr = amount.toString();
  const [whole, fraction = ''] = amountStr.split('.');
  
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  const rawAmount = whole + paddedFraction;
  
  // Remove leading zeros
  return rawAmount.replace(/^0+/, '') || '0';
}

/**
 * Calculate price impact severity
 * @param priceImpactPct - Price impact percentage as string
 * @returns Severity level
 */
export function getPriceImpactSeverity(
  priceImpactPct: string,
): 'low' | 'medium' | 'high' | 'very_high' {
  const impact = Math.abs(parseFloat(priceImpactPct));
  
  if (impact < 0.1) return 'low';
  if (impact < 1) return 'medium';
  if (impact < 5) return 'high';
  return 'very_high';
}

/**
 * Validate quote parameters
 * @param params - Quote parameters to validate
 * @returns Validation result
 */
export function validateQuoteParams(params: Partial<QuoteParams>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!params.inputMint) {
    errors.push('Input mint address is required');
  }
  
  if (!params.outputMint) {
    errors.push('Output mint address is required');
  }
  
  if (!params.amount) {
    errors.push('Amount is required');
  } else if (isNaN(Number(params.amount)) || Number(params.amount) <= 0) {
    errors.push('Amount must be a positive number');
  }
  
  if (params.inputMint && params.outputMint && params.inputMint === params.outputMint) {
    errors.push('Input and output tokens must be different');
  }
  
  if (params.slippageBps !== undefined) {
    if (params.slippageBps < 0 || params.slippageBps > 10000) {
      errors.push('Slippage must be between 0 and 10000 basis points');
    }
  }
  
  if (params.platformFeeBps !== undefined) {
    if (params.platformFeeBps < 0 || params.platformFeeBps > 10000) {
      errors.push('Platform fee must be between 0 and 10000 basis points');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build quote URL query parameters
 * @param params - Quote parameters
 * @returns URL search params string
 */
export function buildQuoteQueryParams(params: QuoteParams): string {
  const searchParams = new URLSearchParams();
  
  searchParams.set('inputMint', params.inputMint);
  searchParams.set('outputMint', params.outputMint);
  searchParams.set('amount', params.amount);
  
  if (params.slippageBps !== undefined) {
    searchParams.set('slippageBps', params.slippageBps.toString());
  }
  
  if (params.swapMode) {
    searchParams.set('swapMode', params.swapMode);
  }
  
  if (params.dexes && params.dexes.length > 0) {
    searchParams.set('dexes', params.dexes.join(','));
  }
  
  if (params.excludeDexes && params.excludeDexes.length > 0) {
    searchParams.set('excludeDexes', params.excludeDexes.join(','));
  }
  
  if (params.onlyDirectRoutes) {
    searchParams.set('onlyDirectRoutes', 'true');
  }
  
  if (params.asLegacyTransaction) {
    searchParams.set('asLegacyTransaction', 'true');
  }
  
  if (params.platformFeeBps !== undefined) {
    searchParams.set('platformFeeBps', params.platformFeeBps.toString());
  }
  
  if (params.maxAccounts !== undefined) {
    searchParams.set('maxAccounts', params.maxAccounts.toString());
  }
  
  if (params.autoSlippage) {
    searchParams.set('autoSlippage', 'true');
  }
  
  if (params.autoSlippageCollisionUsdValue !== undefined) {
    searchParams.set(
      'autoSlippageCollisionUsdValue',
      params.autoSlippageCollisionUsdValue.toString(),
    );
  }
  
  if (params.restrictIntermediateTokens) {
    searchParams.set('restrictIntermediateTokens', 'true');
  }
  
  return searchParams.toString();
}

/**
 * Calculate effective price from quote
 * @param quote - Jupiter quote
 * @param inputDecimals - Input token decimals
 * @param outputDecimals - Output token decimals
 * @returns Price of 1 input token in output tokens
 */
export function calculatePrice(
  quote: JupiterQuote,
  inputDecimals: number,
  outputDecimals: number,
): number {
  const inAmount = Number(quote.inAmount) / 10 ** inputDecimals;
  const outAmount = Number(quote.outAmount) / 10 ** outputDecimals;
  
  return outAmount / inAmount;
}

/**
 * Calculate minimum output amount after slippage
 * @param outAmount - Expected output amount
 * @param slippageBps - Slippage in basis points
 * @returns Minimum output amount
 */
export function calculateMinimumOutput(outAmount: string, slippageBps: number): string {
  const amount = BigInt(outAmount);
  const slippageFactor = BigInt(10000 - slippageBps);
  const minAmount = (amount * slippageFactor) / BigInt(10000);
  
  return minAmount.toString();
}

/**
 * Get recommended slippage based on price impact
 * @param priceImpactPct - Price impact percentage
 * @returns Recommended slippage in basis points
 */
export function getRecommendedSlippage(priceImpactPct: string): number {
  const impact = Math.abs(parseFloat(priceImpactPct));
  
  if (impact < 0.1) return DEFAULT_SLIPPAGE.LOW;
  if (impact < 0.5) return DEFAULT_SLIPPAGE.MEDIUM;
  if (impact < 2) return DEFAULT_SLIPPAGE.HIGH;
  return DEFAULT_SLIPPAGE.VERY_HIGH;
}

/**
 * Compare two quotes to determine which is better
 * @param quoteA - First quote
 * @param quoteB - Second quote
 * @returns 1 if A is better, -1 if B is better, 0 if equal
 */
export function compareQuotes(quoteA: JupiterQuote, quoteB: JupiterQuote): number {
  // For ExactIn, more output is better
  if (quoteA.swapMode === 'ExactIn') {
    const outA = BigInt(quoteA.outAmount);
    const outB = BigInt(quoteB.outAmount);
    
    if (outA > outB) return 1;
    if (outA < outB) return -1;
    return 0;
  }
  
  // For ExactOut, less input is better
  const inA = BigInt(quoteA.inAmount);
  const inB = BigInt(quoteB.inAmount);
  
  if (inA < inB) return 1;
  if (inA > inB) return -1;
  return 0;
}

export default {
  percentageToBps,
  bpsToPercentage,
  formatAmount,
  parseAmount,
  getPriceImpactSeverity,
  validateQuoteParams,
  buildQuoteQueryParams,
  calculatePrice,
  calculateMinimumOutput,
  getRecommendedSlippage,
  compareQuotes,
};
