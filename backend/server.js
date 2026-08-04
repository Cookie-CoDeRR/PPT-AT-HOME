require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateJsonSlides } = require('./services/llmService');
const { generatePptx } = require('./services/pptService');
const OpenAI = require('openai');
const multer = require('multer');
const { google } = require('googleapis');
const { processAndStoreDocument, searchContext, searchWeb } = require('./services/ragService');
const db = require('./database/db');
const axios = require('axios');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Test Connection Endpoint
// Models list Endpoint
app.post('/api/models', async (req, res) => {
    try {
        const { baseUrl } = req.body;
        const targetUrl = baseUrl || 'http://127.0.0.1:1234/v1';
        const fetchUrl = targetUrl.replace('localhost', '127.0.0.1');
        
        const response = await fetch(`${fetchUrl.replace(/\/$/, '')}/models`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const rawJson = await response.json();
        
        let models = [];
        if (rawJson.data && Array.isArray(rawJson.data)) {
            models = rawJson.data;
        } else if (rawJson.models && Array.isArray(rawJson.models)) {
            models = rawJson.models;
        } else if (Array.isArray(rawJson)) {
            models = rawJson;
        }

        res.json({ models });
    } catch (error) {
        console.error("Models fetch error:", error.message);
        res.json({ models: [] });
    }
});

// History Endpoints
app.get('/api/history', (req, res) => {
    try {
        res.json(db.getPresentations());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/history/:id', (req, res) => {
    try {
        const pres = db.getPresentationById(req.params.id);
        if (!pres) return res.status(404).json({ error: 'Not found' });
        res.json(pres);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/history/:id', (req, res) => {
    try {
        db.deletePresentation(req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Mock Online Templates Manifest Endpoint (simulating a GitHub raw manifest)
app.get('/api/mock-manifest.json', (req, res) => {
    res.json([
        { name: 'Modern Dark Tech', download_url: 'https://github.com/cookiecoderr/ppt-templates/raw/main/modern-dark.pptx', thumbnail_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=300' },
        { name: 'Clean Corporate', download_url: 'https://github.com/cookiecoderr/ppt-templates/raw/main/clean-corp.pptx', thumbnail_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300' },
        { name: 'Creative Pop', download_url: 'https://github.com/cookiecoderr/ppt-templates/raw/main/creative-pop.pptx', thumbnail_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=300' }
    ]);
});

// Auto-Discover Endpoint
app.get('/api/discover', async (req, res) => {
    const commonUrls = [
        'http://127.0.0.1:1234/v1' // LM Studio
    ];

    for (const url of commonUrls) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); 
            
            const response = await fetch(`${url}/models`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                let finalModels = [];
                if (data.data && Array.isArray(data.data)) finalModels = data.data;
                else if (data.models && Array.isArray(data.models)) finalModels = data.models;
                else if (Array.isArray(data)) finalModels = data;

                if (finalModels.length > 0) {
                    return res.json({ status: 'found', baseUrl: url, models: finalModels });
                }
            }
        } catch (e) {
            // Ignore connection errors on probing
        }
    }

    res.json({ status: 'not_found' });
});

// Upload Context Endpoint
app.post('/api/upload-context', upload.single('file'), async (req, res) => {
    try {
        const { baseUrl } = req.body;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const result = await processAndStoreDocument(req.file, baseUrl);
        res.json(result);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Generate JSON Slides Endpoint
app.post('/api/generate-json', async (req, res) => {
    try {
        const { prompt, slideCount, tone, baseUrl, model, useRag, useWebRag, theme, density, includeImages, referenceImage, temperature, contentType, language, slideSize, graphicStyle, graphicCount, graphicQuality } = req.body;
        
        if (!prompt || !tone) {
            return res.status(400).json({ error: "Missing required parameters" });
        }

        // Run document RAG and web RAG concurrently if both requested
        let contextText = "";
        const [docContext, webContext] = await Promise.all([
            useRag    ? searchContext(prompt, baseUrl, 3) : Promise.resolve(""),
            useWebRag ? searchWeb(prompt)                : Promise.resolve("")
        ]);

        // Merge: document context first (authoritative), then web context
        if (docContext) contextText += docContext;
        if (webContext) {
            contextText += (contextText ? '\n\n--- Web Search Context ---\n\n' : '') + webContext;
        }

        const slidesJson = await generateJsonSlides(
            prompt, 
            slideCount || 1, 
            tone, 
            baseUrl, 
            model, 
            contextText, 
            density || "Detailed", 
            includeImages || false,
            referenceImage,
            temperature || 0.6,
            contentType || "presentation",
            language,
            slideSize,
            graphicStyle,
            graphicCount,
            graphicQuality
        );
        
        const presTheme = theme || "Modern Minimalist";
        const dbId = db.savePresentation(slidesJson.title || "Untitled Presentation", slidesJson, presTheme);

        res.json({ 
            id: dbId, 
            slides: slidesJson.slides, 
            title: slidesJson.title 
        });
    } catch (error) {
        console.error("Error generating JSON:", error);
        res.status(500).json({ error: error.message });
    }
});

// Generate Incremental Slide Endpoint
app.post('/api/generate-incremental', async (req, res) => {
    try {
        const { contextText, instruction, baseUrl, model, contentType } = req.body;
        
        if (!contextText || !instruction) {
            return res.status(400).json({ error: "Missing context or instruction" });
        }

        const { generateIncrementalSlide } = require('./services/llmService');
        
        const newSlide = await generateIncrementalSlide(
            contextText,
            instruction,
            baseUrl,
            model,
            contentType || 'presentation'
        );
        
        res.json({ slide: newSlide });
    } catch (error) {
        console.error("Error generating incremental slide:", error);
        res.status(500).json({ error: error.message });
    }
});

// Image Style Options Endpoint
app.get('/api/image-styles', (req, res) => {
    const { IMAGE_STYLE_PRESETS } = require('./services/pptService');
    const styles = Object.keys(IMAGE_STYLE_PRESETS).map(key => ({
        id: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        preview: IMAGE_STYLE_PRESETS[key].replace(/^, /, '').split(',')[0]
    }));
    res.json({ styles });
});

// Generate PPTX Endpoint
app.post('/api/generate-pptx', upload.single('template'), async (req, res) => {
    try {
        let slides;
        try {
            slides = JSON.parse(req.body.slides);
        } catch(e) {
            slides = req.body.slides;
        }
        
        const { title, theme, templateType, slideSize, cloudTemplateUrl, customTheme, customBackground, imageStyle } = req.body;
        
        let customThemeObj = null;
        if (customTheme) {
            try { customThemeObj = JSON.parse(customTheme); } catch(e){}
        }
        
        let customBgObj = null;
        if (customBackground) {
            try { customBgObj = JSON.parse(customBackground); } catch(e){}
        }
        
        if (!slides || !Array.isArray(slides)) {
            return res.status(400).json({ error: "Invalid slides data" });
        }

        let pptxBuffer;
        
        if (templateType === 'custom' && req.file) {
            // Save template to temp file for pptx-automizer
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            
            const tempFilePath = path.join(tempDir, `template_${Date.now()}.pptx`);
            fs.writeFileSync(tempFilePath, req.file.buffer);
            
            try {
                const { generateFromTemplate } = require('./services/pptService');
                pptxBuffer = await generateFromTemplate(slides, title, tempFilePath);
            } finally {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
        } else if (templateType === 'online' && cloudTemplateUrl) {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
            
            const tempFilePath = path.join(tempDir, `cloud_template_${Date.now()}.pptx`);
            
            try {
                const downloadRes = await axios.get(cloudTemplateUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(tempFilePath, downloadRes.data);
                const { generateFromTemplate } = require('./services/pptService');
                pptxBuffer = await generateFromTemplate(slides, title, tempFilePath);
            } finally {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
        } else {
            // Default pptxgenjs engine
            const { generatePptx } = require('./services/pptService');
            pptxBuffer = await generatePptx(slides, title, theme, slideSize, customThemeObj, customBgObj, imageStyle);
        }
        
        res.setHeader('Content-Disposition', 'attachment; filename=presentation.pptx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.send(Buffer.from(pptxBuffer));
    } catch (error) {
        console.error("Error generating PPTX:", error);
        res.status(500).json({ error: error.message });
    }
});

// Export to Google Drive Endpoint (Requires OAuth Setup)
app.post('/api/export/drive', upload.single('template'), async (req, res) => {
    try {
        // TO ENABLE GOOGLE DRIVE EXPORT:
        // 1. Go to Google Cloud Console (console.cloud.google.com)
        // 2. Create a Project and enable Google Drive API
        // 3. Create OAuth 2.0 Client IDs
        // 4. Replace these placeholders with your actual Client ID, Secret, and Redirect URI
        const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
        const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
        const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
        const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN_HERE';

        if (CLIENT_ID === 'YOUR_CLIENT_ID_HERE') {
            throw new Error("Google Drive OAuth is not configured. Please see backend/server.js to add your API credentials.");
        }

        const { slides, title, theme, templateType, slideSize, cloudTemplateUrl, customTheme, customBackground, imageStyle } = req.body;
        let slidesJson;
        try {
            slidesJson = typeof slides === 'string' ? JSON.parse(slides) : slides;
        } catch (e) {
            return res.status(400).json({ error: "Invalid slides data" });
        }
        
        let customThemeObj = null;
        if (customTheme) {
            try { customThemeObj = typeof customTheme === 'string' ? JSON.parse(customTheme) : customTheme; } catch(e){}
        }
        
        let customBgObj = null;
        if (customBackground) {
            try { customBgObj = typeof customBackground === 'string' ? JSON.parse(customBackground) : customBackground; } catch(e){}
        }
        
        let pptxBuffer;
        if (templateType === 'custom' && req.file) {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const safeFilename = path.basename(req.file.originalname);
            const templatePath = path.join(tempDir, `custom_template_${Date.now()}_${safeFilename}`);
            
            try {
                fs.writeFileSync(templatePath, req.file.buffer);
                const { generateFromTemplate } = require('./services/pptService');
                pptxBuffer = await generateFromTemplate(slidesJson, title, templatePath);
            } finally {
                if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
            }
        } else if (templateType === 'online' && cloudTemplateUrl) {
            const fs = require('fs');
            const path = require('path');
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const tempFilePath = path.join(tempDir, `cloud_template_${Date.now()}.pptx`);
            
            try {
                const downloadRes = await axios.get(cloudTemplateUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(tempFilePath, downloadRes.data);
                const { generateFromTemplate } = require('./services/pptService');
                pptxBuffer = await generateFromTemplate(slidesJson, title, tempFilePath);
            } finally {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            }
        } else {
            const { generatePptx } = require('./services/pptService');
            pptxBuffer = await generatePptx(slidesJson, title, theme, slideSize, customThemeObj, customBgObj, imageStyle);
        }

        const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
        oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        const fileMetadata = { name: `${title || 'Presentation'}.pptx` };
        const media = {
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            body: require('stream').Readable.from(pptxBuffer)
        };
        
        const driveRes = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id'
        });
        
        res.json({ success: true, driveFileId: driveRes.data.id });
    } catch (error) {
        console.error("Error exporting to Drive:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
