import React, { useState } from 'react';
import { Code, ChevronDown, ChevronUp } from 'lucide-react';

export default function JsonViewer({ data }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Code className="w-5 h-5" />
          Raw JSON Inspection (Advanced)
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="p-4">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
