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

export function getPlayerInstance() {
    return player;
}

export function playTrack(listing, trackIndex) {
    if (!listing || !listing.release_videos || listing.release_videos.length === 0) {
        console.error('No videos available for this listing');
        return;
    }
    if (!currentListing || listing.release_id !== currentListing.release_id) {
        currentListing = listing;
        playedTracks = [];
        unavailableTracks = [];
        currentReleaseCycleId = listing.release_id;
        currentTrackIndex = trackIndex;
    } else {
        currentTrackIndex = trackIndex;
    }
    const video = listing.release_videos[trackIndex];
    const videoId = video.uri.split('v=')[1];
    const videoTitle = video.title;
    setCurrentVideoInfo(listing.release_id, videoId, videoTitle);
    if (!player) {
        createYouTubePlayer(videoId, (newPlayer) => {
            player = newPlayer;
            player.loadVideoById(videoId);
        }, handleVideoError, handleStateChange);
    } else {
        player.loadVideoById(videoId);
        // Re-apply pitch slider rate after loading new video
        if (window.__applyCurrentPitch) window.__applyCurrentPitch();
    }
}

function handleVideoError(event) {
    if (!currentListing) return;
    if (unavailableTracks.indexOf(currentTrackIndex) === -1) {
        unavailableTracks.push(currentTrackIndex);
    }
    let total = currentListing.release_videos.length;
    let nextIndex = null;
    for (let i = 1; i <= total; i++) {
        let candidate = (currentTrackIndex + i) % total;
        if (unavailableTracks.indexOf(candidate) === -1) {
            nextIndex = candidate;
            break;
        }
    }
    if (nextIndex === null) {
        import('./nextRecord.js').then(module => {
            module.nextRecord();
        });
        return;
    }
    nextTrackHandler(nextIndex);
}

function handleStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        if (playedTracks.indexOf(currentTrackIndex) === -1) {
            playedTracks.push(currentTrackIndex);
        }
        let total = currentListing.release_videos.length;
        let availableIndices = [];
        for (let i = 0; i < total; i++) {
            if (unavailableTracks.indexOf(i) === -1) {
                availableIndices.push(i);
            }
        }
        let playedAvailable = availableIndices.filter(i => playedTracks.indexOf(i) !== -1);
        if (playedAvailable.length === availableIndices.length) {
            import('./nextRecord.js').then(module => {
                module.nextRecord();
            });
            return;
        }
        let nextIndex = null;
        for (let i = 1; i <= total; i++) {
            let candidate = (currentTrackIndex + i) % total;
            if (unavailableTracks.indexOf(candidate) === -1 && playedTracks.indexOf(candidate) === -1) {
                nextIndex = candidate;
                break;
            }
        }
        if (nextIndex === null) {
            nextIndex = availableIndices[0];
        }
        nextTrackHandler(nextIndex);
    }
}

export function nextTrackHandler(nextIndex) {
    let total = currentListing.release_videos.length;
    let newIndex;
    if (typeof nextIndex !== 'undefined') {
        newIndex = nextIndex;
    } else {
        for (let i = 1; i <= total; i++) {
            let candidate = (currentTrackIndex + i) % total;
            if (unavailableTracks.indexOf(candidate) === -1) {
                newIndex = candidate;
                break;
            }
        }
        if (newIndex === undefined) {
            import('./nextRecord.js').then(module => {
                module.nextRecord();
            });
            return;
        }
    }
    currentTrackIndex = newIndex;
    playTrack(currentListing, newIndex);
}

export function getTotalTracks(listing) {
    if (listing.release_videos && listing.release_videos.length > 0) {
        return listing.release_videos.length;
    }
    if (listing.tracklist && listing.tracklist.length > 0) {
        return listing.tracklist.length;
    }
    return 0;
}
