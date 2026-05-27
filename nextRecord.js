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
    const loadingHtml = options.loading ? '<p class="loading-copy">Loading release videos…</p>' : '';

    listingInfo.innerHTML = `
        <a href="${escapeAttribute(listing.listing_uri || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(listing.release_description || 'No description available')}</a>
        ${artists ? `<p>${escapeHtml(artists)}</p>` : ''}
        ${metaHtml}
        ${tagsHtml}
        ${loadingHtml}
    `;
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
