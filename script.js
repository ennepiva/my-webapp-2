// script.js

import { loadStore } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance, getPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';
import { loadSearch } from './loadSearch.js';

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
                    if (callback && videoId) callback(player);
                },
                'onError':       (event) => { if (errorCallback)       errorCallback(event);       else console.error('YouTube Player error:', event); },
                'onStateChange': (event) => { if (stateChangeCallback) stateChangeCallback(event); }
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
            window.onYouTubeIframeAPIReady = resolve;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // ── element refs ────────────────────────────────────────────────────────
    const loadButton        = document.getElementById('loadButton');
    const resellerNameInput = document.getElementById('resellerName');
    const nextRecordButton  = document.getElementById('nextRecordButton');
    const prevRecordButton  = document.getElementById('prevRecordButton');
    const nextTrackButton   = document.getElementById('nextTrackButton');
    const searchButton      = document.getElementById('searchButton');
    const tabStore          = document.getElementById('tabStore');
    const tabSearch         = document.getElementById('tabSearch');
    const panelStore        = document.getElementById('panelStore');
    const panelSearch       = document.getElementById('panelSearch');

    populateSearchSuggestions();

    // ── tab switching ────────────────────────────────────────────────────────
    tabStore.addEventListener('click', () => {
        tabStore.classList.add('active');
        tabSearch.classList.remove('active');
        panelStore.classList.remove('hidden');
        panelSearch.classList.add('hidden');
    });

    tabSearch.addEventListener('click', () => {
        tabSearch.classList.add('active');
        tabStore.classList.remove('active');
        panelSearch.classList.remove('hidden');
        panelStore.classList.add('hidden');
    });

    // ── store load ───────────────────────────────────────────────────────────
    loadButton.addEventListener('click', () => {
        const resellerName = resellerNameInput.value;
        if (resellerName.trim()) loadStore(resellerName);
    });

    resellerNameInput.addEventListener('mousedown', () => {
        if (searchSuggestions.includes(resellerNameInput.value)) {
            let current = resellerNameInput.value;
            resellerNameInput.value = "";
            setTimeout(() => { resellerNameInput.value = current; }, 0);
        }
    });

    // ── discogs search ───────────────────────────────────────────────────────
    searchButton.addEventListener('click', () => {
        const params = {
            query:   document.getElementById('sq').value.trim(),
            genre:   document.getElementById('sGenre').value.trim(),
            style:   document.getElementById('sStyle').value.trim(),
            year:    document.getElementById('sYear').value.trim(),
            decade:  document.getElementById('sDecade').value.trim(),
            country: document.getElementById('sCountry').value.trim(),
        };
        // Require at least one field
        if (!Object.values(params).some(v => v)) {
            document.getElementById('listingInfo').innerHTML =
                `<p style="color:#f88">Please fill in at least one search field.</p>`;
            return;
        }
        loadSearch(params);
    });

    // Allow pressing Enter in any search field to fire the search
    ['sq', 'sGenre', 'sStyle', 'sYear', 'sDecade', 'sCountry'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') searchButton.click();
        });
    });

    // ── playback controls ────────────────────────────────────────────────────
    nextRecordButton.addEventListener('click', () => nextRecord());
    prevRecordButton.addEventListener('click', () => prevRecord());
    nextTrackButton.addEventListener('click',  () => nextTrack());


    // ── Pitch control ────────────────────────────────────────────────────────
    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue  = document.getElementById('pitchValue');
    const pitchReset  = document.getElementById('pitchReset');

    function applyPitch(val) {
        const pct = parseFloat(val);
        const rate = 1 + pct / 100;
        pitchValue.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
        pitchValue.style.color = pct === 0 ? '#fff' : (pct > 0 ? '#aaffaa' : '#ffaaaa');
        const p = getPlayerInstance();
        if (p && p.setPlaybackRate) {
            const allowed = p.getAvailablePlaybackRates
                ? p.getAvailablePlaybackRates()
                : [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
            const nearest = allowed.reduce((a, b) => Math.abs(b - rate) < Math.abs(a - rate) ? b : a);
            p.setPlaybackRate(nearest);
        }
    }

    pitchSlider.addEventListener('input', () => applyPitch(pitchSlider.value));

    pitchReset.addEventListener('click', () => {
        pitchSlider.value = 0;
        applyPitch(0);
    });

    loadYouTubeAPI();
});

export { createYouTubePlayer };
