// loadSearch.js

import { getDiscogsApiHeaders } from './apiConfig.js';
import {
    listingsListenedTo,
    pagesScanned,
    listingDetails,
    setCurrentStoreName,
    setCurrentStoreSeed,
    setListingsListenedTo,
    setPagesScanned,
    setListingDetails,
    setTotalPages,
    totalPages
} from './loadStore.js';
import {
    createRng,
    seededShuffle,
    generateSeed,
    saveSessionObject,
} from './seedRandom.js';

let currentSearchParams = null;
let currentSeed = null;
let rng = null;
let shuffledPageOrder = [];
let activeSearchRequest = 0;

export function getCurrentSearchParams() { return currentSearchParams; }
export function getCurrentSeed()         { return currentSeed; }

// ── Fresh search ──────────────────────────────────────────────────────────────

export function loadSearch(params, seedOverride = null) {
    const cleanParams = normalizeSearchParams(params);
    const seed = (seedOverride || generateSeed()).toUpperCase();
    const requestId = ++activeSearchRequest;

    console.log(`Search | seed: ${seed}`, cleanParams);
    _initSearch(seed, cleanParams);
    _showSeedUI(seed);
    _resetProgress();
    _moveProgressToRandomSplit(25, 55);
    _updateStatus('Searching Discogs…');

    fetch(buildSearchUrl(cleanParams, 1, rng), { headers: getDiscogsApiHeaders() })
        .then(assertDiscogsResponse)
        .then(data => {
            if (requestId !== activeSearchRequest) return;
            const results = Array.isArray(data.results) ? data.results : [];
            if (!results.length) {
                _finishProgress();
                _updateStatus('No results found.', true);
                return;
            }
            const pages = data.pagination?.pages || 1;
            setTotalPages(pages);
            shuffledPageOrder = seededShuffle(
                Array.from({ length: Math.min(pages, 100) }, (_, i) => i + 1),
                createRng(`${seed}_pages`)
            );
            appendSearchResults(results);
            _finishProgress();
            _saveCurrentSession();
            _updateStatus(`${results.length} releases loaded. Tap Next Record.`);
        })
        .catch(err => {
            if (requestId !== activeSearchRequest) return;
            _finishProgress();
            _updateStatus(readableDiscogsError(err, 'Search failed.'), true);
            console.error('Search fetch error:', err);
        });
}

// ── Resume saved session ──────────────────────────────────────────────────────

export function resumeSearch(session) {
    const seed = String(session.seed || generateSeed()).toUpperCase();
    const params = normalizeSearchParams(session.params || session.searchParams || {});
    const savedPages = Array.isArray(session.pagesScanned) && session.pagesScanned.length ? session.pagesScanned : ['1'];
    const requestId = ++activeSearchRequest;

    console.log(`Resuming search | seed: ${seed} | listened: ${(session.listenedIds || []).length} | pages: ${savedPages.length}`);
    _initSearch(seed, params);
    _showSeedUI(seed);
    setListingsListenedTo([...(session.listenedIds || [])].map(String));
    setPagesScanned([...savedPages].map(String));
    _restoreSearchFields(params);
    _resetProgress();
    _updateStatus('Restoring saved search…');

    const pagesToFetch = [...new Set(savedPages.map(Number).filter(p => Number.isFinite(p) && p > 0))];
    if (!pagesToFetch.includes(1)) pagesToFetch.unshift(1);

    let fetched = 0;
    const fetchNext = (i) => {
        if (requestId !== activeSearchRequest) return;
        if (i >= pagesToFetch.length) {
            shuffledPageOrder = seededShuffle(
                Array.from({ length: Math.min(totalPages || session.totalPages || 1, 100) }, (_, idx) => idx + 1),
                createRng(`${seed}_pages`)
            );
            _finishProgress();
            _saveCurrentSession();
            _updateStatus(`${listingDetails.length} releases restored. ${listingsListenedTo.length} already played.`);
            return;
        }
        fetch(buildSearchUrl(params, pagesToFetch[i], rng), { headers: getDiscogsApiHeaders() })
            .then(assertDiscogsResponse)
            .then(data => {
                appendSearchResults(Array.isArray(data.results) ? data.results : []);
                setTotalPages(data.pagination?.pages || totalPages || session.totalPages || 1);
            })
            .catch(error => console.warn(`Could not restore search page ${pagesToFetch[i]}:`, error))
            .finally(() => {
                fetched++;
                _setProgress((fetched / pagesToFetch.length) * 100);
                setTimeout(() => fetchNext(i + 1), 250);
            });
    };
    fetchNext(0);
}

// ── Next page in seed order ───────────────────────────────────────────────────

export function fetchRandomSearchPage() {
    if (!currentSearchParams) return Promise.resolve(false);
    if (!shuffledPageOrder.length) {
        shuffledPageOrder = seededShuffle(
            Array.from({ length: Math.min(totalPages || 1, 100) }, (_, i) => i + 1),
            createRng(`${currentSeed}_pages`)
        );
    }

    const maxPages = Math.min(totalPages, 100);
    const unvisited = shuffledPageOrder.filter(p => p <= maxPages && !pagesScanned.includes(String(p)));
    if (!unvisited.length) {
        console.log('All search pages scanned.');
        return Promise.resolve(false);
    }

    const page = unvisited[0];
    pagesScanned.push(String(page));

    return fetch(buildSearchUrl(currentSearchParams, page, rng), { headers: getDiscogsApiHeaders() })
        .then(assertDiscogsResponse)
        .then(data => {
            appendSearchResults(Array.isArray(data.results) ? data.results : []);
            _saveCurrentSession();
            return true;
        })
        .catch(err => {
            _updateStatus(readableDiscogsError(err, 'Could not fetch another search page.'), true);
            console.error('Page fetch error:', err);
            return false;
        });
}

