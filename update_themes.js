const fs = require('fs');

const THEME_PRESETS = [
  { id: "modern_sans", name: "Modern Clean", headerFont: "Inter", bodyFont: "Plus Jakarta Sans", bgColor: "#0f172a", accentColor: "#8b5cf6", titleColor: "#f8fafc", textColor: "#cbd5e1", cardBg: "rgba(30, 41, 59, 0.7)", cardBgHex: "1e293b" },
  { id: "editorial_serif", name: "Editorial Serif", headerFont: "Playfair Display", bodyFont: "Source Sans Pro", bgColor: "#18181b", accentColor: "#f43f5e", titleColor: "#ffffff", textColor: "#d4d4d8", cardBg: "rgba(39, 39, 42, 0.7)", cardBgHex: "27272a" },
  { id: "tech_mono", name: "Cyber Mono", headerFont: "JetBrains Mono", bodyFont: "Fira Code", bgColor: "#090d16", accentColor: "#06b6d4", titleColor: "#e2e8f0", textColor: "#94a3b8", cardBg: "rgba(15, 23, 42, 0.8)", cardBgHex: "0f172a" },
  { id: "bold_startup", name: "Vibrant Startup", headerFont: "Montserrat", bodyFont: "Roboto", bgColor: "#111827", accentColor: "#10b981", titleColor: "#ffffff", textColor: "#d1d5db", cardBg: "rgba(31, 41, 55, 0.7)", cardBgHex: "1f2937" },
  { id: "classic_light", name: "Classic Light", headerFont: "Helvetica Neue", bodyFont: "Helvetica", bgColor: "#f8fafc", accentColor: "#3b82f6", titleColor: "#0f172a", textColor: "#334155", cardBg: "rgba(255, 255, 255, 0.8)", cardBgHex: "ffffff" },
  { id: "elegant_dark", name: "Elegant Dark", headerFont: "Cinzel", bodyFont: "Lora", bgColor: "#2c1e16", accentColor: "#d4af37", titleColor: "#fdfbf7", textColor: "#eaddcf", cardBg: "rgba(61, 43, 31, 0.7)", cardBgHex: "3d2b1f" },
  { id: "playful_rounded", name: "Playful Rounded", headerFont: "Nunito", bodyFont: "Quicksand", bgColor: "#fffbeb", accentColor: "#f59e0b", titleColor: "#451a03", textColor: "#78350f", cardBg: "rgba(254, 243, 199, 0.8)", cardBgHex: "fef3c7" },
  { id: "corporate_pro", name: "Corporate Pro", headerFont: "Open Sans", bodyFont: "Lato", bgColor: "#f1f5f9", accentColor: "#0ea5e9", titleColor: "#0f172a", textColor: "#475569", cardBg: "rgba(255, 255, 255, 0.9)", cardBgHex: "ffffff" },
  { id: "futuristic", name: "Futuristic", headerFont: "Orbitron", bodyFont: "Rajdhani", bgColor: "#020617", accentColor: "#e11d48", titleColor: "#f8fafc", textColor: "#94a3b8", cardBg: "rgba(15, 23, 42, 0.8)", cardBgHex: "0f172a" },
  { id: "retro_type", name: "Retro Typewriter", headerFont: "Courier New", bodyFont: "Courier", bgColor: "#fef08a", accentColor: "#ea580c", titleColor: "#422006", textColor: "#713f12", cardBg: "rgba(253, 224, 71, 0.5)", cardBgHex: "fde047" }
];

// 1. Write frontend/src/config/themes.js
let themesJs = `export const THEME_PRESETS = [\n`;
THEME_PRESETS.forEach((p, i) => {
  themesJs += `  {
    id: "${p.id}",
    name: "${p.name}",
    headerFont: "${p.headerFont}",
    bodyFont: "${p.bodyFont}",
    bgColor: "${p.bgColor}",
    accentColor: "${p.accentColor}",
    titleColor: "${p.titleColor}",
    textColor: "${p.textColor}",
    cardBg: "${p.cardBg}"
  }${i < THEME_PRESETS.length - 1 ? ',' : ''}\n`;
});
themesJs += `];\n`;
fs.writeFileSync('frontend/src/config/themes.js', themesJs);

// 2. Update backend/services/pptService.js
let pptService = fs.readFileSync('backend/services/pptService.js', 'utf8');
let pptPresetsStr = `const THEME_PRESETS = [\n`;
THEME_PRESETS.forEach((p, i) => {
  pptPresetsStr += `      { name: "${p.name}", headerFont: "${p.headerFont}", bodyFont: "${p.bodyFont}", bgColor: "${p.bgColor.replace('#', '')}", accentColor: "${p.accentColor.replace('#', '')}", titleColor: "${p.titleColor.replace('#', '')}", textColor: "${p.textColor.replace('#', '')}", cardBg: "${p.cardBgHex}" }${i < THEME_PRESETS.length - 1 ? ',' : ''}\n`;
});
pptPresetsStr += `    ];`;

pptService = pptService.replace(/const THEME_PRESETS = \[[\s\S]*?\];/, pptPresetsStr);
fs.writeFileSync('backend/services/pptService.js', pptService);
console.log("Updated themes.");
