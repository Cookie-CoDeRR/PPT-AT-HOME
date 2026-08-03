import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';

export default function ComparisonLayout({ slide }) {
  const left = slide.column_left || { title: 'Option A', bullets: [] };
  const right = slide.column_right || { title: 'Option B', bullets: [] };

  return (
    <div className="flex flex-col h-full w-full">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-8 text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="flex flex-1 gap-8 min-h-0">
        
        {/* Left Column */}
        <div className="flex-1 flex flex-col border border-current/10 rounded-2xl p-8 overflow-hidden relative shadow-xl backdrop-blur-md" style={{ backgroundColor: 'var(--theme-shape)' }}>
          <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: 'var(--theme-accent)' }} />
          <h3 style={{ color: 'inherit' }} className="text-2xl font-bold mb-6 text-center">{left.title}</h3>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {left.bullets && left.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'currentColor', opacity: 0.8 }} />
                <p className="text-lg leading-relaxed opacity-80">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

        {/* VS Badge */}
        <div className="flex flex-col justify-center items-center -mx-4 z-10">
           <div className="w-12 h-12 border border-current/20 rounded-full flex items-center justify-center font-black text-lg shadow-2xl" style={{ backgroundColor: 'var(--theme-accent)' }}>
             <span style={{ filter: 'invert(1)' }}>VS</span>
           </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 flex flex-col border border-current/10 rounded-2xl p-8 overflow-hidden relative shadow-xl backdrop-blur-md" style={{ backgroundColor: 'var(--theme-shape)' }}>
          <div className="absolute top-0 left-0 w-full h-1 opacity-80" style={{ backgroundColor: 'var(--theme-accent)' }} />
          <h3 style={{ color: 'inherit' }} className="text-2xl font-bold mb-6 text-center">{right.title}</h3>
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {right.bullets && right.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3">
                <ArrowRight className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'currentColor', opacity: 0.8 }} />
                <p className="text-lg leading-relaxed opacity-80">{bullet}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
