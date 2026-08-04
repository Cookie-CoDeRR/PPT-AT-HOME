import React from 'react';

export default function SlideRenderer({ slide }) {
    if (!slide) return null;

    const { slide_type, title, subtitle, paragraphs, cards, left_content, image_description, left_box, right_box } = slide;

    return (
        <div className="w-full h-full p-8 flex flex-col justify-between text-slate-100 font-sans">
            {/* Slide Title Header (For non-hero slides) */}
            {slide_type !== 'title_hero' && title && (
                <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700/50 pb-3">
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

                        case 'bento_grid':
                            return (
                                <div className="grid grid-cols-2 gap-4">
                                    {(cards || []).slice(0, 4).map((card, idx) => (
                                        <div key={idx} className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                                            <h3 className="text-md font-semibold text-purple-300 mb-1">{card.header}</h3>
                                            <p className="text-sm text-slate-300 leading-relaxed">{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            );

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
