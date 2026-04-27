import { state } from './state.js';

export function initSCORM() {
    if (typeof pipwerks !== 'undefined') {
        state.scorm = pipwerks.SCORM;
        state.scorm.version = '1.2';
        if (state.scorm.init()) {
            const status = state.scorm.get('cmi.core.lesson_status');
            if (status === 'unknown' || status === 'not attempted') {
                state.scorm.set('cmi.core.lesson_status', 'incomplete');
            }
        }
    }
    loadProgress();
}

export function reportToLMS() {
    const scoreData = typeof window.__calculateScore === 'function' ? window.__calculateScore() : { score: 0, total: 0, percentage: 0 };
    if (state.scorm && state.scorm.connection.isActive) {
        state.scorm.set('cmi.core.score.raw', scoreData.score);
        state.scorm.set('cmi.core.score.min', 0);
        state.scorm.set('cmi.core.score.max', scoreData.total);
        if (scoreData.percentage >= 80) state.scorm.set('cmi.core.lesson_status', 'passed');
        state.scorm.save();
    }
    saveProgress();
}

export function saveProgress(forcedIndex = null) {
    const data = JSON.stringify({
        lastIndex: forcedIndex !== null ? forcedIndex : state.currentSlideIndex,
        visitedScreens: Array.from(state.visitedScreens),
        visitedTopics: Array.from(state.visitedTopics),
        userResponses: state.userResponses
    });
    localStorage.setItem('course_progress_data', data);
    if (state.scorm && state.scorm.connection.isActive) {
        state.scorm.set('cmi.suspend_data', data);
        state.scorm.save();
    }
}

export function loadProgress() {
    let rawData = (state.scorm && state.scorm.connection.isActive) ? state.scorm.get('cmi.suspend_data') : null;
    if (!rawData || rawData === '' || rawData === 'null') rawData = localStorage.getItem('course_progress_data');

    if (rawData) {
        try {
            const data = JSON.parse(rawData);
            if (data.lastIndex) state.currentSlideIndex = data.lastIndex;
            if (data.visitedScreens) state.visitedScreens = new Set(data.visitedScreens);
            if (data.visitedTopics) state.visitedTopics = new Set(data.visitedTopics);
            if (data.userResponses) state.userResponses = data.userResponses;
        } catch (e) { console.warn('Malformed progress data.'); }
    }
}