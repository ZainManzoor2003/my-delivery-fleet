'use client'
import { ArrowLeft, Heart, Info, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useRef } from "react";
import OrderFormMap from "@/components/maps/orderFormMap";
import { orderSchema } from '@/validations/orderValidations'
import { Formik, Form, FormikErrors } from 'formik'
import { useCreateOrder, useUpdateOrder, useCreateOrderDelivery, useGetDeliveryQuote } from "@/app/hooks/useOrder";
import { Decimal } from "@prisma/client/runtime/client";
import { HandoffType, Order, OrderItem, OrderStatus } from '@/lib/types/order'
import CustomerInfo from "./customerInfo";
import DeliveryAddress from "./deliveryAddress";
import { useRouter, useSearchParams } from "next/navigation";
import ItemsTable from "../../components/itemsTable";
import { useUserStore } from "@/app/stores/userStore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ContainAlcoholModal from "./containAlcoholModal";
import Image from "next/image";
import { toast } from "react-toastify";
import ScheduleDelivery from "./scheduleDelivery";
import { DeliveryType } from "@/lib/enums/deliveryType";
import DollarInput from "../../components/dollarInput";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { convertLocalToUTC, convertUTCToLocalDate, convertUTCToLocalTime } from "@/lib/timezone";
import { QuoteWatchedValues, allMandatoryFieldsFilled, AutoQuoteFetcher } from "./autoQuoteFetcher";
import { BusinessType } from "@/lib/enums/businessType";

interface Props {
    order: Order | null;
}

