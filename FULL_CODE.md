# Crate Digger — full updated code

This bundle keeps the workflow, session, mobile, playback, pagination, and copy-helper improvements, while reverting Discogs authentication to the code-level token in `apiConfig.js`.

## apiConfig.js

```javascript
// apiConfig.js

export const discogsApiHeaders = {
    'Authorization': 'Discogs token=FiTMPlLzFnLRTbthBEROuXqSzNFbRQuqbFCAstXd',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 8_2_4) Gecko/20100101 Firefox/49.9'
};

export function getDiscogsApiHeaders() {
    return discogsApiHeaders;
}

export const youtubeApiKey = '';
```

## config.js

```javascript
export const searchSuggestions = [
    "KillaCutz",
    "OneEyeWitness",
    "sonoventurarecords",
    "Hauz_of_Wax",
    "Yoyaku",
    "thevinylcurtain"
];
```

## index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Crate Digger</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Crate Digger</h1>

    <!-- Mode tabs -->
    <div class="mode-tabs" role="tablist" aria-label="Mode">
        <button class="mode-tab active" id="tabStore" type="button" role="tab" aria-selected="true" aria-controls="panelStore">Record Store</button>
        <button class="mode-tab" id="tabSearch" type="button" role="tab" aria-selected="false" aria-controls="panelSearch">Discogs Search</button>
    </div>

    <!-- Store panel -->
    <div class="panel" id="panelStore" role="tabpanel" aria-labelledby="tabStore">
        <div class="search-bar">
            <label for="resellerName">Store:</label>
            <input list="storeSuggestions" type="text" id="resellerName" name="resellerName" autocomplete="off" autocapitalize="none" spellcheck="false">
            <datalist id="storeSuggestions"></datalist>
            <button id="loadButton" type="button">Load</button>
        </div>
    </div>

    <!-- Discogs Search panel -->
    <div class="panel hidden" id="panelSearch" role="tabpanel" aria-labelledby="tabSearch">
        <!-- Collapsed summary — shown after search -->
        <div class="search-summary hidden" id="searchSummary">
            <span class="search-summary-text" id="searchSummaryText"></span>
            <button class="search-summary-edit" id="searchEditButton" type="button">Edit</button>
        </div>
        <!-- Full search form — hidden after search -->
        <div class="search-grid" id="searchGrid">
            <div class="search-field">
                <label for="sq">Query</label>
                <input type="text" id="sq" placeholder="artist, title, label…" autocomplete="off" spellcheck="false">
            </div>
            <div class="search-field">
                <label for="sGenre">Genre</label>
                <input list="genreSuggestions" type="text" id="sGenre" placeholder="Electronic, Jazz…" autocomplete="off" spellcheck="false">
                <datalist id="genreSuggestions">
                    <option value="Electronic">
                    <option value="Rock">
                    <option value="Jazz">
                    <option value="Funk / Soul">
                    <option value="Hip Hop">
                    <option value="Classical">
                    <option value="Reggae">
                    <option value="Pop">
                    <option value="Folk, World, & Country">
                    <option value="Blues">
                    <option value="Latin">
                </datalist>
            </div>
            <div class="search-field">
                <label for="sStyle">Style</label>
                <input list="styleSuggestions" type="text" id="sStyle" placeholder="Techno, Ambient…" autocomplete="off" spellcheck="false">
                <datalist id="styleSuggestions">
                    <option value="Techno">
                    <option value="House">
                    <option value="Deep House">
                    <option value="Ambient">
                    <option value="Drum n Bass">
                    <option value="Disco">
                    <option value="Dub">
                    <option value="Acid">
                    <option value="Minimal">
                    <option value="Breaks">
                    <option value="Soul">
                    <option value="Funk">
                    <option value="Bebop">
                    <option value="Free Jazz">
                </datalist>
            </div>
            <!-- Year range -->
            <div class="search-field">
                <label for="sYearFrom">Year from</label>
                <input type="text" id="sYearFrom" inputmode="numeric" placeholder="1988" autocomplete="off">
            </div>
            <div class="search-field">
                <label for="sYearTo">Year to</label>
                <input type="text" id="sYearTo" inputmode="numeric" placeholder="1995" autocomplete="off">
            </div>
            <div class="search-field">
                <label for="sYear">Exact year</label>
                <input type="text" id="sYear" inputmode="numeric" placeholder="1994 (overrides range)" autocomplete="off">
            </div>
            <div class="search-field">
                <label for="sCountry">Country</label>
                <input type="text" id="sCountry" placeholder="UK, Germany…" autocomplete="off" spellcheck="false">
            </div>
        </div>
        <button id="searchButton" type="button">Search</button>
    </div>

    <!-- Session seed — always visible -->
    <div class="seed-row" id="seedRow">
        <div class="seed-display-wrap">
            <span class="seed-label">SESSION</span>
            <button class="seed-value seed-copy" id="seedDisplay" type="button" title="Copy session key">----</button>
        </div>
        <div class="seed-resume-wrap">
            <input type="text" id="seedInput" placeholder="Key" maxlength="4" autocapitalize="characters" autocomplete="off" spellcheck="false">
            <button id="resumeButton" type="button">Resume</button>
        </div>
    </div>

    <div class="progress-bar-container" aria-label="Loading progress">
        <div id="progressBar" class="progress-bar"></div>
    </div>

    <div class="status-line" id="statusLine" role="status" aria-live="polite"></div>

    <div class="controls" aria-label="Playback controls">
        <button id="prevRecordButton" type="button" data-mobile-label="Prev">Prev Record</button>
        <button id="nextRecordButton" type="button" data-mobile-label="Next">Next Record</button>
        <button id="nextTrackButton" type="button" data-mobile-label="Track">Next Track</button>
    </div>

    <div id="listingInfo"></div>
    <div id="player"></div>

    <script src="https://www.youtube.com/iframe_api"></script>
    <script type="module" src="script.js"></script>
</body>
</html>
```

## keyboardShortcuts.js

```javascript
// keyboardShortcuts.js

import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';

let currentVideoId = '';
let currentReleaseId = '';
let currentVideoTitle = '';
let currentListing = null;

document.addEventListener('keydown', function(event) {
    const tag = event.target?.tagName?.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch(event.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            prevRecord();
            break;
        case 'd':
        case 'arrowright':
            nextRecord();
            break;
        case 's':
        case 'w':
        case 'arrowdown':
        case 'arrowup':
            nextTrack();
            break;
        case 't':
            copyVideoTitleToClipboard();
            break;
        case 'v':
            copyReleaseAndVideoToClipboard();
            break;
        case 'f':
            copyFolderNameToClipboard();
            break;
        case '/':
            showShortcutHelp();
            break;
        default:
            break;
    }
});

