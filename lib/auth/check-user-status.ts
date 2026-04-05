// lib/auth/check-user-status.ts
import prisma from '@/lib/prisma'
import { setAllOnboardingCookies } from './onboarding-cookies'

export async function checkAndSetUserStatus(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                business: {
                    select: {
                        id: true,
                        paymentMethod: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        })

        if (!user) {
            // User doesn't exist in DB - first time sign in
            return {
                profileCompleted: false,
                businessSetup: false,
                paymentMethodSet: false,
            }
        }

        const hasBusiness = !!user.business
        const hasPaymentMethod = !!user.business?.paymentMethod
        const isComplete = hasBusiness && hasPaymentMethod

        // Set cookies based on database state
        await setAllOnboardingCookies({
            profileCompleted: isComplete,
            businessSetup: hasBusiness,
            paymentMethodSet: hasPaymentMethod
        })

        return {
            profileCompleted: isComplete,
            businessSetup: hasBusiness,
            paymentMethodSet: hasPaymentMethod,
        }
    } catch (error) {
        console.error('Error checking user status:', error)
        return {
            profileCompleted: false,
            businessSetup: false,
            paymentMethodSet: false,
        }
    }
}
