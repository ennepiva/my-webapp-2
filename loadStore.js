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
    if (error?.status === 401 || error?.status === 403) return 'Discogs authorization failed. Add or update your Discogs token.';
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