function copyVideoTitleToClipboard() {
    copyToClipboard(currentVideoTitle, 'Video title copied.');
}

function copyReleaseAndVideoToClipboard() {
    if (currentReleaseId && currentVideoId) {
        copyToClipboard(`'${currentReleaseId}','${currentVideoId}'`, 'Release/video IDs copied.');
    } else {
        updateStatus('Release ID or video ID is not available.', true);
    }
}

function copyFolderNameToClipboard() {
    if (!currentListing) {
        updateStatus('No record selected.', true);
        return;
    }
    const styles = [...(currentListing.release_styles || []), ...(currentListing.release_genres || [])].slice(0, 3).join(', ');
    const year = currentListing.release_year ? ` (${currentListing.release_year})` : '';
    const suffix = styles ? ` [${styles}]` : '';
    const folder = cleanFileName(`${currentListing.release_description || 'Unknown Release'}${year}${suffix}`);
    copyToClipboard(folder, 'Folder name copied.');
}

function showShortcutHelp() {
    updateStatus('Shortcuts: A/← previous, D/→ next record, W/S/↑/↓ next track, T title, V IDs, F folder.');
}

function copyToClipboard(value, successMessage) {
    if (!value) {
        updateStatus('Nothing to copy yet.', true);
        return;
    }
    navigator.clipboard.writeText(value).then(() => {
        updateStatus(successMessage);
    }).catch(err => {
        updateStatus('Clipboard copy failed.', true);
        console.error('Clipboard copy failed:', err);
    });
}

function cleanFileName(value) {
    return String(value || '')
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 180);
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}

export function setCurrentVideoInfo(releaseId, videoId, videoTitle, listing = null) {
    currentReleaseId = String(releaseId || '');
    currentVideoId = String(videoId || '');
    currentVideoTitle = String(videoTitle || '');
    currentListing = listing;
}
```

## loadSearch.js

```javascript
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
    if (error?.status === 401 || error?.status === 403) return 'Discogs authorization failed. Check the Discogs token in apiConfig.js.';
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
```

## loadStore.js

```javascript
// loadStore.js

import { getDiscogsApiHeaders } from './apiConfig.js';
import { generateSeed, saveStoreSession, createRng, seededShuffle } from './seedRandom.js';

export let currentStoreName = '';
export let listingsListenedTo = [];
export let pagesScanned = [];
export let listingDetails = [];
export let totalPages = 1;
export let currentStoreSeed = null;

let storePageOrder = [];
let activeStoreRequest = 0;

// ── setters (used by loadSearch.js and resume flows to reset shared state) ───
export function setCurrentStoreName(v)    { currentStoreName    = String(v || '').trim(); }
export function setListingsListenedTo(v)  { listingsListenedTo  = Array.isArray(v) ? v.map(String) : []; }
export function setPagesScanned(v)        { pagesScanned        = Array.isArray(v) ? v.map(String) : []; }
export function setListingDetails(v)      { listingDetails      = Array.isArray(v) ? v : []; }
export function setTotalPages(v)          { totalPages          = Math.max(1, Number.parseInt(v, 10) || 1); }
export function setCurrentStoreSeed(v)    { currentStoreSeed    = v ? String(v).toUpperCase() : null; }

export function getCurrentStoreSeed()     { return currentStoreSeed; }

export function initStorePageOrder(seed, pages = totalPages) {
    const maxPages = getStoreFetchablePageCount(pages);
    storePageOrder = seededShuffle(
        Array.from({ length: maxPages }, (_, i) => i + 1),
        createRng(`${seed || 'STORE'}_store_pages`)
    );
}

export function resetStoreState(storeName, seed = null) {
    currentStoreName   = String(storeName || '').trim();
    currentStoreSeed   = (seed || generateSeed()).toUpperCase();
    listingsListenedTo = [];
    pagesScanned       = [];
    listingDetails     = [];
    totalPages         = 1;
    storePageOrder     = [];
}

export function loadStore(resellerName, seedOverride = null) {
    const cleanName = String(resellerName || '').trim();
    if (!cleanName) {
        updateStatus('Enter a Discogs store name first.', true);
        return;
    }

    if (cleanName === currentStoreName && listingDetails.length) {
        updateStatus('That store is already loaded.');
        return;
    }

    const requestId = ++activeStoreRequest;
    const seed = (seedOverride || generateSeed()).toUpperCase();
    resetStoreState(cleanName, seed);
    showSeedUI(seed);
    resetProgress();
    moveProgressToRandomSplit(25, 55);
    updateStatus(`Loading ${cleanName}…`);

    console.log(`Fetching catalog for store: ${cleanName} | seed: ${seed}`);

    fetch(buildStoreInventoryUrl(cleanName, 1, 'desc'), { headers: getDiscogsApiHeaders() })
        .then(assertDiscogsResponse)
        .then(data => {
            if (requestId !== activeStoreRequest) return;
            const listings = Array.isArray(data.listings) ? data.listings : [];
            setTotalPages(data.pagination?.pages || 1);
            initStorePageOrder(seed, totalPages);
            pagesScanned = ['1'];
            appendStoreListings(listings);
            finishProgress();
            saveCurrentStoreSession();
            updateStatus(listings.length ? `${listings.length} records loaded. Tap Next Record.` : 'No active listings found for this store.', !listings.length);
        })
        .catch(error => {
            if (requestId !== activeStoreRequest) return;
            finishProgress();
            updateStatus(readableDiscogsError(error, 'Could not load that store.'), true);
            console.error('Error fetching store inventory:', error);
        });
}

export function resumeStoreSession(session) {
    const seed = String(session.seed || generateSeed()).toUpperCase();
    const storeName = String(session.storeName || session.currentStoreName || '').trim();
    if (!storeName) {
        updateStatus('Saved store session is missing a store name.', true);
        return;
    }

    resetStoreState(storeName, seed);
    setListingsListenedTo(session.listenedIds || []);
    setPagesScanned(session.pagesScanned && session.pagesScanned.length ? session.pagesScanned : ['1']);
    setTotalPages(session.totalPages || 1);
    showSeedUI(seed);
    resetProgress();
    updateStatus(`Resuming ${storeName}…`);

    const uniquePages = [...new Set(pagesScanned.map(p => Number.parseInt(p, 10)).filter(Number.isFinite))];
    if (!uniquePages.includes(1)) uniquePages.unshift(1);
    if (!uniquePages.length) uniquePages.push(1);

    let fetched = 0;
    const run = (i) => {
        if (i >= uniquePages.length) {
            initStorePageOrder(seed, totalPages);
            finishProgress();
            saveCurrentStoreSession();
            updateStatus(`${listingDetails.length} records restored. ${listingsListenedTo.length} already played.`);
            return;
        }
        const page = normalizeStorePage(uniquePages[i], totalPages);
        fetch(buildStoreInventoryUrl(storeName, page.page, page.sortOrder), { headers: getDiscogsApiHeaders() })
            .then(assertDiscogsResponse)
            .then(data => {
                appendStoreListings(Array.isArray(data.listings) ? data.listings : []);
                setTotalPages(data.pagination?.pages || totalPages || 1);
            })
            .catch(error => console.warn(`Could not restore store page ${uniquePages[i]}:`, error))
            .finally(() => {
                fetched++;
                setProgress((fetched / uniquePages.length) * 100);
                setTimeout(() => run(i + 1), 250);
            });
    };
    run(0);
}

