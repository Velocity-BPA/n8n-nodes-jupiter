// @ts-nocheck
/**
 * Price Resource Actions
 * Token price fetching and analysis operations
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
				resource: ['price'],
			},
		},
		options: [
			{
				name: 'Get Price',
				value: 'getPrice',
				description: 'Get current price for a token',
				action: 'Get price',
			},
			{
				name: 'Get Prices (Batch)',
				value: 'getPrices',
				description: 'Get prices for multiple tokens',
				action: 'Get prices batch',
			},
			{
				name: 'Get Price by ID',
				value: 'getPriceById',
				description: 'Get price by token ID/mint',
				action: 'Get price by id',
			},
			{
				name: 'Get Price History',
				value: 'getPriceHistory',
				description: 'Get historical price data',
				action: 'Get price history',
			},
			{
				name: 'Get OHLCV',
				value: 'getOhlcv',
				description: 'Get OHLCV candlestick data',
				action: 'Get ohlcv',
			},
			{
				name: 'Get Price Change',
				value: 'getPriceChange',
				description: 'Get price change percentage',
				action: 'Get price change',
			},
			{
				name: 'Get 24h Stats',
				value: 'get24hStats',
				description: 'Get 24-hour price statistics',
				action: 'Get 24h stats',
			},
			{
				name: 'Get Price from Quote',
				value: 'getPriceFromQuote',
				description: 'Calculate price from a swap quote',
				action: 'Get price from quote',
			},
			{
				name: 'Get Reference Price',
				value: 'getReferencePrice',
				description: 'Get reference price in USD',
				action: 'Get reference price',
			},
			{
				name: 'Compare Prices',
				value: 'comparePrices',
				description: 'Compare prices across different sources',
				action: 'Compare prices',
			},
		],
		default: 'getPrice',
	},

	// Token Mint parameter
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['price'],
				operation: ['getPrice', 'getPriceById', 'getPriceHistory', 'getOhlcv', 'getPriceChange', 'get24hStats', 'getReferencePrice'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The mint address of the token',
	},

	// Token Mints for batch
	{
		displayName: 'Token Mints',
		name: 'tokenMints',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['price'],
				operation: ['getPrices', 'comparePrices'],
			},
		},
		placeholder: 'mint1,mint2,mint3',
		description: 'Comma-separated list of token mint addresses',
	},

	// Quote Data for price from quote
	{
		displayName: 'Quote Data',
		name: 'quoteData',
		type: 'json',
		default: '{}',
		required: true,
		displayOptions: {
			show: {
				resource: ['price'],
				operation: ['getPriceFromQuote'],
			},
		},
		description: 'Quote data from a previous quote operation',
	},

	// Time range for history
	{
		displayName: 'Time Range',
		name: 'timeRange',
		type: 'options',
		options: [
			{ name: '1 Hour', value: '1h' },
			{ name: '4 Hours', value: '4h' },
			{ name: '1 Day', value: '1d' },
			{ name: '1 Week', value: '1w' },
			{ name: '1 Month', value: '1m' },
		],
		default: '1d',
		displayOptions: {
			show: {
				resource: ['price'],
				operation: ['getPriceHistory', 'getOhlcv', 'getPriceChange'],
			},
		},
		description: 'Time range for historical data',
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
				resource: ['price'],
			},
		},
		options: [
			{
				displayName: 'Quote Token',
				name: 'quoteToken',
				type: 'string',
				default: COMMON_TOKENS.USDC,
				description: 'Token to quote price against (default: USDC)',
			},
			{
				displayName: 'Include Extra Info',
				name: 'includeExtraInfo',
				type: 'boolean',
				default: false,
				description: 'Whether to include additional price metadata',
			},
			{
				displayName: 'Resolution',
				name: 'resolution',
				type: 'options',
				options: [
					{ name: '1 Minute', value: '1m' },
					{ name: '5 Minutes', value: '5m' },
					{ name: '15 Minutes', value: '15m' },
					{ name: '1 Hour', value: '1h' },
					{ name: '4 Hours', value: '4h' },
					{ name: '1 Day', value: '1d' },
				],
				default: '1h',
				description: 'Data resolution for OHLCV',
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
		quoteToken?: string;
		includeExtraInfo?: boolean;
		resolution?: string;
	};

	let result: any;

	switch (operation) {
		case 'getPrice': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const quoteToken = options.quoteToken || COMMON_TOKENS.USDC;

			// Get price using Jupiter price API
			const prices = await jupiterClient.getPrice([tokenMint]);
			const priceData = prices[tokenMint];

			if (!priceData) {
				// Fallback: Calculate price from quote
				try {
					const quote = await jupiterClient.getQuote({
						inputMint: tokenMint,
						outputMint: quoteToken,
						amount: 1000000000, // 1 token with 9 decimals
						slippageBps: 50,
					});

					result = {
						mint: tokenMint,
						price: parseInt(quote.outAmount) / 1000000, // USDC has 6 decimals
						priceSource: 'quote',
						quoteToken,
						timestamp: new Date().toISOString(),
					};
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						`Could not get price for token: ${tokenMint}`,
					);
				}
			} else {
				result = {
					mint: tokenMint,
					price: priceData.price,
					priceSource: 'jupiter-price-api',
					quoteToken,
					timestamp: new Date().toISOString(),
					...(options.includeExtraInfo && priceData),
				};
			}
			break;
		}

		case 'getPrices': {
			const tokenMints = (this.getNodeParameter('tokenMints', index) as string)
				.split(',')
				.map(m => m.trim())
				.filter(m => m);

			if (tokenMints.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one token mint is required');
			}

			const prices = await jupiterClient.getPrice(tokenMints);

			result = {
				prices: tokenMints.map(mint => ({
					mint,
					price: prices[mint]?.price || null,
					found: !!prices[mint],
				})),
				timestamp: new Date().toISOString(),
				totalTokens: tokenMints.length,
				foundPrices: Object.keys(prices).length,
			};
			break;
		}

		case 'getPriceById': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const prices = await jupiterClient.getPrice([tokenMint]);
			const priceData = prices[tokenMint];

			if (!priceData) {
				throw new NodeOperationError(
					this.getNode(),
					`Price not found for token: ${tokenMint}`,
				);
			}

			result = {
				id: tokenMint,
				...priceData,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPriceHistory': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const timeRange = this.getNodeParameter('timeRange', index) as string;

			// Jupiter doesn't have direct price history API, calculate from quote snapshots
			// For production, you'd integrate with a price history provider
			const currentPrices = await jupiterClient.getPrice([tokenMint]);

			result = {
				mint: tokenMint,
				timeRange,
				currentPrice: currentPrices[tokenMint]?.price || null,
				note: 'Historical price data requires integration with price history provider (e.g., Birdeye, CoinGecko)',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getOhlcv': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const timeRange = this.getNodeParameter('timeRange', index) as string;
			const resolution = options.resolution || '1h';

			// OHLCV data typically comes from price aggregators
			result = {
				mint: tokenMint,
				timeRange,
				resolution,
				note: 'OHLCV data requires integration with a market data provider (e.g., Birdeye, CoinGecko)',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPriceChange': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const timeRange = this.getNodeParameter('timeRange', index) as string;

			const currentPrices = await jupiterClient.getPrice([tokenMint]);
			const currentPrice = currentPrices[tokenMint]?.price;

			result = {
				mint: tokenMint,
				currentPrice,
				timeRange,
				note: 'Price change calculation requires historical data integration',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'get24hStats': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const currentPrices = await jupiterClient.getPrice([tokenMint]);
			const priceData = currentPrices[tokenMint];

			result = {
				mint: tokenMint,
				currentPrice: priceData?.price || null,
				stats: {
					high24h: null,
					low24h: null,
					volume24h: null,
					priceChange24h: null,
					priceChangePercent24h: null,
				},
				note: '24h stats require integration with market data provider',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPriceFromQuote': {
			const quoteData = JSON.parse(this.getNodeParameter('quoteData', index) as string);

			if (!quoteData.inAmount || !quoteData.outAmount) {
				throw new NodeOperationError(
					this.getNode(),
					'Quote data must contain inAmount and outAmount',
				);
			}

			const inDecimals = quoteData.inputDecimals || 9;
			const outDecimals = quoteData.outputDecimals || 6;

			const inAmount = parseInt(quoteData.inAmount) / Math.pow(10, inDecimals);
			const outAmount = parseInt(quoteData.outAmount) / Math.pow(10, outDecimals);

			const price = outAmount / inAmount;

			result = {
				price,
				inAmount,
				outAmount,
				inputMint: quoteData.inputMint,
				outputMint: quoteData.outputMint,
				priceImpact: quoteData.priceImpactPct,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferencePrice': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const prices = await jupiterClient.getPrice([tokenMint, COMMON_TOKENS.USDC]);
			const tokenPrice = prices[tokenMint];

			result = {
				mint: tokenMint,
				priceUSD: tokenPrice?.price || null,
				referenceToken: 'USDC',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'comparePrices': {
			const tokenMints = (this.getNodeParameter('tokenMints', index) as string)
				.split(',')
				.map(m => m.trim())
				.filter(m => m);

			const prices = await jupiterClient.getPrice(tokenMints);

			const comparison = tokenMints.map(mint => ({
				mint,
				jupiterPrice: prices[mint]?.price || null,
			}));

			result = {
				comparison,
				note: 'For multi-source comparison, integrate with additional price providers',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
