# Frontend Integration Guide & Updates

This document outlines the required frontend updates to integrate with the latest backend API changes. 

## 1. Image Style Selection
The frontend selection UI needs to support image styles:
- **On load:** Call `GET /api/image-styles` to populate the image style picker.
- **On generate:** Include `imageStyle: "<id>"` in the JSON body when calling `POST /api/generate-pptx` (and `POST /api/preview`).

## 2. Web Search Integration (RAG)
- **UI Update:** Add a "Web Search" toggle in the generation form.
- **API Update:** When enabled, send `useWebRag: true` in the `POST /api/generate-json` body.

## 3. Accurate Slide Preview (WYSIWYG) - NEW ✨
To solve the visual mismatch between the React preview and the actual downloaded PPTX, the backend now provides a true WYSIWYG preview using LibreOffice headless rendering.

### API Contract

**`POST /api/preview`**
Accepts the exact same JSON body as `POST /api/generate-pptx`.

**Request Body:**
```json
{
  "slides": [...],
  "title": "My Presentation",
  "theme": "Modern Clean",
  "slideSize": "LAYOUT_16x9",
  "customBackground": null,
  "customTheme": null,
  "imageStyle": "isometric_3d"
}
```

**Response:**
```json
{
  "hash": "abc123def456...",
  "slides": [
    { "index": 0, "url": "/api/preview/abc123def456/0" },
    { "index": 1, "url": "/api/preview/abc123def456/1" }
  ]
}
```

**`GET /api/preview/:hash/:slideIndex`**
Returns the `image/png` preview for that specific slide.

### Action Required for Workspace.jsx
1. **Trigger Preview:** After slides are generated (or when a user clicks a "Preview Accurate" button), send a request to `POST /api/preview`.
2. **Render Previews:** Map the returned `url`s to each slide card. Show these PNGs inside the slide card containers. You can either replace the `<SlideRenderer>` React components entirely or display the PNG as an overlay above them.

## 4. Pending Frontend Fixes (Refer to pptx_audit.md)
- **SlideRenderer missing handlers:** Issues 1 and 5 from the audit involve missing slide type handlers in `SlideRenderer.jsx` (e.g., `title_hero`, `two_column_image`). These need to be added to the React frontend to properly map to the new layouts, especially if the React preview is used alongside the new LibreOffice accurate preview.

---

### Priority Order for Backend (Internal Reference):
1. ✅ Accept and log `contentType` in `/api/generate-json`
2. ✅ Implement `pasteMode` switching in `llmService.js`
3. ⬜ Add `graphic` content type routing to an image generation service
4. ⬜ Adjust LLM prompts for `webpage`, `document`, `social`
