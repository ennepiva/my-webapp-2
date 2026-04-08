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
                    // Apply any pitch the user set before the player was ready
                    if (window.__applyCurrentPitch) window.__applyCurrentPitch();
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


    // ── Pitch control (5 fixed steps) ───────────────────────────────────────
    // YouTube only supports: 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2
    // Usable steps near vinyl range:
    const PITCH_STEPS = [0.75, 0.875, 1, 1.25, 1.5];
    // 0.875 isn't a real YouTube step — snaps to nearest, so effectively:
    // 0.75 → 0.75, 0.875 → 0.75 or 1 (mid), 1 → 1, 1.25 → 1.25, 1.5 → 1.5
    // Use only the 4 that actually work:
    const PITCH_RATES  = [0.75, 1, 1, 1.25, 1.5];
    const PITCH_LABELS = ['0.75×  −25%', '1.0×  ±0%', '1.0×  ±0%', '1.25×  +25%', '1.5×  +50%'];

    // Clean 5 steps that each map to a distinct YouTube rate
    const STEPS = [
        { rate: 0.75, label: '0.75×', sub: '−25%', cls: 'negative' },
        { rate: 1,    label: '1.0×',  sub: '±0%',  cls: '' },
        { rate: 1.25, label: '1.25×', sub: '+25%', cls: 'positive' },
        { rate: 1.5,  label: '1.5×',  sub: '+50%', cls: 'positive' },
        { rate: 2,    label: '2.0×',  sub: '+100%', cls: 'positive' },
    ];
    // slider: 0=top(fast) … 4=bottom(slow) — invert so top = faster like a real deck
    // min=0 top → STEPS[4] (2.0×), max=4 bottom → STEPS[0] (0.75×)
    // But let's keep it intuitive: center (value=2) = 1.0×, up=faster, down=slower

    const pitchSlider = document.getElementById('pitchSlider');
    const pitchValue  = document.getElementById('pitchValue');
    const pitchReset  = document.getElementById('pitchReset');
    const pitchTicks  = document.getElementById('pitchTicks');

    // Build tick marks
    if (pitchTicks) {
        STEPS.forEach((_, i) => {
            const tick = document.createElement('div');
            tick.className = 'pitch-tick' + (i === 2 ? ' center' : '');
            // position: 0%=top(slider max=4 inverted), evenly spaced
            tick.style.top = (i * 25) + '%';
            pitchTicks.appendChild(tick);
        });
    }

    function getStepIndex() {
        // slider value 0–4; invert so 0=bottom=slowest, 4=top=fastest
        return parseInt(pitchSlider.value);
    }

    function applyPitch(index) {
        const step = STEPS[index];
        pitchValue.textContent = step.label;
        pitchValue.style.color = step.cls === 'positive' ? '#aaffaa'
                               : step.cls === 'negative' ? '#ffaaaa'
                               : '#fff';
        const p = getPlayerInstance();
        if (p && typeof p.setPlaybackRate === 'function') {
            p.setPlaybackRate(step.rate);
            console.log('[pitch] step:', index, '→ rate:', step.rate);
        }
    }

    pitchSlider.addEventListener('input', () => applyPitch(getStepIndex()));

    pitchReset.addEventListener('click', () => {
        pitchSlider.value = 2; // center = 1.0×
        applyPitch(2);
    });

    window.__applyCurrentPitch = () => applyPitch(getStepIndex());

    // Init display
    applyPitch(2);

    pitchSlider.addEventListener('input', () => applyPitch(pitchSlider.value));

    pitchReset.addEventListener('click', () => {
        pitchSlider.value = 0;
        applyPitch(0);
    });

    loadYouTubeAPI();
});

export { createYouTubePlayer };
