'use client'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Decimal } from '@prisma/client/runtime/client'
import { useUserStore } from '@/app/stores/userStore'
import { cleanMapStyles, mapContainerStyle } from '@/lib/maps/mapStyles'
import { getMapIcon } from '@/lib/maps/mapIcons'

interface OrderFormMapProps {
    deliveryLocation?: { latitude?: number; longitude?: number } | null
    businessLocation?: { latitude?: Decimal | null; longitude?: Decimal | null } | null
    className?: string
}

export default function OrderFormMap({
    deliveryLocation,
    businessLocation,
    className = ''
}: OrderFormMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const { businessAddress } = useUserStore();

    const defaultCenter = useMemo(() => ({
        lat: businessLocation?.latitude ? Number(businessLocation.latitude) : 40.7128,
        lng: businessLocation?.longitude ? Number(businessLocation.longitude) : -74.0060,
    }), [businessLocation?.latitude, businessLocation?.longitude]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    })

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    // Extract primitive values for dependencies
    const businessLat = businessLocation?.latitude ? Number(businessLocation.latitude) : null;
    const businessLng = businessLocation?.longitude ? Number(businessLocation.longitude) : null;
    const deliveryLat = deliveryLocation?.latitude || null;
    const deliveryLng = deliveryLocation?.longitude || null;

    useEffect(() => {
        if (!map || !isLoaded) return;

        const newBounds = new window.google.maps.LatLngBounds();
        let hasLocations = false;

        if (businessLat && businessLng) {
            newBounds.extend({ lat: businessLat, lng: businessLng });
            hasLocations = true;
        }

        if (deliveryLat && deliveryLng) {
            newBounds.extend({ lat: deliveryLat, lng: deliveryLng });
            hasLocations = true;
        }

        if (!hasLocations) return;

        map.fitBounds(newBounds, {
            top: 80,
            right: 80,
            bottom: 80,
            left: 80,
        });

        const listener = map.addListener('idle', () => {
            const currentZoom = map.getZoom();
            if (currentZoom && currentZoom > 16) {
                map.setZoom(16);
            }
            google.maps.event.removeListener(listener);
        });

    }, [
        map,
        isLoaded,
        businessLat,
        businessLng,
        deliveryLat,
        deliveryLng
    ]);

    if (!isLoaded) {
        return (
            <div className={`w-full h-60 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <div className="text-gray-500">Loading map...</div>
            </div>
        )
    }

    return (
        <div className={`h-60 overflow-hidden border border-border rounded-3xl ${className}`}>
            <GoogleMap
                mapContainerStyle={{ ...mapContainerStyle, borderRadius: 'var(--radius-xl)' }}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    cameraControl: false,
                    fullscreenControl: false,
                    zoomControl: true,
                    clickableIcons: false,
                    styles: cleanMapStyles,
                }}
            >
                {businessLat && businessLng && (
                    <Marker
                        position={{ lat: businessLat, lng: businessLng }}
                        icon={getMapIcon('restaurant', false, false, { width: 38, height: 38 })}
                        title={`Pickup Location: ${businessAddress ? (businessAddress.address.length > 20 ? businessAddress.address.substring(0, 20) + '...' : businessAddress.address) : 'N/A'}`}
                    />
                )}

                {deliveryLat && deliveryLng && (
                    <Marker
                        position={{ lat: deliveryLat, lng: deliveryLng }}
                        icon={getMapIcon('location', true, false, { width: 38, height: 38 })}
                        title="Delivery Address"
                    />
                )}
            </GoogleMap>
        </div>
    )
}
