import { state } from './state.js';
import { initSCORM, reportToLMS } from './scorm.js';
import { renderSlide } from './renderer.js';
import { calculateScore, checkAnswer, showFeedback, retryQuiz } from './quiz.js';
import { loadSlideMedia, togglePlay, updatePlayButtonUI, replaySlide, toggleAudio, toggleCC, syncMediaControlUI, initMediaSyncListeners } from './media.js';
import { UI_ENGINE, updateProgress, applyTextScale, toggleTextScale, showToast, openCardDetail, closeCardDetail } from './ui.js';
import { resizePlayer, startCourse, nextSlide, prevSlide, jumpToSlide, goToHome, toggleMenu, exitModule } from './navigation.js';
import { startTour, endTour, nextTourStep } from './tour.js';
import { openGlossary, closeGlossary, preloadAssets } from './utils.js';

// Attach functions to window for HTML inline access
window.__renderSlide = renderSlide;
window.__calculateScore = calculateScore;
window.__updateProgress = updateProgress;
window.__updatePlayButtonUI = updatePlayButtonUI;

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.jumpToSlide = jumpToSlide;
window.startCourse = startCourse;
window.goToHome = goToHome;
window.toggleMenu = toggleMenu;
window.exitModule = exitModule;
window.togglePlay = togglePlay;
window.replaySlide = replaySlide;
window.toggleAudio = toggleAudio;
window.toggleCC = toggleCC;
window.toggleTextScale = toggleTextScale;
window.startTour = startTour;
window.endTour = endTour;
window.nextTourStep = nextTourStep;
window.openGlossary = openGlossary;
window.closeGlossary = closeGlossary;
window.showToast = showToast;
window.checkAnswer = checkAnswer;
window.retryQuiz = retryQuiz;
window.openCardDetail = openCardDetail;
window.closeCardDetail = closeCardDetail;

window.jumpToTopic = function (topicId) {
    state.visitedTopics.add(topicId);
    const targetScreenId = 4 + topicId;
    const targetIndex = state.allSlides.findIndex(s => s.screen_id === targetScreenId);
    if (targetIndex !== -1) {
        state.currentSlideIndex = targetIndex;
        renderSlide(targetIndex);
    }
};

async function initPlayer() {
    try {
        const response = await fetch('data.json');
        state.rawData = await response.json();

        const content = state.rawData.content_screens.map(s => ({ ...s, type: 'content' }));
        const questions = state.rawData.assessment.questions.map(q => ({ ...q, type: 'quiz' }));

        const splashScreen = { type: 'splash', title: state.rawData.module_title, format: 'E-LEARNING MODULE' };
        const breakerScreen = {
            type: 'breaker', title: 'Formative Assessment', format: 'Preparation',
            instructions: state.rawData.assessment.instructions, totalQ: questions.length,
            passing: '80%', audio: state.rawData.assessment.audio, cc_data: state.rawData.assessment.cc_data
        };
        const resultsScreen = { type: 'results', title: 'Assessment Results', format: 'Summary' };

        state.allSlides = [splashScreen, ...content, breakerScreen, ...questions, resultsScreen];
        document.getElementById('module-title').innerText = state.rawData.module_title.toUpperCase();

        preloadAssets({ images: ['assets/images/logo-placeholder.png'], audio: [] });
        renderSlide(0);
    } catch (error) {
        console.error('Engine Error:', error);
        document.querySelector('.loading-state').innerHTML = `<p style="color:var(--error-red);">Error loading data.json.</p>`;
    }
}

window.addEventListener('resize', resizePlayer);
window.addEventListener('load', () => {
    resizePlayer();
    initSCORM();
    initPlayer();
    applyTextScale();

    initMediaSyncListeners();
    if (typeof lucide !== 'undefined') lucide.createIcons();
});