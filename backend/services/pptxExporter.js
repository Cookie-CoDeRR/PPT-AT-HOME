const pptxgen = require('pptxgenjs');
const fs = require('fs');

async function renderPptxDSL(slide, dslTree, theme, fetchImageBase64, pres) {
    if (!dslTree) return;

    // Helper to resolve theme color or fallback to raw
    const getColor = (colorStr) => {
        if (!colorStr) return undefined;
        if (theme[colorStr]) return theme[colorStr];
        return colorStr;
    };

    const processNode = async (node) => {
        const { type, style = {}, children = [] } = node;
        const opts = { ...style };
        
        // Translate percentage to pptx string
        if (opts.x) opts.x = String(opts.x);
        if (opts.y) opts.y = String(opts.y);
        if (opts.w) opts.w = String(opts.w);
        if (opts.h) opts.h = String(opts.h);

        if (type === "card_container") {
            const shapeOpts = { x: opts.x, y: opts.y, w: opts.w, h: opts.h };
            if (opts.fill && opts.fill !== "transparent") {
                shapeOpts.fill = { color: getColor(opts.fill) };
            }
            if (opts.border) {
                shapeOpts.line = { color: getColor(opts.border), width: opts.borderWidth || 1 };
            }
            
            if (opts.radius) {
                shapeOpts.rectRadius = opts.radius;
                slide.addShape(pres.ShapeType.roundRect, shapeOpts);
            } else {
                slide.addShape(pres.ShapeType.rect, shapeOpts);
            }
        } 
        else if (type === "text_block") {
            const textOpts = {
                x: opts.x, y: opts.y, w: opts.w, h: opts.h,
                fontSize: opts.fontSize || 16,
                color: getColor(opts.color),
                bold: opts.bold || false,
                align: opts.align || "left",
                valign: "top",
                fontFace: opts.bold ? theme.fontFace : theme.bodyFontFace
            };

            if (node.bullets) {
                const textObjects = node.bullets.map(b => ({
                    text: b.toString(),
                    options: { bullet: true, color: textOpts.color, fontSize: textOpts.fontSize, fontFace: textOpts.fontFace }
                }));
                slide.addText(textObjects, textOpts);
            } else if (node.text) {
                slide.addText(node.text, textOpts);
            }
        }
        else if (type === "image_frame") {
            let base64 = null;
            if (fetchImageBase64) {
                base64 = await fetchImageBase64(node.query);
            }
            
            if (base64) {
                slide.addImage({ data: base64, x: opts.x, y: opts.y, w: opts.w, h: opts.h, sizing: { type: opts.mode || "crop", w: opts.w, h: opts.h } });
            } else {
                // Defensive Fallback Crop
                slide.addShape(pres.ShapeType.roundRect, {
                    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
                    fill: { color: "333333" },
                    line: { color: "666666", width: 1 }
                });
                slide.addText("🖼 Image Placeholder", {
                    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
                    align: "center", valign: "middle", color: "FFFFFF", fontSize: 16
                });
            }
        }
        else if (type === "chart") {
            const chartData = [{
                name: 'Data',
                labels: node.data.labels || [],
                values: node.data.values || []
            }];
            const cType = node.chartType === "pie" ? pres.ChartType.pie : pres.ChartType.bar;
            slide.addChart(cType, chartData, {
                x: opts.x, y: opts.y, w: opts.w, h: opts.h,
                showLegend: true, legendPos: 'b',
                dataLabelColor: getColor("textPrimary"),
                chartColors: [getColor("accent"), getColor("cardBorder"), "555555", "777777"]
            });
        }
        else if (type === "table") {
            const tData = node.data;
            if (tData && tData.headers && tData.rows) {
                const headerRow = tData.headers.map(h => ({
                    text: String(h),
                    options: { bold: true, fill: getColor("accent"), color: "FFFFFF" }
                }));
                const tableArr = [headerRow];
                tData.rows.forEach(r => {
                    const rArr = r.map(c => ({
                        text: String(c),
                        options: { fill: getColor("cardBg"), color: getColor("textSecondary") }
                    }));
                    tableArr.push(rArr);
                });
                slide.addTable(tableArr, {
                    x: opts.x, y: opts.y, w: opts.w, h: opts.h,
                    border: { type: "none" }
                });
            }
        }

        // Recursively process children
        for (const child of children) {
            await processNode(child);
        }
    };

    await processNode(dslTree);
}

async function generatePPTX(dslPresentation, theme, exportPath, fetchImageBase64) {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9"; // Widescreen

    // Set master slide background
    pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: theme.bg || "0B0F19" }
    });

    for (const slideDSL of dslPresentation) {
        const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        await renderPptxDSL(slide, slideDSL, theme, fetchImageBase64, pres);
    }

    // Write to disk
    await pres.writeFile({ fileName: exportPath });
    console.log(`[PptxGenJS] Saved native PPTX to ${exportPath}`);
    return exportPath;
}

async function generatePPTXBuffer(dslPresentation, theme, fetchImageBase64) {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9"; // Widescreen

    // Set master slide background
    pres.defineSlideMaster({
        title: "MASTER_SLIDE",
        background: { color: theme.bg || "0B0F19" }
    });

    for (const slideDSL of dslPresentation) {
        const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
        await renderPptxDSL(slide, slideDSL, theme, fetchImageBase64, pres);
    }

    // Write to buffer
    const buffer = await pres.write('nodebuffer');
    return buffer;
}

module.exports = {
    generatePPTX,
    generatePPTXBuffer,
    renderPptxDSL
};
