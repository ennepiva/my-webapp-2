// apiConfig.js
// Put your Discogs token in localStorage instead of committing it here:
// localStorage.setItem('cratedigger_discogs_token', 'YOUR_TOKEN')
// You can also paste a token into the app if a Discogs request needs one.

const DISCOGS_TOKEN_STORAGE_KEY = 'cratedigger_discogs_token';
const FALLBACK_USER_AGENT = 'CrateDigger/2.0 +https://www.discogs.com';

export function getDiscogsToken() {
    try {
        return localStorage.getItem(DISCOGS_TOKEN_STORAGE_KEY) || '';
    } catch (e) {
        return '';
    }
}

export function setDiscogsToken(token) {
    try {
        const cleaned = String(token || '').trim();
        if (cleaned) localStorage.setItem(DISCOGS_TOKEN_STORAGE_KEY, cleaned);
        else localStorage.removeItem(DISCOGS_TOKEN_STORAGE_KEY);
        return true;
    } catch (e) {
        console.warn('Could not save Discogs token:', e);
        return false;
    }
}

export function getDiscogsApiHeaders() {
    const headers = { 'User-Agent': FALLBACK_USER_AGENT };
    const token = getDiscogsToken();
    if (token) headers.Authorization = `Discogs token=${token}`;
    return headers;
}

// Kept as an export for backwards compatibility with older modules/imports.
// New code should call getDiscogsApiHeaders() so token changes are picked up.
export const discogsApiHeaders = getDiscogsApiHeaders();

export const youtubeApiKey = '';
