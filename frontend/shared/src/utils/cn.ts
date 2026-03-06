import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Shared className merger for both workspaces.
 * Why: keeps Tailwind conflict resolution consistent across admin + miniapp primitives.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

