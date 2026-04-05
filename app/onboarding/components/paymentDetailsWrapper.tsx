'use client'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentDetails } from './paymentDetails';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function PaymentDetailsWrapper() {
    return (
        <Elements stripe={stripePromise}>
            <PaymentDetails />
        </Elements>
    );
}