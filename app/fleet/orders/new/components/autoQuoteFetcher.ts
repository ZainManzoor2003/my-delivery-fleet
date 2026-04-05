import { useGetDeliveryQuote } from "@/app/hooks/useOrder";
import { DeliveryType } from "@/lib/enums/deliveryType";
import { convertLocalToUTC } from "@/lib/timezone";
import { OrderItem } from "@/lib/types/order";
import { useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

export interface QuoteWatchedValues {
    phoneNumber: string;
    customerSubTotal: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    address: string;
    latitude: number;
    longitude: number;
    items: OrderItem[];
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryType: string;
    isCatering?: boolean;
}


export interface AutoQuoteProps {
    values: QuoteWatchedValues;
    deliveryType: DeliveryType;
    businessId: string | null | undefined;
    onQuote: (quote: { id: string; fee: number; expires?: string } | null) => void;
    getDeliveryQuote: ReturnType<typeof useGetDeliveryQuote>;
    skipInitialFetch?: boolean;
    quoteExpiry?: string;
}

export function allMandatoryFieldsFilled(v: QuoteWatchedValues, deliveryType: DeliveryType): boolean {
    if (!v.phoneNumber || v.phoneNumber.length < 14) return false;
    if (!v.customerSubTotal || Number(v.customerSubTotal) <= 0) return false;
    if (!v.street?.trim() || v.street.trim().length < 5) return false;
    if (!v.city?.trim() || v.city.trim().length < 2) return false;
    if (!v.state?.trim() || v.state.trim().length < 2) return false;
    if (!v.postalCode?.trim() || !/^\d{5,9}$/.test(v.postalCode.trim())) return false;
    if (!v.address?.trim() || v.address.trim().length < 5) return false;
    if (!v.latitude || !v.longitude) return false;
    if (!v.items || v.items.length < 1) return false;
    if (!v.items.every(i => i.name?.trim() && Number(i.quantity) >= 1)) return false;
    if (deliveryType === DeliveryType.SCHEDULE) {
        if (!v.deliveryDate) return false;
        if (!v.deliveryTime) return false;
    }
    return true;
}

export function AutoQuoteFetcher({ values, deliveryType, businessId, onQuote, getDeliveryQuote, skipInitialFetch, quoteExpiry }: AutoQuoteProps) {
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isFirstFetchRef = useRef<boolean>(true);

    const canFetch = allMandatoryFieldsFilled(values, deliveryType) && !!businessId;

    const itemsString = values.items?.map(i => `${i.name}:${i.quantity}`).join(',') || '';

    const prevKeyRef = useRef<string>(skipInitialFetch ? JSON.stringify({
        canFetch,
        phoneNumber: values.phoneNumber,
        customerSubTotal: values.customerSubTotal,
        street: values.street,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        deliveryDate: values.deliveryDate,
        deliveryTime: values.deliveryTime,
        deliveryType,
        isCatering: values.isCatering,
        items: itemsString,
    }) : '');

    const fetchQuote = useCallback(async () => {
        if (!canFetch || !businessId) return;
        try {
            const estimatedPickupTime =
                deliveryType === DeliveryType.SCHEDULE && values.deliveryDate && values.deliveryTime
                    ? (convertLocalToUTC(values.deliveryDate, values.deliveryTime) ?? undefined)
                    : undefined;

            const result = await getDeliveryQuote.mutateAsync({
                businessId,
                deliveryAddress: {
                    street: values.street,
                    apartment: undefined,
                    city: values.city,
                    state: values.state,
                    postalCode: values.postalCode,
                    latitude: values.latitude || undefined,
                    longitude: values.longitude || undefined,
                },
                customerSubTotal: values.customerSubTotal,
                deliveryType,
                estimatedPickupTime,
                isCatering: values.isCatering,
            });
            onQuote({ id: result.quote.id, fee: result.quote.fee, expires: result.quote.expires });
        } catch (error: any) {
            toast.error(error.message || 'Failed to fetch quote');
            onQuote(null);
        }
    }, [
        canFetch, businessId, deliveryType, getDeliveryQuote, onQuote,
        values.street, values.city, values.state, values.postalCode,
        values.latitude, values.longitude,
        values.deliveryDate, values.deliveryTime,
        values.customerSubTotal, values.isCatering,
    ]);

    // Re-fetch automatically when the current quote expires
    useEffect(() => {
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

        if (!quoteExpiry || !canFetch) return;

        const msUntilExpiry = new Date(quoteExpiry).getTime() - Date.now();
        if (msUntilExpiry <= 0) {
            fetchQuote();
            return;
        }

        expiryTimerRef.current = setTimeout(() => {
            fetchQuote();
        }, msUntilExpiry);

        return () => {
            if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        };
    }, [quoteExpiry]);

    useEffect(() => {
        const key = JSON.stringify({
            canFetch,
            phoneNumber: values.phoneNumber,
            customerSubTotal: values.customerSubTotal,
            street: values.street,
            city: values.city,
            state: values.state,
            postalCode: values.postalCode,
            address: values.address,
            latitude: values.latitude,
            longitude: values.longitude,
            deliveryDate: values.deliveryDate,
            deliveryTime: values.deliveryTime,
            deliveryType,
            isCatering: values.isCatering,
            items: itemsString,
        });

        if (key === prevKeyRef.current) return;
        prevKeyRef.current = key;

        if (!canFetch) return;

        const delay = (skipInitialFetch && isFirstFetchRef.current) ? 0 : 800;
        isFirstFetchRef.current = false;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(fetchQuote, delay);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [
        canFetch, fetchQuote, skipInitialFetch,
        values.phoneNumber, values.customerSubTotal,
        values.street, values.city, values.state, values.postalCode,
        values.address, values.latitude, values.longitude,
        values.deliveryDate, values.deliveryTime,
        deliveryType, itemsString, values.isCatering,
    ]);

    return null;
}
