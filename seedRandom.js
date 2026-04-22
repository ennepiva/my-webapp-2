// seedRandom.js
// Seeded pseudo-random number generator (Mulberry32) + session save/restore.

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
    // Hash a short string to a 32-bit int
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h >>> 0;
}

export function createRng(seedStr) {
    return mulberry32(seedToNumber(seedStr));
}

// Shuffle an array using a seeded RNG (Fisher-Yates)
export function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Generate a random 4-char uppercase seed key
export function generateSeed() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
    let key = '';
    for (let i = 0; i < 4; i++) {
        key += chars[Math.floor(Math.random() * chars.length)];
    }
    return key;
}

// ── Session persistence (localStorage) ───────────────────────────────────────

const STORAGE_KEY = 'cratedigger_session';

export function saveSession(seed, params, listenedIds, pagesScanned) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            seed,
            params,
            listenedIds,
            pagesScanned,
            savedAt: Date.now(),
        }));
    } catch (e) {
        console.warn('Could not save session:', e);
    }
}

export function loadSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

export function clearSession() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