export function fetchNextStorePage() {
    if (!currentStoreName) return Promise.resolve(false);
    if (!storePageOrder.length) initStorePageOrder(currentStoreSeed || currentStoreName, totalPages);

    const maxPages = getStoreFetchablePageCount(totalPages);
    const nextLogicalPage = storePageOrder.find(p => p <= maxPages && !pagesScanned.includes(String(p)));
    if (!nextLogicalPage) {
        console.log('All store pages have been scanned.');
        return Promise.resolve(false);
    }

    pagesScanned.push(String(nextLogicalPage));
    const normalized = normalizeStorePage(nextLogicalPage, totalPages);

    return fetch(buildStoreInventoryUrl(currentStoreName, normalized.page, normalized.sortOrder), { headers: getDiscogsApiHeaders() })
        .then(assertDiscogsResponse)
        .then(data => {
            appendStoreListings(Array.isArray(data.listings) ? data.listings : []);
            saveCurrentStoreSession();
            return true;
        })
        .catch(error => {
            updateStatus(readableDiscogsError(error, 'Could not fetch another store page.'), true);
            console.error('Error fetching store page:', error);
            return false;
        });
}

export function saveCurrentStoreSession() {
    if (!currentStoreName || !currentStoreSeed) return false;
    return saveStoreSession(currentStoreSeed, currentStoreName, [...listingsListenedTo], [...pagesScanned], totalPages);
}

function appendStoreListings(listings) {
    const existingIds = new Set(listingDetails.map(l => String(l.listing_id)));
    listings.forEach(listing => {
        const converted = storeListingToListing(listing);
        if (!converted || existingIds.has(String(converted.listing_id))) return;
        listingDetails.push(converted);
        existingIds.add(String(converted.listing_id));
    });
}

function storeListingToListing(listing) {
    if (!listing || !listing.release) return null;
    const price = listing.price && typeof listing.price.value !== 'undefined'
        ? `${listing.price.value} ${listing.price.currency || ''}`.trim()
        : 'N/A';
    return {
        listing_id:          String(listing.id),
        listing_price:       price,
        listing_uri:         listing.uri || `https://www.discogs.com/release/${listing.release.id}`,
        listing_condition:   listing.condition || 'Unknown',
        sleeve_condition:    listing.sleeve_condition || 'Unknown',
        release_id:          listing.release.id,
        release_description: listing.release.description || 'Untitled release',
        release_videos:      null,
        release_tracklist:   null,
        release_artists:     null,
        release_year:        null,
        release_genres:      [],
        release_styles:      [],
    };
}

function buildStoreInventoryUrl(storeName, page, sortOrder = 'desc') {
    const safeStore = encodeURIComponent(storeName);
    const params = new URLSearchParams({
        page: String(Math.max(1, Number.parseInt(page, 10) || 1)),
        per_page: '100',
        sort: 'listed',
        sort_order: sortOrder,
    });
    return `https://api.discogs.com/users/${safeStore}/inventory?${params}`;
}

function getStoreFetchablePageCount(pages) {
    // Discogs marketplace inventory only reliably exposes the first 10,000 rows.
    // With per_page=100, fetch newest pages descending and oldest pages ascending.
    return Math.min(Math.max(1, Number.parseInt(pages, 10) || 1), 200);
}

function normalizeStorePage(logicalPage, pages) {
    const total = Math.max(1, Number.parseInt(pages, 10) || 1);
    const logical = Math.max(1, Number.parseInt(logicalPage, 10) || 1);
    if (total > 200 && logical > 100) {
        return { page: logical - 100, sortOrder: 'asc' };
    }
    if (total <= 200 && logical > Math.ceil(total / 2)) {
        return { page: total - logical + 1, sortOrder: 'asc' };
    }
    return { page: logical, sortOrder: 'desc' };
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
    if (error?.status === 401 || error?.status === 403) return 'Discogs authorization failed. Check the Discogs token in apiConfig.js.';
    if (error?.status === 404) return 'Store not found on Discogs.';
    if (error?.status === 429) return 'Discogs rate limit reached. Try again in a moment.';
    return error?.message || fallback;
}

function resetProgress() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = '0%';
}

function setProgress(value) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function finishProgress() { setProgress(100); }

function moveProgressToRandomSplit(min, max) {
    const split = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(() => setProgress(split), 10);
}

function showSeedUI(seed) {
    const el = document.getElementById('seedDisplay');
    if (el) el.textContent = seed;
    const input = document.getElementById('seedInput');
    if (input) input.value = seed;
    const wrap = document.getElementById('seedRow');
    if (wrap) wrap.style.display = 'flex';
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}
```

## nextRecord.js

```javascript
// nextRecord.js

import { getDiscogsApiHeaders } from './apiConfig.js';
import {
    listingDetails,
    listingsListenedTo,
    currentStoreName,
    fetchNextStorePage,
    saveCurrentStoreSession
} from './loadStore.js';
import { playTrack, nextTrackHandler } from './videoSelector.js';
import { getCurrentSearchParams, fetchRandomSearchPage, onRecordPlayed } from './loadSearch.js';

let nextRecordCount = 0;
let recordHistory = [];
let currentRecordIndex = -1;
let currentVideoIndex = 0;
let activeReleaseFetch = 0;
let isAdvancing = false;

export function nextRecord(options = {}) {
    if (isAdvancing) return;
    isAdvancing = true;
    _nextRecord(options).finally(() => { isAdvancing = false; });
}

