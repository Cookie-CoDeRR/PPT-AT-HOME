# Frontend Updates: Backend Integration Guide (Today's Changes)

This document summarizes all the frontend changes made today that require backend endpoints to be wired up or updated.

---

## 1. Import with AI (File, URL, Drive)
The app now supports importing content from files, URLs, and Google Drive.
- **Frontend Component:** `ImportLauncher.jsx`
- **What Backend Needs to Build:**
  - `POST /api/import/file` (Accepts multipart/form-data for .pdf, .docx, .txt, etc. Returns extracted text)
  - `POST /api/import/url` (Accepts JSON `{ url }`. Returns scraped/extracted text)
  - `GET /api/import/drive` (Initiates OAuth for Google Drive selection)
- **Updates to Generation API:** 
  - `POST /api/generate-json` will now receive a new field `importType` (can be `"file"`, `"url"`, or `"drive"`), along with `importUrl` or `importFile`. The backend must use the extracted text as the context for the LLM prompt.

## 2. Media Library
The left sidebar now defaults to the Media Library view.
- **Frontend Component:** `MediaLibrary.jsx`
- **What Backend Needs to Build:**
  - `GET /api/media` (Returns a list of previous media items/graphics to display in the grid)
  - `POST /api/media/image` (Takes a prompt, generates an AI image, and returns the media object)
  - `POST /api/media/graphic` (Takes a prompt, generates an AI vector graphic, and returns the media object)

## 3. Template Picker
The Template Picker was completely overhauled with dark mode and a grid layout.
- **Frontend Component:** `TemplatePicker.jsx`
- **What Backend Needs to Build:**
  - `GET /api/templates` (Returns the JSON list of available templates, currently hardcoded in the frontend)
- **Updates to Generation API:**
  - `POST /api/generate-json` will now receive a `templateId` (e.g., `"t1"`) when a user selects a template. The backend should use this ID to apply template-specific LLM instructions or slide structure mappings.

## 4. History Dashboard / Search (Cmd+K)
The new Gamma-style dashboard and Cmd+K search modal rely on user document history.
- **Frontend Components:** `HomePage.jsx` and `SearchModal.jsx`
- **What Backend Needs to Build:**
  - ✅ This already uses the existing `GET /api/history` endpoint. No new API is needed, but ensure this endpoint returns `title`, `created_at`, and an `id` for each presentation so the dashboard grid and search modal populate correctly.

---

> **Note:** For exact request/response JSON schemas, please refer to the `backend_update.md` file located at the root of the project.
