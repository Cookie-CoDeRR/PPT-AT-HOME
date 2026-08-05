const axios = require('axios');

/**
 * Formats user instruction into Alpaca prompt structure matching fine-tuning
 */
const ALPACA_TEMPLATE = (instruction) => 
`Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
${instruction}

### Input:


### Response:
`;

/**
 * Queries local LM Studio instance to fetch structural slide layout array
 * @param {string} userPrompt - User presentation topic/description
 * @param {number} slideCount - Target number of slides requested
 * @returns {Promise<Array<string>>} Array of slide_type strings
 */
async function getLayoutSequence(userPrompt, slideCount = 5) {
    const formattedInstruction = `Output a JSON array of slide types for a ${slideCount}-slide presentation covering ${userPrompt}.`;
    const fullPrompt = ALPACA_TEMPLATE(formattedInstruction);

    try {
        const response = await axios.post(
            process.env.ROUTER_MODEL_URL || 'http://127.0.0.1:1234/v1/chat/completions',
            {
                model: process.env.ROUTER_MODEL_NAME || 'CustomModel/PPT_Qwen',
                messages: [
                    { role: "user", content: fullPrompt }
                ],
                temperature: 0.1, // Low temp for deterministic JSON output
                max_tokens: 128,
                stream: false
            },
            { timeout: 5000 } // Fast 5s timeout
        );

        const rawOutput = response.data.choices[0].message.content;
        
        // Extract raw JSON array matching brackets
        const jsonMatch = rawOutput.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("Model response did not contain a valid JSON array string");
        }

        const layoutSequence = JSON.parse(jsonMatch[0]);

        if (!Array.isArray(layoutSequence) || layoutSequence.length === 0) {
            throw new Error("Parsed layout sequence is empty or invalid");
        }

        console.log(`[Router Success] Predicted ${layoutSequence.length} slide blueprint:`, layoutSequence);
        return layoutSequence;

    } catch (error) {
        console.warn(`[Router Warning] LM Studio call failed (${error.message}). Falling back to default layout.`);
        
        // Defensive fallback layout sequence matching slideCount
        const defaultPool = ["title_hero", "bento_grid", "two_column_image", "comparison", "standard_text"];
        return Array.from({ length: slideCount }, (_, i) => defaultPool[i % defaultPool.length]);
    }
}

module.exports = { getLayoutSequence };
