// @ts-nocheck
/**
 * DCA Resource Actions
 * Dollar Cost Averaging operations for automated periodic swaps
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createDCAClient } from '../../transport/dcaClient';
import { createSolanaClient } from '../../transport/solanaClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['dca'],
			},
		},
		options: [
			{
				name: 'Create DCA Order',
				value: 'createDCA',
				description: 'Create a new DCA order',
				action: 'Create DCA order',
			},
			{
				name: 'Get DCA Order',
				value: 'getDCA',
				description: 'Get details of a DCA order',
				action: 'Get DCA order',
			},
			{
				name: 'Get Active DCAs',
				value: 'getActiveDCAs',
				description: 'Get all active DCA orders',
				action: 'Get active DCAs',
			},
			{
				name: 'Get DCA History',
				value: 'getDCAHistory',
				description: 'Get DCA order history',
				action: 'Get DCA history',
			},
			{
				name: 'Cancel DCA',
				value: 'cancelDCA',
				description: 'Cancel a DCA order',
				action: 'Cancel DCA',
			},
			{
				name: 'Pause DCA',
				value: 'pauseDCA',
				description: 'Pause a DCA order',
				action: 'Pause DCA',
			},
			{
				name: 'Resume DCA',
				value: 'resumeDCA',
				description: 'Resume a paused DCA order',
				action: 'Resume DCA',
			},
			{
				name: 'Get DCA Status',
				value: 'getDCAStatus',
				description: 'Get the status of a DCA order',
				action: 'Get DCA status',
			},
			{
				name: 'Get DCA Fills',
				value: 'getDCAFills',
				description: 'Get fill history for a DCA order',
				action: 'Get DCA fills',
			},
			{
				name: 'Modify DCA Parameters',
				value: 'modifyDCA',
				description: 'Modify DCA order parameters',
				action: 'Modify DCA',
			},
			{
				name: 'Get DCA Statistics',
				value: 'getDCAStats',
				description: 'Get statistics for DCA orders',
				action: 'Get DCA statistics',
			},
		],
		default: 'createDCA',
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
				resource: ['dca'],
				operation: ['createDCA'],
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
				resource: ['dca'],
				operation: ['createDCA'],
			},
		},
	},
	// Total Amount
	{
		displayName: 'Total Amount',
		name: 'totalAmount',
		type: 'string',
		default: '',
		placeholder: '1000000000',
		description: 'Total amount to DCA (in smallest units)',
		displayOptions: {
			show: {
				resource: ['dca'],
				operation: ['createDCA'],
			},
		},
	},
	// Amount Per Cycle
	{
		displayName: 'Amount Per Cycle',
		name: 'amountPerCycle',
		type: 'string',
		default: '',
		placeholder: '100000000',
		description: 'Amount to swap per cycle (in smallest units)',
		displayOptions: {
			show: {
				resource: ['dca'],
				operation: ['createDCA'],
			},
		},
	},
	// Cycle Frequency
	{
		displayName: 'Cycle Frequency (Seconds)',
		name: 'cycleFrequency',
		type: 'number',
		default: 86400,
		description: 'Time between swaps in seconds (e.g., 86400 = 1 day)',
		displayOptions: {
			show: {
				resource: ['dca'],
				operation: ['createDCA'],
			},
		},
	},
	// DCA Public Key
	{
		displayName: 'DCA Public Key',
		name: 'dcaPubkey',
		type: 'string',
		default: '',
		description: 'The public key of the DCA order',
		displayOptions: {
			show: {
				resource: ['dca'],
				operation: [
					'getDCA',
					'cancelDCA',
					'pauseDCA',
					'resumeDCA',
					'getDCAStatus',
					'getDCAFills',
					'modifyDCA',
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
				resource: ['dca'],
				operation: ['getActiveDCAs', 'getDCAHistory', 'getDCAStats'],
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
				resource: ['dca'],
			},
		},
		options: [
			{
				displayName: 'Min Output Per Cycle',
				name: 'minOutAmountPerCycle',
				type: 'string',
				default: '',
				description: 'Minimum output amount per cycle (slippage protection)',
			},
			{
				displayName: 'Max Output Per Cycle',
				name: 'maxOutAmountPerCycle',
				type: 'string',
				default: '',
				description: 'Maximum output amount per cycle (price limit)',
			},
			{
				displayName: 'Start At',
				name: 'startAt',
				type: 'number',
				default: 0,
				description: 'Unix timestamp to start DCA (0 = immediate)',
			},
			{
				displayName: 'New Amount Per Cycle',
				name: 'newAmountPerCycle',
				type: 'string',
				default: '',
				description: 'New amount per cycle for modification',
			},
			{
				displayName: 'New Cycle Frequency',
				name: 'newCycleFrequency',
				type: 'number',
				default: 0,
				description: 'New cycle frequency for modification',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const dcaClient = await createDCAClient(this);
	const solanaClient = await createSolanaClient(this);

	switch (operation) {
		case 'createDCA': {
			const inputMint = this.getNodeParameter('inputMint', index) as string;
			const outputMint = this.getNodeParameter('outputMint', index) as string;
			const totalAmount = this.getNodeParameter('totalAmount', index) as string;
			const amountPerCycle = this.getNodeParameter('amountPerCycle', index) as string;
			const cycleFrequency = this.getNodeParameter('cycleFrequency', index) as number;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to create DCA orders',
					{ itemIndex: index },
				);
			}

			const result = await dcaClient.createDCA({
				user: walletAddress,
				inputMint,
				outputMint,
				inAmount: totalAmount,
				inAmountPerCycle: amountPerCycle,
				cycleFrequency,
				minOutAmountPerCycle: options.minOutAmountPerCycle as string,
				maxOutAmountPerCycle: options.maxOutAmountPerCycle as string,
				startAt: options.startAt as number,
			});

			// Sign and send
			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							dcaPubkey: result.dcaPubkey,
							estimatedCycles: Math.ceil(parseInt(totalAmount) / parseInt(amountPerCycle)),
							cycleFrequencyHours: cycleFrequency / 3600,
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

		case 'getDCA': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const dca = await dcaClient.getDCA(dcaPubkey);

			if (!dca) {
				throw new NodeOperationError(
					this.getNode(),
					`DCA order not found: ${dcaPubkey}`,
					{ itemIndex: index },
				);
			}

			const progress = dcaClient.calculateProgress(dca);
			const status = dcaClient.getDCAStatus(dca);

			return [
				{
					json: {
						dca,
						progress,
						status,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getActiveDCAs': {
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

			const dcas = await dcaClient.getActiveDCAs(walletAddress);

			return [
				{
					json: {
						dcas,
						totalActive: dcas.length,
						wallet: walletAddress,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getDCAHistory': {
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

			const dcas = await dcaClient.getUserDCAs(walletAddress);

			// Categorize by status
			const active = dcas.filter((dca: { inDeposited: string; inUsed: string }) =>
				dcaClient.getDCAStatus(dca) === 'active',
			);
			const completed = dcas.filter((dca: { inDeposited: string; inUsed: string }) =>
				dcaClient.getDCAStatus(dca) === 'completed',
			);
			const cancelled = dcas.filter((dca: { inDeposited: string; inUsed: string }) =>
				dcaClient.getDCAStatus(dca) === 'cancelled',
			);

			return [
				{
					json: {
						all: dcas,
						active,
						completed,
						cancelled,
						summary: {
							total: dcas.length,
							active: active.length,
							completed: completed.length,
							cancelled: cancelled.length,
						},
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'cancelDCA': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to cancel DCA',
					{ itemIndex: index },
				);
			}

			const result = await dcaClient.cancelDCA(dcaPubkey, walletAddress);

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							cancelledDCA: dcaPubkey,
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
						cancelledDCA: dcaPubkey,
						...result,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'pauseDCA': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to pause DCA',
					{ itemIndex: index },
				);
			}

			const result = await dcaClient.pauseDCA(dcaPubkey, walletAddress);

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							pausedDCA: dcaPubkey,
							status: 'paused',
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
						pausedDCA: dcaPubkey,
						status: 'paused',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'resumeDCA': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const walletAddress = solanaClient.getWalletAddress();
			if (!walletAddress) {
				throw new NodeOperationError(
					this.getNode(),
					'Wallet private key is required to resume DCA',
					{ itemIndex: index },
				);
			}

			const result = await dcaClient.resumeDCA(dcaPubkey, walletAddress);

			if (result.tx) {
				const txResult = await solanaClient.signAndSendTransaction(result.tx);
				return [
					{
						json: {
							success: true,
							resumedDCA: dcaPubkey,
							status: 'active',
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
						resumedDCA: dcaPubkey,
						status: 'active',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getDCAStatus': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const dca = await dcaClient.getDCA(dcaPubkey);

			if (!dca) {
				return [
					{
						json: {
							dcaPubkey,
							found: false,
							status: 'not_found',
						},
						pairedItem: { item: index },
					},
				];
			}

			const status = dcaClient.getDCAStatus(dca);
			const progress = dcaClient.calculateProgress(dca);

			return [
				{
					json: {
						dcaPubkey,
						found: true,
						status,
						progress,
						nextCycleAt: dca.nextCycleAt,
						cyclesCompleted: dca.cyclesCompleted || Math.floor(progress / 100 * (parseInt(dca.inDeposited) / parseInt(dca.inAmountPerCycle))),
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getDCAFills': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;

			const fills = await dcaClient.getDCAFills(dcaPubkey);

			// Calculate aggregate stats
			let totalIn = BigInt(0);
			let totalOut = BigInt(0);

			for (const fill of fills) {
				totalIn += BigInt(fill.inAmount || 0);
				totalOut += BigInt(fill.outAmount || 0);
			}

			return [
				{
					json: {
						dcaPubkey,
						fills,
						totalFills: fills.length,
						aggregates: {
							totalInputUsed: totalIn.toString(),
							totalOutputReceived: totalOut.toString(),
							averagePrice: fills.length > 0
								? (Number(totalIn) / Number(totalOut)).toFixed(8)
								: '0',
						},
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'modifyDCA': {
			const dcaPubkey = this.getNodeParameter('dcaPubkey', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			// Currently Jupiter DCA doesn't support direct modification
			// This would require cancel + recreate pattern
			// For now, return info about what would be modified

			const dca = await dcaClient.getDCA(dcaPubkey);

			if (!dca) {
				throw new NodeOperationError(
					this.getNode(),
					`DCA order not found: ${dcaPubkey}`,
					{ itemIndex: index },
				);
			}

			return [
				{
					json: {
						message: 'DCA modification requires cancelling and recreating the order',
						currentDCA: dca,
						proposedChanges: {
							amountPerCycle: options.newAmountPerCycle || dca.inAmountPerCycle,
							cycleFrequency: options.newCycleFrequency || dca.cycleFrequency,
						},
						instructions: [
							'1. Cancel the existing DCA order',
							'2. Create a new DCA order with updated parameters',
							'3. Any remaining funds will be returned on cancellation',
						],
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getDCAStats': {
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

			const dcas = await dcaClient.getUserDCAs(walletAddress);

			// Calculate statistics
			let totalDeposited = BigInt(0);
			let totalUsed = BigInt(0);
			let totalWithdrawn = BigInt(0);
			let activeCount = 0;
			let completedCount = 0;

			for (const dca of dcas) {
				totalDeposited += BigInt(dca.inDeposited || 0);
				totalUsed += BigInt(dca.inUsed || 0);
				totalWithdrawn += BigInt(dca.inWithdrawn || 0);

				const status = dcaClient.getDCAStatus(dca);
				if (status === 'active') activeCount++;
				if (status === 'completed') completedCount++;
			}

			return [
				{
					json: {
						wallet: walletAddress,
						statistics: {
							totalDCAs: dcas.length,
							activeDCAs: activeCount,
							completedDCAs: completedCount,
							totalDeposited: totalDeposited.toString(),
							totalUsed: totalUsed.toString(),
							totalWithdrawn: totalWithdrawn.toString(),
							overallProgress: totalDeposited > 0n
								? ((Number(totalUsed) / Number(totalDeposited)) * 100).toFixed(2)
								: '0',
						},
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
