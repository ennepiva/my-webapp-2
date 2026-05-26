// script.js

import { loadStore, resumeStoreSession } from './loadStore.js';
import { nextRecord, prevRecord, nextTrack } from './nextRecord.js';
import { setPlayerInstance } from './videoSelector.js';
import { searchSuggestions } from './config.js';
import { loadSearch, resumeSearch } from './loadSearch.js';
import { loadSession, clearSession } from './seedRandom.js';
import { getDiscogsToken, setDiscogsToken } from './apiConfig.js';

let player = null;

function populateSearchSuggestions() {
    const datalist = document.getElementById('storeSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    searchSuggestions.forEach(s => {
        const option = document.createElement('option');
        option.value = s;
        datalist.appendChild(option);
    });
}

function createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback) {
    if (typeof YT === 'undefined' || !YT.Player) {
        loadYouTubeAPI().then(() => createYouTubePlayer(videoId, callback, errorCallback, stateChangeCallback));
        return;
    }

    if (!player) {
        player = new YT.Player('player', {
            height: '360',
            width: '640',
            videoId: videoId || '',
            playerVars: {
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
            },
            events: {
                onReady:       () => { if (callback && videoId) callback(player); },
                onError:       (e) => { if (errorCallback) errorCallback(e); else console.error('YT error:', e); },
                onStateChange: (e) => { if (stateChangeCallback) stateChangeCallback(e); }
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
        query:    getValue('sq'),
        genre:    getValue('sGenre'),
        style:    getValue('sStyle'),
        year:     getValue('sYear'),
        yearFrom: getValue('sYearFrom'),
        yearTo:   getValue('sYearTo'),
        country:  getValue('sCountry'),
    };
}

function getValue(id) {
    return document.getElementById(id)?.value.trim() || '';
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
    const seedDisplay       = document.getElementById('seedDisplay');
    const tabStore          = document.getElementById('tabStore');
    const tabSearch         = document.getElementById('tabSearch');
    const panelStore        = document.getElementById('panelStore');
    const panelSearch       = document.getElementById('panelSearch');
    const searchGrid        = document.getElementById('searchGrid');
    const searchSummary     = document.getElementById('searchSummary');
    const summaryText       = document.getElementById('searchSummaryText');
    const editButton        = document.getElementById('searchEditButton');

    populateSearchSuggestions();
    installTokenPromptIfNeeded();
    installSwipeControls();

    // ── Tab switching ────────────────────────────────────────────────────────
    function activateTab(mode) {
        const isStore = mode === 'store';
        tabStore.classList.toggle('active', isStore);
        tabSearch.classList.toggle('active', !isStore);
        tabStore.setAttribute('aria-selected', String(isStore));
        tabSearch.setAttribute('aria-selected', String(!isStore));
        panelStore.classList.toggle('hidden', !isStore);
        panelSearch.classList.toggle('hidden', isStore);
    }

    tabStore.addEventListener('click', () => activateTab('store'));
    tabSearch.addEventListener('click', () => activateTab('search'));

    // ── Store load ───────────────────────────────────────────────────────────
    loadButton.addEventListener('click', () => {
        const name = resellerNameInput.value.trim();
        if (name) {
            clearSession();
            loadStore(name);
        } else {
            updateStatus('Enter a store name first.', true);
        }
    });

    resellerNameInput.addEventListener('mousedown', () => {
        if (searchSuggestions.includes(resellerNameInput.value)) {
            const cur = resellerNameInput.value;
            resellerNameInput.value = '';
            setTimeout(() => { resellerNameInput.value = cur; }, 0);
        }
    });

    resellerNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') loadButton.click();
    });

    // ── Discogs search ───────────────────────────────────────────────────────
    function collapseSearch(params) {
        const parts = [];
        if (params.genre)    parts.push(params.genre);
        if (params.style)    parts.push(params.style);
        if (params.query)    parts.push(`"${params.query}"`);
        if (params.year)     parts.push(params.year);
        else if (params.yearFrom || params.yearTo) parts.push(`${params.yearFrom || '…'}–${params.yearTo || '…'}`);
        if (params.country)  parts.push(params.country);
        summaryText.textContent = parts.join(' · ') || 'Search active';
        searchGrid.classList.add('hidden');
        searchButton.classList.add('hidden');
        searchSummary.classList.remove('hidden');
    }

    function expandSearch() {
        searchGrid.classList.remove('hidden');
        searchButton.classList.remove('hidden');
        searchSummary.classList.add('hidden');
    }

    editButton.addEventListener('click', expandSearch);

    searchButton.addEventListener('click', () => {
        const params = collectSearchParams();
        if (!Object.values(params).some(v => v)) {
            updateStatus('Fill in at least one search field.', true);
            return;
        }
        clearSession();
        loadSearch(params);
        collapseSearch(params);
    });

    ['sq', 'sGenre', 'sStyle', 'sYear', 'sYearFrom', 'sYearTo', 'sCountry'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') searchButton.click();
        });
    });

    // ── Resume session ───────────────────────────────────────────────────────
    resumeButton.addEventListener('click', () => {
        const key = seedInput.value.trim().toUpperCase();
        if (!key) return;
        const session = loadSession();
        if (session && session.seed === key) {
            resumeLoadedSession(session, collapseSearch, activateTab);
        } else {
            const params = collectSearchParams();
            if (!Object.values(params).some(v => v)) {
                updateStatus('Enter search parameters to start with this key.', true);
                return;
            }
            loadSearch(params, key);
            collapseSearch(params);
        }
    });

    seedInput.addEventListener('input', () => {
        seedInput.value = seedInput.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 4);
    });
    seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') resumeButton.click(); });
    seedDisplay.addEventListener('click', () => copyToClipboard(seedDisplay.textContent.trim(), 'Session key copied.'));

    // ── Playback controls ────────────────────────────────────────────────────
    nextRecordButton.addEventListener('click', () => nextRecord());
    prevRecordButton.addEventListener('click', () => prevRecord());
    nextTrackButton.addEventListener('click',  () => nextTrack());

    // ── Auto-restore session on page load ────────────────────────────────────
    const saved = loadSession();
    if (saved) {
        showSavedSessionBanner(saved, collapseSearch, activateTab);
    }

    loadYouTubeAPI();
});

