const OpenAI = require('openai');
const { getBlueprint } = require('./layoutRouter');
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

let previousLayoutSequence = [];

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

    const blueprint = getBlueprint(prompt, slideCount, temperature);
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
   - "title_hero": For intros and transitions (Max 20 words total).
   - "informational": For text-heavy explanations, bullets, and comparisons (Max 60 words total).
   - "data_viz": For charts, tables, and bento grids (Text must be extremely concise, max 10 words per item).

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
        const response = await openai.chat.completions.create({
            model: modelName || 'llama3.2',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: currentPrompt }
            ],
            temperature: 0.7
        });

        if (!response || !response.choices || !response.choices[0]) {
            console.error("Raw LLM Response:", response);
            throw new Error("Invalid response from local LLM. The model may have crashed or returned an empty response.");
        }

        let content = response.choices[0].message?.content || "";
        content = content.trim();
        try {
            if (content.startsWith('```json')) {
                content = content.replace(/^```json/, '').replace(/```$/, '').trim();
            } else if (content.startsWith('```')) {
                content = content.replace(/^```/, '').replace(/```$/, '').trim();
            }
            
            const parsedData = JSON.parse(content);
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
                parsedData.slides = postProcessSlides(parsedData.slides);

                // --- CONCURRENT IMAGE GENERATION PIPELINE ---
                const imagePromises = [];
                parsedData.slides.forEach(slide => {
                    let promptToGenerate = slide.image_prompt || slide.image_search_query;
                    if (promptToGenerate) {
                        imagePromises.push(
                            generateImage(promptToGenerate, graphicStyle, graphicQuality, slideSize)
                                .then(url => { 
                                    slide.image_url = url; 
                                    delete slide.image_prompt; 
                                    delete slide.image_search_query; 
                                })
                        );
                    }
                });
                
                if (imagePromises.length > 0) {
                    await Promise.all(imagePromises);
                }
                // ---------------------------------------------
            }
            return parsedData;
            
        } catch (e) {
            console.error("Error parsing LLM response or retrying:", e);
            if (retryCount >= 2 || !(e instanceof SyntaxError)) {
                throw new Error("LLM returned malformed JSON or failed validation: " + e.message);
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
    for (let i = 1; i < slides.length; i++) {
        if (slides[i].slide_type === slides[i-1].slide_type && slides[i].slide_type !== 'default') {
            const availableTypes = types.filter(t => t !== slides[i-1].slide_type);
            slides[i].slide_type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
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

module.exports = {
    generateJsonSlides,
    generateIncrementalSlide
};
