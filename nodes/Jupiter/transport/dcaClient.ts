/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * DCA (Dollar Cost Averaging) Client
 * Client for interacting with Jupiter DCA API
 */

import axios, { AxiosInstance } from 'axios';
import { IExecuteFunctions } from 'n8n-workflow';
import { BASE_URLS, DCA_ENDPOINTS } from '../constants/endpoints';

/**
 * DCA Order Types
 */
export interface DCAOrder {
  publicKey: string;
  user: string;
  inputMint: string;
  outputMint: string;
  inDeposited: string;
  inWithdrawn: string;
  outWithdrawn: string;
  inUsed: string;
  outReceived: string;
  inAmountPerCycle: string;
  cycleFrequency: number;
  nextCycleAt: number;
  minOutAmount: string;
  maxOutAmount: string;
  createdAt: number;
  idx: number;
  bump: number;
}

export interface CreateDCAParams {
  user: string;
  payer: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  inAmountPerCycle: string;
  cycleSecondsApart: number;
  minOutAmountPerCycle?: string;
  maxOutAmountPerCycle?: string;
  startAt?: number;
}

export interface CreateDCAResponse {
  dcaPubkey: string;
  tx: string;
}

export interface DCAFill {
  dcaPubkey: string;
  inAmount: string;
  outAmount: string;
  confirmedAt: number;
  txId: string;
}

export interface DCAStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalVolumeUsd: number;
}

/**
 * DCA Client Class
 */
export class DCAClient {
  private api: AxiosInstance;

  constructor(baseUrl = BASE_URLS.DCA, apiKey?: string) {
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
   * Create a DCA order
   */
  async createDCA(params: CreateDCAParams): Promise<CreateDCAResponse> {
    const response = await this.api.post(DCA_ENDPOINTS.CREATE, {
      user: params.user,
      payer: params.payer,
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: params.inAmount,
      inAmountPerCycle: params.inAmountPerCycle,
      cycleSecondsApart: params.cycleSecondsApart,
      minOutAmountPerCycle: params.minOutAmountPerCycle || '0',
      maxOutAmountPerCycle: params.maxOutAmountPerCycle || '0',
      startAt: params.startAt,
    });
    return response.data;
  }

  /**
   * Get DCA order by public key
   */
  async getDCA(publicKey: string): Promise<DCAOrder | null> {
    try {
      const response = await this.api.get(`${DCA_ENDPOINTS.GET}/${publicKey}`);
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Get user's DCA orders
   */
  async getUserDCAs(userWallet: string): Promise<DCAOrder[]> {
    const response = await this.api.get(DCA_ENDPOINTS.USER_DCAS, {
      params: { user: userWallet },
    });
    return response.data;
  }

  /**
   * Get active DCAs for a user
   */
  async getActiveDCAs(userWallet: string): Promise<DCAOrder[]> {
    const dcas = await this.getUserDCAs(userWallet);
    const now = Math.floor(Date.now() / 1000);
    
    return dcas.filter((dca) => {
      const inRemaining = BigInt(dca.inDeposited) - BigInt(dca.inUsed) - BigInt(dca.inWithdrawn);
      return inRemaining > BigInt(0) && dca.nextCycleAt > 0;
    });
  }

  /**
   * Cancel a DCA order
   */
  async cancelDCA(
    dcaPubkey: string,
    user: string,
  ): Promise<{ tx: string }> {
    const response = await this.api.post(DCA_ENDPOINTS.CANCEL, {
      dcaPubkey,
      user,
    });
    return response.data;
  }

  /**
   * Get DCA fills (executed swaps)
   */
  async getDCAFills(dcaPubkey: string): Promise<DCAFill[]> {
    const response = await this.api.get(DCA_ENDPOINTS.FILLS, {
      params: { dcaPubkey },
    });
    return response.data;
  }

  /**
   * Pause a DCA order
   */
  async pauseDCA(
    dcaPubkey: string,
    user: string,
  ): Promise<{ tx: string }> {
    const response = await this.api.post(DCA_ENDPOINTS.PAUSE, {
      dcaPubkey,
      user,
    });
    return response.data;
  }

  /**
   * Resume a paused DCA order
   */
  async resumeDCA(
    dcaPubkey: string,
    user: string,
  ): Promise<{ tx: string }> {
    const response = await this.api.post(DCA_ENDPOINTS.RESUME, {
      dcaPubkey,
      user,
    });
    return response.data;
  }

  /**
   * Calculate DCA progress
   */
  calculateProgress(dca: DCAOrder): {
    percentComplete: number;
    cyclesCompleted: number;
    estimatedCyclesRemaining: number;
    amountUsed: string;
    amountRemaining: string;
  } {
    const inDeposited = BigInt(dca.inDeposited);
    const inUsed = BigInt(dca.inUsed);
    const inWithdrawn = BigInt(dca.inWithdrawn);
    const inAmountPerCycle = BigInt(dca.inAmountPerCycle);
    
    const amountRemaining = inDeposited - inUsed - inWithdrawn;
    const percentComplete = inDeposited > BigInt(0)
      ? Number((inUsed * BigInt(10000)) / inDeposited) / 100
      : 0;
    
    const cyclesCompleted = inAmountPerCycle > BigInt(0)
      ? Number(inUsed / inAmountPerCycle)
      : 0;
    
    const estimatedCyclesRemaining = inAmountPerCycle > BigInt(0)
      ? Number(amountRemaining / inAmountPerCycle)
      : 0;
    
    return {
      percentComplete,
      cyclesCompleted,
      estimatedCyclesRemaining,
      amountUsed: inUsed.toString(),
      amountRemaining: amountRemaining.toString(),
    };
  }

  /**
   * Calculate average execution price
   */
  calculateAveragePrice(
    dca: DCAOrder,
    inputDecimals: number,
    outputDecimals: number,
  ): number {
    const inUsed = Number(dca.inUsed) / 10 ** inputDecimals;
    const outReceived = Number(dca.outReceived) / 10 ** outputDecimals;
    
    if (inUsed === 0) return 0;
    return outReceived / inUsed;
  }

  /**
   * Get DCA status
   */
  getDCAStatus(dca: DCAOrder): 'active' | 'paused' | 'completed' | 'cancelled' {
    const inDeposited = BigInt(dca.inDeposited);
    const inUsed = BigInt(dca.inUsed);
    const inWithdrawn = BigInt(dca.inWithdrawn);
    const remaining = inDeposited - inUsed - inWithdrawn;
    
    if (inWithdrawn > BigInt(0) && remaining === BigInt(0)) {
      return 'cancelled';
    }
    
    if (remaining === BigInt(0) && inUsed > BigInt(0)) {
      return 'completed';
    }
    
    if (dca.nextCycleAt === 0) {
      return 'paused';
    }
    
    return 'active';
  }
}

/**
 * Create DCA client from n8n context
 */
export async function createDCAClient(
  context: IExecuteFunctions,
): Promise<DCAClient> {
  try {
    const credentials = await context.getCredentials('jupiterApi');
    return new DCAClient(
      BASE_URLS.DCA,
      credentials.apiKey as string,
    );
  } catch {
    return new DCAClient();
  }
}

export default DCAClient;
