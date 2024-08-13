import { loadStore } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';

let player;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    searchSuggestions.forEach(suggestion => {
        const option = document.createElement('option');
        option.value = suggestion;
        datalist.appendChild(option);
    });
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        events: {
            'onReady': onPlayerReady
        }
    });

    setPlayerInstance(player);
}

function onPlayerReady(event) {
    console.log('YouTube Player is ready');
    event.target.playVideo();
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

    loadYouTubeAPI().then(() => {
        onYouTubeIframeAPIReady();
    });
});
