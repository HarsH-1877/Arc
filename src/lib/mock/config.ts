/**
 * Keeps local design work independent from external services while allowing a
 * deployment to opt into the real database without touching source code.
 */
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
