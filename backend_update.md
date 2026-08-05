# Backend Update: Template Picker, Paste-in-Text, Webpage, Document, Social & Graphic Support

> **For Backend Engineers:** The frontend has been significantly updated. This document is the **single source of truth** for all API changes needed to make the frontend work end-to-end.

---

## Summary of New Frontend Pages

> [!IMPORTANT]
> **`ImportLauncher.jsx` is now the default start/greeting page** — the first screen users see when the app loads (`view` starts as `'import'` in `App.jsx`). It shows three cards: Upload a file, Import from Drive, Import from URL.

| Page | Component | Route Trigger | Status |
|------|-----------|--------------|--------|
| **Import with AI** ⭐ (Start Page) | `ImportLauncher.jsx` | **App default view** | 🆕 New — now the greeting page |
| **Choose a template** | `TemplatePicker.jsx` | Home → "Create from template" | 🆕 New |
| **Paste in Text** | `PasteTextLauncher.jsx` | Home → "Paste in text" | ✅ Existing |
| Generate (AI prompt) | `CreationLauncher.jsx` | Home → "Generate" | ✅ Existing, extended |
| Home | `HomePage.jsx` | Logo click / Back buttons | ✅ Existing |
| Workspace | `Workspace.jsx` | After generation | ✅ Existing |

---

## 1. API Changes: `POST /api/generate-json`

### Current Signature (backend receives today):
```json
{
  "prompt": "string",
  "slideCount": 10,
  "tone": "Professional/Corporate",
  "baseUrl": "http://127.0.0.1:1234/v1",
  "model": "model-name",
  "useRag": false,
  "theme": "Modern Dark Tech",
  "density": "Detailed",
  "includeImages": true,
  "referenceImage": "base64...",
  "temperature": 0.6
}
```

### NEW Fields Added by Frontend:

```json
{
  "contentType": "graphic",           // NEW: 'presentation' | 'webpage' | 'document' | 'social' | 'graphic'
  "slideCount": 10,                   // Represents "Sections" for webpage/document
  "language": "English (UK)",         // Present when contentType is 'webpage', 'document', or 'social'
  "slideSize": "1:1",                 // For graphic: aspect ratio ('1:1','16:9','9:16','4:3'). For doc: 'Default'|'A4'|'US Letter'. For presentation: 'LAYOUT_16x9'|'LAYOUT_9x16'
  "graphicStyle": "scene",            // Only present if contentType='graphic'. Values: 'none'|'scene'|'illustration'|'flat_line_art'|'technical_line'|'modern_art'
  "graphicCount": 3,                  // Only present if contentType='graphic'. Number of images (1-4)
  "graphicQuality": "Standard",       // Only present if contentType='graphic'. Values: 'Standard'|'HD'
  "pasteMode": "generate_outline"     // Only present from PasteTextLauncher. Values: 'generate_outline'|'summarize'|'preserve'
}
```

### Required Backend Logic per `contentType`:

| `contentType`   | LLM behaviour | Response format |
|-----------------|--------------|-----------------|
| `presentation`  | Default — generate slide deck | `slides_json` |
| `webpage`       | Generate webpage sections (hero, features, footer, etc.) | `slides_json` (temporary mapping) |
| `document`      | Generate document structure (headings, paragraphs, lists) | `slides_json` (temporary mapping) |
| `social`        | Generate short, punchy vertical-format carousel content | `slides_json` |
| `graphic`       | **Route to Image Generation API** (DALL-E, SD, etc.) — NOT an LLM text prompt | Custom response (TBD) |

---

## 2. NEW: `pasteMode` — "Paste in Text" Flow

A brand new page `PasteTextLauncher.jsx` allows users to paste raw notes/text and choose how to process it.

### Payload sent by `PasteTextLauncher`:
```json
{
  "prompt": "Intro to our new strategy\n• Key point 1\n• Key point 2\n\n———\n\nKey metrics from Q1\n• Key point 1...",
  "pasteMode": "generate_outline",
  "contentType": "presentation",
  "slideCount": 10,
  "tone": "Professional/Corporate",
  "theme": "Modern Dark Tech",
  "templateType": "default",
  "density": "Detailed",
  "includeImages": true
}
```

### `pasteMode` Values and Required LLM Behaviour:

| `pasteMode`        | What the LLM should do |
|--------------------|------------------------|
| `generate_outline` | Treat the text as rough notes/bullets. **Expand** each section into full, polished slide content. |
| `summarize`        | **Condense** the pasted content. Shorten long text, extract key ideas only, lay out across slides. |
| `preserve`         | **Preserve exact wording**. Do NOT rephrase. Just structure it into slides exactly as written. |

### Section Separator Handling:
If the user's prompt contains `———` (three em-dashes on their own line), each block should map to **exactly one slide**. Split the string on `———` before sending to the LLM, using each chunk as the source material for one slide.

### Action Required:
1. In `backend/services/llmService.js`, read `pasteMode` in `generateJsonSlides` (or create `generateFromPastedText`).
2. Switch the LLM **system prompt** based on `pasteMode` (expand / condense / preserve).
3. If prompt contains `———`, split it and process each chunk as one slide's material.
4. Response format is the same `slides_json` structure as normal.

---

## 3. API Changes: `POST /api/generate-incremental`

If the user is in a Webpage, Document, or Social workspace and asks the AI to edit it, the backend should be aware of `contentType` to maintain the correct structural flow. For Graphic, incremental edits may mean img2img prompting or inpainting.

---

## 4. Next Steps (Discussion Points)

