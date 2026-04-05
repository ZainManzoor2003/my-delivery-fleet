'use client'

import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { useState } from 'react'
import { GoogleIcon } from '@/components/icons/google'
import Link from 'next/link'
import { VerifyIcon } from '@/components/icons/verify'
import PhoneNumber from '@/components/phoneNumber'
import Password from '@/components/password'
import { Label } from '@/components/ui/label'
import { Formik, Form } from 'formik'
import { signUpSchema, otpSchema } from '@/validations/validations'

export default function SignUpPage() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const [password, setPassword] = useState<string>('')
    const [verifying, setVerifying] = useState<boolean>(false)
    const [error, setError] = useState<string | null>('')
    const [isGoogleSignUpInProgress, setIsGoogleSignUpInProgress] = useState<boolean>(false)
    const [passwordValidation, setPasswordValidation] = useState<boolean>(false)
    const router = useRouter()
    const signUpWithGoogle = () => {
        if (isGoogleSignUpInProgress) return

        setIsGoogleSignUpInProgress(true)
        signUp?.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/fleet'
        })
    }

    const handleEmailSignUp = async (
        values: { email: string, firstName: string, lastName: string, phoneNumber: string },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {

        setError('')
        if (!isLoaded) return
        try {
            await signUp.create({
                emailAddress: values.email,
                password,
                firstName: values.firstName,
                lastName: values.lastName,
                unsafeMetadata: {
                    phoneNumber: values.phoneNumber
                }
            })
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
            setVerifying(true)
        } catch (err) {
            if (isClerkAPIResponseError(err)) {
                setError(err.errors[0]?.longMessage || 'Sign up failed')
            } else {
                setError('An unexpected error occurred')
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }

    const handleVerification = async (
        values: { otp: string },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!isLoaded) return

        setError('')

        try {
            const result = await signUp.attemptEmailAddressVerification({ code: values.otp })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push('/onboarding')
            }
        } catch (err) {
            if (isClerkAPIResponseError(err)) {
                const errorMessage = err.errors[0]?.message || 'Verification failed'

                if (err.errors[0]?.code === 'too_many_requests') {
                    setError('Too many verification attempts. Please wait a few minutes before trying again.')
                } else {
                    setError(errorMessage)
                }
            } else if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('An unexpected error occurred')
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }


    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative p-4">
                <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    <Formik
                        initialValues={{ otp: '' }}
                        validationSchema={otpSchema}
                        onSubmit={handleVerification}
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
                                        <Label className="text-sm font-medium text-text-2 gap-0">
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
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="min-w-xs sm:w-122 px-8 py-10 border-border border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-semibold text-text-1 tracking-normal">
                            Create your business account
                        </h1>

                        <p className="text-text-2 text-md mt-1">
                            Submit your details to request access
                        </p>
                    </div>

                    <Button
                        className="w-full h-10 bg-white hover:bg-white border border-border
                     text-text-2 text-sm font-medium flex gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={signUpWithGoogle}
                        disabled={isGoogleSignUpInProgress}
                    >
                        <GoogleIcon />
                        <Label className='text-sm font-semibold cursor-pointer '>
                            {isGoogleSignUpInProgress ? 'Continuing with Google...' : 'Continue with Google'}
                        </Label>
                    </Button>

                    <div className="relative flex py-3 items-center">
                        <div className="grow border-t border-border"></div>
                        <span className="shrink mx-4 text-xs text-text-3 tracking-widest">or</span>
                        <div className="grow border-t border-border"></div>
                    </div>


                    <Formik
                        initialValues={{ email: '', firstName: '', lastName: '', phoneNumber: '' }}
                        validationSchema={signUpSchema}
                        onSubmit={handleEmailSignUp}
                    >
                        {({ values, handleChange, handleSubmit, errors, touched, isSubmitting, setFieldValue }) => (
                            <Form onSubmit={handleSubmit}>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">
                                                First Name
                                                <span className='text-red-500'>*</span>
                                            </Label>
                                            <Input
                                                name="firstName"
                                                type="text"
                                                placeholder="First Name"
                                                className={`w-full h-10 px-3 rounded-md border focus:outline-none
                                            focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm ${touched.firstName && errors.firstName ? 'border-red-500' : 'border-border'}`}
                                                value={values.firstName}
                                                onChange={handleChange}
                                            />
                                            {touched.firstName && errors.firstName && <span className='text-red-500 text-xs'>{errors.firstName}</span>}
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-sm font-medium text-text-2 gap-0">
                                                Last Name
                                                <span className='text-red-500'>*</span>
                                            </Label>
                                            <Input
                                                name="lastName"
                                                type="text"
                                                placeholder="Last Name"
                                                className={`w-full h-10 px-3 rounded-md border focus:outline-none
                                            focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm ${touched.lastName && errors.lastName ? 'border-red-500' : 'border-border'}`}
                                                value={values.lastName}
                                                onChange={handleChange}
                                            />
                                            {touched.lastName && errors.lastName && <span className='text-red-500 text-xs'>{errors.lastName}</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium text-text-2 gap-0">Email address<span className='text-red-500'>*</span></Label>
                                        <Input
                                            type="email"
                                            name='email'
                                            placeholder="you@company.com"
                                            className={`h-10 placeholder:text-text-3 ${touched.email && errors.email ? 'border-red-500' : 'border-border'}`}
                                            value={values.email}
                                            onChange={handleChange}
                                        />
                                        {touched.email && errors.email && <span className='text-red-500 text-xs'>{errors.email}</span>}
                                    </div>

                                    <div className="space-y-1">
                                        <PhoneNumber label='Phone Number' phoneNumber={values.phoneNumber}
                                            onChange={(formattedValue: string) => setFieldValue('phoneNumber', formattedValue)}
                                            touched={touched} errors={errors} />
                                    </div>

                                    <div className="space-y-1">
                                        <Password label='Password' placeholder='Create a password' password={password}
                                            setPassword={setPassword} setPasswordValidation={setPasswordValidation} />
                                        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                                    </div>

                                    <div id="clerk-captcha" />

                                    <div className="pt-2 text-center">
                                        <Button
                                            disabled={isSubmitting || !passwordValidation}
                                            className="w-full h-10 disabled:bg-[#E2E8F0] disabled:text-text-3 font-medium rounded-md transition-none">
                                            {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                        </Button>
                                        <p className="text-sm text-text-2 mt-3 ">
                                            This does not activate your account instantly
                                        </p>
                                        <p className="text-sm text-text-2 mt-1">
                                            Already have an account?{" "}
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
        </div >
    )
}
