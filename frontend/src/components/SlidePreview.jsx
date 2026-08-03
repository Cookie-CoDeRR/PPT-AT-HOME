import React from 'react';

export default function SlidePreview({ slides }) {
  if (!slides) return null;
  if (!Array.isArray(slides)) return <div className="p-4 bg-red-50 text-red-600 rounded">Error: Invalid presentation structure received from LLM.</div>;
  if (slides.length === 0) return null;

  return (
    <div className="space-y-6">
      {slides.map((slide, index) => {
        if (!slide || typeof slide !== 'object') return null;
        
        return (
        <div key={index} className="bg-white/60 backdrop-blur-sm border border-white/40 shadow-sm rounded-2xl p-6 relative group overflow-hidden transition-all hover:bg-white/80">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-purple-500"></div>
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Slide {slide.slide_number || (index + 1)} • {slide.layout_type || 'Slide'}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {typeof slide.title === 'string' ? slide.title : JSON.stringify(slide.title)}
          </h3>

          <div className="flex gap-6">
            <div className="flex-1">
              {slide.bullets && Array.isArray(slide.bullets) && slide.bullets.length > 0 && (
                <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
                  {slide.bullets.map((bullet, i) => (
                    <li key={i}>{typeof bullet === 'object' ? JSON.stringify(bullet) : String(bullet)}</li>
                  ))}
                </ul>
              )}
            </div>

            {slide.image_search_query && (
              <div className="w-1/3 flex-shrink-0">
                <img 
                  src={`https://image.pollinations.ai/prompt/${encodeURIComponent(slide.image_search_query)}?width=400&height=300&nologo=true`} 
                  alt={slide.image_search_query} 
                  className="rounded-lg shadow-sm border border-gray-200/50 w-full object-cover aspect-video"
                />
                <p className="text-[10px] text-gray-400 mt-1 text-center italic">Auto-generated image</p>
              </div>
            )}
          </div>

          {slide.speaker_notes && (
            <div className="mt-4 pt-4 border-t border-gray-200/50 bg-amber-50/50 p-4 rounded-xl backdrop-blur-sm">
              <h4 className="text-xs font-bold text-amber-700/70 uppercase tracking-wider mb-2">Speaker Notes</h4>
              <p className="text-sm text-gray-700 italic">{typeof slide.speaker_notes === 'string' ? slide.speaker_notes : JSON.stringify(slide.speaker_notes)}</p>
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
