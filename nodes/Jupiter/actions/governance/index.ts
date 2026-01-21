// @ts-nocheck
/**
 * Governance Resource Actions
 * Operations for Jupiter DAO governance - proposals, voting, delegation
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
				resource: ['governance'],
			},
		},
		options: [
			{
				name: 'Get Proposals',
				value: 'getProposals',
				description: 'Get all governance proposals',
				action: 'Get all proposals',
			},
			{
				name: 'Get Proposal',
				value: 'getProposal',
				description: 'Get details of a specific proposal',
				action: 'Get proposal details',
			},
			{
				name: 'Get Proposal Status',
				value: 'getProposalStatus',
				description: 'Get current status of a proposal',
				action: 'Get proposal status',
			},
			{
				name: 'Vote on Proposal',
				value: 'vote',
				description: 'Cast a vote on a proposal',
				action: 'Vote on proposal',
			},
			{
				name: 'Get Voting Power',
				value: 'getVotingPower',
				description: 'Get voting power for a wallet',
				action: 'Get voting power',
			},
			{
				name: 'Get Vote History',
				value: 'getVoteHistory',
				description: 'Get voting history for a wallet',
				action: 'Get vote history',
			},
			{
				name: 'Get Governance Stats',
				value: 'getStats',
				description: 'Get overall governance statistics',
				action: 'Get governance stats',
			},
			{
				name: 'Delegate Votes',
				value: 'delegateVotes',
				description: 'Delegate voting power to another address',
				action: 'Delegate votes',
			},
			{
				name: 'Get Active Proposals',
				value: 'getActiveProposals',
				description: 'Get currently active proposals',
				action: 'Get active proposals',
			},
		],
		default: 'getProposals',
	},
	// Proposal ID parameter
	{
		displayName: 'Proposal ID',
		name: 'proposalId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique identifier of the proposal',
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['getProposal', 'getProposalStatus', 'vote'],
			},
		},
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
				resource: ['governance'],
				operation: ['getVotingPower', 'getVoteHistory'],
			},
		},
	},
	// Vote choice
	{
		displayName: 'Vote',
		name: 'voteChoice',
		type: 'options',
		required: true,
		default: 'for',
		options: [
			{ name: 'For', value: 'for' },
			{ name: 'Against', value: 'against' },
			{ name: 'Abstain', value: 'abstain' },
		],
		description: 'Your vote on the proposal',
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['vote'],
			},
		},
	},
	// Delegate address
	{
		displayName: 'Delegate To Address',
		name: 'delegateAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Address to delegate voting power to',
		displayOptions: {
			show: {
				resource: ['governance'],
				operation: ['delegateVotes'],
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
				resource: ['governance'],
				operation: ['getProposals', 'getVoteHistory', 'getActiveProposals'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Status Filter',
				name: 'status',
				type: 'options',
				default: 'all',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Active', value: 'active' },
					{ name: 'Passed', value: 'passed' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Executed', value: 'executed' },
					{ name: 'Cancelled', value: 'cancelled' },
				],
				description: 'Filter proposals by status',
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
		case 'getProposals': {
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
				status?: string;
			};

			const proposals = await jupiterClient.getProposals({
				limit: options.limit || 10,
				status: options.status !== 'all' ? options.status : undefined,
			});

			result = {
				proposals: proposals.map((p: Record<string, unknown>) => ({
					id: p.id,
					title: p.title,
					status: p.status,
					votesFor: p.votesFor,
					votesAgainst: p.votesAgainst,
					votesAbstain: p.votesAbstain,
					startTime: p.startTime,
					endTime: p.endTime,
					quorum: p.quorum,
					quorumReached: p.quorumReached,
				})),
				total: proposals.length,
			};
			break;
		}

		case 'getProposal': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;

			const proposal = await jupiterClient.getProposal(proposalId);

			result = {
				id: proposal.id,
				title: proposal.title,
				description: proposal.description,
				proposer: proposal.proposer,
				status: proposal.status,
				votesFor: proposal.votesFor,
				votesAgainst: proposal.votesAgainst,
				votesAbstain: proposal.votesAbstain,
				totalVotes: proposal.totalVotes,
				quorum: proposal.quorum,
				quorumReached: proposal.quorumReached,
				startTime: proposal.startTime,
				endTime: proposal.endTime,
				executionTime: proposal.executionTime,
				actions: proposal.actions,
			};
			break;
		}

		case 'getProposalStatus': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;

			const proposal = await jupiterClient.getProposal(proposalId);
			const now = Date.now();
			const endTime = new Date(proposal.endTime).getTime();
			const startTime = new Date(proposal.startTime).getTime();

			let timeRemaining = null;
			if (proposal.status === 'active' && endTime > now) {
				timeRemaining = Math.floor((endTime - now) / 1000);
			}

			result = {
				proposalId,
				status: proposal.status,
				votesFor: proposal.votesFor,
				votesAgainst: proposal.votesAgainst,
				votesAbstain: proposal.votesAbstain,
				totalVotes: proposal.totalVotes,
				quorum: proposal.quorum,
				quorumReached: proposal.quorumReached,
				quorumProgress: (proposal.totalVotes / proposal.quorum) * 100,
				timeRemaining,
				isVotingOpen: proposal.status === 'active' && now >= startTime && now <= endTime,
			};
			break;
		}

		case 'vote': {
			const proposalId = this.getNodeParameter('proposalId', index) as string;
			const voteChoice = this.getNodeParameter('voteChoice', index) as string;

			// Build vote transaction
			const voteResult = await jupiterClient.vote(proposalId, voteChoice);

			if (voteResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(voteResult.transaction);
				result = {
					success: true,
					signature,
					proposalId,
					vote: voteChoice,
					votePower: voteResult.votePower,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build vote transaction');
			}
			break;
		}

		case 'getVotingPower': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const votePower = await jupiterClient.getVotingPower(wallet);

			result = {
				wallet,
				totalVotePower: votePower.total,
				ownedPower: votePower.owned,
				delegatedPower: votePower.delegated,
				stakedJup: votePower.stakedAmount,
				lockMultiplier: votePower.multiplier,
				delegatedTo: votePower.delegatedTo || null,
			};
			break;
		}

		case 'getVoteHistory': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
			};

			const history = await jupiterClient.getVoteHistory(wallet, options.limit || 10);

			result = {
				wallet,
				votes: history.map((v: Record<string, unknown>) => ({
					proposalId: v.proposalId,
					proposalTitle: v.proposalTitle,
					vote: v.vote,
					votePower: v.votePower,
					timestamp: v.timestamp,
					signature: v.signature,
				})),
				totalVotes: history.length,
			};
			break;
		}

		case 'getStats': {
			const stats = await jupiterClient.getGovernanceStats();

			result = {
				totalProposals: stats.totalProposals,
				activeProposals: stats.activeProposals,
				passedProposals: stats.passedProposals,
				failedProposals: stats.failedProposals,
				totalVoters: stats.totalVoters,
				totalVotePower: stats.totalVotePower,
				totalStaked: stats.totalStaked,
				averageParticipation: stats.averageParticipation,
				quorumRequirement: stats.quorumRequirement,
			};
			break;
		}

		case 'delegateVotes': {
			const delegateAddress = this.getNodeParameter('delegateAddress', index) as string;

			// Build delegate transaction
			const delegateResult = await jupiterClient.delegateVotes(delegateAddress);

			if (delegateResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(delegateResult.transaction);
				result = {
					success: true,
					signature,
					delegatedTo: delegateAddress,
					delegatedPower: delegateResult.votePower,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build delegation transaction');
			}
			break;
		}

		case 'getActiveProposals': {
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
			};

			const proposals = await jupiterClient.getProposals({
				limit: options.limit || 10,
				status: 'active',
			});

			const now = Date.now();
			result = {
				proposals: proposals.map((p: Record<string, unknown>) => {
					const endTime = new Date(p.endTime as string).getTime();
					return {
						id: p.id,
						title: p.title,
						votesFor: p.votesFor,
						votesAgainst: p.votesAgainst,
						votesAbstain: p.votesAbstain,
						totalVotes: p.totalVotes,
						quorum: p.quorum,
						quorumProgress: ((p.totalVotes as number) / (p.quorum as number)) * 100,
						timeRemaining: Math.max(0, Math.floor((endTime - now) / 1000)),
						endTime: p.endTime,
					};
				}),
				activeCount: proposals.length,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
