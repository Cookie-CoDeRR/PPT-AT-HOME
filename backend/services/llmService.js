const OpenAI = require('openai');
const { selectBlueprint } = require('./algorithmicRouter');
const { generateImage } = require('./imageService');

const LAYOUT_SCHEMAS = {
    "title_hero": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "title_hero",\n      "slide_category": "...",\n      "title": "...",\n      "subtitle": "..."\n    }',
    "standard_text": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "standard_text",\n      "slide_category": "...",\n      "title": "...",\n      "bullets": ["...", "..."]\n    }',
    "two_column_image": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "two_column_image",\n      "slide_category": "...",\n      "title": "...",\n      "bullets": ["...", "..."],\n      "image_prompt": "..."\n    }',
    "bento_grid": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "bento_grid",\n      "slide_category": "...",\n      "title": "...",\n      "items": [{"size": "large", "title": "...", "desc": "..."}]\n    }',
    "chart_pie": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "chart_pie",\n      "slide_category": "...",\n      "title": "...",\n      "chart_data": {"labels": ["A", "B"], "values": [10, 20]}\n    }',
    "chart_bar": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "chart_bar",\n      "slide_category": "...",\n      "title": "...",\n      "chart_data": {"labels": ["A", "B"], "values": [10, 20]}\n    }',
    "data_table": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "data_table",\n      "slide_category": "...",\n      "title": "...",\n      "table_data": {"headers": ["Col1", "Col2"], "rows": [["Val1", "Val2"]]}\n    }',
    "comparison": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "comparison",\n      "slide_category": "...",\n      "title": "...",\n      "column_left": {"title": "...", "bullets": ["..."]}, "column_right": {"title": "...", "bullets": ["..."]}\n    }',
    "stat_or_quote": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "stat_or_quote",\n      "slide_category": "...",\n      "title": "...",\n      "huge_text": "...",\n      "subtext": "..."\n    }',
    "stat_callout": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "stat_callout",\n      "slide_category": "...",\n      "title": "...",\n      "stat": "...",\n      "label": "...",\n      "bullets": ["..."]\n    }',
    "timeline": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "timeline",\n      "slide_category": "...",\n      "title": "...",\n      "steps": [{"step": "...", "text": "..."}]\n    }',
    "grid_list": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "grid_list",\n      "slide_category": "...",\n      "title": "...",\n      "items": [{"item_title": "...", "item_text": "..."}]\n    }',
    "metric_dashboard": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "metric_dashboard",\n      "slide_category": "...",\n      "title": "...",\n      "metrics": [{"label": "...", "value": "...", "change": "..."}]\n    }',
    "summary_takeaways": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "summary_takeaways",\n      "slide_category": "...",\n      "title": "...",\n      "bullets": ["...", "..."]\n    }',
    "default": '{\n      "slide_number": __SLIDE_NUM__,\n      "slide_type": "default",\n      "slide_category": "...",\n      "title": "...",\n      "subtitle": "...",\n      "bullets": ["..."]\n    }'
};
async function generateSlides(prompt, blueprint, baseUrl = null, modelName = null, temperature = 0.6) {
    let finalBaseUrl = baseUrl || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }

    const openai = new OpenAI({
        baseURL: finalBaseUrl,
        apiKey: 'local',
    });

    const blueprintString = JSON.stringify(blueprint);
    const slideSchemasArray = blueprint.map((layoutType, index) => {
        const schemaTemplate = LAYOUT_SCHEMAS[layoutType] || LAYOUT_SCHEMAS["default"];
        return schemaTemplate.replace('__SLIDE_NUM__', index + 1);
    });
    const combinedSchemas = slideSchemasArray.join(',\n    ');

    const systemPrompt = `You are an expert presentation data architect. Your task is to generate a highly engaging PowerPoint outline.

You MUST structure your JSON output to perfectly match the following layout sequence: ${blueprintString}.
Slide 1 MUST be ${blueprint[0]}, Slide 2 MUST be ${blueprint[1]}, etc. Do NOT change this order. Fill the content based on the user's topic.

CRITICAL SYSTEM DIRECTIVES:
1. DATA VISUALIZATION MANDATE: You must include at least one bento_grid, chart_pie, or data_table in every generation (if applicable).
2. SLIDE CATEGORY: Every slide MUST include a "slide_category" field.
3. CONTENT DENSITY: Make it detailed and substantive.

You MUST return a JSON object with this EXACT schema, matching the fields to the chosen slide_type:
{
  "title": "Main title",
  "slides": [
    ${combinedSchemas}
  ]
}

DO NOT wrap your response in markdown code blocks. Return ONLY valid, parseable JSON. Ensure all keys and string values are properly double-quoted.`;

    try {
        const response = await openai.chat.completions.create({
            model: modelName || 'llama3.2',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            temperature: temperature,
            max_tokens: 8192,
            response_format: { type: "text" }
        });

        const content = response.choices[0].message?.content || "";
        
        // Robust extraction
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        
        if (match) {
            return JSON.parse(match[0]);
        }
        throw new Error("Failed to parse valid JSON from LLM output.");
    } catch (e) {
        console.error("LLM Generation failed:", e.message);
        throw e;
    }
}

