const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let dataset = null;
const DATASET_PATH = path.join(__dirname, '..', '..', 'dataset_layout_bank.json');
const ALT_DATASET_PATH = '/Users/cookiecoderr/Coding/PPTX_Data/dataset_layout_bank.json';

let recentlyUsedSequences = [];

// Initialize dataset
try {
    const targetPath = fs.existsSync(DATASET_PATH) ? DATASET_PATH : ALT_DATASET_PATH;
    if (fs.existsSync(targetPath)) {
        const rawData = fs.readFileSync(targetPath, 'utf-8');
        dataset = JSON.parse(rawData);
        console.log(`[LayoutRouter] Successfully loaded dataset_layout_bank.json (${dataset.decks?.length || 0} decks) from ${targetPath}`);
    } else {
        console.warn(`[LayoutRouter] Warning: Dataset not found at ${DATASET_PATH} or ${ALT_DATASET_PATH}`);
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
        // Deep Dataset Sampling with Anti-Pattern Lock
        let selectedSequence = null;
        let attempts = 0;
        let selected = null;
        
        while (attempts < 10) {
            // Cryptographic deep sampling
            const randomIndex = crypto.randomInt(0, validDecks.length);
            selected = validDecks[randomIndex];
            
            const seqString = JSON.stringify(selected.sequence);
            
            // Check if recently used (Anti-Pattern Lock)
            if (!recentlyUsedSequences.includes(seqString) || validDecks.length <= recentlyUsedSequences.length) {
                selectedSequence = selected.sequence;
                // Add to recently used (cache size 3)
                recentlyUsedSequences.push(seqString);
                if (recentlyUsedSequences.length > 3) {
                    recentlyUsedSequences.shift();
                }
                break;
            }
            attempts++;
        }
        
        // Fallback if lock is too restrictive
        if (!selectedSequence) {
            selectedSequence = validDecks[crypto.randomInt(0, validDecks.length)].sequence;
        }
        
        let seq = [...selectedSequence];
        
        // Adjust length to match exact slide count if we used nearest
        if (seq.length > slideCount) {
            seq = seq.slice(0, slideCount);
            // Ensure last slide is a summary if we cut it
            if (slideCount > 1) seq[slideCount - 1] = 'summary_takeaways';
        } else while (seq.length < slideCount) {
            seq.splice(seq.length - 1, 0, 'standard_text'); // Insert before the end
        }
        
        console.log(`[LayoutRouter] 🎯 Found layout match in dataset_layout_bank.json:`);
        console.log(`  └─ Deck Source File : ${selected.file_name || 'unknown'}`);
        console.log(`  └─ Original Deck Slides: ${selected.slide_count} (Requested: ${slideCount})`);
        console.log(`  └─ Classified Intent: '${intent}'`);
        console.log(`  └─ Layout Sequence  :`, JSON.stringify(seq));
        
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

function selectBlueprint(requestedSlides, temperature) {
    const intent = "standard"; // Simplified intent for now, or could pass prompt
    const count = parseInt(requestedSlides) || 5;
    const temp = parseFloat(temperature) || 0.6;
    
    console.log(`[LayoutRouter] Generating blueprint (slides=${count}, temp=${temp}, intent='${intent}')`);
    
    let seq;
    if (temp <= 0.3) {
        // Strict: Exact sequence match
        seq = findExactMatch(count, intent);
        if (!seq) {
            console.log(`[LayoutRouter] ⚠️ No dataset match found; using fallback sequence.`);
            seq = getFallbackSequence(count);
        }
        return seq;
    } 
    else if (temp <= 0.7) {
        // Dynamic: Swap 1 or 2 middle slides
        seq = findExactMatch(count, intent);
        if (!seq) {
            console.log(`[LayoutRouter] ⚠️ No dataset match found; using fallback sequence before swaps.`);
            seq = getFallbackSequence(count);
        }
        
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
            console.log(`[LayoutRouter] 🔀 Applied ${numSwaps} dynamic layout swap(s). Final sequence:`, JSON.stringify(seq));
        }
        return seq;
    } 
    else {
        // High Entropy: Frankenstein sequence
        console.log(`[LayoutRouter] 🎲 High entropy mode active. Generating randomized layout sequence.`);
        if (count <= 1) return ['title_hero'];
        
        seq = ['title_hero'];
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
        console.log(`[LayoutRouter] 🎲 High entropy layout sequence:`, JSON.stringify(seq));
        return seq;
    }
}

module.exports = {
    selectBlueprint,
    classifyIntent
};
