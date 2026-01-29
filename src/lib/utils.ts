import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes intelligently.
 * Later classes override earlier ones when conflicts exist.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
