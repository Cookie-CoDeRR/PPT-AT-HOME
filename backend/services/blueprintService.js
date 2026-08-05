const axios = require('axios');

const SLIDE_ROLES = [
  "hook",        // opens the deck, grabs attention, sets stakes
  "context",     // background, problem framing
  "core_idea",   // the central thesis / solution being presented
  "evidence",    // data, proof points, case studies
  "comparison",  // trade-offs, alternatives, before/after
  "deep_dive",   // technical detail on one aspect of core_idea
  "summary",     // recap of key points
  "cta"          // call to action / next steps / closing
];

const PRIORITY_LEVELS = {
  1: "primary",    // pivotal slide — gets the most detail and visual weight
  2: "secondary",  // supports a primary slide — moderate detail
  3: "tertiary"    // minor/transitional — light detail, brief content
};

const BLUEPRINT_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "blueprint_sequence",
        strict: true,
        schema: {
            type: "object",
            properties: {
                slides: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            slide_type: { 
                                type: "string",
                                enum: ["title_hero", "bento_grid", "two_column_image", "comparison", "standard_text"]
                            }
                        },
                        required: ["slide_type"],
                        additionalProperties: false
                    }
                }
            },
            required: ["slides"],
            additionalProperties: false
        }
    }
};

const qwenSystemPrompt = `You are a presentation layout planner. Given the user's topic, output a
sequence choosing a slide_type for each slide. 
Available types: ["title_hero", "title_split", "bento_grid", "two_column_image", "comparison", "standard_text", "chart_pie", "data_table"].

CRITICAL INSTRUCTIONS:
- You MUST use a highly varied mix of slide types. A presentation with only 'standard_text' is extremely boring and unacceptable.
- You MUST use at least one 'title_hero' or 'title_split' for the opening slide.
- You MUST use at least one 'bento_grid', one 'two_column_image', and one 'comparison'.
- Do NOT put two identical, complex layouts (like two 'comparison' slides) back-to-back.
- Do NOT write any content, roles, or priorities — just pick the layout order.`;

