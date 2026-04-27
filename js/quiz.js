import { state } from './state.js';
import { reportToLMS, saveProgress } from './scorm.js';
import { playSFX } from './media.js';

export function checkAnswer(selected) {
    const slide = state.allSlides[state.currentSlideIndex];
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
    if (isCorrect) {
        feedback.innerHTML = `<i data-lucide="check-circle" style="margin-right:12px"></i><span>Correct! Well done.</span>`;
        feedback.className = 'feedback-area correct';
    } else {
        feedback.innerHTML = `<i data-lucide="alert-circle" style="margin-right:12px"></i><span>Incorrect. The correct answer is ${correctAnswer}.</span>`;
        feedback.className = 'feedback-area wrong';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function calculateScore() {
    const quizQuestions = state.allSlides.filter(s => s.type === 'quiz');
    let score = 0;
    quizQuestions.forEach(q => { if (state.userResponses[q.id] === q.answer) score++; });
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