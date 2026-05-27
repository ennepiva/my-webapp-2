// keyboardShortcuts.js

import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';

let currentVideoId = '';
let currentReleaseId = '';
let currentVideoTitle = '';

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
        case '/':
            showShortcutHelp();
            break;
        default:
            break;
    }
});

function copyVideoTitleToClipboard() {
    copyToClipboard(currentVideoTitle, 'Video title');
}

function copyReleaseAndVideoToClipboard() {
    if (currentReleaseId && currentVideoId) {
        copyToClipboard(`'${currentReleaseId}','${currentVideoId}'`, 'Release/video IDs');
    } else {
        console.log('Release ID or video ID is not available.');
    }
}

function showShortcutHelp() {
    console.log('Shortcuts: A/← previous, D/→ next record, W/S/↑/↓ next track, T title, V IDs.');
}

function copyToClipboard(value, label) {
    if (!value) {
        console.log('Nothing to copy yet.');
        return;
    }
    navigator.clipboard.writeText(value).then(() => {
        console.log(`${label} copied to clipboard:`, value);
    }).catch(err => {
        console.error('Clipboard copy failed:', err);
    });
}

export function setCurrentVideoInfo(releaseId, videoId, videoTitle) {
    currentReleaseId = String(releaseId || '');
    currentVideoId = String(videoId || '');
    currentVideoTitle = String(videoTitle || '');
}
