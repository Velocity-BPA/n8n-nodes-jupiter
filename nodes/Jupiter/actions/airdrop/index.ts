// @ts-nocheck
/**
 * Airdrop Resource Actions
 * Operations for Jupiter airdrop - eligibility, claiming, history
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
				resource: ['airdrop'],
			},
		},
		options: [
			{
				name: 'Check Eligibility',
				value: 'checkEligibility',
				description: 'Check if a wallet is eligible for airdrop',
				action: 'Check airdrop eligibility',
			},
			{
				name: 'Get Airdrop Amount',
				value: 'getAmount',
				description: 'Get claimable airdrop amount',
				action: 'Get airdrop amount',
			},
			{
				name: 'Claim Airdrop',
				value: 'claim',
				description: 'Claim available airdrop tokens',
				action: 'Claim airdrop',
			},
			{
				name: 'Get Airdrop Status',
				value: 'getStatus',
				description: 'Get airdrop claim status',
				action: 'Get airdrop status',
			},
			{
				name: 'Get Airdrop History',
				value: 'getHistory',
				description: 'Get airdrop claim history',
				action: 'Get airdrop history',
			},
			{
				name: 'Get Round Info',
				value: 'getRoundInfo',
				description: 'Get information about an airdrop round',
				action: 'Get round info',
			},
		],
		default: 'checkEligibility',
	},
	// Wallet address parameter
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Solana wallet address (leave empty to use connected wallet)',
		displayOptions: {
			show: {
				resource: ['airdrop'],
				operation: ['checkEligibility', 'getAmount', 'claim', 'getStatus', 'getHistory'],
			},
		},
	},
	// Airdrop round
	{
		displayName: 'Airdrop Round',
		name: 'round',
		type: 'options',
		default: 'current',
		options: [
			{ name: 'Current', value: 'current' },
			{ name: 'Round 1 (January 2024)', value: '1' },
			{ name: 'Round 2 (Jupuary 2025)', value: '2' },
			{ name: 'Round 3', value: '3' },
		],
		description: 'The airdrop round to check',
		displayOptions: {
			show: {
				resource: ['airdrop'],
				operation: ['checkEligibility', 'getAmount', 'claim', 'getRoundInfo'],
			},
		},
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
		case 'checkEligibility': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const round = this.getNodeParameter('round', index) as string;

			const eligibility = await jupiterClient.checkAirdropEligibility(wallet, round);

			result = {
				wallet,
				round: round === 'current' ? eligibility.currentRound : round,
				isEligible: eligibility.isEligible,
				reason: eligibility.reason || null,
				tier: eligibility.tier || null,
				score: eligibility.score || null,
				criteria: eligibility.criteria || [],
			};
			break;
		}

		case 'getAmount': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const round = this.getNodeParameter('round', index) as string;

			const airdrop = await jupiterClient.getAirdropAmount(wallet, round);

			result = {
				wallet,
				round: round === 'current' ? airdrop.currentRound : round,
				totalAmount: airdrop.totalAmount,
				claimedAmount: airdrop.claimedAmount,
				remainingAmount: airdrop.remainingAmount,
				isClaimable: airdrop.remainingAmount > 0,
				tier: airdrop.tier,
				breakdown: airdrop.breakdown || null,
			};
			break;
		}

		case 'claim': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const round = this.getNodeParameter('round', index) as string;

			// Check if there's anything to claim first
			const airdrop = await jupiterClient.getAirdropAmount(wallet, round);

			if (airdrop.remainingAmount <= 0) {
				throw new NodeOperationError(
					this.getNode(),
					'No airdrop tokens available to claim for this wallet',
				);
			}

			// Build claim transaction
			const claimResult = await jupiterClient.claimAirdrop(wallet, round);

			if (claimResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(claimResult.transaction);
				result = {
					success: true,
					signature,
					wallet,
					round: round === 'current' ? airdrop.currentRound : round,
					claimedAmount: airdrop.remainingAmount,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build claim transaction');
			}
			break;
		}

		case 'getStatus': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const status = await jupiterClient.getAirdropStatus(wallet);

			result = {
				wallet,
				currentRound: status.currentRound,
				rounds: status.rounds.map((r: Record<string, unknown>) => ({
					round: r.round,
					totalAmount: r.totalAmount,
					claimedAmount: r.claimedAmount,
					remainingAmount: r.remainingAmount,
					claimStatus: r.claimStatus,
					claimDate: r.claimDate || null,
				})),
				totalClaimed: status.totalClaimed,
				totalUnclaimed: status.totalUnclaimed,
			};
			break;
		}

		case 'getHistory': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const history = await jupiterClient.getAirdropHistory(wallet);

			result = {
				wallet,
				claims: history.map((claim: Record<string, unknown>) => ({
					round: claim.round,
					amount: claim.amount,
					claimDate: claim.claimDate,
					signature: claim.signature,
					explorerUrl: `https://solscan.io/tx/${claim.signature}`,
				})),
				totalClaimed: history.reduce(
					(sum: number, claim: Record<string, unknown>) => sum + (claim.amount as number),
					0,
				),
			};
			break;
		}

		case 'getRoundInfo': {
			const round = this.getNodeParameter('round', index) as string;

			const roundInfo = await jupiterClient.getAirdropRoundInfo(round);

			result = {
				round: round === 'current' ? roundInfo.roundNumber : round,
				name: roundInfo.name,
				totalAllocation: roundInfo.totalAllocation,
				totalClaimed: roundInfo.totalClaimed,
				totalRecipients: roundInfo.totalRecipients,
				claimDeadline: roundInfo.claimDeadline,
				startDate: roundInfo.startDate,
				endDate: roundInfo.endDate,
				isActive: roundInfo.isActive,
				tiers: roundInfo.tiers || [],
				criteria: roundInfo.criteria || [],
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
