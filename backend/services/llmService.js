const axios = require('axios');

// SCHEMA 1: Used strictly for planning roles, priorities, and key messages.
const METADATA_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "presentation_metadata",
        strict: true,
        schema: {
            type: "object",
            properties: {
                slides: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            slide_type: { type: "string" },
                            role: { type: "string" },
                            priority: { type: "integer" },
                            key_message: { type: "string" }
                        },
                        required: ["slide_type", "role", "priority", "key_message"],
                        additionalProperties: false
                    }
                }
            },
            required: ["slides"],
            additionalProperties: false
        }
    }
};

// SCHEMA 2: Used strictly for writing the actual presentation content.
// Now explicitly preserves the metadata planned in phase 1.
const PRESENTATION_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "presentation_content",
        strict: true,
        schema: {
            type: "object",
            properties: {
                slides: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            slide_type: { type: "string" },
                            role: { type: "string" },
                            priority: { type: "integer" },
                            key_message: { type: "string" },
                            title: { type: "string" },
                            subtitle: { type: "string" },
                            left_content: { type: "string" },
                            image_description: { type: "string" },
                            paragraphs: { 
                                type: "array", 
                                items: { type: "string" } 
                            },
                            cards: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        header: { type: "string" },
                                        description: { type: "string" }
                                    },
                                    required: ["header", "description"],
                                    additionalProperties: false
                                }
                            },
                            left_box: {
                                type: "object",
                                properties: {
                                    header: { type: "string" },
                                    points: { type: "array", items: { type: "string" } }
                                },
                                required: ["header", "points"],
                                additionalProperties: false
                            },
                            right_box: {
                                type: "object",
                                properties: {
                                    header: { type: "string" },
                                    points: { type: "array", items: { type: "string" } }
                                },
                                required: ["header", "points"],
                                additionalProperties: false
                            }
                        },
                        required: ["slide_type", "role", "priority", "key_message", "title"],
                        additionalProperties: false
                    }
                }
            },
            required: ["slides"],
            additionalProperties: false
        }
    }
};

// Internal helper for robustly parsing diverse API output formats
function parseApiResponse(responseData) {
    let rawOutput;
    if (responseData.choices && responseData.choices[0]?.message) {
        rawOutput = responseData.choices[0].message.content;
    } else if (responseData.message && responseData.message.content) {
        rawOutput = responseData.message.content; // Ollama native
    } else if (responseData.response) {
        rawOutput = responseData.response; // Ollama generate
    } else if (responseData.slides) {
        rawOutput = JSON.stringify(responseData); // Already parsed JSON
    } else {
        console.error("[LLM API] Unrecognized response format:", JSON.stringify(responseData).substring(0, 200));
        rawOutput = typeof responseData === 'string' ? responseData : JSON.stringify(responseData);
    }

    if (typeof rawOutput !== 'string') {
        rawOutput = JSON.stringify(rawOutput);
    }

    const objectMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!objectMatch) throw new Error("No JSON object found in output");

    let parsedRoot;
    try {
        parsedRoot = JSON.parse(objectMatch[0]);
    } catch (e) {
        throw new Error(`Output failed JSON.parse: ${e.message}`);
    }

    const slides = Array.isArray(parsedRoot) ? parsedRoot : parsedRoot.slides;
    if (!Array.isArray(slides)) {
        throw new Error("Output has no usable slides array.");
    }

    return slides;
}

// PASS 1: Plan the presentation structure
async function planSlideMetadata(userPrompt, slideTypeBlueprint, baseUrl, modelName, temperature, contextText) {
    let finalPrompt = `Plan the presentation metadata.`;
    if (contextText && contextText.trim() !== "") {
        finalPrompt += `\n\nContext Information (Use this to ground the presentation):\n${contextText}`;
    }

    const systemPrompt = `You are an expert presentation architect.
For the presentation about "${userPrompt}", assign each slide in order:
  - "role": one of [hook, context, core_idea, evidence, comparison, deep_dive, summary, cta]
  - "priority": 1 (primary), 2 (secondary), or 3 (tertiary)
  - "key_message": one sentence — the single thing this slide must convey

Planning rules (apply across the WHOLE deck):
1. Exactly one slide gets role "hook", and it must be priority 1. Prefer assigning this to the first slide if suitable.
2. Exactly one slide (typically the last) gets role "summary" or "cta".
3. No two slides may share the same key_message — each must add new ground.
4. Priority 1 slides should be ~20-30% of the deck. Do not overuse priority 1.
5. Roles should feel like a narrative arc (hook -> context -> core_idea -> evidence/comparison -> summary/cta).

STRICT BLUEPRINT REQUIREMENTS:
You MUST output exactly ${slideTypeBlueprint.length} slide objects.
The slide_type for each object MUST sequentially match this EXACT order:
${JSON.stringify(slideTypeBlueprint)}
`;

    const response = await axios.post(
        baseUrl,
        {
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: finalPrompt }
            ],
            temperature: temperature,
            max_tokens: 800,
            stream: false,
            response_format: METADATA_SCHEMA
        }
    );

    const metadataSlides = parseApiResponse(response.data);

    // Validate
    if (metadataSlides.length !== slideTypeBlueprint.length) {
        throw new Error(`Planner returned ${metadataSlides.length} slides, expected ${slideTypeBlueprint.length}`);
    }

    metadataSlides.forEach((slide, idx) => {
        if (slide.slide_type !== slideTypeBlueprint[idx].slide_type) {
            throw new Error(`Slide ${idx} slide_type mismatch. Expected ${slideTypeBlueprint[idx].slide_type}, got ${slide.slide_type}`);
        }
        if (!slide.role || !slide.priority || !slide.key_message) {
            throw new Error(`Slide ${idx} is missing role, priority, or key_message.`);
        }
    });

    console.log(`[Content Planner] Successfully planned ${metadataSlides.length} slides.`);
    return metadataSlides;
}

