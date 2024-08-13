import { setCurrentVideoInfo } from './keyboardShortcuts.js';

let currentVideoIndex = 0;
let player;

export function setPlayerInstance(playerInstance) {
    player = playerInstance;
}

export function playTrack(listing, trackIndex) {
    if (!player) {
        console.error('YouTube player is not initialized');
        return;
    }

    const hasVideos = listing.release_videos && listing.release_videos.length > 0;

    if (hasVideos) {
        if (trackIndex >= listing.release_videos.length) {
            trackIndex = 0;
        }

        currentVideoIndex = trackIndex;
        const video = listing.release_videos[trackIndex];
        const videoId = video.uri.split('v=')[1];
        const videoTitle = video.title;
        
        setCurrentVideoInfo(listing.release_id, videoId, videoTitle); // Track current release ID, video ID, and video title
        player.loadVideoById(videoId);
    } else if (listing.tracklist && listing.tracklist.length > 0) {
        console.log('No videos available. Tracklist is present but not yet handled.');
    } else {
        console.error('No videos or tracklist available for this listing');
    }
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
