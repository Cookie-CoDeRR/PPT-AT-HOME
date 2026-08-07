const OpenAI = require('openai');

async function healSlide(slide, missingKeys, contentConfig = {}) {
    let finalBaseUrl = contentConfig.baseUrl || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }

    const openai = new OpenAI({
        baseURL: finalBaseUrl,
        apiKey: contentConfig.apiKey || 'local',
    });

    const prompt = `You are a strict JSON auto-healer. The following slide object of type "${slide.slide_type}" is missing the following required keys: ${missingKeys.join(', ')}.
Please regenerate this SINGLE slide object, ensuring all required keys are filled with appropriate content based on the existing title/context.
Do not wrap in markdown. Return ONLY valid JSON for this single object.

Broken Slide:
${JSON.stringify(slide, null, 2)}`;

    try {
        const response = await openai.chat.completions.create({
            model: contentConfig.model || 'llama3.2',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1500,
            response_format: { type: "text" }
        });

        const content = response.choices[0].message?.content || "";
        
        // Strip markdown code blocks
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        
        if (match) {
            return JSON.parse(match[0]);
        }
        return null;
    } catch (e) {
        console.error("Healer failed:", e.message);
        return null;
    }
}

function injectFallbacks(slide, missingKeys) {
    const healed = { ...slide };
    for (const key of missingKeys) {
        if (key === 'col_a' || key === 'column_left') {
            healed.column_left = { title: "Content Unavailable", bullets: ["Please retry generation."] };
        } else if (key === 'col_b' || key === 'column_right') {
            healed.column_right = { title: "Content Unavailable", bullets: ["Please retry generation."] };
        } else if (key === 'items') {
            healed.items = [{ title: "Item 1", desc: "Unavailable", size: "large" }];
        } else if (key === 'bullets') {
            healed.bullets = ["Content generation unavailable for this slide."];
        } else if (key === 'chart_data') {
            healed.chart_data = { labels: ["A", "B"], values: [50, 50] };
        } else if (key === 'table_data') {
            healed.table_data = { headers: ["Col1"], rows: [["Unavailable"]] };
        } else if (key === 'metrics') {
            healed.metrics = [{ label: "N/A", value: "0", change: "0" }];
        } else if (key === 'steps') {
            healed.steps = [{ step: "1", text: "Unavailable" }];
        } else {
            healed[key] = "Content unavailable";
        }
    }
    return healed;
}

async function validateAndHeal(rawSlidesJson, contentConfig = {}) {
    const slides = rawSlidesJson.slides || [];
    const validatedSlides = [];

    for (let i = 0; i < slides.length; i++) {
        let slide = slides[i];
        let missingKeys = [];

        // Validate based on layout rules
        if (slide.slide_type === 'comparison' || slide.slide_type === 'two_column_image') {
            if (!slide.column_left && !slide.col_a) missingKeys.push('column_left');
            if (!slide.column_right && !slide.col_b) missingKeys.push('column_right');
        }
        if (slide.slide_type === 'bento_grid' || slide.slide_type === 'grid_list') {
            if (!slide.items || !Array.isArray(slide.items) || slide.items.length === 0) missingKeys.push('items');
        }
        if (slide.slide_type === 'standard_text') {
            if (!slide.bullets || !Array.isArray(slide.bullets) || slide.bullets.length === 0) missingKeys.push('bullets');
        }
        if (slide.slide_type === 'chart_pie' || slide.slide_type === 'chart_bar') {
            if (!slide.chart_data) missingKeys.push('chart_data');
        }
        if (slide.slide_type === 'data_table') {
            if (!slide.table_data) missingKeys.push('table_data');
        }

        if (missingKeys.length > 0) {
            console.warn(`[JSONHealer] Slide ${i+1} (${slide.slide_type}) missing fields: ${missingKeys.join(', ')}. Attempting heal...`);
            
            let healedSlide = null;
            let attempts = 0;
            while (attempts < 3 && !healedSlide) {
                healedSlide = await healSlide(slide, missingKeys, contentConfig);
                attempts++;
            }

            if (healedSlide) {
                console.log(`[JSONHealer] Slide ${i+1} successfully healed.`);
                validatedSlides.push(healedSlide);
            } else {
                console.error(`[JSONHealer] Slide ${i+1} auto-healing failed after 3 attempts. Injecting fallbacks.`);
                validatedSlides.push(injectFallbacks(slide, missingKeys));
            }
        } else {
            validatedSlides.push(slide);
        }
    }

    return { ...rawSlidesJson, slides: validatedSlides };
}

module.exports = {
    validateAndHeal
};
