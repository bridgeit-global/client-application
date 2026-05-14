import { ddmmyy } from "./date-format";

export const toKebabCase = (text: string): string => {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

export const camelCaseToTitleCase = (text: string): string => {
    // Split camelCase text by capital letters and rejoin with spaces
    const titleCase = text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // Insert space between lowercase and uppercase letters
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2') // Insert space between capital letters followed by lowercase
        .toLowerCase() // Convert the entire string to lowercase
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize the first letter of each word

    return titleCase;
};

export const snakeToTitle = (str: string) => {
    return str
        .split('_') // Split the string by underscores
        .map(
            (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ) // Capitalize the first letter of each word
        .join(' '); // Join the words with spaces
};

export const convertKeysToTitleCase = (array: Record<string, any>[]): Record<string, any>[] => {
    return array.map((obj) => {
        const newObj: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (key.endsWith('_at')) {
                    newObj[snakeToTitle(key)] = ddmmyy(obj[key]);
                } else {
                    newObj[snakeToTitle(key)] = obj[key];
                }
            }
        }
        return newObj;
    });
};

const CHARGE_SPLIT_CATEGORY_KEY =
    /^(core|regulatory|adherence|additional)_(.+)$/;

/** Excel header for one raw export key on the bill_report "charges split" sheet */
function chargeSplitExportHeaderKey(rawKey: string, allKeys: string[]): string {
    const m = rawKey.match(CHARGE_SPLIT_CATEGORY_KEY);
    if (!m) {
        return snakeToTitle(rawKey);
    }
    const category = m[1];
    const suffix = m[2];
    const sameSuffix = allKeys.filter((k) => {
        const mm = k.match(CHARGE_SPLIT_CATEGORY_KEY);
        return mm && mm[2] === suffix;
    });
    const base = snakeToTitle(suffix);
    if (sameSuffix.length <= 1) {
        return base;
    }
    return `${base} (${snakeToTitle(category)})`;
}

/**
 * Like {@link convertKeysToTitleCase} for bill_report charge-split rows, but charge columns use
 * `{category}_{field}` ids — headers should be the field only (e.g. "Energy Charges"), not
 * "Core Energy Charges". Site id, account number, and bill date keys are unchanged.
 */
export function convertChargeSplitExportKeysToTitleCase(
    array: Record<string, any>[]
): Record<string, any>[] {
    if (!array.length) return [];
    const allKeys = new Set<string>();
    for (const obj of array) {
        for (const k of Object.keys(obj)) {
            allKeys.add(k);
        }
    }
    const allKeysArr = Array.from(allKeys);
    return array.map((obj) => {
        const newObj: Record<string, any> = {};
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
            const header = chargeSplitExportHeaderKey(key, allKeysArr);
            if (key.endsWith('_at')) {
                newObj[header] = ddmmyy(obj[key]);
            } else {
                newObj[header] = obj[key];
            }
        }
        return newObj;
    });
}

/**
 * Sanitizes input by removing special characters
 * Allows alphanumeric characters, spaces, hyphens, and underscores
 * @param value - The input string to sanitize
 * @param allowSpaces - Whether to allow spaces (default: true)
 * @returns Sanitized string with special characters removed
 */
export const sanitizeInput = (value: string, allowSpaces: boolean = true): string => {
    if (allowSpaces) {
        // Allow alphanumeric, spaces, hyphens, and underscores
        return value.replace(/[^a-zA-Z0-9\s\-_]/g, '');
    } else {
        // Allow only alphanumeric, hyphens, and underscores (no spaces)
        return value.replace(/[^a-zA-Z0-9\-_]/g, '');
    }
};
