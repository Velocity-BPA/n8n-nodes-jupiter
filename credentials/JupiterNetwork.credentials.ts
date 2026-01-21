/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Jupiter Network Credentials
 * Configures Solana network connection and wallet for Jupiter operations
 */
export class JupiterNetwork implements ICredentialType {
  name = 'jupiterNetwork';
  displayName = 'Jupiter Network';
  documentationUrl = 'https://docs.jup.ag/docs/apis/getting-started';

  properties: INodeProperties[] = [
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Solana Mainnet',
          value: 'mainnet',
        },
        {
          name: 'Solana Devnet',
          value: 'devnet',
        },
        {
          name: 'Custom Endpoint',
          value: 'custom',
        },
      ],
      default: 'mainnet',
      description: 'The Solana network to connect to',
    },
    {
      displayName: 'RPC Endpoint URL',
      name: 'rpcEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://api.mainnet-beta.solana.com',
      description:
        'Custom RPC endpoint URL. If not provided, default endpoint for selected network will be used.',
      displayOptions: {
        show: {
          network: ['custom'],
        },
      },
    },
    {
      displayName: 'Private Key',
      name: 'privateKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      placeholder: 'Base58 encoded private key or JSON array',
      description:
        'Wallet private key for signing transactions. Can be base58 encoded string or JSON array of bytes.',
      hint: 'Required for operations that need transaction signing (swaps, orders, etc.)',
    },
    {
      displayName: 'Commitment Level',
      name: 'commitment',
      type: 'options',
      options: [
        {
          name: 'Processed',
          value: 'processed',
          description: 'Query the most recent block',
        },
        {
          name: 'Confirmed',
          value: 'confirmed',
          description: 'Query a recent block that has been voted on by supermajority',
        },
        {
          name: 'Finalized',
          value: 'finalized',
          description: 'Query a block that has been finalized by supermajority',
        },
      ],
      default: 'confirmed',
      description: 'The level of commitment for transaction confirmation',
    },
    {
      displayName: 'Custom Jupiter Endpoint',
      name: 'jupiterEndpoint',
      type: 'string',
      default: '',
      placeholder: 'https://quote-api.jup.ag/v6',
      description: 'Custom Jupiter API endpoint. Leave empty to use the default public endpoint.',
    },
    {
      displayName: 'Skip Preflight',
      name: 'skipPreflight',
      type: 'boolean',
      default: false,
      description:
        'Whether to skip preflight transaction checks for faster submission (use with caution)',
    },
    {
      displayName: 'Max Retries',
      name: 'maxRetries',
      type: 'number',
      default: 3,
      description: 'Maximum number of retries for failed transactions',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.jupiterEndpoint || "https://quote-api.jup.ag/v6"}}',
      url: '/program-id-to-label',
      method: 'GET',
    },
  };
}
