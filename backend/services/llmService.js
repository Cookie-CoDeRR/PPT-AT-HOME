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

// SCHEMA 3: Single slide generation
const SINGLE_SLIDE_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "single_slide_content",
        strict: true,
        schema: {
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
                },
                table_data: {
                    type: "object",
                    properties: {
                        headers: { type: "array", items: { type: "string" } },
                        rows: { 
                            type: "array", 
                            items: { type: "array", items: { type: "string" } } 
                        }
                    },
                    required: ["headers", "rows"],
                    additionalProperties: false
                },
                chart_data: {
                    type: "object",
                    properties: {
                        labels: { type: "array", items: { type: "string" } },
                        values: { type: "array", items: { type: "number" } }
                    },
                    required: ["labels", "values"],
                    additionalProperties: false
                }
            },
            required: ["slide_type", "role", "priority", "key_message", "title"],
            additionalProperties: false
        }
    }
};

function getSchemaForSlideType(slide_type) {
    // Deep clone the base schema
    const schema = JSON.parse(JSON.stringify(SINGLE_SLIDE_SCHEMA));
    
    // Enforce required fields dynamically based on the layout
    const req = schema.json_schema.schema.required;
    switch(slide_type) {
        case 'title_hero':
        case 'title_split':
            req.push("subtitle");
            break;
        case 'bento_grid':
            req.push("cards");
            break;
        case 'two_column_image':
            req.push("left_content", "image_description");
            break;
        case 'comparison':
            req.push("left_box", "right_box");
            break;
        case 'chart_pie':
        case 'chart_bar':
            req.push("chart_data");
            break;
        case 'data_table':
            req.push("table_data");
            break;
        case 'standard_text':
            req.push("paragraphs");
            break;
    }
    return schema;
}

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

    const headers = { 'Content-Type': 'application/json' };
    if (contentConfig.apiKey) headers['Authorization'] = `Bearer ${contentConfig.apiKey}`;

    const response = await axios.post(
        contentConfig.baseUrl,
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
        },
        { headers }
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

// PASS 2: Write the content given the plan (SLIDE-BY-SLIDE ITERATION)
async function writeSlideContent(userPrompt, blueprint, contentConfig, temperature, contextText, options = {}) {
    console.log(`[Content Writer] Beginning iterative generation for ${blueprint.length} slides...`);
    const finalSlides = [];
    
    let sourceChunks = [];
    if (options.pasteMode && userPrompt.includes('———')) {
        sourceChunks = userPrompt.split('———').map(c => c.trim()).filter(c => c.length > 0);
    }

    for (let idx = 0; idx < blueprint.length; idx++) {
        const plan = blueprint[idx];
        console.log(`[Content Writer] ✍️ Generating slide ${idx + 1}/${blueprint.length} [${plan.slide_type}] using CONTENT MODEL: "${contentConfig.model}"...`);

        let finalPrompt = `Write the presentation content for SLIDE ${idx + 1}.`;
        
        if (options.pasteMode) {
             const mode = options.pasteMode;
             let modeInstruction = "";
             if (mode === 'generate_outline') modeInstruction = "Treat the user prompt as rough notes/bullets. EXPAND each section into full, polished slide content.";
             else if (mode === 'summarize') modeInstruction = "CONDENSE the pasted content. Shorten long text, extract key ideas only.";
             else if (mode === 'preserve') modeInstruction = "PRESERVE EXACT WORDING. Do NOT rephrase. Just structure it into slides exactly as written.";
             finalPrompt += `\n\nPaste Mode Instructions: ${modeInstruction}`;
             
             if (sourceChunks.length > 0) {
                 const chunk = sourceChunks[Math.min(idx, sourceChunks.length - 1)];
                 finalPrompt += `\n\nSOURCE MATERIAL FOR THIS SLIDE ONLY:\n${chunk}`;
             } else {
                 finalPrompt += `\n\nSOURCE MATERIAL (Distribute across slides):\n${userPrompt}`;
             }
        }
        
        if (options.contentType) {
             if (options.contentType === 'webpage') finalPrompt += `\n\nNote: This content is for a WEBPAGE. Format the output as a webpage section.`;
             else if (options.contentType === 'document') finalPrompt += `\n\nNote: This content is for a DOCUMENT. Format the output as a document section (headings, paragraphs).`;
             else if (options.contentType === 'social') finalPrompt += `\n\nNote: This content is for a SOCIAL MEDIA CAROUSEL. Keep it punchy, short, and highly visual.`;
        }

        if (!options.pasteMode && contextText && contextText.trim() !== "") {
            finalPrompt += `\n\nContext Information (Use this to ground the presentation):\n${contextText}`;
        }
        
        // Provide prior slides as context so it doesn't repeat itself
        if (finalSlides.length > 0) {
            const priorTitles = finalSlides.map(s => s.title).join(" | ");
            finalPrompt += `\n\nPrior Slide Titles Generated So Far: ${priorTitles}`;
        }

        const systemPrompt = `You are an expert technical presentation writer.
Generate presentation content for the topic: "${userPrompt}".
You are writing ONE specific slide (Slide ${idx + 1} out of ${blueprint.length}).

STRICT INSTRUCTIONS:
You MUST create content that fits the layout: ${plan.slide_type}.
Please assign an appropriate role (e.g. hook, context, core_idea, evidence, summary), priority (1, 2, or 3), and key_message for this slide based on where it sits in the presentation.

CURRENT SLIDE LAYOUT REQUIREMENT:
${JSON.stringify(plan, null, 2)}

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
- For 'title_hero' or 'title_split' slides: fill 'title' and 'subtitle'.
- For 'bento_grid' slides: fill 'title' and provide exactly 4 items in the 'cards' array.
- For 'two_column_image' slides: fill 'title', 'left_content', and 'image_description'.
- For 'comparison' slides: fill 'title', 'left_box', and 'right_box'.
- For 'chart_pie' or 'chart_bar' slides: fill 'title' and provide 'chart_data' with 'labels' and 'values' arrays.
- For 'data_table' slides: fill 'title' and provide 'table_data' with 'headers' and 'rows'.
- For 'standard_text' slides: fill 'title' and 'paragraphs'.`;

        const headers = { 'Content-Type': 'application/json' };
        if (contentConfig.apiKey) headers['Authorization'] = `Bearer ${contentConfig.apiKey}`;

        const response = await axios.post(
            contentConfig.baseUrl,
            {
                model: contentConfig.model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: finalPrompt }
                ],
                temperature: temperature,
                max_tokens: 1024,
                stream: false,
                response_format: getSchemaForSlideType(plan.slide_type)
            },
            { headers }
        );

        let rawOutput;
        if (response.data.choices && response.data.choices[0]?.message) {
            rawOutput = response.data.choices[0].message.content;
        } else {
            rawOutput = JSON.stringify(response.data);
        }

        const objectMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!objectMatch) throw new Error("No JSON object found in output");
        
        let slide = JSON.parse(objectMatch[0]);

        // Enforce the layout type
        slide.slide_type = plan.slide_type;
        finalSlides.push(slide);
    }

    console.log(`[Content Writer] Successfully wrote ${finalSlides.length} slides iteratively.`);
    return finalSlides;
}

