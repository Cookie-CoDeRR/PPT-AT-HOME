import React from 'react';

export default function MetricDashboardLayout({ slide }) {
  const metrics = slide.metrics || [];
  
  return (
    <div className="flex flex-col h-full w-full">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold mb-8 text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
        {metrics.map((m, i) => {
          const isPositive = m.change && (m.change.includes('+') || m.change.toLowerCase().includes('up'));
          const isNegative = m.change && (m.change.includes('-') || m.change.toLowerCase().includes('down'));
          let changeColor = "opacity-60";
          if (isPositive) changeColor = "text-green-400 opacity-100";
          if (isNegative) changeColor = "text-red-400 opacity-100";

          return (
            <div key={i} className="flex flex-col items-center justify-center border border-current/10 rounded-2xl p-6 backdrop-blur-md shadow-xl relative" style={{ backgroundColor: 'var(--theme-shape)' }}>
               {m.change && (
                 <div className={`absolute top-4 right-4 text-sm font-bold ${changeColor}`}>
                   {m.change}
                 </div>
               )}
               <div className="text-7xl font-black drop-shadow-xl mb-2" style={{ color: 'inherit' }}>
                 {m.value}
               </div>
               <div className="text-xl uppercase tracking-widest opacity-70 font-bold" style={{ color: 'inherit' }}>
                 {m.label}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
