import { loadStore } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';

let player = null;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    datalist.innerHTML = ""; // Clear existing options

    searchSuggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion;
        datalist.appendChild(option);
    });
}

function onYouTubeIframeAPIReady() {
    console.log("YouTube API is ready, but player will only be created when needed.");
}

function createYouTubePlayer(videoId, callback) {
    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId || "", // Empty initially
            playerVars: { 'playsinline': 1 },
            events: {
                'onReady': (event) => {
                    console.log('YouTube Player is ready');
                    if (videoId) {
                        event.target.loadVideoById(videoId); // Ensure first video plays
                    }
                    if (callback) {
                        callback(player);
                    }
                },
                'onError': (event) => console.error('YouTube Player error:', event)
            }
        });

        setPlayerInstance(player);
    } else if (videoId) {
        player.loadVideoById(videoId);
    }
}

function loadYouTubeAPI() {
    return new Promise((resolve) => {
        if (typeof YT !== 'undefined' && YT && YT.Player) {
            resolve();
        } else {
            window.onYouTubeIframeAPIReady = () => {
                resolve();
            };
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const loadButton = document.getElementById('loadButton');
    const resellerNameInput = document.getElementById('resellerName');
    const nextRecordButton = document.getElementById('nextRecordButton');
    const prevRecordButton = document.getElementById('prevRecordButton');
    const nextTrackButton = document.getElementById('nextTrackButton');

    populateSearchSuggestions(); // Populate the search bar with suggestions

    loadButton.addEventListener('click', () => {
        const resellerName = resellerNameInput.value;
        if (resellerName.trim()) {
            loadStore(resellerName);
        }
    });

    nextRecordButton.addEventListener('click', () => {
        nextRecord();
    });

    prevRecordButton.addEventListener('click', () => {
        prevRecord();
    });

    nextTrackButton.addEventListener('click', () => {
        nextTrack();
    });

    loadYouTubeAPI();
});

export { createYouTubePlayer };
