'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, ChevronDown, Check } from 'lucide-react'

interface OrderOption {
    id?: string
    orderNumber?: string
    createdAt?: string | Date
}

interface SearchableOrderDropdownProps {
    orders: OrderOption[] | undefined
    value: string
    onChange: (value: string, id: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    error?: boolean
}

export function SearchableOrderDropdown({
    orders = [],
    value,
    onChange,
    disabled,
    placeholder = "Select or search order...",
    className = "",
    error = false
}: SearchableOrderDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [displayedCount, setDisplayedCount] = useState(20)
    const [isLoading, setIsLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const filteredOrders = useMemo(() => {
        if (!orders || !Array.isArray(orders)) {
            return []
        }

        return orders.filter(order =>
            order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.createdAt && new Date(order.createdAt).toLocaleDateString().includes(searchTerm))
        )
    }, [orders, searchTerm])

    // FIX: Instead of resetting displayedCount in a useEffect (which causes cascading renders),
    // reset it directly in the search input's onChange handler alongside the searchTerm update.
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setDisplayedCount(20)
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }, [isOpen])

    // Infinite scroll handler
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || isLoading) return

        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current

        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            if (displayedCount < filteredOrders.length) {
                setIsLoading(true)
                setTimeout(() => {
                    setDisplayedCount(prev => Math.min(prev + 20, filteredOrders.length))
                    setIsLoading(false)
                }, 300)
            }
        }
    }, [displayedCount, filteredOrders.length, isLoading])

    const handleSelectOrder = (order: OrderOption) => {
        onChange(order.orderNumber ?? '', order.id ?? '')
        setIsOpen(false)
        setSearchTerm('')
        setDisplayedCount(20)
    }

    const selectedOrder = Array.isArray(orders) ? orders.find(order => order.orderNumber === value) : undefined

    const formatDate = (dateString?: string | Date) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const displayedOrders = filteredOrders.slice(0, displayedCount)

    return (
        <div className={`space-y-1 relative ${className}`} ref={dropdownRef}>
            <Label className="text-sm font-medium text-text-2 gap-0">Order # <span className='text-red-500'>*</span></Label>

            <Button
                type="button"
                variant="outline"
                className={`w-full h-10 text-sm justify-between text-left font-normal text-text-1 ${error ? 'border-red-500' : 'border-border'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedOrder ? (
                        <div className="flex items-center gap-2">
                            <span className="font-normal text-text-1">{selectedOrder.orderNumber}</span>
                            <Badge variant="secondary" className="text-xs">
                                {formatDate(selectedOrder.createdAt)}
                            </Badge>
                        </div>
                    ) : (
                        <span className="text-text-3">{placeholder}</span>
                    )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>

            {isOpen && !disabled && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg">
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search orders..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="pl-10 h-9"
                            />
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        className="max-h-60 overflow-y-auto"
                        onScroll={handleScroll}
                    >
                        {filteredOrders.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchTerm ? 'No orders found' : 'No orders available'}
                            </div>
                        ) : (
                            <div className="py-1">
                                {displayedOrders.map((order, index) => (
                                    <button
                                        key={order.id ?? index}
                                        type="button"
                                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => handleSelectOrder(order)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-normal text-sm text-text-1">{order.orderNumber}</span>
                                                <span className="text-xs text-text-2">
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </div>
                                            {value === order.orderNumber && (
                                                <Check className="h-4 w-4 text-green-600" />
                                            )}
                                        </div>
                                    </button>
                                ))}

                                {isLoading && displayedCount < filteredOrders.length && (
                                    <div className="flex items-center justify-center p-3">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-xs text-muted-foreground">Loading more...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}