'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Search, ChevronDown, Check } from 'lucide-react'

interface BusinessOption {
    id?: string
    name?: string
}

interface SearchableBusinessDropdownProps {
    businesses: BusinessOption[] | undefined
    value: string
    onChange: (value: string, id: string) => void
    placeholder?: string
    className?: string
    error?: boolean
}

export function SearchableBusinessDropdown({
    businesses = [],
    value,
    onChange,
    placeholder = "Select or search business...",
    className = "",
    error = false
}: SearchableBusinessDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [displayedCount, setDisplayedCount] = useState(20)
    const [isLoading, setIsLoading] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const filteredBusinesses = useMemo(() => {
        if (!businesses || !Array.isArray(businesses)) return []
        return businesses.filter(business =>
            business.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [businesses, searchTerm])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setDisplayedCount(20)
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || isLoading) return
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        if (scrollTop + clientHeight >= scrollHeight * 0.8) {
            if (displayedCount < filteredBusinesses.length) {
                setIsLoading(true)
                setTimeout(() => {
                    setDisplayedCount(prev => Math.min(prev + 20, filteredBusinesses.length))
                    setIsLoading(false)
                }, 300)
            }
        }
    }, [displayedCount, filteredBusinesses.length, isLoading])

    const handleSelectBusiness = (business: BusinessOption) => {
        onChange(business.name ?? '', business.id ?? '')
        setIsOpen(false)
        setSearchTerm('')
        setDisplayedCount(20)
    }

    const handleClearSelection = () => {
        onChange('', '')
        setIsOpen(false)
        setSearchTerm('')
        setDisplayedCount(20)
    }

    const selectedBusiness = Array.isArray(businesses)
        ? businesses.find(business => business.id === value)
        : undefined

    const displayedBusinesses = filteredBusinesses.slice(0, displayedCount)

    return (
        <div className={`space-y-1 h-10  lg:w-82 relative ${className}`} ref={dropdownRef}>
            <Button
                type="button"
                variant="outline"
                className={`w-full h-10 text-sm justify-between text-left font-normal text-text-1 ${error ? 'border-red-500' : 'border-border'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate w-full">
                    {selectedBusiness ? (
                        <span className="font-normal text-text-1">
                            {selectedBusiness.name && selectedBusiness.name.length > 15
                                ? selectedBusiness.name.substring(0, 15) + '...'
                                : selectedBusiness.name}
                        </span>
                    ) : (
                        <span className="text-text-3">{placeholder}</span>
                    )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg">
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search business..."
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
                        {/* All Businesses — no badge, just name + checkmark when active */}
                        <button
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={handleClearSelection}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-normal text-sm text-text-1">All Businesses</span>
                                {!value && <Check className="h-4 w-4 text-green-600" />}
                            </div>
                        </button>

                        {filteredBusinesses.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                {searchTerm ? 'No businesses found' : 'No businesses available'}
                            </div>
                        ) : (
                            <div className="py-1">
                                {displayedBusinesses.map((business, index) => (
                                    <button
                                        key={business.id ?? index}
                                        type="button"
                                        className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                                        onClick={() => handleSelectBusiness(business)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-normal text-sm text-text-1">{business.name}</span>
                                            {value === business.id && (
                                                <Check className="h-4 w-4 text-green-600" />
                                            )}
                                        </div>
                                    </button>
                                ))}

                                {isLoading && displayedCount < filteredBusinesses.length && (
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