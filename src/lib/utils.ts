import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() → utility to merge Tailwind classes safely
 *
 * Why we need this:
 * - Handles conditional classes (clsx)
 * - Avoids Tailwind conflicts (twMerge)
 *
 * Example:
 * cn("p-2", isActive && "bg-red-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
