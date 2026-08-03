import React from 'react';

export default function StatCalloutLayout({ slide }) {
  const statLength = slide.stat ? slide.stat.length : 0;
  let statSizeClass = "text-8xl md:text-9xl";
  if (statLength > 6 && statLength <= 15) statSizeClass = "text-6xl md:text-7xl";
  else if (statLength > 15) statSizeClass = "text-4xl md:text-5xl";

  return (
    <div className="flex w-full h-full gap-12 items-center">
      
      {/* Stat Left Hero Column */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
         <div className={`${statSizeClass} font-black drop-shadow-2xl opacity-90 text-balance break-words`} style={{ color: 'inherit' }}>
           {slide.stat}
         </div>
         {slide.label && (
           <div className="mt-4 text-2xl md:text-3xl font-bold uppercase tracking-widest opacity-70" style={{ color: 'inherit' }}>
             {slide.label}
           </div>
         )}
      </div>

      {/* Detail Right Column */}
      <div className="flex-1 flex flex-col justify-center border-l pl-12 py-8" style={{ borderColor: 'var(--theme-accent)', opacity: 0.8 }}>
        <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-8 leading-tight">{slide.title}</h2>
        <div className="space-y-5">
          {slide.bullets && slide.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full mt-2.5 flex-shrink-0" style={{ backgroundColor: 'var(--theme-accent)' }} />
              <p className="text-xl leading-relaxed opacity-90">{bullet}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
