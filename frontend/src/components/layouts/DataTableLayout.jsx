import React from 'react';

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
              <tr key={r} className={`transition-colors hover:bg-current/5 ${r % 2 === 0 ? 'bg-current/5' : 'bg-transparent'}`}>
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
