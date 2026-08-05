import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Sparkles, 
  ChevronDown, 
  CheckCircle2, 
  Wand2 
} from 'lucide-react';

const MEDIA_ITEMS = [
  { id: '1',  url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80', type: 'image', date: 'Apr 2026' },
  { id: '2',  url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=500&q=80', type: 'image', date: 'Apr 2026' },
  { id: '3',  url: 'https://images.unsplash.com/photo-1505672678657-cc7037095e60?w=500&q=80', type: 'image', date: 'Apr 2026' },
  { id: '4',  url: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=500&q=80', type: 'image', date: 'Apr 2026' },
  { id: '5',  url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&q=80', type: 'image', date: 'Apr 2026' },
  { id: '6',  url: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=500&q=80', type: 'image', date: 'Apr 2026' },
  // Windmills / graphics
  { id: '7',  url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=500&q=80', type: 'graphic', date: 'Apr 2026' },
  { id: '8',  url: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=500&q=80', type: 'graphic', date: 'Apr 2026' },
  { id: '9',  url: 'https://images.unsplash.com/photo-1520690214124-2405c5217036?w=500&q=80', type: 'graphic', date: 'Apr 2026' },
  { id: '10', url: 'https://images.unsplash.com/photo-1508514177221-188b1c8d40e7?w=500&q=80', type: 'graphic', date: 'Apr 2026' },
];

export default function MediaLibrary({ darkMode }) {
  const [filter, setFilter] = useState('All types');

  const headerTxt  = darkMode ? 'text-white' : 'text-gray-900';
  const mutedTxt   = darkMode ? 'text-gray-400' : 'text-gray-500';
  const btnBorder  = darkMode ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-200 text-gray-700 hover:bg-gray-50';

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto px-8 pt-8 pb-12">
      
      {/* Top Header */}
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className={`w-5 h-5 ${headerTxt}`} />
        <h1 className={`text-lg font-bold ${headerTxt}`}>Media</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-8">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors shadow-sm">
          <Sparkles className="w-4 h-4" />
          Create graphic
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${btnBorder}`}>
          <PlusIcon className="w-4 h-4" />
          Create AI Image
        </button>
      </div>

      {/* Filters and Select */}
      <div className="flex items-center justify-between mb-6">
        <button className={`flex items-center gap-1.5 text-sm font-medium ${mutedTxt} hover:text-current transition-colors`}>
          {filter}
          <ChevronDown className="w-4 h-4" />
        </button>
        
        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${btnBorder}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Select images
        </button>
      </div>

      {/* Media Grid grouped by Date */}
      <div>
        <h2 className={`text-xl font-bold mb-4 ${headerTxt}`}>Apr 2026</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {MEDIA_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-gray-100"
            >
              <img 
                src={item.url} 
                alt="media item" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Image Icon Overlay on hover (bottom right) */}
              <div className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
