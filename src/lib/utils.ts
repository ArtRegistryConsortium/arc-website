import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Get an environment variable with type safety
 * @param key The environment variable key
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
	const value = import.meta.env[key];
	return value !== undefined ? value : defaultValue;
}

/**
 * Format file size in a human-readable format
 * @param bytes The file size in bytes
 * @returns A human-readable file size string
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) {
		return bytes + ' bytes';
	} else if (bytes < 1024 * 1024) {
		return (bytes / 1024).toFixed(1) + ' KB';
	} else {
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
}