async function generateJsonSlides(prompt, slideCount, tone, baseUrl, modelName, contextText = "", density = "Detailed", includeImages = false, referenceImage = null, temperature = 0.6, contentType = "presentation", language = "English", slideSize = "", graphicStyle = "", graphicCount = 1, graphicQuality = "Standard") {
    let finalBaseUrl = baseUrl || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }

    if (contentType === 'graphic') {
        const generatedSlides = [];
        for (let i = 0; i < graphicCount; i++) {
            const imageUrl = await generateImage(prompt, graphicStyle, graphicQuality, slideSize);
            generatedSlides.push({
                slide_number: i + 1,
                slide_type: "graphic_result",
                title: "Generated Graphic " + (i + 1),
                image_url: imageUrl
            });
        }
        return {
            title: "Generated Graphics",
            slides: generatedSlides
        };
    }

    const openai = new OpenAI({
        baseURL: finalBaseUrl,
        apiKey: 'local',
    });

    const blueprint = selectBlueprint(slideCount, temperature);
    const blueprintString = JSON.stringify(blueprint);

    const antiRepetitionRule = previousLayoutSequence.length > 0
        ? `1. DO NOT use the exact following layout sequence: ${JSON.stringify(previousLayoutSequence)}. You must invent a completely different structural narrative.`
        : ``;

    const slideSchemasArray = blueprint.map((layoutType, index) => {
        const schemaTemplate = LAYOUT_SCHEMAS[layoutType] || LAYOUT_SCHEMAS["default"];
        let schemaStr = schemaTemplate.replace('__SLIDE_NUM__', index + 1);
        if (includeImages) {
            schemaStr = schemaStr.replace('\n    }', ',\n      "image_search_query": "search query"\n    }');
        }
        return schemaStr;
    });
    const combinedSchemas = slideSchemasArray.join(',\n    ');

    let contentSpecificInstruction = `You are an expert presentation data architect. Your task is to generate a highly engaging PowerPoint outline.`;
    if (contentType === 'webpage') {
        contentSpecificInstruction = `You are an expert web designer. Your task is to generate a single continuous JSON object representing a webpage (e.g. hero section, features, footer). Map these "sections" into the provided schema.`;
    } else if (contentType === 'document') {
        contentSpecificInstruction = `You are an expert document formatter. Your task is to generate a document structure (e.g. headers, paragraphs, lists) rather than presentation slides. Map these "pages" into the provided schema.`;
    } else if (contentType === 'social') {
        contentSpecificInstruction = `You are a social media strategist. Your task is to generate highly engaging, concise, vertical format content (e.g., carousel posts, threads). Map these "posts" into the provided schema.`;
    }

    let systemPrompt = `${contentSpecificInstruction}
Tone: ${tone}
Number of Slides/Sections: ${slideCount}
Content Density: ${density}
Language: ${language}

You MUST structure your JSON output to perfectly match the following layout sequence: ${blueprintString}.
Slide 1 MUST be ${blueprint[0]}, Slide 2 MUST be ${blueprint[1]}, etc. Do NOT change this order. Fill the content based on the user's topic.

CRITICAL SYSTEM DIRECTIVES:
${antiRepetitionRule}
2. DATA VISUALIZATION MANDATE: You must include at least one bento_grid, chart_pie, or data_table in every generation (if applicable).
3. SLIDE CATEGORY: Every slide MUST include a "slide_category" field. Choose one:
   - "title_hero": For intros and transitions. Title: max 12 words. Subtitle: max 20 words.
   - "informational": For text-heavy explanations and comparisons. FILL each text area completely:
     * "bullets": MUST have 4-6 bullets, each 10-20 words. DO NOT write short 3-word bullets.
     * "column_left.bullets" and "column_right.bullets": each MUST have 3-5 bullets, 8-15 words each.
     * "steps": each step's "text" field MUST be 20-25 words explaining what happened.
     * "items": each item's "item_text" or "desc" MUST be 40-50 words of real explanatory content and if content is not fitting in field box then the size of text field.
   - "data_viz": For charts, tables, and metric dashboards. Values MUST be real data, not placeholders.
4. CONTENT DENSITY RULE: The "${density}" density setting means:
   - Standard: 4-5 content points per slide.
   - Detailed: 5-7 content points per slide with richer explanations.
   - Comprehensive: 6-8 content points per slide with full sentences and context.
5. FILL THE LAYOUT: Every layout type has specific content boxes. You MUST fill ALL relevant fields for the chosen slide_type with meaningful, substantive content — never leave fields as "..." or empty arrays.
   - Every Text field layout should have a title specifying the content and the sub content which hold main relavent information required for that slide generation should nearly fill all information.
${includeImages ? '\nCRITICAL INSTRUCTION: You MUST include an "image_search_query" field for EACH slide containing a 5-6 word descriptive query for a stock photo.' : ''}
${contextText ? `Use the following extracted document context:\n---\n${contextText}\n---\n\n` : ''}You MUST return a JSON object with this EXACT schema, matching the fields to the chosen slide_type:
{
  "title": "Main title",
  "slides": [
    ${combinedSchemas}
  ]
}

DO NOT wrap your response in markdown code blocks. Return ONLY valid, parseable JSON. Ensure all keys and string values are properly double-quoted.`;

    let userMessageContent = prompt;
    if (referenceImage) {
        userMessageContent = [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: referenceImage } }
        ];
    }

    let retryCount = 0;
    let currentPrompt = userMessageContent;

    while (retryCount <= 2) {
        const schema = {
            type: "json_schema",
            json_schema: {
                name: "presentation_blueprint",
                strict: true,
                schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        slides: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    slide_number: { type: "number" },
                                    slide_type: { type: "string" },
                                    slide_category: { type: "string" },
                                    title: { type: "string" },
                                    subtitle: { type: "string", description: "Leave empty if not applicable." },
                                    bullets: { type: "array", items: { type: "string" }, description: "Leave empty if not applicable. MUST contain at least 3 detailed bullet points if applicable." },
                                    image_prompt: { type: "string", description: "Leave empty if not applicable." },
                                    image_search_query: { type: "string", description: "Leave empty if not applicable." },
                                    items: { type: "array", items: { type: "object", properties: { size: { type: "string" }, title: { type: "string" }, desc: { type: "string" }, item_title: { type: "string" }, item_text: { type: "string" } }, required: [], additionalProperties: true }, description: "Leave empty if not applicable." },
                                    chart_data: { type: "object", properties: { labels: { type: "array", items: { type: "string" } }, values: { type: "array", items: { type: "number" } } }, required: ["labels", "values"], additionalProperties: false, description: "Pass empty arrays if not applicable." },
                                    table_data: { type: "object", properties: { headers: { type: "array", items: { type: "string" } }, rows: { type: "array", items: { type: "array", items: { type: "string" } } } }, required: ["headers", "rows"], additionalProperties: false, description: "Pass empty arrays if not applicable." },
                                    column_left: { type: "object", properties: { title: { type: "string" }, bullets: { type: "array", items: { type: "string" } } }, required: ["title", "bullets"], additionalProperties: false, description: "Pass empty string/arrays if not applicable." },
                                    column_right: { type: "object", properties: { title: { type: "string" }, bullets: { type: "array", items: { type: "string" } } }, required: ["title", "bullets"], additionalProperties: false, description: "Pass empty string/arrays if not applicable." },
                                    huge_text: { type: "string", description: "Leave empty if not applicable." },
                                    subtext: { type: "string", description: "Leave empty if not applicable." },
                                    stat: { type: "string", description: "Leave empty if not applicable." },
                                    label: { type: "string", description: "Leave empty if not applicable." },
                                    steps: { type: "array", items: { type: "object", properties: { step: { type: "string" }, text: { type: "string" } }, required: ["step", "text"], additionalProperties: false }, description: "Leave empty if not applicable." },
                                    metrics: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" }, change: { type: "string" } }, required: ["label", "value", "change"], additionalProperties: false }, description: "Leave empty if not applicable." }
                                },
                                required: [
                                    "slide_number", "slide_type", "slide_category", "title", "subtitle", "bullets",
                                    "image_prompt", "image_search_query", "items", "chart_data", "table_data",
                                    "column_left", "column_right", "huge_text", "subtext", "stat", "label", "steps", "metrics"
                                ],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["title", "slides"],
                    additionalProperties: false
                }
            }
        };

        let response;
        try {
            response = await openai.chat.completions.create({
                model: modelName || 'llama3.2',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: currentPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: "text" }
            });

            if (!response || !response.choices || !response.choices[0]) {
                console.error("Raw LLM Response:", response);
                throw new Error("Invalid response from local LLM. The model may have crashed or returned an empty response.");
            }

            let content = response.choices[0].message?.content || "";
            content = content.trim();

            const extractAndParseJSON = (rawString) => {
                try {
                    return JSON.parse(rawString);
                } catch (err) {
                    let cleaned = rawString.replace(/```json/gi, '').replace(/```/g, '').trim();
                    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                    if (match) {
                        return JSON.parse(match[0]);
                    }
                    throw new Error("Could not extract valid JSON structure from LLM response.");
                }
            };

            const parsedData = extractAndParseJSON(content);
            const generatedSequence = parsedData.slides ? parsedData.slides.map(s => s.slide_type) : [];

            if (previousLayoutSequence.length > 0 && JSON.stringify(generatedSequence) === JSON.stringify(previousLayoutSequence)) {
                console.log(`[LLM Validation Loop] Detected mode collapse. Retrying... (${retryCount + 1}/3)`);
                retryCount++;

                const errorMessage = "You reused the previous layout sequence. Generate a new JSON with different slide_types.";
                if (Array.isArray(currentPrompt)) {
                    currentPrompt.push({ type: "text", text: errorMessage });
                } else {
                    currentPrompt += `\n\n${errorMessage}`;
                }

                systemPrompt += `\nABSOLUTELY DO NOT USE THIS SEQUENCE: ${JSON.stringify(generatedSequence)}`;
                continue;
            }

            previousLayoutSequence = generatedSequence;
            if (parsedData && parsedData.slides && Array.isArray(parsedData.slides)) {
                // Auto-healing (mapping bullets to columns if needed)
                parsedData.slides = postProcessSlides(parsedData.slides);

                // Strict Validation
                const brokenSlides = validateSlides(parsedData.slides);
                if (brokenSlides.length > 0) {
                    console.log(`[LLM Validation Loop] Detected missing fields. Retrying... (${retryCount + 1}/3)`);
                    retryCount++;

                    const errorDetails = brokenSlides.map(b => `Slide ${b.index} (${b.slide_type}) is missing required populated keys: [${b.missing.join(", ")}]`).join(". ");
                    const errorMessage = `Validation Failed: ${errorDetails}. Please regenerate the JSON and ensure these specific keys contain actual text/data, not empty arrays or empty strings.`;

                    if (Array.isArray(currentPrompt)) {
                        currentPrompt.push({ type: "text", text: errorMessage });
                    } else {
                        currentPrompt += `\n\n${errorMessage}`;
                    }
                    continue;
                }

                // --- CONCURRENT IMAGE GENERATION PIPELINE ---
                // --- CONCURRENT IMAGE GENERATION PIPELINE ---
                // DISABLED: A1111 backend is offline.
                // const imagePromises = [];
                // parsedData.slides.forEach(slide => {
                //     let promptToGenerate = slide.image_prompt || slide.image_search_query;
                //     if (promptToGenerate) {
                //         imagePromises.push(
                //             generateImage(promptToGenerate, graphicStyle, graphicQuality, slideSize)
                //                 .then(url => { 
                //                     slide.image_url = url; 
                //                     delete slide.image_prompt; 
                //                     delete slide.image_search_query; 
                //                 })
                //         );
                //     }
                // });
                // 
                // if (imagePromises.length > 0) {
                //     await Promise.all(imagePromises);
                // }
                // ---------------------------------------------
            }
            return parsedData;

        } catch (e) {
            console.error("Error generating or parsing LLM response:", e);

            // If the model unloaded or crashed, we should instantly fail gracefully 
            // rather than entering an infinite retry loop with the same broken model.
            if (e.status === 400 || e.message.includes('Model unloaded') || e.message.includes('fetch failed')) {
                throw new Error("LLM Error: The AI model was unloaded from memory or disconnected. Please reload the model in LM Studio .");
            }

            if (retryCount >= 2 || !(e instanceof SyntaxError)) {
                throw new Error("LLM generation failed: " + e.message);
            }
            retryCount++;
            const errorMessage = "The response was not valid JSON. Please return ONLY a JSON object.";
            if (Array.isArray(currentPrompt)) {
                currentPrompt.push({ type: "text", text: errorMessage });
            } else {
                currentPrompt += `\n\n${errorMessage}`;
            }
        }
    }
    throw new Error("Failed to generate a valid, unique presentation after 3 attempts.");
}

