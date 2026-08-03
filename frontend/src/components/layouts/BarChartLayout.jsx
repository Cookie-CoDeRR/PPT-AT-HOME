import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function BarChartLayout({ slide }) {
  const data = slide.chart_data || { labels: [], values: [] };
  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.values[i] || 0
  }));

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold text-center leading-tight">
        {slide.title}
      </h2>
      {slide.description && (
        <p className="text-lg opacity-80 text-center max-w-2xl mx-auto">{slide.description}</p>
      )}
      <div className="flex-1 w-full min-h-[300px] border border-current/10 rounded-2xl p-6 backdrop-blur-md shadow-xl mt-4" style={{ backgroundColor: 'var(--theme-shape)' }}>
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
             <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
             <XAxis dataKey="name" stroke="currentColor" tick={{ fill: 'currentColor', opacity: 0.8 }} axisLine={false} tickLine={false} />
             <YAxis stroke="currentColor" tick={{ fill: 'currentColor', opacity: 0.8 }} axisLine={false} tickLine={false} />
             <Tooltip cursor={{ fill: 'var(--theme-text)', opacity: 0.05 }} contentStyle={{ backgroundColor: 'var(--theme-shape)', borderColor: 'var(--theme-accent)', color: 'var(--theme-text)', borderRadius: '8px' }} />
             <Bar dataKey="value" fill="var(--theme-accent)" radius={[4, 4, 0, 0]} />
           </BarChart>
         </ResponsiveContainer>
      </div>
    </div>
  );
}
