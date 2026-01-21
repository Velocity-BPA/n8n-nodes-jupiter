// @ts-nocheck
/**
 * Perpetuals Resource Actions
 * Perpetual futures trading on Jupiter
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createPerpClient } from '../../transport/perpClient';
import { createSolanaClient } from '../../transport/solanaClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['perpetuals'],
			},
		},
		options: [
			{
				name: 'Get Perpetual Markets',
				value: 'getMarkets',
				description: 'Get all available perpetual markets',
				action: 'Get perpetual markets',
			},
			{
				name: 'Get Market Info',
				value: 'getMarketInfo',
				description: 'Get detailed info for a market',
				action: 'Get market info',
			},
			{
				name: 'Get Position',
				value: 'getPosition',
				description: 'Get a specific position',
				action: 'Get position',
			},
			{
				name: 'Get Positions',
				value: 'getPositions',
				description: 'Get all positions for a wallet',
				action: 'Get positions',
			},
			{
				name: 'Open Position',
				value: 'openPosition',
				description: 'Open a new perpetual position',
				action: 'Open position',
			},
			{
				name: 'Close Position',
				value: 'closePosition',
				description: 'Close an existing position',
				action: 'Close position',
			},
			{
				name: 'Increase Position',
				value: 'increasePosition',
				description: 'Increase position size',
				action: 'Increase position',
			},
			{
				name: 'Decrease Position',
				value: 'decreasePosition',
				description: 'Decrease position size',
				action: 'Decrease position',
			},
			{
				name: 'Get Funding Rate',
				value: 'getFundingRate',
				description: 'Get current funding rate',
				action: 'Get funding rate',
			},
			{
				name: 'Get Open Interest',
				value: 'getOpenInterest',
				description: 'Get open interest for a market',
				action: 'Get open interest',
			},
			{
				name: 'Get Liquidation Price',
				value: 'getLiquidationPrice',
				description: 'Calculate liquidation price',
				action: 'Get liquidation price',
			},
			{
				name: 'Get PnL',
				value: 'getPnL',
				description: 'Get profit and loss for position',
				action: 'Get PnL',
			},
			{
				name: 'Add Collateral',
				value: 'addCollateral',
				description: 'Add collateral to position',
				action: 'Add collateral',
			},
			{
				name: 'Remove Collateral',
				value: 'removeCollateral',
				description: 'Remove collateral from position',
				action: 'Remove collateral',
			},
			{
				name: 'Set Stop Loss',
				value: 'setStopLoss',
				description: 'Set stop loss for position',
				action: 'Set stop loss',
			},
			{
				name: 'Set Take Profit',
				value: 'setTakeProfit',
				description: 'Set take profit for position',
				action: 'Set take profit',
			},
		],
		default: 'getMarkets',
	},
	// Market
	{
		displayName: 'Market',
		name: 'market',
		type: 'options',
		options: [
			{ name: 'SOL-PERP', value: 'SOL-PERP' },
			{ name: 'BTC-PERP', value: 'BTC-PERP' },
			{ name: 'ETH-PERP', value: 'ETH-PERP' },
		],
		default: 'SOL-PERP',
		description: 'The perpetual market to trade',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: [
					'getMarketInfo',
					'openPosition',
					'getFundingRate',
					'getOpenInterest',
				],
			},
		},
	},
	// Position Key
	{
		displayName: 'Position Key',
		name: 'positionKey',
		type: 'string',
		default: '',
		description: 'The public key of the position',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: [
					'getPosition',
					'closePosition',
					'increasePosition',
					'decreasePosition',
					'getLiquidationPrice',
					'getPnL',
					'addCollateral',
					'removeCollateral',
					'setStopLoss',
					'setTakeProfit',
				],
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
				resource: ['perpetuals'],
				operation: ['getPositions'],
			},
		},
	},
	// Side
	{
		displayName: 'Side',
		name: 'side',
		type: 'options',
		options: [
			{ name: 'Long', value: 'long' },
			{ name: 'Short', value: 'short' },
		],
		default: 'long',
		description: 'Position direction',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: ['openPosition'],
			},
		},
	},
	// Size
	{
		displayName: 'Size (USD)',
		name: 'sizeUsd',
		type: 'number',
		default: 100,
		description: 'Position size in USD',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: ['openPosition', 'increasePosition', 'decreasePosition'],
			},
		},
	},
	// Collateral
	{
		displayName: 'Collateral (USD)',
		name: 'collateralUsd',
		type: 'number',
		default: 10,
		description: 'Collateral amount in USD',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: ['openPosition', 'addCollateral', 'removeCollateral'],
			},
		},
	},
	// Price
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		default: 0,
		description: 'Trigger price for stop loss/take profit',
		displayOptions: {
			show: {
				resource: ['perpetuals'],
				operation: ['setStopLoss', 'setTakeProfit'],
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
				resource: ['perpetuals'],
			},
		},
		options: [
			{
				displayName: 'Leverage',
				name: 'leverage',
				type: 'number',
				default: 1,
				description: 'Leverage multiplier (1-100x)',
			},
			{
				displayName: 'Slippage (BPS)',
				name: 'slippageBps',
				type: 'number',
				default: 50,
				description: 'Slippage tolerance in basis points',
			},
			{
				displayName: 'Reduce Only',
				name: 'reduceOnly',
				type: 'boolean',
				default: false,
				description: 'Whether the order can only reduce position',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const perpClient = await createPerpClient(this);
	const solanaClient = await createSolanaClient(this);

	switch (operation) {
		case 'getMarkets': {
			const markets = await perpClient.getMarkets();

			return [
				{
					json: {
						markets,
						totalMarkets: markets.length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getMarketInfo': {
			const market = this.getNodeParameter('market', index) as string;

			const marketInfo = await perpClient.getMarket(market);

			return [
				{
					json: {
						market,
						...marketInfo,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getPosition': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;

			const position = await perpClient.getPosition(positionKey);

			if (!position) {
				throw new NodeOperationError(
					this.getNode(),
					`Position not found: ${positionKey}`,
					{ itemIndex: index },
				);
			}

			const pnl = await perpClient.calculatePnL(position);

			return [
				{
					json: {
						position,
						pnl,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getPositions': {
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

			const positions = await perpClient.getPositions(walletAddress);

			// Calculate PnL for each position
			const positionsWithPnL = await Promise.all(
				positions.map(async (position: Record<string, unknown>) => {
					const pnl = await perpClient.calculatePnL(position);
					return { ...position, pnl };
				}),
			);

			return [
				{
					json: {
						positions: positionsWithPnL,
						totalPositions: positions.length,
						wallet: walletAddress,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'openPosition': {
			const market = this.getNodeParameter('market', index) as string;
			const side = this.getNodeParameter('side', index) as string;
			const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
			const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to open positions',
					{ itemIndex: index },
				);
			}

			const leverage = (options.leverage as number) || sizeUsd / collateralUsd;

			const result = await perpClient.openPosition({
				market,
				side,
				sizeUsd,
				collateralUsd,
				leverage,
				owner: walletAddress,
				slippageBps: options.slippageBps as number,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey: result.positionKey,
							market,
							side,
							sizeUsd,
							collateralUsd,
							leverage,
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

		case 'closePosition': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to close positions',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.closePosition({
				positionKey,
				owner: walletAddress,
				slippageBps: options.slippageBps as number,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							closedPosition: positionKey,
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
						closedPosition: positionKey,
						...result,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'increasePosition': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.increasePosition({
				positionKey,
				sizeUsd,
				owner: walletAddress,
				slippageBps: options.slippageBps as number,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							addedSize: sizeUsd,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, ...result }, pairedItem: { item: index } }];
		}

		case 'decreasePosition': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const sizeUsd = this.getNodeParameter('sizeUsd', index) as number;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.decreasePosition({
				positionKey,
				sizeUsd,
				owner: walletAddress,
				slippageBps: options.slippageBps as number,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							reducedSize: sizeUsd,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, ...result }, pairedItem: { item: index } }];
		}

		case 'getFundingRate': {
			const market = this.getNodeParameter('market', index) as string;

			const fundingRate = await perpClient.getFundingRate(market);

			return [
				{
					json: {
						market,
						...fundingRate,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getOpenInterest': {
			const market = this.getNodeParameter('market', index) as string;

			const openInterest = await perpClient.getOpenInterest(market);

			return [
				{
					json: {
						market,
						...openInterest,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getLiquidationPrice': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;

			const position = await perpClient.getPosition(positionKey);

			if (!position) {
				throw new NodeOperationError(
					this.getNode(),
					`Position not found: ${positionKey}`,
					{ itemIndex: index },
				);
			}

			const liquidationPrice = await perpClient.calculateLiquidationPrice(position);

			return [
				{
					json: {
						positionKey,
						liquidationPrice,
						currentPrice: position.markPrice,
						distanceToLiquidation: Math.abs(
							((position.markPrice - liquidationPrice) / position.markPrice) * 100,
						).toFixed(2) + '%',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getPnL': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;

			const position = await perpClient.getPosition(positionKey);

			if (!position) {
				throw new NodeOperationError(
					this.getNode(),
					`Position not found: ${positionKey}`,
					{ itemIndex: index },
				);
			}

			const pnl = await perpClient.calculatePnL(position);

			return [
				{
					json: {
						positionKey,
						position,
						pnl,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'addCollateral': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.addCollateral({
				positionKey,
				collateralUsd,
				owner: walletAddress,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							addedCollateral: collateralUsd,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, ...result }, pairedItem: { item: index } }];
		}

		case 'removeCollateral': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const collateralUsd = this.getNodeParameter('collateralUsd', index) as number;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.removeCollateral({
				positionKey,
				collateralUsd,
				owner: walletAddress,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							removedCollateral: collateralUsd,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, ...result }, pairedItem: { item: index } }];
		}

		case 'setStopLoss': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const price = this.getNodeParameter('price', index) as number;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.setStopLoss({
				positionKey,
				triggerPrice: price,
				owner: walletAddress,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							stopLossPrice: price,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, stopLossPrice: price, ...result }, pairedItem: { item: index } }];
		}

		case 'setTakeProfit': {
			const positionKey = this.getNodeParameter('positionKey', index) as string;
			const price = this.getNodeParameter('price', index) as number;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required',
					{ itemIndex: index },
				);
			}

			const result = await perpClient.setTakeProfit({
				positionKey,
				triggerPrice: price,
				owner: walletAddress,
			});

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							positionKey,
							takeProfitPrice: price,
							...txResult,
						},
						pairedItem: { item: index },
					},
				];
			}

			return [{ json: { success: true, takeProfitPrice: price, ...result }, pairedItem: { item: index } }];
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
				itemIndex: index,
			});
	}
}
