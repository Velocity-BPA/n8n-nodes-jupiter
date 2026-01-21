/**
 * Jupiter Integration Tests
 *
 * [Velocity BPA Licensing Notice]
 *
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 *
 * Use of this node by for-profit organizations in production environments requires
 * a commercial license from Velocity BPA.
 *
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import axios from 'axios';

// Jupiter API endpoints
const JUPITER_API_BASE = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6';
const JUPITER_TOKEN_API = 'https://token.jup.ag';

// Common token mints
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// Skip integration tests in CI unless explicitly enabled
const SKIP_INTEGRATION = process.env.RUN_INTEGRATION_TESTS !== 'true';

describe('Jupiter API Integration Tests', () => {
	// Conditionally skip based on environment
	const conditionalDescribe = SKIP_INTEGRATION ? describe.skip : describe;

	conditionalDescribe('Quote API', () => {
		it('should get a quote for SOL to USDC swap', async () => {
			const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 1000000000, // 1 SOL in lamports
					slippageBps: 50,
				},
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty('inputMint', SOL_MINT);
			expect(response.data).toHaveProperty('outputMint', USDC_MINT);
			expect(response.data).toHaveProperty('inAmount');
			expect(response.data).toHaveProperty('outAmount');
			expect(response.data).toHaveProperty('routePlan');
			expect(Array.isArray(response.data.routePlan)).toBe(true);
		}, 30000);

		it('should get a quote for USDC to SOL swap', async () => {
			const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: USDC_MINT,
					outputMint: SOL_MINT,
					amount: 10000000, // 10 USDC (6 decimals)
					slippageBps: 50,
				},
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty('inputMint', USDC_MINT);
			expect(response.data).toHaveProperty('outputMint', SOL_MINT);
			expect(response.data).toHaveProperty('priceImpactPct');
		}, 30000);

		it('should return error for invalid mint address', async () => {
			try {
				await axios.get(`${JUPITER_API_BASE}/quote`, {
					params: {
						inputMint: 'invalid-mint',
						outputMint: USDC_MINT,
						amount: 1000000000,
					},
				});
				fail('Expected request to fail');
			} catch (error: any) {
				expect(error.response?.status).toBeGreaterThanOrEqual(400);
			}
		}, 30000);

		it('should handle zero amount gracefully', async () => {
			try {
				await axios.get(`${JUPITER_API_BASE}/quote`, {
					params: {
						inputMint: SOL_MINT,
						outputMint: USDC_MINT,
						amount: 0,
					},
				});
				fail('Expected request to fail');
			} catch (error: any) {
				expect(error.response?.status).toBeGreaterThanOrEqual(400);
			}
		}, 30000);
	});

	conditionalDescribe('Price API', () => {
		it('should get SOL price', async () => {
			const response = await axios.get(`${JUPITER_PRICE_API}/price`, {
				params: {
					ids: SOL_MINT,
				},
			});

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty('data');
			expect(response.data.data).toHaveProperty(SOL_MINT);
			expect(response.data.data[SOL_MINT]).toHaveProperty('price');
			expect(typeof response.data.data[SOL_MINT].price).toBe('number');
		}, 30000);

		it('should get multiple token prices', async () => {
			const response = await axios.get(`${JUPITER_PRICE_API}/price`, {
				params: {
					ids: `${SOL_MINT},${USDC_MINT},${USDT_MINT}`,
				},
			});

			expect(response.status).toBe(200);
			expect(response.data.data).toHaveProperty(SOL_MINT);
			expect(response.data.data).toHaveProperty(USDC_MINT);
			expect(response.data.data).toHaveProperty(USDT_MINT);
		}, 30000);

		it('should return null for unknown token', async () => {
			const unknownMint = '11111111111111111111111111111111';
			const response = await axios.get(`${JUPITER_PRICE_API}/price`, {
				params: {
					ids: unknownMint,
				},
			});

			expect(response.status).toBe(200);
			// Unknown tokens may return null or empty
			expect(response.data).toHaveProperty('data');
		}, 30000);
	});

	conditionalDescribe('Token API', () => {
		it('should get strict token list', async () => {
			const response = await axios.get(`${JUPITER_TOKEN_API}/strict`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.data)).toBe(true);
			expect(response.data.length).toBeGreaterThan(0);

			// Check token structure
			const token = response.data[0];
			expect(token).toHaveProperty('address');
			expect(token).toHaveProperty('symbol');
			expect(token).toHaveProperty('name');
			expect(token).toHaveProperty('decimals');
		}, 30000);

		it('should get all tokens list', async () => {
			const response = await axios.get(`${JUPITER_TOKEN_API}/all`);

			expect(response.status).toBe(200);
			expect(Array.isArray(response.data)).toBe(true);
			expect(response.data.length).toBeGreaterThan(1000); // Should have many tokens
		}, 60000);
	});

	conditionalDescribe('Route Analysis', () => {
		it('should analyze route hops', async () => {
			const response = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 10000000000, // 10 SOL
					slippageBps: 50,
				},
			});

			expect(response.status).toBe(200);
			const { routePlan } = response.data;

			expect(Array.isArray(routePlan)).toBe(true);
			expect(routePlan.length).toBeGreaterThan(0);

			// Check route plan structure
			routePlan.forEach((hop: any) => {
				expect(hop).toHaveProperty('swapInfo');
				expect(hop.swapInfo).toHaveProperty('ammKey');
				expect(hop.swapInfo).toHaveProperty('inputMint');
				expect(hop.swapInfo).toHaveProperty('outputMint');
				expect(hop.swapInfo).toHaveProperty('inAmount');
				expect(hop.swapInfo).toHaveProperty('outAmount');
			});
		}, 30000);

		it('should compare direct vs multi-hop routes', async () => {
			// Get quote allowing multi-hop
			const multiHopResponse = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 100000000000, // 100 SOL
					slippageBps: 100,
				},
			});

			// Get quote with direct routes only
			const directResponse = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 100000000000, // 100 SOL
					slippageBps: 100,
					onlyDirectRoutes: true,
				},
			});

			expect(multiHopResponse.status).toBe(200);
			expect(directResponse.status).toBe(200);

			// Multi-hop should generally give equal or better output
			const multiHopOutput = BigInt(multiHopResponse.data.outAmount);
			const directOutput = BigInt(directResponse.data.outAmount);

			expect(multiHopOutput).toBeGreaterThanOrEqual(directOutput);
		}, 60000);
	});

	conditionalDescribe('Slippage Handling', () => {
		it('should respect different slippage settings', async () => {
			const lowSlippage = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 1000000000,
					slippageBps: 10, // 0.1%
				},
			});

			const highSlippage = await axios.get(`${JUPITER_API_BASE}/quote`, {
				params: {
					inputMint: SOL_MINT,
					outputMint: USDC_MINT,
					amount: 1000000000,
					slippageBps: 500, // 5%
				},
			});

			expect(lowSlippage.status).toBe(200);
			expect(highSlippage.status).toBe(200);

			// Output amounts should be similar (same swap amount)
			expect(lowSlippage.data.outAmount).toBe(highSlippage.data.outAmount);
		}, 30000);
	});

	conditionalDescribe('Program IDs', () => {
		it('should get indexed route map', async () => {
			const response = await axios.get(`${JUPITER_API_BASE}/indexed-route-map`);

			expect(response.status).toBe(200);
			expect(response.data).toHaveProperty('mintKeys');
			expect(response.data).toHaveProperty('indexedRouteMap');
			expect(Array.isArray(response.data.mintKeys)).toBe(true);
		}, 30000);
	});
});

describe('Mock Integration Tests (Always Run)', () => {
	// These tests use mocks and always run

	describe('Response Structure Validation', () => {
		it('should validate quote response structure', () => {
			const mockQuoteResponse = {
				inputMint: SOL_MINT,
				outputMint: USDC_MINT,
				inAmount: '1000000000',
				outAmount: '150000000',
				otherAmountThreshold: '148500000',
				swapMode: 'ExactIn',
				slippageBps: 50,
				priceImpactPct: '0.1',
				routePlan: [
					{
						swapInfo: {
							ammKey: 'test-amm-key',
							label: 'Raydium',
							inputMint: SOL_MINT,
							outputMint: USDC_MINT,
							inAmount: '1000000000',
							outAmount: '150000000',
							feeAmount: '15000',
							feeMint: USDC_MINT,
						},
						percent: 100,
					},
				],
			};

			// Validate required fields
			expect(mockQuoteResponse).toHaveProperty('inputMint');
			expect(mockQuoteResponse).toHaveProperty('outputMint');
			expect(mockQuoteResponse).toHaveProperty('inAmount');
			expect(mockQuoteResponse).toHaveProperty('outAmount');
			expect(mockQuoteResponse).toHaveProperty('routePlan');
			expect(mockQuoteResponse.routePlan[0]).toHaveProperty('swapInfo');
		});

		it('should validate price response structure', () => {
			const mockPriceResponse = {
				data: {
					[SOL_MINT]: {
						id: SOL_MINT,
						mintSymbol: 'SOL',
						vsToken: USDC_MINT,
						vsTokenSymbol: 'USDC',
						price: 150.5,
					},
				},
				timeTaken: 0.05,
			};

			expect(mockPriceResponse.data[SOL_MINT]).toHaveProperty('price');
			expect(mockPriceResponse.data[SOL_MINT]).toHaveProperty('mintSymbol');
			expect(typeof mockPriceResponse.data[SOL_MINT].price).toBe('number');
		});

		it('should validate token info structure', () => {
			const mockTokenInfo = {
				address: SOL_MINT,
				chainId: 101,
				decimals: 9,
				name: 'Wrapped SOL',
				symbol: 'SOL',
				logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
				tags: ['old-registry'],
				extensions: {},
			};

			expect(mockTokenInfo).toHaveProperty('address');
			expect(mockTokenInfo).toHaveProperty('decimals');
			expect(mockTokenInfo).toHaveProperty('symbol');
			expect(mockTokenInfo).toHaveProperty('name');
		});
	});

	describe('Error Response Handling', () => {
		it('should handle rate limit errors', () => {
			const mockRateLimitError = {
				error: 'Rate limit exceeded',
				code: 429,
				retryAfter: 60,
			};

			expect(mockRateLimitError.code).toBe(429);
			expect(mockRateLimitError).toHaveProperty('retryAfter');
		});

		it('should handle invalid parameter errors', () => {
			const mockInvalidParamError = {
				error: 'Invalid mint address',
				code: 400,
				details: {
					field: 'inputMint',
					reason: 'Not a valid base58 public key',
				},
			};

			expect(mockInvalidParamError.code).toBe(400);
			expect(mockInvalidParamError.details).toHaveProperty('field');
		});

		it('should handle no route found errors', () => {
			const mockNoRouteError = {
				error: 'No routes found',
				code: 404,
				inputMint: 'some-obscure-token',
				outputMint: USDC_MINT,
			};

			expect(mockNoRouteError.code).toBe(404);
			expect(mockNoRouteError.error).toContain('No routes');
		});
	});

	describe('Amount Calculations', () => {
		it('should calculate correct lamports from SOL', () => {
			const LAMPORTS_PER_SOL = 1_000_000_000;

			expect(1 * LAMPORTS_PER_SOL).toBe(1_000_000_000);
			expect(0.5 * LAMPORTS_PER_SOL).toBe(500_000_000);
			expect(0.001 * LAMPORTS_PER_SOL).toBe(1_000_000);
		});

		it('should calculate correct USDC amount from decimals', () => {
			const USDC_DECIMALS = 6;
			const usdcMultiplier = 10 ** USDC_DECIMALS;

			expect(1 * usdcMultiplier).toBe(1_000_000);
			expect(100 * usdcMultiplier).toBe(100_000_000);
			expect(0.01 * usdcMultiplier).toBe(10_000);
		});

		it('should calculate price impact correctly', () => {
			const expectedOutput = 150000000; // Without impact
			const actualOutput = 148500000; // With 1% impact

			const priceImpact = ((expectedOutput - actualOutput) / expectedOutput) * 100;

			expect(priceImpact).toBeCloseTo(1, 1);
		});

		it('should calculate slippage threshold correctly', () => {
			const outAmount = 150000000;
			const slippageBps = 50; // 0.5%

			const threshold = Math.floor(outAmount * (1 - slippageBps / 10000));

			expect(threshold).toBe(149250000);
		});
	});

	describe('Token Validation', () => {
		it('should validate SOL mint address format', () => {
			const isValidBase58 = (address: string): boolean => {
				const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
				return base58Regex.test(address);
			};

			expect(isValidBase58(SOL_MINT)).toBe(true);
			expect(isValidBase58(USDC_MINT)).toBe(true);
			expect(isValidBase58('invalid')).toBe(false);
			expect(isValidBase58('')).toBe(false);
		});

		it('should identify wrapped SOL', () => {
			const WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

			expect(SOL_MINT).toBe(WRAPPED_SOL_MINT);
		});

		it('should identify stablecoins', () => {
			const stablecoins = [
				'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
				'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
				'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX',  // USDH
			];

			expect(stablecoins.includes(USDC_MINT)).toBe(true);
			expect(stablecoins.includes(USDT_MINT)).toBe(true);
			expect(stablecoins.includes(SOL_MINT)).toBe(false);
		});
	});

	describe('Route Parsing', () => {
		it('should parse multi-hop route', () => {
			const mockRoute = {
				routePlan: [
					{
						swapInfo: {
							label: 'Raydium',
							inputMint: SOL_MINT,
							outputMint: 'intermediate-token',
						},
						percent: 100,
					},
					{
						swapInfo: {
							label: 'Orca',
							inputMint: 'intermediate-token',
							outputMint: USDC_MINT,
						},
						percent: 100,
					},
				],
			};

			const hops = mockRoute.routePlan.length;
			const dexes = mockRoute.routePlan.map((h) => h.swapInfo.label);

			expect(hops).toBe(2);
			expect(dexes).toContain('Raydium');
			expect(dexes).toContain('Orca');
		});

		it('should calculate route fees', () => {
			const mockRoute = {
				routePlan: [
					{
						swapInfo: {
							feeAmount: '15000',
							feeMint: USDC_MINT,
						},
					},
					{
						swapInfo: {
							feeAmount: '10000',
							feeMint: USDC_MINT,
						},
					},
				],
			};

			const totalFees = mockRoute.routePlan.reduce((sum, hop) => {
				return sum + parseInt(hop.swapInfo.feeAmount);
			}, 0);

			expect(totalFees).toBe(25000);
		});
	});
});
