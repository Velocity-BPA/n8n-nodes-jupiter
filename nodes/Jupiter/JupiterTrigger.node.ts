/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Jupiter Trigger Node
 * Monitors Jupiter events and triggers workflows
 */

import {
  INodeType,
  INodeTypeDescription,
  IPollFunctions,
  INodeExecutionData,
} from 'n8n-workflow';
import { createJupiterClient } from './transport/jupiterClient';

// Log licensing notice once
let licensingNoticeLogged = false;
function logLicensingNotice(): void {
  if (!licensingNoticeLogged) {
    console.log('[Velocity BPA Licensing Notice] This n8n node is licensed under the Business Source License 1.1 (BSL 1.1). Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA. For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.');
    licensingNoticeLogged = true;
  }
}

export class JupiterTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Jupiter Trigger',
    name: 'jupiterTrigger',
    icon: 'file:jupiter.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Triggers on Jupiter events (swaps, orders, prices, etc.)',
    defaults: {
      name: 'Jupiter Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'jupiterApi',
        required: false,
      },
      {
        name: 'jupiterNetwork',
        required: false,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Event Type',
        name: 'event',
        type: 'options',
        options: [
          {
            name: 'Price Alert',
            value: 'priceAlert',
            description: 'Trigger when price reaches a threshold',
          },
          {
            name: 'New Token',
            value: 'newToken',
            description: 'Trigger when new tokens are listed',
          },
          {
            name: 'Price Change',
            value: 'priceChange',
            description: 'Trigger on significant price changes',
          },
        ],
        default: 'priceAlert',
        description: 'The event type to monitor',
      },
      // Price Alert Options
      {
        displayName: 'Token Mint',
        name: 'tokenMint',
        type: 'string',
        default: 'So11111111111111111111111111111111111111112',
        description: 'Token mint address to monitor',
        displayOptions: {
          show: {
            event: ['priceAlert', 'priceChange'],
          },
        },
      },
      {
        displayName: 'Condition',
        name: 'condition',
        type: 'options',
        options: [
          { name: 'Price Above', value: 'above' },
          { name: 'Price Below', value: 'below' },
        ],
        default: 'above',
        displayOptions: {
          show: {
            event: ['priceAlert'],
          },
        },
      },
      {
        displayName: 'Price Threshold (USD)',
        name: 'priceThreshold',
        type: 'number',
        default: 100,
        description: 'Price threshold in USD',
        displayOptions: {
          show: {
            event: ['priceAlert'],
          },
        },
      },
      {
        displayName: 'Change Percent',
        name: 'changePercent',
        type: 'number',
        default: 5,
        description: 'Minimum percent change to trigger',
        displayOptions: {
          show: {
            event: ['priceChange'],
          },
        },
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    logLicensingNotice();

    const event = this.getNodeParameter('event', 0) as string;
    const staticData = this.getWorkflowStaticData('node') as Record<string, unknown>;

    try {
      const client = await createJupiterClient(this as unknown as Parameters<typeof createJupiterClient>[0]);

      switch (event) {
        case 'priceAlert':
          return pollPriceAlert.call(this, client, staticData);

        case 'priceChange':
          return pollPriceChange.call(this, client, staticData);

        case 'newToken':
          return pollNewTokens.call(this, client, staticData);

        default:
          return null;
      }
    } catch (error) {
      console.error('Jupiter Trigger error:', error);
      return null;
    }
  }
}

async function pollPriceAlert(
  this: IPollFunctions,
  client: Awaited<ReturnType<typeof createJupiterClient>>,
  staticData: Record<string, unknown>,
): Promise<INodeExecutionData[][] | null> {
  const tokenMint = this.getNodeParameter('tokenMint', 0) as string;
  const condition = this.getNodeParameter('condition', 0) as string;
  const threshold = this.getNodeParameter('priceThreshold', 0) as number;

  const prices = await client.getPrice(tokenMint);
  const priceData = prices[tokenMint];
  
  if (!priceData) {
    return null;
  }

  const currentPrice = priceData.price;
  const lastTriggeredPrice = staticData.lastTriggeredPrice as number | undefined;

  let shouldTrigger = false;
  if (condition === 'above' && currentPrice >= threshold) {
    if (!lastTriggeredPrice || lastTriggeredPrice < threshold) {
      shouldTrigger = true;
    }
  } else if (condition === 'below' && currentPrice <= threshold) {
    if (!lastTriggeredPrice || lastTriggeredPrice > threshold) {
      shouldTrigger = true;
    }
  }

  if (shouldTrigger) {
    staticData.lastTriggeredPrice = currentPrice;
    return [[{
      json: {
        event: 'priceAlert',
        tokenMint,
        condition,
        threshold,
        currentPrice,
        timestamp: new Date().toISOString(),
      },
    }]];
  }

  return null;
}

async function pollPriceChange(
  this: IPollFunctions,
  client: Awaited<ReturnType<typeof createJupiterClient>>,
  staticData: Record<string, unknown>,
): Promise<INodeExecutionData[][] | null> {
  const tokenMint = this.getNodeParameter('tokenMint', 0) as string;
  const changePercent = this.getNodeParameter('changePercent', 0) as number;

  const prices = await client.getPrice(tokenMint);
  const priceData = prices[tokenMint];
  
  if (!priceData) {
    return null;
  }

  const currentPrice = priceData.price;
  const lastPrice = staticData.lastPrice as number | undefined;

  if (lastPrice !== undefined) {
    const percentChange = ((currentPrice - lastPrice) / lastPrice) * 100;
    
    if (Math.abs(percentChange) >= changePercent) {
      staticData.lastPrice = currentPrice;
      return [[{
        json: {
          event: 'priceChange',
          tokenMint,
          previousPrice: lastPrice,
          currentPrice,
          percentChange,
          direction: percentChange > 0 ? 'up' : 'down',
          timestamp: new Date().toISOString(),
        },
      }]];
    }
  }

  staticData.lastPrice = currentPrice;
  return null;
}

async function pollNewTokens(
  this: IPollFunctions,
  client: Awaited<ReturnType<typeof createJupiterClient>>,
  staticData: Record<string, unknown>,
): Promise<INodeExecutionData[][] | null> {
  const tokens = await client.getTokenList();
  const knownTokens = (staticData.knownTokens as string[]) || [];
  
  const newTokens = tokens.filter(t => !knownTokens.includes(t.address));
  
  if (newTokens.length > 0) {
    // Update known tokens
    staticData.knownTokens = tokens.map(t => t.address);
    
    return [[...newTokens.slice(0, 10).map(token => ({
      json: {
        event: 'newToken',
        mint: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        logoURI: token.logoURI,
        timestamp: new Date().toISOString(),
      },
    }))]];
  }

  // Initialize known tokens on first run
  if (knownTokens.length === 0) {
    staticData.knownTokens = tokens.map(t => t.address);
  }

  return null;
}
