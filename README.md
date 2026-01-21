# n8n-nodes-jupiter

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node for **Jupiter**, Solana's leading DEX aggregator. This package provides 21 resource categories with 215+ operations for swaps, limit orders, DCA, perpetuals, JLP, governance, and more.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![Solana](https://img.shields.io/badge/Solana-blockchain-9945FF)
![Jupiter](https://img.shields.io/badge/Jupiter-DEX-green)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)

## Features

- **Swap Operations**: Get quotes, execute swaps, compare routes, and estimate price impact
- **Limit Orders**: Create, manage, and track limit orders on Jupiter
- **Dollar Cost Averaging (DCA)**: Set up and manage automated recurring swaps
- **Perpetuals Trading**: Open/close positions, manage collateral, set stop loss/take profit
- **JLP (Jupiter Liquidity Provider)**: Deposit, withdraw, and track JLP positions
- **JUP Token**: Stake, unstake, and manage JUP governance tokens
- **Governance**: Vote on proposals and participate in Jupiter DAO
- **Price Feeds**: Real-time token prices, OHLCV data, and price alerts
- **Token Management**: Search tokens, validate addresses, get token metadata
- **Transaction Handling**: Build, sign, send, and track Solana transactions
- **Trigger Node**: Real-time monitoring for swaps, orders, prices, and more

## Installation

### Community Nodes (Recommended)

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-jupiter`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation directory
cd ~/.n8n

# Install the package
npm install n8n-nodes-jupiter
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-jupiter.git
cd n8n-nodes-jupiter

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n (Linux/macOS)
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-jupiter

# Restart n8n
n8n start
```

## Credentials Setup

### Jupiter Network Credentials

For Solana blockchain interactions (swaps, transactions, etc.):

| Field | Description | Required |
|-------|-------------|----------|
| Network | Solana Mainnet, Devnet, or Custom | Yes |
| RPC Endpoint | Custom RPC URL (if Custom network) | Conditional |
| Private Key | Wallet private key (base58 or JSON array) | Yes |
| Commitment Level | Transaction confirmation level | No |

### Jupiter API Credentials

For Jupiter API access (quotes, prices, token lists):

| Field | Description | Required |
|-------|-------------|----------|
| API Endpoint | Jupiter API URL | No (default provided) |
| API Key | Jupiter API key (if applicable) | No |
| Rate Limit Tier | Free, Pro, or Enterprise | No |

## Resources & Operations

### 1. Swap (14 operations)
Execute token swaps through Jupiter's aggregator.

- **Get Quote**: Get best swap quote for token pair
- **Get Quote with Routes**: Get quote with detailed route information
- **Execute Swap**: Execute a token swap
- **Get Swap Transaction**: Get serialized swap transaction
- **Get Swap Status**: Check status of a swap
- **Get Swap Instructions**: Get swap instructions for custom transactions
- **Build Swap Transaction**: Build swap transaction with custom parameters
- **Sign and Send Swap**: Sign and send swap in one operation
- **Get Best Route**: Get optimal swap route
- **Compare Routes**: Compare multiple swap routes
- **Get Swap Fees**: Get fee breakdown for a swap
- **Estimate Price Impact**: Calculate price impact for a swap amount
- **Get Slippage Settings**: Get recommended slippage settings
- **Simulate Swap**: Simulate swap without executing

### 2. Quote (10 operations)
Get and manage swap quotes.

- **Get Quote (Exact In)**: Quote with exact input amount
- **Get Quote (Exact Out)**: Quote with exact output amount
- **Get Quotes (Multiple)**: Get quotes for multiple pairs
- **Get Quote with Fees**: Quote including detailed fees
- **Get Quote with Slippage**: Quote with custom slippage
- **Get Dynamic Slippage Quote**: Quote with auto-calculated slippage
- **Compare Quotes**: Compare quotes across routes
- **Get Quote Refresh**: Refresh an existing quote
- **Get Quote Validity**: Check if quote is still valid
- **Validate Quote**: Validate quote parameters

### 3. Route (10 operations)
Analyze and optimize swap routes.

- **Get Routes**: Get all available swap routes
- **Get Best Route**: Get optimal route for a swap
- **Get Route Details**: Get detailed route information
- **Get Route Hops**: Get individual hops in a route
- **Get Route Markets**: Get markets used in a route
- **Compare Routes**: Compare multiple routes
- **Get Route Fees**: Get fee breakdown by route
- **Get Route Price Impact**: Calculate price impact per route
- **Filter Routes**: Filter routes by criteria
- **Get V6 Routes**: Get Jupiter V6 API routes

### 4. Limit Order (11 operations)
Create and manage limit orders.

- **Create Limit Order**: Place a new limit order
- **Get Limit Order**: Get order details by ID
- **Get Open Orders**: Get all open orders for a wallet
- **Get Order History**: Get historical orders
- **Cancel Order**: Cancel a specific order
- **Cancel All Orders**: Cancel all open orders
- **Get Order Status**: Check order execution status
- **Get Order by ID**: Retrieve order by unique ID
- **Get Orders by Wallet**: Get all orders for a wallet
- **Update Order**: Modify an existing order
- **Get Order Book**: Get order book for a pair

### 5. DCA (10 operations)
Dollar Cost Averaging operations.

- **Create DCA Order**: Set up a new DCA order
- **Get DCA Order**: Get DCA order details
- **Get Active DCAs**: Get all active DCA orders
- **Get DCA History**: Get DCA execution history
- **Cancel DCA**: Cancel a DCA order
- **Pause DCA**: Pause DCA execution
- **Resume DCA**: Resume paused DCA
- **Get DCA Status**: Check DCA status
- **Get DCA Fills**: Get DCA fill history
- **Get DCA Statistics**: Get DCA performance stats

### 6. Perpetuals (16 operations)
Trade perpetual futures on Jupiter.

- **Get Perpetual Markets**: Get available perp markets
- **Get Market Info**: Get market details
- **Get Position**: Get a specific position
- **Get Positions**: Get all positions
- **Open Position**: Open a new position
- **Close Position**: Close an existing position
- **Increase Position**: Add to position size
- **Decrease Position**: Reduce position size
- **Get Funding Rate**: Get current funding rate
- **Get Open Interest**: Get market open interest
- **Get Liquidation Price**: Calculate liquidation price
- **Get PnL**: Get profit/loss for a position
- **Add Collateral**: Add collateral to position
- **Remove Collateral**: Remove collateral from position
- **Set Stop Loss**: Set stop loss order
- **Set Take Profit**: Set take profit order

### 7. Token (14 operations)
Token information and management.

- **Get Token Info**: Get detailed token information
- **Get Token List**: Get Jupiter token list
- **Get Strict Token List**: Get verified tokens only
- **Get All Tokens**: Get all available tokens
- **Search Tokens**: Search tokens by name/symbol
- **Get Token by Mint**: Get token by mint address
- **Get Token by Symbol**: Get token by symbol
- **Get Token Price**: Get current token price
- **Get Token Prices**: Get multiple token prices
- **Get Token Logo**: Get token logo URL
- **Get Token Tags**: Get token category tags
- **Validate Token**: Validate token address
- **Get New Tokens**: Get recently listed tokens
- **Get Verified Tokens**: Get verified token list

### 8. Price (11 operations)
Price feeds and market data.

- **Get Price**: Get current token price
- **Get Prices**: Get multiple token prices
- **Get Price by ID**: Get price by token ID
- **Get Price History**: Get historical prices
- **Get OHLCV**: Get OHLCV candle data
- **Get Price Change**: Get price change stats
- **Get 24h Stats**: Get 24-hour statistics
- **Get Price from Quote**: Extract price from quote
- **Get Reference Price**: Get reference market price
- **Compare Prices**: Compare prices across sources
- **Get Price Impact**: Calculate price impact

### 9. Market (9 operations)
Market information and statistics.

- **Get Markets**: Get all available markets
- **Get Market Info**: Get specific market info
- **Get DEX Markets**: Get markets by DEX
- **Get Market Volume**: Get trading volume
- **Get Market Liquidity**: Get liquidity depth
- **Get Market by Pair**: Get market for token pair
- **Get Top Markets**: Get highest volume markets
- **Get Market Stats**: Get market statistics
- **Get Supported DEXes**: Get supported DEX list

### 10. Liquidity (9 operations)
Liquidity pool operations.

- **Get Liquidity**: Get total liquidity
- **Get Pool Info**: Get pool details
- **Get Pool Liquidity**: Get pool liquidity amount
- **Get Concentrated Liquidity**: Get CLMM liquidity
- **Get Liquidity Distribution**: Get liquidity distribution
- **Get Depth**: Get market depth
- **Get TVL**: Get total value locked
- **Get Pool by Address**: Get pool by address
- **Get Pools by Token**: Get pools containing token

### 11. Fee (7 operations)
Fee calculations and management.

- **Get Platform Fee**: Get Jupiter platform fee
- **Get Route Fees**: Get fees for a route
- **Get Priority Fee**: Get recommended priority fee
- **Estimate Fees**: Estimate total transaction fees
- **Get Fee Account**: Get fee account address
- **Get Referral Fee**: Get referral fee rate
- **Calculate Total Fees**: Calculate all fees

### 12. Referral (7 operations)
Referral program operations.

- **Get Referral Account**: Get referral account info
- **Create Referral Account**: Create new referral account
- **Get Referral Stats**: Get referral statistics
- **Get Referral Earnings**: Get earned referral fees
- **Claim Referral Fees**: Claim accumulated fees
- **Get Referral Code**: Get referral code
- **Get Referred Swaps**: Get referred swap history

### 13. JLP (10 operations)
Jupiter Liquidity Provider operations.

- **Get JLP Info**: Get JLP pool information
- **Get JLP Price**: Get current JLP price
- **Get JLP APY**: Get JLP yield rate
- **Get JLP Composition**: Get pool token composition
- **Deposit to JLP**: Deposit tokens to JLP
- **Withdraw from JLP**: Withdraw from JLP
- **Get JLP Balance**: Get JLP token balance
- **Get JLP Holdings**: Get underlying holdings
- **Get JLP Fees**: Get JLP fee earnings
- **Get JLP Stats**: Get JLP statistics

### 14. JUP Token (11 operations)
JUP governance token operations.

- **Get Balance**: Get JUP token balance
- **Transfer**: Transfer JUP tokens
- **Get Price**: Get JUP price
- **Get Supply**: Get JUP supply info
- **Get Stats**: Get JUP token statistics
- **Stake**: Stake JUP tokens
- **Unstake**: Unstake JUP tokens
- **Get Staking APY**: Get staking yield rate
- **Get Staking Rewards**: Get pending rewards
- **Claim Rewards**: Claim staking rewards
- **Get Vote Power**: Get governance vote power

### 15. Governance (9 operations)
DAO governance operations.

- **Get Proposals**: Get all proposals
- **Get Proposal**: Get proposal details
- **Get Proposal Status**: Check proposal status
- **Vote**: Cast vote on proposal
- **Get Voting Power**: Get voting power
- **Get Vote History**: Get voting history
- **Get Stats**: Get governance statistics
- **Delegate Votes**: Delegate voting power
- **Get Active Proposals**: Get active proposals

### 16. Airdrop (6 operations)
Airdrop claim operations.

- **Check Eligibility**: Check airdrop eligibility
- **Get Amount**: Get claimable amount
- **Claim**: Claim airdrop tokens
- **Get Status**: Get claim status
- **Get History**: Get claim history
- **Get Round Info**: Get airdrop round info

### 17. Stats (10 operations)
Protocol statistics.

- **Get Jupiter Stats**: Get protocol statistics
- **Get Volume Stats**: Get trading volume stats
- **Get Swap Stats**: Get swap statistics
- **Get User Stats**: Get user activity stats
- **Get Protocol Revenue**: Get protocol revenue
- **Get Daily Stats**: Get daily statistics
- **Get Weekly Stats**: Get weekly statistics
- **Get Monthly Stats**: Get monthly statistics
- **Get Top Tokens**: Get most traded tokens
- **Get Top Routes**: Get most used routes

### 18. Transaction (10 operations)
Transaction building and management.

- **Get Transaction**: Get transaction details
- **Get Status**: Check transaction status
- **Build Transaction**: Build custom transaction
- **Sign Transaction**: Sign a transaction
- **Send Transaction**: Send signed transaction
- **Confirm Transaction**: Wait for confirmation
- **Get History**: Get transaction history
- **Get Recent**: Get recent transactions
- **Estimate Fee**: Estimate transaction fee
- **Simulate**: Simulate transaction

### 19. Ultra (4 operations)
Jupiter Ultra optimized swaps.

- **Get Quote**: Get Ultra swap quote
- **Execute Swap**: Execute Ultra swap
- **Get Status**: Get Ultra swap status
- **Get Transaction**: Get Ultra transaction

### 20. Trigger Order (7 operations)
Conditional order operations.

- **Create**: Create trigger order
- **Get Order**: Get trigger order details
- **Get Orders**: Get all trigger orders
- **Cancel**: Cancel trigger order
- **Get Status**: Get order status
- **Update**: Update trigger order
- **Get Events**: Get triggered events

### 21. Utility (10 operations)
Utility functions.

- **Get Supported Tokens**: Get supported token list
- **Get Route Map**: Get indexed route map
- **Get Program IDs**: Get Jupiter program IDs
- **Validate Address**: Validate Solana address
- **SOL to Lamports**: Convert SOL to lamports
- **Lamports to SOL**: Convert lamports to SOL
- **Get RPC Status**: Check RPC health
- **Get API Status**: Check API health
- **Get Rate Limits**: Get rate limit status
- **Get Version**: Get Jupiter version

## Trigger Node

The **Jupiter Trigger** node monitors blockchain events in real-time:

### Swap Triggers
- Swap Completed
- Swap Failed
- Large Swap Alert
- Slippage Exceeded
- Price Impact Alert

### Order Triggers
- Limit Order Created
- Limit Order Filled
- Limit Order Cancelled
- Order Expired

### DCA Triggers
- DCA Created
- DCA Executed
- DCA Completed

### Perpetual Triggers
- Position Opened
- Position Closed
- Position Liquidated
- PnL Alert
- Stop Loss Triggered

### Price Triggers
- Price Alert (above/below)
- Price Change Percent
- New ATH/ATL
- Volatility Alert

### Token Triggers
- New Token Listed
- Large Volume Alert

### JLP Triggers
- JLP Deposit/Withdrawal
- APY Changed

### Governance Triggers
- Proposal Created
- Vote Cast
- Proposal Passed/Failed

## Usage Examples

### Get Swap Quote

```javascript
// Node Configuration
{
  "resource": "swap",
  "operation": "getQuote",
  "inputMint": "So11111111111111111111111111111111111111112", // SOL
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "amount": "1000000000", // 1 SOL in lamports
  "slippageBps": 50 // 0.5%
}
```

### Execute Token Swap

```javascript
// Node Configuration
{
  "resource": "swap",
  "operation": "executeSwap",
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": "1000000000",
  "slippageBps": 50,
  "priorityFee": "auto"
}
```

### Create Limit Order

```javascript
// Node Configuration
{
  "resource": "limitOrder",
  "operation": "create",
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "inAmount": "1000000000", // 1 SOL
  "outAmount": "200000000", // 200 USDC (limit price)
  "expiry": "24h"
}
```

### Setup DCA Order

```javascript
// Node Configuration
{
  "resource": "dca",
  "operation": "create",
  "inputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "outputMint": "So11111111111111111111111111111111111111112", // SOL
  "inAmountPerCycle": "10000000", // 10 USDC per cycle
  "cycleFrequency": "daily",
  "totalCycles": 30
}
```

### Open Perpetual Position

```javascript
// Node Configuration
{
  "resource": "perpetuals",
  "operation": "openPosition",
  "market": "SOL-PERP",
  "side": "long",
  "size": "1000000000", // 1 SOL
  "leverage": 5,
  "collateral": "100000000" // 0.1 SOL
}
```

### Get Token Price

```javascript
// Node Configuration
{
  "resource": "price",
  "operation": "getPrice",
  "mint": "So11111111111111111111111111111111111111112",
  "vsToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
}
```

### Stake JUP Tokens

```javascript
// Node Configuration
{
  "resource": "jupToken",
  "operation": "stake",
  "amount": "100000000000", // 100 JUP
  "lockDuration": "3months" // For 2x vote multiplier
}
```

## Jupiter Concepts

### DEX Aggregation
Jupiter aggregates liquidity from multiple Solana DEXes to find the best swap rates. It automatically splits trades across multiple routes and DEXes for optimal execution.

### Route
A swap route is the path your tokens take through different DEXes and liquidity pools. Multi-hop routes may swap through intermediate tokens for better rates.

### Slippage
Price tolerance between quote and execution. Recommended: 0.5% for stable pairs, 1-3% for volatile pairs.

### Price Impact
The effect your trade has on the market price. Large trades relative to pool liquidity have higher price impact.

### Priority Fees
Additional fees paid to Solana validators for faster transaction inclusion during high network congestion.

### JLP (Jupiter Liquidity Provider)
A liquidity pool that earns fees from Jupiter's perpetuals trading. Users deposit assets and receive JLP tokens representing their share.

### JUP Token
Jupiter's governance token. Stake JUP to earn rewards and participate in governance voting.

## Networks

| Network | RPC Endpoint | Chain ID |
|---------|--------------|----------|
| Solana Mainnet | https://api.mainnet-beta.solana.com | 101 |
| Solana Devnet | https://api.devnet.solana.com | 102 |

## Error Handling

The node handles common errors:

| Error | Description | Solution |
|-------|-------------|----------|
| NO_ROUTES_FOUND | No swap route available | Try different token pair or smaller amount |
| SLIPPAGE_EXCEEDED | Price moved beyond tolerance | Increase slippage or retry |
| INSUFFICIENT_BALANCE | Not enough tokens | Check wallet balance |
| RATE_LIMITED | API rate limit hit | Wait and retry |
| TRANSACTION_FAILED | Solana transaction failed | Check logs, retry with higher priority fee |
| INVALID_MINT | Invalid token address | Verify token mint address |

## Security Best Practices

1. **Private Keys**: Store securely using n8n credentials, never in workflows
2. **Slippage**: Set appropriate slippage to prevent sandwich attacks
3. **Simulation**: Always simulate transactions before executing large trades
4. **Token Verification**: Use Jupiter's strict token list for verified tokens
5. **RPC Endpoints**: Use reliable RPC providers for mainnet operations
6. **Priority Fees**: Set appropriate fees during high congestion

## Development

```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build project
npm run build

# Development mode (watch)
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Support

- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-jupiter/issues)
- **Documentation**: [Jupiter Docs](https://station.jup.ag/docs)
- **Discord**: [Jupiter Discord](https://discord.gg/jup)

## Acknowledgments

- [Jupiter](https://jup.ag) - Solana's leading DEX aggregator
- [Solana](https://solana.com) - High-performance blockchain
- [n8n](https://n8n.io) - Workflow automation platform
