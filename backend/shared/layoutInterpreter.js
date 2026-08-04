function parseSlideToDSL(slide) {
    const layoutTag = slide.slide_type;

    // The root is always a main card_container with a 5% margin
    const root = {
        type: "card_container",
        style: { x: "5%", y: "5%", w: "90%", h: "90%", fill: "cardBg", radius: 0.05, border: "cardBorder", borderWidth: 1 },
        children: []
    };

    // Every slide gets a title
    if (slide.title) {
        root.children.push({
            type: "text_block",
            text: slide.title,
            style: { x: "8%", y: "8%", w: "84%", h: "15%", fontSize: 32, bold: true, color: "textPrimary", align: "left" }
        });
    }

    if (layoutTag === "title_hero") {
        root.children.push({
            type: "text_block",
            text: slide.subtitle || "",
            style: { x: "8%", y: "25%", w: "84%", h: "20%", fontSize: 22, color: "textSecondary", align: "left" }
        });
        if (slide.image_search_query || slide.image_prompt) {
            root.children.push({
                type: "image_frame",
                query: slide.image_search_query || slide.image_prompt,
                style: { x: "8%", y: "50%", w: "84%", h: "40%", mode: "crop" }
            });
        }
    } else if (layoutTag === "standard_text") {
        if (slide.bullets && slide.bullets.length > 0) {
            root.children.push({
                type: "text_block",
                bullets: slide.bullets,
                style: { x: "8%", y: "25%", w: "84%", h: "65%", fontSize: 16, color: "textSecondary", align: "left" }
            });
        }
    } else if (layoutTag === "two_column_image" || layoutTag === "comparison") {
        // Split columns
        const leftCol = {
            type: "card_container",
            style: { x: "8%", y: "25%", w: "40%", h: "65%", fill: "transparent" },
            children: []
        };
        const rightCol = {
            type: "card_container",
            style: { x: "52%", y: "25%", w: "40%", h: "65%", fill: "transparent" },
            children: []
        };

        if (slide.column_left || slide.col_a) {
            const ldata = slide.column_left || slide.col_a;
            leftCol.children.push({ type: "text_block", text: ldata.title || "", style: { x: "0%", y: "0%", w: "100%", h: "15%", fontSize: 22, bold: true, color: "textPrimary" }});
            if (ldata.bullets) {
                leftCol.children.push({ type: "text_block", bullets: ldata.bullets, style: { x: "0%", y: "20%", w: "100%", h: "80%", fontSize: 16, color: "textSecondary" }});
            }
        } else if (slide.bullets) {
            leftCol.children.push({ type: "text_block", bullets: slide.bullets, style: { x: "0%", y: "0%", w: "100%", h: "100%", fontSize: 16, color: "textSecondary" }});
        }

        if (slide.column_right || slide.col_b) {
            const rdata = slide.column_right || slide.col_b;
            rightCol.children.push({ type: "text_block", text: rdata.title || "", style: { x: "0%", y: "0%", w: "100%", h: "15%", fontSize: 22, bold: true, color: "textPrimary" }});
            if (rdata.bullets) {
                rightCol.children.push({ type: "text_block", bullets: rdata.bullets, style: { x: "0%", y: "20%", w: "100%", h: "80%", fontSize: 16, color: "textSecondary" }});
            }
        } else if (slide.image_search_query) {
            rightCol.children.push({ type: "image_frame", query: slide.image_search_query, style: { x: "0%", y: "0%", w: "100%", h: "100%", mode: "crop" }});
        }

        root.children.push(leftCol);
        root.children.push(rightCol);
    } else if (layoutTag === "bento_grid") {
        if (slide.items && slide.items.length >= 3) {
            const cardW = 26; // 26%
            for (let i = 0; i < 3; i++) {
                const item = slide.items[i];
                const xPos = 8 + (i * 29); // 8, 37, 66
                root.children.push({
                    type: "card_container",
                    style: { x: `${xPos}%`, y: "25%", w: `${cardW}%`, h: "65%", fill: "bg", radius: 0.05, border: "cardBorder", borderWidth: 1 },
                    children: [
                        { type: "text_block", text: item.title || item.item_title, style: { x: "10%", y: "10%", w: "80%", h: "20%", fontSize: 18, bold: true, color: "textPrimary" } },
                        { type: "text_block", text: item.desc || item.item_text, style: { x: "10%", y: "35%", w: "80%", h: "55%", fontSize: 14, color: "textSecondary" } }
                    ]
                });
            }
        }
    } else if (layoutTag === "chart_pie" || layoutTag === "chart_bar") {
        if (slide.chart_data) {
            root.children.push({
                type: "chart",
                chartType: layoutTag === "chart_pie" ? "pie" : "bar",
                data: slide.chart_data,
                style: { x: "8%", y: "25%", w: "84%", h: "65%" }
            });
        }
    } else if (layoutTag === "data_table") {
        if (slide.table_data) {
            root.children.push({
                type: "table",
                data: slide.table_data,
                style: { x: "8%", y: "25%", w: "84%", h: "65%" }
            });
        }
    } else if (layoutTag === "metric_dashboard") {
        if (slide.metrics && slide.metrics.length > 0) {
            const n = Math.min(slide.metrics.length, 4);
            const cardW = 84 / n - 2;
            for (let i = 0; i < n; i++) {
                const metric = slide.metrics[i];
                const xPos = 8 + (i * (cardW + 2));
                root.children.push({
                    type: "card_container",
                    style: { x: `${xPos}%`, y: "25%", w: `${cardW}%`, h: "65%", fill: "bg", radius: 0.05, border: "cardBorder", borderWidth: 1 },
                    children: [
                        { type: "text_block", text: metric.label, style: { x: "5%", y: "10%", w: "90%", h: "20%", fontSize: 16, bold: true, color: "textSecondary", align: "center" } },
                        { type: "text_block", text: metric.value, style: { x: "5%", y: "40%", w: "90%", h: "30%", fontSize: 28, bold: true, color: "accent", align: "center" } },
                        { type: "text_block", text: metric.change, style: { x: "5%", y: "80%", w: "90%", h: "15%", fontSize: 14, color: metric.change?.startsWith('-') ? "FF0000" : "00FF00", align: "center" } }
                    ]
                });
            }
        }
    } else {
        // Fallback default
        if (slide.subtitle) {
            root.children.push({ type: "text_block", text: slide.subtitle, style: { x: "8%", y: "25%", w: "84%", h: "10%", fontSize: 22, color: "textSecondary", align: "left" }});
        }
        if (slide.bullets) {
            root.children.push({ type: "text_block", bullets: slide.bullets, style: { x: "8%", y: "35%", w: "84%", h: "55%", fontSize: 16, color: "textSecondary", align: "left" }});
        }
    }

    return root;
}

module.exports = {
    parseSlideToDSL
};
