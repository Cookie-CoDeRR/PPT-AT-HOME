import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Presentation } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, docs, darkMode }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredDocs = docs.filter(doc =>
    (doc.title || '').toLowerCase().includes(query.toLowerCase())
  );

  const bg = darkMode ? 'bg-[#1A2235]' : 'bg-white';
  const overlayBg = darkMode ? 'bg-black/60' : 'bg-black/30';
  const textTitle = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderCol = darkMode ? 'border-white/10' : 'border-gray-100';
  const hoverBg = darkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${overlayBg} backdrop-blur-sm`}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`relative w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden ${bg} border ${borderCol}`}
          >
            {/* Header / Search Input */}
            <div className={`flex items-center gap-3 px-4 py-3 border-b ${borderCol}`}>
              <Search className={`w-5 h-5 ${textSub}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Jump to"
                className={`flex-1 bg-transparent border-none outline-none text-lg ${textTitle} placeholder:text-gray-400`}
              />
              <button onClick={onClose} className={`p-1.5 rounded-lg ${hoverBg} ${textSub}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredDocs.length === 0 ? (
                <div className={`py-10 text-center ${textSub}`}>
                  No results found for "{query}"
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const date = doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
                    : 'Unknown date';

                  return (
                    <button
                      key={doc.id}
                      className={`w-full flex items-center gap-4 p-2 rounded-xl transition-colors text-left ${hoverBg}`}
                      onClick={onClose} // In real app, this would route to the doc
                    >
                      {/* Thumbnail */}
                      <div className={`w-32 aspect-video rounded-lg flex items-center justify-center flex-shrink-0 border ${darkMode ? 'bg-[#131B2A] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                        <Presentation className={`w-8 h-8 ${darkMode ? 'text-violet-400/50' : 'text-violet-500/50'}`} />
                      </div>

                      {/* Content */}
                      <div className="flex flex-col min-w-0">
                        <span className={`text-base font-semibold truncate ${textTitle}`}>
                          {doc.title || 'Untitled'}
                        </span>
                        <span className={`text-xs mt-0.5 ${textSub}`}>
                          Created by All for one
                        </span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white font-bold">
                            A
                          </div>
                          <span className={`text-xs ${textSub}`}>
                            Edited {date}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Tip */}
            <div className={`px-4 py-3 border-t text-xs flex items-center justify-between ${borderCol} ${textSub}`}>
              <div className="flex items-center gap-1.5">
                <span>👋</span>
                <span>Tip: You can open this anywhere by pressing</span>
                <kbd className={`px-1.5 py-0.5 rounded border font-mono text-[10px] bg-black/5 ${darkMode ? 'border-white/20' : 'border-gray-200'}`}>
                  ⌘+K
                </kbd>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
