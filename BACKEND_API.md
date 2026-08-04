# PPT-AT-HOME — Backend API Reference

> **For backend engineers.** This document describes every API endpoint the frontend currently calls, the expected request/response shapes, which component calls each endpoint, and what still needs to be built or fixed.

---

## Architecture Overview

| Layer | Tech | Purpose |
|---|---|---|
| Backend HTTP | Node.js + Express (`backend/server.js`) | API gateway, orchestration |
| LLM Bridge | OpenAI SDK pointed at local server | Talks to LM Studio / Ollama |
| PPTX Export | Python (`backend/services/export_pptx.py`) via `child_process.spawn` | Renders final `.pptx` |
| RAG Store | LanceDB (`backend/.lancedb/`) | Vector DB for document context |
| History DB | SQLite via `better-sqlite3` (`backend/data/history.db`) | Saves generated presentations |
| Image Gen | Python Flask (`python_image_service/app.py`) on port `5000` | Local Stable Diffusion fallback |

**Base URL (frontend hardcoded):** `http://localhost:3000`

---

## Endpoints

### 1. `GET /api/discover`
**Called by:** `App.jsx` on mount (auto-discovery of local LLM)

**Purpose:** Probes known local LLM ports and returns the first one that responds with models.

**Response:**
```json
// Found
{ "status": "found", "baseUrl": "http://127.0.0.1:1234/v1", "models": [...] }

// Not found
{ "status": "not_found" }
```

**Status:** ✅ Implemented. Only probes LM Studio (`1234`). Add Ollama (`11434`) if needed.

---

### 2. `POST /api/models`
**Called by:** `CreationLauncher.jsx` on mount to populate model dropdown

**Request:**
```json
{ "baseUrl": "http://127.0.0.1:1234/v1" }
```

**Response:**
```json
{
  "models": [
    { "id": "deepseek-coder-v2-lite-instruct-mlx", "name": "deepseek-coder-v2-lite-instruct-mlx" }
  ]
}
```

> The frontend reads either `m.name` or `m.id` per model object.

**Status:** ✅ Implemented. Handles both LM Studio (`data[]`) and Ollama (`models[]`) response shapes.

---

### 3. `POST /api/generate-json`
**Called by:** `App.jsx → handleGenerateJson` (triggered by CreationLauncher or WizardForm submit)

**Request body (JSON):**
```json
{
  "prompt": "string — user topic or outline",
  "slideCount": 5,
  "tone": "Professional/Corporate | Academic | Creative",
  "theme": "Modern Dark Tech",
  "density": "Bullet Points Only | Detailed | Comprehensive",
  "includeImages": true,
  "useRag": false,
  "useWebRag": false,
  "templateType": "default",
  "slideSize": "LAYOUT_16x9",
  "referenceImage": "data:image/...;base64,...",
  "model": "model-id-string",
  "temperature": 0.6,
  "baseUrl": "http://127.0.0.1:1234/v1"
}
```

> `useWebRag` (boolean, optional, default `false`): When `true`, the backend performs a live DuckDuckGo web search using the prompt, scrapes the top 3 result pages, and injects ~1500 chars of real-world text snippets into the LLM system prompt as grounding context. This is Google-style pseudo-RAG — no file upload or embedding server required. Can be used simultaneously with `useRag` (both contexts are merged). Fails gracefully: if DuckDuckGo or scraping fails, generation proceeds normally without context.
> `referenceImage` is optional. When present, the LLM is sent a multimodal message (vision).

**Successful Response:**
```json
{
  "id": 42,
  "title": "Generated Presentation Title",
  "slides": [ ]
}
```

**Error Response (500):**
```json
{ "error": "LLM returned malformed JSON or failed validation: ..." }
```

**Status:** ✅ Implemented. Has a 3-attempt retry loop for JSON validation and layout collapse detection.

---

### 4. `POST /api/generate-incremental`
**Called by:** `IncrementalChat.jsx` (AI chat inside Workspace to add/edit slides)

**Request body (JSON):**
```json
{
  "contextText": "JSON.stringify of existing slides array",
  "instruction": "Add a timeline slide about our roadmap",
  "baseUrl": "http://127.0.0.1:1234/v1",
  "model": "model-id-string"
}
```

**Response:**
```json
{ "slide": { } }
```

**Status:** ✅ Implemented. Returns a single new slide object in JSON.

---

### 5. `POST /api/upload-context`
**Called by:** `CreationLauncher.jsx` drag-and-drop file attachment (RAG)

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `file` | File | PDF, PPTX, TXT, or MD |
| `baseUrl` | string | LLM base URL (for embedding endpoint) |

**Response:**
```json
{ "success": true, "chunksProcessed": 24 }
```

**Status:** ✅ Implemented. Requires the local LLM server to expose `/v1/embeddings` (e.g. `nomic-embed-text` in LM Studio).

---

### 6. `POST /api/generate-pptx`
**Called by:** `App.jsx → handleGeneratePptx` (Export to local button)

**Request:** `multipart/form-data`
| Field | Type | Description |
|---|---|---|
| `slides` | string (JSON) | Serialized slides array |
| `title` | string | Presentation title |
| `theme` | string | Theme name e.g. `"Modern Clean"` |
| `templateType` | string | `"default"` or `"custom"` or `"online"` |
| `slideSize` | string | `"LAYOUT_16x9"` or `"LAYOUT_4x3"` |
| `cloudTemplateUrl` | string? | URL to download `.pptx` template |
| `customTheme` | string (JSON)? | `{bkgd, textColor, accent, fontFace}` |
| `customBackground` | string (JSON)? | `{type, value, overlayColor, overlayOpacity}` |
| `template` | File? | Uploaded `.pptx` master (only when `templateType=custom`) |

