import { InvoiceStatus } from '@/lib/enums/invoice';
import { TransactionStatus, TransactionType } from '@/lib/enums/transaction';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { PaymentType } from '@/lib/enums/paymentType';
import { BusinessStatus } from '@/lib/types/business';
import { OrderStatus } from '@/lib/types/order';

export interface WeeklyBillingResult {
	success: boolean;
	invoiceId?: string;
	totalOrders: number;
	totalAmount: number;
	chargeId?: string;
	paymentStatus?: string;
	error?: string;
}

export interface BillingResultWithBusiness extends WeeklyBillingResult {
	businessId: string;
	businessName: string;
}

export interface OrderSummary {
	id: string;
	orderNumber: string;
	driverTip: number;
	customerTip: number;
	deliveryFee: number;
	customerDeliveryFee: number;
	totalAmount: number;
	deliveredAt: Date;
	providerQuote: number;
	serviceFee: number;
}

export interface CardCharges {
	cardCharges: number;
	totalWithCardCharges: number;
}

export function calculateCardCharges(amount: number, paymentType: PaymentType): CardCharges {
	const CARD_PROCESSING_FEE_RATE = 0.029; // 2.9%
	const CARD_PROCESSING_FIXED_FEE = 0.30; // 30¢ fixed fee

	if (paymentType === PaymentType.CARD) {
		const percentageFee = amount * CARD_PROCESSING_FEE_RATE;
		const cardCharges = percentageFee + CARD_PROCESSING_FIXED_FEE;
		return {
			cardCharges: Math.round(cardCharges * 100) / 100, // Round to 2 decimal places in dollars
			totalWithCardCharges: amount + cardCharges
		};
	}

	return {
		cardCharges: 0,
		totalWithCardCharges: amount
	};
}

export async function getWeeklyOrders(
	businessId: string,
	weekStart: Date,
	weekEnd: Date
): Promise<OrderSummary[]> {
	const orders = await prisma.order.findMany({
		where: {
			businessId,
			status: OrderStatus.Delivered,
			deliveredAt: {
				gte: weekStart,
				lte: weekEnd,
				not: null,
			},
			totalAmount: {
				not: null,
			},
		},
		select: {
			id: true,
			orderNumber: true,
			driverTip: true,
			customerTip: true,
			providerQuote: true,
			serviceFee: true,
			deliveryFee: true,
			customerDeliveryFee: true,
			totalAmount: true,
			deliveredAt: true,
		},
		orderBy: {
			deliveredAt: 'asc',
		},
	});

	return orders.map(order => ({
		...order,
		driverTip: Number(order.driverTip || 0),
		customerTip: Number(order.customerTip || 0),
		deliveryFee: Number(order.deliveryFee || 0),
		customerDeliveryFee: Number(order.customerDeliveryFee || 0),
		totalAmount: Number(order.totalAmount?.toNumber?.() || order.totalAmount || 0),
		deliveredAt: order.deliveredAt!,
		providerQuote: Number(order.providerQuote || 0),
		serviceFee: Number(order.serviceFee || 0),
	}));
}

export async function calculateWeeklyTotals(
	businessId: string,
	weekStart: Date,
	weekEnd: Date
): Promise<{
	totalOrders: number;
	totalAmount: number;
	totalDriverTips: number;
	totalCustomerTips: number;
	totalDeliveryFees: number;
	totalCustomerDeliveryFees: number;
	totalUberQuote: number;
	totalServiceCharges: number;
}> {
	const orders = await getWeeklyOrders(businessId, weekStart, weekEnd);

	const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
	const totalDriverTips = orders.reduce((sum, order) => sum + order.driverTip, 0);
	const totalCustomerTips = orders.reduce((sum, order) => sum + order.customerTip, 0);
	const totalDeliveryFees = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
	const totalCustomerDeliveryFees = orders.reduce((sum, order) => sum + order.customerDeliveryFee, 0);
	const totalUberQuote = orders.reduce((sum, order) => sum + order.providerQuote, 0);
	const totalServiceCharges = orders.reduce((sum, order) => sum + order.serviceFee, 0);

	return {
		totalOrders: orders.length,
		totalAmount,
		totalDriverTips,
		totalCustomerTips,
		totalDeliveryFees,
		totalCustomerDeliveryFees,
		totalUberQuote,
		totalServiceCharges,
	};
}

