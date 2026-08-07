import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Helper to add opacity to hex colors from our dynamic theme engine
const hexToRgba = (hex, alpha) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2), 16) || 0;
    const g = parseInt(cleanHex.slice(2, 4), 16) || 0;
    const b = parseInt(cleanHex.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const DEFAULT_THEME = {
    bg: "0B0F19",
    cardBg: "121622",
    cardBorder: "2D344B",
    textPrimary: "FFFFFF",
    textSecondary: "A0A8BE",
    accent: "6366F1",
    fontFace: "Inter",
    bodyFontFace: "sans-serif"
};

export default function SlideRenderer({ slide, theme }) {
    if (!slide) return null;

    const t = theme || DEFAULT_THEME;
    const { slide_type, title, subtitle, paragraphs, cards, left_content, image_description, left_box, right_box, table_data, chart_data } = slide;

    const baseStyle = {
        backgroundColor: `#${t.bg}`,
        color: `#${t.textPrimary}`,
        fontFamily: `"${t.fontFace}", sans-serif`
    };

    const cardStyle = {
        backgroundColor: hexToRgba(t.cardBg, 0.6),
        borderColor: hexToRgba(t.cardBorder, 0.6),
        borderWidth: '1px',
        borderStyle: 'solid'
    };

    return (
        <div className="w-full h-full p-8 flex flex-col justify-between" style={baseStyle}>
            {/* Slide Title Header (For non-hero slides) */}
            {slide_type !== 'title_hero' && slide_type !== 'title_split' && title && (
                <h2 className="text-2xl font-bold mb-6 pb-3 whitespace-pre-wrap" style={{ borderBottom: `1px solid ${hexToRgba(t.cardBorder, 0.5)}` }}>
                    {title}
                </h2>
            )}

            {/* Dynamic Layout Engine */}
            <div className="flex-1 flex flex-col justify-center" style={{ fontFamily: `"${t.bodyFontFace}", sans-serif` }}>
                {(() => {
                    switch (slide_type) {
                        case 'title_hero':
                            return (
                                <div className="text-center py-12 space-y-4">
                                    <h1 className="text-4xl font-extrabold leading-tight" style={{ color: `#${t.accent}` }}>
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-lg max-w-2xl mx-auto" style={{ color: `#${t.textSecondary}` }}>
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            );

                        case 'bento_grid': {
                            const gridCards = cards || (slide.items || []).map(i => ({ header: i.title || i.item_title, description: i.desc || i.item_text }));
                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    {gridCards.slice(0, 4).map((card, idx) => (
                                        <div key={idx} className="rounded-xl p-4 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col" style={cardStyle}>
                                            <h3 className="text-md font-semibold mb-1" style={{ color: `#${t.accent}` }}>{card.header}</h3>
                                            <p className="text-sm leading-relaxed overflow-y-auto" style={{ color: `#${t.textSecondary}` }}>{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        case 'two_column_image':
                            return (
                                <div className="grid grid-cols-2 gap-6 items-center">
                                    <div className="text-sm leading-relaxed space-y-3" style={{ color: `#${t.textSecondary}` }}>
                                        <p>{left_content}</p>
                                    </div>
                                    <div className="border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center h-48" style={{ backgroundColor: hexToRgba(t.cardBg, 0.8), borderColor: `#${t.cardBorder}` }}>
                                        <span className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: `#${t.accent}` }}>[ Visual Concept ]</span>
                                        <p className="text-sm italic" style={{ color: `#${t.textSecondary}` }}>{image_description || "Visual asset placeholder"}</p>
                                    </div>
                                </div>
                            );

                        case 'comparison':
                            return (
                                <div className="grid grid-cols-2 gap-6">
                                    {left_box && (
                                        <div className="rounded-xl p-4" style={{ backgroundColor: hexToRgba(t.accent, 0.1), border: `1px solid ${hexToRgba(t.accent, 0.3)}` }}>
                                            <h3 className="text-md font-semibold mb-3" style={{ color: `#${t.accent}` }}>{left_box.header}</h3>
                                            <ul className="space-y-2 text-sm" style={{ color: `#${t.textPrimary}` }}>
                                                {(left_box.points || []).map((pt, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span style={{ color: `#${t.accent}` }}>•</span>
                                                        <span style={{ color: `#${t.textSecondary}` }}>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {right_box && (
                                        <div className="rounded-xl p-4" style={{ backgroundColor: hexToRgba(t.cardBg, 0.6), border: `1px solid ${hexToRgba(t.cardBorder, 0.8)}` }}>
                                            <h3 className="text-md font-semibold mb-3" style={{ color: `#${t.textPrimary}` }}>{right_box.header}</h3>
                                            <ul className="space-y-2 text-sm" style={{ color: `#${t.textPrimary}` }}>
                                                {(right_box.points || []).map((pt, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span style={{ color: `#${t.textSecondary}` }}>•</span>
                                                        <span style={{ color: `#${t.textSecondary}` }}>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );

                        case 'chart_pie':
                        case 'chart_bar': {
                            if (!chart_data || !chart_data.labels || !chart_data.values) return null;
                            const data = chart_data.labels.map((label, i) => ({ name: label, value: chart_data.values[i] }));
                            // Derive colors from the theme for the charts
                            const COLORS = [`#${t.accent}`, hexToRgba(t.accent, 0.8), hexToRgba(t.accent, 0.6), hexToRgba(t.accent, 0.4), hexToRgba(t.accent, 0.2)];
                            
                            return (
                                <div className="w-full h-64 rounded-xl p-4" style={cardStyle}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        {slide_type === 'chart_pie' ? (
                                            <PieChart>
                                                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: `#${t.cardBg}`, border: 'none', borderRadius: '8px', color: `#${t.textPrimary}` }} />
                                            </PieChart>
                                        ) : (
                                            <BarChart data={data}>
                                                <XAxis dataKey="name" stroke={`#${t.textSecondary}`} fontSize={12} />
                                                <YAxis stroke={`#${t.textSecondary}`} fontSize={12} />
                                                <Tooltip contentStyle={{ backgroundColor: `#${t.cardBg}`, border: 'none', borderRadius: '8px', color: `#${t.textPrimary}` }} cursor={{ fill: hexToRgba(t.textPrimary, 0.05) }} />
                                                <Bar dataKey="value" fill={`#${t.accent}`} radius={[4, 4, 0, 0]}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            );
                        }

                        case 'data_table':
                            if (!table_data || !table_data.headers || !table_data.rows) return null;
                            return (
                                <div className="w-full overflow-hidden rounded-xl" style={cardStyle}>
                                    <table className="w-full text-sm text-left">
                                        <thead style={{ backgroundColor: hexToRgba(t.accent, 0.2), color: `#${t.textPrimary}` }}>
                                            <tr>
                                                {table_data.headers.map((h, i) => (
                                                    <th key={i} className="px-4 py-3 font-semibold" style={{ borderBottom: `1px solid ${hexToRgba(t.accent, 0.3)}` }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ divideColor: hexToRgba(t.cardBorder, 0.5), color: `#${t.textSecondary}` }}>
                                            {table_data.rows.map((row, i) => (
                                                <tr key={i} className="transition-colors hover:bg-black/10">
                                                    {row.map((cell, j) => (
                                                        <td key={j} className="px-4 py-3">{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );

                        case 'title_split':
                            return (
                                <div className="grid grid-cols-2 gap-8 items-center h-full">
                                    <div className="space-y-4">
                                        <h1 className="text-4xl font-extrabold leading-tight" style={{ color: `#${t.accent}` }}>
                                            {title}
                                        </h1>
                                        {subtitle && (
                                            <p className="text-lg" style={{ color: `#${t.textSecondary}` }}>
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className="rounded-2xl h-64 flex items-center justify-center" style={{ backgroundColor: hexToRgba(t.accent, 0.1), border: `1px solid ${hexToRgba(t.accent, 0.3)}` }}>
                                        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: hexToRgba(t.accent, 0.5) }}>[ Featured Visual ]</span>
                                    </div>
                                </div>
                            );

                        case 'standard_text':
                        default:
                            return (
                                <div className="space-y-4 text-sm leading-relaxed" style={{ color: `#${t.textSecondary}` }}>
                                    {(paragraphs || [slide.text || slide.content]).filter(Boolean).map((p, idx) => (
                                        <p key={idx}>{p}</p>
                                    ))}
                                </div>
                            );
                    }
                })()}
            </div>
        </div>
    );
}
