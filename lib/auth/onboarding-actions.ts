'use server'

import { setProfileCompleted, setBusinessSetup, setPaymentMethodSet, setAllOnboardingCookies, clearOnboardingCookies, OnboardingStatus } from './onboarding-cookies'

export async function setProfileCompletedAction(value: boolean) {
    return await setProfileCompleted(value)
}

export async function setBusinessSetupAction(value: boolean) {
    return await setBusinessSetup(value)
}

export async function setPaymentMethodSetAction(value: boolean) {
    return await setPaymentMethodSet(value)
}

export async function setAllOnboardingCookiesAction(status: OnboardingStatus) {
    return await setAllOnboardingCookies(status)
}

export async function clearOnboardingCookiesAction() {
    return await clearOnboardingCookies()
}
