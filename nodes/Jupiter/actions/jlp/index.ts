// @ts-nocheck
/**
 * JLP Resource Actions
 * Jupiter Liquidity Provider pool operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { createSolanaClient } from '../../transport/solanaClient';
import { JLP_POOL_ADDRESS, JLP_TOKEN_MINT } from '../../constants/programs';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['jlp'],
			},
		},
		options: [
			{
				name: 'Get JLP Info',
				value: 'getJlpInfo',
				description: 'Get JLP pool information',
				action: 'Get jlp info',
			},
			{
				name: 'Get JLP Price',
				value: 'getJlpPrice',
				description: 'Get current JLP token price',
				action: 'Get jlp price',
			},
			{
				name: 'Get JLP APY',
				value: 'getJlpApy',
				description: 'Get JLP annual percentage yield',
				action: 'Get jlp apy',
			},
			{
				name: 'Get JLP Composition',
				value: 'getJlpComposition',
				description: 'Get JLP pool composition',
				action: 'Get jlp composition',
			},
			{
				name: 'Deposit to JLP',
				value: 'depositToJlp',
				description: 'Deposit tokens to JLP pool',
				action: 'Deposit to jlp',
			},
			{
				name: 'Withdraw from JLP',
				value: 'withdrawFromJlp',
				description: 'Withdraw tokens from JLP pool',
				action: 'Withdraw from jlp',
			},
			{
				name: 'Get JLP Balance',
				value: 'getJlpBalance',
				description: 'Get JLP token balance',
				action: 'Get jlp balance',
			},
			{
				name: 'Get JLP Holdings',
				value: 'getJlpHoldings',
				description: 'Get detailed JLP holdings breakdown',
				action: 'Get jlp holdings',
			},
			{
				name: 'Get JLP Fees',
				value: 'getJlpFees',
				description: 'Get JLP fee information',
				action: 'Get jlp fees',
			},
			{
				name: 'Get JLP Stats',
				value: 'getJlpStats',
				description: 'Get JLP pool statistics',
				action: 'Get jlp stats',
			},
		],
		default: 'getJlpInfo',
	},

	// Wallet Address
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['jlp'],
				operation: ['getJlpBalance', 'getJlpHoldings', 'depositToJlp', 'withdrawFromJlp'],
			},
		},
		placeholder: 'Enter wallet address',
		description: 'Wallet address (leave empty to use connected wallet)',
	},

	// Deposit/Withdraw parameters
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['jlp'],
				operation: ['depositToJlp', 'withdrawFromJlp'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'Token mint to deposit/withdraw',
	},

	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['jlp'],
				operation: ['depositToJlp', 'withdrawFromJlp'],
			},
		},
		placeholder: '1000000',
		description: 'Amount in smallest units',
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
				resource: ['jlp'],
			},
		},
		options: [
			{
				displayName: 'Slippage BPS',
				name: 'slippageBps',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 10000 },
				default: 50,
				description: 'Slippage tolerance in basis points',
			},
			{
				displayName: 'Include History',
				name: 'includeHistory',
				type: 'boolean',
				default: false,
				description: 'Whether to include historical data',
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
	const options = this.getNodeParameter('options', index, {}) as {
		slippageBps?: number;
		includeHistory?: boolean;
	};

	let result: any;

	switch (operation) {
		case 'getJlpInfo': {
			result = {
				name: 'Jupiter Liquidity Provider',
				symbol: 'JLP',
				poolAddress: JLP_POOL_ADDRESS,
				tokenMint: JLP_TOKEN_MINT,
				description: 'JLP is a liquidity provider token for Jupiter perpetuals',
				features: [
					'Provides liquidity for perpetual trading',
					'Earns fees from perpetual trades',
					'Exposure to pool asset composition',
				],
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpPrice': {
			const prices = await jupiterClient.getPrice([JLP_TOKEN_MINT]);
			const jlpPrice = prices[JLP_TOKEN_MINT];

			result = {
				tokenMint: JLP_TOKEN_MINT,
				price: jlpPrice?.price || null,
				priceSource: 'jupiter',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpApy': {
			result = {
				apy: null,
				apr: null,
				components: {
					tradingFees: null,
					borrowFees: null,
					liquidationFees: null,
				},
				note: 'APY data requires integration with Jupiter perpetuals API',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpComposition': {
			result = {
				poolAddress: JLP_POOL_ADDRESS,
				composition: [
					{
						asset: 'SOL',
						targetWeight: '45%',
						currentWeight: null,
					},
					{
						asset: 'ETH',
						targetWeight: '10%',
						currentWeight: null,
					},
					{
						asset: 'BTC',
						targetWeight: '10%',
						currentWeight: null,
					},
					{
						asset: 'USDC',
						targetWeight: '24%',
						currentWeight: null,
					},
					{
						asset: 'USDT',
						targetWeight: '11%',
						currentWeight: null,
					},
				],
				note: 'Current weights require on-chain lookup',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'depositToJlp': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const slippageBps = options.slippageBps || 50;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress();
			}

			result = {
				action: 'deposit',
				walletAddress,
				tokenMint,
				amount,
				slippageBps,
				poolAddress: JLP_POOL_ADDRESS,
				status: 'transaction_required',
				steps: [
					'1. Calculate JLP tokens to receive',
					'2. Build deposit instruction',
					'3. Sign and send transaction',
				],
				note: 'Deposit requires interaction with Jupiter perpetuals program',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'withdrawFromJlp': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const slippageBps = options.slippageBps || 50;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress();
			}

			result = {
				action: 'withdraw',
				walletAddress,
				tokenMint,
				amount,
				slippageBps,
				poolAddress: JLP_POOL_ADDRESS,
				status: 'transaction_required',
				steps: [
					'1. Calculate tokens to receive',
					'2. Build withdraw instruction',
					'3. Sign and send transaction',
				],
				note: 'Withdrawal requires interaction with Jupiter perpetuals program',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpBalance': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress();
			}

			// Get JLP token balance
			const balance = await solanaClient.getTokenBalance(walletAddress, JLP_TOKEN_MINT);

			result = {
				walletAddress,
				jlpMint: JLP_TOKEN_MINT,
				balance: balance?.amount || '0',
				uiAmount: balance?.uiAmount || 0,
				decimals: balance?.decimals || 6,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpHoldings': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress();
			}

			const balance = await solanaClient.getTokenBalance(walletAddress, JLP_TOKEN_MINT);
			const prices = await jupiterClient.getPrice([JLP_TOKEN_MINT]);
			const jlpPrice = prices[JLP_TOKEN_MINT]?.price || 0;
			const uiAmount = balance?.uiAmount || 0;

			result = {
				walletAddress,
				jlpBalance: {
					amount: balance?.amount || '0',
					uiAmount,
					decimals: balance?.decimals || 6,
				},
				value: {
					usd: uiAmount * jlpPrice,
					jlpPrice,
				},
				composition: {
					note: 'Pro-rata composition based on pool weights',
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpFees': {
			result = {
				fees: {
					depositFee: '0-50 bps (variable)',
					withdrawalFee: '0-50 bps (variable)',
					managementFee: '0%',
				},
				feeDistribution: {
					toLpProviders: '70%',
					toProtocol: '30%',
				},
				note: 'Fees vary based on pool balance vs target weights',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getJlpStats': {
			const prices = await jupiterClient.getPrice([JLP_TOKEN_MINT]);

			result = {
				poolAddress: JLP_POOL_ADDRESS,
				tokenMint: JLP_TOKEN_MINT,
				price: prices[JLP_TOKEN_MINT]?.price || null,
				stats: {
					totalSupply: null,
					tvl: null,
					totalFeesPaid: null,
					averageApy: null,
				},
				note: 'Detailed stats require integration with Jupiter perpetuals API',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