async function _nextRecord(options = {}) {
    if (!listingDetails.length) {
        updateStatus('No listings loaded yet.', true);
        return;
    }

    const listingIndex = await pickUnplayedListingIndex();
    if (listingIndex === null) {
        updateStatus('Everything loaded has been played. Fetch more pages or start a new search.', true);
        return;
    }

    const listing = listingDetails[listingIndex];
    const listingId = String(listing.listing_id);
    if (!listingsListenedTo.includes(listingId)) listingsListenedTo.push(listingId);
    persistCurrentMode();

    recordHistory = recordHistory.slice(0, currentRecordIndex + 1);
    recordHistory.push(listingIndex);
    currentRecordIndex = recordHistory.length - 1;
    currentVideoIndex = 0;
    displayListingInfo(listing, { loading: true });

    const requestId = ++activeReleaseFetch;
    try {
        const hydrated = await hydrateReleaseDetails(listing);
        if (requestId !== activeReleaseFetch) return;
        Object.assign(listing, hydrated);
        displayListingInfo(listing);
        const played = playTrack(listing, currentVideoIndex);
        if (!played) {
            updateStatus('Skipping release without playable YouTube videos…');
            await fetchMoreIfNeeded();
            setTimeout(() => nextRecord({ reason: 'skipNoVideo' }), 50);
            return;
        }
    } catch (error) {
        if (requestId !== activeReleaseFetch) return;
        displayListingInfo(listing);
        updateStatus(readableDiscogsError(error, 'Could not load release details.'), true);
        console.error('Error fetching release details:', error);
    }

    nextRecordCount++;
    if (nextRecordCount % 5 === 0 || options.reason === 'skipNoVideo') {
        await fetchMoreIfNeeded();
    }
}

export function prevRecord() {
    if (currentRecordIndex <= 0) {
        updateStatus('No previous records in this session.', true);
        return;
    }
    currentRecordIndex--;
    const previousListingIndex = recordHistory[currentRecordIndex];
    const previousListing = listingDetails[previousListingIndex];
    if (!previousListing) {
        updateStatus('Previous record is no longer available.', true);
        return;
    }
    displayListingInfo(previousListing);
    currentVideoIndex = 0;
    playTrack(previousListing, currentVideoIndex);
}

export function nextTrack() {
    if (currentRecordIndex < 0 || currentRecordIndex >= recordHistory.length) {
        updateStatus('Choose a record first.', true);
        return;
    }
    nextTrackHandler();
}

async function pickUnplayedListingIndex() {
    let index = findUnplayedListingIndex();
    if (index !== null) return index;

    const loadedMore = await fetchMoreIfNeeded();
    if (loadedMore) return findUnplayedListingIndex();

    // User has genuinely exhausted fetched pages. Reset locally so the app remains usable.
    if (listingDetails.length && listingsListenedTo.length >= listingDetails.length) {
        listingsListenedTo.splice(0, listingsListenedTo.length);
        persistCurrentMode();
        updateStatus('All loaded records were played, so the local play queue was reset.');
        return findUnplayedListingIndex();
    }
    return null;
}

function findUnplayedListingIndex() {
    const candidates = listingDetails
        .map((listing, index) => ({ listing, index }))
        .filter(({ listing }) => !listingsListenedTo.includes(String(listing.listing_id)));
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)].index;
}

async function fetchMoreIfNeeded() {
    if (getCurrentSearchParams()) return fetchRandomSearchPage();
    if (currentStoreName) return fetchNextStorePage();
    return false;
}

