'use client'

import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs'
import { Loader } from '../components/loader'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { checkAndSetUserStatus } from '@/lib/auth/actions'
import { Role } from '@/lib/enums/role'

export default function SSOCallback() {
    const { user } = useUser()
    const router = useRouter()

    useEffect(() => {
        const handleRedirect = async () => {
            if (user?.id) {
                const userStatus = await checkAndSetUserStatus(user.id)
                
                if (userStatus.role === Role.ADMIN) {
                    router.push('/fleet')
                } else {
                    if (userStatus.profileCompleted) {
                        router.push('/fleet')
                    } else {
                        router.push('/')
                    }
                }
            }
        }

        if (user) {
            handleRedirect()
        }
    }, [user, router])

    return (
        <>
            <AuthenticateWithRedirectCallback
                signInFallbackRedirectUrl="/fleet"
                signUpFallbackRedirectUrl="/onboarding"
            />

            <Loader
                fullScreen
                label="Completing sign in"
                description="Please wait while we authenticate your account..."
            />

            <div
                id="clerk-captcha"
                className="fixed inset-0 flex items-center justify-center z-60"
            />
        </>
    )
}
