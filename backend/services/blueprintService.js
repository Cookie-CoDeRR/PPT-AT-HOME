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
Available types: ["title_hero", "bento_grid", "two_column_image", "comparison", "standard_text"].

CRITICAL INSTRUCTIONS:
- You MUST use a highly varied mix of slide types. A presentation with only 'standard_text' is extremely boring and unacceptable.
- You MUST use at least one 'title_hero', one 'bento_grid', one 'two_column_image', and one 'comparison'.
- Do NOT put two identical, complex layouts (like two 'comparison' slides) back-to-back.
- Do NOT write any content, roles, or priorities — just pick the layout order.`;

async function getDetailedBlueprint(userPrompt, slideCount = 10) {
    let url = process.env.ROUTER_MODEL_URL || 'http://127.0.0.1:1234/v1/chat/completions';
    if (!url.includes('/chat/completions')) {
        url = url.replace(/\/$/, '') + '/chat/completions';
    }
    const modelName = process.env.ROUTER_MODEL_NAME || 'gemma-4-e4b';
    
    const fallbackSequence = Array(slideCount).fill({ slide_type: "standard_text" });
    fallbackSequence[0] = { slide_type: "title_hero" };

    try {
        const response = await axios.post(url, {
            model: modelName,
            messages: [
                { role: "system", content: qwenSystemPrompt },
                { role: "user", content: `Design a structurally varied blueprint for a ${slideCount}-slide presentation about: "${userPrompt}".` }
            ],
            temperature: 0.7, // Higher temp encourages variety
            max_tokens: 2000,
            stream: false,
            response_format: BLUEPRINT_SCHEMA
        });

        let rawOutput;
        if (response.data.choices && response.data.choices[0]?.message) {
            rawOutput = response.data.choices[0].message.content;
        } else {
            rawOutput = JSON.stringify(response.data);
        }

        console.log("[Blueprint Router] Raw output:\n", rawOutput);

        const objectMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!objectMatch) throw new Error("No JSON object found");

        const parsed = JSON.parse(objectMatch[0]);
        const blueprint = parsed.slides || parsed;

        if (Array.isArray(blueprint) && blueprint.length > 0) {
            console.log(`[Blueprint Success] Predicted ${blueprint.length} detailed slide blueprint.`);
            
            // The pipeline expects just [{slide_type: ...}], which we now return directly
            return blueprint;
        }
        
        console.warn("[Blueprint Warning] Array empty or invalid. Using fallback.");
        return fallbackSequence;

    } catch (error) {
        console.error("[Blueprint Error] Router model failed:", error.message);
        console.log("[Blueprint Fallback] Using fallback sequence.");
        return fallbackSequence;
    }
}

module.exports = {
    getDetailedBlueprint,
    SLIDE_ROLES,
    PRIORITY_LEVELS
};
