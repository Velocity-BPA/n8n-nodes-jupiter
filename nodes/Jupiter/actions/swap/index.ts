// @ts-nocheck
/**
 * Swap Resource Actions
 * Core token swap functionality using Jupiter DEX aggregator
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { createSolanaClient } from '../../transport/solanaClient';
import {
	percentageToBps,
	formatAmount,
	parseAmount,
	validateQuoteParams,
	buildQuoteQueryParams,
	calculateMinimumOutput,
} from '../../utils/quoteUtils';
import { getRouteSummary, formatRoute } from '../../utils/routeUtils';
import { COMMON_TOKENS, DEFAULT_SLIPPAGE } from '../../constants/tokens';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['swap'],
			},
		},
		options: [
			{
				name: 'Get Quote',
				value: 'getQuote',
				description: 'Get a quote for swapping tokens',
				action: 'Get a swap quote',
			},
			{
				name: 'Get Quote with Routes',
				value: 'getQuoteWithRoutes',
				description: 'Get a quote with detailed route information',
				action: 'Get a quote with route details',
			},
			{
				name: 'Execute Swap',
				value: 'executeSwap',
				description: 'Execute a token swap',
				action: 'Execute a token swap',
			},
			{
				name: 'Get Swap Transaction',
				value: 'getSwapTransaction',
				description: 'Get the transaction data for a swap without executing',
				action: 'Get swap transaction data',
			},
			{
				name: 'Get Swap Status',
				value: 'getSwapStatus',
				description: 'Get the status of a swap transaction',
				action: 'Get swap status',
			},
			{
				name: 'Get Swap Instructions',
				value: 'getSwapInstructions',
				description: 'Get individual instructions for a swap',
				action: 'Get swap instructions',
			},
			{
				name: 'Build Swap Transaction',
				value: 'buildSwapTransaction',
				description: 'Build a swap transaction from quote',
				action: 'Build swap transaction',
			},
			{
				name: 'Sign and Send Swap',
				value: 'signAndSendSwap',
				description: 'Sign and send a swap transaction',
				action: 'Sign and send swap',
			},
			{
				name: 'Get Best Route',
				value: 'getBestRoute',
				description: 'Get the best route for a swap',
				action: 'Get best swap route',
			},
			{
				name: 'Compare Routes',
				value: 'compareRoutes',
				description: 'Compare multiple routes for a swap',
				action: 'Compare swap routes',
			},
			{
				name: 'Get Swap Fees',
				value: 'getSwapFees',
				description: 'Calculate fees for a swap',
				action: 'Get swap fees',
			},
			{
				name: 'Estimate Price Impact',
				value: 'estimatePriceImpact',
				description: 'Estimate the price impact of a swap',
				action: 'Estimate price impact',
			},
			{
				name: 'Get Slippage Settings',
				value: 'getSlippageSettings',
				description: 'Get recommended slippage settings',
				action: 'Get slippage settings',
			},
			{
				name: 'Simulate Swap',
				value: 'simulateSwap',
				description: 'Simulate a swap without executing',
				action: 'Simulate swap',
			},
		],
		default: 'getQuote',
	},
	// Input Token
	{
		displayName: 'Input Token Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The mint address of the input token (e.g., SOL, USDC)',
		displayOptions: {
			show: {
				resource: ['swap'],
				operation: [
					'getQuote',
					'getQuoteWithRoutes',
					'executeSwap',
					'getSwapTransaction',
					'getSwapInstructions',
					'buildSwapTransaction',
					'signAndSendSwap',
					'getBestRoute',
					'compareRoutes',
					'getSwapFees',
					'estimatePriceImpact',
					'getSlippageSettings',
					'simulateSwap',
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
				resource: ['swap'],
				operation: [
					'getQuote',
					'getQuoteWithRoutes',
					'executeSwap',
					'getSwapTransaction',
					'getSwapInstructions',
					'buildSwapTransaction',
					'signAndSendSwap',
					'getBestRoute',
					'compareRoutes',
					'getSwapFees',
					'estimatePriceImpact',
					'getSlippageSettings',
					'simulateSwap',
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
		description: 'The amount to swap (in smallest units, e.g., lamports for SOL)',
		displayOptions: {
			show: {
				resource: ['swap'],
				operation: [
					'getQuote',
					'getQuoteWithRoutes',
					'executeSwap',
					'getSwapTransaction',
					'getSwapInstructions',
					'buildSwapTransaction',
					'signAndSendSwap',
					'getBestRoute',
					'compareRoutes',
					'getSwapFees',
					'estimatePriceImpact',
					'getSlippageSettings',
					'simulateSwap',
				],
			},
		},
	},
	// Transaction Signature (for status check)
	{
		displayName: 'Transaction Signature',
		name: 'txSignature',
		type: 'string',
		default: '',
		description: 'The transaction signature to check',
		displayOptions: {
			show: {
				resource: ['swap'],
				operation: ['getSwapStatus'],
			},
		},
	},
	// Quote Data (for transaction building)
	{
		displayName: 'Quote Data',
		name: 'quoteData',
		type: 'json',
		default: '{}',
		description: 'The quote response from a previous getQuote call',
		displayOptions: {
			show: {
				resource: ['swap'],
				operation: ['buildSwapTransaction', 'signAndSendSwap', 'getSwapInstructions'],
			},
		},
	},
	// Additional Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['swap'],
				operation: [
					'getQuote',
					'getQuoteWithRoutes',
					'executeSwap',
					'getSwapTransaction',
					'buildSwapTransaction',
					'signAndSendSwap',
					'getBestRoute',
					'compareRoutes',
					'simulateSwap',
				],
			},
		},
		options: [
			{
				displayName: 'Slippage (BPS)',
				name: 'slippageBps',
				type: 'number',
				default: 50,
				description: 'Slippage tolerance in basis points (50 = 0.5%)',
			},
			{
				displayName: 'Swap Mode',
				name: 'swapMode',
				type: 'options',
				options: [
					{ name: 'Exact In', value: 'ExactIn' },
					{ name: 'Exact Out', value: 'ExactOut' },
				],
				default: 'ExactIn',
				description: 'Whether the amount is exact input or exact output',
			},
			{
				displayName: 'Only Direct Routes',
				name: 'onlyDirectRoutes',
				type: 'boolean',
				default: false,
				description: 'Whether to only use direct swap routes (no intermediate tokens)',
			},
			{
				displayName: 'Restrict Intermediate Tokens',
				name: 'restrictIntermediateTokens',
				type: 'boolean',
				default: false,
				description: 'Whether to restrict to popular intermediate tokens only',
			},
			{
				displayName: 'DEXes',
				name: 'dexes',
				type: 'string',
				default: '',
				placeholder: 'Orca,Raydium',
				description: 'Comma-separated list of DEXes to use (leave empty for all)',
			},
			{
				displayName: 'Exclude DEXes',
				name: 'excludeDexes',
				type: 'string',
				default: '',
				placeholder: 'Saber',
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
				displayName: 'Use Legacy Transaction',
				name: 'asLegacyTransaction',
				type: 'boolean',
				default: false,
				description: 'Whether to use legacy transaction format instead of versioned',
			},
			{
				displayName: 'Priority Fee (Lamports)',
				name: 'prioritizationFeeLamports',
				type: 'number',
				default: 0,
				description: 'Priority fee to add for faster processing',
			},
			{
				displayName: 'Dynamic Compute Unit Limit',
				name: 'dynamicComputeUnitLimit',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically set compute unit limit',
			},
			{
				displayName: 'Dynamic Slippage',
				name: 'dynamicSlippage',
				type: 'boolean',
				default: false,
				description: 'Whether to use dynamic slippage based on market conditions',
			},
			{
				displayName: 'Wrap/Unwrap SOL',
				name: 'wrapAndUnwrapSol',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically wrap/unwrap SOL',
			},
			{
				displayName: 'Fee Account',
				name: 'feeAccount',
				type: 'string',
				default: '',
				description: 'Platform fee account for referral fees',
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
	const solanaClient = await createSolanaClient(this);

	switch (operation) {
		case 'getQuote': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				slippageBps?: number;
				swapMode?: string;
				onlyDirectRoutes?: boolean;
				restrictIntermediateTokens?: boolean;
				dexes?: string;
				excludeDexes?: string;
				maxAccounts?: number;
				asLegacyTransaction?: boolean;
				dynamicSlippage?: boolean;
			};

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: options.slippageBps,
				swapMode: options.swapMode as 'ExactIn' | 'ExactOut',
				onlyDirectRoutes: options.onlyDirectRoutes,
				restrictIntermediateTokens: options.restrictIntermediateTokens,
				dexes: options.dexes ? options.dexes.split(',').map((d) => d.trim()) : undefined,
				excludeDexes: options.excludeDexes
					? options.excludeDexes.split(',').map((d) => d.trim())
					: undefined,
				maxAccounts: options.maxAccounts,
				asLegacyTransaction: options.asLegacyTransaction,
			});

			return [{ json: quote, pairedItem: { item: index } }];
		}

		case 'getQuoteWithRoutes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: options.slippageBps as number,
				swapMode: options.swapMode as 'ExactIn' | 'ExactOut',
			});

			const routeSummary = getRouteSummary(quote.routePlan || []);
			const formattedRoute = formatRoute(quote.routePlan || []);

			return [
				{
					json: {
						...quote,
						routeSummary,
						formattedRoute,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'executeSwap': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			// Get quote first
			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: (options.slippageBps as number) || 50,
				swapMode: options.swapMode as 'ExactIn' | 'ExactOut',
				onlyDirectRoutes: options.onlyDirectRoutes as boolean,
			});

			// Get wallet address
			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(this.getNode(), 'Wallet private key is required for swaps', {
					itemIndex: index,
				});
			}

			// Build swap transaction
			const swapResponse = await jupiterClient.getSwapTransaction({
				quoteResponse: quote,
				userPublicKey: walletAddress,
				wrapAndUnwrapSol: (options.wrapAndUnwrapSol as boolean) ?? true,
				prioritizationFeeLamports: options.prioritizationFeeLamports as number,
				asLegacyTransaction: options.asLegacyTransaction as boolean,
				dynamicComputeUnitLimit: (options.dynamicComputeUnitLimit as boolean) ?? true,
				feeAccount: options.feeAccount as string,
			});

			// Sign and send
			const result = await solanaClient.signAndSendTransaction(swapResponse.swapTransaction);

			return [
				{
					json: {
						success: true,
						signature: result.signature,
						inputMint,
						outputMint,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
						priceImpactPct: quote.priceImpactPct,
						...result,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getSwapTransaction': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: (options.slippageBps as number) || 50,
			});

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required for swap transaction',
					{ itemIndex: index },
				);
			}

			const swapResponse = await jupiterClient.getSwapTransaction({
				quoteResponse: quote,
				userPublicKey: walletAddress,
				wrapAndUnwrapSol: (options.wrapAndUnwrapSol as boolean) ?? true,
				asLegacyTransaction: options.asLegacyTransaction as boolean,
			});

			return [
				{
					json: {
						quote,
						...swapResponse,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getSwapStatus': {
			const txSignature = this.getNodeParameter('txSignature', index) as string;

			const status = await solanaClient.getTransactionStatus(txSignature);

			return [
				{
					json: {
						signature: txSignature,
						...status,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getSwapInstructions': {
			const quoteData = this.getNodeParameter('quoteData', index) as object;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required for swap instructions',
					{ itemIndex: index },
				);
			}

			const instructions = await jupiterClient.getSwapInstructions({
				quoteResponse: quoteData,
				userPublicKey: walletAddress,
			});

			return [{ json: instructions, pairedItem: { item: index } }];
		}

		case 'buildSwapTransaction': {
			const quoteData = this.getNodeParameter('quoteData', index) as object;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required for building transaction',
					{ itemIndex: index },
				);
			}

			const swapResponse = await jupiterClient.getSwapTransaction({
				quoteResponse: quoteData,
				userPublicKey: walletAddress,
				wrapAndUnwrapSol: (options.wrapAndUnwrapSol as boolean) ?? true,
				asLegacyTransaction: options.asLegacyTransaction as boolean,
				prioritizationFeeLamports: options.prioritizationFeeLamports as number,
			});

			return [{ json: swapResponse, pairedItem: { item: index } }];
		}

		case 'signAndSendSwap': {
			const quoteData = this.getNodeParameter('quoteData', index) as object;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(this.getNode(), 'Wallet private key is required for signing', {
					itemIndex: index,
				});
			}

			const swapResponse = await jupiterClient.getSwapTransaction({
				quoteResponse: quoteData,
				userPublicKey: walletAddress,
				wrapAndUnwrapSol: (options.wrapAndUnwrapSol as boolean) ?? true,
			});

			const result = await solanaClient.signAndSendTransaction(swapResponse.swapTransaction);

			return [
				{
					json: {
						success: true,
						...result,
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
				slippageBps: (options.slippageBps as number) || 50,
			});

			const routeSummary = getRouteSummary(quote.routePlan || []);

			return [
				{
					json: {
						bestRoute: quote.routePlan,
						summary: routeSummary,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
						priceImpactPct: quote.priceImpactPct,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'compareRoutes': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			// Get quotes with different settings for comparison
			const [directQuote, multiHopQuote] = await Promise.all([
				jupiterClient.getQuote({
					inputMint,
					outputMint,
					amount,
					onlyDirectRoutes: true,
				}),
				jupiterClient.getQuote({
					inputMint,
					outputMint,
					amount,
					onlyDirectRoutes: false,
				}),
			]);

			return [
				{
					json: {
						directRoute: {
							available: !!directQuote,
							outputAmount: directQuote?.outAmount,
							priceImpact: directQuote?.priceImpactPct,
							routePlan: directQuote?.routePlan,
						},
						multiHopRoute: {
							available: !!multiHopQuote,
							outputAmount: multiHopQuote?.outAmount,
							priceImpact: multiHopQuote?.priceImpactPct,
							routePlan: multiHopQuote?.routePlan,
						},
						recommendation:
							Number(multiHopQuote?.outAmount || 0) > Number(directQuote?.outAmount || 0)
								? 'multi-hop'
								: 'direct',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getSwapFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			return [
				{
					json: {
						platformFee: quote.platformFee || null,
						routingFees:
							quote.routePlan?.map((step: { swapInfo: { feeAmount: string; feeMint: string } }) => ({
								feeAmount: step.swapInfo.feeAmount,
								feeMint: step.swapInfo.feeMint,
							})) || [],
						totalFees: quote.platformFee?.amount || '0',
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'estimatePriceImpact': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const priceImpact = parseFloat(quote.priceImpactPct || '0');
			let severity: 'low' | 'medium' | 'high' | 'very-high' = 'low';
			if (priceImpact > 5) severity = 'very-high';
			else if (priceImpact > 2) severity = 'high';
			else if (priceImpact > 0.5) severity = 'medium';

			return [
				{
					json: {
						priceImpactPct: quote.priceImpactPct,
						severity,
						warning:
							severity === 'very-high' || severity === 'high'
								? 'High price impact detected. Consider splitting your order.'
								: null,
						inputAmount: quote.inAmount,
						outputAmount: quote.outAmount,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getSlippageSettings': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
			});

			const priceImpact = parseFloat(quote.priceImpactPct || '0');
			let recommendedSlippage = 50; // 0.5% default
			if (priceImpact > 2) recommendedSlippage = 200; // 2%
			else if (priceImpact > 1) recommendedSlippage = 100; // 1%
			else if (priceImpact > 0.5) recommendedSlippage = 75; // 0.75%

			const minimumOutput = calculateMinimumOutput(quote.outAmount, recommendedSlippage);

			return [
				{
					json: {
						recommendedSlippageBps: recommendedSlippage,
						recommendedSlippagePct: recommendedSlippage / 100,
						priceImpactPct: quote.priceImpactPct,
						expectedOutput: quote.outAmount,
						minimumOutput,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'simulateSwap': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount,
				slippageBps: (options.slippageBps as number) || 50,
			});

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				// Can still return quote simulation without wallet
				return [
					{
						json: {
							simulated: true,
							walletConnected: false,
							quote,
							routeSummary: getRouteSummary(quote.routePlan || []),
						},
						pairedItem: { item: index },
					},
				];
			}

			const swapResponse = await jupiterClient.getSwapTransaction({
				quoteResponse: quote,
				userPublicKey: walletAddress,
			});

			// Simulate the transaction
			const simulation = await solanaClient.simulateTransaction(swapResponse.swapTransaction);

			return [
				{
					json: {
						simulated: true,
						walletConnected: true,
						quote,
						simulation,
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
