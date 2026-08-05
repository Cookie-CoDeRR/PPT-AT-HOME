import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function SlideRenderer({ slide }) {
    if (!slide) return null;

    const { slide_type, title, subtitle, paragraphs, cards, left_content, image_description, left_box, right_box, table_data, chart_data } = slide;

    return (
        <div className="w-full h-full p-8 flex flex-col justify-between text-slate-100 font-sans">
            {/* Slide Title Header (For non-hero slides) */}
            {slide_type !== 'title_hero' && title && (
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700/50 pb-3 whitespace-pre-wrap">
                    {title}
                </h2>
            )}

            {/* Dynamic Layout Engine */}
            <div className="flex-1 flex flex-col justify-center">
                {(() => {
                    switch (slide_type) {
                        case 'title_hero':
                            return (
                                <div className="text-center py-12 space-y-4">
                                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
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
                                        <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-sm overflow-hidden flex flex-col">
                                            <h3 className="text-md font-semibold text-purple-300 mb-1">{card.header}</h3>
                                            <p className="text-sm text-slate-300 leading-relaxed overflow-y-auto">{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            );
                        }

                        case 'two_column_image':
                            return (
                                <div className="grid grid-cols-2 gap-6 items-center">
                                    <div className="text-sm text-slate-300 leading-relaxed space-y-3">
                                        <p>{left_content}</p>
                                    </div>
                                    <div className="bg-slate-800/80 border border-dashed border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-center h-48">
                                        <span className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-2">[ Visual Concept ]</span>
                                        <p className="text-sm text-slate-300 italic">{image_description || "Visual asset placeholder"}</p>
                                    </div>
                                </div>
                            );

                        case 'comparison':
                            return (
                                <div className="grid grid-cols-2 gap-6">
                                    {left_box && (
                                        <div className="bg-rose-950/30 border border-rose-800/50 rounded-xl p-4">
                                            <h3 className="text-md font-semibold text-rose-300 mb-3">{left_box.header}</h3>
                                            <ul className="space-y-2 text-sm text-rose-200/80">
                                                {(left_box.points || []).map((pt, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-rose-400">•</span>
                                                        <span>{pt}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {right_box && (
                                        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4">
                                            <h3 className="text-md font-semibold text-emerald-300 mb-3">{right_box.header}</h3>
                                            <ul className="space-y-2 text-sm text-emerald-200/80">
                                                {(right_box.points || []).map((pt, i) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-emerald-400">•</span>
                                                        <span>{pt}</span>
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
                            const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];
                            
                            return (
                                <div className="w-full h-64 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {slide_type === 'chart_pie' ? (
                                            <PieChart>
                                                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                            </PieChart>
                                        ) : (
                                            <BarChart data={data}>
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                                <YAxis stroke="#94a3b8" fontSize={12} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
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
                                <div className="w-full overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-violet-900/30 text-violet-200">
                                            <tr>
                                                {table_data.headers.map((h, i) => (
                                                    <th key={i} className="px-4 py-3 font-semibold border-b border-violet-800/30">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-700/50 text-slate-300">
                                            {table_data.rows.map((row, i) => (
                                                <tr key={i} className="hover:bg-slate-700/20 transition-colors">
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
                                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300 leading-tight">
                                            {title}
                                        </h1>
                                        {subtitle && (
                                            <p className="text-lg text-slate-400">
                                                {subtitle}
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl h-64 flex items-center justify-center">
                                        <span className="text-violet-400/50 text-sm font-bold uppercase tracking-widest">[ Featured Visual ]</span>
                                    </div>
                                </div>
                            );

                        case 'standard_text':
                        default:
                            return (
                                <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
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
