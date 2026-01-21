// @ts-nocheck
/**
 * Utility Resource Actions
 * Operations for utility functions - validation, conversion, status checks
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
import { isValidMint, isValidPublicKey } from '../../utils/tokenUtils';
import { LAMPORTS_PER_SOL, JUPITER_API_URL, JUPITER_PROGRAM_IDS } from '../../constants/networks';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Get Supported Tokens',
				value: 'getSupportedTokens',
				description: 'Get list of tokens supported by Jupiter',
				action: 'Get supported tokens',
			},
			{
				name: 'Get Indexed Route Map',
				value: 'getRouteMap',
				description: 'Get the indexed route map for swaps',
				action: 'Get indexed route map',
			},
			{
				name: 'Get Program IDs',
				value: 'getProgramIds',
				description: 'Get Jupiter program IDs',
				action: 'Get program IDs',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a Solana address',
				action: 'Validate address',
			},
			{
				name: 'Convert SOL to Lamports',
				value: 'solToLamports',
				description: 'Convert SOL amount to lamports',
				action: 'Convert SOL to lamports',
			},
			{
				name: 'Convert Lamports to SOL',
				value: 'lamportsToSol',
				description: 'Convert lamports to SOL',
				action: 'Convert lamports to SOL',
			},
			{
				name: 'Get RPC Status',
				value: 'getRpcStatus',
				description: 'Get Solana RPC endpoint status',
				action: 'Get RPC status',
			},
			{
				name: 'Get API Status',
				value: 'getApiStatus',
				description: 'Get Jupiter API status',
				action: 'Get API status',
			},
			{
				name: 'Get Rate Limits',
				value: 'getRateLimits',
				description: 'Get current API rate limit status',
				action: 'Get rate limits',
			},
			{
				name: 'Get Jupiter Version',
				value: 'getVersion',
				description: 'Get Jupiter API version',
				action: 'Get Jupiter version',
			},
		],
		default: 'getSupportedTokens',
	},
	// Address to validate
	{
		displayName: 'Address',
		name: 'address',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'Solana address to validate',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateAddress'],
			},
		},
	},
	// SOL amount for conversion
	{
		displayName: 'SOL Amount',
		name: 'solAmount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Amount in SOL',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['solToLamports'],
			},
		},
	},
	// Lamports amount for conversion
	{
		displayName: 'Lamports Amount',
		name: 'lamportsAmount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Amount in lamports',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['lamportsToSol'],
			},
		},
	},
	// Token mint for route map
	{
		displayName: 'Token Mint (Optional)',
		name: 'tokenMint',
		type: 'string',
		default: '',
		placeholder: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		description: 'Filter route map by token mint',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getRouteMap'],
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
				resource: ['utility'],
				operation: ['getSupportedTokens'],
			},
		},
		options: [
			{
				displayName: 'Only Strict List',
				name: 'onlyStrict',
				type: 'boolean',
				default: true,
				description: 'Only return tokens from the strict/verified list',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of tokens to return',
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
		case 'getSupportedTokens': {
			const options = this.getNodeParameter('options', index, {}) as {
				onlyStrict?: boolean;
				limit?: number;
			};

			const tokens = await jupiterClient.getTokenList({
				onlyStrict: options.onlyStrict ?? true,
			});

			const limitedTokens = tokens.slice(0, options.limit || 100);

			result = {
				tokens: limitedTokens.map((token: Record<string, unknown>) => ({
					symbol: token.symbol,
					name: token.name,
					mint: token.address,
					decimals: token.decimals,
					logoURI: token.logoURI,
					tags: token.tags || [],
				})),
				total: limitedTokens.length,
				fullListSize: tokens.length,
			};
			break;
		}

		case 'getRouteMap': {
			const tokenMint = this.getNodeParameter('tokenMint', index, '') as string;

			const routeMap = await jupiterClient.getIndexedRouteMap();

			if (tokenMint) {
				// Filter to show routes for specific token
				const tokenRoutes = routeMap[tokenMint] || [];
				result = {
					token: tokenMint,
					routeCount: tokenRoutes.length,
					routes: tokenRoutes,
				};
			} else {
				// Return summary of route map
				const tokenCount = Object.keys(routeMap).length;
				const totalRoutes = Object.values(routeMap).reduce(
					(sum: number, routes) => sum + (routes as string[]).length,
					0,
				);

				result = {
					tokenCount,
					totalRoutes,
					averageRoutesPerToken: Math.round(totalRoutes / tokenCount),
					sampleTokens: Object.keys(routeMap).slice(0, 10),
				};
			}
			break;
		}

		case 'getProgramIds': {
			result = {
				programs: JUPITER_PROGRAM_IDS,
				network: 'mainnet-beta',
				apiVersion: 'v6',
			};
			break;
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('address', index) as string;

			const isValid = isValidPublicKey(address);
			const isMintValid = isValidMint(address);

			let addressType = 'unknown';
			if (isValid) {
				// Check if it's a known token mint
				const tokenInfo = await jupiterClient.getTokenInfo(address).catch(() => null);
				if (tokenInfo) {
					addressType = 'token_mint';
				} else {
					// Check if it's a program
					const accountInfo = await solanaClient.getAccountInfo(address);
					if (accountInfo?.executable) {
						addressType = 'program';
					} else if (accountInfo) {
						addressType = 'account';
					} else {
						addressType = 'valid_but_unfunded';
					}
				}
			}

			result = {
				address,
				isValid,
				isMintFormat: isMintValid,
				addressType,
				length: address.length,
			};
			break;
		}

		case 'solToLamports': {
			const solAmount = this.getNodeParameter('solAmount', index) as number;

			const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

			result = {
				sol: solAmount,
				lamports,
				formula: `${solAmount} SOL × ${LAMPORTS_PER_SOL} = ${lamports} lamports`,
			};
			break;
		}

		case 'lamportsToSol': {
			const lamportsAmount = this.getNodeParameter('lamportsAmount', index) as number;

			const sol = lamportsAmount / LAMPORTS_PER_SOL;

			result = {
				lamports: lamportsAmount,
				sol,
				formula: `${lamportsAmount} lamports ÷ ${LAMPORTS_PER_SOL} = ${sol} SOL`,
			};
			break;
		}

		case 'getRpcStatus': {
			const startTime = Date.now();
			
			try {
				const slot = await solanaClient.getSlot();
				const blockHeight = await solanaClient.getBlockHeight();
				const latency = Date.now() - startTime;

				result = {
					status: 'online',
					currentSlot: slot,
					blockHeight,
					latencyMs: latency,
					endpoint: 'configured_rpc',
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				result = {
					status: 'offline',
					error: (error as Error).message,
					latencyMs: Date.now() - startTime,
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getApiStatus': {
			const startTime = Date.now();

			try {
				// Test Jupiter API by getting a simple quote
				await jupiterClient.getApiHealth();
				const latency = Date.now() - startTime;

				result = {
					status: 'online',
					apiUrl: JUPITER_API_URL,
					latencyMs: latency,
					version: 'v6',
					timestamp: new Date().toISOString(),
				};
			} catch (error) {
				result = {
					status: 'degraded',
					apiUrl: JUPITER_API_URL,
					error: (error as Error).message,
					latencyMs: Date.now() - startTime,
					timestamp: new Date().toISOString(),
				};
			}
			break;
		}

		case 'getRateLimits': {
			const rateLimits = await jupiterClient.getRateLimitStatus();

			result = {
				quotesPerMinute: rateLimits.quotesPerMinute,
				quotesRemaining: rateLimits.quotesRemaining,
				swapsPerMinute: rateLimits.swapsPerMinute,
				swapsRemaining: rateLimits.swapsRemaining,
				resetsAt: rateLimits.resetsAt,
				tier: rateLimits.tier || 'standard',
			};
			break;
		}

		case 'getVersion': {
			const version = await jupiterClient.getVersion();

			result = {
				apiVersion: version.apiVersion || 'v6',
				sdkVersion: version.sdkVersion,
				features: version.features || [
					'swap',
					'limit-order',
					'dca',
					'perpetuals',
					'ultra',
				],
				lastUpdated: version.lastUpdated,
				changelog: version.changelog || null,
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}
