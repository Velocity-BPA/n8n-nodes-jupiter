/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Transaction Utilities
 * Helper functions for building and sending Solana transactions
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  SendOptions,
  Commitment,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Transaction result
 */
export interface TransactionResult {
  signature: string;
  confirmed: boolean;
  slot?: number;
  blockTime?: number;
  err?: string | null;
}

/**
 * Priority fee levels
 */
export type PriorityFeeLevel = 'none' | 'low' | 'medium' | 'high' | 'very_high';

/**
 * Priority fee configuration
 */
export const PRIORITY_FEES: Record<PriorityFeeLevel, number> = {
  none: 0,
  low: 10_000, // 0.01 lamports per CU
  medium: 100_000, // 0.1 lamports per CU
  high: 500_000, // 0.5 lamports per CU
  very_high: 1_000_000, // 1 lamport per CU
};

/**
 * Parse private key from various formats
 * @param privateKey - Private key as base58 string or JSON array
 * @returns Keypair
 */
export function parsePrivateKey(privateKey: string): Keypair {
  try {
    // Try parsing as JSON array first
    if (privateKey.startsWith('[')) {
      const secretKey = new Uint8Array(JSON.parse(privateKey));
      return Keypair.fromSecretKey(secretKey);
    }
    
    // Try as base58 encoded string
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (error) {
    throw new Error(
      'Invalid private key format. Must be base58 encoded string or JSON array of bytes.',
    );
  }
}

/**
 * Validate Solana address
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public key from string
 * @param address - Address string
 * @returns PublicKey
 */
export function toPublicKey(address: string): PublicKey {
  if (!isValidAddress(address)) {
    throw new Error(`Invalid Solana address: ${address}`);
  }
  return new PublicKey(address);
}

/**
 * Deserialize transaction from base64
 * @param transactionBase64 - Base64 encoded transaction
 * @returns VersionedTransaction or Transaction
 */
export function deserializeTransaction(
  transactionBase64: string,
): VersionedTransaction | Transaction {
  const buffer = Buffer.from(transactionBase64, 'base64');
  
  // Try versioned transaction first
  try {
    return VersionedTransaction.deserialize(buffer);
  } catch {
    // Fall back to legacy transaction
    return Transaction.from(buffer);
  }
}

/**
 * Sign transaction with keypair
 * @param transaction - Transaction to sign
 * @param keypair - Signing keypair
 * @returns Signed transaction
 */
export function signTransaction(
  transaction: VersionedTransaction | Transaction,
  keypair: Keypair,
): VersionedTransaction | Transaction {
  if (transaction instanceof VersionedTransaction) {
    transaction.sign([keypair]);
  } else {
    transaction.sign(keypair);
  }
  return transaction;
}

/**
 * Send and confirm transaction
 * @param connection - Solana connection
 * @param transaction - Signed transaction
 * @param options - Send options
 * @returns Transaction result
 */
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: VersionedTransaction | Transaction,
  options: {
    skipPreflight?: boolean;
    maxRetries?: number;
    commitment?: Commitment;
  } = {},
): Promise<TransactionResult> {
  const { skipPreflight = false, maxRetries = 3, commitment = 'confirmed' } = options;
  
  const sendOptions: SendOptions = {
    skipPreflight,
    maxRetries,
  };
  
  let signature: string;
  
  if (transaction instanceof VersionedTransaction) {
    signature = await connection.sendTransaction(transaction, sendOptions);
  } else {
    const serialized = transaction.serialize();
    signature = await connection.sendRawTransaction(serialized, sendOptions);
  }
  
  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: transaction instanceof VersionedTransaction 
        ? transaction.message.recentBlockhash
        : transaction.recentBlockhash!,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    },
    commitment,
  );
  
  return {
    signature,
    confirmed: !confirmation.value.err,
    err: confirmation.value.err ? JSON.stringify(confirmation.value.err) : null,
  };
}

/**
 * Get transaction status
 * @param connection - Solana connection
 * @param signature - Transaction signature
 * @returns Transaction status
 */
export async function getTransactionStatus(
  connection: Connection,
  signature: string,
): Promise<{
  confirmed: boolean;
  finalized: boolean;
  slot?: number;
  blockTime?: number | null;
  err?: string | null;
}> {
  const status = await connection.getSignatureStatus(signature);
  
  if (!status.value) {
    return {
      confirmed: false,
      finalized: false,
    };
  }
  
  return {
    confirmed: status.value.confirmationStatus === 'confirmed' || 
               status.value.confirmationStatus === 'finalized',
    finalized: status.value.confirmationStatus === 'finalized',
    slot: status.value.slot,
    err: status.value.err ? JSON.stringify(status.value.err) : null,
  };
}