// ORCHESTRATOR
async function generateSlideContent(userPrompt, blueprint, contentConfig = {}, temperature = 0.6, contextText = "", options = {}) {
    try {
        let finalBaseUrl = contentConfig.baseUrl || process.env.CONTENT_MODEL_URL || 'http://127.0.0.1:1234/v1';
        if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api') && !finalBaseUrl.includes('/chat/completions')) {
            finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
        }
        if (!finalBaseUrl.includes('/chat/completions')) {
            finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/chat/completions';
        }
        const finalModelName = contentConfig.model || process.env.CONTENT_MODEL_NAME || 'gemma-4-e4b';
        
        contentConfig = { ...contentConfig, baseUrl: finalBaseUrl, model: finalModelName };

        console.log(`[Content Pipeline] Starting 1-pass iterative generation with ${finalModelName} at ${finalBaseUrl}...`);

        const finalSlides = await writeSlideContent(userPrompt, blueprint, contentConfig, temperature, contextText, options);

        return finalSlides;
    } catch (error) {
        console.error(`[Content Pipeline Error] Failed to generate slide content:`, error.message);
        throw error;
    }
}

async function generateIncrementalSlide(contextText, instruction, contentConfig = {}, contentType = 'presentation') {
    let finalBaseUrl = contentConfig.baseUrl || process.env.CONTENT_MODEL_URL || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api') && !finalBaseUrl.includes('/chat/completions')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }
    if (!finalBaseUrl.includes('/chat/completions')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/chat/completions';
    }
    const finalModelName = contentConfig.model || process.env.CONTENT_MODEL_NAME || 'gemma-4-e4b';
    
    let finalPrompt = `Write ONE new presentation slide based on the following instruction: "${instruction}"\n\n`;
    if (contextText && contextText.trim() !== "") {
        finalPrompt += `Context Information (Use this to ground the presentation):\n${contextText}\n\n`;
    }
    
    let systemPrompt = `You are an expert technical presentation writer.
You MUST output exactly ONE slide matching the SINGLE_SLIDE_SCHEMA.
Choose the most appropriate layout type from: title_hero, bento_grid, two_column_image, comparison, standard_text.`;

    if (contentType === 'webpage') systemPrompt += `\nNote: This is for a WEBPAGE. Act accordingly.`;
    if (contentType === 'document') systemPrompt += `\nNote: This is for a DOCUMENT. Act accordingly.`;
    if (contentType === 'social') systemPrompt += `\nNote: This is for a SOCIAL MEDIA POST. Act accordingly.`;

    const headers = { 'Content-Type': 'application/json' };
    if (contentConfig.apiKey) headers['Authorization'] = `Bearer ${contentConfig.apiKey}`;

    const response = await axios.post(
        finalBaseUrl,
        {
            model: finalModelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: finalPrompt }
            ],
            temperature: 0.6,
            max_tokens: 1024,
            stream: false,
            // Fallback to base schema if slide type is unknown during incremental add
            response_format: SINGLE_SLIDE_SCHEMA 
        },
        { headers }
    );

    let rawOutput;
    if (response.data.choices && response.data.choices[0]?.message) {
        rawOutput = response.data.choices[0].message.content;
    } else {
        rawOutput = JSON.stringify(response.data);
    }

    const objectMatch = rawOutput.match(/\{[\s\S]*\}/);
    if (!objectMatch) throw new Error("No JSON object found in output");
    
    return JSON.parse(objectMatch[0]);
}

module.exports = { generateSlideContent, planSlideMetadata, writeSlideContent, generateIncrementalSlide };
