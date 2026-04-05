'use client'
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loader } from "@/app/components/loader";
import { useGetAdminBusinessById } from "@/app/hooks/useBusiness";
import { BusinessStatus } from "@/lib/types/business";
import { formatUTCLocal } from "@/lib/timezone";
import { SidebarTrigger } from "@/components/ui/sidebar";
import SurchargesEdit from "@/app/fleet/businesses/components/surchargesEdit";

const statusStyles: Record<string, string> = {
    [BusinessStatus.APPROVED]: "bg-green-100 text-green-800",
    [BusinessStatus.UNDER_REVIEW]: "bg-yellow-100 text-yellow-800",
    [BusinessStatus.INCOMPLETE]: "bg-gray-100 text-gray-800",
    [BusinessStatus.REJECTED]: "bg-red-100 text-red-800",
    [BusinessStatus.SUSPENDED]: "bg-orange-100 text-orange-800",
};


export default function BusinessDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data, isLoading } = useGetAdminBusinessById(id);

    if (isLoading) {
        return (
            <Loader
                fullScreen
                label="Fetching Business"
                description="Please wait while we load business details..."
            />
        );
    }

    if (!data?.business) {
        return (
            <div className="min-h-screen py-5 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-text-2 text-sm">Business not found.</p>
                </div>
            </div>
        );
    }

    const { business, stats } = data;
    const pm = business.paymentMethod;

    return (
        <div className="min-h-screen py-5">
            {/* Header */}
            <div className="px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className='xl:hidden' />
                    <button className="flex items-center text-md font-medium text-text-sidebar">
                        <ArrowLeft
                            className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                            onClick={() => router.push('/fleet/businesses')}
                        />
                        Back to Businesses
                    </button>
                </div>
                <div className="py-10">
                    <h1 className="text-xl font-medium text-text-sidebar">{business.name}</h1>
                    <div className="flex flex-wrap justify-between gap-2">
                        <div className="flex gap-2 mt-2 items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[business.status] ?? "bg-gray-100 text-gray-800"}`}>
                                {business.status.replace("_", " ")}
                            </span>
                            <p className="text-md text-text-2 font-normal">
                                Joined {formatUTCLocal(business.createdAt as unknown as string, {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                    hour: 'numeric', minute: '2-digit', hour12: true
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="flex flex-col lg:flex-row px-4 gap-4">
                {/* Left: Business Info + Admin Fees + Order Stats */}
                <main className="min-w-0 flex-[1.6] space-y-0 bg-background border border-border rounded-[20px] overflow-hidden">
                    {/* Business Info */}
                    <div className="space-y-5 px-8 py-6">
                        <h2 className="text-lg font-medium text-text-1">Business Info</h2>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Business Name</p>
                            <p className="text-md font-medium text-text-1 mt-3">{business.name}</p>
                            <p className="text-sm text-text-2 capitalize">{business.type}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Phone</p>
                            <p className="text-md text-text-1 font-normal mt-3">{business.phone || "—"}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Address</p>
                            <p className="text-md text-text-1 font-normal mt-3">
                                {business.address
                                    ? [business.address.address, business.address.city, business.address.state, business.address.postalCode]
                                        .filter(Boolean).join(", ")
                                    : "—"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Delivery Radius</p>
                            <p className="text-md text-text-1 font-normal mt-3">
                                {business.deliveryRadius ? `${Number(business.deliveryRadius).toFixed(2)} mi` : "—"}
                            </p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Routing Preference</p>
                            <p className="text-md text-text-1 font-normal mt-3 capitalize">{business.routingPreference}</p>
                            {business.pickupInstructions && (
                                <>
                                    <p className="text-xs font-semibold uppercase text-icon mt-4">Pickup Instructions</p>
                                    <p className="text-sm text-text-2 mt-1">{business.pickupInstructions}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    {/* Order Stats */}
                    <div className="space-y-5 px-8 py-6">
                        <h2 className="text-lg font-medium text-text-1">Order Stats</h2>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Total Orders</p>
                            <p className="text-md font-medium text-text-1 mt-3">{stats.totalOrders}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Expected Avg / Day</p>
                            <p className="text-md text-text-1 font-normal mt-3">
                                {business.avgOrdersPerDay != null ? `${business.avgOrdersPerDay} orders` : "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase text-icon">Actual Avg / Day</p>
                            <p className="text-md text-text-1 font-normal mt-3">
                                {stats.actualAvgOrdersPerDay != null ? `${Math.max(1, Math.round(stats.actualAvgOrdersPerDay))} orders` : "—"}
                            </p>
                        </div>
                    </div>
                </main>

                {/* Right: Payment Method + Admin Fees */}
                <div className="min-w-0 h-fit flex-[1.2] flex flex-col bg-background border border-border rounded-[20px] overflow-hidden">
                    {/* Payment Method */}
                    <div className="space-y-5 px-8 py-6">
                        <h2 className="text-lg font-medium text-text-1">Payment Method</h2>
                        {pm ? (
                            <>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase text-icon">Type</p>
                                    <p className="text-md font-medium text-text-1 mt-3 uppercase">{pm.paymentType}</p>
                                    <p className="text-sm text-text-2">
                                        {pm.isVerified
                                            ? <span className="text-green-600">Verified</span>
                                            : <span className="text-yellow-600">Pending verification</span>}
                                    </p>
                                </div>

                                <Separator className="bg-border" />

                                {pm.paymentType === 'card' ? (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase text-icon">Card</p>
                                        <p className="text-md font-medium text-text-1 mt-3">
                                            {pm.cardBrand && pm.cardLast4
                                                ? `${pm.cardBrand.charAt(0).toUpperCase() + pm.cardBrand.slice(1)} •••• ${pm.cardLast4}`
                                                : "—"}
                                        </p>
                                        {pm.cardExpMonth && pm.cardExpYear && (
                                            <p className="text-sm text-text-2">
                                                Expires {String(pm.cardExpMonth).padStart(2, '0')} / {pm.cardExpYear}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase text-icon">Bank</p>
                                        <p className="text-md font-medium text-text-1 mt-3">{pm.achBankName || "—"}</p>
                                        {pm.achAccountLast4 && (
                                            <p className="text-sm text-text-2 capitalize">
                                                {pm.achAccountType} •••• {pm.achAccountLast4}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="text-md text-text-1 font-normal">No payment method on file.</p>
                        )}
                    </div>

                    <Separator className="bg-border" />

                    {/* Admin Fees */}
                    <div className="space-y-5 px-8 py-6">
                        <div className="flex items-center justify-start">
                            <h2 className="text-lg font-medium text-text-1">Admin Fees</h2>
                            <SurchargesEdit business={business} hideSummary />
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Base Quote</p>
                                <p className="text-md text-text-1 font-normal mt-3">
                                    {business.surchargeBaseQuote ? `$${Number(business.surchargeBaseQuote).toFixed(2)}` : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Extended Quote</p>
                                <p className="text-md text-text-1 font-normal mt-3">
                                    {business.surchargeExtendedQuote ? `$${Number(business.surchargeExtendedQuote).toFixed(2)}` : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Catering</p>
                                <p className="text-md text-text-1 font-normal mt-3">
                                    {business.surchargeCatering ? `$${Number(business.surchargeCatering).toFixed(2)}` : "—"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Retail</p>
                                <p className="text-md text-text-1 font-normal mt-3">
                                    {business.surchargeRetail ? `$${Number(business.surchargeRetail).toFixed(2)}` : "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