// PASS 2: Write the content given the plan
async function writeSlideContent(userPrompt, metadataSlides, baseUrl, modelName, temperature, contextText) {
    let finalPrompt = `Write the presentation content.`;
    if (contextText && contextText.trim() !== "") {
        finalPrompt += `\n\nContext Information (Use this to ground the presentation):\n${contextText}`;
    }

    const systemPrompt = `You are an expert technical presentation writer.
Generate presentation content for the topic: "${userPrompt}".

STRICT INSTRUCTIONS:
I am providing a planned metadata array below. For each slide, you MUST keep its slide_type, role, priority, and key_message EXACTLY as given — do not change them. Add only the content fields for that slide_type.

PLANNED METADATA:
${JSON.stringify(metadataSlides, null, 2)}

ROLE WRITING GUIDE:
- hook: Punchy, provocative framing. 1 bold claim or stat. No hedging.
- context: Establish the problem plainly. Neutral, factual tone.
- core_idea: State the thesis with confidence. This is the slide people should remember.
- evidence: Concrete, specific, numbers/examples over adjectives.
- comparison: Balanced but decisive — end with a clear takeaway.
- deep_dive: Technical precision. Assume an informed reader. Denser content is acceptable.
- summary: Compress, don't repeat verbatim.
- cta: Clear, actionable next steps.

PRIORITY DEPTH GUIDE:
- Priority 1: High impact. Fewer words, bigger font. One dominant visual/idea.
- Priority 2: Supporting arguments. Balanced text and visuals.
- Priority 3: Reference/Deep context. Denser text is allowed.

SLIDE TYPE INSTRUCTIONS:
- For 'title_hero' slides: fill 'title' and 'subtitle'.
- For 'bento_grid' slides: fill 'title' and provide exactly 4 items in the 'cards' array.
- For 'two_column_image' slides: fill 'title', 'left_content', and 'image_description'.
- For 'comparison' slides: fill 'title', 'left_box', and 'right_box'.
- For 'standard_text' slides: fill 'title' and 'paragraphs'.`;

    const response = await axios.post(
        baseUrl,
        {
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: finalPrompt }
            ],
            temperature: temperature,
            max_tokens: 6144,
            stream: false,
            response_format: PRESENTATION_SCHEMA
        }
    );

    const finalSlides = parseApiResponse(response.data);

    // Validate
    if (finalSlides.length !== metadataSlides.length) {
        throw new Error(`Writer returned ${finalSlides.length} slides, expected ${metadataSlides.length}`);
    }

    finalSlides.forEach((slide, idx) => {
        const plan = metadataSlides[idx];
        if (slide.slide_type !== plan.slide_type) {
            console.warn(`[Content Writer Warning] LLM altered slide_type on slide ${idx} from ${plan.slide_type} to ${slide.slide_type}. Accepting change.`);
        }
        
        // Quietly restore metadata if the LLM hallucinated changes
        let metadataAltered = false;
        if (slide.role !== plan.role) { slide.role = plan.role; metadataAltered = true; }
        if (slide.priority !== plan.priority) { slide.priority = plan.priority; metadataAltered = true; }
        if (slide.key_message !== plan.key_message) { slide.key_message = plan.key_message; metadataAltered = true; }
        
        if (metadataAltered) {
            console.warn(`[Content Writer Warning] LLM altered metadata on slide ${idx}. Quietly restored to planned values.`);
        }
    });

    console.log(`[Content Writer] Successfully wrote ${finalSlides.length} slides.`);
    return finalSlides;
}

// ORCHESTRATOR
async function generateSlideContent(userPrompt, blueprint, baseUrl = null, modelName = null, temperature = 0.6, contextText = "") {
    try {
        const finalBaseUrl = baseUrl || process.env.CONTENT_MODEL_URL || 'http://127.0.0.1:1234/v1/chat/completions';
        const formattedBaseUrl = (finalBaseUrl.endsWith('/v1') || finalBaseUrl.endsWith('/api')) 
            ? finalBaseUrl.replace(/\/$/, '') + '/chat/completions' 
            : finalBaseUrl;
        const finalModelName = modelName || process.env.CONTENT_MODEL_NAME || 'gemma-4-e4b';

        console.log(`[Content Pipeline] Starting 2-pass generation with ${finalModelName} at ${formattedBaseUrl}...`);

        const plannedSlides = await planSlideMetadata(userPrompt, blueprint, formattedBaseUrl, finalModelName, temperature, contextText);
        const finalSlides = await writeSlideContent(userPrompt, plannedSlides, formattedBaseUrl, finalModelName, temperature, contextText);

        return finalSlides;
    } catch (error) {
        console.error(`[Content Pipeline Error] Failed to generate slide content:`, error.message);
        throw error;
    }
}

module.exports = { generateSlideContent, planSlideMetadata, writeSlideContent };
