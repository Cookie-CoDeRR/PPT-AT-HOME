Frontend Integration (for your friend)
The selection UI should:

Call GET /api/image-styles on load to populate the picker
Include imageStyle: "<id>" in the form body when calling /api/generate-pptx

For your friend (frontend): Add a "Web Search" toggle that sends useWebRag: true in the POST /api/generate-json body. That's the only change needed on their end.

Skipped (frontend-only): Issues 1, 5 (SlideRenderer missing handlers) — those belong to your friend's codebase. ( For issue refer : pptx_audit.md)