/**
 * Create priority fee instructions
 * @param priorityLevel - Priority fee level
 * @param computeUnits - Compute units to allocate
 * @returns Array of compute budget instructions
 */
export function createPriorityFeeInstructions(
  priorityLevel: PriorityFeeLevel,
  computeUnits = 200_000,
): TransactionInstruction[] {
  const instructions: TransactionInstruction[] = [];
  
  // Set compute unit limit
  instructions.push(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: computeUnits,
    }),
  );
  
  // Set compute unit price (priority fee)
  const microLamports = PRIORITY_FEES[priorityLevel];
  if (microLamports > 0) {
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports,
      }),
    );
  }
  
  return instructions;
}

/**
 * Estimate transaction fee
 * @param connection - Solana connection
 * @param transaction - Transaction to estimate
 * @returns Estimated fee in lamports
 */
export async function estimateTransactionFee(
  connection: Connection,
  transaction: VersionedTransaction | Transaction,
): Promise<number> {
  if (transaction instanceof VersionedTransaction) {
    const fee = await connection.getFeeForMessage(transaction.message);
    return fee.value || 5000;
  } else {
    const fee = await connection.getFeeForMessage(
      transaction.compileMessage(),
    );
    return fee.value || 5000;
  }
}

/**
 * Simulate transaction
 * @param connection - Solana connection
 * @param transaction - Transaction to simulate
 * @returns Simulation result
 */
export async function simulateTransaction(
  connection: Connection,
  transaction: VersionedTransaction | Transaction,
): Promise<{
  success: boolean;
  logs?: string[];
  unitsConsumed?: number;
  error?: string;
}> {
  try {
    let result;
    
    if (transaction instanceof VersionedTransaction) {
      result = await connection.simulateTransaction(transaction);
    } else {
      result = await connection.simulateTransaction(transaction);
    }
    
    return {
      success: !result.value.err,
      logs: result.value.logs || undefined,
      unitsConsumed: result.value.unitsConsumed || undefined,
      error: result.value.err ? JSON.stringify(result.value.err) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown simulation error',
    };
  }
}

/**
 * Convert lamports to SOL
 * @param lamports - Amount in lamports
 * @returns Amount in SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / 1e9;
}

/**
 * Convert SOL to lamports
 * @param sol - Amount in SOL
 * @returns Amount in lamports
 */
export function solToLamports(sol: number): number {
  return Math.round(sol * 1e9);
}

/**
 * Get recent blockhash with retry
 * @param connection - Solana connection
 * @param maxRetries - Maximum retries
 * @returns Recent blockhash
 */
export async function getRecentBlockhash(
  connection: Connection,
  maxRetries = 3,
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      return { blockhash, lastValidBlockHeight };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError || new Error('Failed to get recent blockhash');
}

/**
 * Wait for transaction confirmation with timeout
 * @param connection - Solana connection
 * @param signature - Transaction signature
 * @param timeoutMs - Timeout in milliseconds
 * @param commitment - Commitment level
 * @returns Confirmation result
 */
export async function waitForConfirmation(
  connection: Connection,
  signature: string,
  timeoutMs = 60000,
  commitment: Commitment = 'confirmed',
): Promise<TransactionResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const status = await getTransactionStatus(connection, signature);
    
    if (status.confirmed) {
      // Get block time
      const tx = await connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
      
      return {
        signature,
        confirmed: true,
        slot: status.slot,
        blockTime: tx?.blockTime || undefined,
        err: status.err,
      };
    }
    
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  
  return {
    signature,
    confirmed: false,
    err: 'Transaction confirmation timeout',
  };
}

export default {
  parsePrivateKey,
  isValidAddress,
  toPublicKey,
  deserializeTransaction,
  signTransaction,
  sendAndConfirmTransaction,
  getTransactionStatus,
  createPriorityFeeInstructions,
  estimateTransactionFee,
  simulateTransaction,
  lamportsToSol,
  solToLamports,
  getRecentBlockhash,
  waitForConfirmation,
  PRIORITY_FEES,
};