async function hydrateReleaseDetails(listing) {
    if (Array.isArray(listing.release_videos) && listing.release_videos.length) return listing;

    const response = await fetch(`https://api.discogs.com/releases/${encodeURIComponent(listing.release_id)}`, {
        headers: getDiscogsApiHeaders()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data.message || `${response.status} ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return {
        release_videos:      Array.isArray(data.videos) ? data.videos : [],
        release_tracklist:   Array.isArray(data.tracklist) ? data.tracklist : [],
        tracklist:           Array.isArray(data.tracklist) ? data.tracklist : [],
        release_artists:     Array.isArray(data.artists) ? data.artists : [],
        release_year:        data.year || listing.release_year || null,
        release_genres:      Array.isArray(data.genres) ? data.genres : (listing.release_genres || []),
        release_styles:      Array.isArray(data.styles) ? data.styles : (listing.release_styles || []),
        release_description: data.title || listing.release_description,
    };
}

function persistCurrentMode() {
    if (getCurrentSearchParams()) onRecordPlayed();
    else saveCurrentStoreSession();
}

function displayListingInfo(listing, options = {}) {
    const listingInfo = document.getElementById('listingInfo');
    if (!listingInfo) return;

    const genreTags = [...(listing.release_genres || []), ...(listing.release_styles || [])]
        .filter(Boolean)
        .slice(0, 12);
    const tagsHtml = genreTags.length
        ? `<p class="genre-tags">${genreTags.map(t => `<span class="genre-tag">${escapeHtml(t)}</span>`).join('')}</p>`
        : '';

    const isMarketplace = listing.listing_price && listing.listing_price !== 'N/A';
    const metaHtml = isMarketplace
        ? `<p>Released: ${escapeHtml(listing.release_year || 'Unknown')} | Price: ${escapeHtml(listing.listing_price)}</p>
           <p>Condition: ${escapeHtml(listing.listing_condition || 'Unknown')} | Sleeve: ${escapeHtml(listing.sleeve_condition || 'Unknown')}</p>`
        : `<p>Released: ${escapeHtml(listing.release_year || 'Unknown')}</p>`;

    const artists = Array.isArray(listing.release_artists)
        ? listing.release_artists.map(a => a.name).filter(Boolean).join(', ')
        : '';
    const searchText = makeSoulseekSearchText(listing);
    const folderText = makeFolderName(listing);
    const loadingHtml = options.loading ? '<p class="loading-copy">Loading release videos…</p>' : '';

    listingInfo.innerHTML = `
        <a href="${escapeAttribute(listing.listing_uri || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(listing.release_description || 'No description available')}</a>
        ${artists ? `<p>${escapeHtml(artists)}</p>` : ''}
        ${metaHtml}
        ${tagsHtml}
        ${loadingHtml}
        <div class="listing-actions">
            <button type="button" class="utility-button" data-copy-value="${escapeAttribute(searchText)}">Copy Soulseek Search</button>
            <button type="button" class="utility-button" data-copy-value="${escapeAttribute(folderText)}">Copy Folder Name</button>
            <button type="button" class="utility-button" data-copy-value="${escapeAttribute(String(listing.release_id || ''))}">Copy Release ID</button>
        </div>
    `;

    listingInfo.querySelectorAll('[data-copy-value]').forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button.dataset.copyValue || '', button.textContent));
    });
}

function makeSoulseekSearchText(listing) {
    const title = listing.release_description || '';
    const year = listing.release_year ? ` ${listing.release_year}` : '';
    return cleanCopyText(`${title}${year}`);
}

function makeFolderName(listing) {
    const title = listing.release_description || 'Unknown Release';
    const year = listing.release_year ? ` (${listing.release_year})` : '';
    const styles = [...(listing.release_styles || []), ...(listing.release_genres || [])].slice(0, 3).join(', ');
    const suffix = styles ? ` [${styles}]` : '';
    return cleanFileName(`${title}${year}${suffix}`);
}

function cleanCopyText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function cleanFileName(value) {
    return cleanCopyText(value).replace(/[\\/:*?"<>|]/g, '-').replace(/\s+-\s+/g, ' - ').slice(0, 180);
}

function copyToClipboard(value, label = 'Copied') {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
        updateStatus(`${label} copied.`);
    }).catch(err => {
        updateStatus('Clipboard copy failed.', true);
        console.error('Copy failed:', err);
    });
}

function readableDiscogsError(error, fallback) {
    if (error?.status === 401 || error?.status === 403) return 'Discogs authorization failed. Check the Discogs token in apiConfig.js.';
    if (error?.status === 404) return 'Release not found on Discogs.';
    if (error?.status === 429) return 'Discogs rate limit reached. Try again in a moment.';
    return error?.message || fallback;
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
}

function escapeAttribute(value) { return escapeHtml(value); }
```

## script.js

```javascript
// script.js

import { loadStore, resumeStoreSession } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';
import { loadSearch, resumeSearch } from './loadSearch.js';
import { loadSession, clearSession } from './seedRandom.js';

let player = null;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    searchSuggestions.forEach(s => {
        const option = document.createElement('option');
        option.value = s;
        datalist.appendChild(option);
    });
}

function createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback) {
    if (typeof YT === 'undefined' || !YT.Player) {
        loadYouTubeAPI().then(() => createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback));
        return;
    }

    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId || '',
            playerVars: {
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
            },
            events: {
                onReady:       () => { if (callback && videoId) callback(player); },
                onError:       (e) => { if (errorCallback) errorCallback(e); else console.error('YT error:', e); },
                onStateChange: (e) => { if (stateChangeCallback) stateChangeCallback(e); }
            }
        });
        setPlayerInstance(player);
    } else if (videoId) {
        player.loadVideoById(videoId);
    }
}

function loadYouTubeAPI() {
    return new Promise(resolve => {
        if (typeof YT !== 'undefined' && YT?.Player) resolve();
        else window.onYouTubeIframeAPIReady = resolve;
    });
}

function collectSearchParams() {
    return {
        query:    getValue('sq'),
        genre:    getValue('sGenre'),
        style:    getValue('sStyle'),
        year:     getValue('sYear'),
        yearFrom: getValue('sYearFrom'),
        yearTo:   getValue('sYearTo'),
        country:  getValue('sCountry'),
    };
}

function getValue(id) {
    return document.getElementById(id)?.value.trim() || '';
}

document.addEventListener('DOMContentLoaded', () => {
    const loadButton        = document.getElementById('loadButton');
    const resellerNameInput = document.getElementById('resellerName');
    const nextRecordButton  = document.getElementById('nextRecordButton');
    const prevRecordButton  = document.getElementById('prevRecordButton');
    const nextTrackButton   = document.getElementById('nextTrackButton');
    const searchButton      = document.getElementById('searchButton');
    const resumeButton      = document.getElementById('resumeButton');
    const seedInput         = document.getElementById('seedInput');
    const seedDisplay       = document.getElementById('seedDisplay');
    const tabStore          = document.getElementById('tabStore');
    const tabSearch         = document.getElementById('tabSearch');
    const panelStore        = document.getElementById('panelStore');
    const panelSearch       = document.getElementById('panelSearch');
    const searchGrid        = document.getElementById('searchGrid');
    const searchSummary     = document.getElementById('searchSummary');
    const summaryText       = document.getElementById('searchSummaryText');
    const editButton        = document.getElementById('searchEditButton');

    populateSearchSuggestions();
    installSwipeControls();

    // ── Tab switching ────────────────────────────────────────────────────────
    function activateTab(mode) {
        const isStore = mode === 'store';
        tabStore.classList.toggle('active', isStore);
        tabSearch.classList.toggle('active', !isStore);
        tabStore.setAttribute('aria-selected', String(isStore));
        tabSearch.setAttribute('aria-selected', String(!isStore));
        panelStore.classList.toggle('hidden', !isStore);
        panelSearch.classList.toggle('hidden', isStore);
    }

    tabStore.addEventListener('click', () => activateTab('store'));
    tabSearch.addEventListener('click', () => activateTab('search'));

    // ── Store load ───────────────────────────────────────────────────────────
    loadButton.addEventListener('click', () => {
        const name = resellerNameInput.value.trim();
        if (name) {
            clearSession();
            loadStore(name);
        } else {
            updateStatus('Enter a store name first.', true);
        }
    });

    resellerNameInput.addEventListener('mousedown', () => {
        if (searchSuggestions.includes(resellerNameInput.value)) {
            const cur = resellerNameInput.value;
            resellerNameInput.value = '';
            setTimeout(() => { resellerNameInput.value = cur; }, 0);
        }
    });

    resellerNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') loadButton.click();
    });

    // ── Discogs search ───────────────────────────────────────────────────────
    function collapseSearch(params) {
        const parts = [];
        if (params.genre)    parts.push(params.genre);
        if (params.style)    parts.push(params.style);
        if (params.query)    parts.push(`"${params.query}"`);
        if (params.year)     parts.push(params.year);
        else if (params.yearFrom || params.yearTo) parts.push(`${params.yearFrom || '…'}–${params.yearTo || '…'}`);
        if (params.country)  parts.push(params.country);
        summaryText.textContent = parts.join(' · ') || 'Search active';
        searchGrid.classList.add('hidden');
        searchButton.classList.add('hidden');
        searchSummary.classList.remove('hidden');
    }

    function expandSearch() {
        searchGrid.classList.remove('hidden');
        searchButton.classList.remove('hidden');
        searchSummary.classList.add('hidden');
    }

    editButton.addEventListener('click', expandSearch);

    searchButton.addEventListener('click', () => {
        const params = collectSearchParams();
        if (!Object.values(params).some(v => v)) {
            updateStatus('Fill in at least one search field.', true);
            return;
        }
        clearSession();
        loadSearch(params);
        collapseSearch(params);
    });

    ['sq', 'sGenre', 'sStyle', 'sYear', 'sYearFrom', 'sYearTo', 'sCountry'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') searchButton.click();
        });
    });

    // ── Resume session ───────────────────────────────────────────────────────
    resumeButton.addEventListener('click', () => {
        const key = seedInput.value.trim().toUpperCase();
        if (!key) return;
        const session = loadSession();
        if (session && session.seed === key) {
            resumeLoadedSession(session, collapseSearch, activateTab);
        } else {
            const params = collectSearchParams();
            if (!Object.values(params).some(v => v)) {
                updateStatus('Enter search parameters to start with this key.', true);
                return;
            }
            loadSearch(params, key);
            collapseSearch(params);
        }
    });

    seedInput.addEventListener('input', () => {
        seedInput.value = seedInput.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 4);
    });
    seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') resumeButton.click(); });
    seedDisplay.addEventListener('click', () => copyToClipboard(seedDisplay.textContent.trim(), 'Session key copied.'));

    // ── Playback controls ────────────────────────────────────────────────────
    nextRecordButton.addEventListener('click', () => nextRecord());
    prevRecordButton.addEventListener('click', () => prevRecord());
    nextTrackButton.addEventListener('click',  () => nextTrack());

    // ── Auto-restore session on page load ────────────────────────────────────
    const saved = loadSession();
    if (saved) {
        showSavedSessionBanner(saved, collapseSearch, activateTab);
    }

    loadYouTubeAPI();
});

function showSavedSessionBanner(saved, collapseSearch, activateTab) {
    const seedEl = document.getElementById('seedDisplay');
    if (seedEl) seedEl.textContent = saved.seed;
    const seedInp = document.getElementById('seedInput');
    if (seedInp) seedInp.value = saved.seed;

    const age = Date.now() - (saved.savedAt || 0);
    const days = Math.max(0, Math.floor(age / 86400000));
    const info = document.getElementById('listingInfo');
    if (!info) return;

    const label = saved.mode === 'store'
        ? `store ${escapeHtml(saved.storeName || '')}`
        : 'search';

    info.innerHTML = `
        <p style="color:#aaa">
            Saved ${label} session found — key <strong style="color:#fff">${escapeHtml(saved.seed)}</strong>
            (${days === 0 ? 'today' : days + 'd ago'},
            ${(saved.listenedIds || []).length} records played).
            <br>
            <button id="resumeSavedButton" style="margin-top:6px;font-size:0.8rem;padding:4px 10px">Resume</button>
            <button id="discardSavedButton" style="margin-top:6px;font-size:0.8rem;padding:4px 10px;margin-left:6px;border-color:#888;color:#888">Discard</button>
        </p>`;

    document.getElementById('resumeSavedButton')?.addEventListener('click', () => {
        info.innerHTML = '';
        resumeLoadedSession(saved, collapseSearch, activateTab);
    });
    document.getElementById('discardSavedButton')?.addEventListener('click', () => {
        clearSession();
        info.innerHTML = '';
        updateStatus('Saved session discarded.');
    });
}

function resumeLoadedSession(session, collapseSearch, activateTab) {
    if (session.mode === 'store') {
        activateTab('store');
        const input = document.getElementById('resellerName');
        if (input) input.value = session.storeName || '';
        resumeStoreSession(session);
    } else {
        activateTab('search');
        resumeSearch(session);
        collapseSearch(session.params || {});
    }
}

function installSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const target = document.body;

    target.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        const tag = event.target?.tagName?.toLowerCase();
        if (['input', 'button', 'textarea', 'select'].includes(tag)) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startTime = Date.now();
    }, { passive: true });

    target.addEventListener('touchend', event => {
        if (!startTime) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const elapsed = Date.now() - startTime;
        startTime = 0;
        if (elapsed > 600) return;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            dx > 0 ? prevRecord() : nextRecord();
        } else if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) {
            nextTrack();
        }
    }, { passive: true });
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}

function copyToClipboard(value, successMessage) {
    if (!value || value === '----') return;
    navigator.clipboard.writeText(value).then(() => updateStatus(successMessage || 'Copied.'));
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
}

export { createYouTubePlayer };
```

## seedRandom.js

```javascript
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
```

## style.css

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #222;
    color: #eee;
    font-family: 'Courier New', Courier, monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-image: url('https://www.transparenttextures.com/patterns/asfalt-light.png');
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #ffffff;
    text-shadow: 2px 2px #000;
}

/* ── Mode tabs ────────────────────────────────────────────────────────────── */
.mode-tabs {
    display: flex;
    gap: 0;
    margin-bottom: 12px;
    border: 2px solid #555;
}

.mode-tab {
    padding: 8px 24px;
    font-size: 0.9rem;
    border: none;
    background-color: #2a2a2a;
    color: #888;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    font-family: 'Courier New', Courier, monospace;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.mode-tab:hover {
    background-color: #333;
    color: #ccc;
}

.mode-tab.active {
    background-color: #444;
    color: #fff;
}

/* ── Panels ───────────────────────────────────────────────────────────────── */
.panel {
    width: 460px;
    margin-bottom: 4px;
}

.panel.hidden {
    display: none;
}

/* ── Store search bar ─────────────────────────────────────────────────────── */
.search-bar {
    display: flex;
    align-items: center;
    gap: 8px;
}

/* ── Discogs search grid ──────────────────────────────────────────────────── */
.search-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 10px;
}

.search-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* Query field spans full width */
.search-field:first-child {
    grid-column: 1 / -1;
}

.search-field label {
    font-size: 0.75rem;
    color: #999;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin: 0;
}

.search-field input {
    padding: 8px;
    font-size: 0.9rem;
    border: 2px solid #555;
    background-color: #333;
    color: #eee;
    font-family: 'Courier New', Courier, monospace;
    width: 100%;
    margin: 0;
}

/* ── Shared input / button styles ────────────────────────────────────────── */
label {
    margin-right: 10px;
    font-size: 1.2rem;
    letter-spacing: 1px;
    color: #ffffff;
}

input[type="text"] {
    padding: 10px;
    font-size: 1rem;
    border: 2px solid #555;
    background-color: #333;
    color: #eee;
    margin-right: 10px;
    font-family: 'Courier New', Courier, monospace;
}

button {
    padding: 10px 20px;
    font-size: 1rem;
    border: 2px solid #ffffff;
    background-color: #333;
    color: #ffffff;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
    font-family: 'Courier New', Courier, monospace;
}

button:hover {
    background-color: #ffffff;
    color: #333;
}

#searchButton {
    width: 100%;
}

