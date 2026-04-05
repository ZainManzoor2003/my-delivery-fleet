// services/paymentService.ts

export interface CardPaymentRequest {
    businessId: string;
    paymentMethodId: string;
    billingAddress?: {
        address: string;
        street: string;
        apartment?: string;
        city: string;
        state: string;
        postalCode: string;
        latitude?: number;
        longitude?: number;
    };
}

export interface CardPaymentResponse {
    success: boolean;
    stripeCustomerId?: string;
    paymentMethodId?: string;
    cardBrand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    verified?: boolean;
    verificationChecks?: {
        cvcCheck?: string;
        avsCheck?: string;
    };
    savedToDatabase?: boolean;
    message?: string;
    // 3D Secure fields
    requiresAction?: boolean;
    clientSecret?: string;
    nextActionType?: string;
    // Error fields
    error?: string;
    code?: string;
    type?: string;
}

export interface FinancialConnectionsSessionRequest {
    businessId: string;
}

export interface FinancialConnectionsSessionResponse {
    success: boolean;
    clientSecret?: string;
    sessionId?: string;
    stripeCustomerId?: string;
    message?: string;
    error?: string;
}

export interface FinancialConnectionsCompleteRequest {
    businessId: string;
    customerId: string;
    financialConnectionsAccountId: string;
    accountHolderName: string;
}

export interface FinancialConnectionsCompleteResponse {
    success: boolean;
    paymentMethodId?: string;
    bankName?: string;
    last4?: string;
    accountType?: string;
    verified?: boolean;
    ownershipVerified?: boolean;
    balanceInfo?: {
        available: number;
        current: number;
        asOf?: number;
    };
    financialConnectionsAccountId?: string;
    savedToDatabase?: boolean;
    message?: string;
    error?: string;
    code?: string;
}

export async function setupCardPayment(
    data: CardPaymentRequest
): Promise<CardPaymentResponse> {
    try {
        const response = await fetch('/api/payment-method/setup-card-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to verify card');
        }

        return result;
    } catch (error: unknown) {
        console.error('Card setup error:', error);
        throw error;
    }
}

export async function createFinancialConnectionsSession(
    data: FinancialConnectionsSessionRequest
): Promise<FinancialConnectionsSessionResponse> {
    try {
        const response = await fetch('/api/payment-method/financial-accounts/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to initialize bank connection');
        }

        return result;
    } catch (error: unknown) {
        console.error('Financial Connections session error:', error);
        throw error;
    }
}

export async function completeFinancialConnections(
    data: FinancialConnectionsCompleteRequest
): Promise<FinancialConnectionsCompleteResponse> {
    try {
        const response = await fetch('/api/payment-method/financial-accounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to complete bank setup');
        }

        return result;
    } catch (error: unknown) {
        console.error('Financial Connections completion error:', error);
        throw error;
    }
}

export function formatBalance(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export function getVerificationCheckText(check?: string): string {
    if (!check) return 'N/A';

    switch (check) {
        case 'pass':
            return 'Passed';
        case 'fail':
            return 'Failed';
        case 'unavailable':
            return 'Unavailable';
        case 'unchecked':
            return 'Not Checked';
        default:
            return check;
    }
}
