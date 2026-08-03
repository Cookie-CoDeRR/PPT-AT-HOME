# Backend Update: Webpage, Document & Social Generation Support

> **For Backend Engineers:** The frontend has been updated to support three new generation modes: **Webpage**, **Document**, and **Social** (previously only Presentation was supported). The `CreationLauncher` now passes new fields in the `POST /api/generate-json` request when `contentType === 'webpage'`, `'document'`, or `'social'`.

Please update the backend API to handle these new content types.

---

## 1. API Changes: `POST /api/generate-json`

### New Request Payload

When the user selects **Webpage**, **Document**, or **Social**, the payload will look like this:

```json
{
  "prompt": "Landing page for a healthcare consultant...",
  "contentType": "webpage",           // NEW: 'presentation', 'webpage', 'document', or 'social'
  "slideCount": 10,                   // Represents "Sections" instead of slides for webpage/document
  "language": "English (UK)",         // NEW: Present if contentType is 'webpage', 'document', or 'social'
  "slideSize": "LAYOUT_9x16",         // 'Default', 'A4', 'US Letter' for doc; 'LAYOUT_9x16' default for social
  "model": "deepseek-coder-v2-lite-instruct-mlx",
  "temperature": 0.6,
  "baseUrl": "http://127.0.0.1:1234/v1"
}
```

### Action Required:
1. Update `backend/server.js` or `backend/services/llmService.js` to accept `contentType` and `language`.
2. If `contentType === 'webpage'`, adjust the LLM system prompt to generate a single continuous JSON object representing a webpage (e.g. hero section, features, footer).
3. If `contentType === 'document'`, adjust the LLM system prompt to generate a document structure (e.g. headers, paragraphs, lists) rather than presentation slides. Note that `slideSize` will pass values like "Default", "A4", or "US Letter" for documents.
4. If `contentType === 'social'`, the LLM system prompt should focus on highly engaging, concise, vertical format content (e.g., carousel posts, threads). Note that `slideSize` will default to `"LAYOUT_9x16"`.
5. The LLM response should still conform to a format the frontend can render in the workspace. You may need to map these "sections" into the existing `slides_json` structure temporarily.

---

## 2. API Changes: `POST /api/generate-incremental`

### Action Required:
If the user is in a Webpage, Document, or Social workspace and asks the AI to edit it, the backend should be aware of the `contentType` to maintain the correct structural flow rather than breaking it into standard presentation slides.

---

## 3. Next Steps (Discussion)

Currently, the frontend's `Workspace.jsx` and the backend's Python exporter (`export_pptx.py`) are hardcoded for PowerPoint presentations. 

We need to discuss:
- **Exporting:** How should a generated webpage be exported? (e.g., download as HTML/CSS/JS zip, deploy to Vercel?) How should a document be exported? (e.g., download as PDF/DOCX?) Social posts? (e.g. download as a zip of 9x16 JPEGs).
- **Workspace UI:** The frontend currently renders discrete "slides". A future frontend PR will introduce continuous scrolling views for Webpages and Documents (`WebpageWorkspace.jsx`, `DocumentWorkspace.jsx`). Social posts can likely reuse the slide workspace, just locked to 9x16.

For now, the priority is updating the LLM prompts in `/api/generate-json` to support `contentType === 'webpage'`, `'document'`, and `'social'`.
