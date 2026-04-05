/**
 * Timezone utility functions for handling proper date/time conversions
 */

/**
 * Converts a local date string and time string to UTC ISO string
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:MM format
 * @returns UTC ISO string or null if inputs are invalid
 */
export function convertLocalToUTC(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    try {
        // Create a date object in the user's local timezone
        const localDateTime = new Date(`${dateStr}T${timeStr}:00`);

        // Check if the date is valid
        if (isNaN(localDateTime.getTime())) return null;

        // Return UTC ISO string
        return localDateTime.toISOString();
    } catch (error) {
        console.error('Error converting local time to UTC:', error);
        return null;
    }
}

/**
 * Converts a UTC ISO string to the user's local date string
 * @param utcString - UTC ISO string
 * @returns Date string in YYYY-MM-DD format or empty string
 */
export function convertUTCToLocalDate(utcString: string): string {
    if (!utcString) return '';

    try {
        const date = new Date(utcString);
        if (isNaN(date.getTime())) return '';

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error converting UTC to local date:', error);
        return '';
    }
}

/**
 * Converts a UTC ISO string to the user's local time string
 * @param utcString - UTC ISO string
 * @returns Time string in HH:MM format or empty string
 */
export function convertUTCToLocalTime(utcString: string): string {
    if (!utcString) return '';

    try {
        const date = new Date(utcString);
        if (isNaN(date.getTime())) return '';

        return date.toTimeString().substring(0, 5);
    } catch (error) {
        console.error('Error converting UTC to local time:', error);
        return '';
    }
}

/**
 * Formats a UTC ISO string for display in the user's local timezone
 * @param utcString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or 'N/A'
 */
export function formatUTCLocal(utcString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    if (!utcString) return 'N/A';

    try {
        const date = utcString instanceof Date ? utcString : new Date(utcString);
        if (isNaN(date.getTime())) return 'N/A';

        const defaultOptions: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            ...options
        };

        return date.toLocaleString(undefined, defaultOptions);
    } catch (error) {
        console.error('Error formatting UTC date:', error);
        return 'N/A';
    }
}

/**
 * Calculates minutes difference between a UTC time and now in user's local timezone
 * @param utcString - UTC ISO string
 * @returns Object with minutes and formatted string
 */
export function getTimeDifference(utcString: string): { minutes: number; formatted: string } {
    if (!utcString) return { minutes: 0, formatted: 'N/A' };

    try {
        const targetDate = new Date(utcString);
        const now = new Date();

        if (isNaN(targetDate.getTime())) return { minutes: 0, formatted: 'N/A' };

        const diffMs = targetDate.getTime() - now.getTime();
        const diffMins = Math.ceil(Math.abs(diffMs) / (1000 * 60));

        if (diffMs >= 0) {
            return {
                minutes: diffMins,
                formatted: diffMins > 0 ? `${diffMins} min` : 'Arriving soon'
            };
        } else {
            return {
                minutes: -diffMins,
                formatted: `${diffMins} min ago`
            };
        }
    } catch (error) {
        console.error('Error calculating time difference:', error);
        return { minutes: 0, formatted: 'N/A' };
    }
}

/**
 * Gets the user's timezone offset in minutes
 * @returns Timezone offset in minutes
 */
export function getUserTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
}

/**
 * Gets the user's timezone name
 * @returns Timezone name string
 */
export function getUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        console.error('Error getting user timezone:', error);
        return 'UTC';
    }
}

/**
 * Formats a UTC ISO string as a date-only string in the user's local timezone
 * @param utcString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string or 'N/A'
 */
export function formatUTCLocalDate(utcString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    if (!utcString) return 'N/A';
    try {
        const date = utcString instanceof Date ? utcString : new Date(utcString);
        if (isNaN(date.getTime())) return 'N/A';
        const defaultOptions: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            ...options
        };
        return date.toLocaleDateString(undefined, defaultOptions);
    } catch (error) {
        console.error('Error formatting UTC date:', error);
        return 'N/A';
    }
}

/**
 * Formats a UTC ISO string as a time-only string in the user's local timezone
 * @param utcString - UTC ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string or 'N/A'
 */
export function formatUTCLocalTime(utcString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
    if (!utcString) return 'N/A';
    try {
        const date = utcString instanceof Date ? utcString : new Date(utcString);
        if (isNaN(date.getTime())) return 'N/A';
        const defaultOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            ...options
        };
        return date.toLocaleTimeString(undefined, defaultOptions);
    } catch (error) {
        console.error('Error formatting UTC time:', error);
        return 'N/A';
    }
}
