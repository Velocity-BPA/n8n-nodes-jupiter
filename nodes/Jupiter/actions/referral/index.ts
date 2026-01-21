// @ts-nocheck
/**
 * Referral Resource Actions
 * Jupiter referral program operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { createSolanaClient } from '../../transport/solanaClient';
import { REFERRAL_PROGRAM_ID } from '../../constants/programs';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['referral'],
			},
		},
		options: [
			{
				name: 'Get Referral Account',
				value: 'getReferralAccount',
				description: 'Get referral account information',
				action: 'Get referral account',
			},
			{
				name: 'Create Referral Account',
				value: 'createReferralAccount',
				description: 'Create a new referral account',
				action: 'Create referral account',
			},
			{
				name: 'Get Referral Stats',
				value: 'getReferralStats',
				description: 'Get referral statistics',
				action: 'Get referral stats',
			},
			{
				name: 'Get Referral Earnings',
				value: 'getReferralEarnings',
				description: 'Get referral earnings',
				action: 'Get referral earnings',
			},
			{
				name: 'Claim Referral Fees',
				value: 'claimReferralFees',
				description: 'Claim accumulated referral fees',
				action: 'Claim referral fees',
			},
			{
				name: 'Get Referral Code',
				value: 'getReferralCode',
				description: 'Get referral code for sharing',
				action: 'Get referral code',
			},
			{
				name: 'Get Referred Swaps',
				value: 'getReferredSwaps',
				description: 'Get list of referred swaps',
				action: 'Get referred swaps',
			},
		],
		default: 'getReferralAccount',
	},

	// Referral Account
	{
		displayName: 'Referral Account',
		name: 'referralAccount',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['referral'],
				operation: ['getReferralAccount', 'getReferralStats', 'getReferralEarnings', 'claimReferralFees', 'getReferralCode', 'getReferredSwaps'],
			},
		},
		placeholder: 'Enter referral account address',
		description: 'The referral account address (leave empty to use connected wallet)',
	},

	// Wallet Address for creating
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['referral'],
				operation: ['createReferralAccount'],
			},
		},
		placeholder: 'Enter wallet address',
		description: 'Wallet address for the referral account (leave empty to use connected wallet)',
	},

	// Token Mint for claiming
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['referral'],
				operation: ['claimReferralFees', 'getReferralEarnings'],
			},
		},
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'Token mint to claim fees for (leave empty for all)',
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
				resource: ['referral'],
			},
		},
		options: [
			{
				displayName: 'Fee Share BPS',
				name: 'feeShareBps',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 10000 },
				default: 50,
				description: 'Fee share in basis points for new referral account',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 100 },
				default: 20,
				description: 'Maximum number of results to return',
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
		feeShareBps?: number;
		limit?: number;
	};

	let result: any;

	switch (operation) {
		case 'getReferralAccount': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			// Get referral account info
			result = {
				referralAccount,
				programId: REFERRAL_PROGRAM_ID,
				status: 'active',
				note: 'Referral account details require on-chain lookup',
				derivation: {
					seeds: ['referral', referralAccount],
					program: REFERRAL_PROGRAM_ID,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'createReferralAccount': {
			let walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const feeShareBps = options.feeShareBps || 50;

			if (!walletAddress) {
				walletAddress = solanaClient.getWalletAddress();
			}

			// Derive referral account address
			// In production, this would create the account on-chain
			result = {
				walletAddress,
				feeShareBps,
				feeSharePercent: feeShareBps / 100,
				status: 'pending',
				note: 'Referral account creation requires on-chain transaction',
				instructions: [
					'1. Derive referral account PDA',
					'2. Create referral account instruction',
					'3. Sign and send transaction',
				],
				programId: REFERRAL_PROGRAM_ID,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferralStats': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			result = {
				referralAccount,
				stats: {
					totalSwaps: null,
					totalVolume: null,
					totalEarnings: null,
					uniqueUsers: null,
				},
				note: 'Stats require integration with Jupiter referral API or on-chain indexing',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferralEarnings': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;
			const tokenMint = this.getNodeParameter('tokenMint', index, '') as string;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			result = {
				referralAccount,
				tokenMint: tokenMint || 'all',
				earnings: {
					pendingClaim: null,
					totalClaimed: null,
					totalEarned: null,
				},
				note: 'Earnings data requires on-chain lookup of referral token accounts',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'claimReferralFees': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;
			const tokenMint = this.getNodeParameter('tokenMint', index, '') as string;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			// Build claim transaction
			result = {
				referralAccount,
				tokenMint: tokenMint || 'all',
				status: 'transaction_required',
				steps: [
					'1. Find referral token accounts with balances',
					'2. Build claim instruction for each token',
					'3. Sign and send transaction',
				],
				note: 'Claiming requires signing a transaction',
				programId: REFERRAL_PROGRAM_ID,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferralCode': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			// Generate referral URL
			const baseUrl = 'https://jup.ag/swap';
			const referralUrl = `${baseUrl}?referrer=${referralAccount}`;

			result = {
				referralAccount,
				referralUrl,
				shortCode: referralAccount.substring(0, 8),
				usage: {
					url: referralUrl,
					apiParam: `feeAccount=${referralAccount}`,
				},
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getReferredSwaps': {
			let referralAccount = this.getNodeParameter('referralAccount', index, '') as string;
			const limit = options.limit || 20;

			if (!referralAccount) {
				referralAccount = solanaClient.getWalletAddress();
			}

			result = {
				referralAccount,
				swaps: [],
				limit,
				note: 'Swap history requires transaction indexing or Jupiter API integration',
				timestamp: new Date().toISOString(),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
