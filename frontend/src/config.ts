/**
 * API base URL from environment. Works on Windows and Linux.
 * Defaults to '/api' (same-origin; use with dev proxy or same-host in production).
 */
export const API = process.env.REACT_APP_API_URL || '/api';