function showSavedSessionBanner(saved, collapseSearch, activateTab) {
    const seedEl = document.getElementById('seedDisplay');
    if (seedEl) seedEl.textContent = saved.seed;
    const seedInp = document.getElementById('seedInput');
    if (seedInp) seedInp.value = saved.seed;

    const age = Date.now() - (saved.savedAt || 0);
    const days = Math.max(0, Math.floor(age / 86400000));
    const info = document.getElementById('listingInfo');
    if (!info) return;

    const label = saved.mode === 'store'
        ? `store ${escapeHtml(saved.storeName || '')}`
        : 'search';

    info.innerHTML = `
        <p style="color:#aaa">
            Saved ${label} session found — key <strong style="color:#fff">${escapeHtml(saved.seed)}</strong>
            (${days === 0 ? 'today' : days + 'd ago'},
            ${(saved.listenedIds || []).length} records played).
            <br>
            <button id="resumeSavedButton" style="margin-top:6px;font-size:0.8rem;padding:4px 10px">Resume</button>
            <button id="discardSavedButton" style="margin-top:6px;font-size:0.8rem;padding:4px 10px;margin-left:6px;border-color:#888;color:#888">Discard</button>
        </p>`;

    document.getElementById('resumeSavedButton')?.addEventListener('click', () => {
        info.innerHTML = '';
        resumeLoadedSession(saved, collapseSearch, activateTab);
    });
    document.getElementById('discardSavedButton')?.addEventListener('click', () => {
        clearSession();
        info.innerHTML = '';
        updateStatus('Saved session discarded.');
    });
}

function resumeLoadedSession(session, collapseSearch, activateTab) {
    if (session.mode === 'store') {
        activateTab('store');
        const input = document.getElementById('resellerName');
        if (input) input.value = session.storeName || '';
        resumeStoreSession(session);
    } else {
        activateTab('search');
        resumeSearch(session);
        collapseSearch(session.params || {});
    }
}

function installSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const target = document.body;

    target.addEventListener('touchstart', event => {
        if (event.touches.length !== 1) return;
        const tag = event.target?.tagName?.toLowerCase();
        if (['input', 'button', 'textarea', 'select'].includes(tag)) return;
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        startTime = Date.now();
    }, { passive: true });

    target.addEventListener('touchend', event => {
        if (!startTime) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        const elapsed = Date.now() - startTime;
        startTime = 0;
        if (elapsed > 600) return;
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            dx > 0 ? prevRecord() : nextRecord();
        } else if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) {
            nextTrack();
        }
    }, { passive: true });
}

function installTokenPromptIfNeeded() {
    if (getDiscogsToken()) return;
    updateStatus('No Discogs token saved. Requests may be rate-limited. Press T while focused on the page to add one.');
    document.addEventListener('keydown', event => {
        if (event.key !== 'T' || event.target?.tagName?.toLowerCase() === 'input') return;
        const token = window.prompt('Paste your Discogs token. It will be stored locally in this browser only.');
        if (token) {
            setDiscogsToken(token);
            updateStatus('Discogs token saved locally.');
        }
    });
}

function updateStatus(message, isError = false) {
    const status = document.getElementById('statusLine');
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('error', Boolean(isError));
}

function copyToClipboard(value, successMessage) {
    if (!value || value === '----') return;
    navigator.clipboard.writeText(value).then(() => updateStatus(successMessage || 'Copied.'));
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[ch]));
}

export { createYouTubePlayer };
