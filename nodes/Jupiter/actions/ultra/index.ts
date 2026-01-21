// @ts-nocheck
/**
 * Ultra Resource Actions
 * Operations for Jupiter Ultra - optimized swap execution
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient, createSolanaClient } from '../../transport/jupiterClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['ultra'],
			},
		},
		options: [
			{
				name: 'Get Ultra Quote',
				value: 'getQuote',
				description: 'Get an optimized Ultra quote for a swap',
				action: 'Get Ultra quote',
			},
			{
				name: 'Execute Ultra Swap',
				value: 'executeSwap',
				description: 'Execute a swap using Ultra optimization',
				action: 'Execute Ultra swap',
			},
			{
				name: 'Get Ultra Status',
				value: 'getStatus',
				description: 'Get status of an Ultra swap',
				action: 'Get Ultra status',
			},
			{
				name: 'Get Ultra Transaction',
				value: 'getTransaction',
				description: 'Get transaction details for an Ultra swap',
				action: 'Get Ultra transaction',
			},
		],
		default: 'getQuote',
	},
	// Input token mint
	{
		displayName: 'Input Token Mint',
		name: 'inputMint',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Mint address of the token to swap from',
		displayOptions: {
			show: {
				resource: ['ultra'],
				operation: ['getQuote', 'executeSwap'],
			},
		},
	},
	// Output token mint
	{
		displayName: 'Output Token Mint',
		name: 'outputMint',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'Mint address of the token to swap to',
		displayOptions: {
			show: {
				resource: ['ultra'],
				operation: ['getQuote', 'executeSwap'],
			},
		},
	},
	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Amount of input token to swap (in smallest unit)',
		displayOptions: {
			show: {
				resource: ['ultra'],
				operation: ['getQuote', 'executeSwap'],
			},
		},
	},
	// Quote data for execute
	{
		displayName: 'Quote Data',
		name: 'quoteData',
		type: 'json',
		required: true,
		default: '{}',
		description: 'Quote data from Ultra getQuote operation',
		displayOptions: {
			show: {
				resource: ['ultra'],
				operation: ['executeSwap'],
			},
		},
	},
	// Transaction/Order ID for status
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		description: 'Ultra order ID',
		displayOptions: {
			show: {
				resource: ['ultra'],
				operation: ['getStatus', 'getTransaction'],
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
				resource: ['ultra'],
				operation: ['getQuote', 'executeSwap'],
			},
		},
		options: [
			{
				displayName: 'Slippage (BPS)',
				name: 'slippageBps',
				type: 'number',
				default: 50,
				description: 'Maximum slippage in basis points (50 = 0.5%)',
			},
			{
				displayName: 'Restrict To Direct Routes',
				name: 'onlyDirectRoutes',
				type: 'boolean',
				default: false,
				description: 'Only use direct swap routes (no multi-hop)',
			},
			{
				displayName: 'Use Versioned Transaction',
				name: 'useVersionedTransaction',
				type: 'boolean',
				default: true,
				description: 'Use Solana versioned transactions',
			},
			{
				displayName: 'Priority Level',
				name: 'priorityLevel',
				type: 'options',
				default: 'medium',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'High', value: 'high' },
					{ name: 'Very High', value: 'veryHigh' },
				],
				description: 'Transaction priority level',
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
	const solanaClient = await createSolanaClient.call(this);

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getQuote': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const options = this.getNodeParameter('options', index, {}) as {
				slippageBps?: number;
				onlyDirectRoutes?: boolean;
				priorityLevel?: string;
			};

			// Get Ultra-optimized quote
			const quote = await jupiterClient.getUltraQuote({
				inputMint,
				outputMint,
				amount: amount.toString(),
				slippageBps: options.slippageBps || 50,
				onlyDirectRoutes: options.onlyDirectRoutes || false,
				priorityLevel: options.priorityLevel || 'medium',
			});

			result = {
				inputMint,
				outputMint,
				inputAmount: quote.inputAmount,
				outputAmount: quote.outputAmount,
				otherAmountThreshold: quote.otherAmountThreshold,
				slippageBps: quote.slippageBps,
				priceImpactPct: quote.priceImpactPct,
				routePlan: quote.routePlan,
				optimizationType: 'ultra',
				estimatedPriorityFee: quote.estimatedPriorityFee,
				expiresAt: quote.expiresAt,
				quoteId: quote.quoteId,
				// Include full quote for execution
				quoteData: quote,
			};
			break;
		}

		case 'executeSwap': {
			const quoteDataJson = this.getNodeParameter('quoteData', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				useVersionedTransaction?: boolean;
				priorityLevel?: string;
			};

			let quoteData;
			try {
				quoteData = typeof quoteDataJson === 'string' ? JSON.parse(quoteDataJson) : quoteDataJson;
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid quote data JSON');
			}

			// Get wallet address
			const walletAddress = await solanaClient.getWalletAddress();

			// Execute Ultra swap
			const swapResult = await jupiterClient.executeUltraSwap({
				quoteResponse: quoteData,
				userPublicKey: walletAddress,
				useVersionedTransaction: options.useVersionedTransaction ?? true,
				priorityLevel: options.priorityLevel || 'medium',
			});

			if (swapResult.transaction) {
				// Sign and send the transaction
				const signature = await solanaClient.signAndSendTransaction(swapResult.transaction);

				result = {
					success: true,
					signature,
					orderId: swapResult.orderId,
					inputAmount: quoteData.inputAmount,
					outputAmount: quoteData.outputAmount,
					inputMint: quoteData.inputMint,
					outputMint: quoteData.outputMint,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build Ultra swap transaction');
			}
			break;
		}

		case 'getStatus': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const status = await jupiterClient.getUltraStatus(orderId);

			result = {
				orderId,
				status: status.status,
				inputMint: status.inputMint,
				outputMint: status.outputMint,
				inputAmount: status.inputAmount,
				outputAmount: status.outputAmount,
				filledAmount: status.filledAmount,
				signature: status.signature,
				createdAt: status.createdAt,
				updatedAt: status.updatedAt,
				error: status.error || null,
			};
			break;
		}

		case 'getTransaction': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const txDetails = await jupiterClient.getUltraTransaction(orderId);

			result = {
				orderId,
				signature: txDetails.signature,
				status: txDetails.status,
				slot: txDetails.slot,
				blockTime: txDetails.blockTime,
				fee: txDetails.fee,
				inputToken: {
					mint: txDetails.inputMint,
					amount: txDetails.inputAmount,
				},
				outputToken: {
					mint: txDetails.outputMint,
					amount: txDetails.outputAmount,
				},
				priceImpact: txDetails.priceImpact,
				route: txDetails.route,
				explorerUrl: `https://solscan.io/tx/${txDetails.signature}`,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
