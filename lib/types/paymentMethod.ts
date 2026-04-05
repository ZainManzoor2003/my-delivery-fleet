import type { Address } from '@/lib/enums/address';

export interface PaymentMethodDetails {
    id: string;
    paymentType: string;
    // Card fields
    cardHolderName: string | null;
    cardLast4: string | null;
    cardBrand: string | null;
    cardExpMonth: number | null;
    cardExpYear: number | null;
    // ACH fields
    achAccountHolderName: string | null;
    achBankName: string | null;
    achAccountLast4: string | null;
    achAccountType: string | null;
    // Verification
    isVerified: boolean;
    ownershipVerified: boolean | null;
    // Billing address — present for card, null for ACH
    billingAddress: Address | null;
}

export interface PaymentMethodApiResponse {
    success: boolean;
    paymentMethod: PaymentMethodDetails | null;
    error?: string;
}
