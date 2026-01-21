// @ts-nocheck
/**
 * Trigger Order Resource Actions
 * Operations for Jupiter trigger orders - conditional trading
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
				resource: ['triggerOrder'],
			},
		},
		options: [
			{
				name: 'Create Trigger Order',
				value: 'create',
				description: 'Create a new trigger order',
				action: 'Create trigger order',
			},
			{
				name: 'Get Trigger Order',
				value: 'getOrder',
				description: 'Get details of a trigger order',
				action: 'Get trigger order',
			},
			{
				name: 'Get Trigger Orders',
				value: 'getOrders',
				description: 'Get all trigger orders for a wallet',
				action: 'Get trigger orders',
			},
			{
				name: 'Cancel Trigger Order',
				value: 'cancel',
				description: 'Cancel a trigger order',
				action: 'Cancel trigger order',
			},
			{
				name: 'Get Trigger Order Status',
				value: 'getStatus',
				description: 'Get status of a trigger order',
				action: 'Get trigger order status',
			},
			{
				name: 'Update Trigger Order',
				value: 'update',
				description: 'Update a trigger order',
				action: 'Update trigger order',
			},
			{
				name: 'Get Triggered Events',
				value: 'getEvents',
				description: 'Get triggered events for orders',
				action: 'Get triggered events',
			},
		],
		default: 'create',
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
				resource: ['triggerOrder'],
				operation: ['create'],
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
				resource: ['triggerOrder'],
				operation: ['create'],
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
		description: 'Amount of input token to swap',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['create'],
			},
		},
	},
	// Trigger type
	{
		displayName: 'Trigger Type',
		name: 'triggerType',
		type: 'options',
		required: true,
		default: 'price',
		options: [
			{ name: 'Price Above', value: 'priceAbove' },
			{ name: 'Price Below', value: 'priceBelow' },
			{ name: 'Percent Change Up', value: 'percentUp' },
			{ name: 'Percent Change Down', value: 'percentDown' },
			{ name: 'Time Based', value: 'time' },
		],
		description: 'Type of trigger condition',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['create'],
			},
		},
	},
	// Trigger price
	{
		displayName: 'Trigger Price',
		name: 'triggerPrice',
		type: 'number',
		required: true,
		default: 0,
		description: 'Price at which to trigger the order',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['create'],
				triggerType: ['priceAbove', 'priceBelow'],
			},
		},
	},
	// Trigger percent
	{
		displayName: 'Trigger Percent',
		name: 'triggerPercent',
		type: 'number',
		required: true,
		default: 5,
		description: 'Percentage change to trigger the order',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['create'],
				triggerType: ['percentUp', 'percentDown'],
			},
		},
	},
	// Trigger time
	{
		displayName: 'Trigger Time',
		name: 'triggerTime',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'Time to trigger the order',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['create'],
				triggerType: ['time'],
			},
		},
	},
	// Order ID
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		description: 'The trigger order ID',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['getOrder', 'cancel', 'getStatus', 'update'],
			},
		},
	},
	// Wallet address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Solana wallet address (leave empty to use connected wallet)',
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['getOrders', 'getEvents'],
			},
		},
	},
	// Update parameters
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['triggerOrder'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'New Amount',
				name: 'newAmount',
				type: 'number',
				default: 0,
				description: 'New amount for the order',
			},
			{
				displayName: 'New Trigger Price',
				name: 'newTriggerPrice',
				type: 'number',
				default: 0,
				description: 'New trigger price',
			},
			{
				displayName: 'New Trigger Percent',
				name: 'newTriggerPercent',
				type: 'number',
				default: 0,
				description: 'New trigger percentage',
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
				resource: ['triggerOrder'],
				operation: ['create', 'getOrders', 'getEvents'],
			},
		},
		options: [
			{
				displayName: 'Slippage (BPS)',
				name: 'slippageBps',
				type: 'number',
				default: 100,
				description: 'Maximum slippage in basis points',
			},
			{
				displayName: 'Expiry (Hours)',
				name: 'expiryHours',
				type: 'number',
				default: 24,
				description: 'Hours until order expires',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				description: 'Maximum number of results',
			},
			{
				displayName: 'Status Filter',
				name: 'status',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Active', value: 'active' },
					{ name: 'Triggered', value: 'triggered' },
					{ name: 'Executed', value: 'executed' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Expired', value: 'expired' },
				],
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
		case 'create': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;
			const triggerType = this.getNodeParameter('triggerType', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				slippageBps?: number;
				expiryHours?: number;
			};

			// Get trigger condition based on type
			let triggerCondition: Record<string, unknown>;
			switch (triggerType) {
				case 'priceAbove':
				case 'priceBelow': {
					const triggerPrice = this.getNodeParameter('triggerPrice', index) as number;
					triggerCondition = {
						type: triggerType,
						price: triggerPrice,
					};
					break;
				}
				case 'percentUp':
				case 'percentDown': {
					const triggerPercent = this.getNodeParameter('triggerPercent', index) as number;
					triggerCondition = {
						type: triggerType,
						percent: triggerPercent,
					};
					break;
				}
				case 'time': {
					const triggerTime = this.getNodeParameter('triggerTime', index) as string;
					triggerCondition = {
						type: triggerType,
						timestamp: new Date(triggerTime).getTime(),
					};
					break;
				}
				default:
					throw new NodeOperationError(this.getNode(), `Unknown trigger type: ${triggerType}`);
			}

			const walletAddress = await solanaClient.getWalletAddress();

			// Create trigger order
			const createResult = await jupiterClient.createTriggerOrder({
				inputMint,
				outputMint,
				amount: amount.toString(),
				triggerCondition,
				slippageBps: options.slippageBps || 100,
				expiryHours: options.expiryHours || 24,
				userPublicKey: walletAddress,
			});

			if (createResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(createResult.transaction);
				result = {
					success: true,
					signature,
					orderId: createResult.orderId,
					inputMint,
					outputMint,
					amount,
					triggerCondition,
					expiresAt: createResult.expiresAt,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build trigger order transaction');
			}
			break;
		}

		case 'getOrder': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const order = await jupiterClient.getTriggerOrder(orderId);

			result = {
				orderId: order.orderId,
				inputMint: order.inputMint,
				outputMint: order.outputMint,
				amount: order.amount,
				filledAmount: order.filledAmount,
				status: order.status,
				triggerCondition: order.triggerCondition,
				currentPrice: order.currentPrice,
				createdAt: order.createdAt,
				expiresAt: order.expiresAt,
				triggeredAt: order.triggeredAt || null,
				executedAt: order.executedAt || null,
				signature: order.signature || null,
			};
			break;
		}

		case 'getOrders': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
				status?: string;
			};

			const orders = await jupiterClient.getTriggerOrders(wallet, {
				limit: options.limit || 10,
				status: options.status !== 'all' ? options.status : undefined,
			});

			result = {
				wallet,
				orders: orders.map((order: Record<string, unknown>) => ({
					orderId: order.orderId,
					inputMint: order.inputMint,
					outputMint: order.outputMint,
					amount: order.amount,
					status: order.status,
					triggerType: (order.triggerCondition as Record<string, unknown>)?.type,
					createdAt: order.createdAt,
					expiresAt: order.expiresAt,
				})),
				total: orders.length,
			};
			break;
		}

		case 'cancel': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const cancelResult = await jupiterClient.cancelTriggerOrder(orderId);

			if (cancelResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(cancelResult.transaction);
				result = {
					success: true,
					signature,
					orderId,
					status: 'cancelled',
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build cancel transaction');
			}
			break;
		}

		case 'getStatus': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const status = await jupiterClient.getTriggerOrderStatus(orderId);

			result = {
				orderId,
				status: status.status,
				triggerCondition: status.triggerCondition,
				currentValue: status.currentValue,
				distanceToTrigger: status.distanceToTrigger,
				isTriggered: status.isTriggered,
				isExecuted: status.isExecuted,
				isCancelled: status.isCancelled,
				isExpired: status.isExpired,
			};
			break;
		}

		case 'update': {
			const orderId = this.getNodeParameter('orderId', index) as string;
			const updateFields = this.getNodeParameter('updateFields', index) as {
				newAmount?: number;
				newTriggerPrice?: number;
				newTriggerPercent?: number;
			};

			if (Object.keys(updateFields).length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one update field is required');
			}

			const updateResult = await jupiterClient.updateTriggerOrder(orderId, updateFields);

			if (updateResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(updateResult.transaction);
				result = {
					success: true,
					signature,
					orderId,
					updatedFields: updateFields,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build update transaction');
			}
			break;
		}

		case 'getEvents': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
			};

			const events = await jupiterClient.getTriggerEvents(wallet, options.limit || 10);

			result = {
				wallet,
				events: events.map((event: Record<string, unknown>) => ({
					orderId: event.orderId,
					eventType: event.eventType,
					inputMint: event.inputMint,
					outputMint: event.outputMint,
					amount: event.amount,
					outputAmount: event.outputAmount,
					triggerPrice: event.triggerPrice,
					executionPrice: event.executionPrice,
					timestamp: event.timestamp,
					signature: event.signature,
				})),
				total: events.length,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
