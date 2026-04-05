import { Decimal } from "@prisma/client/runtime/client";
import { CreateAddressData } from "../enums/address";
import { DeliveryType } from "../enums/deliveryType";

export enum OrderItemSize {
    Small = "small",
    Medium = "medium",
    Large = "large",
    xLarge = "xlarge"
}

export enum HandoffType {
    MEET_AT_DOOR = "deliverable_action_meet_at_door",
    LEAVE_AT_DOOR = "deliverable_action_leave_at_door",
}

export enum SurchargeType {
    BASE_QUOTE = "BASE_QUOTE",
    EXTENDED_QUOTE = "EXTENDED_QUOTE",
    CATERING = "CATERING",
    RETAIL = "RETAIL",
}

export enum OrderStatus {
    Unassigned = "unassigned",
    RequestingDriver = "requesting driver",
    Scheduled = 'scheduled',
    PickUp = "pickup",
    Delivery = "delivery",
    Delivered = "delivered",
    Canceled = "canceled",
    Returned = "returned"
}

export interface OrderItem {
    id: string | number;
    name: string;
    quantity: number;
    unitPrice?: number;
}

export interface Courier {
    id?: string;
    orderId: string;
    // Identity
    name?: string;
    phone?: string;
    photoUrl?: string;
    // Vehicle info
    vehicleType?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleColor?: string;
    licensePlate?: string;
    // Location
    latitude?: number;
    longitude?: number;
    isImminent?: boolean;  // true when courier is ~1 min away
    locationUpdatedAt?: Date;
}

export interface Order {
    id?: string,
    orderNumber?: string,
    businessId: string,
    description?: string,
    size?: string,
    // Customer
    customerName?: string,
    customerPhone?: string,
    customerEmail?: string,
    // Delivery address
    deliveryAddress?: CreateAddressData,
    // Meta / notes
    notes?: string,
    deliveryInstruction?: string,
    handoffType?: HandoffType,
    deliveryType?: DeliveryType,
    isCatering?: boolean,
    containsAlcohol?: boolean,
    // Provider
    provider?: "uber" | "doordash",
    providerDeliveryId?: string,
    trackingUrl?: string,
    providerQuoteId?: string,
    quoteExpiresAt?: Date | string | null,
    // Courier
    courier?: Courier,
    // Pricing
    customerDeliveryFee?: Decimal,
    deliveryFee?: Decimal,
    customerTip?: Decimal,
    driverTip?: Decimal,
    totalTip?: Decimal,
    discount?: Decimal,
    customerSubTotal?: Decimal,
    totalAmount?: Decimal,
    // Status / timing
    status: OrderStatus,
    estimatedDeliveryTime?: Date,
    estimatedPickupTime?: Date,
    deliveredAt?: Date
    driverRequestedAt?: Date
    driverAcceptedAt?: Date
    deliveryStartTime?: Date
    createdAt?: Date
    // Items
    items?: OrderItem[]

    deliveryDate?: string,
    deliveryTime?: string,
    isClearedFromTracking?: boolean,
}
