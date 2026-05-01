import { state } from './state.js';
import { reportToLMS, saveProgress } from './scorm.js';
import { playSFX } from './media.js';

export function checkAnswer(selected) {
    const slide = state.allSlides[state.currentSlideIndex];
    if (!slide) return;
    if (!state.userResponses) state.userResponses = {};
    if (state.userResponses[slide.id] !== undefined) return;
    state.userResponses[slide.id] = selected;

    const isCorrect = (selected === slide.answer);
    const btns = document.querySelectorAll('.quiz-opt');
    btns.forEach(btn => {
        btn.classList.add('disabled');
        btn.disabled = true;
        const char = btn.innerText.charAt(0);
        if (char === slide.answer) btn.classList.add('correct-opt');
        else if (char === selected) btn.classList.add('wrong-opt');
    });

    if (slide.screen_id === 4) {
        state.KC_01_Score = isCorrect ? 1 : 0;
    }

    showFeedback(isCorrect, slide.answer);

    // Optional SFX if assets exist. Safe to fail if files missing.
    if (isCorrect) playSFX('assets/audios/correct.mp3');
    else playSFX('assets/audios/wrong.mp3');

    if (typeof window.__updateProgress === 'function') window.__updateProgress(state.currentSlideIndex);
    reportToLMS();
}

export function showFeedback(isCorrect, correctAnswer) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;
    feedback.setAttribute('role', 'status');
    feedback.setAttribute('aria-live', 'polite');
    feedback.setAttribute('aria-atomic', 'true');

    if (isCorrect) {
        feedback.innerHTML = `<i data-lucide="check-circle" style="margin-right:12px"></i><span>Correct! Well done.</span>`;
        feedback.className = 'feedback-area correct';
    } else {
        feedback.innerHTML = `<i data-lucide="alert-circle" style="margin-right:12px"></i><span>Incorrect. The correct answer is ${correctAnswer}.</span><button type="button" class="nav-btn secondary" onclick="retryQuizItem()" style="margin-left:auto;">Retry</button>`;
        feedback.className = 'feedback-area wrong';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function retryQuizItem() {
    const slide = state.allSlides[state.currentSlideIndex];
    if (!slide || slide.type !== 'quiz') return;
    delete state.userResponses[slide.id];
    if (slide.screen_id === 4) state.KC_01_Score = 0;
    if (typeof window.__renderSlide === 'function') window.__renderSlide(state.currentSlideIndex);
}

export function calculateScore() {
    const quizQuestions = state.allSlides.filter(s => s.type === 'quiz');
    let score = 0;
    const responses = state.userResponses || {};
    quizQuestions.forEach(q => { if (responses[q.id] === q.answer) score++; });
    return {
        score,
        total: quizQuestions.length,
        percentage: quizQuestions.length ? Math.round((score / quizQuestions.length) * 100) : 0,
    };
}

export function retryQuiz() {
    state.userResponses = {};
    state.currentSlideIndex = state.allSlides.findIndex(s => s.type === 'breaker');
    saveProgress();
    if (typeof window.__renderSlide === 'function') window.__renderSlide(state.currentSlideIndex);
}