export async function getBusinessPaymentType(businessId: string): Promise<PaymentType | null> {
	const business = await prisma.business.findUnique({
		where: { id: businessId },
		include: {
			paymentMethod: true,
		},
	});

	return business?.paymentMethod?.paymentType as PaymentType || null;
}

export async function createWeeklyInvoice(
	businessId: string,
	weekStart: Date,
	weekEnd: Date,
	totals: {
		totalOrders: number;
		totalAmount: number;
		totalDriverTips: number;
		totalCustomerTips: number;
		totalDeliveryFees: number;
		totalCustomerDeliveryFees: number;
		totalUberQuote: number;
		totalServiceCharges: number;
	}
): Promise<{ invoiceId: string; totalAmount: number }> {
	const formatDate = (d: Date) => {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}${mm}${dd}`;
	};

	const invoiceNumber = `INV-${formatDate(weekStart)}-${formatDate(weekEnd)}-${String(businessId).slice(-6).toUpperCase()}`;

	const existingInvoice = await prisma.invoice.findUnique({
		where: { invoiceNumber },
		select: { id: true },
	});

	if (existingInvoice) {
		return {
			invoiceId: existingInvoice.id,
			totalAmount: totals.totalAmount,
		};
	}

	const paymentType = await getBusinessPaymentType(businessId);
	const cardChargeCalculation = calculateCardCharges(totals.totalAmount, paymentType as PaymentType);
	const finalAmount = cardChargeCalculation.totalWithCardCharges;

	const invoice = await prisma.invoice.create({
		data: {
			businessId,
			invoiceNumber,
			weekStart,
			weekEnd,
			totalOrders: totals.totalOrders,
			totalAmount: finalAmount,
			totalDriverTips: totals.totalDriverTips,
			totalCustomerTips: totals.totalCustomerTips,
			totalTips: totals.totalDriverTips + totals.totalCustomerTips,
			totalDeliveryFees: totals.totalDeliveryFees,
			totalCustomerDeliveryFees: totals.totalCustomerDeliveryFees,
			totalUberQuote: totals.totalUberQuote,
			totalServiceCharges: totals.totalServiceCharges,
			cardCharges: cardChargeCalculation.cardCharges,
			status: InvoiceStatus.Pending,
		},
	});

	return {
		invoiceId: invoice.id,
		totalAmount: finalAmount,
	};
}

export async function chargeBusinessForWeeklyBilling(
	businessId: string,
	amount: number,
	totalOrders: number,
	invoiceId: string,
	description: string
): Promise<WeeklyBillingResult> {
	try {
		const business = await prisma.business.findUnique({
			where: { id: businessId },
			include: {
				paymentMethod: true,
			},
		});

		if (!business) {
			return { success: false, error: 'Business not found', totalOrders: 0, totalAmount: 0 };
		}

		if (!business.paymentMethod) {
			return { success: false, error: 'No payment method on file', totalOrders: 0, totalAmount: 0 };
		}

		if (!business.paymentMethod.isVerified) {
			return { success: false, error: 'Payment method not verified', totalOrders: 0, totalAmount: 0 };
		}

		if (!business.stripeCustomerId) {
			return { success: false, error: 'No Stripe customer ID', totalOrders: 0, totalAmount: 0 };
		}

		const amountInCents = Math.round(amount * 100);

		// For ACH payments, refresh and check available balance
		if (
			business.paymentMethod.paymentType === PaymentType.ACH &&
			business.paymentMethod.financialConnectionsAccountId
		) {
			const fcAccount = await stripe.financialConnections.accounts.retrieve(
				business.paymentMethod.financialConnectionsAccountId,
				{ expand: ['balance'] }
			);

			if (fcAccount.status !== 'active') {
				return { success: false, error: 'Payment method is not active', totalOrders: 0, totalAmount: 0 };
			}

			const availableBalance = fcAccount.balance?.cash?.available?.usd ?? 0;

			// Update stored balance info
			await prisma.paymentMethod.update({
				where: { id: business.paymentMethod.id },
				data: {
					availableBalance: availableBalance,
					currentBalance: fcAccount.balance?.current?.usd ?? 0,
					lastBalanceCheck: new Date(),
				},
			});

			if (availableBalance < amountInCents) {
				return {
					success: false,
					error: `Insufficient balance. Available: $${(availableBalance / 100).toFixed(2)}, Required: $${amount.toFixed(2)}`,
					totalOrders: 0,
					totalAmount: 0,
				};
			}
		}

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amountInCents,
			currency: 'usd',
			customer: business.stripeCustomerId,
			payment_method: business.paymentMethod.stripePaymentMethodId,
			confirm: true,
			off_session: true,
			description,
			metadata: {
				invoiceId,
				businessId,
				billingType: 'weekly',
			},
		});

		const stripePaymentIntentId = paymentIntent.id;

		// Determine transaction and invoice status based on payment intent status
		const transactionStatus = paymentIntent.status === 'succeeded'
			? TransactionStatus.SUCCEEDED
			: paymentIntent.status === 'processing'
				? TransactionStatus.PROCESSED
				: TransactionStatus.FAILED; // Will be updated later when webhook confirms

		const invoiceStatus = paymentIntent.status === 'succeeded'
			? InvoiceStatus.Paid
			: paymentIntent.status === 'processing'
				? InvoiceStatus.Processed
				: InvoiceStatus.Failed; // Update to failed status immediately

		await prisma.transaction.create({
			data: {
				businessId,
				paymentMethodId: business.paymentMethod.id,
				type: TransactionType.SUBSCRIPTION,
				amount: amount,
				stripePaymentIntentId: stripePaymentIntentId,
				status: transactionStatus,
				invoiceId: invoiceId,
			},
		});

		await prisma.invoice.update({
			where: { id: invoiceId },
			data: { status: invoiceStatus },
		});

		// Return failure result for non-successful payments
		if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
			return {
				success: false,
				error: `Payment failed with status: ${paymentIntent.status}`,
				chargeId: stripePaymentIntentId,
				paymentStatus: paymentIntent.status,
				totalOrders: totalOrders,
				totalAmount: amount,
			} as WeeklyBillingResult;
		}

		return {
			success: true,
			chargeId: stripePaymentIntentId,
			paymentStatus: paymentIntent.status,
			totalOrders: totalOrders,
			totalAmount: amount,
		} as WeeklyBillingResult;

	} catch (error: any) {
		console.error('Weekly billing charge error:', error);

		// Suspend business on critical errors
		try {
			await prisma.business.update({
				where: { id: businessId },
				data: { status: BusinessStatus.SUSPENDED },
			});
			console.error(`Business ${businessId} suspended due to billing error: ${error.message}`);
		} catch (suspendError) {
			console.error('Failed to suspend business:', suspendError);
		}

		if (error?.code === 'authentication_required' || error?.code === 'payment_intent_authentication_failure') {
			return {
				success: false,
				error: 'Payment requires authentication. Please update the payment method.',
				totalOrders: 0,
				totalAmount: 0,
			};
		}

		try {
			await prisma.transaction.create({
				data: {
					businessId,
					type: TransactionType.SUBSCRIPTION,
					amount: amount,
					status: TransactionStatus.FAILED,
					invoiceId: invoiceId,
				},
			});
		} catch (txError) {
			console.error('Failed to record transaction:', txError);
		}

		return {
			success: false,
			error: error.message || 'Failed to process charge',
			totalOrders: 0,
			totalAmount: 0,
		};
	}
}

export async function processWeeklyBilling(
	businessId: string,
	weekStart: Date,
	weekEnd: Date
): Promise<WeeklyBillingResult> {
	try {
		const range = getPreviousWeekRange();
		const billingStart = weekStart instanceof Date ? weekStart : new Date(weekStart as any);
		const billingEnd = weekEnd instanceof Date ? weekEnd : new Date(weekEnd as any);
		const safeWeekStart = Number.isNaN(billingStart.getTime()) ? range.weekStart : billingStart;
		const safeWeekEnd = Number.isNaN(billingEnd.getTime()) ? range.weekEnd : billingEnd;

		// Calculate totals
		const totals = await calculateWeeklyTotals(businessId, safeWeekStart, safeWeekEnd);

		// Skip if no orders
		if (totals.totalOrders === 0) {
			return {
				success: true,
				totalOrders: 0,
				totalAmount: 0,
			};
		}

		// Skip if total amount is zero
		if (totals.totalAmount <= 0) {
			return {
				success: true,
				totalOrders: totals.totalOrders,
				totalAmount: 0,
			};
		}

		// Create invoice with card charges
		const invoiceResult = await createWeeklyInvoice(businessId, safeWeekStart, safeWeekEnd, totals);

		const existingInvoice = await prisma.invoice.findUnique({
			where: { id: invoiceResult.invoiceId },
			select: { status: true },
		});

		if (existingInvoice?.status === InvoiceStatus.Paid || existingInvoice?.status === InvoiceStatus.Processed) {
			return {
				success: true,
				invoiceId: invoiceResult.invoiceId,
				totalOrders: totals.totalOrders,
				totalAmount: invoiceResult.totalAmount,
				paymentStatus: existingInvoice.status === InvoiceStatus.Paid ? 'succeeded' : 'processing',
			};
		}

		// Charge business
		const description = `Weekly billing for ${totals.totalOrders} orders (${safeWeekStart.toLocaleDateString()} - ${safeWeekEnd.toLocaleDateString()})`;
		const chargeResult = await chargeBusinessForWeeklyBilling(
			businessId,
			invoiceResult.totalAmount,
			totals.totalOrders,
			invoiceResult.invoiceId,
			description
		);

		if (!chargeResult.success) {
			// Update invoice with failed status
			await prisma.invoice.update({
				where: { id: invoiceResult.invoiceId },
				data: { status: InvoiceStatus.Failed },
			});
			// Suspend business on payment failure
			try {
				await prisma.business.update({
					where: { id: businessId },
					data: { status: BusinessStatus.SUSPENDED },
				});
				console.error(`Business ${businessId} suspended due to payment failure`);
			} catch (suspendError) {
				console.error('Failed to suspend business:', suspendError);
			}

			return {
				success: false,
				totalOrders: totals.totalOrders,
				totalAmount: invoiceResult.totalAmount,
				error: chargeResult.error,
				paymentStatus: chargeResult.paymentStatus,
			};
		}

		// Mark orders as paid on successful payment
		if (chargeResult.success) {
			try {
				// Get all orders for this business within the billing period that haven't been paid yet
				const ordersToUpdate = await prisma.order.findMany({
					where: {
						businessId,
						status: OrderStatus.Delivered,
						deliveredAt: {
							gte: safeWeekStart,
							lte: safeWeekEnd,
						},
						paidAt: null,
					},
					select: { id: true },
				});

				if (ordersToUpdate.length > 0) {
					// Update all orders to mark them as paid
					await prisma.order.updateMany({
						where: {
							id: { in: ordersToUpdate.map(order => order.id) },
						},
						data: {
							paidAt: new Date(),
						},
					});
				}
			} catch (paidAtError) {
				console.error('Failed to update orders paidAt:', paidAtError);
			}
		}

		return {
			success: true,
			invoiceId: invoiceResult.invoiceId,
			totalOrders: totals.totalOrders,
			totalAmount: invoiceResult.totalAmount,
			chargeId: chargeResult.chargeId,
			paymentStatus: chargeResult.paymentStatus,
		};
	} catch (error: any) {
		console.error('Weekly billing processing error:', error);
		return {
			success: false,
			totalOrders: 0,
			totalAmount: 0,
			error: error.message || 'Failed to process weekly billing',
		};
	}
}

export async function processAllBusinessesWeeklyBilling(
	weekStart: Date,
	weekEnd: Date
): Promise<WeeklyBillingResult[]> {

	const businesses = await prisma.business.findMany({
		where: {
			status: BusinessStatus.APPROVED,
			paymentMethod: {
				isVerified: true,
				isActive: true,
			},
		},
		select: {
			id: true,
			name: true,
		},
	});

	const results: WeeklyBillingResult[] = [];

	for (const business of businesses) {
		const result = await processWeeklyBilling(business.id, weekStart, weekEnd);
		results.push(result);

		if (!result.success) {
			console.error(`✗ Failed to bill ${business.name}: ${result.error}`);
		}
	}

	return results;
}

export async function autoBillPendingInvoices(businessId: string): Promise<void> {
	const pendingInvoices = await prisma.invoice.findMany({
		where: {
			businessId,
			status: { in: [InvoiceStatus.Pending, InvoiceStatus.Failed] },
		},
		select: {
			id: true,
			totalAmount: true,
			totalOrders: true,
			weekStart: true,
			weekEnd: true,
		},
		orderBy: { weekStart: 'asc' },
	});

	if (pendingInvoices.length === 0) return;

	let anyFailed = false;

	for (const invoice of pendingInvoices) {
		const description = `Auto-billing for ${invoice.totalOrders} orders (${new Date(invoice.weekStart).toLocaleDateString()} - ${new Date(invoice.weekEnd).toLocaleDateString()})`;
		const result = await chargeBusinessForWeeklyBilling(
			businessId,
			Number(invoice.totalAmount),
			invoice.totalOrders,
			invoice.id,
			description
		);

		if (!result.success) {
			anyFailed = true;
		}
	}

	if (!anyFailed) {
		await prisma.business.update({
			where: { id: businessId },
			data: { status: BusinessStatus.APPROVED },
		});
	}
}

export function getPreviousWeekRange(): { weekStart: Date; weekEnd: Date } {
	const now = new Date();
	const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 3 = Wednesday, ..., 6 = Saturday

	// Calculate days since last Wednesday (always the previous completed week)
	let daysSinceWednesday;
	if (currentDay <= 3) {
		// If it's Wednesday or earlier, go back to last week
		daysSinceWednesday = (currentDay + 7) - 3;
	} else {
		// If it's after Wednesday, go back to this week's Wednesday
		daysSinceWednesday = currentDay - 3;
	}

	// Calculate start of previous week (last Wednesday at 12:00 AM UTC)
	const lastWednesday = new Date(now);
	lastWednesday.setUTCDate(now.getUTCDate() - daysSinceWednesday);
	lastWednesday.setUTCHours(0, 0, 0, 0); // 12:00 AM UTC (start of day)

	// Calculate end of previous week (this Tuesday at 11:59 PM UTC)
	const tuesdayEnd = new Date(lastWednesday);
	tuesdayEnd.setUTCDate(lastWednesday.getUTCDate() + 6); // Wednesday + 6 days = Tuesday
	tuesdayEnd.setUTCHours(23, 59, 59, 999); // 11:59 PM UTC (end of day)

	return {
		weekStart: lastWednesday,
		weekEnd: tuesdayEnd,
	};
}

export function getCurrentWeekRange(): { weekStart: Date; weekEnd: Date } {
	const now = new Date();
	const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

	// Calculate start of current week (this Sunday)
	const daysSinceSunday = currentDay;
	const thisSunday = new Date(now);
	thisSunday.setDate(now.getDate() - daysSinceSunday);
	thisSunday.setHours(0, 0, 0, 0);

	// Calculate end of current week (this Saturday)
	const thisSaturday = new Date(thisSunday);
	thisSaturday.setDate(thisSunday.getDate() + 6);
	thisSaturday.setHours(23, 59, 59, 999);

	return {
		weekStart: thisSunday,
		weekEnd: thisSaturday,
	};
}