/* ── Progress bar ─────────────────────────────────────────────────────────── */
.progress-bar-container {
    width: 460px;
    height: 4px;
    background-color: #444;
    position: relative;
    margin-top: 10px;
    margin-bottom: 10px;
}

.progress-bar {
    width: 0%;
    height: 100%;
    background-color: #ffffff;
    transition: width 1s linear;
}

/* ── Controls ─────────────────────────────────────────────────────────────── */
.controls {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
}

/* ── Listing info ─────────────────────────────────────────────────────────── */
#listingInfo {
    margin-top: 1rem;
    text-align: center;
}

#listingInfo a {
    color: #fff;
    text-decoration: none;
}

#listingInfo a:hover {
    text-decoration: underline;
}

#listingInfo p {
    margin: 0.5rem 0;
}

.genre-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 6px;
}

.genre-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.75rem;
    border: 1px solid #666;
    border-radius: 20px;
    color: #bbb;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

/* ── Player ───────────────────────────────────────────────────────────────── */
#player {
    margin-top: 20px;
    width: 100%;
    max-width: 380px;
    height: 380px;
    background-color: #000;
}

/* ── Mobile ───────────────────────────────────────────────────────────────── */
@media only screen and (max-width: 600px) {
    body {
        justify-content: flex-start;
        padding: env(safe-area-inset-top, 20px) env(safe-area-inset-right, 16px) calc(env(safe-area-inset-bottom, 20px) + 80px) env(safe-area-inset-left, 16px);
        height: 100%;
        min-height: 100vh;
        min-height: -webkit-fill-available;
        overflow-x: hidden;
    }

    h1 {
        font-size: 1.75rem;
        margin: 16px 0;
        padding-top: env(safe-area-inset-top, 0);
    }

    .mode-tabs {
        width: 100%;
    }

    .mode-tab {
        flex: 1;
        padding: 10px;
        font-size: 0.8rem;
    }

    .panel {
        width: 100%;
    }

    .search-bar {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }

    label {
        margin: 0;
        font-size: 1rem;
    }

    input[type="text"] {
        width: 100%;
        margin: 0;
        height: 44px;
        border-radius: 8px;
        font-size: 16px;
    }

    .search-field input {
        height: 40px;
        border-radius: 8px;
        font-size: 16px;
    }

    button {
        width: 100%;
        height: 44px;
        border-radius: 8px;
        font-size: 16px;
        margin: 0;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }

    button:active {
        background-color: #ffffff;
        color: #333;
    }

    .progress-bar-container {
        width: 100%;
        height: 3px;
        margin: 16px 0;
    }

    #player {
        width: 100%;
        max-width: none;
        aspect-ratio: 16/9;
        height: auto;
        margin: 16px 0;
        border-radius: 8px;
        overflow: hidden;
    }

    #listingInfo {
        margin: 16px 0;
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    #listingInfo a {
        display: block;
        margin-bottom: 8px;
        font-weight: bold;
        font-size: 1rem;
    }

    .controls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        padding: 12px 16px;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
        background-color: rgba(34, 34, 34, 0.95);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        margin: 0;
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        gap: 8px;
        box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.1);
    }

    .controls button {
        flex: 1;
        padding: 12px 8px;
        font-size: 14px;
        white-space: nowrap;
        min-width: 0;
    }
}

