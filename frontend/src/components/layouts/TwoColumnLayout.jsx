import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export default function TwoColumnLayout({ slide }) {
  const isLeftImage = slide.layout_type === 'TwoColumnTextRightImage'; // Image on left, text on right
  // Wait, TwoColumnTextRightImage means text on LEFT, image on RIGHT according to conventional naming, but let's look at the name: "TwoColumnTextRightImage". Wait, let's interpret it as Text is Right, Image is Left, OR "Text (left) Right Image". 
  // Standard interpretation: "TwoColumnTextRightImage" -> Image on the right.
  const imageRight = slide.layout_type !== 'TwoColumnTextLeftImage';

  const textColumn = (
    <div className="flex flex-col justify-center h-full w-full">
      <h2 className="text-3xl font-bold mb-6 text-white leading-tight">{slide.title}</h2>
      <div className="space-y-4">
        {slide.bullets && slide.bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2.5 flex-shrink-0" />
            <p className="text-lg text-gray-300 leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const imageColumn = (
    <div className="h-full w-full relative rounded-xl overflow-hidden bg-black/20 border border-white/5 flex items-center justify-center">
      {slide.image_search_query ? (
         <>
           <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10" />
           <ImageIcon className="w-12 h-12 text-gray-600 mb-2" />
           <span className="absolute bottom-4 left-4 text-xs text-gray-500 bg-black/60 px-3 py-1.5 rounded uppercase tracking-wider backdrop-blur-sm border border-white/10">
             Prompt: {slide.image_search_query}
           </span>
         </>
      ) : (
         <div className="flex flex-col items-center gap-2 opacity-50">
           <ImageIcon className="w-12 h-12 text-gray-600" />
           <span className="text-xs text-gray-500 uppercase tracking-wider">Image Asset</span>
         </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full h-full gap-10">
      <div className="flex-1 min-w-0">
        {imageRight ? textColumn : imageColumn}
      </div>
      <div className="flex-1 min-w-0">
        {imageRight ? imageColumn : textColumn}
      </div>
    </div>
  );
}
