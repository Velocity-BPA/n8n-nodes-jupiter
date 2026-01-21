// @ts-nocheck
/**
 * Fee Resource Actions
 * Fee calculation and estimation operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { createSolanaClient } from '../../transport/solanaClient';
import { COMMON_TOKENS } from '../../constants/tokens';
import { JUPITER_FEE_BPS } from '../../constants/endpoints';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['fee'],
			},
		},
		options: [
			{
				name: 'Get Platform Fee',
				value: 'getPlatformFee',
				description: 'Get Jupiter platform fee',
				action: 'Get platform fee',
			},
			{
				name: 'Get Route Fees',
				value: 'getRouteFees',
				description: 'Get fees for a specific route',
				action: 'Get route fees',
			},
			{
				name: 'Get Priority Fee',
				value: 'getPriorityFee',
				description: 'Get recommended priority fee',
				action: 'Get priority fee',
			},
			{
				name: 'Estimate Fees',
				value: 'estimateFees',
				description: 'Estimate total fees for a swap',
				action: 'Estimate fees',
			},
			{
				name: 'Get Fee Account',
				value: 'getFeeAccount',
				description: 'Get fee account for a token',
				action: 'Get fee account',
			},
			{
				name: 'Get Referral Fee',
				value: 'getReferralFee',
				description: 'Get referral fee information',
				action: 'Get referral fee',
			},
			{
				name: 'Calculate Total Fees',
				value: 'calculateTotalFees',
				description: 'Calculate all fees for a transaction',
				action: 'Calculate total fees',
			},
		],
		default: 'getPlatformFee',
	},

	// Input/Output for route fees
	{
		displayName: 'Input Mint',
		name: 'inputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['fee'],
				operation: ['getRouteFees', 'estimateFees', 'calculateTotalFees'],
			},
		},
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The input token mint address',
	},

	{
		displayName: 'Output Mint',
		name: 'outputMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['fee'],
				operation: ['getRouteFees', 'estimateFees', 'calculateTotalFees'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'The output token mint address',
	},

	// Amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['fee'],
				operation: ['getRouteFees', 'estimateFees', 'calculateTotalFees'],
			},
		},
		placeholder: '1000000000',
		description: 'Amount in smallest units (lamports)',
	},

	// Token Mint for fee account
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['fee'],
				operation: ['getFeeAccount'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'Token mint for fee account lookup',
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
				resource: ['fee'],
			},
		},
		options: [
			{
				displayName: 'Platform Fee BPS',
				name: 'platformFeeBps',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 10000 },
				default: 0,
				description: 'Platform fee in basis points (0-10000)',
			},
			{
				displayName: 'Priority Level',
				name: 'priorityLevel',
				type: 'options',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'High', value: 'high' },
					{ name: 'Very High', value: 'veryHigh' },
				],
				default: 'medium',
				description: 'Priority fee level',
			},
			{
				displayName: 'Referral Account',
				name: 'referralAccount',
				type: 'string',
				default: '',
				description: 'Referral account for fee sharing',
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
		platformFeeBps?: number;
		priorityLevel?: string;
		referralAccount?: string;
	};

	let result: any;

	switch (operation) {
		case 'getPlatformFee': {
			result = {
				platformFeeBps: JUPITER_FEE_BPS,
				platformFeePercent: JUPITER_FEE_BPS / 100,
				description: 'Jupiter takes a small fee on swaps routed through the aggregator',
				note: 'Fee may vary based on swap type and partnership agreements',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getRouteFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: parseInt(amount),
				slippageBps: 50,
			});

			// Extract fee information from route
			const routeFees = quote.routePlan?.map((step: any) => ({
				dex: step.swapInfo?.label || 'unknown',
				feeAmount: step.swapInfo?.feeAmount || '0',
				feeMint: step.swapInfo?.feeMint,
				percent: step.percent,
			})) || [];

			result = {
				inputMint,
				outputMint,
				amount,
				routeFees,
				totalRouteFees: routeFees.reduce(
					(sum: number, fee: any) => sum + parseInt(fee.feeAmount || '0'),
					0,
				),
				priceImpact: quote.priceImpactPct,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getPriorityFee': {
			const solanaClient = await createSolanaClient.call(this);
			const priorityLevel = options.priorityLevel || 'medium';

			// Get recent priority fees
			const recentFees = await solanaClient.getRecentPrioritizationFees([]);

			// Calculate recommended fee based on level
			const sortedFees = recentFees
				.map((f: any) => f.prioritizationFee)
				.filter((f: number) => f > 0)
				.sort((a: number, b: number) => a - b);

			let recommendedFee = 0;
			if (sortedFees.length > 0) {
				const percentiles: Record<string, number> = {
					low: 0.25,
					medium: 0.5,
					high: 0.75,
					veryHigh: 0.9,
				};
				const percentile = percentiles[priorityLevel] || 0.5;
				const index = Math.floor(sortedFees.length * percentile);
				recommendedFee = sortedFees[index] || sortedFees[sortedFees.length - 1];
			}

			result = {
				priorityLevel,
				recommendedFee,
				recentFeesAnalyzed: recentFees.length,
				feeStats: {
					min: sortedFees[0] || 0,
					max: sortedFees[sortedFees.length - 1] || 0,
					median: sortedFees[Math.floor(sortedFees.length / 2)] || 0,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'estimateFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const platformFeeBps = options.platformFeeBps || 0;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: parseInt(amount),
				slippageBps: 50,
				platformFeeBps,
			});

			// Calculate fees
			const inputAmount = parseInt(amount);
			const platformFee = Math.floor((inputAmount * platformFeeBps) / 10000);

			// Base transaction fee (5000 lamports = 0.000005 SOL)
			const baseTxFee = 5000;

			// Estimate compute units and priority fee
			const estimatedComputeUnits = 200000; // Typical for swap
			const priorityFeeLamports = 1000; // Default priority

			result = {
				inputMint,
				outputMint,
				amount,
				fees: {
					platformFeeBps,
					platformFeeAmount: platformFee,
					baseTxFeeLamports: baseTxFee,
					estimatedPriorityFee: priorityFeeLamports,
					estimatedComputeUnits,
				},
				priceImpact: quote.priceImpactPct,
				totalEstimatedFees: {
					lamports: baseTxFee + priorityFeeLamports,
					sol: (baseTxFee + priorityFeeLamports) / 1e9,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getFeeAccount': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			// Fee accounts are derived from the token mint and referral account
			result = {
				tokenMint,
				note: 'Fee account derivation requires the referral program',
				derivationInfo: {
					program: 'REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3',
					seeds: ['referral_ata', tokenMint],
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferralFee': {
			const referralAccount = options.referralAccount;

			result = {
				referralProgram: 'Jupiter Referral Program',
				maxReferralFeeBps: 100, // 1% max
				defaultReferralFeeBps: 50, // 0.5%
				referralAccount: referralAccount || 'not specified',
				note: 'Referral fees are shared between the platform and referrer',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'calculateTotalFees': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const amount = this.getNodeParameter('amount', index) as string;
			const platformFeeBps = options.platformFeeBps || 0;

			const quote = await jupiterClient.getQuote({
				inputMint,
				outputMint,
				amount: parseInt(amount),
				slippageBps: 50,
				platformFeeBps,
			});

			const inputAmount = parseInt(amount);
			const outputAmount = parseInt(quote.outAmount);

			// Platform fee
			const platformFeeAmount = Math.floor((inputAmount * platformFeeBps) / 10000);

			// DEX fees from route
			const dexFees = quote.routePlan?.reduce((sum: number, step: any) => {
				return sum + parseInt(step.swapInfo?.feeAmount || '0');
			}, 0) || 0;

			// Network fees
			const baseTxFee = 5000;
			const priorityFee = 1000;

			// Price impact cost
			const priceImpactPct = parseFloat(quote.priceImpactPct || '0');
			const priceImpactCost = Math.floor((outputAmount * priceImpactPct) / 100);

			result = {
				inputMint,
				outputMint,
				inputAmount,
				outputAmount,
				fees: {
					platform: {
						bps: platformFeeBps,
						amount: platformFeeAmount,
					},
					dex: {
						total: dexFees,
					},
					network: {
						baseFee: baseTxFee,
						priorityFee: priorityFee,
						totalLamports: baseTxFee + priorityFee,
						totalSol: (baseTxFee + priorityFee) / 1e9,
					},
					priceImpact: {
						percent: priceImpactPct,
						estimatedCost: priceImpactCost,
					},
				},
				totalFeeCostEstimate: {
					inInputToken: platformFeeAmount + dexFees,
					inSol: (baseTxFee + priorityFee) / 1e9,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
