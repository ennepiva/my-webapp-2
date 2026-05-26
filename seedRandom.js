// seedRandom.js
// Seeded pseudo-random number generator + backwards-compatible session storage.

// ── PRNG ─────────────────────────────────────────────────────────────────────

function mulberry32(seed) {
    return function () {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function seedToNumber(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) {
        h = Math.imul(31, h) + String(str).charCodeAt(i) | 0;
    }
    return h >>> 0;
}

export function createRng(seedStr) {
    return mulberry32(seedToNumber(seedStr || generateSeed()));
}

export function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function generateSeed() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let key = '';
    for (let i = 0; i < 4; i++) key += chars[Math.floor(Math.random() * chars.length)];
    return key;
}

// ── Session persistence ──────────────────────────────────────────────────────

const STORAGE_KEY = 'cratedigger_session';
const LEGACY_KEYS = ['crateDiggerSession', 'crate-digger-session'];
const SESSION_VERSION = 2;

function arrayOfStrings(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter(v => v !== null && typeof v !== 'undefined' && v !== '')
        .map(v => String(v));
}

function normalizeParams(params) {
    const p = params && typeof params === 'object' ? params : {};
    return {
        query:    String(p.query    || '').trim(),
        genre:    String(p.genre    || '').trim(),
        style:    String(p.style    || '').trim(),
        year:     String(p.year     || '').trim(),
        yearFrom: String(p.yearFrom || p.year_from || '').trim(),
        yearTo:   String(p.yearTo   || p.year_to   || '').trim(),
        country:  String(p.country  || '').trim(),
    };
}

function normalizeSession(rawSession) {
    if (!rawSession || typeof rawSession !== 'object') return null;

    const seed = String(rawSession.seed || rawSession.key || '').trim().toUpperCase();
    if (!seed) return null;

    const mode = rawSession.mode || (rawSession.storeName || rawSession.currentStoreName ? 'store' : 'search');
    const params = normalizeParams(rawSession.params || rawSession.searchParams || {});

    return {
        version: SESSION_VERSION,
        mode: mode === 'store' ? 'store' : 'search',
        seed,
        storeName: String(rawSession.storeName || rawSession.currentStoreName || '').trim(),
        params,
        listenedIds: arrayOfStrings(rawSession.listenedIds || rawSession.listingsListenedTo || rawSession.played || []),
        pagesScanned: arrayOfStrings(rawSession.pagesScanned || rawSession.scannedPages || ['1']).length
            ? arrayOfStrings(rawSession.pagesScanned || rawSession.scannedPages || ['1'])
            : ['1'],
        totalPages: Number.parseInt(rawSession.totalPages, 10) || 1,
        recordHistory: Array.isArray(rawSession.recordHistory) ? rawSession.recordHistory : [],
        savedAt: Number(rawSession.savedAt || rawSession.updatedAt || Date.now()),
    };
}

function readRawSessionFromStorage() {
    const keys = [STORAGE_KEY, ...LEGACY_KEYS];
    for (const key of keys) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const normalized = normalizeSession(parsed);
            if (normalized) {
                if (key !== STORAGE_KEY || parsed.version !== SESSION_VERSION) saveSessionObject(normalized);
                return normalized;
            }
        } catch (e) {
            console.warn(`Ignoring unreadable saved session at ${key}:`, e);
        }
    }
    return null;
}

export function saveSessionObject(session) {
    const normalized = normalizeSession(session);
    if (!normalized) return false;
    normalized.savedAt = Date.now();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return true;
    } catch (e) {
        console.warn('Could not save session:', e);
        return false;
    }
}

// Backwards-compatible signature used by previous app versions.
export function saveSession(seed, params, listenedIds, pagesScanned) {
    return saveSessionObject({
        version: SESSION_VERSION,
        mode: 'search',
        seed,
        params,
        listenedIds,
        pagesScanned,
        savedAt: Date.now(),
    });
}

export function saveStoreSession(seed, storeName, listenedIds, pagesScanned, totalPages) {
    return saveSessionObject({
        version: SESSION_VERSION,
        mode: 'store',
        seed,
        storeName,
        listenedIds,
        pagesScanned,
        totalPages,
        savedAt: Date.now(),
    });
}

export function loadSession() {
    return readRawSessionFromStorage();
}

export function clearSession() {
    try {
        [STORAGE_KEY, ...LEGACY_KEYS].forEach(key => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Could not clear saved session:', e);
    }
}
