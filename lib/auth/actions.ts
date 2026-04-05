'use server'

import prisma from '@/lib/prisma'
import { setAllOnboardingCookies, setRole } from './onboarding-cookies'
import { Role } from '@/lib/enums/role'

export async function checkAndSetUserStatus(id: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                role: true,
                business: {
                    select: {
                        id: true,
                        status: true,
                        name: true,
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
                role: null,
                businessStatus: '',
            }
        }

        // For admin users, they don't need business setup
        if (user.role === Role.ADMIN) {
            // Set role cookie for admin
            await setRole(Role.ADMIN)
            return {
                profileCompleted: true,
                businessSetup: false,
                paymentMethodSet: false,
                role: Role.ADMIN,
            }
        }

        const hasBusiness = !!user.business
        const hasPaymentMethod = !!user.business?.paymentMethod
        const businessStatus = user.business?.status
        const businessName = user.business?.name
        const isComplete = hasBusiness && hasPaymentMethod

        // Set cookies based on database state
        await setAllOnboardingCookies({
            profileCompleted: isComplete,
            businessSetup: hasBusiness,
            paymentMethodSet: hasPaymentMethod,
            role: Role.BUSINESS,
            businessStatus
        })

        return {
            profileCompleted: isComplete,
            businessSetup: hasBusiness,
            paymentMethodSet: hasPaymentMethod,
            role: Role.BUSINESS,
            businessStatus,
            businessName
        }
    } catch (error) {
        console.error('Error checking user status:', error)
        return {
            profileCompleted: false,
            businessSetup: false,
            paymentMethodSet: false,
            role: null,
        }
    }
}
