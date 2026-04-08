// loadSearch.js
// Populates the same shared state as loadStore.js, but via the Discogs /database/search endpoint.
// nextRecord.js and everything downstream work unchanged.

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

let currentSearchParams = null; // kept so fetchRandomSearchPage can re-use them

export function getCurrentSearchParams() {
    return currentSearchParams;
}

export function loadSearch(params) {
    // params: { query, genre, style, year, country }
    const label = buildLabel(params);
    console.log("Search triggered:", label);

    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = "0%";
    const randomSplit = Math.floor(Math.random() * (55 - 25 + 1)) + 25;
    setTimeout(() => {
        progressBar.style.transition = "width 1s linear";
        progressBar.style.width = `${randomSplit}%`;
    }, 10);

    // Reset shared state (same as loadStore does)
    setCurrentStoreName('');          // not a store search
    setListingsListenedTo([]);
    setPagesScanned(['1']);
    setListingDetails([]);
    setTotalPages(1);
    currentSearchParams = params;

    const url = buildSearchUrl(params, 1);
    console.log("Fetching:", url);

    fetch(url, { headers: discogsApiHeaders })
        .then(r => r.json())
        .then(data => {
            if (!data.results || data.results.length === 0) {
                console.log("No results found for search.");
                progressBar.style.width = "100%";
                document.getElementById('listingInfo').innerHTML =
                    `<p style="color:#f88">No results found. Try different search parameters.</p>`;
                return;
            }

            setTotalPages(data.pagination.pages);
            console.log(`Search: ${data.pagination.items} total results, ${data.pagination.pages} pages`);

            let loaded = 0;
            const total = data.results.length;

            data.results.forEach((result, index) => {
                setTimeout(() => {
                    listingDetails.push(searchResultToListing(result));
                    loaded++;
                    progressBar.style.width =
                        `${randomSplit + (loaded / total) * (100 - randomSplit)}%`;
                }, index * 10);
            });
        })
        .catch(err => console.error("Error fetching Discogs search:", err));
}

export function fetchRandomSearchPage() {
    if (!currentSearchParams) return;

    const maxPages = Math.min(totalPages, 200);
    if (pagesScanned.length >= maxPages) {
        console.log("All search pages scanned.");
        return;
    }

    let randomPage;
    do {
        randomPage = Math.floor(Math.random() * maxPages) + 1;
    } while (pagesScanned.includes(randomPage.toString()));
    pagesScanned.push(randomPage.toString());

    const url = buildSearchUrl(currentSearchParams, randomPage);
    console.log(`Fetching search page ${randomPage}`);

    fetch(url, { headers: discogsApiHeaders })
        .then(r => r.json())
        .then(data => {
            (data.results || []).forEach(result => {
                listingDetails.push(searchResultToListing(result));
            });
            console.log(`Search page ${randomPage} loaded, ${data.results?.length} results`);
        })
        .catch(err => console.error("Error fetching search page:", err));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function buildSearchUrl(params, page) {
    const base = 'https://api.discogs.com/database/search';
    const q = new URLSearchParams({ type: 'release', page, per_page: 100 });
    if (params.query)   q.set('q',       params.query);
    if (params.genre)   q.set('genre',   params.genre);
    if (params.style)   q.set('style',   params.style);
    if (params.year)    q.set('year',    params.year);
    if (params.country) q.set('country', params.country);
    return `${base}?${q.toString()}`;
}

function buildLabel(params) {
    return Object.entries(params)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}:${v}`)
        .join(' | ') || '(empty)';
}

/**
 * Map a Discogs search result to the same shape nextRecord.js expects.
 * Search results already carry genre/style/year/country — bonus.
 */
function searchResultToListing(result) {
    return {
        listing_id:          result.id,          // release ID used as listing ID
        listing_price:       'N/A',              // not a marketplace listing
        listing_uri:         result.uri
                                ? `https://www.discogs.com${result.uri}`
                                : `https://www.discogs.com/release/${result.id}`,
        listing_condition:   'N/A',
        sleeve_condition:    'N/A',
        release_id:          result.id,
        release_description: result.title,
        release_videos:      null,               // fetched on demand by nextRecord
        release_tracklist:   null,
        release_artists:     null,
        release_year:        result.year         || null,
        release_genres:      result.genre        || [],
        release_styles:      result.style        || [],
    };
}
