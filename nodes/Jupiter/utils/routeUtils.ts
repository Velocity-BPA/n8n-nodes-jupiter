/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Route Utilities
 * Helper functions for working with Jupiter swap routes
 */

import type { JupiterQuote, RoutePlanStep } from './quoteUtils';

/**
 * Route hop information
 */
export interface RouteHop {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inputSymbol?: string;
  outputSymbol?: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
  percent: number;
}

/**
 * Route summary
 */
export interface RouteSummary {
  totalHops: number;
  dexesUsed: string[];
  uniqueTokens: string[];
  totalFees: Map<string, bigint>;
  splitRoutes: number;
  isDirectRoute: boolean;
}

/**
 * Extract route hops from quote
 * @param quote - Jupiter quote
 * @returns Array of route hops
 */
export function extractRouteHops(quote: JupiterQuote): RouteHop[] {
  return quote.routePlan.map((step) => ({
    ammKey: step.swapInfo.ammKey,
    label: step.swapInfo.label || 'Unknown DEX',
    inputMint: step.swapInfo.inputMint,
    outputMint: step.swapInfo.outputMint,
    inAmount: step.swapInfo.inAmount,
    outAmount: step.swapInfo.outAmount,
    feeAmount: step.swapInfo.feeAmount,
    feeMint: step.swapInfo.feeMint,
    percent: step.percent,
  }));
}

/**
 * Get route summary from quote
 * @param quote - Jupiter quote
 * @returns Route summary
 */
export function getRouteSummary(quote: JupiterQuote): RouteSummary {
  const dexesUsed = new Set<string>();
  const uniqueTokens = new Set<string>();
  const totalFees = new Map<string, bigint>();
  let splitCount = 0;
  
  // Track percentages to detect splits
  const percentages = new Set<number>();
  
  for (const step of quote.routePlan) {
    // Track DEXes
    if (step.swapInfo.label) {
      dexesUsed.add(step.swapInfo.label);
    }
    
    // Track tokens
    uniqueTokens.add(step.swapInfo.inputMint);
    uniqueTokens.add(step.swapInfo.outputMint);
    
    // Track fees
    const currentFee = totalFees.get(step.swapInfo.feeMint) || BigInt(0);
    totalFees.set(step.swapInfo.feeMint, currentFee + BigInt(step.swapInfo.feeAmount));
    
    // Track split routes
    percentages.add(step.percent);
  }
  
  // Count number of parallel routes (split routes)
  if (quote.routePlan.length > 0) {
    // Group by first hop to count splits
    const firstHopCount = quote.routePlan.filter(
      (step) => step.swapInfo.inputMint === quote.inputMint,
    ).length;
    splitCount = firstHopCount;
  }
  
  return {
    totalHops: quote.routePlan.length,
    dexesUsed: Array.from(dexesUsed),
    uniqueTokens: Array.from(uniqueTokens),
    totalFees,
    splitRoutes: splitCount,
    isDirectRoute: quote.routePlan.length === 1 || splitCount === 1,
  };
}

/**
 * Format route as human-readable string
 * @param quote - Jupiter quote
 * @returns Formatted route string
 */
export function formatRoute(quote: JupiterQuote): string {
  if (quote.routePlan.length === 0) {
    return 'No route found';
  }
  
  // Build route visualization
  const routes: string[][] = [];
  let currentRoute: string[] = [];
  let lastOutput = quote.inputMint;
  
  for (const step of quote.routePlan) {
    if (step.swapInfo.inputMint === quote.inputMint) {
      // Start of new split route
      if (currentRoute.length > 0) {
        routes.push(currentRoute);
      }
      currentRoute = [step.swapInfo.inputMint];
    }
    
    currentRoute.push(`--(${step.swapInfo.label || 'DEX'} ${step.percent}%)-->`);
    currentRoute.push(step.swapInfo.outputMint);
    lastOutput = step.swapInfo.outputMint;
  }
  
  if (currentRoute.length > 0) {
    routes.push(currentRoute);
  }
  
  return routes.map((route) => route.join(' ')).join('\n');
}

/**
 * Calculate total route fees
 * @param quote - Jupiter quote
 * @param feeDecimals - Decimals for fee token (default 6 for USDC)
 * @returns Total fees as formatted string
 */
export function calculateRouteFees(quote: JupiterQuote, feeDecimals = 6): string {
  let totalFee = BigInt(0);
  
  for (const step of quote.routePlan) {
    totalFee += BigInt(step.swapInfo.feeAmount);
  }
  
  const divisor = BigInt(10 ** feeDecimals);
  const whole = totalFee / divisor;
  const fraction = totalFee % divisor;
  
  return `${whole}.${fraction.toString().padStart(feeDecimals, '0')}`;
}

/**
 * Get best route from multiple quotes
 * @param quotes - Array of Jupiter quotes
 * @param swapMode - Swap mode (ExactIn or ExactOut)
 * @returns Best quote
 */