async function getDetailedBlueprint(userPrompt, slideCount = 10) {
    let url = process.env.ROUTER_MODEL_URL || 'http://127.0.0.1:1234/v1/chat/completions';
    if (!url.includes('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions';
    }
    // We default to our new local fine-tuned model if not set
    const modelName = process.env.ROUTER_MODEL_NAME || 'qwen_layout_mlx';
    
    const fallbackSequence = Array(slideCount).fill({ slide_type: "standard_text" });
    fallbackSequence[0] = { slide_type: "title_hero" };

    try {
        let messages = [];
        
        console.log(`\n[Blueprint Router] 🧠 Querying LAYOUT MODEL: "${modelName}" at ${url}...`);

        // If it's our fine-tuned layout model, we use the exact Alpaca format it was trained on
        if (modelName.includes('qwen') || modelName.includes('layout')) {
            const alpacaPrompt = `Below is an instruction that describes a task. Write a response that appropriately completes the request.\n\n### Instruction:\nYou are a presentation layout planner. Given a slide count and topic, generate a realistic, highly varied layout sequence for a professional presentation.\n\n### Input:\nTopic: ${userPrompt}\nSlide count: ${slideCount}\n\n### Response:\n`;
            messages = [
                { role: "user", content: alpacaPrompt }
            ];
        } else {
            // Fallback for general models like Gemma
            messages = [
                { role: "system", content: qwenSystemPrompt },
                { role: "user", content: `Design a structurally varied blueprint for a ${slideCount}-slide presentation about: "${userPrompt}".` }
            ];
        }

        const response = await axios.post(url, {
            model: modelName,
            messages: messages,
            temperature: 0.75, // Higher temp for more layout variety
            max_tokens: 500,
            stream: false
        });

        let rawOutput;
        if (response.data.choices && response.data.choices[0]?.message) {
            rawOutput = response.data.choices[0].message.content;
        } else {
            rawOutput = JSON.stringify(response.data);
        }

        console.log("[Blueprint Router] Raw output:\n", rawOutput);

        // Look for either a JSON object { ... } or a JSON array [ ... ]
        const objectMatch = rawOutput.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        
        let parsed;
        if (!objectMatch) {
            console.log("[Blueprint Router] No JSON found. Attempting to parse markdown...");
            
            // Try to match "1. **Layout Name**" or "**Slide Type:** Layout Name"
            const fallbackRegex1 = /\*\*Slide Type:\*\*\s*([^\n]+)/gi;
            const fallbackRegex2 = /\d+\.\s*\*\*([^\*]+)\*\*/g;
            
            let slideTypesMatch = rawOutput.match(fallbackRegex1);
            if (slideTypesMatch && slideTypesMatch.length > 0) {
                const types = slideTypesMatch.map(s => s.replace(/\*\*Slide Type:\*\*\s*/i, '').trim().toLowerCase().replace(/ /g, '_'));
                const blueprint = types.map(type => ({ slide_type: type }));
                console.log(`[Blueprint Success] Extracted ${blueprint.length} slides from markdown (Format 1).`);
                return blueprint;
            }

            slideTypesMatch = rawOutput.match(fallbackRegex2);
            if (slideTypesMatch && slideTypesMatch.length > 0) {
                const types = slideTypesMatch.map(s => s.replace(/\d+\.\s*\*\*/, '').replace(/\*\*/, '').trim().toLowerCase().replace(/ /g, '_').replace(/:/g, ''));
                const blueprint = types.map(type => ({ slide_type: type }));
                console.log(`[Blueprint Success] Extracted ${blueprint.length} slides from markdown (Format 2).`);
                return blueprint;
            }
            
            // Format 3: Raw Space-Separated Layouts (Qwen 1.5B sometimes loses JSON brackets)
            const validLayouts = ["title_hero", "standard_text", "bento_grid", "two_column_image", "comparison", "stat_or_quote", "data_table", "chart_pie", "chart_bar", "title_split"];
            const rawWords = rawOutput.toLowerCase().split(/[\s,]+/);
            let extracted = rawWords.filter(word => validLayouts.includes(word));
            
            if (extracted.length > 0) {
                // Limit to the requested slide count
                if (extracted.length > slideCount) {
                    extracted = extracted.slice(0, slideCount);
                }
                const blueprint = extracted.map(type => ({ slide_type: type }));
                console.log(`[Blueprint Success] Extracted ${blueprint.length} slides from raw string parsing (Format 3).`);
                return enforceBlueprintRules(blueprint);
            }

            throw new Error("No JSON object or array found, and markdown/string parsing failed.");
        }

        parsed = JSON.parse(objectMatch[0]);
        let blueprint = parsed.slides || parsed;

        // If the model output a raw array of strings (like our fine-tuned Qwen does), map it to objects
        if (Array.isArray(blueprint) && blueprint.length > 0 && typeof blueprint[0] === 'string') {
            blueprint = blueprint.map(type => ({ slide_type: type }));
        }

        if (Array.isArray(blueprint) && blueprint.length > 0) {
            console.log(`[Blueprint Success] Predicted ${blueprint.length} detailed slide blueprint.`);
            return enforceBlueprintRules(blueprint);
        }
        
        console.warn("[Blueprint Warning] Array empty or invalid. Using fallback.");
        return enforceBlueprintRules(fallbackSequence);

    } catch (error) {
        console.error("[Blueprint Error] Router model failed:", error.message);
        console.log("[Blueprint Fallback] Using fallback sequence.");
        return enforceBlueprintRules(fallbackSequence);
    }
}

function enforceBlueprintRules(blueprint) {
    if (!Array.isArray(blueprint) || blueprint.length === 0) return blueprint;
    
    // Ensure ONLY the first slide is a title layout
    if (blueprint[0].slide_type !== 'title_hero' && blueprint[0].slide_type !== 'title_split') {
        blueprint[0].slide_type = 'title_hero';
    }
    
    for (let i = 1; i < blueprint.length; i++) {
        if (blueprint[i].slide_type === 'title_hero' || blueprint[i].slide_type === 'title_split') {
            blueprint[i].slide_type = 'standard_text';
        }
    }

    // Randomly swap the first title layout for visual variety
    if (blueprint[0].slide_type === 'title_hero' && Math.random() > 0.5) {
        blueprint[0].slide_type = 'title_split';
    }
    
    // Inject random variety if too many standard_text slides exist
    const advancedTypes = ["bento_grid", "two_column_image", "comparison", "chart_pie", "chart_bar", "data_table"];
    for (let i = 1; i < blueprint.length; i++) {
        if (blueprint[i].slide_type === 'standard_text' && Math.random() > 0.5) {
            // Pick a random advanced type
            blueprint[i].slide_type = advancedTypes[Math.floor(Math.random() * advancedTypes.length)];
        }
    }
    
    return blueprint;
}

module.exports = {
    getDetailedBlueprint,
    SLIDE_ROLES,
    PRIORITY_LEVELS
};
