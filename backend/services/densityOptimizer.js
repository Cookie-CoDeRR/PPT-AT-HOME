/**
 * Density Optimizer for PptxGenJS
 * Ported from density_optimizer.py but with relaxed limits.
 */

// Relaxed limits so we don't aggressively chop AI output
const MAX_TITLE_WORDS = 20; // Increased from 10
const MAX_BULLET_WORDS = 30; // Increased from 15
const MAX_BULLETS_PER_SLIDE = 6; // Increased from 4

function truncateText(text, maxWords) {
    if (!text || typeof text !== 'string') return text;
    const words = text.split(' ');
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ') + '...';
}

function truncateSlide(slide) {
    const s = { ...slide };
    if (s.title) s.title = truncateText(s.title, MAX_TITLE_WORDS);
    if (s.subtitle) s.subtitle = truncateText(s.subtitle, MAX_TITLE_WORDS);
    if (s.bullets && Array.isArray(s.bullets)) {
        s.bullets = s.bullets.map(b => truncateText(b, MAX_BULLET_WORDS));
    }
    // Also truncate cards/columns
    if (s.column_left?.bullets) {
        s.column_left.bullets = s.column_left.bullets.map(b => truncateText(b, MAX_BULLET_WORDS));
    }
    if (s.column_right?.bullets) {
        s.column_right.bullets = s.column_right.bullets.map(b => truncateText(b, MAX_BULLET_WORDS));
    }
    if (s.cards && Array.isArray(s.cards)) {
        s.cards = s.cards.map(c => ({
            ...c,
            card_title: truncateText(c.card_title, MAX_TITLE_WORDS),
            card_text: truncateText(c.card_text, MAX_BULLET_WORDS)
        }));
    }
    if (s.items && Array.isArray(s.items)) {
        s.items = s.items.map(c => ({
            ...c,
            item_title: truncateText(c.item_title, MAX_TITLE_WORDS),
            item_text: truncateText(c.item_text, MAX_BULLET_WORDS)
        }));
    }
    return s;
}

/**
 * Optimizes the presentation data by truncating long text.
 * No longer splits slides into multiple slides to preserve intended layout flow.
 */
function optimizePresentation(slides) {
    if (!Array.isArray(slides)) return [];
    const optimized = [];
    
    for (const slide of slides) {
        const s = truncateSlide(slide);
        
        // We will just cap bullets to MAX_BULLETS_PER_SLIDE, but not split
        if (s.bullets && Array.isArray(s.bullets)) {
            if (s.bullets.length > MAX_BULLETS_PER_SLIDE) {
                s.bullets = s.bullets.slice(0, MAX_BULLETS_PER_SLIDE);
            }
        }
        
        optimized.push(s);
    }
    return optimized;
}

module.exports = {
    optimizePresentation
};
