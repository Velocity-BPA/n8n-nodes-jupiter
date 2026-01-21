/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Solana Client
 * Client for interacting with Solana blockchain
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SendOptions,
  TransactionSignature,
} from '@solana/web3.js';
import { IExecuteFunctions } from 'n8n-workflow';
import { NETWORKS, DEFAULT_CONFIG, CommitmentLevel } from '../constants/networks';
import {
  parsePrivateKey,
  deserializeTransaction,
  signTransaction,
  sendAndConfirmTransaction,
  getTransactionStatus,
  waitForConfirmation,
  simulateTransaction,
  TransactionResult,
} from '../utils/transactionUtils';

/**
 * Solana Client Configuration
 */
export interface SolanaClientConfig {
  network: 'mainnet' | 'devnet' | 'custom';
  rpcEndpoint?: string;
  wsEndpoint?: string;
  commitment?: CommitmentLevel;
  privateKey?: string;
  skipPreflight?: boolean;
  maxRetries?: number;
}

/**
 * Solana Client Class
 */
export class SolanaClient {
  private connection: Connection;
  private keypair?: Keypair;
  private config: SolanaClientConfig;

  constructor(config: SolanaClientConfig) {
    this.config = {
      network: config.network || 'mainnet',
      commitment: config.commitment || DEFAULT_CONFIG.commitment,
      skipPreflight: config.skipPreflight ?? DEFAULT_CONFIG.skipPreflight,
      maxRetries: config.maxRetries ?? DEFAULT_CONFIG.maxRetries,
      ...config,
    };

    // Get RPC endpoint
    let rpcEndpoint: string;
    if (config.network === 'custom' && config.rpcEndpoint) {
      rpcEndpoint = config.rpcEndpoint;
    } else {
      const networkConfig = NETWORKS[config.network] || NETWORKS.mainnet;
      rpcEndpoint = networkConfig.rpcEndpoint;
    }

    this.connection = new Connection(rpcEndpoint, {
      commitment: this.config.commitment,
      confirmTransactionInitialTimeout: 60000,
    });

    // Parse private key if provided
    if (config.privateKey) {
      try {
        this.keypair = parsePrivateKey(config.privateKey);
      } catch (error) {
        console.warn('Failed to parse private key:', error);
      }
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  getKeypair(): Keypair | undefined {
    return this.keypair;
  }

  getPublicKey(): PublicKey | undefined {
    return this.keypair?.publicKey;
  }

  getWalletAddress(): string | undefined {
    return this.keypair?.publicKey.toBase58();
  }

  hasWallet(): boolean {
    return !!this.keypair;
  }

  async getBalance(address?: string): Promise<number> {
    const pubkey = address 
      ? new PublicKey(address)
      : this.keypair?.publicKey;
    
    if (!pubkey) {
      throw new Error('No address provided and no wallet configured');
    }
    
    return this.connection.getBalance(pubkey);
  }

  async getTokenBalance(walletAddress: string, tokenMint: string): Promise<{ amount: string; decimals: number; uiAmount: number }> {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(tokenMint);
    
    try {
      const tokenAccounts = await this.connection.getTokenAccountsByOwner(wallet, { mint });
      if (tokenAccounts.value.length === 0) {
        return { amount: '0', decimals: 0, uiAmount: 0 };
      }
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
      return {
        amount: balance.value.amount,
        decimals: balance.value.decimals,
        uiAmount: balance.value.uiAmount || 0,
      };
    } catch {
      return { amount: '0', decimals: 0, uiAmount: 0 };
    }
  }

  async getRecentBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
    return this.connection.getLatestBlockhash(this.config.commitment);
  }

  signTransaction(transaction: VersionedTransaction | Transaction): VersionedTransaction | Transaction {
    if (!this.keypair) {
      throw new Error('No wallet configured for signing');
    }
    return signTransaction(transaction, this.keypair);
  }

  async sendRawTransaction(
    transaction: VersionedTransaction | Transaction,
    options: SendOptions = {},
  ): Promise<TransactionSignature> {
    const sendOptions: SendOptions = {
      skipPreflight: options.skipPreflight ?? this.config.skipPreflight,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      ...options,
    };

    if (transaction instanceof VersionedTransaction) {
      return this.connection.sendTransaction(transaction, sendOptions);
    } else {
      const serialized = transaction.serialize();
      return this.connection.sendRawTransaction(serialized, sendOptions);
    }
  }

  async sendAndConfirmTransaction(
    transaction: VersionedTransaction | Transaction,
    options: { skipPreflight?: boolean; maxRetries?: number } = {},
  ): Promise<TransactionResult> {
    return sendAndConfirmTransaction(this.connection, transaction, {
      skipPreflight: options.skipPreflight ?? this.config.skipPreflight,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      commitment: this.config.commitment,
    });
  }

  async signAndSendTransaction(
    transactionBase64: string,
    options: { skipPreflight?: boolean; maxRetries?: number } = {},
  ): Promise<TransactionResult> {
    if (!this.keypair) {
      throw new Error('No wallet configured for signing');
    }

    const transaction = deserializeTransaction(transactionBase64);
    const signedTx = this.signTransaction(transaction);
    return this.sendAndConfirmTransaction(signedTx, options);
  }

  async getTransactionStatus(signature: string): Promise<{
    confirmed: boolean;
    finalized: boolean;
    slot?: number;
    err?: string | null;
  }> {
    return getTransactionStatus(this.connection, signature);
  }

  async getSignatureStatus(signature: string): Promise<Record<string, unknown>> {
    const status = await this.connection.getSignatureStatus(signature);
    return {
      signature,
      slot: status.value?.slot,
      confirmations: status.value?.confirmations,
      confirmationStatus: status.value?.confirmationStatus,
      err: status.value?.err,
    };
  }

  async waitForConfirmation(signature: string, timeoutMs = 60000): Promise<TransactionResult> {
    return waitForConfirmation(this.connection, signature, timeoutMs, this.config.commitment);
  }

  async simulateTransaction(
    transaction: VersionedTransaction | Transaction | string,
  ): Promise<{
    success: boolean;
    logs?: string[];
    unitsConsumed?: number;
    error?: string;
    err?: unknown;
    returnData?: unknown;
    accounts?: unknown;
  }> {
    let tx: VersionedTransaction | Transaction;
    
    if (typeof transaction === 'string') {
      tx = deserializeTransaction(transaction);
    } else {
      tx = transaction;
    }
    
    const result = await simulateTransaction(this.connection, tx);
    return {
      ...result,
      err: result.error,
      returnData: null,
      accounts: null,
    };
  }

  async getTransaction(signature: string): Promise<Record<string, unknown> | null> {
    const tx = await this.connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
    return tx as unknown as Record<string, unknown>;
  }

  async getTransactionHistory(
    address: string,
    options?: { limit?: number; before?: string },
  ): Promise<Record<string, unknown>[]> {
    const pubkey = new PublicKey(address);
    const signatures = await this.connection.getSignaturesForAddress(pubkey, {
      limit: options?.limit || 10,
      before: options?.before,
    });
    
    return signatures.map(sig => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
      err: sig.err,
      memo: sig.memo,
    }));
  }

  async getRecentTransactions(address: string, limit = 10): Promise<Record<string, unknown>[]> {
    return this.getTransactionHistory(address, { limit });
  }

  async buildTransaction(_instructions: unknown[]): Promise<Transaction> {
    throw new Error('buildTransaction requires instruction details');
  }

  async sendTransaction(
    transaction: VersionedTransaction | Transaction,
    options?: SendOptions,
  ): Promise<string> {
    return this.sendRawTransaction(transaction, options);
  }

  async confirmTransaction(signature: string, timeout?: number): Promise<TransactionResult> {
    return this.waitForConfirmation(signature, timeout || 60000);
  }

  async estimateTransactionFee(transaction: VersionedTransaction | Transaction | string): Promise<number> {
    let tx: VersionedTransaction | Transaction;
    if (typeof transaction === 'string') {
      tx = deserializeTransaction(transaction);
    } else {
      tx = transaction;
    }

    if (tx instanceof VersionedTransaction) {
      const fee = await this.connection.getFeeForMessage(tx.message, 'confirmed');
      return fee.value || 5000;
    }
    return 5000; // Default fee estimate
  }

  async getRecentPrioritizationFees(addresses?: string[]): Promise<{ min: number; median: number; max: number }> {
    try {
      const pubkeys = addresses?.map(a => new PublicKey(a));
      const fees = await this.connection.getRecentPrioritizationFees({ lockedWritableAccounts: pubkeys });
      
      if (fees.length === 0) {
        return { min: 0, median: 0, max: 0 };
      }

      const priorityFees = fees.map(f => f.prioritizationFee).sort((a, b) => a - b);
      return {
        min: priorityFees[0],
        median: priorityFees[Math.floor(priorityFees.length / 2)],
        max: priorityFees[priorityFees.length - 1],
      };
    } catch {
      return { min: 0, median: 0, max: 0 };
    }
  }

  async getAccountInfo(address: string): Promise<Record<string, unknown> | null> {
    const pubkey = new PublicKey(address);
    const info = await this.connection.getAccountInfo(pubkey);
    if (!info) return null;
    
    return {
      lamports: info.lamports,
      owner: info.owner.toBase58(),
      executable: info.executable,
      rentEpoch: info.rentEpoch,
      data: info.data.toString('base64'),
    };
  }

  async getSlot(): Promise<number> {
    return this.connection.getSlot(this.config.commitment);
  }

  async getBlockHeight(): Promise<number> {
    return this.connection.getBlockHeight(this.config.commitment);
  }

  async getBlockTime(slot: number): Promise<number | null> {
    return this.connection.getBlockTime(slot);
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    slot?: number;
    version?: string;
    error?: string;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      const [slot, version] = await Promise.all([
        this.connection.getSlot(),
        this.connection.getVersion(),
      ]);
      
      return {
        healthy: true,
        slot,
        version: version['solana-core'],
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Create Solana client from n8n credentials
 */
export async function createSolanaClient(context: IExecuteFunctions): Promise<SolanaClient> {
  const credentials = await context.getCredentials('jupiterNetwork');
  
  return new SolanaClient({
    network: credentials.network as 'mainnet' | 'devnet' | 'custom',
    rpcEndpoint: credentials.rpcEndpoint as string,
    commitment: credentials.commitment as CommitmentLevel,
    privateKey: credentials.privateKey as string,
    skipPreflight: credentials.skipPreflight as boolean,
    maxRetries: credentials.maxRetries as number,
  });
}

export default SolanaClient;
