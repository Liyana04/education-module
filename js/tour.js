import { state } from './state.js';

let currentTourStep = 0;

const tourData = [
    { target: 'button[title="Menu"]', title: 'Sidebar', text: 'Use this menu button to open the course outline and jump between sections.' },
    { target: '#font-scale-btn', title: 'Text Enlargement', text: 'Toggle text size to make content easier to read without changing your progress.' },
    { target: '#progress-container', title: 'Progress Bar', text: 'This bar shows where you are in the module and updates as you advance.' }
];

function toggleGuidedHighlights(enabled) {
    const targets = [
        document.querySelector('button[title="Home"]'),
        document.querySelector('button[title="Menu"]'),
        document.getElementById('font-scale-btn')
    ];
    targets.forEach((el) => {
        if (!el) return;
        if (enabled) el.classList.add('tour-pulse-target');
        else el.classList.remove('tour-pulse-target');
    });
}

export function endTour(completed = false) {
    const tour = document.getElementById('tour-master');
    if (tour) tour.remove();
    if (completed) state.tourCompleted = true;
    toggleGuidedHighlights(false);
    if (typeof window.__updateProgress === 'function') {
        window.__updateProgress(state.currentSlideIndex);
    }
}

export function launchTour() {
    if (document.getElementById('tour-master')) return;
    if (state.currentSlideIndex < 0 || !state.allSlides[state.currentSlideIndex]) return;
    const slide = state.allSlides[state.currentSlideIndex];
    if (slide.screen_id !== 1) return;
    currentTourStep = 0;
    toggleGuidedHighlights(true);
    const tourWrap = document.createElement('div');
    tourWrap.id = 'tour-master';
    tourWrap.className = 'tour-overlay-master';
    tourWrap.innerHTML = `
        <div class="tour-spotlight" id="tour-spot"></div>
        <div class="tour-tooltip" id="tour-tip">
            <h4 id="tip-title"></h4>
            <p id="tip-text"></p>
            <div style="margin-top:25px; display:flex; justify-content:space-between; align-items:center;">
                <span id="step-count" style="font-size:12px; color:#999; font-weight:700;"></span>
                <div style="display:flex; gap:10px;">
                    <button class="nav-btn secondary" onclick="endTour(false)" style="padding:10px 15px; font-size:12px;">CLOSE</button>
                    <button class="nav-btn primary" id="tour-next-btn" onclick="nextTourStep()" style="padding:10px 20px; font-size:12px;">NEXT</button>
                </div>
            </div>
        </div>`;
    document.getElementById('stage').appendChild(tourWrap);
    updateTourUI();
}

export function startTour() {
    launchTour();
}

export function updateTourUI() {
    const step = tourData[currentTourStep];
    const targetEl = document.querySelector(step.target);
    const spot = document.getElementById('tour-spot');
    const tip = document.getElementById('tour-tip');
    const nextBtn = document.getElementById('tour-next-btn');

    if (!targetEl) { endTour(false); return; }

    const rect = targetEl.getBoundingClientRect();
    const stageRect = document.getElementById('stage').getBoundingClientRect();
    const scale = stageRect.width / 1920;

    let leftPos = (rect.left - stageRect.left) / scale - 10;
    let topPos = (rect.top - stageRect.top) / scale - 10;
    let spotWidth = rect.width / scale + 20;
    let spotHeight = rect.height / scale + 20;

    if (leftPos < 0) { spotWidth += leftPos; leftPos = 0; }
    if (topPos < 0) { spotHeight += topPos; topPos = 0; }
    if (leftPos + spotWidth > 1920) spotWidth = 1920 - leftPos;
    if (topPos + spotHeight > 1080) spotHeight = 1080 - topPos;

    spot.style.left = leftPos + 'px';
    spot.style.top = topPos + 'px';
    spot.style.width = spotWidth + 'px';
    spot.style.height = spotHeight + 'px';

    document.getElementById('tip-title').innerText = step.title;
    document.getElementById('tip-text').innerText = step.text;
    document.getElementById('step-count').innerText = `STEP ${currentTourStep + 1} / ${tourData.length}`;
    nextBtn.innerText = currentTourStep === tourData.length - 1 ? 'FINISH' : 'NEXT';

    tip.style.left = tip.style.right = tip.style.top = tip.style.bottom = tip.style.transform = '';
    if (currentTourStep === 0) { tip.style.top = '100px'; tip.style.right = '40px'; }
    else if (currentTourStep === 1) { tip.style.top = '100px'; tip.style.right = '40px'; }
    else if (currentTourStep === 2) { tip.style.bottom = '130px'; tip.style.left = '50%'; tip.style.transform = 'translateX(-50%)'; }
}

export function nextTourStep() {
    currentTourStep++;
    if (currentTourStep < tourData.length) updateTourUI();
    else endTour(true);
}