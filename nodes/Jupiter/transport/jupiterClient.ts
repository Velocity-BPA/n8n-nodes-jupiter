/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Jupiter API Client
 * Main client for interacting with Jupiter V6 API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';
import { BASE_URLS, QUOTE_ENDPOINTS, PRICE_ENDPOINTS, TOKEN_ENDPOINTS } from '../constants/endpoints';
import { JupiterQuote, QuoteParams, buildQuoteQueryParams, validateQuoteParams } from '../utils/quoteUtils';

/**
 * Jupiter API response types
 */
export interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  [key: string]: unknown;
}

export interface SwapInstructionsResponse {
  tokenLedgerInstruction?: unknown;
  computeBudgetInstructions?: unknown[];
  setupInstructions?: unknown[];
  swapInstruction: unknown;
  cleanupInstruction?: unknown;
  addressLookupTableAddresses?: string[];
  [key: string]: unknown;
}

export interface TokenListResponse {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PriceResponse {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timeTaken?: number;
  [key: string]: unknown;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  [key: string]: unknown;
}

/**
 * Jupiter Client Configuration
 */
export interface JupiterClientConfig {
  apiEndpoint?: string;
  priceEndpoint?: string;
  tokenEndpoint?: string;
  apiKey?: string;
  timeout?: number;
  retryOnRateLimit?: boolean;
  maxRetries?: number;
}

/**
 * Jupiter API Client Class
 */
export class JupiterClient {
  private quoteApi: AxiosInstance;
  private priceApi: AxiosInstance;
  private tokenApi: AxiosInstance;
  private config: JupiterClientConfig;

  constructor(config: JupiterClientConfig = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || BASE_URLS.QUOTE,
      priceEndpoint: config.priceEndpoint || BASE_URLS.PRICE,
      tokenEndpoint: config.tokenEndpoint || BASE_URLS.TOKEN,
      timeout: config.timeout || 30000,
      retryOnRateLimit: config.retryOnRateLimit !== false,
      maxRetries: config.maxRetries || 3,
      apiKey: config.apiKey,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    this.quoteApi = axios.create({
      baseURL: this.config.apiEndpoint,
      timeout: this.config.timeout,
      headers,
    });

    this.priceApi = axios.create({
      baseURL: this.config.priceEndpoint,
      timeout: this.config.timeout,
      headers,
    });

    this.tokenApi = axios.create({
      baseURL: this.config.tokenEndpoint,
      timeout: this.config.timeout,
      headers,
    });

    this.setupRetryInterceptor(this.quoteApi);
    this.setupRetryInterceptor(this.priceApi);
    this.setupRetryInterceptor(this.tokenApi);
  }

  private setupRetryInterceptor(api: AxiosInstance): void {
    api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as any;
        
        if (
          error.response?.status === 429 &&
          this.config.retryOnRateLimit &&
          (!config._retryCount || config._retryCount < this.config.maxRetries!)
        ) {
          config._retryCount = (config._retryCount || 0) + 1;
          const delay = Math.pow(2, config._retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return api.request(config);
        }
        
        return Promise.reject(error);
      },
    );
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as Record<string, unknown>;
      
      if (responseData?.message) {
        throw new Error(`Jupiter API Error: ${responseData.message}`);
      }
      
      if (axiosError.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (axiosError.response?.status === 400) {
        throw new Error(`Invalid request: ${JSON.stringify(responseData)}`);
      }
      
      throw new Error(`Jupiter API Error: ${axiosError.message}`);
    }
    
    throw error;
  }

