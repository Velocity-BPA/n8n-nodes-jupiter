/**
 * Jupiter Perpetuals Client
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import axios, { AxiosInstance } from 'axios';
import { IExecuteFunctions } from 'n8n-workflow';
import { JUPITER_ENDPOINTS } from '../constants/networks';

export interface PerpMarket {
	marketId: string;
	name: string;
	symbol: string;
	baseAsset: string;
	quoteAsset: string;
	maxLeverage: number;
	minPositionSize: number;
	maxPositionSize: number;
	tickSize: number;
	lotSize: number;
	fundingRate: number;
	nextFundingTime: number;
	openInterest: number;
	openInterestUsd: number;
	volume24h: number;
	volumeUsd24h: number;
	markPrice: number;
	indexPrice: number;
	isActive: boolean;
}

export interface Position {
	positionId: string;
	marketId: string;
	owner: string;
	side: 'long' | 'short';
	size: number;
	sizeUsd: number;
	collateral: number;
	collateralUsd: number;
	entryPrice: number;
	markPrice: number;
	leverage: number;
	liquidationPrice: number;
	unrealizedPnl: number;
	unrealizedPnlPercent: number;
	realizedPnl: number;
	fundingPayments: number;
	createdAt: number;
	updatedAt: number;
	stopLoss?: number;
	takeProfit?: number;
}

export interface OpenPositionParams {
	marketId: string;
	side: 'long' | 'short';
	size: number;
	collateral: number;
	leverage?: number;
	stopLoss?: number;
	takeProfit?: number;
	reduceOnly?: boolean;
}

export interface ClosePositionParams {
	positionId: string;
	size?: number; // Partial close if specified
}

export interface ModifyPositionParams {
	positionId: string;
	collateralDelta?: number; // Positive to add, negative to remove
	stopLoss?: number | null;
	takeProfit?: number | null;
}

export interface FundingRate {
	marketId: string;
	rate: number;
	timestamp: number;
	nextTimestamp: number;
	longPayment: number;
	shortPayment: number;
}

export interface OpenInterest {
	marketId: string;
	longOpenInterest: number;
	shortOpenInterest: number;
	totalOpenInterest: number;
	longOpenInterestUsd: number;
	shortOpenInterestUsd: number;
	totalOpenInterestUsd: number;
}

export interface PerpStats {
	totalVolume24h: number;
	totalVolumeAllTime: number;
	totalTrades24h: number;
	totalTradesAllTime: number;
	totalOpenInterest: number;
	totalLiquidations24h: number;
	totalFees24h: number;
	activeTradersCount: number;
}

export interface TradeHistory {
	tradeId: string;
	positionId: string;
	marketId: string;
	side: 'long' | 'short';
	type: 'open' | 'close' | 'increase' | 'decrease' | 'liquidation';
	size: number;
	sizeUsd: number;
	price: number;
	fee: number;
	pnl?: number;
	timestamp: number;
	txSignature: string;
}

export interface LiquidationInfo {
	positionId: string;
	marketId: string;
	liquidationPrice: number;
	currentPrice: number;
	distancePercent: number;
	isAtRisk: boolean;
	marginRatio: number;
	maintenanceMargin: number;
}

/**
 * Jupiter Perpetuals Client for trading perpetual futures on Solana
 */
export class PerpClient {
	private client: AxiosInstance;

