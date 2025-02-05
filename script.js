import { loadStore } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';

let player = null;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    datalist.innerHTML = "";
    searchSuggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion;
        datalist.appendChild(option);
    });
}

function onYouTubeIframeAPIReady() {
    console.log("YouTube API is ready, but player will only be created when needed.");
}

function createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback) {
    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId || "",
            playerVars: { 'playsinline': 1 },
            events: {
                'onReady': () => {
                    console.log('YouTube Player is ready');
                    if (callback && videoId) {
                        callback(player);
                    }
                },
                'onError': (event) => { if(errorCallback) errorCallback(event); else console.error('YouTube Player error:', event); },
                'onStateChange': (event) => { if(stateChangeCallback) stateChangeCallback(event); }
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
    populateSearchSuggestions();
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
