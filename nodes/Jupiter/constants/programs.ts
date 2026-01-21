/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Jupiter Program IDs and Related Solana Programs
 * These are the on-chain program addresses used by Jupiter
 */

/**
 * Jupiter Core Program IDs
 */
export const JUPITER_PROGRAMS = {
  // Jupiter V6 Swap Program
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  
  // Jupiter Limit Order Program
  LIMIT_ORDER: 'jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu',
  
  // Jupiter DCA Program
  DCA: 'DCA265Vj8a9CEuX1eb1LWRnDT7uK6q1xMipnNyatn23M',
  
  // Jupiter Perpetuals Program
  PERPETUALS: 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verN',
  
  // Jupiter JLP Pool Program
  JLP_POOL: 'PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2verN',
  
  // Jupiter Governance Program
  GOVERNANCE: 'GovaE4iu227srtG2s3tZzB4RmWBzw8sTwrCLZz7kN7rY',
  
  // Jupiter Referral Program
  REFERRAL: 'REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3',
  
  // Jupiter Staking Program
  STAKING: 'JUPStakeProgram11111111111111111111111111111',
};

/**
 * Solana System Programs
 */
export const SOLANA_PROGRAMS = {
  // System Program
  SYSTEM: '11111111111111111111111111111111',
  
  // Token Program
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  
  // Token 2022 Program
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  
  // Associated Token Account Program
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  
  // Memo Program
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  
  // Compute Budget Program
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
  
  // Address Lookup Table Program
  ADDRESS_LOOKUP_TABLE: 'AddressLookupTab1e1111111111111111111111111',
};

/**
 * DEX Program IDs used by Jupiter for routing
 */
export const DEX_PROGRAMS = {
  // Orca Whirlpool
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  
  // Raydium AMM V4
  RAYDIUM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  
  // Raydium Concentrated Liquidity
  RAYDIUM_CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  
  // Meteora DLMM
  METEORA_DLMM: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  
  // Meteora Pools
  METEORA_POOLS: 'Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB',
  
  // Phoenix
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
  
  // Lifinity V2
  LIFINITY_V2: '2wT8Yq49kHgDzXuPxZSaeLaH1qbmGXtEyPy64bL7aD3c',
  
  // Marinade Finance
  MARINADE: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
  
  // Saber
  SABER: 'SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ',
  
  // OpenBook
  OPENBOOK: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
  
  // Sanctum
  SANCTUM: 'stkitrT1Uoy18Dk1fTrgPw8W6MVzoCfYoAFT4MLsmhq',
};

/**
 * Jupiter Fee Accounts
 */
export const FEE_ACCOUNTS = {
  // Platform fee account
  PLATFORM_FEE: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  
  // Referral program fee account
  REFERRAL_FEE: 'REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3',
};

/**
 * JLP Related Addresses
 */
export const JLP_ADDRESSES = {
  // JLP Token Mint
  JLP_MINT: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
  
  // JLP Pool
  JLP_POOL: 'JLPVF2tJvPLbv9upMGLBQnz8PneTLfq7L8kfvhW3UNJ',
  
  // JLP Custody Accounts
  JLP_CUSTODY: {
    SOL: '7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz',
    ETH: 'AQCGyheWPLeo6Qp9WpYS9m3Qj479t7R636N9ey1rEjEn',
    BTC: '5Pv3gM9JrFFH883SWAhvJC9RPYmo8UNxuFtv5bMMALkm',
    USDC: 'G18jKKXQwBbrHpFqgKV9qvJ8yYSn7EMiWDk4S3Y9LLPg',
    USDT: '4vkNeXiYEUizLdrpdPS1eC2mccyM4NUPRtERrk6ZETkk',
  },
};

// Convenience exports for common JLP addresses
export const JLP_POOL_ADDRESS = JLP_ADDRESSES.JLP_POOL;
export const JLP_TOKEN_MINT = JLP_ADDRESSES.JLP_MINT;

// Convenience export for referral program
export const REFERRAL_PROGRAM_ID = JUPITER_PROGRAMS.REFERRAL;

/**
 * Governance Addresses
 */
export const GOVERNANCE_ADDRESSES = {
  // Governance realm
  REALM: 'JUPGovernanceProgram11111111111111111111111',
  
  // Governance token owner record
  TOKEN_OWNER_RECORD: 'JUPTokenOwner111111111111111111111111111111',
  
  // Proposal seed
  PROPOSAL_SEED: 'proposal',
};

export default {
  JUPITER_PROGRAMS,
  SOLANA_PROGRAMS,
  DEX_PROGRAMS,
  FEE_ACCOUNTS,
  JLP_ADDRESSES,
  GOVERNANCE_ADDRESSES,
};
