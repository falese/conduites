/**
 * Set environment variables for testing
 * @param vars - Object with key-value pairs to set in process.env
 */
export declare function setEnv(vars: Record<string, string>): void;
/**
 * Clear specific environment variables
 * @param keys - Array of environment variable keys to delete
 */
export declare function clearEnv(keys: string[]): void;
/**
 * Reset environment variables to their original state
 */
export declare function resetEnv(): void;
