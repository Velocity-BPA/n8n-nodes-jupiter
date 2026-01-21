/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Jupiter API Endpoint Definitions
 * All API endpoints used by Jupiter DEX aggregator
 */

/**
 * Base API URLs
 */
export const BASE_URLS = {
  // Quote API - Main swap aggregator
  QUOTE: 'https://quote-api.jup.ag/v6',
  
  // Price API - Token prices
  PRICE: 'https://price.jup.ag/v6',
  
  // Token API - Token list and info
  TOKEN: 'https://token.jup.ag',
  
  // Stats API - Volume and statistics
  STATS: 'https://stats.jup.ag',
  
  // Limit Order API
  LIMIT_ORDER: 'https://jup.ag/api/limit/v1',
  
  // DCA API
  DCA: 'https://dca-api.jup.ag',
  
  // Perpetuals API
  PERP: 'https://perp-api.jup.ag/v1',
  
  // Ultra API
  ULTRA: 'https://ultra-api.jup.ag',
  
  // Referral API
  REFERRAL: 'https://referral-api.jup.ag',
};

/**
 * Quote API Endpoints
 */
export const QUOTE_ENDPOINTS = {
  // Get swap quote
  QUOTE: '/quote',
  
  // Get swap transaction
  SWAP: '/swap',
  
  // Get swap instructions
  SWAP_INSTRUCTIONS: '/swap-instructions',
  
  // Get program ID labels
  PROGRAM_ID_TO_LABEL: '/program-id-to-label',
  
  // Get indexed route map
  INDEXED_ROUTE_MAP: '/indexed-route-map',
  
  // Get tokens (from quote API)
  TOKENS: '/tokens',
};

/**
 * Price API Endpoints
 */
export const PRICE_ENDPOINTS = {
  // Get single price
  PRICE: '/price',
  
  // Get multiple prices
  PRICES: '/price',
};

/**
 * Token API Endpoints
 */
export const TOKEN_ENDPOINTS = {
  // All tokens
  ALL: '/all',
  
  // Strict list only
  STRICT: '/strict',
  
  // Get token by mint
  TOKEN: '/token',
  
  // Search tokens
  SEARCH: '/search',
  
  // New tokens
  NEW: '/new',
  
  // Tags
  TAGS: '/tags',
};

/**
 * Limit Order API Endpoints
 */
export const LIMIT_ORDER_ENDPOINTS = {
  // Create order
  CREATE: '/createOrder',
  
  // Cancel order
  CANCEL: '/cancelOrders',
  
  // Get orders by wallet
  ORDERS: '/orders',
  
  // Get order history
  HISTORY: '/orderHistory',
  
  // Get open orders
  OPEN_ORDERS: '/openOrders',
  
  // Get trade history
  TRADE_HISTORY: '/tradeHistory',
};

/**
 * DCA API Endpoints
 */
export const DCA_ENDPOINTS = {
  // Create DCA
  CREATE: '/dca/create',
  
  // Get DCA
  GET: '/dca',
  
  // Get user DCAs
  USER_DCAS: '/dca/user',
  
  // Cancel DCA
  CANCEL: '/dca/cancel',
  
  // Get DCA fills
  FILLS: '/dca/fills',
  
  // Pause DCA
  PAUSE: '/dca/pause',
  
  // Resume DCA
  RESUME: '/dca/resume',
};

/**
 * Perpetuals API Endpoints
 */
export const PERP_ENDPOINTS = {
  // Get markets
  MARKETS: '/markets',
  
  // Get positions
  POSITIONS: '/positions',
  
  // Open position
  OPEN: '/position/open',
  
  // Close position
  CLOSE: '/position/close',
  
  // Increase position
  INCREASE: '/position/increase',
  
  // Decrease position
  DECREASE: '/position/decrease',
  
  // Add collateral
  ADD_COLLATERAL: '/position/add-collateral',
  
  // Remove collateral
  REMOVE_COLLATERAL: '/position/remove-collateral',
  
  // Get funding rates
  FUNDING: '/funding',
  
  // Get open interest
  OPEN_INTEREST: '/open-interest',
};

/**
 * JLP API Endpoints
 */
export const JLP_ENDPOINTS = {
  // Get JLP info
  INFO: '/jlp',
  
  // Get JLP price
  PRICE: '/jlp/price',
  
  // Get JLP APY
  APY: '/jlp/apy',
  
  // Get JLP composition
  COMPOSITION: '/jlp/composition',
  
  // Deposit
  DEPOSIT: '/jlp/deposit',
  
  // Withdraw
  WITHDRAW: '/jlp/withdraw',
  
  // Get holdings
  HOLDINGS: '/jlp/holdings',
  
  // Get fees
  FEES: '/jlp/fees',
};

/**
 * Stats API Endpoints
 */
export const STATS_ENDPOINTS = {
  // Overall stats
  OVERVIEW: '/overview',
  
  // Volume stats
  VOLUME: '/volume',
  
  // Daily stats
  DAILY: '/daily',
  
  // Weekly stats
  WEEKLY: '/weekly',
  
  // Monthly stats
  MONTHLY: '/monthly',
  
  // Top tokens
  TOP_TOKENS: '/top-tokens',
  
  // Top routes
  TOP_ROUTES: '/top-routes',
  
  // User stats
  USER: '/user',
};

/**
 * Ultra API Endpoints
 */
export const ULTRA_ENDPOINTS = {
  // Get ultra quote
  QUOTE: '/quote',
  
  // Execute ultra swap
  SWAP: '/swap',
  
  // Get status
  STATUS: '/status',
};

/**
 * Governance API Endpoints
 */
export const GOVERNANCE_ENDPOINTS = {
  // Get proposals
  PROPOSALS: '/proposals',
  
  // Get proposal by ID
  PROPOSAL: '/proposal',
  
  // Vote
  VOTE: '/vote',
  
  // Get voting power
  VOTING_POWER: '/voting-power',
  
  // Get vote history
  VOTE_HISTORY: '/vote-history',
  
  // Delegate
  DELEGATE: '/delegate',
};

/**
 * Referral API Endpoints
 */
export const REFERRAL_ENDPOINTS = {
  // Get referral account
  ACCOUNT: '/account',
  
  // Create referral account
  CREATE: '/create',
  
  // Get stats
  STATS: '/stats',
  
  // Get earnings
  EARNINGS: '/earnings',
  
  // Claim fees
  CLAIM: '/claim',
  
  // Get referred swaps
  SWAPS: '/swaps',
};

/**
 * Jupiter Fee Configuration
 */
export const JUPITER_FEE_BPS = 0; // Jupiter's default platform fee in basis points

/**
 * All endpoints combined for easy access
 */
export const ENDPOINTS = {
  BASE_URLS,
  QUOTE: QUOTE_ENDPOINTS,
  PRICE: PRICE_ENDPOINTS,
  TOKEN: TOKEN_ENDPOINTS,
  LIMIT_ORDER: LIMIT_ORDER_ENDPOINTS,
  DCA: DCA_ENDPOINTS,
  PERP: PERP_ENDPOINTS,
  JLP: JLP_ENDPOINTS,
  STATS: STATS_ENDPOINTS,
  ULTRA: ULTRA_ENDPOINTS,
  GOVERNANCE: GOVERNANCE_ENDPOINTS,
  REFERRAL: REFERRAL_ENDPOINTS,
};

export default ENDPOINTS;