	constructor(apiEndpoint?: string) {
		const baseURL = apiEndpoint || JUPITER_ENDPOINTS.PERP_API;

		this.client = axios.create({
			baseURL,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Add response interceptor for error handling
		this.client.interceptors.response.use(
			(response) => response,
			async (error) => {
				if (error.response?.status === 429) {
					// Rate limited - wait and retry
					const retryAfter = error.response.headers['retry-after'] || 1;
					await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
					return this.client.request(error.config);
				}
				throw error;
			},
		);
	}

	/**
	 * Get all perpetual markets
	 */
	async getMarkets(): Promise<PerpMarket[]> {
		const response = await this.client.get('/markets');
		return response.data;
	}

	/**
	 * Get market information by ID
	 */
	async getMarket(marketId: string): Promise<PerpMarket> {
		const response = await this.client.get(`/markets/${marketId}`);
		return response.data;
	}

	/**
	 * Get market by trading pair
	 */
	async getMarketByPair(baseAsset: string, quoteAsset: string): Promise<PerpMarket | null> {
		const markets = await this.getMarkets();
		return (
			markets.find(
				(m) =>
					m.baseAsset.toLowerCase() === baseAsset.toLowerCase() &&
					m.quoteAsset.toLowerCase() === quoteAsset.toLowerCase(),
			) || null
		);
	}

	/**
	 * Get position by ID
	 */
	async getPosition(positionId: string): Promise<Position> {
		const response = await this.client.get(`/positions/${positionId}`);
		return response.data;
	}

	/**
	 * Get all positions for a wallet
	 */
	async getPositions(walletAddress: string, marketId?: string): Promise<Position[]> {
		const params: Record<string, string> = { wallet: walletAddress };
		if (marketId) {
			params.marketId = marketId;
		}
		const response = await this.client.get('/positions', { params });
		return response.data;
	}

	/**
	 * Get open positions for a wallet
	 */
	async getOpenPositions(walletAddress: string): Promise<Position[]> {
		const positions = await this.getPositions(walletAddress);
		return positions.filter((p) => p.size > 0);
	}

	/**
	 * Create transaction to open a new position
	 */
	async createOpenPositionTx(
		params: OpenPositionParams,
		walletAddress: string,
	): Promise<{ transaction: string; positionId: string }> {
		const response = await this.client.post('/positions/open', {
			...params,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to close a position
	 */
	async createClosePositionTx(
		params: ClosePositionParams,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/close', {
			...params,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to increase position size
	 */
	async createIncreasePositionTx(
		positionId: string,
		sizeIncrease: number,
		collateralIncrease: number,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/increase', {
			positionId,
			sizeIncrease,
			collateralIncrease,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to decrease position size
	 */
	async createDecreasePositionTx(
		positionId: string,
		sizeDecrease: number,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/decrease', {
			positionId,
			sizeDecrease,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to add collateral
	 */
	async createAddCollateralTx(
		positionId: string,
		amount: number,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/add-collateral', {
			positionId,
			amount,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to remove collateral
	 */
	async createRemoveCollateralTx(
		positionId: string,
		amount: number,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/remove-collateral', {
			positionId,
			amount,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to set stop loss
	 */
	async createSetStopLossTx(
		positionId: string,
		stopLossPrice: number | null,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/set-stop-loss', {
			positionId,
			stopLossPrice,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Create transaction to set take profit
	 */
	async createSetTakeProfitTx(
		positionId: string,
		takeProfitPrice: number | null,
		walletAddress: string,
	): Promise<{ transaction: string }> {
		const response = await this.client.post('/positions/set-take-profit', {
			positionId,
			takeProfitPrice,
			wallet: walletAddress,
		});
		return response.data;
	}

	/**
	 * Get current funding rate for a market
	 */
	async getFundingRate(marketId: string): Promise<FundingRate> {
		const response = await this.client.get(`/markets/${marketId}/funding-rate`);
		return response.data;
	}

	/**
	 * Get funding rate history
	 */
	async getFundingRateHistory(
		marketId: string,
		limit: number = 100,
	): Promise<FundingRate[]> {
		const response = await this.client.get(`/markets/${marketId}/funding-rate/history`, {
			params: { limit },
		});
		return response.data;
	}

	/**
	 * Get open interest for a market
	 */
	async getOpenInterest(marketId: string): Promise<OpenInterest> {
		const response = await this.client.get(`/markets/${marketId}/open-interest`);
		return response.data;
	}

	/**
	 * Calculate liquidation price for a position
	 */
	async getLiquidationPrice(positionId: string): Promise<LiquidationInfo> {
		const response = await this.client.get(`/positions/${positionId}/liquidation`);
		return response.data;
	}

	/**
	 * Calculate PnL for a position
	 */
	calculatePnl(position: Position): {
		unrealizedPnl: number;
		unrealizedPnlPercent: number;
		totalPnl: number;
	} {
		const priceDiff =
			position.side === 'long'
				? position.markPrice - position.entryPrice
				: position.entryPrice - position.markPrice;

		const unrealizedPnl = priceDiff * position.size;
		const unrealizedPnlPercent = (unrealizedPnl / position.collateralUsd) * 100;
		const totalPnl = unrealizedPnl + position.realizedPnl + position.fundingPayments;

		return {
			unrealizedPnl,
			unrealizedPnlPercent,
			totalPnl,
		};
	}

	// Alias for calculatePnl (for backward compatibility)
	calculatePnL = this.calculatePnl.bind(this);

	// Alias for getLiquidationPrice
	calculateLiquidationPrice = this.getLiquidationPrice.bind(this);

	// Convenience methods that wrap the transaction creation methods
	async openPosition(params: OpenPositionParams, walletAddress: string): Promise<{ transaction: string; positionId: string }> {
		return this.createOpenPositionTx(params, walletAddress);
	}

	async closePosition(params: ClosePositionParams, walletAddress: string): Promise<{ transaction: string }> {
		return this.createClosePositionTx(params, walletAddress);
	}

	async increasePosition(positionId: string, sizeIncrease: number, collateralIncrease: number, walletAddress: string): Promise<{ transaction: string }> {
		return this.createIncreasePositionTx(positionId, sizeIncrease, collateralIncrease, walletAddress);
	}

	async decreasePosition(positionId: string, sizeDecrease: number, walletAddress: string): Promise<{ transaction: string }> {
		return this.createDecreasePositionTx(positionId, sizeDecrease, walletAddress);
	}

	async addCollateral(positionId: string, amount: number, walletAddress: string): Promise<{ transaction: string }> {
		return this.createAddCollateralTx(positionId, amount, walletAddress);
	}

	async removeCollateral(positionId: string, amount: number, walletAddress: string): Promise<{ transaction: string }> {
		return this.createRemoveCollateralTx(positionId, amount, walletAddress);
	}

	async setStopLoss(positionId: string, stopLossPrice: number | null, walletAddress: string): Promise<{ transaction: string }> {
		return this.createSetStopLossTx(positionId, stopLossPrice, walletAddress);
	}

	async setTakeProfit(positionId: string, takeProfitPrice: number | null, walletAddress: string): Promise<{ transaction: string }> {
		return this.createSetTakeProfitTx(positionId, takeProfitPrice, walletAddress);
	}

	/**
	 * Get trade history for a wallet
	 */
	async getTradeHistory(
		walletAddress: string,
		marketId?: string,
		limit: number = 100,
	): Promise<TradeHistory[]> {
		const params: Record<string, string | number> = {
			wallet: walletAddress,
			limit,
		};
		if (marketId) {
			params.marketId = marketId;
		}
		const response = await this.client.get('/trades/history', { params });
		return response.data;
	}

	/**
	 * Get perpetuals statistics
	 */
	async getStats(): Promise<PerpStats> {
		const response = await this.client.get('/stats');
		return response.data;
	}

	/**
	 * Get market statistics
	 */
	async getMarketStats(marketId: string): Promise<{
		volume24h: number;
		trades24h: number;
		openInterest: number;
		fundingRate: number;
		highPrice24h: number;
		lowPrice24h: number;
		priceChange24h: number;
		priceChangePercent24h: number;
	}> {
		const response = await this.client.get(`/markets/${marketId}/stats`);
		return response.data;
	}

	/**
	 * Check if a market is available for trading
	 */
	async isMarketActive(marketId: string): Promise<boolean> {
		const market = await this.getMarket(marketId);
		return market.isActive;
	}

	/**
	 * Validate position parameters
	 */
	validatePositionParams(
		params: OpenPositionParams,
		market: PerpMarket,
	): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (params.size < market.minPositionSize) {
			errors.push(
				`Size ${params.size} is below minimum ${market.minPositionSize}`,
			);
		}

		if (params.size > market.maxPositionSize) {
			errors.push(
				`Size ${params.size} exceeds maximum ${market.maxPositionSize}`,
			);
		}

		if (params.leverage && params.leverage > market.maxLeverage) {
			errors.push(
				`Leverage ${params.leverage}x exceeds maximum ${market.maxLeverage}x`,
			);
		}

		if (params.leverage && params.leverage < 1) {
			errors.push('Leverage must be at least 1x');
		}

		if (params.collateral <= 0) {
			errors.push('Collateral must be greater than 0');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Estimate fees for opening a position
	 */
	async estimateFees(
		marketId: string,
		size: number,
		leverage: number,
	): Promise<{
		openingFee: number;
		closingFee: number;
		estimatedFundingFee: number;
		totalEstimatedFee: number;
	}> {
		const response = await this.client.get(`/markets/${marketId}/estimate-fees`, {
			params: { size, leverage },
		});
		return response.data;
	}

	/**
	 * Get user's PnL summary
	 */
	async getUserPnlSummary(walletAddress: string): Promise<{
		totalRealizedPnl: number;
		totalUnrealizedPnl: number;
		totalFundingPaid: number;
		totalFundingReceived: number;
		netPnl: number;
		winRate: number;
		totalTrades: number;
	}> {
		const response = await this.client.get('/users/pnl-summary', {
			params: { wallet: walletAddress },
		});
		return response.data;
	}
}

/**
 * Create a perpetuals client from n8n execution context
 */
export async function createPerpClient(
	context: IExecuteFunctions,
): Promise<PerpClient> {
	const credentials = await context.getCredentials('jupiterApi');
	const endpoint = credentials.perpEndpoint as string | undefined;
	return new PerpClient(endpoint);
}
