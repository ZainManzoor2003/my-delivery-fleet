import { Decimal } from "@prisma/client/runtime/client";
import { Address } from "../enums/address";

export interface CreateBusinessData {
    userId: string;
    name: string;
    pickupInstructions?: string;
    phone: string;
    address: {
        address: string;
        street: string;
        apartment?: string;
        city: string;
        state: string;
        postalCode: string;
        latitude?: number;
        longitude?: number;
    };
    referredByCode?: string;
    avgOrdersPerDay: number;
    deliveryRadius: number;
    logo?: string;
    type?: string;
}

export interface BusinessUpdateData {
    name?: string;
    phone?: string;
    routingPreference?: string;
    pickupInstructions?: string;
    type?: string;
    logo?: string;
    address?: {
        address: string;
        street: string;
        apartment?: string | null;
        city: string;
        state: string;
        postalCode: string;
        latitude?: number | null;
        longitude?: number | null;
    };
}

export interface PaymentMethod {
    id: string;
    paymentType: string;
    businessId: string;
    financialConnectionsAccountId: string | null;
    stripePaymentMethodId: string;
    cardHolderName: string | null;
    achAccountHolderName: string | null;
    billingAddress: Address | null;
}

export interface Business {
    id: string;
    name: string;
    phone: string;
    address: Address | null;
    routingPreference: string;
    pickupInstructions: string | null;
    referralCode: string;
    referredByCode: string | null;
    type: string;
    logo: string | null;
    avgOrdersPerDay: number | null;
    actualAvgOrdersPerDay?: number | null;
    deliveryRadius: Decimal | null;
    userId: string;
    status: BusinessStatus;
    stripeCustomerId: string;
    paymentMethod: PaymentMethod | null;
    surchargeBaseQuote?: Decimal;
    surchargeExtendedQuote?: Decimal;
    surchargeCatering?: Decimal;
    surchargeRetail?: Decimal;
    createdAt: Date;
    updatedAt: Date;
}

export enum BusinessStatus {
    INCOMPLETE = "INCOMPLETE",
    UNDER_REVIEW = "UNDER_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SUSPENDED = "SUSPENDED"
}
