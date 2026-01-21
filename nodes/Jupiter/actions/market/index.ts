// @ts-nocheck
/**
 * Market Resource Actions
 * Market data and DEX information operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { SUPPORTED_DEXES, DEX_LABELS } from '../../constants/dexes';
import { COMMON_TOKENS } from '../../constants/tokens';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['market'],
			},
		},
		options: [
			{
				name: 'Get Markets',
				value: 'getMarkets',
				description: 'Get available markets',
				action: 'Get markets',
			},
			{
				name: 'Get Market Info',
				value: 'getMarketInfo',
				description: 'Get detailed market information',
				action: 'Get market info',
			},
			{
				name: 'Get DEX Markets',
				value: 'getDexMarkets',
				description: 'Get markets for a specific DEX',
				action: 'Get dex markets',
			},
			{
				name: 'Get Market Volume',
				value: 'getMarketVolume',
				description: 'Get market trading volume',
				action: 'Get market volume',
			},
			{
				name: 'Get Market Liquidity',
				value: 'getMarketLiquidity',
				description: 'Get market liquidity information',
				action: 'Get market liquidity',
			},
			{
				name: 'Get Market by Pair',
				value: 'getMarketByPair',
				description: 'Get market data for a token pair',
				action: 'Get market by pair',
			},
			{
				name: 'Get Top Markets',
				value: 'getTopMarkets',
				description: 'Get top markets by volume',
				action: 'Get top markets',
			},
			{
				name: 'Get Market Stats',
				value: 'getMarketStats',
				description: 'Get overall market statistics',
				action: 'Get market stats',
			},
			{
				name: 'Get Supported DEXes',
				value: 'getSupportedDexes',
				description: 'Get list of supported DEXes',
				action: 'Get supported dexes',
			},
		],
		default: 'getMarkets',
	},

	// Input Mint
	{
		displayName: 'Input Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['getMarketByPair', 'getMarketInfo'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The input token mint address',
	},

	// Output Mint
	{
		displayName: 'Output Mint',
		name: 'outputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['getMarketByPair', 'getMarketInfo'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'The output token mint address',
	},

	// DEX selection
	{
		displayName: 'DEX',
		name: 'dex',
		type: 'options',
		options: Object.entries(SUPPORTED_DEXES).map(([key, value]) => ({
			name: DEX_LABELS[value as keyof typeof DEX_LABELS] || key,
			value: value,
		})),
		default: SUPPORTED_DEXES.RAYDIUM,
		required: true,
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['getDexMarkets'],
			},
		},
		description: 'The DEX to get markets from',
	},

	// Token Mint for volume/liquidity
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['market'],
				operation: ['getMarketVolume', 'getMarketLiquidity'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Token mint address (leave empty for overall stats)',
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
				resource: ['market'],
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
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Volume', value: 'volume' },
					{ name: 'Liquidity', value: 'liquidity' },
					{ name: 'Price', value: 'price' },
				],
				default: 'volume',
				description: 'Sort results by',
			},
			{
				displayName: 'Include Pools',
				name: 'includePools',
				type: 'boolean',
				default: true,
				description: 'Whether to include pool details',
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
		sortBy?: string;
		includePools?: boolean;
	};

	let result: any;

	switch (operation) {
		case 'getMarkets': {
			const limit = options.limit || 20;

			// Get indexed route map which contains market information
			const routeMap = await jupiterClient.getIndexedRouteMap();

			const markets = Object.entries(routeMap.indexedRouteMap || {})
				.slice(0, limit)
				.map(([inputIndex, outputIndexes]) => ({
					inputIndex,
					outputCount: (outputIndexes as number[]).length,
				}));

			result = {
				markets,
				totalInputTokens: Object.keys(routeMap.indexedRouteMap || {}).length,
				mintKeys: routeMap.mintKeys?.slice(0, 10), // Sample of mint keys
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getMarketInfo': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;

			// Get quote to understand available routes/markets
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: 1000000000, // 1 token
				slippageBps: 50,
			});

			// Extract market information from the route
			const marketInfo = {
				pair: `${inputMint.substring(0, 8)}.../${outputMint.substring(0, 8)}...`,
				inputMint,
				outputMint,
				routePlan: quote.routePlan?.map((step: any) => ({
					dex: step.swapInfo?.ammKey || 'unknown',
					label: step.swapInfo?.label || 'unknown',
					inputMint: step.swapInfo?.inputMint,
					outputMint: step.swapInfo?.outputMint,
					percent: step.percent,
				})),
				priceImpact: quote.priceImpactPct,
				marketCount: quote.routePlan?.length || 0,
			};

			result = {
				...marketInfo,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getDexMarkets': {
			const dex = this.getNodeParameter('dex', index) as string;
			const limit = options.limit || 20;

			// Get routes filtered by DEX
			const routeMap = await jupiterClient.getIndexedRouteMap();

			result = {
				dex,
				dexLabel: DEX_LABELS[dex as keyof typeof DEX_LABELS] || dex,
				note: 'DEX-specific markets are determined during quote routing',
				totalMints: routeMap.mintKeys?.length || 0,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getMarketVolume': {
			const tokenMint = this.getNodeParameter('tokenMint', index, '') as string;

			result = {
				tokenMint: tokenMint || 'all',
				volume24h: null,
				volume7d: null,
				note: 'Volume data requires integration with Jupiter stats API or analytics provider',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getMarketLiquidity': {
			const tokenMint = this.getNodeParameter('tokenMint', index, '') as string;

			// Get price as proxy for liquidity availability
			if (tokenMint) {
				const prices = await jupiterClient.getPrice([tokenMint]);
				result = {
					tokenMint,
					hasLiquidity: !!prices[tokenMint],
					price: prices[tokenMint]?.price || null,
					note: 'Detailed liquidity data requires pool-level analysis',
					timestamp: new Date().toISOString(),
				};
			} else {
				result = {
					totalValueLocked: null,
					note: 'Overall TVL data requires integration with DeFiLlama or similar',
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getMarketByPair': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;

			// Get quote for the pair
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: 1000000000,
				slippageBps: 50,
			});

			// Get reverse quote
			let reverseQuote = null;
			try {
				reverseQuote = await jupiterClient.getQuote({
					inputMint: outputMint,
					outputMint: inputMint,
					amount: 1000000,
					slippageBps: 50,
				});
			} catch {
				// Reverse route may not exist
			}

			result = {
				pair: {
					base: inputMint,
					quote: outputMint,
				},
				forwardRoute: {
					available: true,
					priceImpact: quote.priceImpactPct,
					dexes: [...new Set(quote.routePlan?.map((r: any) => r.swapInfo?.label) || [])],
				},
				reverseRoute: reverseQuote ? {
					available: true,
					priceImpact: reverseQuote.priceImpactPct,
				} : {
					available: false,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getTopMarkets': {
			const limit = options.limit || 20;

			// Top markets based on common trading pairs
			const topPairs = [
				{ base: COMMON_TOKENS.SOL, quote: COMMON_TOKENS.USDC },
				{ base: COMMON_TOKENS.SOL, quote: COMMON_TOKENS.USDT },
				{ base: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', quote: COMMON_TOKENS.SOL }, // mSOL/SOL
				{ base: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', quote: COMMON_TOKENS.USDC }, // JUP/USDC
			];

			const markets = await Promise.all(
				topPairs.slice(0, limit).map(async (pair) => {
					try {
						const quote = await jupiterClient.getQuote({
							inputMint: pair.base,
							outputMint: pair.quote,
							amount: 1000000000,
							slippageBps: 50,
						});
						return {
							base: pair.base,
							quote: pair.quote,
							available: true,
							priceImpact: quote.priceImpactPct,
						};
					} catch {
						return {
							base: pair.base,
							quote: pair.quote,
							available: false,
						};
					}
				}),
			);

			result = {
				markets,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getMarketStats': {
			const routeMap = await jupiterClient.getIndexedRouteMap();

			result = {
				totalTokens: routeMap.mintKeys?.length || 0,
				totalRoutes: Object.keys(routeMap.indexedRouteMap || {}).length,
				supportedDexes: Object.keys(SUPPORTED_DEXES).length,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getSupportedDexes': {
			const dexes = Object.entries(SUPPORTED_DEXES).map(([key, value]) => ({
				id: value,
				name: DEX_LABELS[value as keyof typeof DEX_LABELS] || key,
				key,
			}));

			result = {
				dexes,
				totalCount: dexes.length,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
