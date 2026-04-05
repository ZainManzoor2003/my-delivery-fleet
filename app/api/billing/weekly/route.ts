// app/api/billing/weekly/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
	getPreviousWeekRange,
	getCurrentWeekRange,
	getWeeklyOrders,
	processWeeklyBilling,
} from '@/services/billingService';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const businessId = searchParams.get('businessId');
		const weekRange = searchParams.get('weekRange'); // 'current' or 'previous' (default: previous)

		if (!businessId) {
			return NextResponse.json({
				success: false,
				message: 'Business ID is required',
			}, { status: 400 });
		}

		const { weekStart, weekEnd } = weekRange === 'current'
			? getCurrentWeekRange()
			: getPreviousWeekRange();

		const orders = await getWeeklyOrders(businessId, weekStart, weekEnd);

		const totals = {
			totalOrders: orders.length,
			totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
		};

		return NextResponse.json({
			success: true,
			businessId,
			weekRange: weekRange || 'previous',
			weekStart,
			weekEnd,
			totals,
			orders,
		});

	} catch (error: any) {
		console.error('Weekly billing preview error:', error);

		return NextResponse.json({
			success: false,
			message: 'Failed to get weekly billing preview',
			error: error.message,
		}, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const { businessIds, weekStart, weekEnd, weekRange } = await req.json();

		if (!businessIds || !Array.isArray(businessIds)) {
			return NextResponse.json({
				success: false,
				message: 'businessIds array is required',
			}, { status: 400 });
		}

		let billingStart, billingEnd;

		if (weekStart && weekEnd) {
			// Use custom date range
			billingStart = new Date(weekStart);
			billingEnd = new Date(weekEnd);
		} else if (weekRange === 'current') {
			// Use current week range
			const currentRange = getCurrentWeekRange();
			billingStart = currentRange.weekStart;
			billingEnd = currentRange.weekEnd;
		} else {
			// Default to previous week range
			const range = getPreviousWeekRange();
			billingStart = range.weekStart;
			billingEnd = range.weekEnd;
		}

		if (Number.isNaN(billingStart.getTime()) || Number.isNaN(billingEnd.getTime())) {
			return NextResponse.json({
				success: false,
				message: 'Invalid weekStart/weekEnd',
			}, { status: 400 });
		}

		const results = [];

		for (const businessId of businessIds) {
			const result = await processWeeklyBilling(businessId, billingStart, billingEnd);
			results.push({ businessId, ...result });

			await new Promise(resolve => setTimeout(resolve, 100));
		}

		const hasFailures = results.some((r: any) => r?.success === false);

		return NextResponse.json({
			success: !hasFailures,
			weekRange: weekRange || 'previous',
			weekStart: billingStart,
			weekEnd: billingEnd,
			results,
			processed: businessIds.length,
		});

	} catch (error: any) {
		console.error('Batch billing error:', error);
		return NextResponse.json({
			success: false,
			message: 'Failed to process batch billing',
			error: error.message,
		}, { status: 500 });
	}
}
