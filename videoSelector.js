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
