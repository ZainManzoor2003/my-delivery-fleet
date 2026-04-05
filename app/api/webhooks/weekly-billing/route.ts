// app/api/webhooks/weekly-billing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
	getPreviousWeekRange,
	processAllBusinessesWeeklyBilling,
} from '@/services/billingService';

export async function POST(req: NextRequest) {
	try {
		const authHeader = req.headers.get('authorization');

		if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
			return NextResponse.json({
				message: 'Unauthorized',
			}, { status: 401 });
		}

		console.log('WEEKLY BILLING: Starting weekly billing process');

		const { weekStart, weekEnd } = getPreviousWeekRange();

		console.log('WEEKLY BILLING: Billing period:', weekStart.toISOString(), 'to', weekEnd.toISOString());

		const results = await processAllBusinessesWeeklyBilling(weekStart, weekEnd);

		console.log(`WEEKLY BILLING: Completed processing ${results.length} businesses`);

		// Calculate summary statistics
		const successful = results.filter(r => r.success).length;
		const failed = results.filter(r => !r.success).length;
		const totalAmount = results.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
		const totalOrders = results.reduce((sum, r) => sum + (r.totalOrders || 0), 0);

		return NextResponse.json({
			success: failed === 0,
			message: `Weekly billing completed. ${successful} successful, ${failed} failed`,
			results,
			summary: {
				totalProcessed: results.length,
				successful,
				failed,
				totalAmount,
				totalOrders,
			},
			weekStart,
			weekEnd,
			processedAt: new Date().toISOString(),
			complete: true,
		});

	} catch (error: any) {
		console.error('WEEKLY BILLING: Critical error:', error);
		return NextResponse.json({
			success: false,
			message: 'Failed to process weekly billing',
			error: error.message,
			processedAt: new Date().toISOString(),
		}, { status: 500 });
	}
}
