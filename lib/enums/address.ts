import { Decimal } from "@prisma/client/runtime/client";

export enum AddressType {
    BUSINESS = "BUSINESS",
    BILLING = "BILLING",
    DELIVERY = "DELIVERY",
}

export interface CreateAddressData {
    address: string;
    street: string; 
    apartment?: string | null;
    city: string;
    state: string;
    postalCode: string;
    latitude?: Decimal | null;
    longitude?: Decimal | null;
}

export interface Address extends CreateAddressData {
    id: string;
    type: AddressType;
}
