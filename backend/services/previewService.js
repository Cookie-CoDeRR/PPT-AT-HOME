const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const { generatePptx } = require('./pptService');

// LibreOffice executable path logic
const getLibreOfficePath = () => {
    if (process.platform === 'darwin') {
        // macOS typical paths
        const brewPath = '/opt/homebrew/bin/soffice';
        if (fs.existsSync(brewPath)) return brewPath;
        return '/Applications/LibreOffice.app/Contents/MacOS/soffice';
    } else if (process.platform === 'win32') {
        // Windows typical paths
        return 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
    }
    // Linux / Docker
    return 'soffice';
};

const SOFFICE_PATH = getLibreOfficePath();

/**
 * Generate a hash for the slides payload to use as a cache key.
 */
function generateHash(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

/**
 * Ensures the preview temp directory exists.
 */
function getPreviewDir() {
    const dir = path.join(__dirname, '..', 'temp', 'previews');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}

/**
 * Converts a PPTX file to PDF, then PDF to PNGs using a Python script.
 * LibreOffice natively only exports the first slide to PNG, so PDF is the intermediate.
 */
function convertPptxToPngsViaPdf(pptxPath, outDir) {
    return new Promise((resolve, reject) => {
        // 1. Convert to PDF
        const args = [
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', outDir,
            pptxPath
        ];
        
        console.log(`Running LibreOffice PDF: ${SOFFICE_PATH} ${args.join(' ')}`);
        
        const sofficeProcess = spawn(SOFFICE_PATH, args);
        
        let errStr = '';
        sofficeProcess.stderr.on('data', d => errStr += d.toString());

        sofficeProcess.on('close', (code) => {
            if (code !== 0) return reject(new Error(`LibreOffice PDF conversion failed with code ${code}. Error: ${errStr}`));
            resolve();
        });
        
        sofficeProcess.on('error', (err) => reject(err));
    }).then(() => {
        // 2. Convert PDF to PNGs using Python + PyMuPDF
        return new Promise((resolve, reject) => {
            const basename = path.basename(pptxPath, '.pptx');
            const pdfPath = path.join(outDir, `${basename}.pdf`);
            
            const pyScript = path.join(__dirname, 'pdf_to_png.py');
            if (!fs.existsSync(pyScript)) {
                fs.writeFileSync(pyScript, `
import sys, os
try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF not installed")
    sys.exit(1)

pdf_path = sys.argv[1]
out_dir = sys.argv[2]
basename = os.path.splitext(os.path.basename(pdf_path))[0]

doc = fitz.open(pdf_path)
for i in range(len(doc)):
    page = doc.load_page(i)
    pix = page.get_pixmap(dpi=150)
    out_name = os.path.join(out_dir, f"{basename}-{i}.png")
    pix.save(out_name)
                `.trim());
            }

            const venvPython = path.join(__dirname, '..', 'venv', 'bin', 'python3');
            const pythonBin = fs.existsSync(venvPython) ? venvPython : (process.env.PYTHON_PATH || 'python3');

            const runPy = () => {
                const pyProcess = spawn(pythonBin, [pyScript, pdfPath, outDir]);
                let pyOut = '';
                pyProcess.stdout.on('data', d => pyOut += d.toString());
                pyProcess.stderr.on('data', d => pyOut += d.toString());
                
                pyProcess.on('close', code => {
                    if (code !== 0) {
                        console.error('PDF to PNG conversion failed. Output:', pyOut);
                        // Attempt fallback: install pymupdf
                        if (pyOut.includes("PyMuPDF not installed") || pyOut.includes("No module named")) {
                            console.log("Installing PyMuPDF...");
                            const pipProcess = spawn(pythonBin, ['-m', 'pip', 'install', 'PyMuPDF']);
                            pipProcess.on('close', (pipCode) => {
                                if (pipCode === 0) {
                                     // retry
                                     const retryProcess = spawn(pythonBin, [pyScript, pdfPath, outDir]);
                                     retryProcess.on('close', rCode => {
                                         if (rCode === 0) {
                                             resolve(findGeneratedPngs(outDir, basename));
                                         } else {
                                             reject(new Error("Failed to convert PDF to PNGs after installing PyMuPDF"));
                                         }
                                     });
                                } else {
                                     reject(new Error(`Failed to install PyMuPDF`));
                                }
                            });
                        } else {
                            reject(new Error(`Python script failed: ${pyOut}`));
                        }
                    } else {
                        resolve(findGeneratedPngs(outDir, basename));
                    }
                });
            };
            
            runPy();
        });
    });
}

function findGeneratedPngs(outDir, basename) {
    const files = fs.readdirSync(outDir);
    return files
        .filter(f => f.startsWith(basename) && f.endsWith('.png'))
        .sort((a, b) => {
            const numA = parseInt(a.replace(/\\D/g, '') || '0', 10);
            const numB = parseInt(b.replace(/\\D/g, '') || '0', 10);
            return numA - numB;
        })
        .map(f => path.join(outDir, f));
}

/**
 * Generate preview images for a presentation
 */
async function generatePreview(payload) {
    const { slides, title, theme, slideSize, customTheme, customBackground, imageStyle, templateType, cloudTemplateUrl } = payload;
    
    // Hash the payload to check cache
    const hash = generateHash({ slides, title, theme, slideSize, customTheme, customBackground, imageStyle, templateType, cloudTemplateUrl });
    const previewDir = getPreviewDir();
    const cacheDir = path.join(previewDir, hash);
    
    if (fs.existsSync(cacheDir)) {
        // Return cached PNGs
        const pngFiles = findGeneratedPngs(cacheDir, 'preview');
        if (pngFiles.length > 0) {
             return {
                 hash,
                 slides: pngFiles.map((_, index) => ({
                     index,
                     url: `/api/preview/${hash}/${index}`
                 }))
             };
        }
    } else {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    let pptxBuffer;
    
    // Generate the PPTX using existing logic
    if (templateType === 'custom' || templateType === 'online') {
        throw new Error("Previewing template-based presentations currently unsupported in this route");
    } else {
        let customThemeObj = null;
        if (customTheme) {
            try { customThemeObj = typeof customTheme === 'string' ? JSON.parse(customTheme) : customTheme; } catch(e){}
        }
        
        let customBgObj = null;
        if (customBackground) {
            try { customBgObj = typeof customBackground === 'string' ? JSON.parse(customBackground) : customBackground; } catch(e){}
        }

        let slidesJson;
        try {
            slidesJson = typeof slides === 'string' ? JSON.parse(slides) : slides;
        } catch (e) {
            slidesJson = slides;
        }

        pptxBuffer = await generatePptx(slidesJson, title, theme, slideSize, customThemeObj, customBgObj, imageStyle);
    }
    
    // Write PPTX to temp file
    const pptxPath = path.join(cacheDir, 'preview.pptx');
    fs.writeFileSync(pptxPath, pptxBuffer);
    
    // Convert to PNGs
    const pngFiles = await convertPptxToPngsViaPdf(pptxPath, cacheDir);
    
    return {
        hash,
        slides: pngFiles.map((_, index) => ({
            index,
            url: `/api/preview/${hash}/${index}`
        }))
    };
}

module.exports = {
    generatePreview
};
