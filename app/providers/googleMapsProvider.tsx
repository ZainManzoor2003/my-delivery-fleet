'use client'

import { LoadScript } from '@react-google-maps/api'
import { ReactNode } from 'react'

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ['places']

interface GoogleMapsProviderProps {
    children: ReactNode
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
        console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined')
        return <>{children}</>
    }

    return (
        <LoadScript
            googleMapsApiKey={apiKey}
            libraries={GOOGLE_MAPS_LIBRARIES}
            loadingElement={<div></div>}
        >
            {children}
        </LoadScript>
    )
}
