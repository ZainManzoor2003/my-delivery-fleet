'use client'

import { useSignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { GoogleIcon } from '@/components/icons/google'
import { Eye, EyeOff } from 'lucide-react'
import { signInSchema, otpSchema } from '@/validations/validations'
import { Formik, Form } from 'formik'
import { VerifyIcon } from '@/components/icons/verify'
import { checkAndSetUserStatus } from '@/lib/auth/actions'
import { Role } from '@/lib/enums/role'

export default function SignInPage() {
    const { isLoaded, signIn, setActive } = useSignIn()
    const { user } = useUser()
    const [error, setError] = useState<string>('')
    const [needsSecondFactor, setNeedsSecondFactor] = useState<boolean>(false)
    const [signInAttemptData, setSignInAttemptData] = useState<typeof signIn | null>(null)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const [isGoogleSignUpInProgress, setIsGoogleSignUpInProgress] = useState<boolean>(false)
    const router = useRouter()

    const signInWithGoogle = () => {
        if (isGoogleSignUpInProgress) return

        setIsGoogleSignUpInProgress(true)

        signIn?.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/fleet',
        })
    }

    const handleEmailSignIn = async (
        values: { email: string; password: string },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!isLoaded || !setActive) return

        try {
            setError('')

            const signInAttempt = await signIn.create({
                identifier: values.email,
                password: values.password,
            })

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId })

                // Check user role and redirect accordingly
                const userStatus = await checkAndSetUserStatus(user?.id || '')

                if (userStatus.role === Role.ADMIN) {
                    router.push('/fleet')
                } else {
                    if (userStatus.profileCompleted) {
                        router.push('/fleet')
                    } else {
                        router.push('/')
                    }
                }
            } else if (signInAttempt.status === 'needs_second_factor') {
                setNeedsSecondFactor(true)
                setSignInAttemptData(signInAttempt)
                await signInAttempt.prepareSecondFactor({ strategy: 'email_code' })
            }
        } catch (err) {
            if (isClerkAPIResponseError(err)) {
                setError(err.errors[0]?.longMessage || 'Sign in failed')
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }
    const handleVerifySecondFactor = async (
        values: { otp: string },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!isLoaded || !signInAttemptData || !setActive) return

        try {
            setError('')

            const verifiedAttempt = await signInAttemptData.attemptSecondFactor({
                code: values.otp,
                strategy: 'email_code',
            })

            if (verifiedAttempt.status === 'complete') {
                await setActive({ session: verifiedAttempt.createdSessionId })

                // Check user role and redirect accordingly
                const userStatus = await checkAndSetUserStatus(user?.id || '')

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
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'errors' in err) {
                const customErr = err as { errors: { longMessage: string }[] };
                setError(customErr.errors?.[0]?.longMessage || 'Second factor verification failed');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Second factor verification failed');
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }


    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    {needsSecondFactor ? (
                        <Formik
                            initialValues={{ otp: '' }}
                            validationSchema={otpSchema}
                            onSubmit={handleVerifySecondFactor}
                        >
                            {({ values, handleChange, handleSubmit, errors, touched, isSubmitting }) => (
                                <Form onSubmit={handleSubmit}>

                                    <div className="text-center mb-6">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                                            <VerifyIcon size={24} />
                                        </div>

                                        <p className="text-2xl font-semibold text-text-1 ">
                                            Verify your email
                                        </p>

                                        <p className="text-text-2 text-md mt-2 ">
                                            Check your inbox to continue
                                        </p>
                                    </div>

                                    <div className="space-y-4 mt-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium 
                                                    text-text-2 gap-0">
                                                Enter 6-digit Code
                                                <span className='text-red-500'>*</span>
                                            </Label>
                                            <Input
                                                name='otp'
                                                placeholder="Enter Code"
                                                className={`h-10 placeholder:text-text-3 ${touched.otp && errors.otp ? 'border-red-500' : 'border-border'}`}
                                                value={values.otp}
                                                onChange={handleChange}
                                                disabled={isSubmitting}
                                            />
                                            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                                        </div>
                                        <Button
                                            type='submit'
                                            className="w-full h-10 disabled:bg-[#E2E8F0] disabled:text-text-3"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Verifying...' : 'Verify Code'}
                                        </Button>
                                        <p className="text-sm text-text-2 text-center">
                                            Email verification helps us keep your account secure.
                                        </p>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-semibold text-text-1 tracking-tight">
                                    Welcome Back!
                                </h1>
                                <p className="text-md text-text-2 mt-1.5">
                                    Sign in to access your delivery account.
                                </p>
                            </div>

                            <Button
                                className="w-full h-10
                                disabled:opacity-50 disabled:cursor-not-allowed
                                 bg-white hover:bg-white/50
                                 curor-pointer text-text-2 flex items-center justify-center gap-2 border border-border font-medium"
                                onClick={signInWithGoogle}
                                disabled={isGoogleSignUpInProgress}
                            >
                                <GoogleIcon />
                                <Label className='text-sm font-semibold cursor-pointer'>
                                    {isGoogleSignUpInProgress ? 'Continuing with Google...' : 'Continue with Google'}
                                </Label>
                            </Button>

                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-text-3">or</span>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <Formik
                                initialValues={{ email: '', password: '' }}
                                validationSchema={signInSchema}
                                onSubmit={handleEmailSignIn}
                            >
                                {({ values, handleChange, handleSubmit, errors, touched, isSubmitting }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <div className="space-y-5">

                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-text-2 gap-0">
                                                    Email Address
                                                    <span className='text-red-500'>*</span>
                                                </Label>
                                                <Input
                                                    name="email"
                                                    value={values.email}
                                                    onChange={handleChange}
                                                    placeholder="you@company.com"
                                                    className={`h-10 placeholder:text-text-3 active:border-primary ${touched.email && errors.email ? 'border-red-500' : 'border-border'}`}
                                                />
                                                {touched.email && errors.email && <span className='text-red-500 text-xs'>{errors.email}</span>}
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium text-text-2 gap-0">
                                                    Password
                                                    <span className='text-red-500'>*</span>
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        name="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Enter your password"
                                                        className={`h-10 placeholder:text-text-3 ${touched.password && errors.password ? 'border-red-500' : 'border-border'}`}
                                                        value={values.password}
                                                        onChange={handleChange}
                                                    />
                                                    {touched.password && errors.password && <span className='text-red-500 text-xs'>{errors.password}</span>}
                                                    {showPassword ? (
                                                        <EyeOff className="absolute right-3 top-2.5 h-4 w-4 text-icon cursor-pointer" onClick={() => setShowPassword(prev => !prev)} />
                                                    ) : (
                                                        <Eye className="absolute right-3 top-2.5 h-4 w-4 text-icon cursor-pointer" onClick={() => setShowPassword(prev => !prev)} />
                                                    )}
                                                </div>
                                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <Label className="flex items-center gap-2 text-sm text-text-2">
                                                    <input
                                                        type="checkbox"
                                                        id="remember"
                                                        className="h-6 w-6 rounded border border-gray-300 cursor-pointer appearance-none checked:bg-primary checked:border-primary checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMS4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-center checked:bg-no-repeat"
                                                    />
                                                    <Label className="text-sm font-normal">
                                                        Remember for 30 days
                                                    </Label>
                                                </Label>

                                                <Link className="text-sm text-primary font-medium hover:underline text-center" href='/forgot-password'>
                                                    Forgot Password?
                                                </Link>
                                            </div>

                                            <Button
                                                type='submit'
                                                className="w-full h-10 font-medium disabled:bg-[#E2E8F0] disabled:text-text-3 text-sm"
                                                disabled={isSubmitting}
                                            >
                                                Sign In
                                            </Button>
                                        </div>
                                    </Form>
                                )}
                            </Formik>

                            <p className="text-center text-md text-text-2 mt-6">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/sign-up"
                                    className="text-primary font-normal hover:underline"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="text-center py-4 pb-8">
                <p className="text-sm text-text-2">
                    Need help? Contact{' '}
                    <a
                        href="mailto:support@mydeliveryfleet.com"
                        className="font-medium text-text-1 hover:underline"
                    >
                        support@mydeliveryfleet.com
                    </a>
                </p>
            </div>
        </div>
    )
}