export default function OrderForm({ order }: Props) {
    const createOrder = useCreateOrder();
    const updateOrder = useUpdateOrder();
    const createDelivery = useCreateOrderDelivery();
    const getDeliveryQuote = useGetDeliveryQuote();
    const { businessId, businessAddress, businessType } = useUserStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tipSectionRef = useRef<HTMLDivElement>(null);

    const from = searchParams?.get('from') ?? '';
    const getReturnPath = (orderId?: string | null) => {
        if (from === 'orders') return '/fleet/orders';
        return orderId ? `/fleet/live-tracking?orderId=${orderId}` : '/fleet/live-tracking';
    };
    const [isDispatching, setIsDispatching] = useState<boolean>(true);
    const [showAlcoholModal, setShowAlcoholModal] = useState<boolean>(false);
    const [pendingAlcoholEnable, setPendingAlcoholEnable] = useState<((val: boolean) => void) | null>(null);
    const [deliveryType, setDeliveryType] = useState<DeliveryType>(
        order?.deliveryType === DeliveryType.SCHEDULE ? DeliveryType.SCHEDULE : DeliveryType.ASAP
    );

    useEffect(() => {
        const scrollToTip = searchParams?.get('scrollToTip');
        if (scrollToTip === 'true' && tipSectionRef.current) {
            setTimeout(() => {
                tipSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                const url = new URL(window.location.href);
                url.searchParams.delete('scrollToTip');
                window.history.replaceState({}, '', url.toString());
            }, 100);
        }
    }, [searchParams]);

    const [quote, setQuote] = useState<{ id?: string; fee: number; expires?: string } | null>(
        order
            ? {
                id: order.providerQuoteId || undefined,
                fee: Number(order.deliveryFee) || 0,
                expires: order.quoteExpiresAt ? String(order.quoteExpiresAt) : undefined,
            }
            : null
    );

    const handleLocationSelect = (
        location: {
            lat: number; lng: number; address: string;
            street: string; apartment?: string;
            city: string; state: string; postalCode: string;
        },
        setValues: (values: any) => void
    ) => {
        setValues((prev: any) => {
            if (prev.latitude !== location.lat || prev.longitude !== location.lng) {
                setQuote(null);
            }
            return {
                ...prev,
                address: location.address,
                street: location.street,
                apartment: location.apartment || '',
                city: location.city,
                state: location.state,
                postalCode: location.postalCode,
                latitude: location.lat,
                longitude: location.lng,
            };
        });
    };

    const handleCreateOrder = async (
        values: {
            orderNumber?: string;
            customerName: string;
            phoneNumber: string;
            customerEmail?: string;
            deliveryInstruction?: string;
            handoffType: HandoffType | null;
            customerDeliveryFee: string;
            customerTip: string;
            driverTip?: string;
            customerSubTotal: string;
            address: string;
            street: string;
            apartment?: string | null;
            city: string;
            state: string;
            postalCode: string;
            latitude: number;
            longitude: number;
            items: OrderItem[];
            isCatering?: boolean;
            containsAlcohol?: boolean;
            deliveryDate?: string;
            deliveryTime?: string;
        },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!businessId) {
            toast.error('User does not have a business associated with their account');
            formikHelpers.setSubmitting(false);
            return;
        }

        try {
            const estimatedPickupTime: any =
                deliveryType === DeliveryType.SCHEDULE && values.deliveryDate && values.deliveryTime
                    ? convertLocalToUTC(values.deliveryDate, values.deliveryTime)
                    : undefined;

            const body = {
                businessId,
                orderNumber: values.orderNumber,
                customerName: values.customerName,
                customerPhone: values.phoneNumber,
                customerEmail: values.customerEmail,
                deliveryInstruction: values.deliveryInstruction,
                handoffType: values.handoffType as HandoffType,
                deliveryType,
                customerDeliveryFee: new Decimal(values.customerDeliveryFee || 0),
                customerTip: new Decimal(values.customerTip || 0),
                driverTip: new Decimal(values.driverTip || 0),
                status: deliveryType === DeliveryType.SCHEDULE ? OrderStatus.Scheduled : OrderStatus.Unassigned,
                customerSubTotal: new Decimal(values.customerSubTotal || 0),
                estimatedPickupTime,
                providerQuoteId: quote?.id || undefined,
                deliveryFee: Decimal(quote?.fee ?? 0),
                quoteExpiresAt: quote?.expires || null,
                isCatering: values.isCatering,
                containsAlcohol: values.containsAlcohol,
                deliveryAddress: {
                    address: values.address,
                    street: values.street,
                    apartment: values.apartment,
                    city: values.city,
                    state: values.state,
                    postalCode: values.postalCode,
                    latitude: new Decimal(values.latitude || 0),
                    longitude: new Decimal(values.longitude || 0),
                },
                items: values.items,
            };

            const result = await createOrder.mutateAsync(body);

            if (result.success) {
                if (isDispatching && result.orderId) {
                    try {
                        await createDelivery.mutateAsync({
                            orderId: result.orderId,
                            businessId,
                            quoteId: quote?.id,
                        });
                        toast.success('Order created and delivery dispatched successfully');
                        router.push(getReturnPath(result.orderId));
                    } catch (error) {
                        toast.error(`Order created but failed to create delivery${error instanceof Error ? ': ' + error.message : ''}`);
                        router.push(getReturnPath(result.orderId));
                    }
                    return;
                }
                toast.success('Order created successfully');
                router.push(getReturnPath(result.orderId));
            } else {
                toast.error('Failed to create order. Please try again.');
            }
        } catch (error: any) {
            if (error?.message) {
                console.error('Error creating order:', error);
                toast.error(`Failed to create order. ${error.message}`);
            }
        } finally {
            formikHelpers.setSubmitting(false);
        }
    };

    const handleUpdateOrder = async (values: any, formikHelpers: any) => {
        try {
            if (!businessId) {
                toast.error('User does not have a business associated with their account');
                formikHelpers.setSubmitting(false);
                return;
            }
            if (!order?.id) {
                toast.error('Order ID is missing');
                formikHelpers.setSubmitting(false);
                return;
            }

            const estimatedPickupTime: any =
                deliveryType === DeliveryType.SCHEDULE && values.deliveryDate && values.deliveryTime
                    ? convertLocalToUTC(values.deliveryDate, values.deliveryTime)
                    : undefined;

            const body = {
                businessId,
                orderNumber: values.orderNumber,
                customerName: values.customerName,
                customerPhone: values.phoneNumber,
                customerEmail: values.customerEmail,
                deliveryInstruction: values.deliveryInstruction,
                handoffType: values.handoffType,
                deliveryType,
                customerDeliveryFee: new Decimal(values.customerDeliveryFee || 0),
                customerTip: new Decimal(values.customerTip || 0),
                driverTip: new Decimal(values.driverTip || 0),
                status: deliveryType === DeliveryType.SCHEDULE ? OrderStatus.Scheduled : OrderStatus.Unassigned,
                customerSubTotal: new Decimal(values.customerSubTotal || 0),
                estimatedPickupTime,
                providerQuoteId: quote?.id || undefined,
                deliveryFee: Decimal(quote?.fee ?? 0),
                quoteExpiresAt: quote?.expires || null,
                isCatering: values.isCatering,
                containsAlcohol: values.containsAlcohol,
                deliveryAddress: {
                    address: values.address,
                    street: values.street,
                    apartment: values.apartment,
                    city: values.city,
                    state: values.state,
                    postalCode: values.postalCode,
                    latitude: values.latitude,
                    longitude: values.longitude,
                },
                items: values.items,
            };

            const result = await updateOrder.mutateAsync({ id: order.id, data: body as Order });

            if (isDispatching) {
                try {
                    await createDelivery.mutateAsync({ orderId: order.id, businessId, quoteId: quote?.id });
                    toast.success('Order updated and delivery created successfully');
                    router.push(getReturnPath(order.id));
                } catch (error) {
                    toast.error(`Failed to create delivery${error instanceof Error ? ': ' + error.message : ''}`);
                    formikHelpers.setSubmitting(false);
                    return;
                }
            } else {
                if (result.success) {
                    toast.success('Order updated successfully');
                    router.push(getReturnPath(order.id));
                } else {
                    toast.error(result.message || 'Failed to update order');
                }
            }
        } catch (error) {
            console.error('Update order error:', error);
            toast.error('Failed to update order');
        } finally {
            formikHelpers.setSubmitting(false);
        }
    };

    return (
        <>
            <div className="py-5 min-h-screen">
                <div className="px-4">
                    <div className="flex items-center justify-between flex-wrap">
                        <button className="flex items-center text-md font-medium text-text-sidebar">
                            <ArrowLeft
                                className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                                onClick={() => router.push('/fleet/orders')}
                            />
                            Back to Orders
                        </button>
                        <Button
                            type="button"
                            variant="outline"
                            className="text-[#EA332D] border-border hover:text-[#EA332D]/70 transition-colors"
                            onClick={() => router.push('/fleet/orders')}
                        >
                            Cancel Delivery
                        </Button>
                    </div>
                    <div className="py-5">
                        <div className="space-y-1">
                            <h1 className="text-xl font-medium text-text-sidebar">Create Delivery</h1>
                            <p className="text-md text-text-2 font-normal">Enter details for a new delivery request.</p>
                        </div>
                    </div>
                </div>

                <Formik
                    initialValues={{
                        orderNumber: order?.orderNumber || '',
                        customerName: order?.customerName || '',
                        phoneNumber: order?.customerPhone || '',
                        customerEmail: order?.customerEmail || '',
                        handoffType: order?.handoffType || null,
                        deliveryInstruction: order?.deliveryInstruction || '',
                        customerDeliveryFee: order?.customerDeliveryFee?.toString() || '',
                        customerTip: order?.customerTip?.toString() || '',
                        driverTip: order?.driverTip?.toString() || '',
                        customerSubTotal: order?.customerSubTotal?.toString() || '',
                        address: order?.deliveryAddress?.address || '',
                        street: order?.deliveryAddress?.street || '',
                        apartment: order?.deliveryAddress?.apartment || '',
                        city: order?.deliveryAddress?.city || '',
                        state: order?.deliveryAddress?.state || '',
                        postalCode: order?.deliveryAddress?.postalCode || '',
                        latitude: Number(order?.deliveryAddress?.latitude) || 0,
                        longitude: Number(order?.deliveryAddress?.longitude) || 0,
                        items: order?.items || (order ? [] : [{ id: `new_${crypto.randomUUID()}`, name: 'Food Item 1', quantity: 1, unitPrice: 0 }]),
                        deliveryDate: order?.estimatedPickupTime ? convertUTCToLocalDate(order.estimatedPickupTime.toString()) : '',
                        deliveryTime: order?.estimatedPickupTime ? convertUTCToLocalTime(order.estimatedPickupTime.toString()) : '',
                        deliveryType: deliveryType.toString(),
                        isCatering: false,
                        containsAlcohol: order?.containsAlcohol ?? false,
                    }}
                    validationSchema={isDispatching ? orderSchema : orderSchema.pick(['customerName', 'phoneNumber'])}
                    validateOnChange={true}
                    validateOnBlur={true}
                    enableReinitialize={false}
                    validateOnMount={true}
                    onSubmit={order ? handleUpdateOrder : handleCreateOrder}
                >
                    {({ values, handleSubmit, errors, touched, isSubmitting, setValues, setFieldValue, isValid }) => {
                        const calcSubTotal = (items: OrderItem[]) =>
                            items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0).toFixed(2);

                        const addItem = () => {
                            const updatedItems = [...values.items, { id: `new_${crypto.randomUUID()}`, name: `Food Item ${values.items.length + 1}`, quantity: 1, unitPrice: 0 }];
                            setFieldValue('items', updatedItems);
                        };

                        const handleItemDataChange = (id: number | string, field: string, value: any) => {
                            const updatedItems = values.items.map(item => item.id === id ? { ...item, [field]: value } : item);
                            setFieldValue('items', updatedItems);
                            setFieldValue('customerSubTotal', calcSubTotal(updatedItems));
                        };

                        const handleDeleteItem = (id: string | number) => {
                            if (values.items.length === 1) {
                                toast.warn('You must have at least one item in the order');
                                return;
                            }
                            const updatedItems = values.items.filter(item => item.id !== id);
                            setFieldValue('items', updatedItems);
                            setFieldValue('customerSubTotal', calcSubTotal(updatedItems));
                        };

                        const isQuoteFetching = getDeliveryQuote.isPending;

                        const watchedValues: QuoteWatchedValues = {
                            phoneNumber: values.phoneNumber,
                            customerSubTotal: values.customerSubTotal,
                            street: values.street,
                            city: values.city,
                            state: values.state,
                            postalCode: values.postalCode,
                            address: values.address,
                            latitude: values.latitude,
                            longitude: values.longitude,
                            items: values.items,
                            deliveryDate: values.deliveryDate,
                            deliveryTime: values.deliveryTime,
                            deliveryType: values.deliveryType,
                            isCatering: values.isCatering,
                        };

                        const canDispatch = allMandatoryFieldsFilled(watchedValues, deliveryType);

                        return (
                            <Form
                                onSubmit={handleSubmit}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); }
                                }}
                            >
                                {/* Headless component: auto-fetches / refreshes quote */}
                                <AutoQuoteFetcher
                                    values={watchedValues}
                                    deliveryType={deliveryType}
                                    businessId={businessId}
                                    onQuote={setQuote}
                                    getDeliveryQuote={getDeliveryQuote}
                                    skipInitialFetch={!!order}
                                    quoteExpiry={quote?.expires}
                                />

                                <div className="flex flex-col lg:flex-row px-4 gap-4">
                                    <div className="min-w-0 flex-[1.6] space-y-7 px-4 py-4 bg-background border border-border rounded-[20px]">
                                        <ScheduleDelivery
                                            values={{ deliveryDate: values.deliveryDate || '', deliveryTime: values.deliveryTime || '' }}
                                            onChange={(field, value) => setFieldValue(field, value)}
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                            deliveryType={deliveryType}
                                            setDeliveryType={(type) => {
                                                setDeliveryType(type);
                                                setQuote(null);
                                                setFieldValue('deliveryType', type.toString());
                                            }}
                                        />
                                        <Separator className="bg-border" />
                                        <CustomerInfo
                                            values={{
                                                orderNumber: values.orderNumber,
                                                customerEmail: values.customerEmail,
                                                customerName: values.customerName,
                                                phoneNumber: values.phoneNumber,
                                            }}
                                            onChange={(field, value) => setFieldValue(field, value)}
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                        />
                                        <Separator className="bg-border" />
                                        <DeliveryAddress
                                            values={{
                                                address: values.address,
                                                street: values.street,
                                                apartment: values.apartment,
                                                city: values.city,
                                                state: values.state,
                                                postalCode: values.postalCode,
                                                latitude: values.latitude,
                                                longitude: values.longitude,
                                                handoffType: values.handoffType,
                                                deliveryInstruction: values.deliveryInstruction,
                                            }}
                                            onChange={(field, value) => setFieldValue(field, value)}
                                            errors={errors}
                                            touched={touched}
                                            setFieldValue={setFieldValue}
                                            handleLocationSelect={(location) => handleLocationSelect(location, setValues)}
                                        />
                                        <Separator className="bg-border" />

                                        {businessType === BusinessType.RESTAURANT && (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="text-sm font-medium text-text-1">Catering Order</Label>
                                                    <p className="text-xs text-text-2 mt-0.5">Toggle on for catering deliveries</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={values.isCatering}
                                                    onClick={() => {
                                                        setFieldValue('isCatering', !values.isCatering);
                                                        setQuote(null);
                                                    }}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${values.isCatering ? 'bg-primary' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${values.isCatering ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium text-text-1">Contains Alcohol</Label>
                                                <p className="text-xs text-text-2 mt-0.5">Order includes alcoholic beverages</p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={values.containsAlcohol}
                                                onClick={() => {
                                                    if (!values.containsAlcohol) {
                                                        setPendingAlcoholEnable(() => (val: boolean) => setFieldValue('containsAlcohol', val));
                                                        setShowAlcoholModal(true);
                                                    } else {
                                                        setFieldValue('containsAlcohol', false);
                                                    }
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors focus:outline-none ${values.containsAlcohol ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${values.containsAlcohol ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>

                                        <div className="space-y-5">
                                            <h2 className="text-lg font-medium text-text-1">Items</h2>
                                            <ItemsTable
                                                items={values.items}
                                                editable
                                                onDataChange={handleItemDataChange}
                                                onDeleteItem={handleDeleteItem}
                                                errors={errors.items as (FormikErrors<OrderItem> | undefined)[]}
                                                touched={touched.items as (Partial<OrderItem> | undefined)[]}
                                            />
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={addItem}
                                                className="w-30 font-medium text-sm gap-1 text-text-sidebar h-10"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Item
                                            </Button>
                                            <Separator className="bg-border" />
                                        </div>

                                        <div className="space-y-5">
                                            <div className="flex justify-end items-center">
                                                <div className="text-start w-52">
                                                    <Label className="font-medium text-lg text-text-1">Subtotal</Label>
                                                </div>
                                                <DollarInput
                                                    disabled={true}
                                                    value={values.customerSubTotal}
                                                    onChange={(val) => setFieldValue('customerSubTotal', val)}
                                                    error={errors.customerSubTotal}
                                                    touched={touched.customerSubTotal}
                                                />
                                            </div>
                                            <div className="flex justify-end items-center">
                                                <div className="text-start w-52 shrink-0">
                                                    <Label className="text-sm font-medium text-text-2 flex items-center gap-1 whitespace-nowrap">
                                                        Customer Delivery Fee<span className="text-red-500">*</span>
                                                        <Tooltip>
                                                            <TooltipTrigger type="button" className="text-text-2 hover:text-text-1 hover:cursor-pointer">
                                                                <Info className="w-3.5 h-3.5" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" sideOffset={6} className="max-w-52 bg-white text-text-1 border border-border border-l-2 border-l-primary shadow-sm">
                                                                Delivery fee charged to the customer on this order
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </Label>
                                                </div>
                                                <DollarInput
                                                    value={values.customerDeliveryFee}
                                                    onChange={(val) => setFieldValue('customerDeliveryFee', val)}
                                                    error={errors.customerDeliveryFee}
                                                    touched={touched.customerDeliveryFee}
                                                />
                                            </div>
                                            <div className="flex justify-end items-center">
                                                <div className="text-start w-52 shrink-0">
                                                    <Label className="text-sm font-medium text-text-2 flex items-center gap-1 whitespace-nowrap">
                                                        Customer Tip<span className="text-red-500">*</span>
                                                        <Tooltip>
                                                            <TooltipTrigger type="button" className="text-text-2 hover:text-text-1 hover:cursor-pointer">
                                                                <Info className="w-3.5 h-3.5" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" sideOffset={6} className="max-w-52 bg-white text-text-1 border border-border border-l-2 border-l-primary shadow-sm">
                                                                Tip provided by the customer on this order
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </Label>
                                                </div>
                                                <DollarInput
                                                    value={values.customerTip}
                                                    onChange={(val) => setFieldValue('customerTip', val)}
                                                    error={errors.customerTip}
                                                    touched={touched.customerTip}
                                                />
                                            </div>
                                        </div>

                                        <div ref={tipSectionRef} className="flex justify-center items-center">
                                            <div className="p-4 w-full space-y-2 rounded-xl border border-[#3FC060] bg-green-100">
                                                <div className="flex gap-2 text-sm text-[#3FC060]">
                                                    <Heart className="w-5 h-5 text-[#3FC060]" />
                                                    OPTIONAL
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-start w-45">
                                                        <Label className="text-sm font-medium text-text-2 gap-0">Additional Tip to driver</Label>
                                                    </div>
                                                    <DollarInput
                                                        value={values.driverTip}
                                                        onChange={(val) => setFieldValue('driverTip', val)}
                                                        error={errors.driverTip}
                                                        touched={touched.driverTip}
                                                    />
                                                </div>
                                                <p className="text-xs text-[#3FC060]">This tip goes directly to the driver.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-w-0 h-fit flex-[1.2] flex flex-col space-y-7">
                                        <div className="bg-background border border-border rounded-[20px] px-4 py-4 space-y-7">
                                            <OrderFormMap
                                                deliveryLocation={values.latitude && values.longitude
                                                    ? { latitude: values.latitude, longitude: values.longitude }
                                                    : null}
                                                businessLocation={businessAddress}
                                            />

                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium text-lg text-text-1">Delivery Charge Summary</h3>
                                                    {isQuoteFetching && (
                                                        <span className="flex items-center gap-1.5 text-xs text-text-2">
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Fetching quote…
                                                        </span>
                                                    )}
                                                    {!isQuoteFetching && !canDispatch && (
                                                        <span className="text-xs text-text-2">Fill all fields for a quote</span>
                                                    )}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center py-1">
                                                        <span className="text-sm font-normal text-text-2">Dispatch Fee</span>
                                                        <span className="text-sm font-normal text-text-2">
                                                            {isQuoteFetching
                                                                ? <Loader2 className="w-4 h-4 animate-spin inline" />
                                                                : quote && quote.fee ? `$${quote.fee?.toFixed(2)}` : '—'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center py-1">
                                                        <span className="text-sm font-normal text-text-2">Driver Tip</span>
                                                        <span className="text-sm font-normal text-text-2">
                                                            ${((Number(values.driverTip) + Number(values.customerTip)) || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Separator className="bg-border" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg text-medium text-text-1">Total</span>
                                                    <span className="text-lg text-medium text-text-1">
                                                        {isQuoteFetching
                                                            ? <Loader2 className="w-4 h-4 animate-spin inline" />
                                                            : quote
                                                                ? `$${(Number(quote.fee!) + (Number(values.driverTip) || 0) + (Number(values.customerTip) || 0)).toFixed(2)}`
                                                                : `$${((Number(values.driverTip) || 0) + (Number(values.customerTip) || 0)).toFixed(2)}`}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pt-6">
                                                {deliveryType === DeliveryType.SCHEDULE ? (
                                                    <Button
                                                        className="w-full font-medium h-10"
                                                        type="submit"
                                                        disabled={!isValid || isSubmitting || isQuoteFetching || values.items.length === 0 || !quote?.fee}
                                                        onClick={() => setIsDispatching(true)}
                                                    >
                                                        {isSubmitting && isDispatching
                                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scheduling Delivery…</>
                                                            : 'Schedule Delivery'}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full font-medium h-10"
                                                        type="submit"
                                                        disabled={!isValid || isSubmitting || isQuoteFetching || values.items.length === 0 || !quote?.fee}
                                                        onClick={() => setIsDispatching(true)}
                                                    >
                                                        {isSubmitting && isDispatching
                                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Delivery…</>
                                                            : 'Create and Dispatch'}
                                                    </Button>
                                                )}
                                                <Button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    onClick={() => setIsDispatching(false)}
                                                    className="w-full bg-[#F1F5F9] text-text-2 hover:bg-[#F1F5F9]/50 h-10"
                                                >
                                                    {isSubmitting && !isDispatching
                                                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                                                        : order ? 'Save Changes' : 'Save for later'}
                                                </Button>
                                                <p className="flex justify-center items-center text-xs text-text-1 font-normal text-center gap-0">Powered By
                                                    <Image src="/Uber_Logo.png" alt="uber direact logo" className="-ml-1 cursor-pointer"
                                                        width={48} height={32} />
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <Alert className=" bg-[#F4C542]/10 border-[#F4C542] rounded-[20px] p-4">
                                                <AlertTitle className="font-medium text-sm text-text-1">Please Note</AlertTitle>
                                                <AlertDescription className="font-normal  text-sm text-text-1">
                                                    Please fill in the required information to create the order.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        )
                    }}
                </Formik>
            </div>
            <ContainAlcoholModal
                open={showAlcoholModal}
                onClose={() => {
                    setShowAlcoholModal(false);
                    setPendingAlcoholEnable(null);
                }}
                onConfirm={() => {
                    if (pendingAlcoholEnable) pendingAlcoholEnable(true);
                    setShowAlcoholModal(false);
                    setPendingAlcoholEnable(null);
                }}
            />
        </>
    )
}