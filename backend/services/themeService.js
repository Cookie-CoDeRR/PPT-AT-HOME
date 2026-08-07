const axios = require('axios');

const THEME_SCHEMA = {
    type: "json_schema",
    json_schema: {
        name: "color_theme",
        strict: true,
        schema: {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                bg: { type: "string" },
                cardBg: { type: "string" },
                cardBorder: { type: "string" },
                textPrimary: { type: "string" },
                textSecondary: { type: "string" },
                accent: { type: "string" },
                fontFace: { type: "string" },
                bodyFontFace: { type: "string" }
            },
            required: ["id", "name", "bg", "cardBg", "cardBorder", "textPrimary", "textSecondary", "accent", "fontFace", "bodyFontFace"],
            additionalProperties: false
        }
    }
};

async function generateDynamicTheme(userPrompt, baseUrl, modelName) {
    const finalBaseUrl = baseUrl || process.env.CONTENT_MODEL_URL || 'http://127.0.0.1:1234/v1/chat/completions';
    const formattedBaseUrl = (finalBaseUrl.endsWith('/v1') || finalBaseUrl.endsWith('/api')) 
        ? finalBaseUrl.replace(/\/$/, '') + '/chat/completions' 
        : finalBaseUrl;
    const finalModelName = modelName || process.env.CONTENT_MODEL_NAME || 'gemma-4-e4b';

    const systemPrompt = `You are an expert UI/UX designer and color theorist.
Given a presentation topic, generate a beautiful, cohesive, and highly professional color palette for it.

CRITICAL INSTRUCTIONS:
- You must output raw HEX codes WITHOUT the '#' symbol (e.g., "1E293B", not "#1E293B").
- 'bg' should be the main background color (usually very dark or very light).
- 'cardBg' should contrast slightly with 'bg' (for cards/containers).
- 'cardBorder' should be a subtle border color.
- 'textPrimary' must have high contrast against 'bg' and 'cardBg' (e.g., white/very light on dark bg, or very dark on light bg).
- 'textSecondary' should be a muted version of textPrimary.
- 'accent' should be a vibrant, eye-catching color that pops against the background, used for highlights and buttons.
- For fonts, use modern Google fonts like 'Inter', 'Roboto', 'Playfair Display', 'Space Grotesk', etc.

Generate a unique theme specifically tailored to the topic. Do not just use standard grays; inject subtle hues into the backgrounds!`;

    const prompt = `Topic: "${userPrompt}"\nGenerate the custom color palette json.`;

    try {
        console.log(`[Theme Engine] 🎨 Generating custom color palette for topic: "${userPrompt}"...`);
        const response = await axios.post(
            formattedBaseUrl,
            {
                model: finalModelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                temperature: 0.8,
                max_tokens: 300,
                stream: false,
                response_format: THEME_SCHEMA
            }
        );

        let rawOutput;
        if (response.data.choices && response.data.choices[0]?.message) {
            rawOutput = response.data.choices[0].message.content;
        } else {
            rawOutput = JSON.stringify(response.data);
        }

        const objectMatch = rawOutput.match(/\{[\s\S]*\}/);
        if (!objectMatch) throw new Error("No JSON object found in theme output");
        
        let theme = JSON.parse(objectMatch[0]);
        
        // Strip any accidental '#' that the LLM might have included despite instructions
        ['bg', 'cardBg', 'cardBorder', 'textPrimary', 'textSecondary', 'accent'].forEach(key => {
            if (theme[key] && theme[key].startsWith('#')) {
                theme[key] = theme[key].substring(1);
            }
        });
        
        theme.id = "dynamic_" + Date.now();
        console.log(`[Theme Engine] 🎨 Generated theme: ${theme.name} (Accent: #${theme.accent})`);
        
        return theme;
    } catch (error) {
        console.error(`[Theme Engine Error] Failed to generate dynamic theme, falling back to default:`, error.message);
        const { THEMES } = require('../shared/themeEngine');
        return THEMES.dark_glass;
    }
}

module.exports = { generateDynamicTheme };
