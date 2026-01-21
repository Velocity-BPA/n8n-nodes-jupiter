// @ts-nocheck
/**
 * Token Resource Actions
 * Token information, search, and validation operations
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';
import { createSolanaClient } from '../../transport/solanaClient';
import {
	findTokenBySymbol,
	findTokenByMint,
	isValidMint,
	isStablecoin,
	isWrappedSol,
	getTokenMetadata,
} from '../../utils/tokenUtils';
import { COMMON_TOKENS, STABLECOINS, MAJOR_TOKENS } from '../../constants/tokens';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Get Token Info',
				value: 'getTokenInfo',
				description: 'Get detailed token information',
				action: 'Get token info',
			},
			{
				name: 'Get Token List',
				value: 'getTokenList',
				description: 'Get the Jupiter token list',
				action: 'Get token list',
			},
			{
				name: 'Get Strict Token List',
				value: 'getStrictTokenList',
				description: 'Get verified tokens only',
				action: 'Get strict token list',
			},
			{
				name: 'Get All Tokens',
				value: 'getAllTokens',
				description: 'Get all tradeable tokens',
				action: 'Get all tokens',
			},
			{
				name: 'Search Tokens',
				value: 'searchTokens',
				description: 'Search tokens by name or symbol',
				action: 'Search tokens',
			},
			{
				name: 'Get Token by Mint',
				value: 'getTokenByMint',
				description: 'Get token by mint address',
				action: 'Get token by mint',
			},
			{
				name: 'Get Token by Symbol',
				value: 'getTokenBySymbol',
				description: 'Get token by symbol',
				action: 'Get token by symbol',
			},
			{
				name: 'Get Token Price',
				value: 'getTokenPrice',
				description: 'Get current token price',
				action: 'Get token price',
			},
			{
				name: 'Get Token Prices (Batch)',
				value: 'getTokenPrices',
				description: 'Get prices for multiple tokens',
				action: 'Get token prices batch',
			},
			{
				name: 'Get Token Logo',
				value: 'getTokenLogo',
				description: 'Get token logo URL',
				action: 'Get token logo',
			},
			{
				name: 'Get Token Tags',
				value: 'getTokenTags',
				description: 'Get token categorization tags',
				action: 'Get token tags',
			},
			{
				name: 'Validate Token',
				value: 'validateToken',
				description: 'Validate a token address',
				action: 'Validate token',
			},
			{
				name: 'Get New Tokens',
				value: 'getNewTokens',
				description: 'Get recently added tokens',
				action: 'Get new tokens',
			},
			{
				name: 'Get Verified Tokens',
				value: 'getVerifiedTokens',
				description: 'Get community verified tokens',
				action: 'Get verified tokens',
			},
		],
		default: 'getTokenInfo',
	},
	// Token Mint
	{
		displayName: 'Token Mint',
		name: 'tokenMint',
		type: 'string',
		default: '',
		placeholder: 'So11111111111111111111111111111111111111112',
		description: 'The mint address of the token',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: [
					'getTokenInfo',
					'getTokenByMint',
					'getTokenPrice',
					'getTokenLogo',
					'getTokenTags',
					'validateToken',
				],
			},
		},
	},
	// Token Symbol
	{
		displayName: 'Token Symbol',
		name: 'tokenSymbol',
		type: 'string',
		default: '',
		placeholder: 'SOL',
		description: 'The symbol of the token',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenBySymbol'],
			},
		},
	},
	// Search Query
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		default: '',
		placeholder: 'Jupiter',
		description: 'Search query for token name or symbol',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['searchTokens'],
			},
		},
	},
	// Token Mints (batch)
	{
		displayName: 'Token Mints',
		name: 'tokenMints',
		type: 'string',
		default: '',
		placeholder: 'mint1,mint2,mint3',
		description: 'Comma-separated list of token mint addresses',
		displayOptions: {
			show: {
				resource: ['token'],
				operation: ['getTokenPrices'],
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
				resource: ['token'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of results',
			},
			{
				displayName: 'Include Tags',
				name: 'includeTags',
				type: 'boolean',
				default: true,
				description: 'Whether to include token tags',
			},
			{
				displayName: 'Verified Only',
				name: 'verifiedOnly',
				type: 'boolean',
				default: false,
				description: 'Whether to return verified tokens only',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const jupiterClient = await createJupiterClient(this);

	switch (operation) {
		case 'getTokenInfo': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const token = await jupiterClient.getToken(tokenMint);

			if (!token) {
				throw new NodeOperationError(
					this.getNode(),
					`Token not found: ${tokenMint}`,
					{ itemIndex: index },
				);
			}

			// Get additional info
			const metadata = await getTokenMetadata(tokenMint);

			return [
				{
					json: {
						...token,
						metadata,
						isStablecoin: isStablecoin(tokenMint),
						isWrappedSol: isWrappedSol(tokenMint),
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenList': {
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const tokens = await jupiterClient.getTokenList();

			const limit = (options.limit as number) || 100;
			const limitedTokens = tokens.slice(0, limit);

			return [
				{
					json: {
						tokens: limitedTokens,
						total: tokens.length,
						returned: limitedTokens.length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getStrictTokenList': {
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const tokens = await jupiterClient.getStrictTokenList();

			const limit = (options.limit as number) || 100;
			const limitedTokens = tokens.slice(0, limit);

			return [
				{
					json: {
						tokens: limitedTokens,
						total: tokens.length,
						returned: limitedTokens.length,
						verifiedOnly: true,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getAllTokens': {
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const allTokens = await jupiterClient.getTokenList();
			const strictTokens = await jupiterClient.getStrictTokenList();

			const strictMints = new Set(strictTokens.map((t: { address: string }) => t.address));

			const tokensWithVerification = allTokens.map((token: { address: string }) => ({
				...token,
				verified: strictMints.has(token.address),
			}));

			const limit = (options.limit as number) || 100;
			const limitedTokens = tokensWithVerification.slice(0, limit);

			return [
				{
					json: {
						tokens: limitedTokens,
						total: allTokens.length,
						verifiedCount: strictTokens.length,
						returned: limitedTokens.length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'searchTokens': {
			const searchQuery = this.getNodeParameter('searchQuery', index) as string;
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const tokens = await jupiterClient.searchTokens(searchQuery);

			const limit = (options.limit as number) || 100;
			const limitedTokens = tokens.slice(0, limit);

			return [
				{
					json: {
						query: searchQuery,
						tokens: limitedTokens,
						total: tokens.length,
						returned: limitedTokens.length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenByMint': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const token = await jupiterClient.getToken(tokenMint);

			if (!token) {
				// Try from common tokens
				const commonToken = findTokenByMint(tokenMint, COMMON_TOKENS);
				if (commonToken) {
					return [
						{
							json: {
								...commonToken,
								source: 'constants',
							},
							pairedItem: { item: index },
						},
					];
				}

				throw new NodeOperationError(
					this.getNode(),
					`Token not found: ${tokenMint}`,
					{ itemIndex: index },
				);
			}

			return [
				{
					json: {
						...token,
						source: 'jupiter',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenBySymbol': {
			const tokenSymbol = this.getNodeParameter('tokenSymbol', index) as string;

			// First try common tokens
			const commonToken = findTokenBySymbol(tokenSymbol, COMMON_TOKENS);
			if (commonToken) {
				return [
					{
						json: {
							...commonToken,
							source: 'constants',
						},
						pairedItem: { item: index },
					},
				];
			}

			// Search Jupiter
			const tokens = await jupiterClient.searchTokens(tokenSymbol);
			const exactMatch = tokens.find(
				(t: { symbol: string }) => t.symbol.toLowerCase() === tokenSymbol.toLowerCase(),
			);

			if (exactMatch) {
				return [
					{
						json: {
							...exactMatch,
							source: 'jupiter',
						},
						pairedItem: { item: index },
					},
				];
			}

			throw new NodeOperationError(
				this.getNode(),
				`Token not found: ${tokenSymbol}`,
				{ itemIndex: index },
			);
		}

		case 'getTokenPrice': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const price = await jupiterClient.getPrice([tokenMint]);

			return [
				{
					json: {
						mint: tokenMint,
						price: price[tokenMint],
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenPrices': {
			const tokenMintsStr = this.getNodeParameter('tokenMints', index) as string;

			const tokenMints = tokenMintsStr.split(',').map((m) => m.trim());

			if (tokenMints.length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'At least one token mint is required',
					{ itemIndex: index },
				);
			}

			const prices = await jupiterClient.getPrice(tokenMints);

			const results = tokenMints.map((mint) => ({
				mint,
				price: prices[mint] || null,
			}));

			return [
				{
					json: {
						prices: results,
						total: tokenMints.length,
						found: results.filter((r) => r.price !== null).length,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenLogo': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const token = await jupiterClient.getToken(tokenMint);

			return [
				{
					json: {
						mint: tokenMint,
						logoURI: token?.logoURI || null,
						name: token?.name,
						symbol: token?.symbol,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getTokenTags': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const token = await jupiterClient.getToken(tokenMint);

			// Determine tags
			const tags: string[] = [];
			if (isStablecoin(tokenMint)) tags.push('stablecoin');
			if (isWrappedSol(tokenMint)) tags.push('wrapped-sol');
			if (token?.tags) tags.push(...token.tags);

			// Check if it's in common lists
			if (Object.values(STABLECOINS).some((t) => t.mint === tokenMint)) {
				tags.push('verified-stablecoin');
			}
			if (Object.values(MAJOR_TOKENS).some((t) => t.mint === tokenMint)) {
				tags.push('major-token');
			}

			return [
				{
					json: {
						mint: tokenMint,
						tags: [...new Set(tags)],
						name: token?.name,
						symbol: token?.symbol,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'validateToken': {
			const tokenMint = this.getNodeParameter('tokenMint', index) as string;

			const isValid = isValidMint(tokenMint);

			if (!isValid) {
				return [
					{
						json: {
							mint: tokenMint,
							valid: false,
							reason: 'Invalid mint address format',
						},
						pairedItem: { item: index },
					},
				];
			}

			// Try to get token info
			const token = await jupiterClient.getToken(tokenMint);
			const strictTokens = await jupiterClient.getStrictTokenList();
			const isVerified = strictTokens.some((t: { address: string }) => t.address === tokenMint);

			return [
				{
					json: {
						mint: tokenMint,
						valid: true,
						found: !!token,
						verified: isVerified,
						name: token?.name,
						symbol: token?.symbol,
						decimals: token?.decimals,
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getNewTokens': {
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const tokens = await jupiterClient.getTokenList();

			// Sort by some heuristic for "new" tokens
			// In practice, Jupiter doesn't provide a creation date, so we use the end of the list
			const limit = (options.limit as number) || 50;
			const newTokens = tokens.slice(-limit).reverse();

			return [
				{
					json: {
						tokens: newTokens,
						count: newTokens.length,
						note: 'Tokens sorted by listing order (newest last in Jupiter list)',
					},
					pairedItem: { item: index },
				},
			];
		}

		case 'getVerifiedTokens': {
			const options = this.getNodeParameter('options', index, {}) as Record<string, unknown>;

			const tokens = await jupiterClient.getStrictTokenList();

			const limit = (options.limit as number) || 100;
			const limitedTokens = tokens.slice(0, limit);

			return [
				{
					json: {
						tokens: limitedTokens,
						total: tokens.length,
						returned: limitedTokens.length,
						source: 'Jupiter Strict List',
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
