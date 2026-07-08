// API base URL — includes /api suffix
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://xoto.ae/api';

// Socket server URL — no /api suffix
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://xoto.ae';

// Frontend app domain
const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'https://vault.xoto.ae';

export { API_BASE, SOCKET_URL, APP_DOMAIN };