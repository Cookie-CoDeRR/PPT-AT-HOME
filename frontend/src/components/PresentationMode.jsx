import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import SlideRenderer from './SlideRenderer';

export default function PresentationMode({ slides, startIndex = 0, onClose, slideSize, customBackground, theme }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight' || e.code === 'Space') {
      setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [slides.length, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const slide = slides[currentIndex];
  if (!slide) return null;

  // Map the slide size to aspect ratio to calculate scaling
  const getAspectRatio = (size) => {
    if (size === 'LAYOUT_16x9') return 16 / 9;
    if (size === 'LAYOUT_4x3') return 4 / 3;
    if (size === 'LAYOUT_16x10') return 16 / 10;
    return 16 / 9;
  };
  
  const aspectRatio = getAspectRatio(slideSize);

  // The virtual slide is always rendered at this width internally,
  // guaranteeing that tailwind font sizes (text-2xl etc) remain exactly in proportion.
  const BASE_WIDTH = 1024;
  const BASE_HEIGHT = BASE_WIDTH / aspectRatio;

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      // Calculate scale to fit screen exactly
      const scaleX = vw / BASE_WIDTH;
      const scaleY = vh / BASE_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [aspectRatio]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden" ref={containerRef}>
        {/* Main Slide Container - fixed internal size, scaled via CSS transform */}
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onClick={() => setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1))}
        >
            <div 
              style={{
                 width: `${BASE_WIDTH}px`,
                 height: `${BASE_HEIGHT}px`,
                 transform: `scale(${scale})`,
                 transformOrigin: 'center center',
                 position: 'relative',
                 overflow: 'hidden',
                 backgroundColor: customBackground?.type === 'solid' ? (customBackground.value || theme?.bkgd) : theme?.bkgd,
                 ...(customBackground?.type === 'gradient' && customBackground.value ? { backgroundImage: customBackground.value } : {}),
                 ...(customBackground?.type === 'image' && customBackground.value ? { backgroundImage: `url(${customBackground.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
                 color: theme?.textColor, 
                 borderColor: theme?.shapeFill,
                 fontFamily: theme?.cssBodyFont,
                 '--header-font': theme?.cssHeaderFont,
                 '--theme-bg': theme?.bkgd,
                 '--theme-text': theme?.textColor,
                 '--theme-accent': theme?.accent,
                 '--theme-shape': theme?.shapeFill
              }}
              className="shadow-2xl flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {(customBackground?.type === 'image' || customBackground?.type === 'gradient') && (
                <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: customBackground.overlayColor || '#000000', opacity: customBackground.overlayOpacity ?? 0.5 }}></div>
              )}
              <div className="absolute top-0 left-0 w-full h-1 z-10" style={{ backgroundColor: theme?.accent }}></div>
              <div className="relative z-10 w-full h-full">
                <SlideRenderer slide={slide} slideSize={slideSize} customBackground={customBackground} theme={theme} />
              </div>
            </div>
        </div>

        {/* Floating Controls (opacity-0 hover:opacity-100) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md px-6 py-3 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity border border-white/10 shadow-2xl">
            <button 
               onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => Math.max(prev - 1, 0)); }}
               disabled={currentIndex === 0}
               className="p-2 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
               <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-medium font-mono text-sm px-2">
               {currentIndex + 1} / {slides.length}
            </span>
            <button 
               onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => Math.min(prev + 1, slides.length - 1)); }}
               disabled={currentIndex === slides.length - 1}
               className="p-2 hover:bg-white/20 rounded-full disabled:opacity-30 transition-colors"
            >
               <ChevronRight className="w-6 h-6" />
            </button>
            <div className="w-px h-6 bg-white/20 mx-2"></div>
            <button 
               onClick={(e) => { e.stopPropagation(); onClose(); }}
               className="p-2 hover:bg-red-500/80 rounded-full transition-colors"
               title="Exit Presentation Mode (Esc)"
            >
               <X className="w-5 h-5" />
            </button>
        </div>
    </div>
  );
}
