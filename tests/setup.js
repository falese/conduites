import { beforeEach, afterEach } from 'vitest';
// Store the original environment variables
let originalEnv;
/**
 * Set environment variables for testing
 * @param vars - Object with key-value pairs to set in process.env
 */
export function setEnv(vars) {
    Object.assign(process.env, vars);
}
/**
 * Clear specific environment variables
 * @param keys - Array of environment variable keys to delete
 */
export function clearEnv(keys) {
    keys.forEach(key => {
        delete process.env[key];
    });
}
/**
 * Reset environment variables to their original state
 */
export function resetEnv() {
    // Clear current environment
    Object.keys(process.env).forEach(key => {
        delete process.env[key];
    });
    // Restore original environment
    Object.assign(process.env, originalEnv);
}
/**
 * Store original environment before each test
 */
beforeEach(() => {
    // Create a deep copy of the original environment
    originalEnv = { ...process.env };
});
/**
 * Restore original environment after each test
 */
afterEach(() => {
    resetEnv();
});
//# sourceMappingURL=setup.js.map