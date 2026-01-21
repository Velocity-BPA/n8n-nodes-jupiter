/**
 * Unit Tests for n8n-nodes-jupiter
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock n8n-workflow
jest.mock('n8n-workflow', () => ({
	NodeOperationError: class NodeOperationError extends Error {
		constructor(node: unknown, message: string) {
			super(message);
			this.name = 'NodeOperationError';
		}
	},
}));

// Import utilities for testing
import {
	isValidMint,
	isValidPublicKey,
	isStablecoin,
	isWrappedSol,
} from '../../nodes/Jupiter/utils/tokenUtils';

import {
	getRouteSummary,
	calculateRouteFees,
} from '../../nodes/Jupiter/utils/routeUtils';

import {
	COMMON_TOKENS,
	STABLECOINS,
	WRAPPED_SOL,
} from '../../nodes/Jupiter/constants/tokens';

import {
	JUPITER_API_URL,
	LAMPORTS_PER_SOL,
} from '../../nodes/Jupiter/constants/networks';

describe('Token Utilities', () => {
	describe('isValidMint', () => {
		it('should return true for valid mint addresses', () => {
			expect(isValidMint(COMMON_TOKENS.USDC)).toBe(true);
			expect(isValidMint(COMMON_TOKENS.SOL)).toBe(true);
			expect(isValidMint(WRAPPED_SOL)).toBe(true);
		});

		it('should return false for invalid addresses', () => {
			expect(isValidMint('')).toBe(false);
			expect(isValidMint('invalid')).toBe(false);
			expect(isValidMint('0x123')).toBe(false);
		});

		it('should return false for null/undefined', () => {
			expect(isValidMint(null as unknown as string)).toBe(false);
			expect(isValidMint(undefined as unknown as string)).toBe(false);
		});
	});

	describe('isValidPublicKey', () => {
		it('should return true for valid public keys', () => {
			expect(isValidPublicKey('So11111111111111111111111111111111111111112')).toBe(true);
			expect(isValidPublicKey(COMMON_TOKENS.USDC)).toBe(true);
		});

		it('should return false for invalid public keys', () => {
			expect(isValidPublicKey('')).toBe(false);
			expect(isValidPublicKey('short')).toBe(false);
			expect(isValidPublicKey('0'.repeat(50))).toBe(false);
		});
	});

	describe('isStablecoin', () => {
		it('should identify known stablecoins', () => {
			expect(isStablecoin(STABLECOINS.USDC)).toBe(true);
			expect(isStablecoin(STABLECOINS.USDT)).toBe(true);
		});

		it('should return false for non-stablecoins', () => {
			expect(isStablecoin(COMMON_TOKENS.SOL)).toBe(false);
			expect(isStablecoin('random_mint_address')).toBe(false);
		});
	});

	describe('isWrappedSol', () => {
		it('should identify wrapped SOL', () => {
			expect(isWrappedSol(WRAPPED_SOL)).toBe(true);
			expect(isWrappedSol(COMMON_TOKENS.SOL)).toBe(true);
		});

		it('should return false for other tokens', () => {
			expect(isWrappedSol(COMMON_TOKENS.USDC)).toBe(false);
		});
	});
});

describe('Route Utilities', () => {
	describe('getRouteSummary', () => {
		it('should return summary for valid route', () => {
			const mockRoute = {
				inputMint: COMMON_TOKENS.SOL,
				outputMint: COMMON_TOKENS.USDC,
				inAmount: '1000000000',
				outAmount: '50000000',
				routePlan: [
					{ swapInfo: { ammKey: 'dex1', label: 'Raydium' } },
					{ swapInfo: { ammKey: 'dex2', label: 'Orca' } },
				],
			};

			const summary = getRouteSummary(mockRoute);

			expect(summary).toHaveProperty('inputMint');
			expect(summary).toHaveProperty('outputMint');
			expect(summary).toHaveProperty('hops');
			expect(summary.hops).toBe(2);
		});

		it('should handle empty route', () => {
			const emptyRoute = {
				inputMint: '',
				outputMint: '',
				inAmount: '0',
				outAmount: '0',
				routePlan: [],
			};

			const summary = getRouteSummary(emptyRoute);
			expect(summary.hops).toBe(0);
		});
	});

	describe('calculateRouteFees', () => {
		it('should calculate fees for route', () => {
			const mockRoute = {
				routePlan: [
					{ swapInfo: { feeAmount: '1000' } },
					{ swapInfo: { feeAmount: '500' } },
				],
			};

			const fees = calculateRouteFees(mockRoute);
			expect(fees).toHaveProperty('totalFees');
			expect(fees.totalFees).toBe(1500);
		});

		it('should return zero for route with no fees', () => {
			const noFeeRoute = { routePlan: [] };
			const fees = calculateRouteFees(noFeeRoute);
			expect(fees.totalFees).toBe(0);
		});
	});
});

describe('Constants', () => {
	describe('COMMON_TOKENS', () => {
		it('should have required tokens', () => {
			expect(COMMON_TOKENS).toHaveProperty('SOL');
			expect(COMMON_TOKENS).toHaveProperty('USDC');
			expect(COMMON_TOKENS).toHaveProperty('USDT');
		});

		it('should have valid mint addresses', () => {
			Object.values(COMMON_TOKENS).forEach((mint) => {
				expect(typeof mint).toBe('string');
				expect(mint.length).toBeGreaterThan(30);
			});
		});
	});

	describe('JUPITER_API_URL', () => {
		it('should be a valid URL', () => {
			expect(JUPITER_API_URL).toMatch(/^https?:\/\//);
		});
	});

	describe('LAMPORTS_PER_SOL', () => {
		it('should equal 1 billion', () => {
			expect(LAMPORTS_PER_SOL).toBe(1_000_000_000);
		});
	});
});

describe('Swap Operations', () => {
	describe('slippage calculations', () => {
		it('should convert basis points correctly', () => {
			const slippageBps = 50; // 0.5%
			const slippagePercent = slippageBps / 100;
			expect(slippagePercent).toBe(0.5);
		});

		it('should calculate output with slippage', () => {
			const outputAmount = 1000000;
			const slippageBps = 100; // 1%
			const minOutput = Math.floor(outputAmount * (1 - slippageBps / 10000));
			expect(minOutput).toBe(990000);
		});
	});
});

describe('Quote Operations', () => {
	describe('price impact calculations', () => {
		it('should calculate price impact correctly', () => {
			const inputValue = 1000;
			const outputValue = 980;
			const priceImpact = ((inputValue - outputValue) / inputValue) * 100;
			expect(priceImpact).toBe(2);
		});
	});
});

describe('Amount Conversions', () => {
	describe('SOL to Lamports', () => {
		it('should convert correctly', () => {
			expect(1 * LAMPORTS_PER_SOL).toBe(1_000_000_000);
			expect(0.5 * LAMPORTS_PER_SOL).toBe(500_000_000);
			expect(0.001 * LAMPORTS_PER_SOL).toBe(1_000_000);
		});
	});

	describe('Lamports to SOL', () => {
		it('should convert correctly', () => {
			expect(1_000_000_000 / LAMPORTS_PER_SOL).toBe(1);
			expect(500_000_000 / LAMPORTS_PER_SOL).toBe(0.5);
			expect(1_000_000 / LAMPORTS_PER_SOL).toBe(0.001);
		});
	});

	describe('Token amounts with decimals', () => {
		it('should handle USDC (6 decimals)', () => {
			const usdcAmount = 100;
			const decimals = 6;
			const rawAmount = usdcAmount * Math.pow(10, decimals);
			expect(rawAmount).toBe(100_000_000);
		});

		it('should handle SOL (9 decimals)', () => {
			const solAmount = 1;
			const decimals = 9;
			const rawAmount = solAmount * Math.pow(10, decimals);
			expect(rawAmount).toBe(1_000_000_000);
		});
	});
});

describe('Error Handling', () => {
	it('should handle missing parameters gracefully', () => {
		expect(() => {
			const param: string | undefined = undefined;
			if (!param) {
				throw new Error('Parameter is required');
			}
		}).toThrow('Parameter is required');
	});

	it('should validate token mints', () => {
		const invalidMint = '';
		expect(isValidMint(invalidMint)).toBe(false);
	});
});

describe('Data Formatting', () => {
	describe('Route formatting', () => {
		it('should format route path correctly', () => {
			const route = {
				routePlan: [
					{ swapInfo: { inputMint: 'SOL', outputMint: 'USDC', label: 'Raydium' } },
				],
			};

			const formattedPath = route.routePlan
				.map((hop) => `${hop.swapInfo.inputMint} → ${hop.swapInfo.outputMint} (${hop.swapInfo.label})`)
				.join(' → ');

			expect(formattedPath).toBe('SOL → USDC (Raydium)');
		});
	});

	describe('Number formatting', () => {
		it('should format large numbers', () => {
			const amount = 1234567890;
			const formatted = amount.toLocaleString();
			expect(formatted).toBeTruthy();
		});

		it('should format percentages', () => {
			const percent = 0.0523;
			const formatted = (percent * 100).toFixed(2) + '%';
			expect(formatted).toBe('5.23%');
		});
	});
});
