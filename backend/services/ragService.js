const fs = require('fs');
const pdf = require('pdf-parse');
const officeParser = require('officeparser');
const lancedb = require('@lancedb/lancedb');
const path = require('path');
const OpenAI = require('openai');

const DB_PATH = path.join(__dirname, '..', '.lancedb');
const TABLE_NAME = 'documents';

async function getDb() {
    return await lancedb.connect(DB_PATH);
}

// Ensure base URL ends with /v1
function normalizeBaseUrl(baseUrl) {
    let finalBaseUrl = baseUrl || 'http://127.0.0.1:1234/v1';
    if (!finalBaseUrl.endsWith('/v1') && !finalBaseUrl.endsWith('/api')) {
        finalBaseUrl = finalBaseUrl.replace(/\/$/, '') + '/v1';
    }
    return finalBaseUrl;
}

// Generate embedding using local LLM
async function createEmbedding(text, baseUrl, model = 'nomic-embed-text') {
    const finalBaseUrl = normalizeBaseUrl(baseUrl);
    const openai = new OpenAI({ baseURL: finalBaseUrl, apiKey: 'local' });
    
    try {
        const res = await openai.embeddings.create({
            model: model,
            input: text
        });
        return res.data[0].embedding;
    } catch (e) {
        console.error("Embedding failed:", e.message);
        throw new Error("Failed to generate embedding. Make sure your local server is running and supports the /v1/embeddings endpoint (e.g. nomic-embed-text).");
    }
}

// Chunk text into smaller segments
function chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

// Extract text from file buffer
async function extractText(mimetype, buffer, originalname) {
    const ext = originalname ? path.extname(originalname).toLowerCase() : '';
    
    if (mimetype === 'application/pdf' || ext === '.pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || 
        ext === '.pptx'
    ) {
        return await officeParser.parseOffice(buffer);
    } else if (
        mimetype === 'text/plain' || 
        mimetype === 'text/markdown' || 
        ext === '.txt' || 
        ext === '.md'
    ) {
        return buffer.toString('utf-8');
    }
    throw new Error('Unsupported file type');
}

// Process a file and store in LanceDB
async function processAndStoreDocument(file, baseUrl) {
    const text = await extractText(file.mimetype, file.buffer, file.originalname);
    const chunks = chunkText(text);
    
    const db = await getDb();
    const dataToInsert = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Only embed meaningful chunks
        if (chunk.trim().length < 10) continue;
        
        const embedding = await createEmbedding(chunk, baseUrl);
        dataToInsert.push({
            id: `${file.originalname}-${i}-${Date.now()}`,
            vector: embedding,
            text: chunk,
            source: file.originalname
        });
    }

    if (dataToInsert.length > 0) {
        try {
            // Check if table exists
            const tables = await db.tableNames();
            if (tables.includes(TABLE_NAME)) {
                const table = await db.openTable(TABLE_NAME);
                await table.add(dataToInsert);
            } else {
                await db.createTable(TABLE_NAME, dataToInsert);
            }
        } catch (e) {
            console.error("LanceDB error:", e);
            throw new Error("Failed to store embeddings in local database.");
        }
    }
    
    return { success: true, chunksProcessed: dataToInsert.length };
}

// Retrieve relevant context
async function searchContext(query, baseUrl, k = 3) {
    try {
        const db = await getDb();
        const tables = await db.tableNames();
        if (!tables.includes(TABLE_NAME)) return ""; // No docs uploaded yet
        
        const table = await db.openTable(TABLE_NAME);
        const queryEmbedding = await createEmbedding(query, baseUrl);
        
        const results = await table.search(queryEmbedding).limit(k).execute();
        
        if (results && results.length > 0) {
            return results.map(r => r.text).join('\n\n---\n\n');
        }
        return "";
    } catch (e) {
        console.error("Search context error:", e);
        return ""; // Fail gracefully if DB fails, allow standard generation
    }
}

module.exports = {
    processAndStoreDocument,
    searchContext
};
