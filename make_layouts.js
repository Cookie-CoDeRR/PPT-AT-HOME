const fs = require('fs');
const path = require('path');

const layoutsDir = path.join('frontend', 'src', 'components', 'layouts');

const pieChart = `import React from 'react';
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
                 <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
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
`;

const barChart = `import React from 'react';
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
`;

const dataTable = `import React from 'react';

export default function DataTableLayout({ slide }) {
  const tableData = slide.table_data || { headers: [], rows: [] };
  
  return (
    <div className="flex flex-col w-full h-full gap-8">
      <h2 style={{ color: 'inherit' }} className="text-3xl font-bold text-center leading-tight">
        {slide.title}
      </h2>
      
      <div className="flex-1 overflow-auto rounded-xl border border-current/20 shadow-2xl backdrop-blur-md" style={{ backgroundColor: 'var(--theme-shape)' }}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {tableData.headers.map((h, i) => (
                <th key={i} className="p-4 font-bold border-b border-current/20 opacity-90 uppercase tracking-wider text-sm" style={{ backgroundColor: 'var(--theme-accent)', color: 'var(--theme-bg)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, r) => (
              <tr key={r} className={\`transition-colors hover:bg-current/5 \${r % 2 === 0 ? 'bg-current/5' : 'bg-transparent'}\`}>
                {row.map((cell, c) => (
                  <td key={c} className="p-4 border-b border-current/10 opacity-80 text-lg">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

const bentoGrid = `import React from 'react';

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
            <div key={i} className={\`\${spanClass} flex flex-col justify-center border border-current/10 rounded-2xl p-6 backdrop-blur-md shadow-xl overflow-hidden relative group transition-colors hover:border-current/30\`} style={{ backgroundColor: 'var(--theme-shape)' }}>
              <div className="absolute top-0 left-0 w-full h-1 opacity-20 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--theme-accent)' }} />
              <h3 style={{ color: 'inherit' }} className={\`font-bold mb-2 tracking-tight opacity-90 \${item.size === 'large' ? 'text-3xl' : 'text-xl'}\`}>
                {item.title}
              </h3>
              <p className={\`leading-relaxed opacity-80 \${item.size === 'large' ? 'text-lg' : 'text-sm'}\`}>
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`;

const metricDashboard = `import React from 'react';

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
                 <div className={\`absolute top-4 right-4 text-sm font-bold \${changeColor}\`}>
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
`;

fs.writeFileSync(path.join(layoutsDir, 'PieChartLayout.jsx'), pieChart);
fs.writeFileSync(path.join(layoutsDir, 'BarChartLayout.jsx'), barChart);
fs.writeFileSync(path.join(layoutsDir, 'DataTableLayout.jsx'), dataTable);
fs.writeFileSync(path.join(layoutsDir, 'BentoGridLayout.jsx'), bentoGrid);
fs.writeFileSync(path.join(layoutsDir, 'MetricDashboardLayout.jsx'), metricDashboard);

console.log("Layout components created.");
