export const formatRupees = (
    amount: string | number | null | undefined
): string => {
    // Return empty string if amount is not provided
    if (amount == null || amount === '') {
        return '';
    }

    // Convert string to number if necessary
    const numericAmount =
        typeof amount === 'string' ? parseFloat(amount) : amount;

    // Check if the conversion to number was successful
    if (isNaN(numericAmount)) {
        return '';
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(numericAmount);
};

export const formatNumber = (num: any): string => {
    // If input is invalid, assume it is 0
    if (typeof num !== 'number' || isNaN(num)) {
        num = 0;
    }

    if (num < 1000) {
        return String(num); // No formatting needed for numbers below 1000
    }

    const suffixes = ['', 'k', 'M', 'B', 'T']; // Supports thousands, millions, billions, trillions
    let suffixIndex = 0;

    // Reduce the number and determine the appropriate suffix
    while (num >= 1000 && suffixIndex < suffixes.length - 1) {
        num /= 1000;
        suffixIndex++;
    }

    // Format to one decimal place if necessary
    return `${num.toFixed(num % 1 === 0 ? 0 : 1)}${suffixes[suffixIndex]}`;
};

/**
 * Formats minutes into a human-readable time format (e.g., "4d 6h 5m")
 * @param minutes - The number of minutes to format
 * @returns Formatted string like "4d 6h 5m" or "6h 5m" or "5m"
 */
export const formatMinutesToTime = (minutes: number): string => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
        return '0m';
    }

    const totalMinutes = Math.floor(minutes);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const mins = totalMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

    return parts.join(' ');
};