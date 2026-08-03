import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function DefaultLayout({ slide }) {
  const hasImage = !!slide.image_search_query;

  const content = (
    <div className="flex flex-col h-full justify-center">
       <h2 style={{ color: 'inherit' }} className={`font-bold mb-6 leading-tight ${hasImage ? 'text-3xl' : 'text-5xl text-center'}`}>
         {slide.title}
       </h2>
       {slide.subtitle && (
         <p className={`text-xl font-medium mb-8 opacity-80 ${!hasImage && 'text-center'}`}>
           {slide.subtitle}
         </p>
       )}
       <div className={`space-y-4 ${!hasImage && 'max-w-4xl mx-auto'}`}>
         {slide.bullets && slide.bullets.map((bullet, i) => (
           <div key={i} className="flex items-start gap-3">
             <div className="w-1.5 h-1.5 rounded-full mt-2.5 flex-shrink-0" style={{ backgroundColor: 'currentColor', opacity: 0.8 }} />
             <p className={`leading-relaxed opacity-90 ${hasImage ? 'text-lg' : 'text-2xl'}`}>{bullet}</p>
           </div>
         ))}
       </div>
    </div>
  );

  if (hasImage) {
    return (
      <div className="flex w-full h-full gap-10">
        <div className="flex-1 min-w-0">
          {content}
        </div>
        <div className="flex-1 min-w-0 h-full relative rounded-xl overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
             <ImageIcon className="w-12 h-12 text-gray-600 mb-2" />
             <span className="absolute bottom-4 left-4 text-xs text-gray-500 bg-black/60 px-3 py-1.5 rounded uppercase tracking-wider backdrop-blur-sm border border-white/10">
               Prompt: {slide.image_search_query}
             </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
       <div className="w-full">
         {content}
       </div>
    </div>
  );
}
