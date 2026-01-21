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
 * Jupiter API Credentials
 * Configures Jupiter API access for rate-limited and premium endpoints
 */
export class JupiterApi implements ICredentialType {
  name = 'jupiterApi';
  displayName = 'Jupiter API';
  documentationUrl = 'https://docs.jup.ag/docs/apis/getting-started';

  properties: INodeProperties[] = [
    {
      displayName: 'API Endpoint',
      name: 'apiEndpoint',
      type: 'options',
      options: [
        {
          name: 'Public (quote-api.jup.ag)',
          value: 'https://quote-api.jup.ag/v6',
        },
        {
          name: 'Price API (price.jup.ag)',
          value: 'https://price.jup.ag/v6',
        },
        {
          name: 'Token API (tokens.jup.ag)',
          value: 'https://tokens.jup.ag',
        },
        {
          name: 'Stats API (stats.jup.ag)',
          value: 'https://stats.jup.ag',
        },
        {
          name: 'Custom Endpoint',
          value: 'custom',
        },
      ],
      default: 'https://quote-api.jup.ag/v6',
      description: 'The Jupiter API endpoint to use',
    },
    {
      displayName: 'Custom API URL',
      name: 'customApiUrl',
      type: 'string',
      default: '',
      placeholder: 'https://your-custom-api.example.com',
      description: 'Custom API URL when using custom endpoint',
      displayOptions: {
        show: {
          apiEndpoint: ['custom'],
        },
      },
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'API key for authenticated requests. Leave empty for public API access (rate limited).',
    },
    {
      displayName: 'Rate Limit Tier',
      name: 'rateLimitTier',
      type: 'options',
      options: [
        {
          name: 'Free (Public)',
          value: 'free',
          description: '10 requests per second',
        },
        {
          name: 'Basic',
          value: 'basic',
          description: '50 requests per second',
        },
        {
          name: 'Pro',
          value: 'pro',
          description: '200 requests per second',
        },
        {
          name: 'Enterprise',
          value: 'enterprise',
          description: 'Custom rate limits',
        },
      ],
      default: 'free',
      description: 'Your API rate limit tier for request throttling',
    },
    {
      displayName: 'Request Timeout (ms)',
      name: 'timeout',
      type: 'number',
      default: 30000,
      description: 'Request timeout in milliseconds',
    },
    {
      displayName: 'Retry On Rate Limit',
      name: 'retryOnRateLimit',
      type: 'boolean',
      default: true,
      description: 'Whether to automatically retry requests when rate limited',
    },
    {
      displayName: 'Max Rate Limit Retries',
      name: 'maxRateLimitRetries',
      type: 'number',
      default: 3,
      description: 'Maximum number of retries on rate limit errors',
      displayOptions: {
        show: {
          retryOnRateLimit: [true],
        },
      },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{$credentials.apiKey ? "Bearer " + $credentials.apiKey : ""}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL:
        '={{$credentials.apiEndpoint === "custom" ? $credentials.customApiUrl : $credentials.apiEndpoint}}',
      url: '/tokens',
      method: 'GET',
    },
  };
}
