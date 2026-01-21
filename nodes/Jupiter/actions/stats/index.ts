// @ts-nocheck
/**
 * Stats Resource Actions
 * Operations for Jupiter protocol statistics - volume, usage, analytics
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';
import { createJupiterClient } from '../../transport/jupiterClient';

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stats'],
			},
		},
		options: [
			{
				name: 'Get Jupiter Stats',
				value: 'getJupiterStats',
				description: 'Get overall Jupiter protocol statistics',
				action: 'Get Jupiter stats',
			},
			{
				name: 'Get Volume Stats',
				value: 'getVolumeStats',
				description: 'Get trading volume statistics',
				action: 'Get volume stats',
			},
			{
				name: 'Get Swap Stats',
				value: 'getSwapStats',
				description: 'Get swap transaction statistics',
				action: 'Get swap stats',
			},
			{
				name: 'Get User Stats',
				value: 'getUserStats',
				description: 'Get user activity statistics',
				action: 'Get user stats',
			},
			{
				name: 'Get Protocol Revenue',
				value: 'getProtocolRevenue',
				description: 'Get protocol revenue statistics',
				action: 'Get protocol revenue',
			},
			{
				name: 'Get Daily Stats',
				value: 'getDailyStats',
				description: 'Get statistics for a specific day',
				action: 'Get daily stats',
			},
			{
				name: 'Get Weekly Stats',
				value: 'getWeeklyStats',
				description: 'Get statistics for a week',
				action: 'Get weekly stats',
			},
			{
				name: 'Get Monthly Stats',
				value: 'getMonthlyStats',
				description: 'Get statistics for a month',
				action: 'Get monthly stats',
			},
			{
				name: 'Get Top Tokens',
				value: 'getTopTokens',
				description: 'Get top traded tokens',
				action: 'Get top tokens',
			},
			{
				name: 'Get Top Routes',
				value: 'getTopRoutes',
				description: 'Get most popular swap routes',
				action: 'Get top routes',
			},
		],
		default: 'getJupiterStats',
	},
	// Date parameter for daily stats
	{
		displayName: 'Date',
		name: 'date',
		type: 'dateTime',
		default: '',
		description: 'The date to get statistics for',
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getDailyStats'],
			},
		},
	},
	// Week start date
	{
		displayName: 'Week Start Date',
		name: 'weekStart',
		type: 'dateTime',
		default: '',
		description: 'Start date of the week',
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getWeeklyStats'],
			},
		},
	},
	// Month/Year for monthly stats
	{
		displayName: 'Month',
		name: 'month',
		type: 'options',
		default: '1',
		options: [
			{ name: 'January', value: '1' },
			{ name: 'February', value: '2' },
			{ name: 'March', value: '3' },
			{ name: 'April', value: '4' },
			{ name: 'May', value: '5' },
			{ name: 'June', value: '6' },
			{ name: 'July', value: '7' },
			{ name: 'August', value: '8' },
			{ name: 'September', value: '9' },
			{ name: 'October', value: '10' },
			{ name: 'November', value: '11' },
			{ name: 'December', value: '12' },
		],
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getMonthlyStats'],
			},
		},
	},
	{
		displayName: 'Year',
		name: 'year',
		type: 'number',
		default: 2024,
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getMonthlyStats'],
			},
		},
	},
	// Options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['stats'],
				operation: ['getTopTokens', 'getTopRoutes', 'getVolumeStats', 'getUserStats'],
			},
		},
		options: [
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				description: 'Maximum number of results to return',
			},
			{
				displayName: 'Time Range',
				name: 'timeRange',
				type: 'options',
				default: '24h',
				options: [
					{ name: '24 Hours', value: '24h' },
					{ name: '7 Days', value: '7d' },
					{ name: '30 Days', value: '30d' },
					{ name: 'All Time', value: 'all' },
				],
				description: 'Time range for statistics',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const jupiterClient = await createJupiterClient.call(this);

	let result: Record<string, unknown>;

	switch (operation) {
		case 'getJupiterStats': {
			const stats = await jupiterClient.getProtocolStats();

			result = {
				totalVolume: stats.totalVolume,
				totalSwaps: stats.totalSwaps,
				totalUsers: stats.totalUsers,
				totalFees: stats.totalFees,
				volume24h: stats.volume24h,
				swaps24h: stats.swaps24h,
				activeUsers24h: stats.activeUsers24h,
				supportedTokens: stats.supportedTokens,
				supportedDexes: stats.supportedDexes,
				averageSwapSize: stats.averageSwapSize,
				lastUpdated: new Date().toISOString(),
			};
			break;
		}

		case 'getVolumeStats': {
			const options = this.getNodeParameter('options', index, {}) as {
				timeRange?: string;
			};
			const timeRange = options.timeRange || '24h';

			const volumeStats = await jupiterClient.getVolumeStats(timeRange);

			result = {
				timeRange,
				totalVolume: volumeStats.totalVolume,
				volumeByDex: volumeStats.volumeByDex,
				volumeByToken: volumeStats.volumeByToken,
				volumeTrend: volumeStats.trend,
				averageTradeSize: volumeStats.averageTradeSize,
				largestTrade: volumeStats.largestTrade,
				smallestTrade: volumeStats.smallestTrade,
			};
			break;
		}

		case 'getSwapStats': {
			const swapStats = await jupiterClient.getSwapStats();

			result = {
				totalSwaps: swapStats.totalSwaps,
				swaps24h: swapStats.swaps24h,
				swaps7d: swapStats.swaps7d,
				swaps30d: swapStats.swaps30d,
				averageSlippage: swapStats.averageSlippage,
				averagePriceImpact: swapStats.averagePriceImpact,
				successRate: swapStats.successRate,
				failureReasons: swapStats.failureReasons,
				averageRouteHops: swapStats.averageRouteHops,
			};
			break;
		}

		case 'getUserStats': {
			const options = this.getNodeParameter('options', index, {}) as {
				timeRange?: string;
			};
			const timeRange = options.timeRange || '24h';

			const userStats = await jupiterClient.getUserStats(timeRange);

			result = {
				timeRange,
				totalUsers: userStats.totalUsers,
				activeUsers: userStats.activeUsers,
				newUsers: userStats.newUsers,
				returningUsers: userStats.returningUsers,
				averageSwapsPerUser: userStats.averageSwapsPerUser,
				averageVolumePerUser: userStats.averageVolumePerUser,
				topUsers: userStats.topUsers || [],
			};
			break;
		}

		case 'getProtocolRevenue': {
			const revenue = await jupiterClient.getProtocolRevenue();

			result = {
				totalRevenue: revenue.totalRevenue,
				revenue24h: revenue.revenue24h,
				revenue7d: revenue.revenue7d,
				revenue30d: revenue.revenue30d,
				revenueBySource: {
					swapFees: revenue.swapFees,
					referralFees: revenue.referralFees,
					perpFees: revenue.perpFees,
					jlpFees: revenue.jlpFees,
				},
				projectedMonthlyRevenue: revenue.projectedMonthlyRevenue,
			};
			break;
		}

		case 'getDailyStats': {
			const date = this.getNodeParameter('date', index) as string;
			const dateObj = date ? new Date(date) : new Date();
			const formattedDate = dateObj.toISOString().split('T')[0];

			const dailyStats = await jupiterClient.getDailyStats(formattedDate);

			result = {
				date: formattedDate,
				volume: dailyStats.volume,
				swaps: dailyStats.swaps,
				uniqueUsers: dailyStats.uniqueUsers,
				fees: dailyStats.fees,
				topTokens: dailyStats.topTokens,
				topPairs: dailyStats.topPairs,
				hourlyBreakdown: dailyStats.hourlyBreakdown,
			};
			break;
		}

		case 'getWeeklyStats': {
			const weekStart = this.getNodeParameter('weekStart', index) as string;
			const startDate = weekStart ? new Date(weekStart) : getStartOfWeek(new Date());
			const endDate = new Date(startDate);
			endDate.setDate(endDate.getDate() + 7);

			const weeklyStats = await jupiterClient.getWeeklyStats(
				startDate.toISOString().split('T')[0],
			);

			result = {
				weekStart: startDate.toISOString().split('T')[0],
				weekEnd: endDate.toISOString().split('T')[0],
				totalVolume: weeklyStats.totalVolume,
				totalSwaps: weeklyStats.totalSwaps,
				uniqueUsers: weeklyStats.uniqueUsers,
				fees: weeklyStats.fees,
				dailyBreakdown: weeklyStats.dailyBreakdown,
				volumeChange: weeklyStats.volumeChange,
				swapsChange: weeklyStats.swapsChange,
			};
			break;
		}

		case 'getMonthlyStats': {
			const month = parseInt(this.getNodeParameter('month', index) as string, 10);
			const year = this.getNodeParameter('year', index) as number;

			const monthlyStats = await jupiterClient.getMonthlyStats(year, month);

			result = {
				month,
				year,
				monthName: getMonthName(month),
				totalVolume: monthlyStats.totalVolume,
				totalSwaps: monthlyStats.totalSwaps,
				uniqueUsers: monthlyStats.uniqueUsers,
				fees: monthlyStats.fees,
				weeklyBreakdown: monthlyStats.weeklyBreakdown,
				topTokens: monthlyStats.topTokens,
				volumeChange: monthlyStats.volumeChange,
				swapsChange: monthlyStats.swapsChange,
			};
			break;
		}

		case 'getTopTokens': {
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
				timeRange?: string;
			};

			const topTokens = await jupiterClient.getTopTokens({
				limit: options.limit || 10,
				timeRange: options.timeRange || '24h',
			});

			result = {
				timeRange: options.timeRange || '24h',
				tokens: topTokens.map((token: Record<string, unknown>, idx: number) => ({
					rank: idx + 1,
					symbol: token.symbol,
					mint: token.mint,
					volume: token.volume,
					swaps: token.swaps,
					uniqueTraders: token.uniqueTraders,
					priceChange: token.priceChange,
				})),
			};
			break;
		}

		case 'getTopRoutes': {
			const options = this.getNodeParameter('options', index, {}) as {
				limit?: number;
				timeRange?: string;
			};

			const topRoutes = await jupiterClient.getTopRoutes({
				limit: options.limit || 10,
				timeRange: options.timeRange || '24h',
			});

			result = {
				timeRange: options.timeRange || '24h',
				routes: topRoutes.map((route: Record<string, unknown>, idx: number) => ({
					rank: idx + 1,
					inputToken: route.inputToken,
					outputToken: route.outputToken,
					volume: route.volume,
					swaps: route.swaps,
					averageSlippage: route.averageSlippage,
					preferredDexes: route.preferredDexes,
				})),
			};
			break;
		}

		default:
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
	}

	return [{ json: result, pairedItem: { item: index } }];
}

// Helper functions
function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1);
	d.setDate(diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getMonthName(month: number): string {
	const months = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December',
	];
	return months[month - 1] || 'Unknown';
}
