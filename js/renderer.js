import { state } from './state.js';
import { applyLoanwordStyling } from './utils.js';
import { saveProgress } from './scorm.js';
import { loadSlideMedia, syncMediaControlUI } from './media.js';
import { updateProgress, UI_ENGINE } from './ui.js';
import { showFeedback } from './quiz.js';
import { launchTour, endTour } from './tour.js';

export function renderSlide(index) {
    if (!state.allSlides[index]) return;
    gsap.killTweensOf('#slide-content *');

    const slide = state.allSlides[index];
    const contentArea = document.getElementById('slide-content');
    const stage = document.getElementById('stage');
    const headerBtns = document.querySelectorAll('#top-bar .header-right .icon-btn');

    stage.classList.remove('bg-splash', 'bg-intro');
    if (slide.type === 'splash') {
        stage.classList.add('bg-splash');
        document.getElementById('bottom-bar').style.display = 'none';
        headerBtns.forEach(btn => { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; });
    } else {
        stage.classList.add('bg-intro');
        document.getElementById('bottom-bar').style.display = 'flex';
        headerBtns.forEach(btn => { btn.style.opacity = '1'; btn.style.pointerEvents = 'auto'; });
    }

    gsap.to(contentArea, {
        opacity: 0, y: -10, duration: 0.2,
        onComplete: () => {
            contentArea.innerHTML = '';
            const container = document.createElement('div');
            container.className = 'slide-inner';

            if (slide.type === 'splash') {
                const isReturning = state.currentSlideIndex > 0;
                const btnText = isReturning ? 'START MODULE' : 'START MODULE';
                const targetIndex = isReturning ? state.currentSlideIndex : 1;
                // S01 screen or intro screen  
                container.innerHTML = `
                  
                <div class="glass-card splash-glass" style="text-align: center;">
                        <div class="card-body-scroll" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding-top: 60px;">
                            <img src="assets/images/logo-placeholder.png" alt="Logo" class="splash-logo" onerror="this.style.display='none'">
                            <h2 class="section-title" style="font-size: 42px; margin-bottom: 20px; border: none;">${slide.title}</h2>
                            <p class="body-text" style="margin-bottom: 40px; font-size: 20px; color: var(--text-grey);">Welcome to the Productivity Suite. Before we dive in, let's look at your toolkit.</p>
                            <button class="nav-btn primary" onclick="startCourse(${targetIndex})" style="padding: 20px 60px; font-size: 20px; border-radius: 16px;">
                                ${btnText} <i data-lucide="${isReturning ? 'play-circle' : 'arrow-right'}"></i>
                            </button>
                        </div>
                    </div>`;
            } else if (slide.type === 'content') {
                state.visitedScreens.add(slide.screen_id);
                saveProgress(index);
                UI_ENGINE.render(slide, container);
            } else if (slide.type === 'breaker') {
                container.innerHTML = `
                    <div class="assessment-card breaker-layout">
                        <p class="format-tag">ASSESSMENT</p>
                        <h2 class="section-title">${slide.title}</h2>
                        <div class="breaker-info-box">
                            <p class="body-text" style="font-weight: 600;">Instructions:</p>
                            <p class="body-text" style="line-height: 1.6; margin-bottom: 24px;">${slide.instructions}</p>
                            <div style="display: flex; gap: 40px; justify-content:center;">
                                <div>
                                    <p style="font-weight: 700; color: var(--text-grey); text-transform: uppercase; font-size: var(--fs-breaker-label);">Total Questions</p>
                                    <p style="font-weight: 800; color: var(--dark-navy); font-size: var(--fs-breaker-val);">${slide.totalQ}</p>
                                </div>
                                <div style="width: 1px; background: #ddd;"></div>
                                <div>
                                    <p style="font-weight: 700; color: var(--text-grey); text-transform: uppercase; font-size: var(--fs-breaker-label);">Passing Score</p>
                                    <p style="font-weight: 800; color: var(--success-green); font-size: var(--fs-breaker-val);">${slide.passing}</p>
                                </div>
                            </div>
                        </div>
                        <button class="nav-btn primary" onclick="nextSlide()" style="margin: 20px auto 0; padding: 24px 60px; font-size: 18px; border-radius: 16px;">START ASSESSMENT</button>
                    </div>`;
            } else if (slide.type === 'quiz') {
                const answered = state.userResponses[slide.id] !== undefined;
                const userChoice = state.userResponses[slide.id];
                const optionsHTML = slide.options.map(opt => {
                    const char = opt.charAt(0);
                    let btnClass = 'quiz-opt';
                    if (answered) {
                        if (char === slide.answer) btnClass += ' correct-opt';
                        else if (char === userChoice) btnClass += ' wrong-opt';
                        btnClass += ' disabled';
                    }
                    return `<button class="${btnClass}" onclick="checkAnswer('${char}')" ${answered ? 'disabled' : ''}>${opt}</button>`;
                }).join('');

                container.innerHTML = `
                    <div class="quiz-layout">
                        <p class="format-tag">ASSESSMENT</p>
                        <h2 class="quiz-q">Question ${slide.id}: ${slide.question}</h2>
                        <div class="quiz-grid">${optionsHTML}</div>
                        <div id="feedback" class="feedback-area"></div>
                    </div>`;
                if (answered) {
                    setTimeout(() => showFeedback(userChoice === slide.answer, slide.answer), 100);
                    document.getElementById('next-btn').disabled = false;
                    document.getElementById('next-btn').style.opacity = '1';
                }
            } else if (slide.type === 'results') {
                const scoreData = typeof window.__calculateScore === 'function' ? window.__calculateScore() : { score: 0, total: 0, percentage: 0 };
                const isPassed = scoreData.percentage >= 80;

                container.innerHTML = `
                    <div class="assessment-card results-layout">
                        <p class="format-tag">ASSESSMENT COMPLETE</p>
                        <h2 class="section-title">Your Results</h2>
                        <div class="score-circle" style="background: ${isPassed ? 'var(--success-green)' : 'var(--error-red)'};">
                            <span style="font-size: 4.5rem; font-weight: 800; color: white;">${scoreData.percentage}%</span>
                        </div>
                        <p class="body-text" style="font-size: 28px; margin-bottom: 10px;">Score: <strong>${scoreData.score} / ${scoreData.total}</strong> correct</p>
                        <div style="margin: 15px 0; padding: 20px; border-radius: 12px; background: ${isPassed ? 'var(--success-bg)' : 'var(--error-bg)'}; border: 1px solid ${isPassed ? 'var(--success-green)' : 'var(--error-red)'};">
                            <p class="body-text" style="font-size: 18px; color: ${isPassed ? 'var(--success-green)' : 'var(--error-red)'}; font-weight: 700;">
                                <i data-lucide="${isPassed ? 'check-circle' : 'alert-circle'}" style="vertical-align: middle; margin-right: 8px; width:22px;"></i>
                                ${isPassed ? "CONGRATULATIONS! You have passed. Click 'Exit Module' to finish." : "SORRY. You did not reach the passing score. Click 'Try Again' to review the assessment."}
                            </p>
                        </div>
                        <button class="nav-btn ${isPassed ? 'secondary' : 'retry-highlight'}" onclick="retryQuiz()" style="align-self: center; margin-top: 20px; padding: 15px 40px; font-size: 16px;">
                            <i data-lucide="rotate-ccw"></i> TRY AGAIN
                        </button>
                    </div>`;
            }

            contentArea.appendChild(container);
            gsap.set(container, { opacity: 0, y: 30 });
            gsap.to(container, { opacity: 1, y: 0, duration: 0.5 });
            gsap.to(contentArea, {
                opacity: 1, y: 0, duration: 0.2,
                onComplete: () => {
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                    syncMediaControlUI();
                    if (slide.screen_id === 1 && !state.tourCompleted) {
                        launchTour();
                    } else {
                        endTour(false);
                    }
                },
            });
            updateProgress(index);
            loadSlideMedia(slide);
        }
    });
}