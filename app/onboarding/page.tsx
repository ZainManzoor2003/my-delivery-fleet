'use client'
import { GetStarted } from "./components/getStarted";
import { BusinessInformation } from "./components/businessInformation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useGetBusinessMinimal } from "@/app/hooks/useBusiness";
import { useUserStore } from "../stores/userStore";
import { BusinessStatus } from "@/lib/types/business";
import { PaymentDetailsWrapper } from "./components/paymentDetailsWrapper";
import { Loader } from "../components/loader";

export default function OnBoarding() {
    const router = useRouter();
    const { user } = useUser();
    const { setUser } = useUserStore()

    const { data: businessData, isLoading: isLoadingBusiness } = useGetBusinessMinimal(user?.id || null);

    // Track user-initiated step changes (null means use computed step)
    const [userStep, setUserStep] = useState<number | null>(null);

    useEffect(() => {
        setUser({ businessId: businessData?.id, businessStatus: businessData?.status as BusinessStatus | null });
        if (businessData?.address) {
            setUser({ businessAddress: businessData.address });
        }
    }, [businessData?.id, businessData?.address, businessData?.status, setUser]);

    // Redirect based on business status
    useEffect(() => {
        if (isLoadingBusiness || !user?.id) return;

        const status = businessData?.status as BusinessStatus | null;

        if (status === BusinessStatus.UNDER_REVIEW) {
            router.replace('/account-under-review');
            return;
        }

        if (status === BusinessStatus.REJECTED) {
            router.replace('/account-abandoned');
            return;
        }

        if (businessData?.paymentMethod && status === BusinessStatus.APPROVED) {
            router.replace('/fleet');
        }
    }, [isLoadingBusiness, user?.id, businessData?.status, businessData?.paymentMethod, router]);

    // Compute the effective step: user-initiated step takes priority, otherwise compute from data
    // Never returns null after loading — defaults to step 1 as a fallback
    const computedStep = !isLoadingBusiness && user?.id
        ? (!businessData ? 1 : (!businessData.paymentMethod ? 3 : 1))
        : null;
    const step = userStep ?? computedStep;

    if (isLoadingBusiness || step === null) {
        return (
            <Loader
                fullScreen
                label="Setting up your account"
                description="Please wait while we load your information..."
            />
        );
    }

    return (
        <>
            {step === 1 && <GetStarted onContinue={() => setUserStep(2)} />}
            {step === 2 && <BusinessInformation onSuccess={() => setUserStep(3)} />}
            {step === 3 && <PaymentDetailsWrapper />}
        </>
    )
}
