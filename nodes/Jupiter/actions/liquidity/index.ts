// @ts-nocheck
/**
 * Liquidity Resource Actions
 * Pool and liquidity information operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { COMMON_TOKENS } from '../../constants/tokens';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['liquidity'],
			},
		},
		options: [
			{
				name: 'Get Liquidity',
				value: 'getLiquidity',
				description: 'Get liquidity for a token',
				action: 'Get liquidity',
			},
			{
				name: 'Get Pool Info',
				value: 'getPoolInfo',
				description: 'Get pool information',
				action: 'Get pool info',
			},
			{
				name: 'Get Pool Liquidity',
				value: 'getPoolLiquidity',
				description: 'Get liquidity in a specific pool',
				action: 'Get pool liquidity',
			},
			{
				name: 'Get Concentrated Liquidity',
				value: 'getConcentratedLiquidity',
				description: 'Get CLMM liquidity positions',
				action: 'Get concentrated liquidity',
			},
			{
				name: 'Get Liquidity Distribution',
				value: 'getLiquidityDistribution',
				description: 'Get liquidity distribution across pools',
				action: 'Get liquidity distribution',
			},
			{
				name: 'Get Depth',
				value: 'getDepth',
				description: 'Get market depth for a pair',
				action: 'Get depth',
			},
			{
				name: 'Get TVL',
				value: 'getTvl',
				description: 'Get Total Value Locked',
				action: 'Get tvl',
			},
			{
				name: 'Get Pool by Address',
				value: 'getPoolByAddress',
				description: 'Get pool by its address',
				action: 'Get pool by address',
			},
			{
				name: 'Get Pools by Token',
				value: 'getPoolsByToken',
				description: 'Get all pools containing a token',
				action: 'Get pools by token',
			},
		],
		default: 'getLiquidity',
	},

	// Token Mint
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['liquidity'],
				operation: ['getLiquidity', 'getPoolsByToken', 'getConcentratedLiquidity'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The token mint address',
	},

	// Pool Address
	{
		displayName: 'Pool Address',
		name: 'poolAddress',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['liquidity'],
				operation: ['getPoolInfo', 'getPoolLiquidity', 'getPoolByAddress'],
			},
		},
		placeholder: 'Enter pool address',
		description: 'The pool address',
	},

	// Input/Output for depth
	{
		displayName: 'Input Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['liquidity'],
				operation: ['getDepth', 'getLiquidityDistribution'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The input token mint address',
	},

	{
		displayName: 'Output Mint',
		name: 'outputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['liquidity'],
				operation: ['getDepth', 'getLiquidityDistribution'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'The output token mint address',
	},

	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['liquidity'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 20,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Include Fees',
				name: 'includeFees',
				type: 'boolean',
				default: false,
				description: 'Whether to include fee information',
			},
			{
				displayName: 'Depth Levels',
				name: 'depthLevels',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 50 },
				default: 10,
				description: 'Number of depth levels to fetch',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const jupiterClient = await createJupiterClient.call(this);
	const options = this.getNodeParameter('options', index, {}) as {
		limit?: number;
		includeFees?: boolean;
		depthLevels?: number;
	};

	let result: any;

	switch (operation) {
		case 'getLiquidity': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			// Check liquidity by getting quotes at different amounts
			const amounts = [1000000, 10000000, 100000000, 1000000000]; // Various sizes
			const liquidityCheck = await Promise.all(
				amounts.map(async (amount) => {
					try {
						const quote = await jupiterClient.getQuote({
							inputMint: tokenMint,
							outputMint: COMMON_TOKENS.USDC,
							amount,
							slippageBps: 100,
						});
						return {
							inputAmount: amount,
							priceImpact: parseFloat(quote.priceImpactPct || '0'),
							routeAvailable: true,
						};
					} catch {
						return {
							inputAmount: amount,
							priceImpact: null,
							routeAvailable: false,
						};
					}
				}),
			);

			// Estimate liquidity based on price impact at different sizes
			const hasDeepLiquidity = liquidityCheck.some(
				(check) => check.routeAvailable && (check.priceImpact || 100) < 1,
			);

			result = {
				tokenMint,
				liquidityCheck,
				hasDeepLiquidity,
				liquidityRating: hasDeepLiquidity ? 'high' : 'low',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPoolInfo': {
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			result = {
				poolAddress,
				note: 'Pool info requires direct on-chain lookup or DEX-specific API',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPoolLiquidity': {
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			result = {
				poolAddress,
				note: 'Pool liquidity requires direct on-chain lookup',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getConcentratedLiquidity': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			result = {
				tokenMint,
				clmmPools: [],
				note: 'CLMM positions require integration with specific DEX APIs (Orca, Raydium)',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getLiquidityDistribution': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;

			// Get route to understand liquidity distribution
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: 100000000000, // Large amount to see distribution
				slippageBps: 100,
			});

			const distribution = quote.routePlan?.map((step: any) => ({
				dex: step.swapInfo?.label || 'unknown',
				percent: step.percent,
				ammKey: step.swapInfo?.ammKey,
			})) || [];

			result = {
				inputMint,
				outputMint,
				distribution,
				totalDexes: [...new Set(distribution.map((d: any) => d.dex))].length,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getDepth': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const depthLevels = options.depthLevels || 10;

			// Simulate depth by getting quotes at different amounts
			const baseAmount = 1000000; // 0.001 tokens
			const multipliers = Array.from({ length: depthLevels }, (_, i) => Math.pow(10, i / 2));

			const depth = await Promise.all(
				multipliers.map(async (mult) => {
					const amount = Math.floor(baseAmount * mult);
					try {
						const quote = await jupiterClient.getQuote({
							inputMint,
							outputMint,
							amount,
							slippageBps: 100,
						});
						return {
							amount,
							outputAmount: quote.outAmount,
							priceImpact: quote.priceImpactPct,
						};
					} catch {
						return {
							amount,
							outputAmount: null,
							priceImpact: null,
							error: 'No route',
						};
					}
				}),
			);

			result = {
				inputMint,
				outputMint,
				depthLevels: depth,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getTvl': {
			result = {
				jupiterTvl: null,
				note: 'TVL data requires integration with DeFiLlama API',
				dataSource: 'https://api.llama.fi/protocol/jupiter',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPoolByAddress': {
			const poolAddress = this.getNodeParameter('poolAddress', index) as string;

			result = {
				poolAddress,
				note: 'Pool lookup requires on-chain data fetching',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPoolsByToken': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const limit = options.limit || 20;

			// Get routing info for common pairs to find pools
			const commonPairs = [COMMON_TOKENS.USDC, COMMON_TOKENS.USDT, COMMON_TOKENS.SOL];
			const pools: any[] = [];

			for (const pairMint of commonPairs) {
				if (pairMint === tokenMint) continue;
				try {
					const quote = await jupiterClient.getQuote({
						inputMint: tokenMint,
						outputMint: pairMint,
						amount: 1000000000,
						slippageBps: 100,
					});

					if (quote.routePlan) {
						for (const step of quote.routePlan) {
							const poolInfo = {
								dex: step.swapInfo?.label,
								ammKey: step.swapInfo?.ammKey,
								tokenA: step.swapInfo?.inputMint,
								tokenB: step.swapInfo?.outputMint,
							};
							if (!pools.find((p) => p.ammKey === poolInfo.ammKey)) {
								pools.push(poolInfo);
							}
						}
					}
				} catch {
					// Route not available
				}
			}

			result = {
				tokenMint,
				pools: pools.slice(0, limit),
				totalFound: pools.length,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
