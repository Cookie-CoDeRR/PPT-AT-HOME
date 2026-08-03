const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function generatePptx(slides, title, themeName, slideSize, customThemeObj, customBgObj) {
    
    const THEME_PRESETS = [
      { name: "Modern Clean", headerFont: "Inter", bodyFont: "Plus Jakarta Sans", bgColor: "0f172a", accentColor: "8b5cf6", titleColor: "f8fafc", textColor: "cbd5e1", cardBg: "1e293b" },
      { name: "Editorial Serif", headerFont: "Playfair Display", bodyFont: "Source Sans Pro", bgColor: "18181b", accentColor: "f43f5e", titleColor: "ffffff", textColor: "d4d4d8", cardBg: "27272a" },
      { name: "Cyber Mono", headerFont: "JetBrains Mono", bodyFont: "Fira Code", bgColor: "090d16", accentColor: "06b6d4", titleColor: "e2e8f0", textColor: "94a3b8", cardBg: "0f172a" },
      { name: "Vibrant Startup", headerFont: "Montserrat", bodyFont: "Roboto", bgColor: "111827", accentColor: "10b981", titleColor: "ffffff", textColor: "d1d5db", cardBg: "1f2937" },
      { name: "Classic Light", headerFont: "Helvetica Neue", bodyFont: "Helvetica", bgColor: "f8fafc", accentColor: "3b82f6", titleColor: "0f172a", textColor: "334155", cardBg: "ffffff" },
      { name: "Elegant Dark", headerFont: "Cinzel", bodyFont: "Lora", bgColor: "2c1e16", accentColor: "d4af37", titleColor: "fdfbf7", textColor: "eaddcf", cardBg: "3d2b1f" },
      { name: "Playful Rounded", headerFont: "Nunito", bodyFont: "Quicksand", bgColor: "fffbeb", accentColor: "f59e0b", titleColor: "451a03", textColor: "78350f", cardBg: "fef3c7" },
      { name: "Corporate Pro", headerFont: "Open Sans", bodyFont: "Lato", bgColor: "f1f5f9", accentColor: "0ea5e9", titleColor: "0f172a", textColor: "475569", cardBg: "ffffff" },
      { name: "Futuristic", headerFont: "Orbitron", bodyFont: "Rajdhani", bgColor: "020617", accentColor: "e11d48", titleColor: "f8fafc", textColor: "94a3b8", cardBg: "0f172a" },
      { name: "Retro Typewriter", headerFont: "Courier New", bodyFont: "Courier", bgColor: "fef08a", accentColor: "ea580c", titleColor: "422006", textColor: "713f12", cardBg: "fde047" }
    ];

    const themes = THEME_PRESETS.reduce((acc, preset) => {
      acc[preset.name] = {
        bkgd: preset.bgColor.replace('#', ''),
        titleColor: preset.titleColor.replace('#', ''),
        textColor: preset.textColor.replace('#', ''),
        accent: preset.accentColor.replace('#', ''),
        shapeFill: preset.cardBg.replace('#', ''),
        fontFace: preset.headerFont.split(',')[0].trim(),
        bodyFontFace: preset.bodyFont.split(',')[0].trim()
      };
      return acc;
    }, {});

    let theme = themes[themeName] || themes['Modern Clean'];
    if (customThemeObj) {
        theme = {
            ...theme,
            bkgd: customThemeObj.bkgd || theme.bkgd,
            textColor: customThemeObj.textColor || theme.textColor,
            titleColor: customThemeObj.textColor || theme.titleColor,
            accent: customThemeObj.accent || theme.accent,
            fontFace: customThemeObj.fontFace || theme.fontFace,
            bodyFontFace: customThemeObj.fontFace || theme.bodyFontFace
        };
    }

    async function fetchImageBase64(query) {
        if (!query) return null;
        try {
            const ENHANCEMENT_SUFFIX = ", highly detailed isometric 3D render, glassmorphism UI elements, dark mode, glowing neon accents, clean corporate tech presentation asset, 8k resolution, unreal engine 5, abstract digital art, vibrant.";
            const enhancedQuery = query.trim() + ENHANCEMENT_SUFFIX;
            
            // First try local Python diffusers endpoint
            try {
                const response = await axios.post('http://127.0.0.1:5000/generate-image', 
                    { prompt: enhancedQuery, steps: 4 }, 
                    { responseType: 'arraybuffer', timeout: 15000 }
                );
                const base64 = Buffer.from(response.data, 'binary').toString('base64');
                const contentType = response.headers['content-type'] || 'image/jpeg';
                console.log(`Successfully generated image locally for: ${query}`);
                return `data:${contentType};base64,${base64}`;
            } catch (localErr) {
                console.log(`Local image generation failed/unavailable for "${query}". Falling back to Pollinations AI...`);
            }
            
            // Fallback to Pollinations AI
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedQuery)}?width=800&height=600&nologo=true`;
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const base64 = Buffer.from(response.data, 'binary').toString('base64');
            const contentType = response.headers['content-type'] || 'image/jpeg';
            return `data:${contentType};base64,${base64}`;
        } catch (e) {
            console.error("Failed to fetch image:", e.message);
            return null;
        }
    }

    // Pre-fetch images concurrently
    const imagePromises = slides.map(async (slide) => {
        if (slide.image_search_query) {
            slide.image_base64 = await fetchImageBase64(slide.image_search_query);
        }
    });
    await Promise.all(imagePromises);

    const payload = {
        title: title || "Presentation",
        theme: theme,
        slides: slides,
        slideSize: slideSize,
        customBackground: customBgObj
    };

    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        
        const timestamp = Date.now();
        const inputPath = path.join(tempDir, `input_${timestamp}.json`);
        const outputPath = path.join(tempDir, `output_${timestamp}.pptx`);
        
        fs.writeFileSync(inputPath, JSON.stringify(payload));
        
        const args = [
            path.join(__dirname, 'export_pptx.py'),
            '--input', inputPath,
            '--output', outputPath
        ];

        if (customBgObj) {
            args.push('--custom_bg', JSON.stringify(customBgObj));
        }
        
        const venvPython = path.join(__dirname, '..', 'venv', 'bin', 'python3');
        const pythonBin = fs.existsSync(venvPython) ? venvPython : (process.env.PYTHON_PATH || 'python3');
        
        const pythonProcess = spawn(pythonBin, args);
        
        pythonProcess.stdout.on('data', (data) => {
            console.log(`Python Exporter: ${data}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Python Exporter Error: ${data}`);
        });
        
        pythonProcess.on('error', (err) => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            reject(new Error(`Failed to start python process: ${err.message}`));
        });

        pythonProcess.on('close', (code) => {
            const cleanup = () => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            };

            if (code !== 0) {
                cleanup();
                return reject(new Error(`Python process exited with code ${code}`));
            }
            
            try {
                const buffer = fs.readFileSync(outputPath);
                cleanup();
                resolve(buffer);
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    });
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
            slide.modifyElement('Title 1', [ modify.setText(slideData.title || '') ]);
            slide.modifyElement('Title 2', [ modify.setText(slideData.title || '') ]);
            slide.modifyElement('Title', [ modify.setText(slideData.title || '') ]);
            
            if (slideData.bullets && slideData.bullets.length > 0) {
                const bulletText = slideData.bullets.join('\n');
                slide.modifyElement('Content Placeholder 2', [ modify.setText(bulletText) ]);
                slide.modifyElement('Text Placeholder 2', [ modify.setText(bulletText) ]);
                slide.modifyElement('Content', [ modify.setText(bulletText) ]);
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
    generateFromTemplate
};
