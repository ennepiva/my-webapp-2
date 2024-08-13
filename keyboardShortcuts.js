import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';

let currentVideoId = '';  // To track the current video ID being played
let currentReleaseId = ''; // To track the current release ID
let currentVideoTitle = ''; // To track the current video title being played

document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'a': // Left arrow for Previous Record
            prevRecord();
            break;
        case 'd': // Right arrow for Next Record
            nextRecord();
            break;
        case 's': // Down arrow for Next Track
        case 'w':   // Up arrow for Next Track
            nextTrack();
            break;
        case 't': // 't' to copy the YouTube video title to clipboard
            copyVideoTitleToClipboard();
            break;
        case 'v': // 'v' to copy the release ID and video ID to clipboard
            copyReleaseAndVideoToClipboard();
            break;
        default:
            break;
    }
});

function copyVideoTitleToClipboard() {
    if (currentVideoTitle) {
        navigator.clipboard.writeText(currentVideoTitle).then(() => {
            console.log('Video title copied to clipboard:', currentVideoTitle);
        }).catch(err => {
            console.error('Failed to copy video title:', err);
        });
    } else {
        console.log('No video is currently playing.');
    }
}

function copyReleaseAndVideoToClipboard() {
    if (currentReleaseId && currentVideoId) {
        const textToCopy = `'${currentReleaseId}','${currentVideoId}'`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Release ID and Video ID copied to clipboard:', textToCopy);
        }).catch(err => {
            console.error('Failed to copy release ID and video ID:', err);
        });
    } else {
        console.log('Release ID or Video ID is not available.');
    }
}

export function setCurrentVideoInfo(releaseId, videoId, videoTitle) {
    currentReleaseId = releaseId;
    currentVideoId = videoId;
    currentVideoTitle = videoTitle;
}
