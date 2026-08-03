# Backend Update: Webpage Generation Support

> **For Backend Engineers:** The frontend has been updated to support a new **Webpage** generation mode (previously only Presentation was supported). The `CreationLauncher` now passes new fields in the `POST /api/generate-json` request when `contentType === 'webpage'`.

Please update the backend API to handle this new content type.

---

## 1. API Changes: `POST /api/generate-json`

### New Request Payload

When the user selects **Webpage**, the payload will look like this:

```json
{
  "prompt": "Landing page for a healthcare consultant...",
  "contentType": "webpage",           // NEW: 'presentation' or 'webpage'
  "slideCount": 10,                   // Represents "Sections" instead of slides for webpages
  "language": "English (UK)",         // NEW: Only present if contentType === 'webpage'
  "model": "deepseek-coder-v2-lite-instruct-mlx",
  "temperature": 0.6,
  "baseUrl": "http://127.0.0.1:1234/v1"
  // Note: theme, tone, slideSize will be missing/default for webpages
}
```

### Action Required:
1. Update `backend/server.js` or `backend/services/llmService.js` to accept `contentType` and `language`.
2. If `contentType === 'webpage'`, the LLM system prompt should be adjusted to generate a single continuous JSON object representing a webpage (e.g. hero section, features, testimonials, footer) rather than discrete PowerPoint slides.
3. The LLM response should still conform to a format the frontend can render (the frontend currently expects a `slides` array for rendering in the workspace). You may need to map "webpage sections" into the existing `slides_json` structure temporarily, or we need to align on a new JSON schema for webpages.

---

## 2. API Changes: `POST /api/generate-incremental`

### Action Required:
If the user is in a Webpage workspace and asks the AI to edit it, the backend should be aware of the `contentType` to maintain the webpage structure rather than breaking it into slides.

---

## 3. Next Steps (Discussion)

Currently, the frontend's `Workspace.jsx` and the backend's Python exporter (`export_pptx.py`) are hardcoded for PowerPoint presentations. 

We need to discuss:
- **Exporting:** How should a generated webpage be exported? (e.g., download as HTML/CSS/JS zip, deploy to Vercel/Netlify, or just export a long static image?)
- **Workspace UI:** The frontend currently renders "slides". If the backend returns `slides: [{ type: 'hero' }, { type: 'features' }]`, the frontend will still render them as discrete slides. A future frontend PR will introduce a continuous scrolling `WebpageWorkspace.jsx`.

For now, the priority is updating the LLM prompts in `/api/generate-json` to support `contentType === 'webpage'`.
