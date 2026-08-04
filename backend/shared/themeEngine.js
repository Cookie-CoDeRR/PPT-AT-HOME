const THEMES = {
    dark_glass: {
        id: "dark_glass",
        name: "Midnight Navy (Default)",
        bg: "0B0F19",
        cardBg: "121622",
        cardBorder: "2D344B",
        textPrimary: "FFFFFF",
        textSecondary: "A0A8BE",
        accent: "6366F1",
        fontFace: "Inter",
        bodyFontFace: "Plus Jakarta Sans"
    },
    light_corporate: {
        id: "light_corporate",
        name: "Clean Slate Light",
        bg: "F8FAFC",
        cardBg: "FFFFFF",
        cardBorder: "E2E8F0",
        textPrimary: "0F172A",
        textSecondary: "475569",
        accent: "2563EB",
        fontFace: "Helvetica Neue",
        bodyFontFace: "Helvetica"
    },
    cyberpunk_neon: {
        id: "cyberpunk_neon",
        name: "Cyberpunk Neon",
        bg: "05050A",
        cardBg: "0D0D1A",
        cardBorder: "FF007F",
        textPrimary: "00F0FF",
        textSecondary: "E0E0E0",
        accent: "FF007F",
        fontFace: "JetBrains Mono",
        bodyFontFace: "Fira Code"
    }
};

function getTheme(themeId) {
    return THEMES[themeId] || THEMES.dark_glass;
}

module.exports = {
    THEMES,
    getTheme
};
