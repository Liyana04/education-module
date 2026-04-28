import { state } from './state.js';

function getVideoEl() {
    return document.getElementById('slide-video');
}

function getAudioEl() {
    return document.getElementById('slide-audio');
}

function getActiveMediaEl() {
    const videoEl = getVideoEl();
    if (videoEl && videoEl.getAttribute('src')) return videoEl;
    return getAudioEl();
}

function getCCDisplayEl() {
    const videoCC = document.getElementById('video-cc-overlay');
    if (videoCC) return videoCC;
    return document.getElementById('cc-display');
}

function updateCCText(currentTime) {
    if (!state.isCCEnabled || state.currentCCData.length === 0) return;
    const ccDisplay = getCCDisplayEl();
    if (!ccDisplay) return;

    let activeText = '';
    for (let i = 0; i < state.currentCCData.length; i++) {
        if (currentTime >= state.currentCCData[i].time) activeText = state.currentCCData[i].text;
        else break;
    }
    ccDisplay.textContent = activeText;
}

function evaluateVideoCompletion() {
    const slide = state.allSlides[state.currentSlideIndex];
    const videoEl = getVideoEl();
    if (!slide || slide.screen_id !== 2 || !videoEl || !videoEl.duration) return;

    // Unlock "Next" only after reaching the last second of the video.
    state.videoComplete = videoEl.currentTime >= Math.max(0, videoEl.duration - 1);
    if (typeof window.__updateProgress === 'function') {
        window.__updateProgress(state.currentSlideIndex);
    }
}

export function initMediaSyncListeners() {
    const audioEl = getAudioEl();
    if (audioEl) {
        audioEl.addEventListener('timeupdate', () => {
            updateCCText(audioEl.currentTime);
            syncMediaControlUI();
        });
        audioEl.addEventListener('ended', () => { updatePlayButtonUI(); syncMediaControlUI(); });
        audioEl.addEventListener('pause', () => { updatePlayButtonUI(); syncMediaControlUI(); });
        audioEl.addEventListener('play', () => { updatePlayButtonUI(); syncMediaControlUI(); });
    }
}

export function loadSlideMedia(slide) {
    const audioEl = getAudioEl();
    const videoEl = getVideoEl();
    const playBtn = document.getElementById('play-pause-btn');
    const controlBtns = document.querySelectorAll('.icon-only-btn');
    if (!audioEl) return;

    state.videoComplete = slide.screen_id !== 2;

    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.removeAttribute('src');
    audioEl.load();

    if (videoEl) {
        videoEl.pause();
        videoEl.currentTime = 0;
        videoEl.removeAttribute('src');
        videoEl.load();
    }

    updatePlayButtonUI();

    if (slide.video && videoEl) {
        videoEl.src = slide.video;
        videoEl.muted = state.isAudioMuted;
        videoEl.onloadedmetadata = () => {
            state.currentCCData = slide.cc_data || [];
            state.videoComplete = false;
            if (typeof window.__updateProgress === 'function') {
                window.__updateProgress(state.currentSlideIndex);
            }
        };
        videoEl.ontimeupdate = () => {
            updateCCText(videoEl.currentTime);
            evaluateVideoCompletion();
            syncMediaControlUI();
        };
        videoEl.onended = () => {
            state.videoComplete = true;
            updatePlayButtonUI();
            syncMediaControlUI();
            if (typeof window.__updateProgress === 'function') {
                window.__updateProgress(state.currentSlideIndex);
            }
        };
        videoEl.onpause = () => { updatePlayButtonUI(); syncMediaControlUI(); };
        videoEl.onplay = () => { updatePlayButtonUI(); syncMediaControlUI(); };
        playBtn.classList.remove('disabled');
        playBtn.disabled = false;
        controlBtns.forEach(b => {
            b.classList.remove('disabled');
            b.disabled = false;
        });
    } else if (slide.audio) {
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
    const mediaEl = getActiveMediaEl();
    if (!mediaEl || !mediaEl.getAttribute('src')) return;
    if (mediaEl.paused) mediaEl.play();
    else mediaEl.pause();
    updatePlayButtonUI();
}

export function updatePlayButtonUI() {
    const mediaEl = getActiveMediaEl();
    const btn = document.getElementById('play-pause-btn');
    if (!btn || !mediaEl) return;
    btn.innerHTML = mediaEl.paused ? `<i data-lucide="play"></i><span>PLAY</span>` : `<i data-lucide="pause"></i><span>PAUSE</span>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function replaySlide() {
    const mediaEl = getActiveMediaEl();
    if (mediaEl && mediaEl.getAttribute('src')) {
        mediaEl.currentTime = 0;
        mediaEl.play();
    }
    updatePlayButtonUI();
}

export function toggleAudio() {
    state.isAudioMuted = !state.isAudioMuted;
    const mediaEl = getActiveMediaEl();
    if (mediaEl) mediaEl.muted = state.isAudioMuted;
    syncMediaControlUI();
}

export function toggleCC() {
    state.isCCEnabled = !state.isCCEnabled;
    syncMediaControlUI();
}

export function syncMediaControlUI() {
    const ccBtn = document.querySelector('button[title="Toggle Captions"]');
    const audioBtn = document.querySelector('button[title="Toggle Audio"]');
    const ccDisplay = getCCDisplayEl();
    const defaultCCDisplay = document.getElementById('cc-display');
    const videoCCDisplay = document.getElementById('video-cc-overlay');
    const progressContainer = document.getElementById('progress-container');
    const mediaEl = getActiveMediaEl();

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
        if (videoCCDisplay) videoCCDisplay.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'block';
    } else {
        if (mediaEl && !mediaEl.paused && state.currentCCData.length > 0) {
            if (ccDisplay) ccDisplay.style.display = 'block';
            if (defaultCCDisplay) defaultCCDisplay.style.display = videoCCDisplay ? 'none' : 'block';
            if (progressContainer) progressContainer.style.display = videoCCDisplay ? 'block' : 'none';
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