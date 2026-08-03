# Backend Deep Audit: PPTX Export vs Website Preview Mismatch

## Why These Two Look Different (Root Cause First)

The website (`Workspace.jsx`) renders slides inside a **scrollable card stack**. The main presentation title is displayed as a giant `h1` header **above all the slides** (line 99 of `Workspace.jsx`), and each slide is in its own padded card below it. This is a **Gamma-style scrolling doc layout** — it is NOT a single fullscreen slide. The PPTX is a traditional fullscreen slide deck. These are two fundamentally different canvases being compared.

---

## Issue Catalog

### 🔴 CRITICAL — Causing Major Visual Corruption

---

#### Issue 1: Presentation Title Shown Outside Slides on Website
**File:** `frontend/src/components/Workspace.jsx` L99  
**What happens:** The website shows `{title}` (the deck title, e.g. "Analyzing Social Friction Points...") as a giant `text-5xl` heading above ALL the slides. Slide 1 then starts below it with its own title "The Unspoken Etiquette..."  
**In PPTX:** Slide 1 IS the title slide — the deck title does not appear separately. So what looks like "two elements" on the website is actually one slide in the PPTX.  
**Fix needed:** None in backend — this is the correct behavior. But users will always perceive this mismatch unless the website adds a note saying "Deck title is shown here; in PPTX it appears on slide 1."

---

#### Issue 2: Title Hero Halo Renders as 3 Solid Purple Bars
**File:** `backend/services/export_pptx.py` L240-252  
**What happens:** The alpha transparency XML injection (`<a:alpha val="30000"/>`) is wrapped in a `try/except` that silently swallows errors. When it fails, the 3 halo rectangles render as 3 **solid purple bars** across the slide (exactly what you see in Canva screenshot).  
**Root cause:** The `srgbClr.append(parse_xml(...))` call fails because python-pptx's internal `_xPr` element structure doesn't always have a `.solidFill.srgbClr` child when the color was just set.  
**Fix:** Replace alpha transparency approach with a solid but partially opaque color approach using a PIL-generated PNG image for the gradient halo, OR simplify to a single clean accent line at the bottom of the title.

---

#### Issue 3: `density_optimizer.py` Silently Truncates ALL Content
**File:** `backend/services/density_optimizer.py`  
**Constants:** `MAX_BULLET_WORDS = 15`, `MAX_BULLETS_PER_SLIDE = 4`, `MAX_TITLE_WORDS = 10`  
**What happens:** Every single bullet is truncated to 15 words. Every title is truncated to 10 words. Every slide with >4 bullets gets split into multiple slides. This means the AI-generated content gets butchered before it ever reaches the rendering engine.  
**Examples of damage:**
- Title "Analyzing Social Friction Points in Shared Fitness Environments" (8 words) → passes
- Title "The Unspoken Etiquette: Navigating Gym Social Dynamics" (7 words) → passes
- But any longer contextual title gets cut off with "..."
- Bullet "Gen Z consumers demand authentic transparency in brand communication strategies and ethical sourcing" (13 words) → cut
**Fix:** Remove `MAX_TITLE_WORDS` limit. Increase `MAX_BULLET_WORDS` to 30. Remove bullet pagination — just truncate, don't split into new slides.

---

#### Issue 4: Defensive Fallback Injects Fake Bullets into `title_hero`
**File:** `backend/services/export_pptx.py` L186-188  
**What happens:** For `slide_type: "title_hero"`, if `bullets` is empty, the fallback injects `["Content pending", "Please update in editor"]`. These placeholder bullets then appear in the PPTX export.  
**The React component (`TitleSlideLayout.jsx`) does NOT render bullets at all.** It only renders `title` and `subtitle`. So the website looks clean; the PPTX shows garbage bullets.  
**Fix:** Remove `title_hero` from the defensive fallback bullet injection block.

---

#### Issue 5: `SlideRenderer.jsx` Has NO Handler for 8 Slide Types
**File:** `frontend/src/components/SlideRenderer.jsx` L25-57  
**Missing from the React switch statement:**
- `title_hero` → falls through to `DefaultLayout` (wrong!)
- `two_column_image` → falls through to `DefaultLayout`
- `hero_split` → falls through to `DefaultLayout`
- `standard_text` → falls through to `DefaultLayout`
- `summary_takeaways` → falls through to `DefaultLayout`
- `stat_or_quote` → falls through to `DefaultLayout`
- `three_card_grid` → falls through to `DefaultLayout`
- `graphic_result` → falls through to `DefaultLayout`

When the frontend renders `title_hero` through `DefaultLayout`, it shows a completely different visual than what the PPTX `build_title_hero_slide()` produces.  
**Fix (frontend team):** Add cases for all these types. For `title_hero`, use `TitleSlideLayout`. For `two_column_image`/`hero_split`, use the correct layout.

---

#### Issue 6: `ThreeCardGrid` Layout Exists in React but NOT in Python
**File:** `backend/services/export_pptx.py` — missing  
**React component:** `frontend/src/components/layouts/ThreeCardGrid.jsx` reads `slide.cards[]` with `{card.card_title}` and `{card.card_text}` fields.  
**Python:** If `slide_type = "three_card_grid"` is generated, it falls through to `build_default_slide()` which renders nothing useful.  
**Fix:** Add `build_three_card_grid_slide()` function in Python.

---

### 🟠 HIGH — Causing Significant Visual Difference