/* ── Seed / session row ───────────────────────────────────────────────────── */
.seed-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid #444;
    background: #1a1a1a;
    gap: 12px;
    flex-wrap: wrap;
}

.seed-display-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.seed-label {
    font-size: 0.6rem;
    letter-spacing: 2px;
    color: #666;
    text-transform: uppercase;
}

.seed-value {
    font-size: 1.1rem;
    letter-spacing: 4px;
    color: #fff;
    font-weight: bold;
}

.seed-resume-wrap {
    display: flex;
    gap: 6px;
    align-items: center;
}

.seed-resume-wrap input {
    width: 80px;
    padding: 6px 8px;
    font-size: 0.9rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    border: 1px solid #555;
    background: #2a2a2a;
    color: #fff;
    font-family: 'Courier New', Courier, monospace;
    margin: 0;
}

.seed-resume-wrap button {
    padding: 6px 12px;
    font-size: 0.8rem;
    border: 1px solid #888;
    color: #aaa;
    background: #2a2a2a;
    height: auto;
}

.seed-resume-wrap button:hover {
    background: #fff;
    color: #333;
    border-color: #fff;
}

/* Genre tags (used by nextRecord displayListingInfo) */
.genre-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 6px;
}

.genre-tag {
    display: inline-block;
    padding: 2px 8px;
    font-size: 0.75rem;
    border: 1px solid #666;
    border-radius: 20px;
    color: #bbb;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

@media only screen and (max-width: 600px) {
    .seed-row {
        flex-direction: column;
        align-items: flex-start;
    }
    .seed-resume-wrap {
        width: 100%;
    }
    .seed-resume-wrap input {
        flex: 1;
    }
    .seed-resume-wrap button {
        white-space: nowrap;
    }
}

/* ── Search summary (collapsed state) ─────────────────────────────────────── */
.search-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid #444;
    background: #1a1a1a;
    gap: 10px;
}

.search-summary.hidden { display: none; }
.search-grid.hidden    { display: none; }
button.hidden          { display: none; }

.search-summary-text {
    font-size: 0.85rem;
    color: #ccc;
    letter-spacing: 0.5px;
}

.search-summary-edit {
    font-size: 0.7rem;
    padding: 4px 10px;
    border: 1px solid #666;
    background: #2a2a2a;
    color: #aaa;
    letter-spacing: 1px;
    text-transform: uppercase;
    cursor: pointer;
    width: auto;
    height: auto;
}

.search-summary-edit:hover {
    background: #fff;
    color: #333;
    border-color: #fff;
}

/* ── App status / workflow utilities ─────────────────────────────────────── */
.status-line {
    width: 460px;
    min-height: 1.2em;
    margin: 4px 0 6px;
    text-align: center;
    font-size: 0.8rem;
    color: #aaa;
    letter-spacing: 0.5px;
}

.status-line.error {
    color: #f88;
}

.seed-copy {
    border: 0;
    background: transparent;
    padding: 0;
    height: auto;
    width: auto;
    cursor: pointer;
    font-family: 'Courier New', Courier, monospace;
}

.seed-copy:hover {
    background: transparent;
    color: #fff;
    text-decoration: underline;
}

.loading-copy {
    color: #aaa;
    font-size: 0.8rem;
}

.listing-actions {
    display: flex;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
}

.utility-button {
    width: auto;
    height: auto;
    padding: 6px 10px;
    font-size: 0.75rem;
    border-color: #777;
    color: #bbb;
    background: #2a2a2a;
}

.utility-button:hover {
    background: #fff;
    color: #333;
    border-color: #fff;
}

