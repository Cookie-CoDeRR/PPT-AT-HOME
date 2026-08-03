import React from 'react';

export default function BentoGridLayout({ slide }) {
  const items = slide.items || [];
  
  return (
    <div className="flex flex-col h-full w-full">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-6 text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="grid grid-cols-3 gap-4 auto-rows-[minmax(120px,1fr)] flex-1 min-h-0">
        {items.map((item, i) => {
          let spanClass = "col-span-1 row-span-1";
          if (item.size === 'large') spanClass = "col-span-2 row-span-2";
          else if (item.size === 'wide') spanClass = "col-span-3 row-span-1";
          else if (item.size === 'tall') spanClass = "col-span-1 row-span-2";

          return (
            <div key={i} className={`${spanClass} flex flex-col justify-center border border-current/10 rounded-2xl p-6 backdrop-blur-md shadow-xl overflow-hidden relative group transition-colors hover:border-current/30`} style={{ backgroundColor: 'var(--theme-shape)' }}>
              <div className="absolute top-0 left-0 w-full h-1 opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--theme-accent)' }} />
              <h3 style={{ color: 'inherit' }} className={`font-bold mb-2 tracking-tight opacity-90 ${item.size === 'large' ? 'text-3xl' : 'text-xl'}`}>
                {item.title}
              </h3>
              <p className={`leading-relaxed opacity-80 ${item.size === 'large' ? 'text-lg' : 'text-sm'}`}>
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
