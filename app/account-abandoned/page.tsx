'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from "@clerk/nextjs"
import { useUserStore } from "@/app/stores/userStore"
import { checkAndSetUserStatus } from "@/lib/auth/actions"
import { Role } from "@/lib/enums/role"
import { BusinessStatus } from "@/lib/types/business"
import { AccountReviewIcon } from '@/components/icons/accountReview'
import { useSignOut } from '@/hooks/useSignOut'
import { Button } from '@/components/ui/button'

export default function AccountUnderReview() {
    const router = useRouter()
    const { user } = useUser()
    const { setUser } = useUserStore()
    const signOut = useSignOut();

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
        <div className="min-h-screen flex items-center justify-center bg-background relative p-4 ">
            <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                         border rounded-4xl shadow-[0px_4px_12px_0px_#00000014] text-center">
                <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border">
                        <AccountReviewIcon size={24} />
                    </div>

                    <p className="text-2xl font-semibold text-text-1">
                        Account Abandoned!
                    </p>

                    <p className="text-text-2 text-md">
                        Please contact support for assistance.
                    </p>
                    
                    <Button
                        className="w-full"
                        onClick={signOut}>Sign Out</Button>
                </div>
            </div>
        </div>
    )
}
