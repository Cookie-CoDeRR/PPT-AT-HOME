# Frontend Update: New Pages & Components

> **For Frontend Engineers:** This document summarises all new pages, components, and routing changes made to the frontend codebase. Review this before merging any new feature branches.

---

## Summary of New Components

| Component | File | Status | Purpose |
|-----------|------|--------|---------|
| PasteTextLauncher | frontend/src/components/PasteTextLauncher.jsx | NEW | Paste-in-text start/greeting page |
| CreationLauncher | frontend/src/components/CreationLauncher.jsx | Extended | AI Generate page (all 5 content types) |
| HomePage | frontend/src/components/HomePage.jsx | Existing | Mode selector hub |
| WizardForm | frontend/src/components/WizardForm.jsx | Existing | Template creation wizard |
| Workspace | frontend/src/components/Workspace.jsx | Existing | Slide editor workspace |

---

## 1. Default Start Page — PasteTextLauncher.jsx

The app now opens on the Paste in text page.

Change in App.jsx:
  - const [view, setView] = useState("create");
  + const [view, setView] = useState("paste");

Navigation flow:
  App opens -> PasteTextLauncher (paste)
                     Back button
                HomePage (home)
               /     |      \
          Generate Template  Import

### What PasteTextLauncher renders:
- Title: Paste in text with icon
- Content type tabs: Presentation | Webpage | Document | Social | Graphic (NEW badge)
- Context-sensitive sub-option dropdown:
  - Presentation -> Orientation (Landscape 16:9 / Portrait 9:16 / Square 1:1)
  - Document -> Document size (Default / A4 / US Letter)
  - Webpage -> Language (English UK, English US, Spanish, French, German, Hindi, Japanese, Chinese)
  - Social -> Language (same list)
  - Graphic -> no sub-option
- Two-column layout:
  - Left: Large textarea (Type or paste in content here)
  - Right: Optional section-by-section control tip panel with separator example
- Three generation mode radio buttons:
  - Generate from notes or an outline
  - Summarize long text or document
  - Preserve this exact text
- CTA: Continue to prompt editor button (disabled until 10+ chars)
- Footer: You can also import files link

---

## 2. CreationLauncher.jsx — Extended Content Types

The Generate page now supports 5 content types (previously only Presentation):

| Tab | Status | Config pills shown |
|-----|--------|-------------------|
| Presentation | Active | Slides, Theme, Orientation, Tone, Model |
| Webpage | Active | Sections, Language, Model |
| Document | Active | Sections, Document Size, Language, Model |
| Social | Active | Slides, Theme, Orientation, Language, Model |
| Graphic | Active (NEW badge) | Style, Aspect, Count, Quality, Model |

### Graphic tab specific features:
- Image style horizontal scroller: None / Scene / Illustration / Flat Line Art / Technical Line / Modern Art
- Out-of-credits banner (orange) with Upgrade button
- Or, start with a template divider
- Accordion step 1 (open): Infographic, Poster, Team Structure, Invite, Calendar, Diagram, Logo, Social Media Post, Something else
- Accordion steps 2 and 3 (closed): Pick a layout / Theme and prompt
- Start a new blank design link

---

## 3. App.jsx — Routing

New view state paste has been added:

  if (modeId === "template") setView("wizard");
  else if (modeId === "paste") setView("paste");  // NEW
  else setView("create");

---

## 4. Scroll Fix — App.jsx

Fixed a bug where long content was cut off at the top. Main container changed from
flex items-center justify-center to flex flex-col items-center.

---

## 5. Payloads Sent to Backend (POST /api/generate-json)

From PasteTextLauncher:
{
  prompt: pasted text,
  pasteMode: generate_outline | summarize | preserve,
  contentType: presentation | webpage | document | social | graphic,
  slideCount: 10,
  slideSize: Default | A4 | US Letter | Landscape (16:9) | etc,
  language: English (UK) | English (US) | Spanish | etc,
  tone: Professional/Corporate,
  theme: Modern Dark Tech,
  templateType: default,
  density: Detailed,
  includeImages: true
}

From CreationLauncher (Graphic mode):
{
  prompt: ...,
  contentType: graphic,
  slideSize: 1:1,
  graphicStyle: none | scene | illustration | flat_line_art | technical_line | modern_art,
  graphicCount: 1-4,
  graphicQuality: Standard | HD,
  model: model-name,
  temperature: 0.6
}

---

## 6. CSS Classes Used (must be in index.css)

- .glass-panel: Glassmorphism card style
- .hide-scrollbar: Hides scrollbar for horizontal scroll areas (image style row)

---

## 7. Dependencies (no new packages)

All new components use existing: react, framer-motion, lucide-react, axios, react-dropzone