@media only screen and (max-width: 600px) {
    html {
        min-height: 100%;
        min-height: -webkit-fill-available;
    }

    body {
        width: 100%;
        justify-content: flex-start;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .search-grid {
        grid-template-columns: 1fr;
    }

    .status-line {
        width: 100%;
        min-height: 1.4em;
        font-size: 0.75rem;
        line-height: 1.35;
        padding: 0 6px;
    }

    .search-summary {
        width: 100%;
    }

    .search-summary-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    #listingInfo {
        width: 100%;
        max-height: none;
        order: 20;
    }

    #player {
        order: 30;
    }

    .listing-actions {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .utility-button {
        width: 100%;
        min-height: 38px;
        font-size: 0.8rem;
    }

    .controls button::after {
        content: attr(data-mobile-label);
    }

    .controls button {
        font-size: 0;
    }

    .controls button::after {
        font-size: 14px;
    }

    .seed-copy {
        width: auto;
        min-height: 0;
        height: auto;
    }
}
```

## videoSelector.js

```javascript
// videoSelector.js

import { setCurrentVideoInfo } from './keyboardShortcuts.js';
import { createYouTubePlayer } from './script.js';

let player = null;
let currentListing = null;
let currentTrackIndex = 0;
let playedTracks = [];
let unavailableTracks = [];
let currentReleaseCycleId = null;

export function setPlayerInstance(playerInstance) {
    player = playerInstance;
}

export function playTrack(listing, trackIndex = 0) {
    const videos = normalizeVideos(listing?.release_videos || []);
    if (!listing || videos.length === 0) {
        updateStatus('No YouTube videos on this Discogs release.', true);
        console.warn('No videos available for this listing:', listing);
        return false;
    }

    if (!currentListing || listing.release_id !== currentListing.release_id) {
        currentListing = listing;
        playedTracks = [];
        unavailableTracks = [];
        currentReleaseCycleId = listing.release_id;
    }

    const safeIndex = Math.max(0, Math.min(videos.length - 1, Number.parseInt(trackIndex, 10) || 0));
    currentTrackIndex = safeIndex;

    const video = videos[safeIndex];
    const videoId = extractYouTubeId(video.uri || video.resource_url || video.embed || '');
    if (!videoId) {
        markCurrentUnavailableAndAdvance();
        return false;
    }

    const videoTitle = video.title || listing.release_description || 'Untitled video';
    setCurrentVideoInfo(listing.release_id, videoId, videoTitle, listing);
    updateStatus(`Playing ${safeIndex + 1}/${videos.length}: ${videoTitle}`);

    if (!player) {
        createYouTubePlayer(videoId, (newPlayer) => {
            player = newPlayer;
            try { player.loadVideoById(videoId); } catch (e) { console.warn('Could not load video:', e); }
        }, handleVideoError, handleStateChange);
    } else {
        try { player.loadVideoById(videoId); } catch (e) { handleVideoError(e); }
    }
    return true;
}

function normalizeVideos(videos) {
    return Array.isArray(videos) ? videos.filter(v => v && (v.uri || v.resource_url || v.embed)) : [];
}

function extractYouTubeId(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    try {
        const parsed = new URL(raw, window.location.href);
        if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '').slice(0, 11);
        if (parsed.searchParams.get('v')) return parsed.searchParams.get('v').slice(0, 11);
        const embedMatch = parsed.pathname.match(/\/(embed|shorts|v)\/([^/?#]+)/);
        if (embedMatch) return embedMatch[2].slice(0, 11);
    } catch (e) {
        const fallback = raw.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
        if (fallback) return fallback[1];
    }
    const plainId = raw.match(/^[A-Za-z0-9_-]{11}$/);
    return plainId ? raw : '';
}

function handleVideoError(event) {
    console.warn('YT error:', event);
    markCurrentUnavailableAndAdvance();
}

function markCurrentUnavailableAndAdvance() {
    if (!currentListing) return;
    if (!unavailableTracks.includes(currentTrackIndex)) unavailableTracks.push(currentTrackIndex);
    const nextIndex = findNextPlayableIndex({ skipPlayed: false });
    if (nextIndex === null) advanceToNextRecord();
    else nextTrackHandler(nextIndex);
}

function handleStateChange(event) {
    if (!currentListing || typeof YT === 'undefined') return;
    if (event.data === YT.PlayerState.ENDED) {
        if (!playedTracks.includes(currentTrackIndex)) playedTracks.push(currentTrackIndex);
        const nextIndex = findNextPlayableIndex({ skipPlayed: true });
        if (nextIndex === null) advanceToNextRecord();
        else nextTrackHandler(nextIndex);
    }
}

function findNextPlayableIndex({ skipPlayed }) {
    const total = normalizeVideos(currentListing?.release_videos || []).length;
    if (!total) return null;

    for (let i = 1; i <= total; i++) {
        const candidate = (currentTrackIndex + i) % total;
        if (unavailableTracks.includes(candidate)) continue;
        if (skipPlayed && playedTracks.includes(candidate)) continue;
        return candidate;
    }

    if (skipPlayed) {
        for (let i = 0; i < total; i++) {
            if (!unavailableTracks.includes(i)) return null;
        }
    }
    return null;
}

function advanceToNextRecord() {
    import('./nextRecord.js').then(module => module.nextRecord({ reason: 'noPlayableTracks' }));
}

export function nextTrackHandler(nextIndex) {
    if (!currentListing) {
        updateStatus('Choose a record first.', true);
        return;
    }

    const total = normalizeVideos(currentListing.release_videos || []).length;
    if (!total) {
        advanceToNextRecord();
        return;
    }

    let newIndex;
    if (typeof nextIndex !== 'undefined' && nextIndex !== null) {
        newIndex = Math.max(0, Math.min(total - 1, Number.parseInt(nextIndex, 10) || 0));
    } else {
        newIndex = findNextPlayableIndex({ skipPlayed: false });
    }

    if (newIndex === null || typeof newIndex === 'undefined') {
        advanceToNextRecord();
        return;
    }

    currentTrackIndex = newIndex;
    playTrack(currentListing, newIndex);
}

export function getTotalTracks(listing) {
    if (Array.isArray(listing?.release_videos) && listing.release_videos.length > 0) return listing.release_videos.length;
    if (Array.isArray(listing?.release_tracklist) && listing.release_tracklist.length > 0) return listing.release_tracklist.length;
    if (Array.isArray(listing?.tracklist) && listing.tracklist.length > 0) return listing.tracklist.length;
    return 0;
}

export function getCurrentPlaybackState() {
    return {
        listing: currentListing,
        trackIndex: currentTrackIndex,
        playedTracks: [...playedTracks],
        unavailableTracks: [...unavailableTracks],
        releaseCycleId: currentReleaseCycleId,
    };
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}
```
