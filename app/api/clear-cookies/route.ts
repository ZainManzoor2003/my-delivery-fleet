import { clearOnboardingCookies } from '@/lib/auth/onboarding-cookies'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
    try {
        const cookieStore = await cookies()

        // Set a temporary flag
        cookieStore.set('signing_out', 'true', {
            httpOnly: true,
            maxAge: 5,  // 5 seconds
            path: '/'
        })

        await clearOnboardingCookies()

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error clearing cookies:', error)
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
