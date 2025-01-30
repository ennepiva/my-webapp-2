import { setCurrentVideoInfo } from './keyboardShortcuts.js';
import { createYouTubePlayer } from './script.js';
import { nextRecord } from './nextRecord.js';

let player = null;
let playedVideos = new Set(); // Track played videos in a release
let currentListing = null; // Keep track of the current listing
let currentVideoIndex = 0; // Track which video is playing

export function setPlayerInstance(playerInstance) {
    player = playerInstance;
}

export function playTrack(listing, trackIndex, userTriggered = false) {
    if (!listing || !listing.release_videos || listing.release_videos.length === 0) {
        console.error('No videos available for this listing');
        return;
    }

    // If it's a new listing, reset tracking
    if (listing !== currentListing) {
        currentListing = listing;
        playedVideos.clear();
        currentVideoIndex = 0;
    }

    // Ensure we don't go out of bounds
    if (trackIndex >= listing.release_videos.length) {
        trackIndex = 0;
    }

    const video = listing.release_videos[trackIndex];
    const videoId = video.uri.split('v=')[1];
    const videoTitle = video.title;

    setCurrentVideoInfo(listing.release_id, videoId, videoTitle);
    playedVideos.add(videoId);
    currentVideoIndex = trackIndex;

    if (!player) {
        console.log("Initializing YouTube Player for first video...");
        createYouTubePlayer(videoId, (newPlayer) => {
            player = newPlayer;
            setupYouTubeEventHandlers(); // Attach event handlers after first load
        });
    } else {
        player.loadVideoById(videoId);
    }
}

// Moves to the next video in the same release
function nextVideo(autoTriggered = false) {
    const totalVideos = currentListing?.release_videos.length || 0;

    if (totalVideos === 0) {
        console.log("No videos available for this listing.");
        return;
    }

    // Cycle to next video
    currentVideoIndex = (currentVideoIndex + 1) % totalVideos;
    const nextVideoId = currentListing.release_videos[currentVideoIndex].uri.split('v=')[1];

    if (autoTriggered && playedVideos.has(nextVideoId)) {
        console.log("All videos have been played, moving to the next record...");
        nextRecord();
    } else {
        playTrack(currentListing, currentVideoIndex, false);
    }
}

// Attach YouTube API event handlers to handle video completion & errors
function setupYouTubeEventHandlers() {
    if (!player) return;

    player.addEventListener("onStateChange", (event) => {
        if (event.data === YT.PlayerState.ENDED) {
            console.log("Video ended, loading next...");
            nextVideo(true);
        }
    });

    player.addEventListener("onError", (event) => {
        console.log("Video error detected:", event.data);
        nextVideo(true);
    });
}

export function getTotalTracks(listing) {
    return listing?.release_videos?.length || 0;
}
