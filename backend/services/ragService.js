const fs = require('fs');
const pdf = require('pdf-parse');
const officeParser = require('officeparser');
const lancedb = require('@lancedb/lancedb');
const path = require('path');
const OpenAI = require('openai');
const axios = require('axios');
let cheerio;
try { cheerio = require('cheerio'); } catch(e) { cheerio = null; }

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

// ─── Web RAG: Google-style pseudo-RAG ────────────────────────────────────────
// Searches DuckDuckGo, scrapes the top result pages, and returns relevant
// text snippets to inject into the LLM system prompt as grounding context.
async function searchWeb(query, maxResults = 2, maxCharsTotal = 600) {
    try {
        console.log(`[WebRAG] Searching web for: "${query}"`);

        // Step 1: Hit DuckDuckGo HTML search to get result URLs
        const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const ddgRes = await axios.get(ddgUrl, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PPT-AT-HOME/1.0)' }
        });

        let urls = [];
        if (cheerio) {
            const $ = cheerio.load(ddgRes.data);
            $('a.result__url, .result__a').each((i, el) => {
                if (urls.length >= maxResults) return false;
                const href = $(el).attr('href');
                if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                    // Skip known unhelpful domains
                    const skip = ['youtube.com', 'twitter.com', 'facebook.com', 'instagram.com', 'reddit.com'];
                    if (!skip.some(d => href.includes(d))) {
                        urls.push(href);
                    }
                }
            });
            // Also extract from DuckDuckGo redirect links
            if (urls.length === 0) {
                $('a[href]').each((i, el) => {
                    if (urls.length >= maxResults) return false;
                    const href = $(el).attr('href') || '';
                    const uddg = new URLSearchParams(href.split('?')[1] || '').get('uddg');
                    if (uddg && uddg.startsWith('http')) {
                        const skip = ['youtube.com', 'twitter.com', 'facebook.com', 'instagram.com', 'reddit.com'];
                        if (!skip.some(d => uddg.includes(d))) urls.push(uddg);
                    }
                });
            }
        } else {
            // cheerio not available — try to extract URLs with regex
            const matches = ddgRes.data.matchAll(/uddg=([^&"']+)/g);
            for (const m of matches) {
                if (urls.length >= maxResults) break;
                try {
                    const decoded = decodeURIComponent(m[1]);
                    if (decoded.startsWith('http')) urls.push(decoded);
                } catch (_) {}
            }
        }

        console.log(`[WebRAG] Got ${urls.length} URLs from DuckDuckGo`);
        if (urls.length === 0) return "";

        // Step 2: Scrape each URL and extract plain text
        const snippets = [];
        let totalChars = 0;
        const charsPerPage = Math.floor(maxCharsTotal / maxResults);

        for (const url of urls) {
            if (totalChars >= maxCharsTotal) break;
            try {
                const pageRes = await axios.get(url, {
                    timeout: 6000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PPT-AT-HOME/1.0)' },
                    maxContentLength: 500_000   // cap to 500KB per page
                });

                let text = '';
                if (cheerio) {
                    const $ = cheerio.load(pageRes.data);
                    // Remove noisy elements
                    $('script, style, nav, footer, header, aside, noscript, iframe').remove();
                    text = $('body').text().replace(/\s+/g, ' ').trim();
                } else {
                    // Regex-based strip as fallback
                    text = pageRes.data
                        .replace(/<script[\s\S]*?<\/script>/gi, '')
                        .replace(/<style[\s\S]*?<\/style>/gi, '')
                        .replace(/<[^>]+>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                }

                if (text.length > 50) {
                    const snippet = text.slice(0, charsPerPage);
                    snippets.push(`[Source: ${url}]\n${snippet}`);
                    totalChars += snippet.length;
                    console.log(`[WebRAG] Scraped ${snippet.length} chars from ${url}`);
                }
            } catch (pageErr) {
                console.log(`[WebRAG] Skipped ${url}: ${pageErr.message}`);
            }
        }

        if (snippets.length === 0) return "";

        const context = snippets.join('\n\n---\n\n');
        console.log(`[WebRAG] Injecting ${context.length} chars of web context into LLM prompt ✅`);
        return context;

    } catch (e) {
        console.warn(`[WebRAG] Search failed gracefully: ${e.message}`);
        return ""; // Never block generation
    }
}

module.exports = {
    processAndStoreDocument,
    searchContext,
    searchWeb
};
