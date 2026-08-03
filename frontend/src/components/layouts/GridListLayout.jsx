import React from 'react';

export default function GridListLayout({ slide }) {
  const items = slide.items || [];
  
  // Dynamically determine grid columns based on item count to look best
  let gridCols = "grid-cols-3";
  if (items.length === 2 || items.length === 4) {
    gridCols = "grid-cols-2";
  } else if (items.length > 6) {
    gridCols = "grid-cols-4";
  }

  return (
    <div className="flex flex-col h-full w-full">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-8 text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className={`grid ${gridCols} gap-6 flex-1 min-h-0`}>
        {items.map((item, i) => (
          <div key={i} className="flex flex-col border border-current/10 rounded-xl p-6 backdrop-blur-md shadow-xl overflow-hidden relative group hover:bg-current/5 transition-colors" style={{ backgroundColor: 'var(--theme-shape)' }}>
            <div className="absolute top-0 left-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--theme-accent)' }} />
            
            <h3 style={{ color: 'inherit' }} className="text-xl font-bold mb-4 tracking-tight opacity-90">
              {item.item_title}
            </h3>
            
            <p className="text-sm leading-relaxed overflow-y-auto custom-scrollbar pr-2 opacity-80">
              {item.item_text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
