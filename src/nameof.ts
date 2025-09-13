/**
 * Gets the name of a class, property (type-safe) or a function (runtime).
 * Usage:
 *   nameof<Type>("Property") // "Property"
 *   nameof(Function)           // "Function"
 */
export function nameof<T>(name: Extract<keyof T, string>): string;
export function nameof(fn: Function): string;
export function nameof(arg: any): string {
    if (typeof arg === "function") {
        return arg.name;
    }
    return arg;
}