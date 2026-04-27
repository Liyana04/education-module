import { glossaryData } from './state.js';

export function applyLoanwordStyling(text) {
    if (typeof text !== 'string') return text;
    let processedText = text;
    Object.keys(glossaryData).forEach(term => {
        const regex = new RegExp(`\\b(${term.trim()})\\b`, 'gi');
        processedText = processedText.replace(regex, `<span class="loanword" onclick="openGlossary('$1')">$1</span>`);
    });
    return processedText;
}

export function openGlossary(term) {
    const modal = document.getElementById('glossary-modal');
    const title = document.getElementById('glossary-title');
    const desc = document.getElementById('glossary-desc');
    if (!modal || !title || !desc) return;

    const key = term.toLowerCase();
    title.innerText = term;
    desc.innerText = glossaryData[key] || 'Definition not found.';
    modal.classList.add('open');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

export function closeGlossary() {
    const modal = document.getElementById('glossary-modal');
    if (modal) modal.classList.remove('open');
}

export function preloadAssets(manifest) {
    if (!manifest) return;
    if (manifest.images) {
        manifest.images.forEach(src => {
            if (!src) return;
            const img = new Image();
            img.src = src;
        });
    }
}