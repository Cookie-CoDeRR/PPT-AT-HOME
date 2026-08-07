import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Presentation, 
  FileText, 
  Smartphone, 
  Layout, 
  Image as ImageIcon,
  Maximize2,
  Monitor,
  Square
} from 'lucide-react';

export default function NewGammaModal({ isOpen, onClose, darkMode, onSelectBlank }) {
  const [activeTab, setActiveTab] = useState('presentation');

  if (!isOpen) return null;

  const bg = darkMode ? 'bg-[#1A2235]' : 'bg-white';
  const overlayBg = darkMode ? 'bg-black/60' : 'bg-black/30';
  const textTitle = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderCol = darkMode ? 'border-white/10' : 'border-gray-200';
  
  const sidebarBg = darkMode ? 'bg-[#131B2A]' : 'bg-gray-50';
  const tabActiveBg = darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700';
  const tabInactiveBg = darkMode ? 'hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900';

  const cardBg = darkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-gray-50 border-gray-200';
  
  const tabs = [
    { id: 'presentation', label: 'Presentation', icon: Presentation },
    { id: 'document', label: 'Document', icon: FileText },
    { id: 'social', label: 'Social', icon: Smartphone },
    { id: 'webpage', label: 'Webpage', icon: Layout },
    { id: 'graphic', label: 'Graphic', icon: ImageIcon },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${overlayBg} backdrop-blur-sm`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`relative w-full max-w-4xl h-[600px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${bg}`}
          >
            {/* Header */}
            <div className={`flex justify-between items-center px-6 py-4 border-b ${borderCol}`}>
              <h2 className={`text-lg font-bold ${textTitle}`}>New gamma</h2>
              <button 
                onClick={onClose}
                className={`p-1 rounded-md transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-800'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <div className={`w-56 flex-shrink-0 p-4 border-r ${borderCol} ${sidebarBg}`}>
                <div className="space-y-1">
                  {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive ? tabActiveBg : tabInactiveBg}`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-10">
                {/* Blank Presentation Options */}
                <div className="mb-10">
                  <h3 className={`text-[15px] font-bold mb-4 ${textTitle}`}>New blank {activeTab}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'fluid', label: 'Default', sub: 'Fluid', icon: Maximize2 },
                      { id: '16:9', label: 'Traditional', sub: '16:9', icon: Monitor },
                      { id: '4:3', label: 'Tall', sub: '4:3', icon: Square },
                    ].map(opt => {
                      const OptIcon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (onSelectBlank) onSelectBlank(opt.id, activeTab);
                            onClose();
                          }}
                          className={`flex flex-col items-center justify-center py-6 px-4 rounded-xl border transition-all ${cardBg} hover:border-blue-400 group`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${darkMode ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'}`}>
                            <OptIcon className="w-5 h-5" strokeWidth={1.5} />
                          </div>
                          <span className={`text-[13px] font-bold ${textTitle}`}>{opt.label}</span>
                          <span className={`text-[11px] mt-0.5 ${textSub}`}>{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace Templates */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-[15px] font-bold ${textTitle}`}>Workspace templates</h3>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-transparent border-none">
                      Go to templates ↗
                    </button>
                  </div>
                  
                  <div className={`rounded-xl border flex flex-col items-center justify-center text-center p-10 ${darkMode ? 'bg-[#0B0F17] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                    <img 
                      src="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=400&h=400&fit=crop" 
                      alt="Hot Air Balloon" 
                      className="w-32 h-32 object-cover rounded-full mb-6 mix-blend-multiply opacity-90"
                      style={{ filter: darkMode ? 'invert(1) hue-rotate(180deg) opacity(0.8)' : 'none' }}
                    />
                    <h4 className={`text-lg font-bold mb-2 ${textTitle}`}>Add your first template</h4>
                    <p className={`text-[13px] max-w-md mb-6 leading-relaxed ${textSub}`}>
                      Create once, reuse forever. Turn any gamma into a reusable workspace template for fast, consistent outputs.
                    </p>
                    <button className="px-5 py-2.5 bg-[#194b9e] hover:bg-[#153e82] text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm">
                      Go to templates ↗
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Tip */}
            <div className={`py-3 px-6 text-center border-t text-[13px] ${borderCol} ${darkMode ? 'bg-[#1A2235]' : 'bg-white'}`}>
              <span className={textSub}>Tip: type </span>
              <span className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 mx-1">gamma.new</span>
              <span className={textSub}>into your browser to quickly make a blank gamma.</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
