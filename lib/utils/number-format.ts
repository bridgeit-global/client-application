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