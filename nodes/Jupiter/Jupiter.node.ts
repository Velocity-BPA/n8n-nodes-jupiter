/**
 * Jupiter DEX Aggregator Node for n8n
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import * as swap from './actions/swap';
import * as quote from './actions/quote';
import * as route from './actions/route';
import * as limitOrder from './actions/limitOrder';
import * as dca from './actions/dca';
import * as perpetuals from './actions/perpetuals';
import * as token from './actions/token';
import * as price from './actions/price';
import * as market from './actions/market';
import * as liquidity from './actions/liquidity';
import * as fee from './actions/fee';
import * as referral from './actions/referral';
import * as jlp from './actions/jlp';
import * as jupToken from './actions/jupToken';
import * as governance from './actions/governance';
import * as airdrop from './actions/airdrop';
import * as stats from './actions/stats';
import * as transaction from './actions/transaction';
import * as ultra from './actions/ultra';
import * as triggerOrder from './actions/triggerOrder';
import * as utility from './actions/utility';

// Emit licensing notice once on load
console.warn(`[Velocity BPA Licensing Notice]
This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`);

export class Jupiter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Jupiter',
		name: 'jupiter',
		icon: 'file:jupiter.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Jupiter DEX Aggregator on Solana',
		defaults: {
			name: 'Jupiter',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jupiterNetwork',
				required: true,
			},
			{
				name: 'jupiterApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Airdrop', value: 'airdrop' },
					{ name: 'DCA (Dollar Cost Average)', value: 'dca' },
					{ name: 'Fee', value: 'fee' },
					{ name: 'Governance', value: 'governance' },
					{ name: 'JLP (Liquidity Provider)', value: 'jlp' },
					{ name: 'JUP Token', value: 'jupToken' },
					{ name: 'Limit Order', value: 'limitOrder' },
					{ name: 'Liquidity', value: 'liquidity' },
					{ name: 'Market', value: 'market' },
					{ name: 'Perpetuals', value: 'perpetuals' },
					{ name: 'Price', value: 'price' },
					{ name: 'Quote', value: 'quote' },
					{ name: 'Referral', value: 'referral' },
					{ name: 'Route', value: 'route' },
					{ name: 'Stats', value: 'stats' },
					{ name: 'Swap', value: 'swap' },
					{ name: 'Token', value: 'token' },
					{ name: 'Transaction', value: 'transaction' },
					{ name: 'Trigger Order', value: 'triggerOrder' },
					{ name: 'Ultra', value: 'ultra' },
					{ name: 'Utility', value: 'utility' },
				],
				default: 'swap',
			},
			// Swap operations
			...swap.description,
			// Quote operations
			...quote.description,
			// Route operations
			...route.description,
			// Limit Order operations
			...limitOrder.description,
			// DCA operations
			...dca.description,
			// Perpetuals operations
			...perpetuals.description,
			// Token operations
			...token.description,
			// Price operations
			...price.description,
			// Market operations
			...market.description,
			// Liquidity operations
			...liquidity.description,
			// Fee operations
			...fee.description,
			// Referral operations
			...referral.description,
			// JLP operations
			...jlp.description,
			// JUP Token operations
			...jupToken.description,
			// Governance operations
			...governance.description,
			// Airdrop operations
			...airdrop.description,
			// Stats operations
			...stats.description,
			// Transaction operations
			...transaction.description,
			// Ultra operations
			...ultra.description,
			// Trigger Order operations
			...triggerOrder.description,
			// Utility operations
			...utility.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result: INodeExecutionData[];

				switch (resource) {
					case 'swap':
						result = await swap.execute.call(this, i, operation);
						break;
					case 'quote':
						result = await quote.execute.call(this, i, operation);
						break;
					case 'route':
						result = await route.execute.call(this, i, operation);
						break;
					case 'limitOrder':
						result = await limitOrder.execute.call(this, i, operation);
						break;
					case 'dca':
						result = await dca.execute.call(this, i, operation);
						break;
					case 'perpetuals':
						result = await perpetuals.execute.call(this, i, operation);
						break;
					case 'token':
						result = await token.execute.call(this, i, operation);
						break;
					case 'price':
						result = await price.execute.call(this, i, operation);
						break;
					case 'market':
						result = await market.execute.call(this, i, operation);
						break;
					case 'liquidity':
						result = await liquidity.execute.call(this, i, operation);
						break;
					case 'fee':
						result = await fee.execute.call(this, i, operation);
						break;
					case 'referral':
						result = await referral.execute.call(this, i, operation);
						break;
					case 'jlp':
						result = await jlp.execute.call(this, i, operation);
						break;
					case 'jupToken':
						result = await jupToken.execute.call(this, i, operation);
						break;
					case 'governance':
						result = await governance.execute.call(this, i, operation);
						break;
					case 'airdrop':
						result = await airdrop.execute.call(this, i, operation);
						break;
					case 'stats':
						result = await stats.execute.call(this, i, operation);
						break;
					case 'transaction':
						result = await transaction.execute.call(this, i, operation);
						break;
					case 'ultra':
						result = await ultra.execute.call(this, i, operation);
						break;
					case 'triggerOrder':
						result = await triggerOrder.execute.call(this, i, operation);
						break;
					case 'utility':
						result = await utility.execute.call(this, i, operation);
						break;
					default:
						throw new NodeOperationError(
							this.getNode(),
							`Unknown resource: ${resource}`,
							{ itemIndex: i },
						);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
