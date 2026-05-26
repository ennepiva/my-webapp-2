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
