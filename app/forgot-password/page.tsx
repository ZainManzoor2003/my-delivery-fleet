'use client'
import React, { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import type { NextPage } from 'next'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Button } from '@/components/ui/button'
import { ForgotIcon } from '@/components/icons/forgot'
import { ResetIcon } from '@/components/icons/reset'
import { VerifyIcon } from '@/components/icons/verify'
import { PinIcon } from '@/components/icons/pin'
import Link from 'next/link'
import Password from '@/components/password'
import { otpSchema, forgotSchema } from '@/validations/validations'
import { Formik, Form } from 'formik'

const ForgotPasswordPage: NextPage = () => {
    const [password, setPassword] = useState<string>('')
    const [confirmPassword, setConfirmPassword] = useState<string>('')
    const [successfulCreation, setSuccessfulCreation] = useState<boolean>(false)
    const [codeVerified, setCodeVerified] = useState<boolean>(false)
    const [secondFactor, setSecondFactor] = useState<boolean>(false)
    const [successfullReset, setSuccessfullReset] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [passwordValidation, setPasswordValidation] = useState<boolean>(false)

    const router = useRouter()
    const { isLoaded, signIn, setActive } = useSignIn()

    if (!isLoaded) {
        return null
    }

    const create = async (values: { email: string; },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        await signIn
            ?.create({
                strategy: 'reset_password_email_code',
                identifier: values.email,
            })
            .then(() => {
                setSuccessfulCreation(true)
                setError('')
            })
            .catch((err) => {
                console.error('error', err.errors[0].longMessage)
                setError(err.errors[0].longMessage)
            })
        formikHelpers.setSubmitting(false)

    }

    const verifyCode = async (values: { otp: string; },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        await signIn
            ?.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code: values.otp,
            })
            .then((result) => {
                if (result.status === 'needs_new_password') {
                    setCodeVerified(true)
                    setError('')
                } else if (result.status === 'needs_second_factor') {
                    setSecondFactor(true)
                    setError('')
                }
            })
            .catch((err) => {
                console.error('error', err.errors[0].longMessage)
                setError(err.errors[0].longMessage)
            })
        formikHelpers.setSubmitting(false)
    }

    const reset = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        await signIn
            ?.resetPassword({ password })
            .then(async (result) => {
                if (result.status === 'complete') {
                    await setActive({ session: result.createdSessionId })
                    setSuccessfullReset(true)
                    setError('')
                }
            })
            .catch((err) => {
                console.error('error', err.errors[0].longMessage)
                setError(err.errors[0].longMessage)
            })
    }

    const goToDashboard = () => {
        router.push('/fleet')
    }

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center p-4">
               <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    {!successfulCreation && (
                        <Formik
                            initialValues={{ email: '' }}
                            validationSchema={forgotSchema}
                            onSubmit={create}
                        >
                            {({ values, handleChange, handleSubmit, errors, touched, isSubmitting }) => (
                                <Form onSubmit={handleSubmit}>
                                    <div className="text-center mb-8">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                                            <ForgotIcon size={24} />
                                        </div>
                                        <h1 className="text-2xl font-semibold text-text-1 ">
                                            Forgot your password?
                                        </h1>
                                        <p className="text-md text-text-2 mt-1.5">
                                            No worries, we&apos;ll help you reset it.
                                        </p>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">
                                                Email Address
                                                <span className='text-red-500'>*</span>
                                            </Label>
                                            <Input
                                                name='email'
                                                type='email'
                                                value={values.email}
                                                onChange={handleChange}
                                                placeholder="you@company.com"
                                                className={`h-10 placeholder:text-text-3 active:border-primary ${touched.email && errors.email ? 'border-red-500' : 'border-border'}`}
                                            />
                                            {error && <p className="text-red-500 text-sm">{error}</p>}
                                        </div>
                                        <Button
                                            className="w-full h-10 font-medium disabled:bg-[#E2E8F0] disabled:text-text-3 text-sm"
                                            type="submit"
                                            disabled={isSubmitting}
                                        >
                                            Send Reset Code
                                        </Button>
                                        <div>

                                            <p className="text-center text-sm text-text-2 mt-1">
                                                We&apos;ll send code to your email to reset your password
                                            </p>
                                            <p className="text-sm text-text-2 mt-1 text-center">
                                                Back to {" "}
                                                <Link
                                                    href="/sign-in"
                                                    className="text-primary font-normal hover:underline"
                                                >
                                                    Sign In
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    )}

                    {successfulCreation && !codeVerified && !successfullReset && (
                        <Formik
                            initialValues={{ otp: '' }}
                            validationSchema={otpSchema}
                            onSubmit={verifyCode}
                        >
                            {({ values, handleChange, handleSubmit, errors, touched, isSubmitting }) => (
                                <Form onSubmit={handleSubmit}>
                                    <div className="text-center mb-8">
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                                            <PinIcon size={24} />
                                        </div>
                                        <h1 className="text-2xl font-semibold text-text-1 ">
                                            Verify your code
                                        </h1>
                                        <p className="text-md text-text-2 mt-1.5">
                                            Enter the code sent to your email
                                        </p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">
                                                Reset Code
                                                <span className='text-red-500'>*</span>
                                            </Label>
                                            <Input
                                                type='text'
                                                name='otp'
                                                value={values.otp}
                                                onChange={handleChange}
                                                placeholder="Enter code"
                                                className={`h-10 placeholder:text-text-3 active:border-primary ${touched.otp && errors.otp ? 'border-red-500' : 'border-border'}`}
                                            />
                                            {error && <p className="text-red-500 text-sm">{error}</p>}
                                        </div>
                                        <Button
                                            className="w-full h-10 font-medium disabled:bg-[#E2E8F0] disabled:text-text-3 text-sm"
                                            type='submit'
                                            disabled={isSubmitting}
                                        >
                                            Verify Code
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    )}

                    {successfulCreation && codeVerified && !successfullReset && (
                        <>
                            <div className="text-center mb-8">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                                    <ResetIcon size={24} />
                                </div>
                                <h1 className="text-2xl font-semibold text-text-1">
                                    Create a new password
                                </h1>
                                <p className="text-md text-text-2 mt-1.5">
                                    Choose something secure and easy to remember
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-0">
                                    <Password label='New Password' placeholder='Create a new password' password={password}
                                        setPassword={setPassword} setPasswordValidation={setPasswordValidation} />
                                </div>
                                <div className="space-y-1">
                                    <Password label='Confirm Password' placeholder='Re-enter new password' password={confirmPassword}
                                        setPassword={setConfirmPassword} setPasswordValidation={setPasswordValidation} />
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                </div>
                                <Button
                                    className="w-full h-10 font-medium disabled:bg-[#E2E8F0] disabled:text-text-3 text-sm"
                                    onClick={reset}
                                    disabled={!password.trim() || !confirmPassword.trim() || !passwordValidation}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </>
                    )}

                    {successfullReset && <>
                        <div className="text-center mb-8">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border mb-5">
                                <VerifyIcon size={24} />
                            </div>
                            <h1 className="text-2xl font-semibold text-text-1 ">
                                Congratulations
                            </h1>
                            <p className="text-md text-text-2 mt-1.5">
                                Your password has been updated.
                            </p>
                        </div>
                        <Button
                            className="w-full h-10 font-medium disabled:bg-[#E2E8F0] disabled:text-text-3 text-sm"
                            onClick={goToDashboard}
                        >
                            Go to Dashboard
                        </Button>
                    </>
                    }

                    {secondFactor && <p className="text-red-500 text-sm">2FA is required</p>}
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

export default ForgotPasswordPage;