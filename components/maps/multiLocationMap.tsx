'use client'

import { GoogleMap, Marker, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Order, OrderStatus } from '@/lib/types/order'
import { Decimal } from '@prisma/client/runtime/client'
import { cleanMapStyles, mapContainerStyle } from '@/lib/maps/mapStyles'
import { getMapIcon } from '@/lib/maps/mapIcons'
import { Navigation } from 'lucide-react'
import { Button } from '../ui/button'
import { formatUTCLocal, getTimeDifference } from '@/lib/timezone'
import { useUserStore } from '@/app/stores/userStore'

type HoveredMarker = {
    position: { lat: number; lng: number }
    type: 'business' | 'courier' | 'delivery'
    order?: Order
} | null

interface MultiLocationMapProps {
    orders?: Order[]
    businessLocation?: { latitude?: Decimal | null; longitude?: Decimal | null } | null
    className?: string
    rightPanelWidth?: number
    selectedOrderId?: string | null
    onOrderClick?: (order: Order) => void
}

export default function MultiLocationMap({
    orders = [],
    businessLocation,
    className = '',
    rightPanelWidth = 0,
    selectedOrderId = null,
    onOrderClick,
}: MultiLocationMapProps) {

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const { businessName } = useUserStore()
    const [hoveredMarker, setHoveredMarker] = useState<HoveredMarker>(null)
    const polylineInstancesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
    const fittedOrderIdsRef = useRef<string | null>(null)
    const zoomResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    })
    const mapOptions = useMemo(() => ({
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        clickableIcons: false,
        styles: cleanMapStyles,
    }), [])

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    const onUnmount = useCallback(() => {
        setMap(null)
    }, [])

    /* ---------------------- BUSINESS POSITION ---------------------- */

    const businessPosition = useMemo(() => {
        if (
            businessLocation?.latitude == null ||
            businessLocation?.longitude == null
        ) return null

        return {
            lat: Number(businessLocation.latitude),
            lng: Number(businessLocation.longitude)
        }
    }, [businessLocation])

    const businessIcon = useMemo(() =>
        getMapIcon('restaurant', false, false, { width: 38, height: 38 }),
        []
    )


    /* ---------------------- DELIVERY MARKERS ---------------------- */

    const deliveryMarkers = useMemo(() => {
        return orders
            .filter(order =>
                order.deliveryAddress?.latitude != null &&
                order.deliveryAddress?.longitude != null
            )
            .map(order => ({
                id: `delivery-${order.id}`,
                position: {
                    lat: Number(order.deliveryAddress!.latitude),
                    lng: Number(order.deliveryAddress!.longitude)
                },
                icon: getMapIcon(
                    'location',
                    order.status === OrderStatus.Unassigned,
                    order.status === OrderStatus.Delivered,
                    { width: 38, height: 38 }
                ),
                order,
            }))
    }, [orders])

    /* ---------------------- COURIER LINES ---------------------- */

    const courierLines = useMemo(() => {
        if (!selectedOrderId) return []
        return orders
            .filter(order =>
                order.id === selectedOrderId &&
                order.courier?.latitude != null &&
                order.courier?.longitude != null &&
                order.courier.latitude !== 0 &&
                order.courier.longitude !== 0
            )
            .flatMap(order => {
                const courierPos = {
                    lat: Number(order.courier!.latitude),
                    lng: Number(order.courier!.longitude)
                }
                const isDelivery = order.status === OrderStatus.Delivery
                const lines = []

                const hasDropoff =
                    order.deliveryAddress?.latitude != null &&
                    order.deliveryAddress?.longitude != null
                const dropoffPos = hasDropoff ? {
                    lat: Number(order.deliveryAddress!.latitude),
                    lng: Number(order.deliveryAddress!.longitude)
                } : null

                // Always show courier → business line
                if (businessPosition) {
                    lines.push({
                        id: `line-pickup-${order.id}`,
                        path: [courierPos, businessPosition],
                        color: '#256FBA',
                        opacity: 1
                    })
                }

                if (!isDelivery) {
                    // Inactive: business → dropoff
                    if (businessPosition && dropoffPos) {
                        lines.push({
                            id: `line-dropoff-business-${order.id}`,
                            path: [businessPosition, dropoffPos],
                            color: '#3194EB',
                            opacity: 0x99 / 0xFF
                        })
                    }
                } else {
                    // Active: courier → dropoff
                    if (dropoffPos) {
                        lines.push({
                            id: `line-dropoff-courier-${order.id}`,
                            path: [courierPos, dropoffPos],
                            color: '#3194EB',
                            opacity: 0x99 / 0xFF
                        })
                    }
                }

                return lines
            })
    }, [orders, businessPosition, selectedOrderId])

    /* ---------------------- UNASSIGNED / REQUESTING DRIVER DOTTED LINES ---------------------- */

    const dottedLines = useMemo(() => {
        if (!businessPosition || !selectedOrderId) return []
        return orders
            .filter(order =>
                order.id === selectedOrderId &&
                (order.status === OrderStatus.Unassigned ||
                    order.status === OrderStatus.RequestingDriver) &&
                order.deliveryAddress?.latitude != null &&
                order.deliveryAddress?.longitude != null
            )
            .map(order => ({
                id: `line-unassigned-${order.id}`,
                path: [
                    businessPosition,
                    {
                        lat: Number(order.deliveryAddress!.latitude),
                        lng: Number(order.deliveryAddress!.longitude)
                    }
                ],
                color: '#0F172A',
                opacity: 0x80 / 0xFF,
                dotted: true
            }))
    }, [orders, businessPosition, selectedOrderId])

    const allLines = useMemo(
        () => [...courierLines, ...dottedLines],
        [courierLines, dottedLines]
    )

    /* ---------------------- COURIER MARKERS ---------------------- */

    const courierMarkers = useMemo(() => {
        return orders
            .filter(order =>
                order.courier?.latitude != null &&
                order.courier?.longitude != null &&
                order.courier.latitude !== 0 &&
                order.courier.longitude !== 0
            )
            .map(order => ({
                id: `courier-${order.id}`,
                position: {
                    lat: Number(order.courier!.latitude),
                    lng: Number(order.courier!.longitude)
                },
                icon: getMapIcon(
                    'car',
                    order.status === OrderStatus.Delivery,
                    false,
                    { width: 38, height: 38 }
                ),
                order,
            }))
    }, [orders])

    /* ---------------------- COURIER LINES (IMPERATIVE) ---------------------- */

    useEffect(() => {
        if (!map || !isLoaded) return

        const instances = polylineInstancesRef.current
        const currentIds = new Set(allLines.map(l => l.id))

        // Remove polylines that no longer exist
        for (const [id, polyline] of instances) {
            if (!currentIds.has(id)) {
                polyline.setMap(null)
                instances.delete(id)
            }
        }

        // Create new or update existing polylines
        for (const line of allLines) {
            const isDotted = 'dotted' in line && line.dotted
            const dottedOptions = isDotted ? {
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
                polyline.setOptions(dottedOptions)
            } else {
                const polyline = new google.maps.Polyline({
                    path: line.path,
                    strokeWeight: 2,
                    map,
                    ...dottedOptions,
                })
                instances.set(line.id, polyline)
            }
        }
    }, [map, isLoaded, allLines])

    // Cleanup all polylines on unmount
    useEffect(() => {
        const instances = polylineInstancesRef.current
        return () => {
            for (const [, polyline] of instances) {
                polyline.setMap(null)
            }
            instances.clear()
        }
    }, [])

    // Cleanup zoom reset timer on unmount
    useEffect(() => {
        return () => {
            if (zoomResetTimerRef.current) clearTimeout(zoomResetTimerRef.current)
        }
    }, [])

    /* ---------------------- FIT BOUNDS ---------------------- */

    const fitAllBounds = useCallback(() => {
        if (!map || !isLoaded) return

        if (orders.length === 0) {
            if (!businessPosition) return
            map.panTo(businessPosition)
            map.setZoom(14)
            const listener = map.addListener('idle', () => {
                const proj = map.getProjection()
                if (!proj) { google.maps.event.removeListener(listener); return }
                const center = map.getCenter()!
                const point = proj.fromLatLngToPoint(center)!
                const scale = Math.pow(2, map.getZoom()!)
                const offsetX = (rightPanelWidth + 16 + 40) / 2 / scale
                map.panTo(proj.fromPointToLatLng(new google.maps.Point(point.x + offsetX, point.y))!)
                google.maps.event.removeListener(listener)
            })
            return
        }

        const bounds = new google.maps.LatLngBounds()
        let hasLocations = false

        if (businessPosition) {
            bounds.extend(businessPosition)
            hasLocations = true
        }

        orders.forEach(order => {
            if (order.deliveryAddress?.latitude != null && order.deliveryAddress?.longitude != null) {
                bounds.extend({ lat: Number(order.deliveryAddress.latitude), lng: Number(order.deliveryAddress.longitude) })
                hasLocations = true
            }
            if (order.courier?.latitude != null && order.courier?.longitude != null &&
                order.courier.latitude !== 0 && order.courier.longitude !== 0) {
                bounds.extend({ lat: Number(order.courier.latitude), lng: Number(order.courier.longitude) })
                hasLocations = true
            }
        })

        if (hasLocations) {
            // right padding = panel width + panel's right-4 margin (16px) + 40px buffer
            map.fitBounds(bounds, {
                top: 80,
                right: rightPanelWidth + 16 + 40,
                bottom: 80,
                left: 80
            })

            const listener = map.addListener('idle', () => {
                const zoom = map.getZoom()
                if (zoom && zoom > 16) {
                    map.setZoom(16)
                }
                google.maps.event.removeListener(listener)
            })
        }
    }, [map, isLoaded, orders, businessPosition, rightPanelWidth])

    const handleZoom = useCallback((direction: 'in' | 'out') => {
        if (!map || !businessPosition) return

        if (zoomResetTimerRef.current) clearTimeout(zoomResetTimerRef.current)

        const targetZoom = (map.getZoom() ?? 12) + (direction === 'in' ? 1 : -1)
        const proj = map.getProjection()

        if (proj) {
            const scale = Math.pow(2, targetZoom)
            const point = proj.fromLatLngToPoint(new google.maps.LatLng(businessPosition))!
            const offsetX = (rightPanelWidth + 16 + 40) / 2 / scale
            const adjustedCenter = proj.fromPointToLatLng(new google.maps.Point(point.x + offsetX, point.y))!
            map.setZoom(targetZoom)
            map.panTo(adjustedCenter)
        } else {
            map.setZoom(targetZoom)
            map.panTo(businessPosition)
        }

        zoomResetTimerRef.current = setTimeout(() => {
            fitAllBounds()
        }, 60_000)
    }, [map, businessPosition, rightPanelWidth, fitAllBounds])

    useEffect(() => {
        if (!map || !isLoaded) return

        if (orders.length === 0) {
            fitAllBounds()
            return
        }

        // Re-fit only when the set of order IDs changes (not on status/data updates)
        const currentOrderIds = orders.map(o => o.id).sort().join(',')
        if (fittedOrderIdsRef.current === currentOrderIds) return
        fittedOrderIdsRef.current = currentOrderIds

        fitAllBounds()
    }, [map, isLoaded, orders, fitAllBounds])

    if (!isLoaded) {
        return (
            <div className={`w-full h-90 bg-gray-100 flex items-center justify-center ${className}`}>
                <div className="text-gray-500">Loading map...</div>
            </div>
        )
    }

    return (
        <div className={`h-90 overflow-hidden border border-border ${className}`}>
            <div className={`relative h-90 overflow-hidden border border-border ${className}`}>
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={12}
                    center={businessPosition!}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        ...mapOptions,
                        zoomControl: false,
                    }}
                >
                    {businessPosition && (
                        <Marker
                            position={businessPosition}
                            icon={businessIcon}
                            onMouseOver={() => setHoveredMarker({ position: businessPosition, type: 'business' })}
                            onMouseOut={() => setHoveredMarker(null)}
                        />
                    )}

                    {deliveryMarkers.map(marker => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            icon={marker.icon}
                            onMouseOver={() => setHoveredMarker({ position: marker.position, type: 'delivery', order: marker.order })}
                            onMouseOut={() => setHoveredMarker(null)}
                            onClick={() => marker.order && onOrderClick?.(marker.order)}
                        />
                    ))}

                    {courierMarkers.map(marker => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            icon={marker.icon}
                            onMouseOver={() => setHoveredMarker({ position: marker.position, type: 'courier', order: marker.order })}
                            onMouseOut={() => setHoveredMarker(null)}
                            onClick={() => marker.order && onOrderClick?.(marker.order)}
                        />
                    ))}

                    {hoveredMarker && (
                        <OverlayView
                            position={hoveredMarker.position}
                            mapPaneName={OverlayView.FLOAT_PANE}
                        >
                            <div
                                className="pointer-events-none"
                                style={{
                                    transform: `translate(-14px, calc(-100% - ${hoveredMarker.type === 'courier' ? 22 :
                                        hoveredMarker.type === 'business' ? 35 :
                                            41
                                        }px))`
                                }}
                            >
                                {hoveredMarker.type === 'business' ? (
                                    <div className="bg-background w-fit rounded-lg shadow-lg px-3 py-2 border border-border whitespace-nowrap">
                                        <p className="text-text-1 font-medium text-xs">{businessName || 'My Delivery Fleet'}</p>
                                    </div>
                                ) : hoveredMarker.type === 'delivery' ? (
                                    <div className="bg-background w-fit rounded-lg shadow-lg px-3 py-2 border border-border whitespace-nowrap">
                                        {hoveredMarker.order?.customerName && (
                                            <p className="text-text-1 font-medium text-xs">{hoveredMarker.order.customerName}</p>
                                        )}
                                        {hoveredMarker.order?.deliveryAddress?.address && (
                                            <p className="text-text-2 font-normal" style={{ fontSize: '11px' }}>{hoveredMarker.order.deliveryAddress.address}</p>
                                        )}
                                    </div>
                                ) : (() => {
                                    const order = hoveredMarker.order!
                                    const timeField = order.status === OrderStatus.PickUp
                                        ? order.estimatedPickupTime
                                        : order.status === OrderStatus.Delivery
                                            ? order.estimatedDeliveryTime
                                            : null
                                    const estimatedTime = timeField
                                        ? (() => {
                                            const info = getTimeDifference(typeof timeField === 'string' ? timeField : timeField.toISOString())
                                            return info.minutes > 0 ? `${info.minutes} mins` : 'Arriving soon'
                                        })()
                                        : null
                                    const dateTime = timeField
                                        ? formatUTCLocal(timeField, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                        : null
                                    return (
                                        <div className="bg-background w-fit rounded-lg shadow-lg px-3 py-2 border border-border whitespace-nowrap min-w-[100px]">
                                            {estimatedTime && (
                                                <p className="text-text-1 font-medium text-xs">{estimatedTime}</p>
                                            )}
                                            {dateTime && (
                                                <p className="text-text-2 font-normal" style={{ fontSize: '11px' }}>{dateTime}</p>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>
                        </OverlayView>
                    )}
                </GoogleMap>
                <Button
                    onClick={() => fitAllBounds()}
                    className="cursor-pointer absolute top-2 left-13.5 z-10 bg-background hover:bg-background/90 rounded px-3 py-2 flex items-center gap-1 text-xs text-text-sidebar"
                >
                    <Navigation className="h-4 w-4" />
                    Recenter
                </Button>
                <div className="absolute top-2 left-2 z-10 flex flex-col">
                    <Button
                        onClick={() => handleZoom('in')}
                        className="cursor-pointer bg-background hover:bg-background/90 rounded-none w-10 h-10 flex items-center justify-center text-text-sidebar text-lg leading-none"
                        aria-label="Zoom in"
                    >
                        +
                    </Button>
                    <Button
                        onClick={() => handleZoom('out')}
                        className="cursor-pointer bg-background hover:bg-background/90 border-0 border-t rounded-none w-10 h-10 flex items-center justify-center text-text-sidebar text-lg leading-none"
                        aria-label="Zoom out"
                    >
                        −
                    </Button>
                </div>
            </div>
        </div>
    )
}