function postProcessSlides(slides) {
    const types = ["comparison", "timeline", "stat_callout", "grid_list"];
    for (let i = 0; i < slides.length; i++) {
        if (i > 0 && slides[i].slide_type === slides[i - 1].slide_type && slides[i].slide_type !== 'default') {
            const availableTypes = types.filter(t => t !== slides[i - 1].slide_type);
            slides[i].slide_type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        }

        const slide = slides[i];

        if (slide.slide_type === 'comparison') {
            if ((!slide.column_left || !slide.column_left.title || slide.column_left.title === "") && slide.bullets && slide.bullets.length > 0) {
                const mid = Math.ceil(slide.bullets.length / 2);
                slide.column_left = { title: "Option A", bullets: slide.bullets.slice(0, mid) };
                slide.column_right = { title: "Option B", bullets: slide.bullets.slice(mid) };
            }
            if (!slide.column_left || !slide.column_left.title || slide.column_left.title === "") {
                slide.column_left = { title: "Option A", bullets: ["• Missing data"] };
            }
            if (!slide.column_right || !slide.column_right.title || slide.column_right.title === "") {
                slide.column_right = { title: "Option B", bullets: ["• Missing data"] };
            }
        }

        if (slide.slide_type === 'timeline') {
            if ((!slide.steps || slide.steps.length === 0) && slide.bullets && slide.bullets.length > 0) {
                slide.steps = slide.bullets.map((b, idx) => ({ step: `Step ${idx + 1}`, text: b }));
            }
            if (!slide.steps || slide.steps.length === 0) {
                slide.steps = [{ step: "1", text: "Missing data" }, { step: "2", text: "Missing data" }];
            }
        }

        if (slide.slide_type === 'grid_list' || slide.slide_type === 'bento_grid') {
            if ((!slide.items || slide.items.length === 0) && slide.bullets && slide.bullets.length > 0) {
                slide.items = slide.bullets.map((b, idx) => ({ item_title: `Item ${idx + 1}`, title: `Item ${idx + 1}`, item_text: b, desc: b, size: "small" }));
            }
            if (!slide.items || slide.items.length === 0) {
                slide.items = [{ item_title: "Item", title: "Item", item_text: "Missing data", desc: "Missing data", size: "small" }];
            }
        }

        if (slide.slide_type === 'stat_callout') {
            if (!slide.stat || slide.stat === "") slide.stat = "100%";
            if (!slide.label || slide.label === "") slide.label = "Metric";
            if (!slide.bullets || slide.bullets.length === 0) slide.bullets = ["• Missing data"];
        }

        if (slide.slide_type === 'metric_dashboard') {
            if (!slide.metrics || slide.metrics.length === 0) {
                if (slide.bullets && slide.bullets.length > 0) {
                    slide.metrics = slide.bullets.map((b, idx) => ({ label: `Metric ${idx + 1}`, value: "N/A", change: "+0%" }));
                } else {
                    slide.metrics = [{ label: "Missing", value: "N/A", change: "+0%" }];
                }
            }
        }

        if (!slide.bullets || slide.bullets.length === 0) {
            slide.bullets = ["• Content pending", "• Please update in editor"];
        }
    }
    return slides;
}

