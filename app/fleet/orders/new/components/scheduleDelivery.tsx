'use client'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { DeliveryType } from '@/lib/enums/deliveryType'
import { CalendarIcon, Clock, ChevronDown, Pencil, ArrowLeft, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

interface ScheduleDeliveryInfo {
    deliveryDate: string
    deliveryTime: string
}

interface ValidationErrors {
    deliveryDate?: string | boolean
    deliveryTime?: string | boolean
}

interface Props {
    values: ScheduleDeliveryInfo
    onChange: (field: string, value: string) => void
    touched: ValidationErrors
    errors: ValidationErrors
    setFieldValue: (field: string, value: string) => void
    deliveryType: DeliveryType
    setDeliveryType: (type: DeliveryType) => void
}

const generateTimeOptions = () => {
    const times: { label: string; value: string }[] = []
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 15) {
            const h12 = hour % 12 === 0 ? 12 : hour % 12
            const ampm = hour < 12 ? 'AM' : 'PM'
            const label = `${h12}:${min.toString().padStart(2, '0')} ${ampm}`
            const value = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
            times.push({ label, value })
        }
    }
    return times
}

const TIME_OPTIONS = generateTimeOptions()
const AM_OPTIONS = TIME_OPTIONS.slice(0, 48)
const PM_OPTIONS = TIME_OPTIONS.slice(48)

