import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes intelligently – resolves conflicts
 * (e.g. `bg-red-500 bg-blue-500` → `bg-blue-500`).
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
