import { state } from './state.js';

export function loadSlideMedia(slide) {
    const audioEl = document.getElementById('slide-audio');
    const playBtn = document.getElementById('play-pause-btn');
    const controlBtns = document.querySelectorAll('.icon-only-btn');
    if (!audioEl) return;

    audioEl.pause();
    audioEl.currentTime = 0;
    updatePlayButtonUI();

    if (slide.audio) {
        audioEl.src = slide.audio;
        audioEl.onloadedmetadata = () => { state.currentCCData = slide.cc_data || []; };
        playBtn.classList.remove('disabled');
        playBtn.disabled = false;
        controlBtns.forEach(b => {
            b.classList.remove('disabled');
            b.disabled = false;
        });
    } else {
        audioEl.removeAttribute('src');
        audioEl.load();
        state.currentCCData = [];
        playBtn.classList.add('disabled');
        playBtn.disabled = true;
        controlBtns.forEach(b => { b.classList.add('disabled'); b.disabled = true; });
    }
}

export function togglePlay() {
    const audioEl = document.getElementById('slide-audio');
    if (!audioEl || !audioEl.src) return;
    if (audioEl.paused) audioEl.play();
    else audioEl.pause();
    updatePlayButtonUI();
}

export function updatePlayButtonUI() {
    const audioEl = document.getElementById('slide-audio');
    const btn = document.getElementById('play-pause-btn');
    if (!btn || !audioEl) return;
    btn.innerHTML = audioEl.paused ? `<i data-lucide="play"></i><span>PLAY</span>` : `<i data-lucide="pause"></i><span>PAUSE</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function replaySlide() {
    const audioEl = document.getElementById('slide-audio');
    if (audioEl && audioEl.src) {
        audioEl.currentTime = 0;
        audioEl.play();
    }
    updatePlayButtonUI();
}

export function toggleAudio() {
    state.isAudioMuted = !state.isAudioMuted;
    const audioEl = document.getElementById('slide-audio');
    if (audioEl) audioEl.muted = state.isAudioMuted;
    syncMediaControlUI();
}

export function toggleCC() {
    state.isCCEnabled = !state.isCCEnabled;
    syncMediaControlUI();
}

export function syncMediaControlUI() {
    const ccBtn = document.querySelector('button[title="Toggle Captions"]');
    const audioBtn = document.querySelector('button[title="Toggle Audio"]');
    const ccDisplay = document.getElementById('cc-display');
    const progressContainer = document.getElementById('progress-container');
    const audioEl = document.getElementById('slide-audio');

    if (ccBtn) {
        if (state.isCCEnabled) ccBtn.classList.add('active-cc');
        else ccBtn.classList.remove('active-cc');
    }
    if (audioBtn) {
        if (state.isAudioMuted) {
            audioBtn.classList.add('muted-audio');
            audioBtn.innerHTML = `<i data-lucide="volume-x"></i>`;
        } else {
            audioBtn.classList.remove('muted-audio');
            audioBtn.innerHTML = `<i data-lucide="volume-2"></i>`;
        }
    }
    if (!state.isCCEnabled) {
        if (ccDisplay) ccDisplay.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'block';
    } else {
        if (audioEl && !audioEl.paused && state.currentCCData.length > 0) {
            if (ccDisplay) ccDisplay.style.display = 'block';
            if (progressContainer) progressContainer.style.display = 'none';
        } else {
            if (ccDisplay) ccDisplay.style.display = 'none';
            if (progressContainer) progressContainer.style.display = 'block';
        }
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function playSFX(path) {
    if (!path) return;
    const sfx = new Audio(path);
    sfx.muted = state.isAudioMuted;
    sfx.volume = 0.25;
    sfx.play().catch(err => console.error("SFX failed:", err));
}