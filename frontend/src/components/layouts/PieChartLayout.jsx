import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function PieChartLayout({ slide }) {
  const data = slide.chart_data || { labels: [], values: [] };
  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.values[i] || 0
  }));

  const COLORS = ['var(--theme-accent)', '#cbd5e1', '#64748b', '#334155', '#94a3b8'];

  return (
    <div className="flex w-full h-full gap-8 items-center">
      <div className="flex-1 flex flex-col justify-center">
        <h2 style={{ color: 'inherit' }} className="text-4xl font-bold mb-6 leading-tight">
          {slide.title}
        </h2>
        {slide.description && (
          <p className="text-xl opacity-80 leading-relaxed mb-6">{slide.description}</p>
        )}
      </div>
      <div className="flex-1 h-full min-h-[300px] border border-current/10 rounded-2xl p-6 backdrop-blur-md shadow-xl" style={{ backgroundColor: 'var(--theme-shape)' }}>
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={chartData}
               innerRadius={60}
               outerRadius={120}
               paddingAngle={5}
               dataKey="value"
               stroke="none"
             >
               {chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
               ))}
             </Pie>
             <Tooltip contentStyle={{ backgroundColor: 'var(--theme-shape)', borderColor: 'var(--theme-accent)', color: 'var(--theme-text)', borderRadius: '8px' }} />
             <Legend wrapperStyle={{ paddingTop: '20px' }} />
           </PieChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
}
