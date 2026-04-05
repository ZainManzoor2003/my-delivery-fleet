import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import { InvoiceStatus } from '@/lib/enums/invoice'
import { TransactionStatus } from '@/lib/enums/transaction'

export async function POST(req: NextRequest) {
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: any

    try {
        const body = await req.text()
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentUpdate(event.data.object, TransactionStatus.SUCCEEDED, InvoiceStatus.Paid)
                break
            case 'payment_intent.processing':
                await handlePaymentIntentUpdate(event.data.object, TransactionStatus.PROCESSED, InvoiceStatus.Processed)
                break
            default:
                await handlePaymentIntentUpdate(event.data.object, TransactionStatus.FAILED, InvoiceStatus.Failed)
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('Webhook processing error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

async function handlePaymentIntentUpdate(
    paymentIntent: any,
    transactionStatus: TransactionStatus,
    invoiceStatus: InvoiceStatus
) {
    // Find transaction by stripe charge ID
    const transaction = await prisma.transaction.findFirst({
        where: {
            stripePaymentIntentId: paymentIntent.id
        },
        include: {
            invoice: true
        }
    })

    if (!transaction) {
        console.log('No transaction found for payment intent:', paymentIntent.id)
        return
    }

    // Skip update if transaction is already in a final state
    if (transaction.status === TransactionStatus.SUCCEEDED || transactionStatus === TransactionStatus.FAILED) {
        console.log(`Transaction ${transaction.id} is already in final state: ${transaction.status}`)
        return
    }

    // Update transaction status
    await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: transactionStatus }
    })

    // Update invoice status if transaction has an invoice
    if (transaction.invoiceId) {
        await prisma.invoice.update({
            where: { id: transaction.invoiceId },
            data: { status: invoiceStatus }
        })
    }

    console.log(`Updated transaction ${transaction.id} to ${transactionStatus} and invoice ${transaction.invoiceId} to ${invoiceStatus}`)
}
