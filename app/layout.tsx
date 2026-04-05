import { type Metadata } from 'next'
import {
	ClerkProvider,
} from '@clerk/nextjs'
import { Geist_Mono } from 'next/font/google'
import './globals.css'
import { TanstackQueryProvider } from './providers/tanstackProviders'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleMapsProvider } from './providers/googleMapsProvider'
import { Inter } from "next/font/google";

const inter = Inter({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-inter",
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export const metadata: Metadata = {
	title: 'My Delivery Fleet',
	description: '',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider
			signInUrl="/sign-in"
			signUpUrl="/sign-up"
			signInFallbackRedirectUrl="/fleet"
			signUpFallbackRedirectUrl="/onboarding"
			afterSignOutUrl="/sign-in"
		>
			<html lang="en">
				<body
					className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
					suppressHydrationWarning
				>
					<main>
						<TanstackQueryProvider>
							<GoogleMapsProvider>
								{children}
								<ToastContainer
									position="top-right"
									autoClose={3000}
									theme="light"
								/>
							</GoogleMapsProvider>
						</TanstackQueryProvider>
					</main>
				</body>
			</html>
		</ClerkProvider>
	)
}
