import React from 'react';

export default function TimelineLayout({ slide }) {
  const steps = slide.steps || [];

  return (
    <div className="flex flex-col h-full w-full">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-12 text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="flex-1 flex items-center justify-center relative px-8">
         {/* Connecting Line */}
         <div className="absolute top-1/2 left-16 right-16 h-1 opacity-20 -translate-y-1/2 rounded-full" style={{ backgroundColor: 'var(--theme-text)' }} />
         
         <div className="flex justify-between w-full relative z-10 gap-4">
            {steps.map((step, i) => (
               <div key={i} className="flex flex-col items-center flex-1 max-w-[200px]">
                  {/* Text Above */}
                  {i % 2 === 0 && (
                    <div className="mb-8 text-center border border-current/10 rounded-xl p-4 shadow-xl backdrop-blur-md w-full" style={{ backgroundColor: 'var(--theme-shape)' }}>
                       <h4 style={{ color: 'inherit' }} className="text-sm font-bold opacity-90 mb-2 uppercase tracking-wider">{step.step}</h4>
                       <p className="text-sm leading-relaxed opacity-80">{step.text}</p>
                    </div>
                  )}

                  {/* Node */}
                  <div className="w-8 h-8 rounded-full border-4 flex-shrink-0 shadow-lg flex items-center justify-center" style={{ backgroundColor: 'var(--theme-accent)', borderColor: 'transparent' }}>
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'white', mixBlendMode: 'difference' }} />
                  </div>

                  {/* Text Below */}
                  {i % 2 !== 0 && (
                    <div className="mt-8 text-center border border-current/10 rounded-xl p-4 shadow-xl backdrop-blur-md w-full" style={{ backgroundColor: 'var(--theme-shape)' }}>
                       <h4 style={{ color: 'inherit' }} className="text-sm font-bold opacity-90 mb-2 uppercase tracking-wider">{step.step}</h4>
                       <p className="text-sm leading-relaxed opacity-80">{step.text}</p>
                    </div>
                  )}
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
