// script.js

import { loadStore } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';
import { loadSearch, resumeSearch } from './loadSearch.js';
import { loadSession, clearSession } from './seedRandom.js';

let player = null;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    datalist.innerHTML = '';
    searchSuggestions.forEach(s => {
        const o = document.createElement('option');
        o.value = s;
        datalist.appendChild(o);
    });
}

function createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback) {
    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId || '',
            playerVars: { 'playsinline': 1 },
            events: {
                'onReady':       () => { if (callback && videoId) callback(player); },
                'onError':       (e) => { if (errorCallback) errorCallback(e); else console.error('YT error:', e); },
                'onStateChange': (e) => { if (stateChangeCallback) stateChangeCallback(e); }
            }
        });
        setPlayerInstance(player);
    } else if (videoId) {
        player.loadVideoById(videoId);
    }
}

function loadYouTubeAPI() {
    return new Promise(resolve => {
        if (typeof YT !== 'undefined' && YT?.Player) resolve();
        else window.onYouTubeIframeAPIReady = resolve;
    });
}

function collectSearchParams() {
    return {
        query:    document.getElementById('sq').value.trim(),
        genre:    document.getElementById('sGenre').value.trim(),
        style:    document.getElementById('sStyle').value.trim(),
        year:     document.getElementById('sYear').value.trim(),
        yearFrom: document.getElementById('sYearFrom').value.trim(),
        yearTo:   document.getElementById('sYearTo').value.trim(),
        country:  document.getElementById('sCountry').value.trim(),
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const loadButton        = document.getElementById('loadButton');
    const resellerNameInput = document.getElementById('resellerName');
    const nextRecordButton  = document.getElementById('nextRecordButton');
    const prevRecordButton  = document.getElementById('prevRecordButton');
    const nextTrackButton   = document.getElementById('nextTrackButton');
    const searchButton      = document.getElementById('searchButton');
    const resumeButton      = document.getElementById('resumeButton');
    const seedInput         = document.getElementById('seedInput');
    const tabStore          = document.getElementById('tabStore');
    const tabSearch         = document.getElementById('tabSearch');
    const panelStore        = document.getElementById('panelStore');
    const panelSearch       = document.getElementById('panelSearch');

    populateSearchSuggestions();

    // ── Tab switching ────────────────────────────────────────────────────────
    tabStore.addEventListener('click', () => {
        tabStore.classList.add('active');   tabSearch.classList.remove('active');
        panelStore.classList.remove('hidden'); panelSearch.classList.add('hidden');
    });
    tabSearch.addEventListener('click', () => {
        tabSearch.classList.add('active');  tabStore.classList.remove('active');
        panelSearch.classList.remove('hidden'); panelStore.classList.add('hidden');
    });

    // ── Store load ───────────────────────────────────────────────────────────
    loadButton.addEventListener('click', () => {
        const name = resellerNameInput.value.trim();
        if (name) { clearSession(); loadStore(name); }
    });

    resellerNameInput.addEventListener('mousedown', () => {
        if (searchSuggestions.includes(resellerNameInput.value)) {
            const cur = resellerNameInput.value;
            resellerNameInput.value = '';
            setTimeout(() => { resellerNameInput.value = cur; }, 0);
        }
    });

    // ── Discogs search ───────────────────────────────────────────────────────
    searchButton.addEventListener('click', () => {
        const params = collectSearchParams();
        if (!Object.values(params).some(v => v)) {
            document.getElementById('listingInfo').innerHTML =
                '<p style="color:#f88">Fill in at least one search field.</p>';
            return;
        }
        loadSearch(params);
    });

    ['sq', 'sGenre', 'sStyle', 'sYear', 'sYearFrom', 'sYearTo', 'sCountry'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') searchButton.click();
        });
    });

    // ── Resume session ───────────────────────────────────────────────────────
    resumeButton.addEventListener('click', () => {
        const key = seedInput.value.trim().toUpperCase();
        if (!key) return;
        const session = loadSession();
        if (session && session.seed === key) {
            resumeSearch(session);
        } else {
            // Key entered but no matching saved session — start fresh with that seed
            const params = collectSearchParams();
            if (!Object.values(params).some(v => v)) {
                document.getElementById('listingInfo').innerHTML =
                    '<p style="color:#f88">Enter search parameters to resume with this key.</p>';
                return;
            }
            loadSearch(params, key);
        }
    });

    seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') resumeButton.click(); });

    // ── Playback controls ────────────────────────────────────────────────────
    nextRecordButton.addEventListener('click', () => nextRecord());
    prevRecordButton.addEventListener('click', () => prevRecord());
    nextTrackButton.addEventListener('click',  () => nextTrack());

    // ── Auto-restore session on page load ────────────────────────────────────
    const saved = loadSession();
    if (saved) {
        const age  = Date.now() - (saved.savedAt || 0);
        const days = Math.floor(age / 86400000);
        const info = document.getElementById('listingInfo');
        info.innerHTML = `
            <p style="color:#aaa">
                Saved session found — key <strong style="color:#fff">${saved.seed}</strong>
                (${days === 0 ? 'today' : days + 'd ago'},
                ${saved.listenedIds.length} records played).
                <br>
                <button onclick="window.__resumeSaved()" style="margin-top:6px;font-size:0.8rem;padding:4px 10px">
                    Resume
                </button>
                <button onclick="window.__discardSaved()" style="margin-top:6px;font-size:0.8rem;padding:4px 10px;margin-left:6px;border-color:#888;color:#888">
                    Discard
                </button>
            </p>`;

        window.__resumeSaved = () => {
            info.innerHTML = '';
            tabSearch.click();
            resumeSearch(saved);
        };
        window.__discardSaved = () => {
            clearSession();
            info.innerHTML = '';
        };
    }

    loadYouTubeAPI();
});

export { createYouTubePlayer };
