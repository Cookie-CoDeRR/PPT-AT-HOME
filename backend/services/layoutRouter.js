const fs = require('fs');
const path = require('path');

let dataset = null;
const DATASET_PATH = '/Users/cookiecoderr/Coding/PPTX_Data/dataset_layout_bank.json';

// Initialize dataset
try {
    if (fs.existsSync(DATASET_PATH)) {
        const rawData = fs.readFileSync(DATASET_PATH, 'utf-8');
        dataset = JSON.parse(rawData);
        console.log(`[LayoutRouter] Successfully loaded dataset_layout_bank.json (${dataset.decks?.length || 0} decks)`);
    } else {
        console.warn(`[LayoutRouter] Warning: Dataset not found at ${DATASET_PATH}`);
    }
} catch (error) {
    console.error('[LayoutRouter] Error loading dataset:', error);
}

const INTENT_MAP = {
    'data_heavy': ['data', 'metrics', 'chart', 'analytics', 'statistics', 'dashboard', 'numbers', 'revenue', 'growth'],
    'comparative': ['compare', 'versus', 'vs', 'difference', 'pros and cons', 'alternative', 'options'],
    'roadmap': ['roadmap', 'timeline', 'plan', 'schedule', 'phase', 'steps', 'milestones', 'future'],
    'standard': [] // Fallback
};

const ALL_LAYOUTS = [
    'standard_text', 'data_table', 'chart_pie', 'chart_bar', 
    'comparison', 'timeline', 'stat_callout', 'grid_list', 
    'bento_grid', 'metric_dashboard'
];

function classifyIntent(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
        if (intent === 'standard') continue;
        if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
            return intent;
        }
    }
    return 'standard';
}

function findExactMatch(slideCount, intent) {
    if (!dataset || !dataset.decks) return null;
    
    // Filter by slide count
    let validDecks = dataset.decks.filter(d => d.slide_count === slideCount);
    
    if (validDecks.length === 0) {
        // Find nearest slide count if exact match not found
        const nearestDecks = dataset.decks.map(d => ({
            ...d,
            diff: Math.abs(d.slide_count - slideCount)
        })).sort((a, b) => a.diff - b.diff);
        
        if (nearestDecks.length > 0) {
            const minDiff = nearestDecks[0].diff;
            validDecks = nearestDecks.filter(d => d.diff === minDiff);
        } else {
            return null;
        }
    }
    
    // Attempt to match intent by checking sequence contents
    let intentDecks = [];
    if (intent === 'data_heavy') {
        intentDecks = validDecks.filter(d => d.sequence.some(l => l.includes('data') || l.includes('chart') || l.includes('metric')));
    } else if (intent === 'comparative') {
        intentDecks = validDecks.filter(d => d.sequence.includes('comparison'));
    } else if (intent === 'roadmap') {
        intentDecks = validDecks.filter(d => d.sequence.includes('timeline'));
    }
    
    if (intentDecks.length > 0) {
        validDecks = intentDecks;
    }
    
    if (validDecks.length > 0) {
        // Randomly select one of the valid decks
        const selected = validDecks[Math.floor(Math.random() * validDecks.length)];
        let seq = [...selected.sequence];
        
        // Adjust length to match exact slide count if we used nearest
        if (seq.length > slideCount) {
            seq = seq.slice(0, slideCount);
            // Ensure last slide is a summary if we cut it
            if (slideCount > 1) seq[slideCount - 1] = 'summary_takeaways';
        } else while (seq.length < slideCount) {
            seq.splice(seq.length - 1, 0, 'standard_text'); // Insert before the end
        }
        
        return seq;
    }
    
    return null;
}

function getFallbackSequence(slideCount) {
    if (slideCount <= 1) return ['title_hero'];
    const seq = ['title_hero'];
    for (let i = 1; i < slideCount - 1; i++) {
        seq.push(ALL_LAYOUTS[i % ALL_LAYOUTS.length]);
    }
    seq.push('summary_takeaways');
    return seq;
}

function getBlueprint(userPrompt, requestedSlides, temperature) {
    const intent = classifyIntent(userPrompt || "");
    const count = parseInt(requestedSlides) || 5;
    const temp = parseFloat(temperature) || 0.6;
    
    if (temp <= 0.3) {
        // Strict: Exact sequence match
        let seq = findExactMatch(count, intent);
        return seq || getFallbackSequence(count);
    } 
    else if (temp <= 0.7) {
        // Dynamic: Swap 1 or 2 middle slides
        let seq = findExactMatch(count, intent) || getFallbackSequence(count);
        
        // Don't modify if too short
        if (seq.length > 3) {
            const numSwaps = Math.random() > 0.5 ? 2 : 1;
            for (let i = 0; i < numSwaps; i++) {
                // Select a random middle index (not first, not last)
                const swapIdx = Math.floor(Math.random() * (seq.length - 2)) + 1;
                
                // Get a random layout that is different from current
                let newLayout;
                do {
                    newLayout = ALL_LAYOUTS[Math.floor(Math.random() * ALL_LAYOUTS.length)];
                } while (newLayout === seq[swapIdx]);
                
                seq[swapIdx] = newLayout;
            }
        }
        return seq;
    } 
    else {
        // High Entropy: Frankenstein sequence
        if (count <= 1) return ['title_hero'];
        
        const seq = ['title_hero'];
        let prevLayout = 'title_hero';
        
        for (let i = 1; i < count - 1; i++) {
            let nextLayout;
            do {
                nextLayout = ALL_LAYOUTS[Math.floor(Math.random() * ALL_LAYOUTS.length)];
            } while (nextLayout === prevLayout);
            
            seq.push(nextLayout);
            prevLayout = nextLayout;
        }
        
        seq.push('summary_takeaways');
        return seq;
    }
}

module.exports = {
    getBlueprint,
    classifyIntent
};