- **Exporting:** Webpage → HTML/CSS zip or Vercel deploy? Document → PDF/DOCX? Social → zip of 9x16 JPEGs?
- **Workspace UI:** Future PRs will add `WebpageWorkspace.jsx` and `DocumentWorkspace.jsx`. Graphic workspace will need a grid view for image results.
- **Paste Flow Routing:** Currently "Continue to prompt editor" calls `handleGenerateJson` directly. Future iteration should add a prompt-editor step where users can refine before generating.

---

## 5. NEW: `GET /api/templates` — Template Picker Page

`TemplatePicker.jsx` is now the **start/greeting page**. It currently uses hardcoded static data. Once this endpoint is ready, replace the static arrays in the component.

### Required Response Format:
```json
[
  {
    "id": "t1",
    "name": "Best Practices Guide",
    "category": "Company",
    "tab": "templates",
    "thumbnailUrl": "https://...",
    "dark": true
  },
  {
    "id": "w1",
    "name": "Sales Incentive Kickoff",
    "category": "Sales",
    "tab": "workspace",
    "thumbnailUrl": "https://...",
    "dark": true
  }
]
```

### Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| `tab` | `'templates'` \| `'workspace'` | Filter by tab type |
| `category` | string | Filter by category name |
| `q` | string | Search query |
| `sort` | `'recommended'` \| `'newest'` \| `'most_used'` | Sort order |

### Categories used by frontend:
`Company`, `Creative`, `Education`, `Reporting`, `Project Management`, `Fundraising`, `Sales`, `Marketing`, `Consulting`, `People`, `Strategy`

### When a template is selected:
The frontend calls `POST /api/generate-json` with:
```json
{
  "prompt": "Create a Best Practices Guide presentation",
  "contentType": "presentation",
  "templateId": "t1",
  "templateName": "Best Practices Guide",
  "slideCount": 10,
  "tone": "Professional/Corporate",
  "theme": "Modern Minimalist",
  "templateType": "default",
  "density": "Detailed",
  "includeImages": true
}
```
The backend should use `templateId` to optionally look up a pre-defined slide structure or system prompt for that template.

### Priority Order for Backend:
1. 🔴 `POST /api/import/file` — file upload + text extraction
2. 🔴 `POST /api/import/url` — URL scraping + text extraction
3. 🔴 Create `GET /api/templates` returning the JSON array above
4. 🔴 Implement `pasteMode` switching in `llmService.js`
5. 🟡 `GET /api/import/drive` — Google Drive OAuth + Docs export
6. 🟡 Accept `templateId` in `POST /api/generate-json` for template-specific prompts
7. 🟡 Add `graphic` content type routing to an image generation service
8. ⬜ Adjust LLM prompts for `webpage`, `document`, `social`

---

## 6. NEW: Import with AI — `ImportLauncher.jsx` (Default Start Page)

The app now opens on the **"Import with AI"** page. Users see three cards:

### Card 1 — Upload a file

**Accepted file types:** `.pdf`, `.doc`, `.docx`, `.pptx`, `.txt`

```
POST /api/import/file
Content-Type: multipart/form-data

Fields:
  file        (File)    — the uploaded document
```

**Expected response:**
```json
{
  "extractedText": "Full text content of the file...",
  "fileName": "report.pdf",
  "fileType": "pdf",
  "wordCount": 2340
}
```

After extraction, the frontend calls `POST /api/generate-json` with:
```json
{
  "prompt": "Transform the uploaded file into a presentation",
  "contentType": "presentation",
  "importType": "file",
  "importUrl": null,
  "slideCount": 10,
  "tone": "Professional/Corporate",
  "theme": "Modern Minimalist",
  "templateType": "default",
  "density": "Detailed",
  "includeImages": true
}
```

---

### Card 2 — Import from Drive

Currently opens `https://drive.google.com` in a new tab. Backend needs:

```
GET /api/import/drive
```

This endpoint should initiate OAuth flow and return a list of Google Docs the user can select. This can be deferred — the UI currently opens drive.google.com as a placeholder.

---

### Card 3 — Import from URL

User pastes a URL in a modal. Frontend sends:

```
POST /api/import/url
Content-Type: application/json

{
  "url": "https://example.com/blog-post"
}
```

**Expected response:**
```json
{
  "extractedText": "Full scraped text content...",
  "title": "Page Title",
  "sourceUrl": "https://example.com/blog-post",
  "wordCount": 1820
}
```

After extraction, the frontend calls `POST /api/generate-json` with:
```json
{
  "prompt": "Transform the content at https://example.com/blog-post into a presentation",
  "contentType": "presentation",
  "importType": "url",
  "importUrl": "https://example.com/blog-post",
  "slideCount": 10,
  "tone": "Professional/Corporate",
  "theme": "Modern Minimalist",
  "templateType": "default",
  "density": "Detailed",
  "includeImages": true
}
```

---

### Supported Import Types in `POST /api/generate-json`

The `importType` field now accepted by the backend:

| `importType` | Meaning | Backend action |
|---|---|---|
| `"file"` | File was uploaded and extracted | Use `extractedText` from `/api/import/file` as source |
| `"url"` | URL was scraped and extracted | Use `extractedText` from `/api/import/url` as source |
| `"drive"` | Google Docs content | Use Drive API to fetch doc content |
| `null` | Normal prompt-based generation | Default LLM behaviour |

### URL Scraping Notes:
- Supported: public webpages, blog posts, Notion docs (public only)
- Use `cheerio` + `axios` or `playwright` for scraping
- Strip navigation/footer boilerplate, extract main content only
- Respect `robots.txt`
