// lib/auth/onboarding-cookies.ts
"use server"

import { cookies } from 'next/headers'
import { Role } from '@/lib/enums/role'

export interface OnboardingStatus {
    profileCompleted: boolean
    businessSetup: boolean
    paymentMethodSet: boolean
    role?: Role | null
    businessStatus?: string | null
}

const PROFILE_COMPLETED_COOKIE = 'profile_completed'
const BUSINESS_SETUP_COOKIE = 'business_setup'
const PAYMENT_METHOD_COOKIE = 'payment_method_set'
const ROLE_COOKIE = 'user_role'
const BUSINESS_STATUS_COOKIE = 'business_status'

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/'
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
    const cookieStore = await cookies()
    const roleCookie = cookieStore.get(ROLE_COOKIE)?.value
    const businessStatusCookie = cookieStore.get(BUSINESS_STATUS_COOKIE)?.value

    return {
        profileCompleted: cookieStore.get(PROFILE_COMPLETED_COOKIE)?.value === 'true',
        businessSetup: cookieStore.get(BUSINESS_SETUP_COOKIE)?.value === 'true',
        paymentMethodSet: cookieStore.get(PAYMENT_METHOD_COOKIE)?.value === 'true',
        role: roleCookie ? (roleCookie as Role) : null,
        businessStatus: businessStatusCookie || null
    }
}

export async function setProfileCompleted(value: boolean) {
    const cookieStore = await cookies()
    cookieStore.set(PROFILE_COMPLETED_COOKIE, String(value), COOKIE_OPTIONS)
}

export async function setBusinessSetup(value: boolean) {
    const cookieStore = await cookies()
    cookieStore.set(BUSINESS_SETUP_COOKIE, String(value), COOKIE_OPTIONS)
}

export async function setPaymentMethodSet(value: boolean) {
    const cookieStore = await cookies()
    cookieStore.set(PAYMENT_METHOD_COOKIE, String(value), COOKIE_OPTIONS)
}

export async function setRole(role: Role | null) {
    const cookieStore = await cookies()
    if (role) {
        cookieStore.set(ROLE_COOKIE, role, COOKIE_OPTIONS)
    } else {
        cookieStore.delete(ROLE_COOKIE)
    }
}

export async function setBusinessStatus(status: string | null) {
    const cookieStore = await cookies()
    if (status) {
        cookieStore.set(BUSINESS_STATUS_COOKIE, status, COOKIE_OPTIONS)
    } else {
        cookieStore.delete(BUSINESS_STATUS_COOKIE)
    }
}

export async function setAllOnboardingCookies(status: OnboardingStatus) {
    const cookieStore = await cookies()
    cookieStore.set(PROFILE_COMPLETED_COOKIE, String(status.profileCompleted), COOKIE_OPTIONS)
    cookieStore.set(BUSINESS_SETUP_COOKIE, String(status.businessSetup), COOKIE_OPTIONS)
    cookieStore.set(PAYMENT_METHOD_COOKIE, String(status.paymentMethodSet), COOKIE_OPTIONS)
    if (status.role) {
        cookieStore.set(ROLE_COOKIE, status.role, COOKIE_OPTIONS)
    }
    if (status.businessStatus) {
        cookieStore.set(BUSINESS_STATUS_COOKIE, status.businessStatus, COOKIE_OPTIONS)
    }
}

export async function clearOnboardingCookies() {
    const cookieStore = await cookies()
    cookieStore.delete(PROFILE_COMPLETED_COOKIE)
    cookieStore.delete(BUSINESS_SETUP_COOKIE)
    cookieStore.delete(PAYMENT_METHOD_COOKIE)
    cookieStore.delete(ROLE_COOKIE)
    cookieStore.delete(BUSINESS_STATUS_COOKIE)
}