export function getBestRoute(
  quotes: JupiterQuote[],
  swapMode: 'ExactIn' | 'ExactOut' = 'ExactIn',
): JupiterQuote | null {
  if (quotes.length === 0) return null;
  
  return quotes.reduce((best, current) => {
    if (swapMode === 'ExactIn') {
      // More output is better
      return BigInt(current.outAmount) > BigInt(best.outAmount) ? current : best;
    } else {
      // Less input is better
      return BigInt(current.inAmount) < BigInt(best.inAmount) ? current : best;
    }
  });
}

/**
 * Filter routes by criteria
 * @param quotes - Array of quotes
 * @param criteria - Filter criteria
 * @returns Filtered quotes
 */
export function filterRoutes(
  quotes: JupiterQuote[],
  criteria: {
    maxPriceImpact?: number;
    maxHops?: number;
    includeDexes?: string[];
    excludeDexes?: string[];
    directOnly?: boolean;
  },
): JupiterQuote[] {
  return quotes.filter((quote) => {
    // Filter by price impact
    if (criteria.maxPriceImpact !== undefined) {
      const priceImpact = Math.abs(parseFloat(quote.priceImpactPct));
      if (priceImpact > criteria.maxPriceImpact) return false;
    }
    
    // Filter by max hops
    if (criteria.maxHops !== undefined) {
      if (quote.routePlan.length > criteria.maxHops) return false;
    }
    
    // Filter by direct routes only
    if (criteria.directOnly) {
      if (quote.routePlan.length > 1) return false;
    }
    
    // Filter by included DEXes
    if (criteria.includeDexes && criteria.includeDexes.length > 0) {
      const routeDexes = quote.routePlan.map((step) => step.swapInfo.label).filter(Boolean);
      const hasIncludedDex = routeDexes.some((dex) => criteria.includeDexes!.includes(dex!));
      if (!hasIncludedDex) return false;
    }
    
    // Filter by excluded DEXes
    if (criteria.excludeDexes && criteria.excludeDexes.length > 0) {
      const routeDexes = quote.routePlan.map((step) => step.swapInfo.label).filter(Boolean);
      const hasExcludedDex = routeDexes.some((dex) => criteria.excludeDexes!.includes(dex!));
      if (hasExcludedDex) return false;
    }
    
    return true;
  });
}

/**
 * Analyze route efficiency
 * @param quote - Jupiter quote
 * @returns Efficiency metrics
 */
export function analyzeRouteEfficiency(quote: JupiterQuote): {
  efficiency: number;
  hopsPercentage: Record<string, number>;
  largestHop: string | null;
  recommendation: string;
} {
  const priceImpact = Math.abs(parseFloat(quote.priceImpactPct));
  
  // Calculate efficiency score (0-100)
  // Lower price impact = higher efficiency
  const efficiency = Math.max(0, 100 - priceImpact * 20);
  
  // Calculate hop percentages
  const hopsPercentage: Record<string, number> = {};
  let largestHop: { label: string; percent: number } | null = null;
  
  for (const step of quote.routePlan) {
    const label = step.swapInfo.label || 'Unknown';
    hopsPercentage[label] = (hopsPercentage[label] || 0) + step.percent;
    
    if (!largestHop || step.percent > largestHop.percent) {
      largestHop = { label, percent: step.percent };
    }
  }
  
  // Generate recommendation
  let recommendation: string;
  if (efficiency >= 90) {
    recommendation = 'Excellent route with minimal price impact';
  } else if (efficiency >= 70) {
    recommendation = 'Good route, acceptable price impact';
  } else if (efficiency >= 50) {
    recommendation = 'Consider using a smaller trade size to reduce price impact';
  } else {
    recommendation = 'High price impact detected. Consider splitting the trade or waiting for better liquidity';
  }
  
  return {
    efficiency,
    hopsPercentage,
    largestHop: largestHop?.label || null,
    recommendation,
  };
}

/**
 * Merge multiple route segments into a single path description
 * @param routePlan - Array of route plan steps
 * @returns Simplified path description
 */
export function simplifyRoutePath(routePlan: RoutePlanStep[]): string[] {
  const path: string[] = [];
  const seen = new Set<string>();
  
  for (const step of routePlan) {
    if (!seen.has(step.swapInfo.inputMint)) {
      path.push(step.swapInfo.inputMint);
      seen.add(step.swapInfo.inputMint);
    }
    if (!seen.has(step.swapInfo.outputMint)) {
      path.push(step.swapInfo.outputMint);
      seen.add(step.swapInfo.outputMint);
    }
  }
  
  return path;
}

export default {
  extractRouteHops,
  getRouteSummary,
  formatRoute,
  calculateRouteFees,
  getBestRoute,
  filterRoutes,
  analyzeRouteEfficiency,
  simplifyRoutePath,
};
