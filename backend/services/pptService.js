const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const IMAGE_STYLE_PRESETS = {
    isometric_3d: ", highly detailed isometric 3D render, glassmorphism UI elements, dark mode, glowing neon accents, clean corporate tech presentation asset, 8k resolution, unreal engine 5, abstract digital art, vibrant.",
    stock_photo: ", professional stock photo, high quality, sharp focus, natural lighting, business setting, photorealistic.",
    flat_design: ", flat design illustration, minimal, clean vector art, bold colors, simple shapes, modern infographic style.",
    watercolor: ", soft watercolor illustration, artistic, gentle brush strokes, pastel tones, dreamy, creative presentation asset.",
    cinematic: ", cinematic photograph, dramatic lighting, shallow depth of field, 85mm lens, moody atmosphere, ultra-realistic.",
    minimal_dark: ", minimal dark background, sleek product shot, soft gradient, professional tech aesthetic, studio lighting.",
};

async function generatePptx(slides, title, themeName, slideSize, customThemeObj, customBgObj, imageStyle) {
    throw new Error("Deprecated in favor of the new /api/generate-presentation endpoint architecture.");
}

const AutomizerLib = require('pptx-automizer');
const Automizer = AutomizerLib.default || AutomizerLib;
const modify = AutomizerLib.modify;

async function generateFromTemplate(slides, title, templatePath) {
    const outputDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const automizer = new Automizer({
        templateDir: path.dirname(templatePath),
        outputDir: outputDir
    });

    const templateName = path.basename(templatePath);
    let pres = automizer.loadRoot(templateName).load(templateName, 'master');

    slides.forEach((slideData, idx) => {
        // Assume Slide 1 is Title, Slide 2 is Content in the Master Template.
        let slideIndex = slideData.layout_type === "Title Slide" ? 1 : 2;

        pres.addSlide('master', slideIndex, (slide) => {
            slide.modifyElement('Title 1', [modify.setText(slideData.title || '')]);
            slide.modifyElement('Title 2', [modify.setText(slideData.title || '')]);
            slide.modifyElement('Title', [modify.setText(slideData.title || '')]);

            if (slideData.bullets && slideData.bullets.length > 0) {
                const bulletText = slideData.bullets.join('\n');
                slide.modifyElement('Content Placeholder 2', [modify.setText(bulletText)]);
                slide.modifyElement('Text Placeholder 2', [modify.setText(bulletText)]);
                slide.modifyElement('Content', [modify.setText(bulletText)]);
            }
        });
    });

    const outputPath = path.join(outputDir, `output_${Date.now()}.pptx`);
    try {
        await pres.write(path.basename(outputPath));
        const buffer = fs.readFileSync(outputPath);
        return buffer;
    } finally {
        if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
        }
    }
}

module.exports = {
    generatePptx,
    generateFromTemplate,
    IMAGE_STYLE_PRESETS
};
