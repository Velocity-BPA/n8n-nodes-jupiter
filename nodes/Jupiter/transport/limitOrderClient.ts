/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Limit Order Client
 * Client for interacting with Jupiter Limit Order API
 */

import axios, { AxiosInstance } from 'axios';
import { IExecuteFunctions } from 'n8n-workflow';
import { BASE_URLS, LIMIT_ORDER_ENDPOINTS } from '../constants/endpoints';

/**
 * Limit Order Types
 */
export interface LimitOrder {
  publicKey: string;
  account: {
    maker: string;
    inputMint: string;
    outputMint: string;
    oriMakingAmount: string;
    oriTakingAmount: string;
    makingAmount: string;
    takingAmount: string;
    borrowMakingAmount: string;
    expiredAt: number | null;
    createdAt: string;
    updatedAt: string;
    feeAccount: string;
    bump: number;
  };
}

export interface CreateOrderParams {
  inputMint: string;
  outputMint: string;
  maker: string;
  payer: string;
  makingAmount: string;
  takingAmount: string;
  expiredAt?: number;
  feeBps?: number;
}

export interface CreateOrderResponse {
  order: string;
  tx: string;
}

export interface CancelOrderParams {
  owner: string;
  orders: string[];
  feePayer?: string;
}

export interface CancelOrderResponse {
  txs: string[];
}

export interface OrderHistoryParams {
  wallet: string;
  page?: number;
  take?: number;
}

/**
 * Limit Order Client Class
 */
export class LimitOrderClient {
  private api: AxiosInstance;

  constructor(baseUrl = BASE_URLS.LIMIT_ORDER, apiKey?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers,
    });
  }

  /**
   * Create a limit order
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    const response = await this.api.post(LIMIT_ORDER_ENDPOINTS.CREATE, {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      maker: params.maker,
      payer: params.payer,
      makingAmount: params.makingAmount,
      takingAmount: params.takingAmount,
      expiredAt: params.expiredAt,
      feeBps: params.feeBps,
    });
    return response.data;
  }

  /**
   * Cancel orders
   */
  async cancelOrders(params: CancelOrderParams): Promise<CancelOrderResponse> {
    const response = await this.api.post(LIMIT_ORDER_ENDPOINTS.CANCEL, {
      owner: params.owner,
      orders: params.orders,
      feePayer: params.feePayer,
    });
    return response.data;
  }

  /**
   * Get open orders for a wallet
   */
  async getOpenOrders(wallet: string): Promise<LimitOrder[]> {
    const response = await this.api.get(LIMIT_ORDER_ENDPOINTS.OPEN_ORDERS, {
      params: { wallet },
    });
    return response.data;
  }

  /**
   * Get orders by wallet
   */
  async getOrders(wallet: string): Promise<LimitOrder[]> {
    const response = await this.api.get(LIMIT_ORDER_ENDPOINTS.ORDERS, {
      params: { wallet },
    });
    return response.data;
  }

  /**
   * Get order history
   */
  async getOrderHistory(params: OrderHistoryParams): Promise<{
    orders: LimitOrder[];
    total: number;
    page: number;
  }> {
    const response = await this.api.get(LIMIT_ORDER_ENDPOINTS.HISTORY, {
      params: {
        wallet: params.wallet,
        page: params.page || 1,
        take: params.take || 20,
      },
    });
    return response.data;
  }

  /**
   * Get trade history
   */
  async getTradeHistory(wallet: string): Promise<any[]> {
    const response = await this.api.get(LIMIT_ORDER_ENDPOINTS.TRADE_HISTORY, {
      params: { wallet },
    });
    return response.data;
  }

  /**
   * Get order by public key
   */
  async getOrder(publicKey: string): Promise<LimitOrder | null> {
    try {
      const orders = await this.getOrders(publicKey);
      return orders.find((o) => o.publicKey === publicKey) || null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate order price
   */
  calculatePrice(
    makingAmount: string,
    takingAmount: string,
    inputDecimals: number,
    outputDecimals: number,
  ): number {
    const making = Number(makingAmount) / 10 ** inputDecimals;
    const taking = Number(takingAmount) / 10 ** outputDecimals;
    return taking / making;
  }

  /**
   * Calculate fill percentage
   */
  calculateFillPercentage(order: LimitOrder): number {
    const oriMaking = BigInt(order.account.oriMakingAmount);
    const currentMaking = BigInt(order.account.makingAmount);
    
    if (oriMaking === BigInt(0)) return 0;
    
    const filled = oriMaking - currentMaking;
    return Number((filled * BigInt(10000)) / oriMaking) / 100;
  }
}

/**
 * Create limit order client from n8n context
 */
export async function createLimitOrderClient(
  context: IExecuteFunctions,
): Promise<LimitOrderClient> {
  try {
    const credentials = await context.getCredentials('jupiterApi');
    return new LimitOrderClient(
      BASE_URLS.LIMIT_ORDER,
      credentials.apiKey as string,
    );
  } catch {
    return new LimitOrderClient();
  }
}

export default LimitOrderClient;
