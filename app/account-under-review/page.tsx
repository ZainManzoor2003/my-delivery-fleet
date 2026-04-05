'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from "@clerk/nextjs"
import { useUserStore } from "@/app/stores/userStore"
import { checkAndSetUserStatus } from "@/lib/auth/actions"
import { Role } from "@/lib/enums/role"
import { BusinessStatus } from "@/lib/types/business"
import OnBoardingSuccess from '../onboarding/components/onBoardingSuccess'

export default function AccountUnderReview() {
    const router = useRouter()
    const { user } = useUser()
    const { setUser } = useUserStore()

    useEffect(() => {
        const checkStatus = async () => {
            if (!user?.id) return

            try {
                const status = await checkAndSetUserStatus(user.id)
                setUser({
                    role: status.role as Role | null,
                    businessStatus: status.businessStatus as BusinessStatus | null
                })

                if (status.role === Role.BUSINESS && status.businessStatus === BusinessStatus.APPROVED) {
                    router.replace('/fleet')
                }

                if (status.role === Role.BUSINESS && status.businessStatus === BusinessStatus.REJECTED) {
                    router.replace('/account-abandoned')
                }

                else if (status.role === Role.BUSINESS &&
                    (!status.profileCompleted || !status.businessSetup || !status.paymentMethodSet)) {
                    router.replace('/onboarding')
                }
            } catch (error) {
                console.error('Error checking user status:', error)
            }
        }

        checkStatus()

        const interval = setInterval(checkStatus, 30000)

        return () => clearInterval(interval)
    }, [user?.id, router, setUser])

    return (
        <OnBoardingSuccess />
    )
}
