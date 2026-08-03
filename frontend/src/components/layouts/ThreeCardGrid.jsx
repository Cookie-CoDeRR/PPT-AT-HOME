import React from 'react';

export default function ThreeCardGrid({ slide }) {
  const cards = slide.cards || [];

  return (
    <div className="flex flex-col h-full w-full">
      <h2 className="text-3xl font-bold mb-8 text-white text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        {cards.map((card, i) => (
          <div key={i} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md shadow-xl overflow-hidden relative group hover:bg-white/10 transition-colors">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <h3 className="text-xl font-bold text-gray-100 mb-4 tracking-tight">
              {card.card_title}
            </h3>
            
            <p className="text-gray-400 text-sm leading-relaxed overflow-y-auto custom-scrollbar pr-2">
              {card.card_text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
