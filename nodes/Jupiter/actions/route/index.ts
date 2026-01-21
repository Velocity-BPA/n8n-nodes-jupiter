// @ts-nocheck
/**
 * Route Resource Actions
 * Route analysis, filtering, and comparison for token swaps
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import {
	getRouteSummary,
	formatRoute,
	calculateRouteFees,
	filterRoutes,
	analyzeRouteEfficiency,
} from '../../utils/routeUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['route'],
			},
		},
		options: [
			{
				name: 'Get Routes',
				value: 'getRoutes',
				description: 'Get available routes for a swap',
				action: 'Get routes',
			},
			{
				name: 'Get Best Route',
				value: 'getBestRoute',
				description: 'Get the best route for a swap',
				action: 'Get best route',
			},
			{
				name: 'Get Route Details',
				value: 'getRouteDetails',
				description: 'Get detailed information about a route',
				action: 'Get route details',
			},
			{
				name: 'Get Route Hops',
				value: 'getRouteHops',
				description: 'Get individual hops in a route',
				action: 'Get route hops',
			},
			{
				name: 'Get Route Markets',
				value: 'getRouteMarkets',
				description: 'Get markets used in a route',
				action: 'Get route markets',
			},
			{
				name: 'Compare Routes',
				value: 'compareRoutes',
				description: 'Compare multiple routes',
				action: 'Compare routes',
			},
			{
				name: 'Get Route Fees',
				value: 'getRouteFees',
				description: 'Get fees for a route',
				action: 'Get route fees',
			},
			{
				name: 'Get Route Price Impact',
				value: 'getRoutePriceImpact',
				description: 'Get price impact for a route',
				action: 'Get route price impact',
			},
			{
				name: 'Filter Routes',
				value: 'filterRoutes',
				description: 'Filter routes by criteria',
				action: 'Filter routes',
			},
			{
				name: 'Get V6 Routes',
				value: 'getV6Routes',
				description: 'Get routes using Jupiter V6 API',
				action: 'Get V6 routes',
			},
		],
		default: 'getRoutes',
	},
	// Input Token
	{
		displayName: 'Input Token Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The mint address of the input token',
		displayOptions: {
			show: {
				resource: ['route'],
				operation: [
					'getRoutes',
					'getBestRoute',
					'getRouteDetails',
					'getRouteHops',
					'getRouteMarkets',
					'compareRoutes',
					'getRouteFees',
					'getRoutePriceImpact',
					'filterRoutes',
					'getV6Routes',
				],
			},
		},
	},
	// Output Token
	{
		displayName: 'Output Token Mint',
		name: 'outputMint',
		type: 'string',
		default: '',
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'The mint address of the output token',
		displayOptions: {
			show: {
				resource: ['route'],
				operation: [
					'getRoutes',
					'getBestRoute',
					'getRouteDetails',
					'getRouteHops',
					'getRouteMarkets',
					'compareRoutes',
					'getRouteFees',
					'getRoutePriceImpact',
					'filterRoutes',
					'getV6Routes',
				],
			},
		},
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '',
		placeholder: '1000000',
		description: 'The amount in smallest units',
		displayOptions: {
			show: {
				resource: ['route'],
				operation: [
					'getRoutes',
					'getBestRoute',
					'getRouteDetails',
					'getRouteHops',
					'getRouteMarkets',
					'compareRoutes',
					'getRouteFees',
					'getRoutePriceImpact',
					'filterRoutes',
					'getV6Routes',
				],
			},
		},
	},
	// Filter Options
	{
		displayName: 'Filter Options',
		name: 'filterOptions',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['route'],
				operation: ['filterRoutes'],
			},
		},
		options: [
			{
				displayName: 'Max Price Impact',
				name: 'maxPriceImpact',
				type: 'number',
				default: 1,
				description: 'Maximum price impact percentage',
			},
			{
				displayName: 'Max Hops',
				name: 'maxHops',
				type: 'number',
				default: 3,
				description: 'Maximum number of hops in route',
			},
			{
				displayName: 'Required DEXes',
				name: 'requiredDexes',
				type: 'string',
				default: '',
				placeholder: 'Orca,Raydium',
				description: 'Comma-separated list of required DEXes',
			},
			{
				displayName: 'Only Direct',
				name: 'onlyDirect',
				type: 'boolean',
				default: false,
				description: 'Whether to only include direct routes',
			},
		],
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
				resource: ['route'],
			},
		},
		options: [
			{
				displayName: 'Slippage (BPS)',
				name: 'slippageBps',
				type: 'number',
				default: 50,
				description: 'Slippage tolerance in basis points',
			},
			{
				displayName: 'Only Direct Routes',
				name: 'onlyDirectRoutes',
				type: 'boolean',
				default: false,
				description: 'Whether to only use direct swap routes',
			},
			{
				displayName: 'Max Accounts',
				name: 'maxAccounts',
				type: 'number',
				default: 64,
				description: 'Maximum accounts in transaction',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const jupiterClient = await createJupiterClient(this);

	switch (operation) {
		case 'getRoutes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: options.slippageBps as number,
				onlyDirectRoutes: options.onlyDirectRoutes as boolean,
			});

			const routes = quote.routePlan || [];
			const summary = getRouteSummary(routes);

			return [
				{
					json: {
						routes,
						summary,
						totalRoutes: routes.length,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
						priceImpactPct: quote.priceImpactPct,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getBestRoute': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: options.slippageBps as number,
			});

			const bestRoute = quote.routePlan || [];
			const formatted = formatRoute(bestRoute);
			const efficiency = analyzeRouteEfficiency(bestRoute);

			return [
				{
					json: {
						bestRoute,
						formatted,
						efficiency,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
						priceImpactPct: quote.priceImpactPct,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getRouteDetails': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const route = quote.routePlan || [];
			const details = route.map((step: {
				swapInfo: {
					ammKey: string;
					label: string;
					inputMint: string;
					outputMint: string;
					inAmount: string;
					outAmount: string;
					feeAmount: string;
					feeMint: string;
				};
				percent: number;
			}, idx: number) => ({
				step: idx + 1,
				dex: step.swapInfo.label || step.swapInfo.ammKey,
				inputToken: step.swapInfo.inputMint,
				outputToken: step.swapInfo.outputMint,
				inputAmount: step.swapInfo.inAmount,
				outputAmount: step.swapInfo.outAmount,
				fee: step.swapInfo.feeAmount,
				feeMint: step.swapInfo.feeMint,
				percent: step.percent,
			}));

			return [
				{
					json: {
						route,
						details,
						totalSteps: route.length,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getRouteHops': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const hops = (quote.routePlan || []).map((step: {
				swapInfo: {
					ammKey: string;
					label: string;
					inputMint: string;
					outputMint: string;
					inAmount: string;
					outAmount: string;
				};
			}) => ({
				amm: step.swapInfo.ammKey,
				label: step.swapInfo.label,
				from: step.swapInfo.inputMint,
				to: step.swapInfo.outputMint,
				amountIn: step.swapInfo.inAmount,
				amountOut: step.swapInfo.outAmount,
			}));

			return [
				{
					json: {
						hops,
						totalHops: hops.length,
						isDirect: hops.length === 1,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getRouteMarkets': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const markets = (quote.routePlan || []).map((step: {
				swapInfo: {
					ammKey: string;
					label: string;
				};
			}) => ({
				ammKey: step.swapInfo.ammKey,
				label: step.swapInfo.label,
			}));

			const uniqueMarkets = [...new Set(markets.map((m: { label: string }) => m.label))];

			return [
				{
					json: {
						markets,
						uniqueMarkets,
						totalMarkets: markets.length,
						uniqueCount: uniqueMarkets.length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'compareRoutes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			// Get quotes with different configurations
			const [directQuote, multiHopQuote, restrictedQuote] = await Promise.all([
				jupiterClient.getQuote({
					inputMint,
					outputMint,
					amount,
					onlyDirectRoutes: true,
				}).catch(() => null),
				jupiterClient.getQuote({
					inputMint,
					outputMint,
					amount,
					onlyDirectRoutes: false,
				}),
				jupiterClient.getQuote({
					inputMint,
					outputMint,
					amount,
					restrictIntermediateTokens: true,
				}),
			]);

			return [
				{
					json: {
						directRoute: directQuote ? {
							available: true,
							output: directQuote.outAmount,
							priceImpact: directQuote.priceImpactPct,
							hops: directQuote.routePlan?.length || 0,
						} : { available: false },
						multiHopRoute: {
							available: true,
							output: multiHopQuote.outAmount,
							priceImpact: multiHopQuote.priceImpactPct,
							hops: multiHopQuote.routePlan?.length || 0,
						},
						restrictedRoute: {
							available: true,
							output: restrictedQuote.outAmount,
							priceImpact: restrictedQuote.priceImpactPct,
							hops: restrictedQuote.routePlan?.length || 0,
						},
						bestOption: getBestOption(directQuote, multiHopQuote, restrictedQuote),
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getRouteFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const fees = calculateRouteFees(quote.routePlan || []);

			return [
				{
					json: {
						fees,
						platformFee: quote.platformFee,
						totalFees: fees.totalFees,
						route: quote.routePlan,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getRoutePriceImpact': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const priceImpact = parseFloat(quote.priceImpactPct || '0');
			let severity: string;
			let recommendation: string;

			if (priceImpact > 5) {
				severity = 'critical';
				recommendation = 'Consider splitting into smaller trades';
			} else if (priceImpact > 2) {
				severity = 'high';
				recommendation = 'Consider using limit orders instead';
			} else if (priceImpact > 0.5) {
				severity = 'medium';
				recommendation = 'Acceptable for most trades';
			} else {
				severity = 'low';
				recommendation = 'Minimal impact on price';
			}

			return [
				{
					json: {
						priceImpactPct: quote.priceImpactPct,
						priceImpactPercent: priceImpact,
						severity,
						recommendation,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'filterRoutes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const filterOptions = this.getNodeParameter('filterOptions', index, {}) as {
				maxPriceImpact?: number;
				maxHops?: number;
				requiredDexes?: string;
				onlyDirect?: boolean;
			};

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				onlyDirectRoutes: filterOptions.onlyDirect,
			});

			let routes = quote.routePlan || [];

			// Apply filters
			if (filterOptions.maxHops) {
				routes = routes.slice(0, filterOptions.maxHops);
			}

			if (filterOptions.requiredDexes) {
				const required = filterOptions.requiredDexes.split(',').map((d) => d.trim().toLowerCase());
				routes = routes.filter((step: { swapInfo: { label: string } }) =>
					required.some((dex) => step.swapInfo.label?.toLowerCase().includes(dex))
				);
			}

			const meetsImpactCriteria = filterOptions.maxPriceImpact
				? parseFloat(quote.priceImpactPct || '0') <= filterOptions.maxPriceImpact
				: true;

			return [
				{
					json: {
						filteredRoutes: routes,
						totalRoutes: routes.length,
						meetsAllCriteria: routes.length > 0 && meetsImpactCriteria,
						priceImpact: quote.priceImpactPct,
						filtersApplied: filterOptions,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getV6Routes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			// V6 API uses the same endpoint but with specific parameters
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: options.slippageBps as number,
				maxAccounts: options.maxAccounts as number,
			});

			return [
				{
					json: {
						apiVersion: 'v6',
						...quote,
						routeSummary: getRouteSummary(quote.routePlan || []),
					},
					pairedItem: { item: index },
				},
			];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
				itemIndex: index,
			});
	}
}

function getBestOption(
	direct: { outAmount: string } | null,
	multiHop: { outAmount: string },
	restricted: { outAmount: string },
): string {
	const directOut = direct ? BigInt(direct.outAmount) : 0n;
	const multiHopOut = BigInt(multiHop.outAmount);
	const restrictedOut = BigInt(restricted.outAmount);

	if (directOut >= multiHopOut && directOut >= restrictedOut) return 'direct';
	if (multiHopOut >= restrictedOut) return 'multiHop';
	return 'restricted';
}