**Response:** Binary `.pptx` file stream with headers:
```
Content-Disposition: attachment; filename=presentation.pptx
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

**Status:** ✅ Implemented. Uses Python exporter for default mode, `pptx-automizer` for template mode.

> ⚠️ **Known issue:** Python process is spawned using `backend/venv/bin/python3`. If that venv does not exist, the export silently fails. Backend engineers must create `backend/venv` separately.

---

### 7. `POST /api/export/drive`
**Called by:** `App.jsx → handleGeneratePptx('drive')` (Export to Google Drive button)

**Request:** Same `multipart/form-data` as `/api/generate-pptx`

**Status:** ⚠️ **Stub — not configured.** Placeholders for OAuth credentials in `server.js`.

**TODO for backend engineers:**
1. Create a Google Cloud Project and enable Drive API
2. Set up OAuth 2.0 Client ID
3. Store credentials in `.env` and load with `dotenv`
4. Replace hardcoded placeholder strings in `server.js`

---

### 8. `GET /api/history`
**Called by:** `HistoryPanel.jsx` on open

**Response:**
```json
[
  { "id": 1, "title": "My Deck", "theme": "Modern Clean", "created_at": "2026-08-03 08:00:00" }
]
```

**Status:** ✅ Implemented (SQLite via `better-sqlite3`).

---

### 9. `GET /api/history/:id`
**Called by:** `HistoryPanel.jsx` when user clicks a history item

**Response:**
```json
{
  "id": 1,
  "title": "My Deck",
  "theme": "Modern Clean",
  "created_at": "2026-08-03T08:00:00.000Z",
  "slides_json": {
    "title": "My Deck",
    "slides": []
  }
}
```

**Status:** ✅ Implemented.

---

### 10. `DELETE /api/history/:id`
**Called by:** `HistoryPanel.jsx` trash icon button

**Response:** `{ "success": true }`

**Status:** ✅ Implemented.

---

### 11. `GET /api/mock-manifest.json`
**Called by:** `WizardForm.jsx` when `templateType === 'online'`

**Response:**
```json
[
  { "name": "Modern Dark Tech", "download_url": "...", "thumbnail_url": "..." }
]
```

**Status:** ✅ Hardcoded mock. Replace with a real CDN manifest in production.

---

## Slide JSON Schema (LLM Output)

All slide objects share these base fields:

| Field | Type | Always Present |
|---|---|---|
| `slide_number` | integer | Yes |
| `slide_type` | string (see below) | Yes |
| `slide_category` | `"title_hero"` / `"informational"` / `"data_viz"` | Yes |
| `title` | string | Yes |
| `image_search_query` | string | Only when `includeImages=true` |
| `image_base64` | string (data URI) | Added by backend before export |

### Slide Types and Their Extra Fields

| `slide_type` | Extra Fields Required |
|---|---|
| `title_hero` | `subtitle` |
| `standard_text` | `bullets: string[]` |
| `two_column_image` | `bullets: string[]`, `image_prompt: string` |
| `bento_grid` | `items: [{size, title, desc}]` |
| `chart_pie` | `chart_data: {labels: string[], values: number[]}` |
| `chart_bar` | `chart_data: {labels: string[], values: number[]}` |
| `data_table` | `table_data: {headers: string[], rows: string[][]}` |
| `comparison` | `column_left: {title, bullets}`, `column_right: {title, bullets}` |
| `stat_or_quote` | `huge_text: string`, `subtext: string` |
| `stat_callout` | `stat: string`, `label: string`, `bullets: string[]` |
| `timeline` | `steps: [{step: string, text: string}]` |
| `grid_list` | `items: [{item_title: string, item_text: string}]` |
| `metric_dashboard` | `metrics: [{label, value, change}]` |
| `summary_takeaways` | `bullets: string[]` |
| `default` | `subtitle?: string`, `bullets?: string[]` |

---

## Python Image Service

**Port:** `5000`  
**Start:** `cd python_image_service && source venv/bin/activate && python app.py`

| Route | Method | Description |
|---|---|---|
| `/generate-image` | POST | Generates an image via local Stable Diffusion |

**Request:**
```json
{ "prompt": "string", "steps": 4 }
```

**Response:** Binary image bytes (`image/jpeg`)

**Called by:** `backend/services/pptService.js → fetchImageBase64()` — tries this first, falls back to `pollinations.ai` if unavailable.

---

## Known Gaps and TODOs

| # | Gap | Severity |
|---|---|---|
| 1 | `backend/venv` missing — Python PPTX exporter will not run | Critical |
| 2 | Google Drive OAuth credentials are placeholders | Medium |
| 3 | `/api/discover` only probes LM Studio port; Ollama port `11434` not included | Medium |
| 4 | RAG upload requires `/v1/embeddings` on local server — not supported by all models | Medium |
| 5 | `pptx-automizer` template mode expects shapes named "Title 1" / "Content Placeholder 2" exactly | Medium |
| 6 | `image_base64` fetched during export is never persisted to history DB | Low |
