# Backend Update: Webpage, Document, Social, Graphic & Paste-in-Text Support

> **For Backend Engineers:** The frontend has been significantly updated. This document is the **single source of truth** for all API changes needed to make the frontend work end-to-end.

---

## Summary of New Frontend Pages

> [!IMPORTANT]
> **`PasteTextLauncher.jsx` is now the default start/greeting page** — the first screen users see when the app loads (`view` starts as `'paste'` in `App.jsx`).

| Page | Component | Route Trigger | Status |
|------|-----------|--------------|--------|
| **Paste in Text** ⭐ (Start Page) | `PasteTextLauncher.jsx` | **App default view** | 🆕 New — now the greeting page |
| Generate (AI prompt) | `CreationLauncher.jsx` | Home → "Generate" | ✅ Existing, extended |
| Home | `HomePage.jsx` | Logo click / Back buttons | ✅ Existing |
| Create from Template | `WizardForm.jsx` | Home → "Create from template" | ✅ Existing |
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

### Priority Order for Backend:
1. ✅ Accept and log `contentType` in `/api/generate-json`
2. ✅ Implement `pasteMode` switching in `llmService.js`
3. ⬜ Add `graphic` content type routing to an image generation service
4. ⬜ Adjust LLM prompts for `webpage`, `document`, `social`
