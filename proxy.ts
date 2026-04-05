import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getOnboardingStatus } from '@/lib/auth/onboarding-cookies'
import { checkAndSetUserStatus } from '@/lib/auth/actions'
import { Role } from '@/lib/enums/role'
import { BusinessStatus } from './lib/types/business'

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/sso-callback(.*)',
    '/forgot-password(.*)',
])

const isAuthPage = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/forgot-password(.*)',
])

const isWebhookOrCookiesRoute = createRouteMatcher([
    '/api/webhooks(.*)',
    '/api/clear-cookies(.*)',
])

const isAppRoute = createRouteMatcher([
    '/',
    '/fleet(.*)',
])

const isBusinessOnlyRoute = createRouteMatcher([
    '/fleet/orders(.*)',
    '/fleet/dispatch(.*)',
    '/fleet/live-tracking(.*)',
    '/fleet/support(.*)',
])

const isAdminOnlyRoute = createRouteMatcher([
    '/fleet/users(.*)',
    '/fleet/manage-support(.*)',
    '/fleet/manage-orders(.*)',
    '/fleet/billing(.*)',
    '/fleet/businesses(.*)',
])

export default clerkMiddleware(async (auth, req) => {
    const path = req.nextUrl.pathname
    const { userId } = await auth()

    const isSigningOut = req.cookies.get('signing_out')?.value === 'true'

    if (isWebhookOrCookiesRoute(req)) {
        return NextResponse.next()
    }

    if (path.startsWith('/api')) {
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.next()
    }

    if (isAuthPage(req) && userId) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    if (isPublicRoute(req)) {
        return NextResponse.next()
    }


    if (!userId) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    if (isAppRoute(req) && !isSigningOut) {
        const cookieStatus = await getOnboardingStatus()

        const shouldCheckDatabase =
            !cookieStatus.profileCompleted ||
            !cookieStatus.businessSetup ||
            !cookieStatus.paymentMethodSet ||
            !cookieStatus.businessStatus

        const status = shouldCheckDatabase
            ? await checkAndSetUserStatus(userId)
            : cookieStatus

        // Handle admin users - they don't need business setup
        if (status.role === Role.ADMIN) {
            // Prevent admins from accessing business-only routes
            if (isBusinessOnlyRoute(req)) {
                return NextResponse.redirect(new URL('/fleet', req.url))
            }
            if (path === '/') {
                return NextResponse.redirect(new URL('/fleet', req.url))
            }
            return NextResponse.next()
        }

        // Handle business users - prevent access to admin-only routes
        if (isAdminOnlyRoute(req)) {
            return NextResponse.redirect(new URL('/fleet', req.url))
        }

        // Handle business users
        if (
            status.profileCompleted &&
            status.businessSetup &&
            status.paymentMethodSet &&
            status.businessStatus !== BusinessStatus.INCOMPLETE
        ) {
            // Check if business is approved before allowing access to fleet
            if (status.businessStatus === BusinessStatus.APPROVED || status.businessStatus === BusinessStatus.SUSPENDED) {
                if (path === '/') {
                    return NextResponse.redirect(new URL('/fleet', req.url))
                }
                return NextResponse.next()
            }

            if (status.businessStatus === BusinessStatus.UNDER_REVIEW) {
                return NextResponse.redirect(new URL('/account-under-review', req.url))
            }

            if (status.businessStatus === BusinessStatus.REJECTED) {
                return NextResponse.redirect(new URL('/account-abandoned', req.url))
            }
        }

        return NextResponse.redirect(new URL('/onboarding', req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
}
