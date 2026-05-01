import { state } from './state.js';
import { renderSlide } from './renderer.js';

export function resizePlayer() {
    const stage = document.querySelector('#stage');
    if (!stage) return;
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

// THIS WAS MISSING
export function startCourse(targetIndex) {
    document.getElementById('bottom-bar').style.display = 'flex';
    state.currentSlideIndex = targetIndex;
    renderSlide(state.currentSlideIndex);
}

export function nextSlide() {
    const slide = state.allSlides[state.currentSlideIndex];

    // Removed hub-and-spoke logic to allow linear progression

    // Removed special jump for screen_id: 4 to allow normal progression to screen_id: 5

    if (state.currentSlideIndex >= state.allSlides.length - 1) return;
    state.currentSlideIndex++;
    renderSlide(state.currentSlideIndex);
}

export function prevSlide() {
    if (state.currentSlideIndex <= 0) return;
    state.currentSlideIndex--;
    renderSlide(state.currentSlideIndex);
}

export function jumpToSlide(index) {
    if (index >= 0 && index < state.allSlides.length) {
        state.currentSlideIndex = index;
        renderSlide(index);
        const menu = document.getElementById('sidebar-menu');
        if (menu && menu.classList.contains('open')) toggleMenu();
    }
}

export function goToHome() {
    renderSlide(0);
}

export function toggleMenu() {
    document.getElementById('sidebar-menu').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
}

// THIS WAS MISSING
export function exitModule() {
    if (typeof window.showToast === 'function') window.showToast('Progress saved. You may close this tab.', 'success');
}