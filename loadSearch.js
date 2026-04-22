// loadSearch.js

import { discogsApiHeaders } from './apiConfig.js';
import {
    listingsListenedTo,
    pagesScanned,
    listingDetails,
    setCurrentStoreName,
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
    saveSession,
    loadSession,
} from './seedRandom.js';

let currentSearchParams = null;
let currentSeed = null;
let rng = null;
let shuffledPageOrder = [];

export function getCurrentSearchParams() { return currentSearchParams; }
export function getCurrentSeed()         { return currentSeed; }

// ── Fresh search ──────────────────────────────────────────────────────────────

export function loadSearch(params, seedOverride = null) {
    const seed = seedOverride || generateSeed();
    console.log(`Search | seed: ${seed}`, params);
    _initSearch(seed, params);
    _showSeedUI(seed);

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    const split = Math.floor(Math.random() * 31) + 25;
    setTimeout(() => {
        progressBar.style.transition = 'width 1s linear';
        progressBar.style.width = `${split}%`;
    }, 10);

    fetch(buildSearchUrl(params, 1), { headers: discogsApiHeaders })
        .then(r => r.json())
        .then(data => {
            if (!data.results || !data.results.length) {
                progressBar.style.width = '100%';
                document.getElementById('listingInfo').innerHTML =
                    '<p style="color:#f88">No results found.</p>';
                return;
            }
            const pages = data.pagination.pages;
            setTotalPages(pages);
            shuffledPageOrder = seededShuffle(
                Array.from({ length: pages }, (_, i) => i + 1),
                createRng(seed + '_pages')
            );
            let loaded = 0;
            data.results.forEach((r, i) => {
                setTimeout(() => {
                    listingDetails.push(searchResultToListing(r));
                    progressBar.style.width =
                        `${split + (++loaded / data.results.length) * (100 - split)}%`;
                }, i * 10);
            });
        })
        .catch(err => console.error('Search fetch error:', err));
}

// ── Resume saved session ──────────────────────────────────────────────────────

export function resumeSearch(session) {
    const { seed, params, listenedIds, pagesScanned: savedPages } = session;
    console.log(`Resuming | seed: ${seed} | listened: ${listenedIds.length} | pages: ${savedPages.length}`);
    _initSearch(seed, params);
    _showSeedUI(seed);
    setListingsListenedTo([...listenedIds]);
    setPagesScanned([...savedPages]);
    _restoreSearchFields(params);

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
    const pagesToFetch = savedPages.map(Number).filter(p => !isNaN(p));
    let fetched = 0;

    const fetchNext = (i) => {
        if (i >= pagesToFetch.length) {
            progressBar.style.width = '100%';
            console.log(`Resume done — ${listingDetails.length} listings`);
            return;
        }
        fetch(buildSearchUrl(params, pagesToFetch[i]), { headers: discogsApiHeaders })
            .then(r => r.json())
            .then(data => {
                (data.results || []).forEach(r => listingDetails.push(searchResultToListing(r)));
                progressBar.style.width = `${(++fetched / pagesToFetch.length) * 100}%`;
                setTimeout(() => fetchNext(i + 1), 300); // gentle rate-limit
            })
            .catch(() => fetchNext(i + 1));
    };
    fetchNext(0);
}

// ── Next page in seed order ───────────────────────────────────────────────────

export function fetchRandomSearchPage() {
    if (!currentSearchParams) return;
    const maxPages = Math.min(totalPages, 100);
    const unvisited = shuffledPageOrder.filter(
        p => p <= maxPages && !pagesScanned.includes(p.toString())
    );
    if (!unvisited.length) { console.log('All search pages scanned.'); return; }

    const page = unvisited[0];
    pagesScanned.push(page.toString());

    // For year-range: pick a random year within range for this page fetch
    const params = { ...currentSearchParams };
    if (params.yearFrom || params.yearTo) {
        const from = parseInt(params.yearFrom) || 1950;
        const to   = parseInt(params.yearTo)   || new Date().getFullYear();
        params.year = String(from + Math.floor(rng() * (to - from + 1)));
        delete params.yearFrom; delete params.yearTo;
    }

    fetch(buildSearchUrl(params, page), { headers: discogsApiHeaders })
        .then(r => r.json())
        .then(data => {
            (data.results || []).forEach(r => listingDetails.push(searchResultToListing(r)));
            _saveCurrentSession();
        })
        .catch(err => console.error('Page fetch error:', err));
}

export function onRecordPlayed() { _saveCurrentSession(); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function _initSearch(seed, params) {
    currentSeed = seed; currentSearchParams = params;
    rng = createRng(seed);
    setCurrentStoreName(''); setListingsListenedTo([]);
    setPagesScanned(['1']); setListingDetails([]); setTotalPages(1);
    shuffledPageOrder = [];
}

function _saveCurrentSession() {
    if (!currentSearchParams) return;
    saveSession(currentSeed, currentSearchParams, [...listingsListenedTo], [...pagesScanned]);
}

function _showSeedUI(seed) {
    const el = document.getElementById('seedDisplay');
    if (el) el.textContent = seed;
    const wrap = document.getElementById('seedRow');
    if (wrap) wrap.style.display = 'flex';
}

function _restoreSearchFields(params) {
    document.getElementById('tabSearch')?.click();
    const set = (id, val) => { const e = document.getElementById(id); if (e && val) e.value = val; };
    set('sq', params.query); set('sGenre', params.genre); set('sStyle', params.style);
    set('sYear', params.year); set('sYearFrom', params.yearFrom);
    set('sYearTo', params.yearTo); set('sCountry', params.country);
}

function buildSearchUrl(params, page) {
    const q = new URLSearchParams({ type: 'release', page, per_page: 100 });
    if (params.query)   q.set('q',       params.query);
    if (params.genre)   q.set('genre',   params.genre);
    if (params.style)   q.set('style',   params.style);
    if (params.country) q.set('country', params.country);
    if (params.year) {
        q.set('year', params.year);
    } else if (params.yearFrom || params.yearTo) {
        const from = parseInt(params.yearFrom) || 1950;
        const to   = parseInt(params.yearTo)   || new Date().getFullYear();
        q.set('year', String(from + Math.floor(Math.random() * (to - from + 1))));
    }
    return `https://api.discogs.com/database/search?${q}`;
}

function searchResultToListing(result) {
    return {
        listing_id:          result.id,
        listing_price:       'N/A',
        listing_uri:         result.uri
            ? `https://www.discogs.com${result.uri}`
            : `https://www.discogs.com/release/${result.id}`,
        listing_condition:   'N/A',
        sleeve_condition:    'N/A',
        release_id:          result.id,
        release_description: result.title,
        release_videos:      null,
        release_tracklist:   null,
        release_artists:     null,
        release_year:        result.year  || null,
        release_genres:      result.genre || [],
        release_styles:      result.style || [],
    };
}
