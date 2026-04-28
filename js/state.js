export const state = {
    currentSlideIndex: 0,
    rawData: null,
    allSlides: [],
    visitedScreens: new Set(),
    visitedTopics: new Set(),
    userResponses: {},
    isCCEnabled: true,
    currentCCData: [],
    isAudioMuted: false,
    videoComplete: false,
    isLargeText: localStorage.getItem('course_large_text') === 'true',
    scorm: null,
};

export const glossaryData = {
    'scorm': 'Shareable Content Object Reference Model, a set of technical standards for e-learning.',
    'accessibility': 'The design of products, devices, services, or environments for people who experience disabilities.'
};