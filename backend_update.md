# Backend Update Specifications

This document outlines the API requirements for the newly implemented `NewGammaModal` UI (the "start greeting page"). Backend engineers must implement these endpoints to make the frontend features functional.

## 1. Blank Document Initialization

The new UI allows users to create a "New blank [type]" with a specific aspect ratio/layout without necessarily using AI generation right away.

**Endpoint:** `POST /api/documents`
**Purpose:** Creates a new empty document with the requested formatting.

**Request Body:**
```json
{
  "type": "presentation" | "document" | "social" | "webpage" | "graphic",
  "layoutId": "fluid" | "16:9" | "4:3"
}
```

**Response (201 Created):**
```json
{
  "id": "doc_12345",
  "title": "Untitled Presentation",
  "type": "presentation",
  "layoutId": "16:9",
  "slides_json": [],
  "createdAt": "2026-08-08T10:00:00Z"
}
```

## 2. Workspace Templates API

The modal includes a section for "Workspace templates" where users can reuse their past creations as templates. 

### A. List Workspace Templates
**Endpoint:** `GET /api/templates/workspace`
**Purpose:** Retrieves all templates saved by the user or their workspace.

**Response (200 OK):**
```json
{
  "templates": [
    {
      "id": "tpl_001",
      "name": "Q3 Marketing Report",
      "thumbnailUrl": "https://example.com/thumb.jpg",
      "type": "presentation"
    }
  ]
}
```

### B. Save as Workspace Template
**Endpoint:** `POST /api/templates/workspace`
**Purpose:** Saves an existing document/presentation as a reusable template.

**Request Body:**
```json
{
  "sourceDocumentId": "doc_12345",
  "templateName": "Company All-Hands Theme"
}
```

**Response (201 Created):**
```json
{
  "id": "tpl_002",
  "name": "Company All-Hands Theme",
  "status": "success"
}
```

## 3. Search Integration (Cmd+K)

The `Cmd+K` button has been updated to prompt for "New Gamma" creation by default, but search is still accessible. The backend should ensure the `GET /api/history` endpoint is highly performant as it is queried to populate the search index for the user's past files. No immediate changes required here if `GET /api/history` is already optimized.