---

#### Issue 7: `two_column_image` / `hero_split` Python Layout is Wrong
**File:** `backend/services/export_pptx.py` L645-686  
**React layout:** Large title at top, then a dark card container below, LEFT side has subtitle + bullets, RIGHT side has image.  
**Python layout:** Title at top, bullets directly on left half of slide (NO card container), image on right. No card background shape.  
**Fix:** Add a `build_split_card_slide` that draws the dark rounded-rect card container first, then places text inside it.

---

#### Issue 8: Title Heights Are Fixed at 0.75" But Long Titles Overflow
**File:** `backend/services/export_pptx.py` L20 (`TITLE_H = 0.75`)  
**What happens:** A 10-word title wraps to 2 lines at 24pt. At 24pt, one line = ~0.4". Two lines = ~0.8", which overflows the `TITLE_H = 0.75"` box and gets clipped. The body content then starts at `BODY_Y = 1.15"` which overlaps the title text.  
**Fix:** Dynamically calculate `TITLE_H` based on estimated line count: `title_h = max(0.75, ceil(len(title.split()) / 6) * 0.45)`.

---

#### Issue 9: Accent Colors Not Applied to Text in Default Slides
**File:** `backend/services/export_pptx.py` L773-793  
**What happens:** `build_default_slide` draws an accent underline rectangle, but the title text color uses `theme_color(theme, "textColor")` — for dark themes this is correct, but for light themes (where `titleColor` is different from `textColor`), the title uses the wrong color.  
**Fix:** Use `theme_color(theme, "titleColor", "FFFFFF")` for all slide title text.

---

#### Issue 10: Slide Coordinate System Doesn't Adapt to Non-16:9 Sizes
**File:** `backend/services/export_pptx.py` L19-22  
**Constants hardcoded for 16:9:** `SLIDE_W = 13.333`, `CONTENT_X = 0.5`, `CONTENT_W = 12.333`  
**What happens:** For `LAYOUT_4x3` (10" × 7.5"), all builders still place elements at 13.333"-wide coordinates. Elements fall off-canvas.  
**Fix:** Make constants dynamic: compute `SLIDE_W`, `CONTENT_W` etc. inside `export_presentation()` and pass them to each builder.

---

### 🟡 MEDIUM — Causing Minor Visual Differences

---

#### Issue 11: `purge_placeholders` Uses Wrong XML Namespace
**File:** `backend/services/export_pptx.py` L64-78  
**Current:** Uses namespace `http://schemas.openxmlformats.org/presentationml/2006/main`  
**Problem:** The `<p:sp>` elements are in the `p:` (PresentationML) namespace but the `<p:ph>` placeholder child is also in `p:`. The `findall` with that namespace string should work, but if `prs.slide_layouts[6]` (blank layout) genuinely has no placeholders in the master, the purge does nothing and the ghost elements are already gone. Verify by checking actual XML.  
**Fix:** Log how many placeholders were removed to confirm the purge is working.

---

#### Issue 12: `metric_dashboard` `change` Badge Color Logic is Fragile
**File:** `backend/services/export_pptx.py` L646-650  
**Current:** Red if change starts with "-", green otherwise.  
**Problem:** If the LLM outputs "0%" or "N/A" or "+0%", it renders green even for neutral/missing data.  
**Fix:** Also check for "0" and "N/A" strings.

---

#### Issue 13: Pollinations AI Image Rate-Limiting Returns No Image
**File:** `backend/services/pptService.js` L68-72  
**What happens:** When Pollinations returns 429 Too Many Requests, `slide.image_base64` is `null`. In the PPTX, the image slot is just blank. In the React frontend, a placeholder box with the prompt text is shown.  
**Fix:** Add a PIL-generated colored placeholder image with the prompt text written on it, so the PPTX always has an image in the slot.

---

#### Issue 14: `timeline` Card Dimensions May Clip Text for Long Step Labels
**File:** `backend/services/export_pptx.py` L460-490  
**What happens:** `card_w = min(step_w_total - 0.2, 2.4)`. For 5+ steps, `card_w` can be as small as 1.8". A 10-word step text at 10pt in a 1.8" wide box wraps to 4+ lines and overflows `card_h = 1.5"`.  
**Fix:** Cap steps rendered to 5 maximum; reduce font size dynamically if `n > 4`.

---

## Summary Priority Queue

| Priority | Issue | Files | Effort |
|---|---|---|---|
| 🔴 | Halo renders as solid bars | `export_pptx.py` | Medium |
| 🔴 | density_optimizer truncates content | `density_optimizer.py` | Small |
| 🔴 | Fake bullets injected into title_hero | `export_pptx.py` | Tiny |
| 🔴 | SlideRenderer missing type handlers | `SlideRenderer.jsx` (frontend) | Medium |
| 🔴 | three_card_grid not in Python | `export_pptx.py` | Small |
| 🟠 | split_card missing card container shape | `export_pptx.py` | Small |
| 🟠 | Title heights fixed, can overflow | `export_pptx.py` | Small |
| 🟠 | Title color wrong on some themes | `export_pptx.py` | Tiny |
| 🟠 | Non-16:9 coords out of bounds | `export_pptx.py` | Medium |
| 🟡 | Image 429 shows blank in PPTX | `pptService.js` | Small |
| 🟡 | Timeline clips long text | `export_pptx.py` | Small |
