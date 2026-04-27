import { state } from './state.js';
import { applyLoanwordStyling } from './utils.js';

export const UI_ENGINE = {
    render(slide, container) {
        try {
            if (slide.format === 'Interactive-Hub') return this.renderHub(slide, container);
            if (slide.format === 'Split-Detail') return this.renderSplitDetail(slide, container);
            return this.renderStandard(slide, container);
        } catch (err) {
            console.error('UI_ENGINE Error:', err);
            container.innerHTML = `<p style="color:red">Render Error</p>`;
        }
    },

    renderStandard(slide, container) {
        const contentHtml = Array.isArray(slide.content)
            ? slide.content.map(p => `<p class="body-text">${applyLoanwordStyling(p)}</p>`).join('<br>')
            : `<p class="body-text">${applyLoanwordStyling(slide.content)}</p>`;
        container.innerHTML = `
            <div class="glass-card">
                <div class="card-header"><h2 class="section-title">${applyLoanwordStyling(slide.title)}</h2></div>
                <div class="card-body-scroll">${contentHtml}</div>
            </div>`;
    },

    renderHub(slide, container) {
        const topicsHTML = slide.topics.map((topic, index) => {
            const compId = index + 1;
            const isCompleted = state.visitedTopics.has(compId);
            return `
                <div class="hub-node ${isCompleted ? 'completed' : ''}" onclick="window.jumpToTopic(${compId})" style="margin: 10px; padding: 20px; background: ${isCompleted ? 'var(--success-bg)' : '#fff'}; border: 2px solid var(--primary-teal); border-radius: 12px; cursor: pointer; min-width: 200px;">
                    <h4 style="color: var(--dark-navy);">${topic}</h4>
                    <span style="font-size: 14px; font-weight: bold; color: ${isCompleted ? 'var(--success-green)' : 'var(--text-grey)'};">${isCompleted ? 'Completed' : 'Pending'}</span>
                </div>`;
        }).join('');

        container.innerHTML = `
            <div class="glass-card" style="text-align: center;">
                <div class="card-header"><h2 class="section-title">${slide.title}</h2></div>
                <div class="card-body-scroll">
                    <p class="body-text">${slide.content}</p>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 30px;">
                        ${topicsHTML}
                    </div>
                </div>
            </div>`;
    },

    renderSplitDetail(slide, container) {
        let subItems = slide.sub_topics ? slide.sub_topics.map(item => `
            <div class="sub-comp-card">
                <div class="sub-comp-icon"><i data-lucide="check"></i></div><span>${item}</span>
            </div>`).join('') : '';

        container.innerHTML = `
            <div class="glass-card">
                <div class="card-header"><h2 class="section-title">${slide.title}</h2></div>
                <div class="card-body-scroll split-layout">
                    <div class="split-left"><p class="body-text">${slide.description}</p></div>
                    <div class="split-right"><div class="sub-comp-grid">${subItems}</div></div>
                </div>
            </div>`;
    }
};

export function updateProgress(index) {
    if (state.allSlides.length === 0) return;
    const maxIndex = state.allSlides.length - 1;
    document.getElementById('progress-text').innerText = `SCREEN ${index} / ${maxIndex}`;
    gsap.to('#progress-bar', { width: `${(index / maxIndex) * 100}%`, duration: 0.5 });

    const nextBtn = document.getElementById('next-btn');
    const slide = state.allSlides[index];

    // Dynamic menu population
    const navContainer = document.getElementById('dynamic-nav-container');
    if (navContainer && navContainer.children.length === 0) {
        state.allSlides.forEach((s, i) => {
            if (s.type !== 'splash' && s.format !== 'Split-Detail') {
                navContainer.innerHTML += `
                <div class="menu-item" onclick="jumpToSlide(${i})">
                    <span class="menu-num">0${i}</span>
                    <span class="menu-label">${s.title}</span>
                </div>`;
            }
        });
    }

    if (slide.format === 'Interactive-Hub' && state.visitedTopics.size < 6) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = '0.3';
    } else if (slide.type === 'results') {
        const scoreData = typeof window.__calculateScore === 'function' ? window.__calculateScore() : { percentage: 0 };
        if (scoreData.percentage >= 80) {
            nextBtn.innerHTML = `EXIT <i data-lucide="log-out"></i>`;
            nextBtn.className = 'nav-btn exit-btn';
            nextBtn.onclick = () => window.exitModule();
            nextBtn.disabled = false;
            nextBtn.style.opacity = '1';
        } else {
            nextBtn.innerHTML = `EXIT <i data-lucide="lock"></i>`;
            nextBtn.className = 'nav-btn exit-btn locked-state';
            nextBtn.onclick = null;
            nextBtn.disabled = true;
        }
    } else {
        nextBtn.innerHTML = `NEXT <i data-lucide="chevron-right"></i>`;
        nextBtn.className = 'nav-btn primary';
        nextBtn.onclick = () => window.nextSlide();
        nextBtn.disabled = index === maxIndex;
        nextBtn.style.opacity = index === maxIndex ? '0.3' : '1';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// THIS WAS MISSING
export function applyTextScale() {
    const stage = document.getElementById('stage');
    if (state.isLargeText) stage.classList.add('large-text');
    else stage.classList.remove('large-text');
}

export function toggleTextScale() {
    state.isLargeText = !state.isLargeText;
    localStorage.setItem('course_large_text', state.isLargeText);
    applyTextScale();
}

export function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-content"><p>${message}</p></div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}