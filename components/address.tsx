'use client'

import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { toast } from "react-toastify";

interface AddressInfo {
    address: string
    street: string
    apartment?: string
    city: string
    state: string
    postalCode: string
    latitude?: number
    longitude?: number
}

interface ValidationErrors {
    address?: string | boolean
    street?: string | boolean
    apartment?: string | boolean
    city?: string | boolean
    state?: string | boolean
    postalCode?: string | boolean
}

interface Props {
    addressInfo: AddressInfo
    onChange: (field: string, value: string) => void
    errors: ValidationErrors
    touched: ValidationErrors
    label?: string
    addressLabel?: string
    showMap?: boolean
    enableAddressSearch?: boolean
    allowCurrentLocation?: boolean
    onLocationSelect?: (location: {
        lat: number
        lng: number
        address: string
        street: string
        apartment?: string
        city: string
        state: string
        postalCode: string
    }) => void
    disableFields?: boolean
}

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '8px',
}

const defaultCenter = {
    lat: 37.7749,
    lng: -122.4194,
}

export default function Address({
    addressInfo,
    onChange,
    errors,
    touched,
    label,
    addressLabel = 'Address',
    showMap = false,
    enableAddressSearch = false,
    allowCurrentLocation = false,
    onLocationSelect,
    disableFields,
}: Props) {
    const [center, setCenter] = useState(defaultCenter)
    const [markerPosition, setMarkerPosition] = useState(defaultCenter)
    const [isLoadingLocation, setIsLoadingLocation] = useState(false)

    const mapRef = useRef<google.maps.Map | null>(null)
    const geocoderRef = useRef<google.maps.Geocoder | null>(null)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const streetInputRef = useRef<HTMLInputElement>(null)
    const listenerRef = useRef<google.maps.MapsEventListener | null>(null)
    const isPasting = useRef(false)

    const parseAddressComponents = useCallback((components: google.maps.GeocoderAddressComponent[]) => {
        const result = {
            street_number: '',
            route: '',
            locality: '',
            sublocality: '',
            state: '',
            postal_code: '',
        }

        if (!components) return result

        components.forEach((component) => {
            const types = component.types
            if (types.includes('street_number')) result.street_number = component.long_name
            if (types.includes('route')) result.route = component.long_name
            if (types.includes('locality')) result.locality = component.long_name
            if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
                result.sublocality = component.long_name
            }
            if (types.includes('administrative_area_level_1')) result.state = component.short_name
            if (types.includes('postal_code')) result.postal_code = component.long_name
        })

        return result
    }, [])

    const reverseGeocode = useCallback(
        async (lat: number, lng: number) => {
            if (!geocoderRef.current) return

            try {
                const result = await geocoderRef.current.geocode({ location: { lat, lng } })

                if (result.results[0]) {
                    const formattedAddress = result.results[0].formatted_address
                    const components = parseAddressComponents(result.results[0].address_components)

                    let street = `${components.street_number} ${components.route}`.trim()
                    if (!street && formattedAddress) {
                        street = formattedAddress.split(',')[0].trim()
                    }

                    if (streetInputRef.current) {
                        streetInputRef.current.value = formattedAddress
                    }

                    onChange('address', formattedAddress)
                    onChange('street', street)
                    onChange('city', components.locality || components.sublocality || '')
                    onChange('state', components.state || '')
                    onChange('postalCode', components.postal_code || '')

                    if (onLocationSelect) {
                        onLocationSelect({
                            lat,
                            lng,
                            address: formattedAddress,
                            street,
                            apartment: '',
                            city: components.locality || components.sublocality || '',
                            state: components.state || '',
                            postalCode: components.postal_code || '',
                        })
                    }
                }
            } catch (error) {
                console.error('Reverse geocoding error:', error)
            }
        },
        [onChange, onLocationSelect, parseAddressComponents]
    )

    const handlePlaceChanged = useCallback(() => {
        if (!autocompleteRef.current) return

        try {
            const place = autocompleteRef.current.getPlace()
            if (!place.geometry || !place.geometry.location) return
            const componentsCheck = place.address_components || []

            const hasStreetNumber = componentsCheck.some(c => c.types.includes('street_number'))
            const hasRoute = componentsCheck.some(c => c.types.includes('route'))
            const hasCity = componentsCheck.some(c =>
                c.types.includes('locality') || c.types.includes('sublocality_level_1')
            )
            const hasState = componentsCheck.some(c => c.types.includes('administrative_area_level_1'))
            const hasPostalCode = componentsCheck.some(c => c.types.includes('postal_code'))

            if (!hasStreetNumber || !hasRoute) {
                toast.error('Please select a full street address including a street number')
                if (streetInputRef.current) streetInputRef.current.value = ''
                return
            }

            if (!hasCity || !hasState) {
                toast.error('Selected address is missing city or state. Please try a more specific address.')
                if (streetInputRef.current) streetInputRef.current.value = ''
                return
            }

            if (!hasPostalCode) {
                toast.error('Selected address is missing a postal code. Please try a more specific address.')
                if (streetInputRef.current) streetInputRef.current.value = ''
                return
            }

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const formattedAddress = place.formatted_address || ''

            setCenter({ lat, lng })
            setMarkerPosition({ lat, lng })

            if (mapRef.current) {
                if (place.geometry.viewport) {
                    mapRef.current.fitBounds(place.geometry.viewport)
                } else {
                    mapRef.current.setCenter({ lat, lng })
                    mapRef.current.setZoom(17)
                }
            }

            const components = parseAddressComponents(place.address_components || [])

            let street = `${components.street_number} ${components.route}`.trim()
            if (!street && formattedAddress) {
                street = formattedAddress.split(',')[0].trim()
            }

            onChange('address', formattedAddress)
            onChange('street', street)
            onChange('city', components.locality || components.sublocality || '')
            onChange('state', components.state || '')
            onChange('postalCode', components.postal_code || '')

            if (onLocationSelect) {
                onLocationSelect({
                    lat,
                    lng,
                    address: formattedAddress,
                    street,
                    apartment: '',
                    city: components.locality || components.sublocality || '',
                    state: components.state || '',
                    postalCode: components.postal_code || '',
                })
            }
        } catch (error) {
            console.error('Error handling place change:', error)
        }
    }, [onChange, onLocationSelect, parseAddressComponents])

    // Reinitialize autocomplete — call this after autofill clears the field
    const reinitAutocomplete = useCallback(() => {
        if (!streetInputRef.current || !window.google?.maps?.places) return

        if (listenerRef.current) {
            google.maps.event.removeListener(listenerRef.current)
            listenerRef.current = null
        }

        if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current)
            autocompleteRef.current = null
        }

        autocompleteRef.current = new window.google.maps.places.Autocomplete(
            streetInputRef.current,
            {
                fields: ['address_components', 'geometry', 'formatted_address'],
                types: ['geocode'],
                componentRestrictions: { country: 'us' }
            },
        )

        listenerRef.current = autocompleteRef.current.addListener('place_changed', handlePlaceChanged)
    }, [handlePlaceChanged])

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map
        geocoderRef.current = new google.maps.Geocoder()
    }, [])

    useEffect(() => {
        if (!enableAddressSearch || !streetInputRef.current) return

        const initAutocomplete = () => {
            if (!window.google?.maps?.places || !streetInputRef.current) return

            try {
                if (listenerRef.current) {
                    google.maps.event.removeListener(listenerRef.current)
                    listenerRef.current = null
                }

                if (!autocompleteRef.current) {
                    autocompleteRef.current = new window.google.maps.places.Autocomplete(
                        streetInputRef.current,
                        {
                            fields: ['address_components', 'geometry', 'formatted_address'],
                            types: ['geocode'],
                            componentRestrictions: { country: 'us' }
                        }
                    )
                }

                listenerRef.current = autocompleteRef.current.addListener('place_changed', handlePlaceChanged)
            } catch (error) {
                console.error('Error initializing autocomplete:', error)
            }
        }

        if (window.google?.maps?.places) {
            initAutocomplete()
        } else {
            const checkGoogle = setInterval(() => {
                if (window.google?.maps?.places) {
                    clearInterval(checkGoogle)
                    initAutocomplete()
                }
            }, 100)
            return () => clearInterval(checkGoogle)
        }

        return () => {
            if (listenerRef.current) {
                google.maps.event.removeListener(listenerRef.current)
                listenerRef.current = null
            }
        }
    }, [enableAddressSearch, handlePlaceChanged])

    const onMapClick = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                const lat = e.latLng.lat()
                const lng = e.latLng.lng()
                setMarkerPosition({ lat, lng })
                setCenter({ lat, lng })
                reverseGeocode(lat, lng)
            }
        },
        [reverseGeocode]
    )

    const onMarkerDragEnd = useCallback(
        (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                const lat = e.latLng.lat()
                const lng = e.latLng.lng()
                setMarkerPosition({ lat, lng })
                reverseGeocode(lat, lng)
            }
        },
        [reverseGeocode]
    )

    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            return
        }

        setIsLoadingLocation(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude

                setCenter({ lat, lng })
                setMarkerPosition({ lat, lng })
                setIsLoadingLocation(false)

                if (mapRef.current) {
                    mapRef.current.setCenter({ lat, lng })
                    mapRef.current.setZoom(17)
                }

                reverseGeocode(lat, lng)
            },
            (error) => {
                setIsLoadingLocation(false)
                let errorMessage = 'Unable to get your location'

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access in your browser settings.'
                        break
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.'
                        break
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.'
                        break
                }

                toast.error(errorMessage)
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }, [reverseGeocode])

    useEffect(() => {
        if (addressInfo.latitude && addressInfo.longitude) {
            const newCenter = { lat: addressInfo.latitude, lng: addressInfo.longitude }
            setCenter(newCenter)
            setMarkerPosition(newCenter)
        }
    }, [addressInfo.latitude, addressInfo.longitude])


    return (
        <div className="space-y-5">
            {label && <h3 className="text-sm font-semibold text-text-1">{label}</h3>}

            <div className="space-y-1">
                <Label className="text-sm font-medium text-text-2 gap-0">{addressLabel}<span className='text-red-500'>*</span></Label>
                <div className="relative">
                    <Input
                        ref={streetInputRef}
                        disabled={disableFields}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        name="address"
                        type="text"
                        placeholder={enableAddressSearch ? 'Search address or enter manually' : 'Address'}
                        className={cn(
                            'w-full h-10 px-3 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm',
                            errors.address && touched.address ? 'border-red-500' : 'border-border',
                            enableAddressSearch && 'pr-10',
                        )}
                        defaultValue={enableAddressSearch ? addressInfo.address : undefined}
                        value={enableAddressSearch ? undefined : addressInfo.address || ''}
                        onChange={enableAddressSearch ? undefined : (e) => onChange('address', e.target.value)}
                        onPaste={(e) => {
                            if (!enableAddressSearch) return;
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            if (streetInputRef.current) {
                                isPasting.current = true;
                                streetInputRef.current.value = pastedText;
                                streetInputRef.current.focus();
                                streetInputRef.current.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
                                streetInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
                                streetInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }}
                        onDrop={(e) => e.preventDefault()}
                        onInput={(e) => {
                            if (!enableAddressSearch) return;
                            const inputType = (e.nativeEvent as InputEvent).inputType;
                            if (!inputType && !isPasting.current) {
                                // autofill detected — clear and reinit so next paste works
                                (e.target as HTMLInputElement).value = '';
                                reinitAutocomplete();
                            }
                            isPasting.current = false;
                        }}
                    />
                    {enableAddressSearch && <MapPin className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />}
                </div>
                {touched.address && errors.address && <span className='text-red-500 text-xs'>{errors.address}</span>}

                {(showMap || enableAddressSearch) && allowCurrentLocation && (
                    <div className="flex justify-end mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            disabled={isLoadingLocation}
                            className="h-8 text-xs gap-1.5 border-border hover:bg-slate-50"
                        >
                            {isLoadingLocation ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Navigation className="h-3.5 w-3.5" />
                            )}
                            {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
                        </Button>
                    </div>
                )}
            </div>

            {showMap && (
                <div className="relative">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={center}
                        zoom={15}
                        onClick={onMapClick}
                        onLoad={onMapLoad}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
                        }}
                    >
                        <Marker position={markerPosition} draggable={true} onDragEnd={onMarkerDragEnd} />
                    </GoogleMap>
                </div>
            )}

            <div className="space-y-1">
                <Label className="text-sm font-medium text-text-2">Apartment, Suite etc (optional)</Label>
                <Input
                    disabled={disableFields}
                    name="apartment"
                    type="text"
                    placeholder="Apartment, Suite etc"
                    className={cn(
                        'w-full h-10 px-3 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm',
                        errors.apartment && touched.apartment ? 'border-red-500' : 'border-border'
                    )}
                    value={addressInfo.apartment || ''}
                    onChange={(e) => onChange('apartment', e.target.value)}
                />
            </div>
            {/* <div className="space-y-1">
                <Label className="text-sm font-medium text-text-2 gap-0">City<span className='text-red-500'>*</span></Label>
                <Input
                    name="city"
                    type="text"
                    autoComplete="off"
                    placeholder="City"
                    className={cn(
                        'w-full h-10 px-3 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm',
                        errors.city && touched.city ? 'border-red-500' : 'border-border'
                    )}
                    value={addressInfo.city || ''}
                    onChange={(e) => onChange('city', e.target.value)}
                    onInput={(e) => handleControlledInput(e, 'city')}
                    onDrop={(e) => e.preventDefault()}
                    onPaste={(e) => {
                        e.preventDefault();
                        const val = e.clipboardData.getData('text');
                        onChange('city', val);
                    }}
                />
                {touched.city && errors.city && <span className='text-red-500 text-xs'>{errors.city}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2 gap-0">State<span className='text-red-500'>*</span></Label>
                    <Input
                        name="state"
                        type="text"
                        autoComplete="off"
                        placeholder="State"
                        className={cn(
                            'w-full h-10 px-3 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm',
                            errors.state && touched.state ? 'border-red-500' : 'border-border'
                        )}
                        disabled={!!restrictToState}
                        value={addressInfo.state || ''}
                        onChange={(e) => onChange('state', e.target.value)}
                        onInput={(e) => handleControlledInput(e, 'state')}
                        onDrop={(e) => e.preventDefault()}
                        onPaste={(e) => {
                            e.preventDefault();
                            const val = e.clipboardData.getData('text');
                            onChange('state', val);
                        }}
                    />
                    {touched.state && errors.state && <span className='text-red-500 text-xs'>{errors.state}</span>}
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2 gap-0">Postal Code<span className='text-red-500'>*</span></Label>
                    <Input
                        name="postalCode"
                        type="text"
                        autoComplete="off"
                        placeholder="Postal Code"
                        className={cn(
                            'w-full h-10 px-3 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-text-3 text-sm',
                            errors.postalCode && touched.postalCode ? 'border-red-500' : 'border-border'
                        )}
                        value={addressInfo.postalCode || ''}
                        onChange={(e) => onChange('postalCode', e.target.value)}
                        onInput={(e) => handleControlledInput(e, 'postalCode')}
                        onDrop={(e) => e.preventDefault()}
                        onPaste={(e) => {
                            e.preventDefault();
                            const val = e.clipboardData.getData('text');
                            onChange('postalCode', val);
                        }}
                    />
                    {touched.postalCode && errors.postalCode && <span className='text-red-500 text-xs'>{errors.postalCode}</span>}
                </div>
            </div> */}
        </div>
    )
}