const formatCustomTime = (value: string) => {
    if (!value) return ''
    const [h, m] = value.split(':').map(Number)
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

// Parse input like "3:45" or "12:30"
const parseDisplayTime = (raw: string): { hours: number; minutes: number } | null => {
    const parts = raw.split(':');
    if (parts.length !== 2) return null;

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    // Validation: Hour must be 1-12, Minutes 0-59
    if (isNaN(hours) || isNaN(minutes)) return null;
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
    if (parts[1].length !== 2) return null; // Ensure mm format (e.g., 1:05 not 1:5)

    return { hours, minutes };
};

const to24h = (h12: number, minutes: number, ampm: 'AM' | 'PM'): string => {
    let hour = h12
    if (ampm === 'AM' && h12 === 12) hour = 0
    if (ampm === 'PM' && h12 !== 12) hour += 12
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Format input while typing — auto-insert colon
const formatTimeInput = (raw: string) => {
    // Remove all non-digits
    let digits = raw.replace(/\D/g, '');

    // Limit to 4 digits (HHMM)
    digits = digits.slice(0, 4);

    if (digits.length === 0) return '';

    // Logic for Hours
    if (digits.length <= 2) {
        const hour = parseInt(digits);
        // If user types something > 12, force it to 12 or 1
        if (hour > 12) return '12';
        if (digits === '00') return '12'; // Optional: handle 00 as 12
        return digits;
    }

    // Logic for Minutes (digits.length is 3 or 4)
    const hour = digits.slice(0, digits.length - 2);
    let min = digits.slice(digits.length - 2);

    // Ensure minutes don't exceed 59
    if (parseInt(min) > 59) min = '59';

    // Ensure hour is still valid after adding minutes
    const validHour = parseInt(hour) > 12 ? '12' : hour;

    return `${validHour}:${min}`;
};

export default function ScheduleDelivery({ values, touched, errors, onChange, deliveryType, setDeliveryType }: Props) {
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [timeOpen, setTimeOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'AM' | 'PM'>(() => {
        if (!values.deliveryTime) return 'AM'
        const hour = parseInt(values.deliveryTime.split(':')[0])
        return hour < 12 ? 'AM' : 'PM'
    })
    const [isCustomTime, setIsCustomTime] = useState(false)
    const [customDisplay, setCustomDisplay] = useState('') // typed text
    const [customAmPm, setCustomAmPm] = useState<'AM' | 'PM'>('AM')
    const [customError, setCustomError] = useState('')

    const timeDropdownRef = useRef<HTMLDivElement>(null)
    const selectedItemRef = useRef<HTMLButtonElement>(null)
    const customInputRef = useRef<HTMLInputElement>(null)

    const selectedDate = values.deliveryDate ? parseISO(values.deliveryDate) : undefined
    const selectedOption = TIME_OPTIONS.find(t => t.value === values.deliveryTime)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (timeDropdownRef.current && !timeDropdownRef.current.contains(e.target as Node)) {
                setTimeOpen(false)
                setIsCustomTime(false)
                setCustomError('')
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        if (timeOpen && selectedItemRef.current) {
            setTimeout(() => selectedItemRef.current?.scrollIntoView({ block: 'center' }), 0)
        }
    }, [timeOpen, activeTab])

    useEffect(() => {
        if (isCustomTime && customInputRef.current) {
            setTimeout(() => customInputRef.current?.focus(), 50)
        }
    }, [isCustomTime])

    const handleTimeSelect = (timeValue: string) => {
        onChange('deliveryTime', timeValue)
        setIsCustomTime(false)
        setTimeOpen(false)
    }

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatTimeInput(e.target.value)
        setCustomDisplay(formatted)
        setCustomError('')
    }

    const handleCustomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleCustomTimeConfirm()
        if (e.key === 'Escape') handleSwitchToPreset()
    }

    const handleCustomTimeConfirm = () => {
        const parsed = parseDisplayTime(customDisplay)
        if (!parsed) {
            setCustomError('Enter valid time (HH:MM)')
            return
        }
        const value = to24h(parsed.hours, parsed.minutes, customAmPm)
        onChange('deliveryTime', value)
        setIsCustomTime(false)
        setTimeOpen(false)
        setCustomError('')
    }

    const handleSwitchToCustom = () => {
        if (values.deliveryTime) {
            const [h, m] = values.deliveryTime.split(':').map(Number)
            const ampm: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM'
            const h12 = h % 12 === 0 ? 12 : h % 12
            setCustomDisplay(`${h12}:${m.toString().padStart(2, '0')}`)
            setCustomAmPm(ampm)
        } else {
            setCustomDisplay('')
            setCustomAmPm('AM')
        }
        setCustomError('')
        setIsCustomTime(true)
    }

    const handleSwitchToPreset = () => {
        setIsCustomTime(false)
        setCustomError('')
    }

    const currentOptions = activeTab === 'AM' ? AM_OPTIONS : PM_OPTIONS
    const displayLabel = selectedOption ? selectedOption.label : values.deliveryTime ? formatCustomTime(values.deliveryTime) : null

    return (
        <div className="space-y-7">
            <h2 className="text-lg font-medium text-text-1">Delivery Type</h2>

            <div className="flex gap-2">
                <div
                    className={cn(
                        'min-w-30 flex items-center justify-center h-10 py-1 px-4 rounded-xl border cursor-pointer text-sm font-medium transition-all',
                        deliveryType === DeliveryType.SCHEDULE
                            ? 'border-border text-text-2'
                            : 'border-[#3194EB] bg-[#F5FAFE] text-text-1 dark:bg-muted'
                    )}
                    onClick={() => setDeliveryType(DeliveryType.ASAP)}
                >
                    ASAP
                </div>

                <div
                    className={cn(
                        'min-w-36 flex items-center justify-center h-10 py-1 px-4 rounded-xl border cursor-pointer text-sm font-medium transition-all',
                        deliveryType === DeliveryType.ASAP
                            ? 'border-border text-text-2'
                            : 'border-[#3194EB] bg-[#F5FAFE] text-text-1 dark:bg-muted'
                    )}
                    onClick={() => setDeliveryType(DeliveryType.SCHEDULE)}
                >
                    Schedule
                </div>
            </div>

            {deliveryType === DeliveryType.SCHEDULE && (
                <div className="grid grid-cols-2 gap-4">
                    {/* Delivery Date */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium text-text-2 gap-0">
                            Delivery Date <span className="text-red-500">*</span>
                        </Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'h-10 w-full justify-start text-left font-normal',
                                        !selectedDate && 'text-muted-foreground',
                                        errors.deliveryDate && touched.deliveryDate
                                            ? 'border-red-500'
                                            : 'border-border'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                    {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Pick a date'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        onChange('deliveryDate', date ? format(date, 'yyyy-MM-dd') : '')
                                        setCalendarOpen(false)
                                    }}
                                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        {touched.deliveryDate && errors.deliveryDate && (
                            <span className="text-red-500 text-xs">{errors.deliveryDate}</span>
                        )}
                    </div>

                    {/* Delivery Time */}
                    <div className="space-y-1">
                        <Label className="text-sm font-medium text-text-2 gap-0">
                            Delivery Time <span className="text-red-500">*</span>
                        </Label>

                        <div className="relative" ref={timeDropdownRef}>
                            {/* Trigger */}
                            <button
                                type="button"
                                onClick={() => {
                                    setTimeOpen((prev) => !prev)
                                    setIsCustomTime(false)
                                    setCustomError('')
                                }}
                                className={cn(
                                    'flex items-center justify-between w-full h-10 px-3 rounded-xl border bg-background text-sm transition-colors',
                                    errors.deliveryTime && touched.deliveryTime ? 'border-red-500' : 'border-border',
                                    !displayLabel && 'text-muted-foreground'
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                                    {displayLabel ?? 'Select time'}
                                </span>
                                <ChevronDown
                                    className={cn('h-4 w-4 text-gray-400 transition-transform duration-200', timeOpen && 'rotate-180')}
                                />
                            </button>

                            {/* Dropdown */}
                            {timeOpen && (
                                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-lg overflow-hidden">
                                    {!isCustomTime ? (
                                        <>
                                            <div className="flex border-b border-border">
                                                {(['AM', 'PM'] as const).map((tab) => (
                                                    <button
                                                        key={tab}
                                                        type="button"
                                                        onClick={() => setActiveTab(tab)}
                                                        className={cn(
                                                            'flex-1 py-2 text-sm font-medium transition-colors',
                                                            activeTab === tab
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'text-text-2 hover:bg-muted/50'
                                                        )}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="max-h-48 overflow-y-auto py-1">
                                                {currentOptions.map((option) => {
                                                    const isSelected = option.value === values.deliveryTime
                                                    return (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            ref={isSelected ? selectedItemRef : undefined}
                                                            onClick={() => handleTimeSelect(option.value)}
                                                            className={cn(
                                                                'w-full text-left px-4 py-2 text-sm transition-colors',
                                                                isSelected
                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                    : 'text-text-1 hover:bg-muted/50'
                                                            )}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            <div className="border-t border-border p-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSwitchToCustom}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-primary rounded-md hover:bg-primary/5 transition-colors font-medium"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Enter custom time
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-0">
                                            <div className="flex border-b border-border">
                                                {(['AM', 'PM'] as const).map((period) => (
                                                    <button
                                                        key={period}
                                                        type="button"
                                                        onClick={() => setCustomAmPm(period)}
                                                        className={cn(
                                                            'flex-1 py-2 text-sm font-medium transition-colors',
                                                            customAmPm === period
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'text-text-2 hover:bg-muted/50'
                                                        )}
                                                    >
                                                        {period}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-3 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text-1">Custom Time</span>
                                                    <button
                                                        type="button"
                                                        onClick={handleSwitchToPreset}
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        <ArrowLeft className="h-3 w-3" />
                                                        Back
                                                    </button>
                                                </div>

                                                <input
                                                    ref={customInputRef}
                                                    type="text"
                                                    placeholder="HH:MM"
                                                    inputMode="numeric"
                                                    value={customDisplay}
                                                    onChange={handleCustomInputChange}
                                                    onKeyDown={handleCustomInputKeyDown}
                                                    maxLength={5}
                                                    className={cn(
                                                        'w-full h-10 px-3 rounded-lg border bg-background text-sm font-mono text-center outline-none',
                                                        customError ? 'border-red-400' : 'border-border',
                                                        'focus:ring-2 focus:ring-primary/30 focus:border-primary'
                                                    )}
                                                />
                                                {customError && <p className="text-xs text-red-500">{customError}</p>}

                                                <button
                                                    type="button"
                                                    onClick={handleCustomTimeConfirm}
                                                    disabled={!customDisplay}
                                                    className={cn(
                                                        'w-full py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
                                                        customDisplay
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                    )}
                                                >
                                                    <Check className="h-3.5 w-3.5" /> Confirm Time
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {touched.deliveryTime && errors.deliveryTime && (
                            <span className="text-red-500 text-xs">{errors.deliveryTime}</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}