async function generateIncrementalSlide(contextText, userInstruction, baseUrl, modelName, contentType = "presentation") {
    let finalBaseUrl = baseUrl || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }

    const openai = new OpenAI({
        baseURL: finalBaseUrl,
        apiKey: 'local',
    });

    let roleDescription = "extending an existing presentation deck";
    if (contentType === 'webpage') roleDescription = "extending an existing webpage layout with a new section";
    if (contentType === 'document') roleDescription = "extending an existing document with a new section/page";
    if (contentType === 'social') roleDescription = "extending an existing social media carousel with a new post";

    const systemPrompt = `You are an assistant ${roleDescription}. 
Review the deck_context array to understand what has already been covered. 
Generate ONLY ONE new section/slide object in JSON matching the requested user instruction. 
Do not repeat the layout type of the previous section.
Supported slide_types: comparison, timeline, stat_callout, grid_list, default.

Return ONLY a single valid JSON object representing the new slide matching the appropriate schema for its slide_type. DO NOT return an array, just the object.
Example:
{
  "slide_number": 5,
  "slide_type": "comparison",
  "title": "New Comparison",
  "column_left": { "title": "A", "bullets": ["1"] },
  "column_right": { "title": "B", "bullets": ["2"] }
}`;

    const prompt = `Context of existing slides:
${contextText}

User instruction: ${userInstruction}`;

    const response = await openai.chat.completions.create({
        model: modelName || 'llama3.2',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        temperature: 0.7
    });

    if (!response || !response.choices || !response.choices[0]) {
        throw new Error("Invalid response from local LLM.");
    }

    let content = response.choices[0].message?.content || "";
    content = content.trim();
    try {
        if (content.startsWith('```json')) {
            content = content.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (content.startsWith('```')) {
            content = content.replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(content);
    } catch (e) {
        throw new Error("LLM returned malformed JSON: " + e.message);
    }
}

const REQUIRED_KEYS = {
    "title_hero": ["title"],
    "standard_text": ["title", "bullets"],
    "comparison": ["title", "column_left", "column_right"],
    "bento_grid": ["title", "items"],
    "two_column_image": ["title", "bullets"],
    "chart_pie": ["title", "chart_data"],
    "data_table": ["title", "table_data"]
};

function validateSlides(slidesJson) {
    const brokenSlides = [];
    if (!slidesJson || !Array.isArray(slidesJson)) return brokenSlides;

    slidesJson.forEach((slide, index) => {
        const slideType = slide.slide_type || "standard_text";
        const required = REQUIRED_KEYS[slideType] || ["title"];

        const missingKeys = required.filter(key => {
            if (!(key in slide)) return true;
            const val = slide[key];
            if (val === null || val === undefined) return true;
            if (typeof val === "string" && val.trim() === "") return true;
            if (Array.isArray(val) && val.length === 0) return true;
            if (typeof val === "object" && !Array.isArray(val) && Object.keys(val).length === 0) return true;

            if (key === "column_left" || key === "column_right") {
                if (!val.title || typeof val.title !== "string" || val.title.trim() === "") return true;
                if (!val.bullets || !Array.isArray(val.bullets) || val.bullets.length === 0) return true;
            }
            if (key === "chart_data") {
                if (!val.labels || val.labels.length === 0 || !val.values || val.values.length === 0) return true;
            }
            if (key === "table_data") {
                if (!val.headers || val.headers.length === 0 || !val.rows || val.rows.length === 0) return true;
            }
            return false;
        });

        if (missingKeys.length > 0) {
            brokenSlides.push({
                index: index + 1,
                slide_type: slideType,
                missing: missingKeys
            });
        }
    });
    return brokenSlides;
}

module.exports = {
    generateJsonSlides,
    generateIncrementalSlide,
    validateSlides,
    generateSlides,
    REQUIRED_KEYS
};
