const { generateSlideContent } = require('./backend/services/llmService');
const blueprint = [
    {"slide_type": "standard_text"},
    {"slide_type": "title_hero"},
    {"slide_type": "two_column_image"},
    {"slide_type": "comparison"},
    {"slide_type": "standard_text"},
    {"slide_type": "standard_text"},
    {"slide_type": "standard_text"},
    {"slide_type": "standard_text"},
    {"slide_type": "standard_text"},
    {"slide_type": "standard_text"}
];
async function run() {
    try {
        const result = await generateSlideContent("From consultant to thought leader (my 6-month roadmap)", blueprint, "http://localhost:1234/v1", "CustomModel/PPT_Qwen", 0.3, "");
        console.log("Success:", result.length);
    } catch(e) {
        console.error("Failed:", e.message);
    }
}
run();
