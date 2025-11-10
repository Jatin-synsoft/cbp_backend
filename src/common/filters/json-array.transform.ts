import { TransformFnParams } from 'class-transformer';

/**
 * Parses strings like:
 *   [1,2,3]
 *   ["a","b"]
 *   ['a','b']
 *   "a,b,c"  --> ["a","b","c"]
 */
export function parseJsonArray<T = any>(
    { value }: TransformFnParams,
    mapFn?: (item: any) => T
): T[] {
    if (!value) return [];

    // If already an array, return it
    if (Array.isArray(value)) return value;

    if (typeof value !== 'string') return [];

    try {
        let cleaned = value.trim();

        // If it's a simple comma-separated string (no [ ])
        if (!cleaned.startsWith('[') && cleaned.includes(',')) {
            const arr = cleaned.split(',').map((v) => v.trim());
            return mapFn ? arr.map(mapFn) : (arr as unknown as T[]);
        }

        // Replace single quotes with double quotes → valid JSON
        cleaned = cleaned.replace(/'/g, '"');

        // Parse JSON
        const parsed = JSON.parse(cleaned);

        if (Array.isArray(parsed)) {
            return mapFn ? parsed.map(mapFn) : parsed;
        }

        return [];
    } catch {
        return [];
    }
}
