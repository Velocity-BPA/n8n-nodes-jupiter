// @ts-nocheck
/**
 * Limit Order Resource Actions
 * Create and manage limit orders on Jupiter
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createLimitOrderClient } from '../../transport/limitOrderClient';
import { createSolanaClient } from '../../transport/solanaClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['limitOrder'],
			},
		},
		options: [
			{
				name: 'Create Limit Order',
				value: 'createOrder',
				description: 'Create a new limit order',
				action: 'Create limit order',
			},
			{
				name: 'Get Limit Order',
				value: 'getOrder',
				description: 'Get details of a limit order',
				action: 'Get limit order',
			},
			{
				name: 'Get Open Orders',
				value: 'getOpenOrders',
				description: 'Get all open orders for a wallet',
				action: 'Get open orders',
			},
			{
				name: 'Get Order History',
				value: 'getOrderHistory',
				description: 'Get order history for a wallet',
				action: 'Get order history',
			},
			{
				name: 'Cancel Order',
				value: 'cancelOrder',
				description: 'Cancel a limit order',
				action: 'Cancel limit order',
			},
			{
				name: 'Cancel All Orders',
				value: 'cancelAllOrders',
				description: 'Cancel all open orders',
				action: 'Cancel all orders',
			},
			{
				name: 'Get Order Status',
				value: 'getOrderStatus',
				description: 'Get the current status of an order',
				action: 'Get order status',
			},
			{
				name: 'Get Order by ID',
				value: 'getOrderById',
				description: 'Get order by its public key',
				action: 'Get order by ID',
			},
			{
				name: 'Get Orders by Wallet',
				value: 'getOrdersByWallet',
				description: 'Get all orders for a wallet address',
				action: 'Get orders by wallet',
			},
			{
				name: 'Update Order',
				value: 'updateOrder',
				description: 'Update an existing order (cancel and recreate)',
				action: 'Update order',
			},
			{
				name: 'Get Order Book',
				value: 'getOrderBook',
				description: 'Get order book for a token pair',
				action: 'Get order book',
			},
		],
		default: 'createOrder',
	},
	// Input Token
	{
		displayName: 'Input Token Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The mint address of the token to sell',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['createOrder', 'updateOrder', 'getOrderBook'],
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
		description: 'The mint address of the token to buy',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['createOrder', 'updateOrder', 'getOrderBook'],
			},
		},
	},
	// Amount to sell
	{
		displayName: 'Input Amount',
		name: 'inAmount',
		type: 'string',
		default: '',
		placeholder: '1000000',
		description: 'Amount of input token to sell (in smallest units)',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['createOrder', 'updateOrder'],
			},
		},
	},
	// Amount to receive
	{
		displayName: 'Output Amount',
		name: 'outAmount',
		type: 'string',
		default: '',
		placeholder: '1000000',
		description: 'Minimum amount of output token to receive (in smallest units)',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['createOrder', 'updateOrder'],
			},
		},
	},
	// Order ID
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		description: 'The public key of the order',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['getOrder', 'cancelOrder', 'getOrderStatus', 'getOrderById', 'updateOrder'],
			},
		},
	},
	// Wallet Address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		description: 'Wallet address (leave empty to use connected wallet)',
		displayOptions: {
			show: {
				resource: ['limitOrder'],
				operation: ['getOpenOrders', 'getOrderHistory', 'cancelAllOrders', 'getOrdersByWallet'],
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
				resource: ['limitOrder'],
			},
		},
		options: [
			{
				displayName: 'Expiry (Seconds)',
				name: 'expiredAt',
				type: 'number',
				default: 0,
				description: 'Order expiry time in seconds from now (0 for never)',
			},
			{
				displayName: 'Fee (BPS)',
				name: 'feeBps',
				type: 'number',
				default: 0,
				description: 'Referral fee in basis points',
			},
			{
				displayName: 'Include Filled',
				name: 'includeFilled',
				type: 'boolean',
				default: false,
				description: 'Whether to include filled orders in results',
			},
			{
				displayName: 'Include Cancelled',
				name: 'includeCancelled',
				type: 'boolean',
				default: false,
				description: 'Whether to include cancelled orders',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of orders to return',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const limitOrderClient = await createLimitOrderClient(this);
	const solanaClient = await createSolanaClient(this);

	switch (operation) {
		case 'createOrder': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const inAmount = this.getNodeParameter('inAmount', index) as string;
			const outAmount = this.getNodeParameter('outAmount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to create orders',
					{ itemIndex: index },
				);
			}

			const result = await limitOrderClient.createOrder({
				inputMint,
				outputMint,
				inAmount,
				outAmount,
				maker: walletAddress,
				expiredAt: options.expiredAt as number,
				feeBps: options.feeBps as number,
			});

			// Sign and send the transaction
			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							orderPubkey: result.orderPubkey,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

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

		case 'getOrder': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const order = await limitOrderClient.getOrder(orderId);

			return [
				{
					json: {
						order,
						orderId,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOpenOrders': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress() || '';
			}

			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required',
					{ itemIndex: index },
				);
			}

			const orders = await limitOrderClient.getOpenOrders(walletAddress);

			return [
				{
					json: {
						orders,
						totalOrders: orders.length,
						wallet: walletAddress,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOrderHistory': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress() || '';
			}

			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required',
					{ itemIndex: index },
				);
			}

			const history = await limitOrderClient.getOrderHistory(walletAddress);

			return [
				{
					json: {
						history,
						totalOrders: history.length,
						wallet: walletAddress,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'cancelOrder': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to cancel orders',
					{ itemIndex: index },
				);
			}

			const result = await limitOrderClient.cancelOrders({
				maker: walletAddress,
				orders: [orderId],
			});

			if (result.txs && result.txs.length > 0) {
				const txResult = await solanaClient.signAndSendTransaction(result.txs[0]);
				return [
					{
						json: {
							success: true,
							cancelledOrder: orderId,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [
				{
					json: {
						success: true,
						cancelledOrder: orderId,
						...result,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'cancelAllOrders': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress() || '';
			}

			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required',
					{ itemIndex: index },
				);
			}

			// First get all open orders
			const openOrders = await limitOrderClient.getOpenOrders(walletAddress);

			if (openOrders.length === 0) {
				return [
					{
						json: {
							success: true,
							message: 'No open orders to cancel',
							cancelledCount: 0,
						},
						pairedItem: { item: index },
					},
				];
			}

			const orderIds = openOrders.map((order: { publicKey: string }) => order.publicKey);

			const result = await limitOrderClient.cancelOrders({
				maker: walletAddress,
				orders: orderIds,
			});

			// Sign and send all cancel transactions
			const txResults = [];
			for (const tx of result.txs || []) {
				try {
					const txResult = await solanaClient.signAndSendTransaction(tx);
					txResults.push(txResult);
				} catch (error) {
					txResults.push({ error: error instanceof Error ? error.message : String(error) });
				}
			}

			return [
				{
					json: {
						success: true,
						cancelledCount: orderIds.length,
						orderIds,
						transactions: txResults,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOrderStatus': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const order = await limitOrderClient.getOrder(orderId);

			let status = 'unknown';
			if (order) {
				const fillPercentage = limitOrderClient.calculateFillPercentage(
					order.oriMakingAmount,
					order.makingAmount,
				);
				if (fillPercentage >= 100) {
					status = 'filled';
				} else if (fillPercentage > 0) {
					status = 'partially_filled';
				} else {
					status = 'open';
				}
			}

			return [
				{
					json: {
						orderId,
						status,
						order,
						fillPercentage: order
							? limitOrderClient.calculateFillPercentage(order.oriMakingAmount, order.makingAmount)
							: 0,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOrderById': {
			const orderId = this.getNodeParameter('orderId', index) as string;

			const order = await limitOrderClient.getOrder(orderId);

			if (!order) {
				throw new NodeOperationError(
					this.getNode(),
					`Order not found: ${orderId}`,
					{ itemIndex: index },
				);
			}

			return [
				{
					json: {
						order,
						orderId,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOrdersByWallet': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress() || '';
			}

			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet address is required',
					{ itemIndex: index },
				);
			}

			const orders = await limitOrderClient.getOrders(walletAddress);

			return [
				{
					json: {
						orders,
						totalOrders: orders.length,
						wallet: walletAddress,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'updateOrder': {
			const orderId = this.getNodeParameter('orderId', index) as string;
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const inAmount = this.getNodeParameter('inAmount', index) as string;
			const outAmount = this.getNodeParameter('outAmount', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to update orders',
					{ itemIndex: index },
				);
			}

			// Cancel the existing order
			const cancelResult = await limitOrderClient.cancelOrders({
				maker: walletAddress,
				orders: [orderId],
			});

			if (cancelResult.txs && cancelResult.txs.length > 0) {
				await solanaClient.signAndSendTransaction(cancelResult.txs[0]);
			}

			// Create new order with updated parameters
			const createResult = await limitOrderClient.createOrder({
				inputMint,
				outputMint,
				inAmount,
				outAmount,
				maker: walletAddress,
				expiredAt: options.expiredAt as number,
				feeBps: options.feeBps as number,
			});

			if (createResult.tx) {
				const txResult = await solanaClient.signAndSendTransaction(createResult.tx);
				return [
					{
						json: {
							success: true,
							cancelledOrder: orderId,
							newOrderPubkey: createResult.orderPubkey,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [
				{
					json: {
						success: true,
						cancelledOrder: orderId,
						newOrder: createResult,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOrderBook': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;

			// Get trade history which represents the order book activity
			const tradeHistory = await limitOrderClient.getTradeHistory(inputMint, outputMint);

			return [
				{
					json: {
						pair: {
							inputMint,
							outputMint,
						},
						trades: tradeHistory,
						totalTrades: tradeHistory.length,
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
