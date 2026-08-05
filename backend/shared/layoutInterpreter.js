/**
 * layoutInterpreter.js
 * Maps LLM JSON slide objects to DSL trees consumed by pptxExporter.js.
 * Field names align with LAYOUT_SCHEMAS defined in llmService.js.
 *
 * @param {Object} slide - The JSON content object from the LLM.
 * @returns {Object} DSL tree root node for pptxExporter.renderPptxDSL()
 */
const PRIORITY_STYLE = {
  1: { titleSize: 24, accentColor: '2B6CB0', titleWeight: true,  emphasisBar: true  },
  2: { titleSize: 20, accentColor: '4A5568', titleWeight: true,  emphasisBar: false },
  3: { titleSize: 18, accentColor: '718096', titleWeight: false, emphasisBar: false }
};

// Small text-scaling engine to prevent overflows
function getAutoFontSize(text, defaultSize, maxChars) {
    if (!text) return defaultSize;
    const str = String(text);
    if (str.length <= maxChars) return defaultSize;
    
    // Scale down proportionally, but cap at 60% of original size to remain legible
    const ratio = maxChars / str.length;
    const scaledSize = Math.floor(defaultSize * ratio);
    return Math.max(scaledSize, Math.floor(defaultSize * 0.6));
}

function parseSlideToDSL(slide) {
    const layoutTag = slide.slide_type;
    const pStyle = PRIORITY_STYLE[slide.priority] || PRIORITY_STYLE[3];

    // Root card container with 5% margin on all sides
    const root = {
        type: "card_container",
        style: { x: "5%", y: "5%", w: "90%", h: "90%", fill: "cardBg", radius: 0.05, border: "cardBorder", borderWidth: 1 },
        children: []
    };

    let titleH = 12;
    let contentOffsetY = 0;
    
    // SHARED TITLE BLOCK (Non-hero, non-stat, non-title-split)
    if (layoutTag !== "title_hero" && layoutTag !== "stat_or_quote" && layoutTag !== "title_split") {
        if (slide.title && slide.title.length > 50) {
            titleH += 5; // Approx 0.3" extra height for wrapped titles
            contentOffsetY = 5; 
        }

        root.children.push({
            type: "text_block",
            text: slide.title || "",
            style: { x: "8%", y: "6%", w: "84%", h: `${titleH}%`, fontSize: pStyle.titleSize, bold: pStyle.titleWeight, color: "textPrimary", align: "left" }
        });
        if (pStyle.emphasisBar) {
            root.children.push({ type: "card_container", style: { x: "8%", y: `${6 + titleH}%`, w: "12%", h: "1%", fill: pStyle.accentColor } });
        }
    }

    switch (layoutTag) {

        // ─────────────────────────────────────────────────────────
        // TITLE HERO — Apple/Stripe style: massive centred title
        // ─────────────────────────────────────────────────────────
        case "title_hero": {
            root.children.push({
                type: "text_block",
                text: slide.title || "Presentation Title",
                style: { x: "8%", y: "20%", w: "84%", h: "40%", fontSize: 36, bold: true, color: "textPrimary", align: "center" }
            });
            const titleWraps = (slide.title && slide.title.length > 40);
            const subtitleY = titleWraps ? "72%" : "60%"; // Push subtitle down if title is long
            if (slide.subtitle) {
                root.children.push({
                    type: "text_block",
                    text: slide.subtitle,
                    style: { x: "12%", y: subtitleY, w: "76%", h: "18%", fontSize: 20, color: "textSecondary", align: "center" }
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // TITLE SPLIT — Hero text left, accent block right
        // ─────────────────────────────────────────────────────────
        case "title_split": {
            root.children.push({
                type: "text_block",
                text: slide.title || "Presentation Title",
                style: { x: "8%", y: "30%", w: "40%", h: "25%", fontSize: 36, bold: true, color: "textPrimary", align: "left" }
            });
            if (slide.subtitle) {
                root.children.push({
                    type: "text_block",
                    text: slide.subtitle,
                    style: { x: "8%", y: "55%", w: "40%", h: "20%", fontSize: 16, color: "textSecondary", align: "left" }
                });
            }
            root.children.push({
                type: "card_container",
                style: { x: "53%", y: "15%", w: "39%", h: "70%", fill: "accent", radius: 0.05 }
            });
            break;
        }

        // ─────────────────────────────────────────────────────────
        // STANDARD TEXT — modern layout with prominent header +
        // readable paragraph blocks (no endless bullet chains)
        // ─────────────────────────────────────────────────────────
        case "standard_text": {
            // Support new `paragraphs` field or legacy `bullets` fallback
            const paragraphs = slide.paragraphs || slide.bullets || [];
            if (paragraphs.length > 0) {
                const fullText = paragraphs.map(p => typeof p === "string" ? p : String(p)).join("\n\n");
                root.children.push({
                    type: "text_block",
                    text: fullText,
                    style: {
                        x: "8%",
                        y: `${26 + contentOffsetY}%`,
                        w: "84%",
                        h: "65%",
                        fontSize: getAutoFontSize(fullText, 17, 300), // Max ~300 chars before scaling down
                        color: "textSecondary",
                        align: "left"
                    }
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // BENTO GRID — 4 modular UI cards distributed across slide
        // ─────────────────────────────────────────────────────────
        case "bento_grid": {
            // Support new `cards` field or legacy `items` fallback
            const cards = slide.cards || (slide.items || []).map(i => ({ header: i.title || i.item_title, description: i.desc || i.item_text }));
            const positions = [
                { x: "8%",  y: `${25 + contentOffsetY}%` },
                { x: "52%", y: `${25 + contentOffsetY}%` },
                { x: "8%",  y: `${61 + contentOffsetY}%` },
                { x: "52%", y: `${61 + contentOffsetY}%` }
            ];
            cards.slice(0, 4).forEach((card, idx) => {
                const pos = positions[idx];
                root.children.push({
                    type: "card_container",
                    style: { x: pos.x, y: pos.y, w: "40%", h: `${31 - contentOffsetY/3}%`, fill: "bg", radius: 0.05, border: pStyle.accentColor, borderWidth: slide.priority === 1 ? 2 : 1 },
                    children: [
                        {
                            type: "text_block",
                            text: card.header || card.title || "",
                            style: { x: "5%", y: "8%", w: "90%", h: "28%", fontSize: 14, bold: true, color: "textPrimary", align: "left" }
                        },
                        {
                            type: "text_block",
                            text: card.description || "",
                            style: { x: "4%", y: "30%", w: "92%", h: "60%", fontSize: getAutoFontSize(card.description, 11, 80), color: "textSecondary", align: "left" }
                        }
                    ]
                });
            });
            break;
        }

        // ─────────────────────────────────────────────────────────
        // TWO COLUMN IMAGE — text left, image placeholder right
        // ─────────────────────────────────────────────────────────
        case "two_column_image": {
            // Left: paragraph content — new `left_content` or legacy `bullets`
            const leftText = slide.left_content
                || (slide.bullets ? slide.bullets.join("\n\n") : slide.text || "");
            root.children.push({
                type: "text_block",
                text: leftText,
                style: { x: "8%", y: `${22 + contentOffsetY}%`, w: "42%", h: `${68 - contentOffsetY}%`, fontSize: 16, color: "textSecondary", align: "left" }
            });
            // Right: image frame — new `image_description` or legacy `image_search_query`
            root.children.push({
                type: "image_frame",
                query: slide.image_description || slide.image_search_query || slide.image_prompt || "visual asset",
                style: { x: "53%", y: `${22 + contentOffsetY}%`, w: "39%", h: `${68 - contentOffsetY}%`, mode: "crop" }
            });
            break;
        }

        // ─────────────────────────────────────────────────────────
        // COMPARISON — side-by-side vertical blocks
        // ─────────────────────────────────────────────────────────
        case "comparison": {
            // Support new `left_box/right_box` or legacy `column_left/column_right`
            const left  = slide.left_box  || slide.column_left  || {};
            const right = slide.right_box || slide.column_right || {};

            const buildColChildren = (col) => {
                const children = [];
                const headerText = col.header || col.title || "";
                if (headerText) {
                    children.push({ type: "text_block", text: headerText, style: { x: "5%", y: "4%", w: "90%", h: "16%", fontSize: 18, bold: true, color: "textPrimary" } });
                }
                const points = col.points || col.bullets || [];
                points.forEach((pt, i) => {
                    children.push({
                        type: "text_block",
                        text: `• ${pt}`,
                        style: { x: "5%", y: `${22 + i * 18}%`, w: "90%", h: "16%", fontSize: 14, color: "textSecondary" }
                    });
                });
                return children;
            };

            root.children.push({
                type: "card_container",
                style: { x: "8%", y: `${22 + contentOffsetY}%`, w: "40%", h: `${68 - contentOffsetY}%`, fill: "bg", radius: 0.04, border: pStyle.accentColor, borderWidth: slide.priority === 1 ? 2 : 1 },
                children: buildColChildren(left)
            });
            root.children.push({
                type: "card_container",
                style: { x: "52%", y: `${22 + contentOffsetY}%`, w: "40%", h: `${68 - contentOffsetY}%`, fill: "bg", radius: 0.04, border: pStyle.accentColor, borderWidth: slide.priority === 1 ? 2 : 1 },
                children: buildColChildren(right)
            });
            break;
        }

        // ─────────────────────────────────────────────────────────
        // CHART types — pass chart_data straight through
        // ─────────────────────────────────────────────────────────
        case "chart_pie":
        case "chart_bar": {
            if (slide.chart_data) {
                root.children.push({
                    type: "chart",
                    chartType: layoutTag === "chart_pie" ? "pie" : "bar",
                    data: slide.chart_data,
                    style: { x: "8%", y: `${22 + contentOffsetY}%`, w: "84%", h: `${68 - contentOffsetY}%` }
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // DATA TABLE
        // ─────────────────────────────────────────────────────────
        case "data_table": {
            if (slide.table_data) {
                root.children.push({
                    type: "table",
                    data: slide.table_data,
                    style: { x: "8%", y: `${22 + contentOffsetY}%`, w: "84%", h: `${68 - contentOffsetY}%` }
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // STAT / QUOTE — massive single number or pull-quote
        // ─────────────────────────────────────────────────────────
        case "stat_or_quote": {
            root.children.push({
                type: "text_block",
                text: slide.title || "",
                style: { x: "8%", y: "6%", w: "84%", h: "12%", fontSize: 24, bold: true, color: "textSecondary", align: "center" }
            });
            root.children.push({
                type: "text_block",
                text: slide.huge_text || "",
                style: { x: "8%", y: "25%", w: "84%", h: "30%", fontSize: 72, bold: true, color: "accent", align: "center" }
            });
            if (slide.subtext) {
                root.children.push({
                    type: "text_block",
                    text: slide.subtext,
                    style: { x: "15%", y: "62%", w: "70%", h: "20%", fontSize: 20, color: "textSecondary", align: "center" }
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // METRIC DASHBOARD
        // ─────────────────────────────────────────────────────────
        case "metric_dashboard": {
            if (slide.metrics && slide.metrics.length > 0) {
                const n = Math.min(slide.metrics.length, 4);
                const cardW = Math.floor(84 / n) - 2;
                slide.metrics.slice(0, n).forEach((metric, i) => {
                    const xPos = 8 + (i * (cardW + 2));
                    root.children.push({
                        type: "card_container",
                        style: { x: `${xPos}%`, y: `${22 + contentOffsetY}%`, w: `${cardW}%`, h: `${68 - contentOffsetY}%`, fill: "bg", radius: 0.05, border: "cardBorder", borderWidth: 1 },
                        children: [
                            { type: "text_block", text: metric.label, style: { x: "5%", y: "10%", w: "90%", h: "20%", fontSize: 16, bold: true, color: "textSecondary", align: "center" } },
                            { type: "text_block", text: metric.value, style: { x: "5%", y: "40%", w: "90%", h: "30%", fontSize: 28, bold: true, color: "accent", align: "center" } },
                            { type: "text_block", text: metric.change || "", style: { x: "5%", y: "78%", w: "90%", h: "14%", fontSize: 14, color: (metric.change || "").startsWith("-") ? "FF4444" : "44FF88", align: "center" } }
                        ]
                    });
                });
            }
            break;
        }

        // ─────────────────────────────────────────────────────────
        // DEFAULT FALLBACK — title + paragraphs/bullets
        // ─────────────────────────────────────────────────────────
        default: {
            const fallbackContent = slide.paragraphs || slide.bullets || [];
            if (fallbackContent.length > 0) {
                root.children.push({
                    type: "text_block",
                    bullets: fallbackContent.map(b => (typeof b === "string" ? b : String(b))),
                    style: { x: "8%", y: `${26 + contentOffsetY}%`, w: "84%", h: `${64 - contentOffsetY}%`, fontSize: 16, color: "textSecondary", align: "left" }
                });
            } else if (slide.left_content) {
                root.children.push({
                    type: "text_block",
                    text: slide.left_content,
                    style: { x: "8%", y: `${26 + contentOffsetY}%`, w: "40%", h: "60%", fontSize: getAutoFontSize(slide.left_content, 16, 250), color: "textSecondary", align: "left" }
                });
            } else if (slide.subtitle) {
                root.children.push({
                    type: "text_block",
                    text: slide.subtitle,
                    style: { x: "8%", y: `${26 + contentOffsetY}%`, w: "84%", h: "14%", fontSize: 22, color: "textSecondary", align: "left" }
                });
            }
        }
    }

    return root;
}

module.exports = { parseSlideToDSL };