export function onRecordPlayed() { _saveCurrentSession(); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function _initSearch(seed, params) {
    currentSeed = seed;
    currentSearchParams = normalizeSearchParams(params);
    rng = createRng(seed);
    setCurrentStoreName('');
    setCurrentStoreSeed(null);
    setListingsListenedTo([]);
    setPagesScanned(['1']);
    setListingDetails([]);
    setTotalPages(1);
    shuffledPageOrder = [];
}

function _saveCurrentSession() {
    if (!currentSearchParams || !currentSeed) return false;
    return saveSessionObject({
        mode: 'search',
        seed: currentSeed,
        params: currentSearchParams,
        listenedIds: [...listingsListenedTo],
        pagesScanned: [...pagesScanned],
        totalPages,
    });
}

function _showSeedUI(seed) {
    const el = document.getElementById('seedDisplay');
    if (el) el.textContent = seed;
    const input = document.getElementById('seedInput');
    if (input) input.value = seed;
    const wrap = document.getElementById('seedRow');
    if (wrap) wrap.style.display = 'flex';
}

function _restoreSearchFields(params) {
    document.getElementById('tabSearch')?.click();
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
    set('sq', params.query); set('sGenre', params.genre); set('sStyle', params.style);
    set('sYear', params.year); set('sYearFrom', params.yearFrom);
    set('sYearTo', params.yearTo); set('sCountry', params.country);
}

function normalizeSearchParams(params) {
    const p = params && typeof params === 'object' ? params : {};
    const exactYear = cleanYear(p.year);
    return {
        query:    String(p.query   || '').trim(),
        genre:    String(p.genre   || '').trim(),
        style:    String(p.style   || '').trim(),
        year:     exactYear,
        yearFrom: exactYear ? '' : cleanYear(p.yearFrom),
        yearTo:   exactYear ? '' : cleanYear(p.yearTo),
        country:  String(p.country || '').trim(),
    };
}

function cleanYear(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return '';
    const thisYear = new Date().getFullYear();
    return String(Math.max(1860, Math.min(thisYear + 1, parsed)));
}

function buildSearchUrl(params, page, pageRng = Math.random) {
    const q = new URLSearchParams({ type: 'release', page: String(page), per_page: '100' });
    if (params.query)   q.set('q',       params.query);
    if (params.genre)   q.set('genre',   params.genre);
    if (params.style)   q.set('style',   params.style);
    if (params.country) q.set('country', params.country);
    if (params.year) {
        q.set('year', params.year);
    } else if (params.yearFrom || params.yearTo) {
        const from = Number.parseInt(params.yearFrom, 10) || 1950;
        const to = Number.parseInt(params.yearTo, 10) || new Date().getFullYear();
        const min = Math.min(from, to);
        const max = Math.max(from, to);
        q.set('year', String(min + Math.floor(pageRng() * (max - min + 1))));
    }
    return `https://api.discogs.com/database/search?${q}`;
}

function appendSearchResults(results) {
    const existingIds = new Set(listingDetails.map(l => String(l.listing_id)));
    results.forEach(result => {
        const listing = searchResultToListing(result);
        if (!listing || existingIds.has(String(listing.listing_id))) return;
        listingDetails.push(listing);
        existingIds.add(String(listing.listing_id));
    });
}

function searchResultToListing(result) {
    if (!result || !result.id) return null;
    return {
        listing_id:          String(result.id),
        listing_price:       'N/A',
        listing_uri:         result.uri
            ? `https://www.discogs.com${result.uri}`
            : `https://www.discogs.com/release/${result.id}`,
        listing_condition:   'N/A',
        sleeve_condition:    'N/A',
        release_id:          result.id,
        release_description: result.title || 'Untitled release',
        release_videos:      null,
        release_tracklist:   null,
        release_artists:     null,
        release_year:        result.year  || null,
        release_genres:      Array.isArray(result.genre) ? result.genre : [],
        release_styles:      Array.isArray(result.style) ? result.style : [],
    };
}

function assertDiscogsResponse(response) {
    return response.json().catch(() => ({})).then(data => {
        if (!response.ok) {
            const error = new Error(data.message || `${response.status} ${response.statusText}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    });
}

function readableDiscogsError(error, fallback) {
    if (error?.status === 401 || error?.status === 403) return 'Discogs authorization failed. Add or update your Discogs token.';
    if (error?.status === 429) return 'Discogs rate limit reached. Try again in a moment.';
    return error?.message || fallback;
}

function _resetProgress() { _setProgress(0); }
function _finishProgress() { _setProgress(100); }
function _setProgress(value) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
}
function _moveProgressToRandomSplit(min, max) {
    const split = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(() => _setProgress(split), 10);
}
function _updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}
