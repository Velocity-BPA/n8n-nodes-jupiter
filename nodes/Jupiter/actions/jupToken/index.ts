// @ts-nocheck
/**
 * JUP Token Resource Actions
 * Operations for JUP token - balances, transfers, staking, rewards
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
import { JUP_TOKEN_MINT } from '../../constants/tokens';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['jupToken'],
			},
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				description: 'Get JUP token balance for a wallet',
				action: 'Get JUP balance',
			},
			{
				name: 'Transfer JUP',
				value: 'transfer',
				description: 'Transfer JUP tokens to another wallet',
				action: 'Transfer JUP tokens',
			},
			{
				name: 'Get Price',
				value: 'getPrice',
				description: 'Get current JUP token price',
				action: 'Get JUP price',
			},
			{
				name: 'Get Supply',
				value: 'getSupply',
				description: 'Get JUP token supply information',
				action: 'Get JUP supply',
			},
			{
				name: 'Get Stats',
				value: 'getStats',
				description: 'Get JUP token statistics',
				action: 'Get JUP stats',
			},
			{
				name: 'Stake JUP',
				value: 'stake',
				description: 'Stake JUP tokens for governance',
				action: 'Stake JUP tokens',
			},
			{
				name: 'Unstake JUP',
				value: 'unstake',
				description: 'Unstake JUP tokens',
				action: 'Unstake JUP tokens',
			},
			{
				name: 'Get Staking APY',
				value: 'getStakingApy',
				description: 'Get current JUP staking APY',
				action: 'Get staking APY',
			},
			{
				name: 'Get Staking Rewards',
				value: 'getStakingRewards',
				description: 'Get pending staking rewards',
				action: 'Get staking rewards',
			},
			{
				name: 'Claim Staking Rewards',
				value: 'claimRewards',
				description: 'Claim pending staking rewards',
				action: 'Claim staking rewards',
			},
			{
				name: 'Get Vote Power',
				value: 'getVotePower',
				description: 'Get voting power from staked JUP',
				action: 'Get vote power',
			},
		],
		default: 'getBalance',
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
				resource: ['jupToken'],
				operation: ['getBalance', 'getStakingRewards', 'claimRewards', 'getVotePower'],
			},
		},
	},
	// Recipient for transfers
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Recipient wallet address',
		displayOptions: {
			show: {
				resource: ['jupToken'],
				operation: ['transfer'],
			},
		},
	},
	// Amount for transfers and staking
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Amount of JUP tokens',
		displayOptions: {
			show: {
				resource: ['jupToken'],
				operation: ['transfer', 'stake', 'unstake'],
			},
		},
	},
	// Staking duration
	{
		displayName: 'Lock Duration',
		name: 'lockDuration',
		type: 'options',
		default: '0',
		description: 'Duration to lock staked JUP (longer = more vote power)',
		options: [
			{ name: 'No Lock (1x)', value: '0' },
			{ name: '1 Month (1.25x)', value: '2592000' },
			{ name: '3 Months (1.5x)', value: '7776000' },
			{ name: '6 Months (2x)', value: '15552000' },
			{ name: '1 Year (3x)', value: '31536000' },
		],
		displayOptions: {
			show: {
				resource: ['jupToken'],
				operation: ['stake'],
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
		case 'getBalance': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			// Get JUP token balance
			const balance = await solanaClient.getTokenBalance(wallet, JUP_TOKEN_MINT);
			const price = await jupiterClient.getTokenPrice(JUP_TOKEN_MINT);

			result = {
				wallet,
				token: 'JUP',
				mint: JUP_TOKEN_MINT,
				balance: balance.amount,
				decimals: balance.decimals,
				uiAmount: balance.uiAmount,
				usdValue: balance.uiAmount * (price?.price || 0),
				price: price?.price || null,
			};
			break;
		}

		case 'transfer': {
			const recipientAddress = this.getNodeParameter('recipientAddress', index) as string;
			const amount = this.getNodeParameter('amount', index) as number;

			// Build and send transfer transaction
			const transaction = await solanaClient.buildTokenTransfer(
				JUP_TOKEN_MINT,
				recipientAddress,
				amount,
				6, // JUP has 6 decimals
			);

			const signature = await solanaClient.signAndSendTransaction(transaction);

			result = {
				success: true,
				signature,
				token: 'JUP',
				mint: JUP_TOKEN_MINT,
				amount,
				recipient: recipientAddress,
				explorerUrl: `https://solscan.io/tx/${signature}`,
			};
			break;
		}

		case 'getPrice': {
			const price = await jupiterClient.getTokenPrice(JUP_TOKEN_MINT);

			result = {
				token: 'JUP',
				mint: JUP_TOKEN_MINT,
				price: price?.price || 0,
				timestamp: new Date().toISOString(),
			};
			break;
		}

		case 'getSupply': {
			const supply = await solanaClient.getTokenSupply(JUP_TOKEN_MINT);

			result = {
				token: 'JUP',
				mint: JUP_TOKEN_MINT,
				totalSupply: supply.total,
				circulatingSupply: supply.circulating,
				decimals: 6,
				maxSupply: 10_000_000_000, // 10 billion max supply
			};
			break;
		}

		case 'getStats': {
			const [price, supply] = await Promise.all([
				jupiterClient.getTokenPrice(JUP_TOKEN_MINT),
				solanaClient.getTokenSupply(JUP_TOKEN_MINT),
			]);

			const marketCap = (supply.circulating || 0) * (price?.price || 0);

			result = {
				token: 'JUP',
				mint: JUP_TOKEN_MINT,
				price: price?.price || 0,
				totalSupply: supply.total,
				circulatingSupply: supply.circulating,
				marketCap,
				fullyDilutedValue: 10_000_000_000 * (price?.price || 0),
			};
			break;
		}

		case 'stake': {
			const amount = this.getNodeParameter('amount', index) as number;
			const lockDuration = parseInt(this.getNodeParameter('lockDuration', index) as string, 10);

			// Build stake transaction
			const stakeResult = await jupiterClient.stakeJup(amount, lockDuration);

			if (stakeResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(stakeResult.transaction);
				result = {
					success: true,
					signature,
					amount,
					lockDuration,
					lockMultiplier: getLockMultiplier(lockDuration),
					votePower: amount * getLockMultiplier(lockDuration),
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build stake transaction');
			}
			break;
		}

		case 'unstake': {
			const amount = this.getNodeParameter('amount', index) as number;

			// Build unstake transaction
			const unstakeResult = await jupiterClient.unstakeJup(amount);

			if (unstakeResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(unstakeResult.transaction);
				result = {
					success: true,
					signature,
					amount,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'Failed to build unstake transaction');
			}
			break;
		}

		case 'getStakingApy': {
			const stakingInfo = await jupiterClient.getStakingInfo();

			result = {
				apy: stakingInfo.apy,
				apr: stakingInfo.apr,
				totalStaked: stakingInfo.totalStaked,
				rewardRate: stakingInfo.rewardRate,
				lastUpdated: new Date().toISOString(),
			};
			break;
		}

		case 'getStakingRewards': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const rewards = await jupiterClient.getStakingRewards(wallet);

			result = {
				wallet,
				pendingRewards: rewards.pending,
				claimedRewards: rewards.claimed,
				totalEarned: rewards.total,
				estimatedDailyReward: rewards.dailyEstimate,
			};
			break;
		}

		case 'claimRewards': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const claimResult = await jupiterClient.claimStakingRewards(wallet);

			if (claimResult.transaction) {
				const signature = await solanaClient.signAndSendTransaction(claimResult.transaction);
				result = {
					success: true,
					signature,
					claimedAmount: claimResult.amount,
					wallet,
					explorerUrl: `https://solscan.io/tx/${signature}`,
				};
			} else {
				throw new NodeOperationError(this.getNode(), 'No rewards to claim or failed to build transaction');
			}
			break;
		}

		case 'getVotePower': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());

			const votePower = await jupiterClient.getVotingPower(wallet);

			result = {
				wallet,
				totalVotePower: votePower.total,
				stakedAmount: votePower.stakedAmount,
				lockMultiplier: votePower.multiplier,
				delegatedTo: votePower.delegatedTo || null,
				delegatedFrom: votePower.delegatedFrom || [],
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

// Helper function to get lock multiplier
function getLockMultiplier(duration: number): number {
	if (duration >= 31536000) return 3;
	if (duration >= 15552000) return 2;
	if (duration >= 7776000) return 1.5;
	if (duration >= 2592000) return 1.25;
	return 1;
}
