// @ts-nocheck
/**
 * Quote Resource Actions
 * Price quotes and route calculations for token swaps
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { compareQuotes, getRecommendedSlippage, calculatePrice } from '../../utils/quoteUtils';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['quote'],
			},
		},
		options: [
			{
				name: 'Get Quote (Exact In)',
				value: 'getQuoteExactIn',
				description: 'Get a quote for exact input amount',
				action: 'Get quote for exact input',
			},
			{
				name: 'Get Quote (Exact Out)',
				value: 'getQuoteExactOut',
				description: 'Get a quote for exact output amount',
				action: 'Get quote for exact output',
			},
			{
				name: 'Get Quotes (Multiple)',
				value: 'getQuotesMultiple',
				description: 'Get quotes for multiple token pairs',
				action: 'Get multiple quotes',
			},
			{
				name: 'Get Quote with Fees',
				value: 'getQuoteWithFees',
				description: 'Get a quote with detailed fee breakdown',
				action: 'Get quote with fees',
			},
			{
				name: 'Get Quote with Slippage',
				value: 'getQuoteWithSlippage',
				description: 'Get a quote with custom slippage settings',
				action: 'Get quote with slippage',
			},
			{
				name: 'Get Dynamic Slippage Quote',
				value: 'getDynamicSlippageQuote',
				description: 'Get a quote with dynamically calculated slippage',
				action: 'Get dynamic slippage quote',
			},
			{
				name: 'Compare Quotes',
				value: 'compareQuotes',
				description: 'Compare quotes from different configurations',
				action: 'Compare quotes',
			},
			{
				name: 'Get Quote Refresh',
				value: 'getQuoteRefresh',
				description: 'Refresh an existing quote with current prices',
				action: 'Refresh quote',
			},
			{
				name: 'Get Quote Validity',
				value: 'getQuoteValidity',
				description: 'Check if a quote is still valid',
				action: 'Check quote validity',
			},
			{
				name: 'Validate Quote',
				value: 'validateQuote',
				description: 'Validate quote parameters',
				action: 'Validate quote',
			},
		],
		default: 'getQuoteExactIn',
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
				resource: ['quote'],
				operation: [
					'getQuoteExactIn',
					'getQuoteExactOut',
					'getQuoteWithFees',
					'getQuoteWithSlippage',
					'getDynamicSlippageQuote',
					'getQuoteRefresh',
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
				resource: ['quote'],
				operation: [
					'getQuoteExactIn',
					'getQuoteExactOut',
					'getQuoteWithFees',
					'getQuoteWithSlippage',
					'getDynamicSlippageQuote',
					'getQuoteRefresh',
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
		description: 'The amount in smallest units (lamports for SOL)',
		displayOptions: {
			show: {
				resource: ['quote'],
				operation: [
					'getQuoteExactIn',
					'getQuoteExactOut',
					'getQuoteWithFees',
					'getQuoteWithSlippage',
					'getDynamicSlippageQuote',
					'getQuoteRefresh',
				],
			},
		},
	},
	// Token Pairs for multiple quotes
	{
		displayName: 'Token Pairs',
		name: 'tokenPairs',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		placeholder: 'Add Token Pair',
		displayOptions: {
			show: {
				resource: ['quote'],
				operation: ['getQuotesMultiple', 'compareQuotes'],
			},
		},
		options: [
			{
				name: 'pairs',
				displayName: 'Pairs',
				values: [
					{
						displayName: 'Input Mint',
						name: 'inputMint',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Output Mint',
						name: 'outputMint',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Amount',
						name: 'amount',
						type: 'string',
						default: '',
					},
				],
			},
		],
	},
	// Existing Quote Data
	{
		displayName: 'Quote Data',
		name: 'quoteData',
		type: 'json',
		default: '{}',
		description: 'The quote response to validate or refresh',
		displayOptions: {
			show: {
				resource: ['quote'],
				operation: ['getQuoteValidity', 'validateQuote'],
			},
		},
	},
	// Slippage
	{
		displayName: 'Slippage (BPS)',
		name: 'slippageBps',
		type: 'number',
		default: 50,
		description: 'Slippage tolerance in basis points (50 = 0.5%)',
		displayOptions: {
			show: {
				resource: ['quote'],
				operation: ['getQuoteWithSlippage'],
			},
		},
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
				resource: ['quote'],
			},
		},
		options: [
			{
				displayName: 'Only Direct Routes',
				name: 'onlyDirectRoutes',
				type: 'boolean',
				default: false,
				description: 'Whether to only use direct swap routes',
			},
			{
				displayName: 'Restrict Intermediate Tokens',
				name: 'restrictIntermediateTokens',
				type: 'boolean',
				default: false,
				description: 'Whether to restrict to popular intermediate tokens',
			},
			{
				displayName: 'DEXes',
				name: 'dexes',
				type: 'string',
				default: '',
				placeholder: 'Orca,Raydium',
				description: 'Comma-separated list of DEXes to use',
			},
			{
				displayName: 'Exclude DEXes',
				name: 'excludeDexes',
				type: 'string',
				default: '',
				description: 'Comma-separated list of DEXes to exclude',
			},
			{
				displayName: 'Max Accounts',
				name: 'maxAccounts',
				type: 'number',
				default: 64,
				description: 'Maximum number of accounts in transaction',
			},
			{
				displayName: 'Platform Fee (BPS)',
				name: 'platformFeeBps',
				type: 'number',
				default: 0,
				description: 'Platform fee in basis points',
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
		case 'getQuoteExactIn': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				swapMode: 'ExactIn',
				onlyDirectRoutes: options.onlyDirectRoutes as boolean,
				restrictIntermediateTokens: options.restrictIntermediateTokens as boolean,
				dexes: options.dexes ? (options.dexes as string).split(',').map((d) => d.trim()) : undefined,
				excludeDexes: options.excludeDexes
					? (options.excludeDexes as string).split(',').map((d) => d.trim())
					: undefined,
				maxAccounts: options.maxAccounts as number,
				platformFeeBps: options.platformFeeBps as number,
			});

			const price = calculatePrice(quote.inAmount, quote.outAmount, 9, 6);

			return [
				{
					json: {
						...quote,
						calculatedPrice: price,
						swapMode: 'ExactIn',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuoteExactOut': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				swapMode: 'ExactOut',
				onlyDirectRoutes: options.onlyDirectRoutes as boolean,
				dexes: options.dexes ? (options.dexes as string).split(',').map((d) => d.trim()) : undefined,
			});

			return [
				{
					json: {
						...quote,
						swapMode: 'ExactOut',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuotesMultiple': {
			const tokenPairs = this.getNodeParameter('tokenPairs', index) as {
				pairs?: Array<{ inputMint: string; outputMint: string; amount: string }>;
			};
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			if (!tokenPairs.pairs || tokenPairs.pairs.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one token pair is required', {
					itemIndex: index,
				});
			}

			const quotes = await Promise.all(
				tokenPairs.pairs.map(async (pair) => {
					try {
						const quote = await jupiterClient.getQuote({
							inputMint: pair.inputMint,
							outputMint: pair.outputMint,
							amount: pair.amount,
							onlyDirectRoutes: options.onlyDirectRoutes as boolean,
						});
						return { success: true, pair, quote };
					} catch (error) {
						return {
							success: false,
							pair,
							error: error instanceof Error ? error.message : String(error),
						};
					}
				}),
			);

			return [
				{
					json: {
						totalPairs: tokenPairs.pairs.length,
						successfulQuotes: quotes.filter((q) => q.success).length,
						quotes,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuoteWithFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				platformFeeBps: options.platformFeeBps as number,
			});

			// Extract fee information from route plan
			const routeFees =
				quote.routePlan?.map(
					(step: { swapInfo: { feeAmount: string; feeMint: string; ammKey: string } }) => ({
						dex: step.swapInfo.ammKey,
						feeAmount: step.swapInfo.feeAmount,
						feeMint: step.swapInfo.feeMint,
					}),
				) || [];

			return [
				{
					json: {
						...quote,
						feeBreakdown: {
							platformFee: quote.platformFee,
							routeFees,
							totalRouteFees: routeFees.reduce(
								(sum: number, fee: { feeAmount: string }) =>
									sum + parseInt(fee.feeAmount || '0', 10),
								0,
							),
						},
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuoteWithSlippage': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const slippageBps = this.getNodeParameter('slippageBps', index) as number;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps,
			});

			const minimumReceived =
				BigInt(quote.outAmount) - (BigInt(quote.outAmount) * BigInt(slippageBps)) / BigInt(10000);

			return [
				{
					json: {
						...quote,
						slippageSettings: {
							slippageBps,
							slippagePercent: slippageBps / 100,
							minimumReceived: minimumReceived.toString(),
							maximumLoss: (
								BigInt(quote.outAmount) - minimumReceived
							).toString(),
						},
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getDynamicSlippageQuote': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			// Get initial quote to determine price impact
			const initialQuote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			// Calculate dynamic slippage based on price impact
			const recommendedSlippage = getRecommendedSlippage(initialQuote.priceImpactPct || '0');

			// Get quote with dynamic slippage
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: recommendedSlippage,
			});

			return [
				{
					json: {
						...quote,
						dynamicSlippage: {
							calculatedSlippageBps: recommendedSlippage,
							calculatedSlippagePercent: recommendedSlippage / 100,
							basedOnPriceImpact: quote.priceImpactPct,
						},
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'compareQuotes': {
			const tokenPairs = this.getNodeParameter('tokenPairs', index) as {
				pairs?: Array<{ inputMint: string; outputMint: string; amount: string }>;
			};

			if (!tokenPairs.pairs || tokenPairs.pairs.length < 2) {
				throw new NodeOperationError(
					this.getNode(),
					'At least two token pairs are required for comparison',
					{ itemIndex: index },
				);
			}

			const quotes = await Promise.all(
				tokenPairs.pairs.map(async (pair) => {
					const quote = await jupiterClient.getQuote({
						inputMint: pair.inputMint,
						outputMint: pair.outputMint,
						amount: pair.amount,
					});
					return { pair, quote };
				}),
			);

			// Compare quotes
			const comparison = compareQuotes(
				quotes[0].quote,
				quotes[1].quote,
			);

			return [
				{
					json: {
						quotes,
						comparison,
						bestQuote: comparison.outputDiff > 0 ? 'first' : 'second',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuoteRefresh': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const freshQuote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				onlyDirectRoutes: options.onlyDirectRoutes as boolean,
			});

			return [
				{
					json: {
						...freshQuote,
						refreshedAt: new Date().toISOString(),
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getQuoteValidity': {
			const quoteData = this.getNodeParameter('quoteData', index) as {
				inputMint?: string;
				outputMint?: string;
				inAmount?: string;
				outAmount?: string;
				priceImpactPct?: string;
			};

			if (!quoteData.inputMint || !quoteData.outputMint || !quoteData.inAmount) {
				return [
					{
						json: {
							valid: false,
							reason: 'Missing required quote fields',
						},
						pairedItem: { item: index },
					},
				];
			}

			// Get fresh quote to compare
			const freshQuote = await jupiterClient.getQuote({
				inputMint: quoteData.inputMint,
				outputMint: quoteData.outputMint,
				amount: quoteData.inAmount,
			});

			const originalOutput = BigInt(quoteData.outAmount || '0');
			const freshOutput = BigInt(freshQuote.outAmount);
			const difference = originalOutput > freshOutput
				? originalOutput - freshOutput
				: freshOutput - originalOutput;
			const percentChange = originalOutput > 0n
				? (Number(difference) / Number(originalOutput)) * 100
				: 0;

			return [
				{
					json: {
						valid: percentChange < 1, // Valid if less than 1% change
						originalOutput: quoteData.outAmount,
						currentOutput: freshQuote.outAmount,
						percentChange: percentChange.toFixed(4),
						recommendation: percentChange > 1 ? 'Refresh quote before executing' : 'Quote is still valid',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'validateQuote': {
			const quoteData = this.getNodeParameter('quoteData', index) as Record<string, unknown>;

			const validationResults = {
				hasInputMint: !!quoteData.inputMint,
				hasOutputMint: !!quoteData.outputMint,
				hasInAmount: !!quoteData.inAmount,
				hasOutAmount: !!quoteData.outAmount,
				hasRoutePlan: Array.isArray(quoteData.routePlan) && quoteData.routePlan.length > 0,
				hasPriceImpact: quoteData.priceImpactPct !== undefined,
			};

			const isValid = Object.values(validationResults).every((v) => v);

			const priceImpact = parseFloat(quoteData.priceImpactPct as string || '0');
			const warnings: string[] = [];
			if (priceImpact > 5) warnings.push('Very high price impact (>5%)');
			else if (priceImpact > 2) warnings.push('High price impact (>2%)');

			return [
				{
					json: {
						valid: isValid,
						validationResults,
						warnings,
						quote: quoteData,
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
