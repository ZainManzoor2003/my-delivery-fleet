'use client'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Order, OrderStatus } from '@/lib/types/order'
import { Decimal } from '@prisma/client/runtime/client'
import { useUserStore } from '@/app/stores/userStore'
import { cleanMapStyles, mapContainerStyle } from '@/lib/maps/mapStyles'
import { getMapIcon } from '@/lib/maps/mapIcons'

interface LocationMapProps {
    order: Order
    businessLocation?: { latitude?: Decimal | null; longitude?: Decimal | null } | null
    className?: string
}

export default function LocationMap({
    order,
    businessLocation,
    className = ''
}: LocationMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const polylineInstancesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
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
    const deliveryLat = order?.deliveryAddress?.latitude ? Number(order.deliveryAddress.latitude) : null;
    const deliveryLng = order?.deliveryAddress?.longitude ? Number(order.deliveryAddress.longitude) : null;
    const courierLat = order?.courier?.latitude ? Number(order.courier.latitude) : null;
    const courierLng = order?.courier?.longitude ? Number(order.courier.longitude) : null;

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

        if (courierLat && courierLng) {
            newBounds.extend({ lat: courierLat, lng: courierLng });
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
        deliveryLng,
        courierLat,
        courierLng
    ]);

    /* ---------------------- LINES ---------------------- */

    const lines = useMemo(() => {
        const businessPos = businessLat && businessLng ? { lat: businessLat, lng: businessLng } : null
        const dropoffPos = deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : null
        const courierPos = courierLat && courierLng ? { lat: courierLat, lng: courierLng } : null
        const isDelivery = order.status === OrderStatus.Delivery
        const isUnassignedOrRequesting =
            order.status === OrderStatus.Unassigned ||
            order.status === OrderStatus.RequestingDriver

        const result = []

        if (courierPos) {
            if (businessPos) {
                result.push({ id: 'line-pickup', path: [courierPos, businessPos], color: '#256FBA', opacity: 1 })
            }
            if (!isDelivery) {
                if (businessPos && dropoffPos) {
                    result.push({ id: 'line-dropoff-business', path: [businessPos, dropoffPos], color: '#3194EB', opacity: 0x99 / 0xFF })
                }
            } else {
                if (dropoffPos) {
                    result.push({ id: 'line-dropoff-courier', path: [courierPos, dropoffPos], color: '#3194EB', opacity: 0x99 / 0xFF })
                }
            }
        }

        if (isUnassignedOrRequesting && businessPos && dropoffPos) {
            result.push({ id: 'line-unassigned', path: [businessPos, dropoffPos], color: '#0F172A', opacity: 0x80 / 0xFF, dotted: true })
        }

        return result
    }, [order.status, businessLat, businessLng, deliveryLat, deliveryLng, courierLat, courierLng])

    useEffect(() => {
        if (!map || !isLoaded) return

        const instances = polylineInstancesRef.current
        const currentIds = new Set(lines.map(l => l.id))

        for (const [id, polyline] of instances) {
            if (!currentIds.has(id)) {
                polyline.setMap(null)
                instances.delete(id)
            }
        }

        for (const line of lines) {
            const isDotted = 'dotted' in line && line.dotted
            const lineOptions = isDotted ? {
                strokeOpacity: 0,
                icons: [{
                    icon: {
                        path: 'M 0,-1 0,1',
                        strokeOpacity: line.opacity,
                        strokeColor: line.color,
                        scale: 2,
                    },
                    offset: '0',
                    repeat: '14px',
                }],
            } : {
                strokeColor: line.color,
                strokeOpacity: line.opacity,
            }

            if (instances.has(line.id)) {
                const polyline = instances.get(line.id)!
                polyline.setPath(line.path)
                polyline.setOptions(lineOptions)
            } else {
                instances.set(line.id, new google.maps.Polyline({
                    path: line.path,
                    strokeWeight: 2,
                    map,
                    ...lineOptions,
                }))
            }
        }
    }, [map, isLoaded, lines])

    useEffect(() => {
        const instances = polylineInstancesRef.current
        return () => {
            for (const [, polyline] of instances) polyline.setMap(null)
            instances.clear()
        }
    }, [])

    if (!isLoaded) {
        return (
            <div className={`w-full h-90 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
                <div className="text-gray-500">Loading map...</div>
            </div>
        )
    }

    return (
        <div className={`h-90 rounded-none overflow-hidden border border-border ${className}`}>
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    cameraControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
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
                        key={`delivery-${order.id}`}
                        position={{ lat: deliveryLat, lng: deliveryLng }}
                        icon={getMapIcon('location', order.status === OrderStatus.Unassigned, false, { width: 38, height: 38 })}
                        title={`Drop-off location for Order #${order.orderNumber}\nCustomer Name: ${order.customerName || 'N/A'} \nAddress: ${order.deliveryAddress?.address ? (order.deliveryAddress.address.length > 20
                            ? order.deliveryAddress.address.substring(0, 20) + '...' : order.deliveryAddress.address) : 'N/A'}`}
                    />
                )}

                {courierLat && courierLng && (
                    <Marker
                        key={`courier-order-${order.id}`}
                        position={{ lat: courierLat, lng: courierLng }}
                        icon={getMapIcon('car', order.status === OrderStatus.Delivery, false, { width: 38, height: 38 })}
                        title={`Courier for Order #${order.orderNumber || order.id}\nName: ${order.courier?.name || 'N/A'}\nPhone: ${order.courier?.phone || 'N/A'}`}
                    />
                )}
            </GoogleMap>
        </div>
    )
}
