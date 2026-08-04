const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'logs', 'generation.log');

function logGeneration(prompt, webContext, blueprintSequence) {
    const timestamp = new Date().toISOString();
    const logEntry = `\n======================================================
[${timestamp}] NEW GENERATION
======================================================
USER PROMPT:
${prompt}

RAGS CONTEXT FETCHED:
${webContext ? webContext.trim() : 'None'}

LAYOUT BLUEPRINT USED (Slide by Slide):
${blueprintSequence.map((layout, i) => ` Slide ${i + 1}: ${layout}`).join('\n')}
======================================================\n`;

    fs.appendFile(LOG_FILE, logEntry, (err) => {
        if (err) console.error("[Logger] Failed to write to generation.log", err);
    });
}

module.exports = {
    logGeneration
};