  async getQuote(params: QuoteParams): Promise<JupiterQuote> {
    const validation = validateQuoteParams(params);
    if (!validation.valid) {
      throw new Error(`Invalid quote parameters: ${validation.errors.join(', ')}`);
    }

    try {
      const queryString = buildQuoteQueryParams(params);
      const response = await this.quoteApi.get(`${QUOTE_ENDPOINTS.QUOTE}?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSwapTransaction(
    quote: JupiterQuote,
    userPublicKey: string,
    options: {
      wrapAndUnwrapSol?: boolean;
      feeAccount?: string;
      trackingAccount?: string;
      prioritizationFeeLamports?: number | 'auto';
      asLegacyTransaction?: boolean;
      destinationTokenAccount?: string;
      dynamicComputeUnitLimit?: boolean;
      skipUserAccountsRpcCalls?: boolean;
    } = {},
  ): Promise<SwapResponse> {
    try {
      const response = await this.quoteApi.post(QUOTE_ENDPOINTS.SWAP, {
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: options.wrapAndUnwrapSol ?? true,
        feeAccount: options.feeAccount,
        trackingAccount: options.trackingAccount,
        prioritizationFeeLamports: options.prioritizationFeeLamports,
        asLegacyTransaction: options.asLegacyTransaction ?? false,
        destinationTokenAccount: options.destinationTokenAccount,
        dynamicComputeUnitLimit: options.dynamicComputeUnitLimit ?? true,
        skipUserAccountsRpcCalls: options.skipUserAccountsRpcCalls ?? false,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSwapInstructions(
    quote: JupiterQuote,
    userPublicKey: string,
    options: {
      wrapAndUnwrapSol?: boolean;
      feeAccount?: string;
      destinationTokenAccount?: string;
    } = {},
  ): Promise<SwapInstructionsResponse> {
    try {
      const response = await this.quoteApi.post(QUOTE_ENDPOINTS.SWAP_INSTRUCTIONS, {
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: options.wrapAndUnwrapSol ?? true,
        feeAccount: options.feeAccount,
        destinationTokenAccount: options.destinationTokenAccount,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPrice(ids: string | string[], vsToken = 'USDC'): Promise<Record<string, PriceResponse>> {
    try {
      const idsParam = Array.isArray(ids) ? ids.join(',') : ids;
      const response = await this.priceApi.get(PRICE_ENDPOINTS.PRICE, {
        params: { ids: idsParam, vsToken },
      });
      return response.data.data || response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTokenList(onlyStrict?: boolean): Promise<TokenListResponse[]> {
    try {
      const endpoint = onlyStrict ? TOKEN_ENDPOINTS.STRICT : TOKEN_ENDPOINTS.ALL;
      const response = await this.tokenApi.get(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getStrictTokenList(): Promise<TokenListResponse[]> {
    return this.getTokenList(true);
  }

  async searchTokens(query: string): Promise<TokenListResponse[]> {
    try {
      const response = await this.tokenApi.get(TOKEN_ENDPOINTS.SEARCH, { params: { query } });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getToken(mint: string): Promise<TokenListResponse | null> {
    try {
      const response = await this.tokenApi.get(`${TOKEN_ENDPOINTS.TOKEN}/${mint}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.handleError(error);
    }
  }

  async getProgramIdToLabel(): Promise<Record<string, string>> {
    try {
      const response = await this.quoteApi.get(QUOTE_ENDPOINTS.PROGRAM_ID_TO_LABEL);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getIndexedRouteMap(): Promise<{ mintKeys: string[]; indexedRouteMap: Record<number, number[]> }> {
    try {
      const response = await this.quoteApi.get(QUOTE_ENDPOINTS.INDEXED_ROUTE_MAP);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // Governance methods
  async getProposals(_options?: { status?: string; limit?: number }): Promise<Record<string, unknown>[]> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async getProposal(_proposalId: string): Promise<Record<string, unknown>> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async vote(_proposalId: string, _voteChoice: string, _walletAddress: string): Promise<Record<string, unknown>> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async getVotingPower(_walletAddress: string): Promise<Record<string, unknown>> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async getVoteHistory(_walletAddress: string): Promise<Record<string, unknown>[]> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async getGovernanceStats(): Promise<Record<string, unknown>> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  async delegateVotes(_delegateAddress: string, _walletAddress: string): Promise<Record<string, unknown>> {
    throw new Error('Governance API not available - use Jupiter governance portal');
  }

  // Airdrop methods
  async checkAirdropEligibility(_walletAddress: string, _round?: string): Promise<Record<string, unknown>> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  async getAirdropAmount(_walletAddress: string, _round?: string): Promise<Record<string, unknown>> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  async claimAirdrop(_walletAddress: string, _round?: string): Promise<Record<string, unknown>> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  async getAirdropStatus(_walletAddress: string, _round?: string): Promise<Record<string, unknown>> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  async getAirdropHistory(_walletAddress: string): Promise<Record<string, unknown>[]> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  async getAirdropRoundInfo(_round: string): Promise<Record<string, unknown>> {
    throw new Error('Airdrop API not available - check jup.ag for airdrop status');
  }

  // Stats methods
  async getProtocolStats(): Promise<Record<string, unknown>> {
    try {
      const response = await this.quoteApi.get('/stats');
      return response.data;
    } catch {
      return { volume24h: 0, swaps24h: 0, users24h: 0, message: 'Stats not available' };
    }
  }

  async getVolumeStats(_timeRange?: string): Promise<Record<string, unknown>> {
    return this.getProtocolStats();
  }

  async getSwapStats(_timeRange?: string): Promise<Record<string, unknown>> {
    return this.getProtocolStats();
  }

  async getUserStats(walletAddress: string): Promise<Record<string, unknown>> {
    return { walletAddress, swaps: 0, volume: 0, message: 'User stats not available' };
  }

  async getProtocolRevenue(_timeRange?: string): Promise<Record<string, unknown>> {
    return { revenue: 0, message: 'Revenue stats not available' };
  }

  async getDailyStats(_date: string): Promise<Record<string, unknown>> {
    return this.getProtocolStats();
  }

  async getWeeklyStats(_weekStart: string): Promise<Record<string, unknown>> {
    return this.getProtocolStats();
  }

  async getMonthlyStats(_month: number, _year: number): Promise<Record<string, unknown>> {
    return this.getProtocolStats();
  }

  async getTopTokens(limit?: number): Promise<Record<string, unknown>[]> {
    const tokens = await this.getTokenList();
    return tokens.slice(0, limit || 10).map(t => ({ ...t }));
  }

  async getTopRoutes(_limit?: number): Promise<Record<string, unknown>[]> {
    return [];
  }

  // Ultra methods
  async getUltraQuote(params: Record<string, unknown>): Promise<any> {
    return this.getQuote(params as unknown as QuoteParams);
  }

  async executeUltraSwap(_quoteData: Record<string, unknown>, _walletAddress: string): Promise<Record<string, unknown>> {
    throw new Error('Ultra swap requires wallet signing');
  }

  async getUltraStatus(orderId: string): Promise<Record<string, unknown>> {
    return { orderId, status: 'unknown', message: 'Ultra status not available' };
  }

  async getUltraTransaction(orderId: string): Promise<Record<string, unknown>> {
    return { orderId, message: 'Ultra transaction not available' };
  }

  // Trigger order methods
  async createTriggerOrder(_params: Record<string, unknown>): Promise<Record<string, unknown>> {
    throw new Error('Trigger orders require wallet signing');
  }

  async getTriggerOrder(orderId: string): Promise<Record<string, unknown>> {
    return { orderId, status: 'unknown' };
  }

  async getTriggerOrders(_walletAddress: string, _options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    return [];
  }

  async cancelTriggerOrder(_orderId: string, _walletAddress: string): Promise<Record<string, unknown>> {
    throw new Error('Trigger order cancellation requires wallet signing');
  }

  async getTriggerOrderStatus(orderId: string): Promise<Record<string, unknown>> {
    return { orderId, status: 'unknown' };
  }

  async updateTriggerOrder(_orderId: string, _params: Record<string, unknown>): Promise<Record<string, unknown>> {
    throw new Error('Trigger order update requires wallet signing');
  }

  async getTriggerEvents(_walletAddress: string, _options?: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    return [];
  }

  // Utility methods
  async getApiHealth(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      const start = Date.now();
      await this.quoteApi.get('/health');
      return { healthy: true, latency: Date.now() - start };
    } catch {
      return { healthy: false };
    }
  }

  async getRateLimitStatus(): Promise<Record<string, unknown>> {
    return { remaining: 100, limit: 100, reset: Date.now() + 60000 };
  }

  async getVersion(): Promise<Record<string, unknown>> {
    return { version: '6', api: 'Jupiter V6' };
  }
}

/**
 * Create Jupiter client from n8n credentials
 */
export async function createJupiterClient(
  context: IExecuteFunctions | ILoadOptionsFunctions,
  credentialType: 'jupiterApi' | 'jupiterNetwork' = 'jupiterApi',
): Promise<JupiterClient> {
  try {
    const credentials = await context.getCredentials(credentialType);
    
    let apiEndpoint = BASE_URLS.QUOTE;
    
    if (credentialType === 'jupiterApi') {
      const endpoint = credentials.apiEndpoint as string;
      apiEndpoint = endpoint === 'custom' 
        ? (credentials.customApiUrl as string)
        : endpoint || BASE_URLS.QUOTE;
    } else if (credentials.jupiterEndpoint) {
      apiEndpoint = credentials.jupiterEndpoint as string;
    }
    
    return new JupiterClient({
      apiEndpoint,
      apiKey: credentials.apiKey as string,
      timeout: (credentials.timeout as number) || 30000,
      retryOnRateLimit: credentials.retryOnRateLimit !== false,
      maxRetries: (credentials.maxRateLimitRetries as number) || 3,
    });
  } catch {
    return new JupiterClient();
  }
}

export { createSolanaClient, SolanaClient } from './solanaClient';
export default JupiterClient;
