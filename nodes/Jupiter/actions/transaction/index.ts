// @ts-nocheck
/**
 * Transaction Resource Actions
 * Operations for Solana transactions - build, sign, send, confirm
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
import { createSolanaClient } from '../../transport/jupiterClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['transaction'],
			},
		},
		options: [
			{
				name: 'Get Transaction',
				value: 'getTransaction',
				description: 'Get transaction details by signature',
				action: 'Get transaction',
			},
			{
				name: 'Get Transaction Status',
				value: 'getStatus',
				description: 'Get current status of a transaction',
				action: 'Get transaction status',
			},
			{
				name: 'Build Transaction',
				value: 'buildTransaction',
				description: 'Build a transaction from instructions',
				action: 'Build transaction',
			},
			{
				name: 'Sign Transaction',
				value: 'signTransaction',
				description: 'Sign a transaction',
				action: 'Sign transaction',
			},
			{
				name: 'Send Transaction',
				value: 'sendTransaction',
				description: 'Send a signed transaction',
				action: 'Send transaction',
			},
			{
				name: 'Confirm Transaction',
				value: 'confirmTransaction',
				description: 'Wait for transaction confirmation',
				action: 'Confirm transaction',
			},
			{
				name: 'Get Transaction History',
				value: 'getHistory',
				description: 'Get transaction history for a wallet',
				action: 'Get transaction history',
			},
			{
				name: 'Get Recent Transactions',
				value: 'getRecent',
				description: 'Get recent transactions for a wallet',
				action: 'Get recent transactions',
			},
			{
				name: 'Estimate Transaction Fee',
				value: 'estimateFee',
				description: 'Estimate fee for a transaction',
				action: 'Estimate transaction fee',
			},
			{
				name: 'Simulate Transaction',
				value: 'simulateTransaction',
				description: 'Simulate a transaction without sending',
				action: 'Simulate transaction',
			},
		],
		default: 'getTransaction',
	},
	// Transaction signature parameter
	{
		displayName: 'Transaction Signature',
		name: 'txSignature',
		type: 'string',
		required: true,
		default: '',
		placeholder: '5UfDuX...',
		description: 'The transaction signature',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['getTransaction', 'getStatus', 'confirmTransaction'],
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
				resource: ['transaction'],
				operation: ['getHistory', 'getRecent'],
			},
		},
	},
	// Serialized transaction
	{
		displayName: 'Serialized Transaction',
		name: 'serializedTx',
		type: 'string',
		required: true,
		default: '',
		description: 'Base64 encoded serialized transaction',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['signTransaction', 'sendTransaction', 'estimateFee', 'simulateTransaction'],
			},
		},
	},
	// Instructions for building transaction
	{
		displayName: 'Instructions',
		name: 'instructions',
		type: 'json',
		required: true,
		default: '[]',
		description: 'JSON array of transaction instructions',
		displayOptions: {
			show: {
				resource: ['transaction'],
				operation: ['buildTransaction'],
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
				resource: ['transaction'],
				operation: ['getHistory', 'getRecent', 'buildTransaction', 'sendTransaction', 'confirmTransaction'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				description: 'Maximum number of transactions to return',
			},
			{
				displayName: 'Before Signature',
				name: 'before',
				type: 'string',
				default: '',
				description: 'Get transactions before this signature',
			},
			{
				displayName: 'Priority Fee (Lamports)',
				name: 'priorityFee',
				type: 'number',
				default: 0,
				description: 'Priority fee in lamports',
			},
			{
				displayName: 'Skip Preflight',
				name: 'skipPreflight',
				type: 'boolean',
				default: false,
				description: 'Skip preflight transaction checks',
			},
			{
				displayName: 'Commitment',
				name: 'commitment',
				type: 'options',
				default: 'confirmed',
				options: [
					{ name: 'Processed', value: 'processed' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Finalized', value: 'finalized' },
				],
				description: 'Commitment level for confirmation',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 30,
				description: 'Timeout for confirmation in seconds',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const solanaClient = await createSolanaClient.call(this);

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getTransaction': {
			const txSignature = this.getNodeParameter('txSignature', index) as string;

			const transaction = await solanaClient.getTransaction(txSignature);

			if (!transaction) {
				throw new NodeOperationError(this.getNode(), `Transaction not found: ${txSignature}`);
			}

			result = {
				signature: txSignature,
				slot: transaction.slot,
				blockTime: transaction.blockTime,
				fee: transaction.meta?.fee,
				status: transaction.meta?.err ? 'failed' : 'success',
				error: transaction.meta?.err || null,
				preBalances: transaction.meta?.preBalances,
				postBalances: transaction.meta?.postBalances,
				logMessages: transaction.meta?.logMessages,
				accounts: transaction.transaction?.message?.accountKeys,
				instructions: transaction.transaction?.message?.instructions,
				explorerUrl: `https://solscan.io/tx/${txSignature}`,
			};
			break;
		}

		case 'getStatus': {
			const txSignature = this.getNodeParameter('txSignature', index) as string;

			const status = await solanaClient.getSignatureStatus(txSignature);

			result = {
				signature: txSignature,
				slot: status?.slot || null,
				confirmations: status?.confirmations || null,
				confirmationStatus: status?.confirmationStatus || 'unknown',
				error: status?.err || null,
				isConfirmed: status?.confirmationStatus === 'confirmed' || 
				             status?.confirmationStatus === 'finalized',
				isFinalized: status?.confirmationStatus === 'finalized',
			};
			break;
		}

		case 'buildTransaction': {
			const instructionsJson = this.getNodeParameter('instructions', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				priorityFee?: number;
			};

			let instructions;
			try {
				instructions = JSON.parse(instructionsJson);
			} catch {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON for instructions');
			}

			const transaction = await solanaClient.buildTransaction(
				instructions,
				options.priorityFee || 0,
			);

			result = {
				serializedTransaction: transaction.serialized,
				recentBlockhash: transaction.recentBlockhash,
				feePayer: transaction.feePayer,
				estimatedFee: transaction.estimatedFee,
				instructionCount: instructions.length,
			};
			break;
		}

		case 'signTransaction': {
			const serializedTx = this.getNodeParameter('serializedTx', index) as string;

			const signedTx = await solanaClient.signTransaction(serializedTx);

			result = {
				signedTransaction: signedTx.serialized,
				signatures: signedTx.signatures,
			};
			break;
		}

		case 'sendTransaction': {
			const serializedTx = this.getNodeParameter('serializedTx', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				skipPreflight?: boolean;
			};

			const signature = await solanaClient.sendTransaction(serializedTx, {
				skipPreflight: options.skipPreflight || false,
			});

			result = {
				signature,
				sent: true,
				explorerUrl: `https://solscan.io/tx/${signature}`,
			};
			break;
		}

		case 'confirmTransaction': {
			const txSignature = this.getNodeParameter('txSignature', index) as string;
			const options = this.getNodeParameter('options', index, {}) as {
				commitment?: string;
				timeout?: number;
			};

			const confirmation = await solanaClient.confirmTransaction(txSignature, {
				commitment: options.commitment || 'confirmed',
				timeout: (options.timeout || 30) * 1000,
			});

			result = {
				signature: txSignature,
				confirmed: confirmation.confirmed,
				slot: confirmation.slot,
				error: confirmation.error || null,
				confirmationStatus: confirmation.status,
			};
			break;
		}

		case 'getHistory': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
				before?: string;
			};

			const history = await solanaClient.getTransactionHistory(wallet, {
				limit: options.limit || 10,
				before: options.before || undefined,
			});

			result = {
				wallet,
				transactions: history.map((tx: Record<string, unknown>) => ({
					signature: tx.signature,
					slot: tx.slot,
					blockTime: tx.blockTime,
					status: tx.err ? 'failed' : 'success',
					fee: tx.fee,
					memo: tx.memo || null,
				})),
				total: history.length,
			};
			break;
		}

		case 'getRecent': {
			const walletAddress = this.getNodeParameter('walletAddress', index, '') as string;
			const wallet = walletAddress || (await solanaClient.getWalletAddress());
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
			};

			const recent = await solanaClient.getRecentTransactions(wallet, options.limit || 10);

			result = {
				wallet,
				transactions: recent.map((tx: Record<string, unknown>) => ({
					signature: tx.signature,
					slot: tx.slot,
					blockTime: tx.blockTime,
					status: tx.err ? 'failed' : 'success',
					type: tx.type || 'unknown',
					amount: tx.amount,
					fee: tx.fee,
				})),
			};
			break;
		}

		case 'estimateFee': {
			const serializedTx = this.getNodeParameter('serializedTx', index) as string;

			const feeEstimate = await solanaClient.estimateTransactionFee(serializedTx);

			result = {
				baseFee: feeEstimate.baseFee,
				priorityFee: feeEstimate.priorityFee,
				totalFee: feeEstimate.totalFee,
				totalFeeInSol: feeEstimate.totalFee / 1_000_000_000,
				computeUnits: feeEstimate.computeUnits,
			};
			break;
		}

		case 'simulateTransaction': {
			const serializedTx = this.getNodeParameter('serializedTx', index) as string;

			const simulation = await solanaClient.simulateTransaction(serializedTx);

			result = {
				success: !simulation.err,
				error: simulation.err || null,
				logs: simulation.logs || [],
				unitsConsumed: simulation.unitsConsumed,
				returnData: simulation.returnData || null,
				accounts: simulation.accounts || [],
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
