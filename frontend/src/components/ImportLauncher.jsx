import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, FolderOpen, Globe, Check, Loader2, Link2 } from 'lucide-react';

// ─── Google Drive SVG Icon ──────────────────────────────────────────────────
function DriveIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L85.3 57c.8-1.4 1.2-2.95 1.2-4.5H59l5.85 10.25z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 0H29.9z" fill="#00832d"/>
      <path d="M59 52.5H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.6c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5l-13.5-23.2C59.1 1.9 57.95.8 56.6 0H29.9l13.75 25z" fill="#ffba00"/>
    </svg>
  );
}

// ─── Import Cards Config ────────────────────────────────────────────────────
const IMPORT_CARDS = [
  {
    id: 'file',
    title: 'Upload a file',
    bg: 'bg-[#d8b4fe]/30',
    iconBg: 'bg-[#c084fc]/40',
    hoverBorder: 'hover:border-purple-400/60',
    features: ['Word docs', 'PDFs'],
    bottomIcon: <Upload className="w-5 h-5 text-purple-500" />,
    lightBg: '#ede9fe',
    lightIconBg: '#c4b5fd',
    lightText: '#7c3aed',
  },
  {
    id: 'drive',
    title: 'Import from Drive',
    bg: 'bg-[#93c5fd]/20',
    iconBg: 'bg-[#60a5fa]/30',
    hoverBorder: 'hover:border-blue-400/60',
    features: ['Google Docs'],
    bottomIcon: <Link2 className="w-5 h-5 text-blue-500" />,
    lightBg: '#dbeafe',
    lightIconBg: '#93c5fd',
    lightText: '#1d4ed8',
  },
  {
    id: 'url',
    title: 'Import from URL',
    bg: 'bg-[#6ee7b7]/20',
    iconBg: 'bg-[#34d399]/30',
    hoverBorder: 'hover:border-emerald-400/60',
    features: ['Webpages', 'Blog posts or articles', 'Notion docs (public only)'],
    bottomIcon: <span className="text-emerald-500 text-xl font-bold">+</span>,
    lightBg: '#d1fae5',
    lightIconBg: '#6ee7b7',
    lightText: '#065f46',
  },
];

// ─── URL Import Modal ────────────────────────────────────────────────────────
function UrlModal({ darkMode, onClose, onImport }) {
  const [url, setUrl] = useState('');
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`rounded-2xl p-6 w-full max-w-md border shadow-2xl mx-4 ${darkMode ? 'bg-[#131B2A] border-white/10' : 'bg-white border-gray-200'}`}
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Import from URL</h2>
        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Paste a webpage, blog post, or public Notion link</p>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 mb-4 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <Globe className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input
            autoFocus
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className={`flex-1 text-sm outline-none bg-transparent ${darkMode ? 'text-gray-200 placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${darkMode ? 'border-white/10 text-gray-400 hover:text-white' : 'border-gray-200 text-gray-500 hover:text-gray-900'}`}>Cancel</button>
          <button
            disabled={!url.trim()}
            onClick={() => { if (url.trim()) onImport({ importType: 'url', url: url.trim() }); }}
            className="flex-1 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Import & Transform
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ImportLauncher({ onBack, onImport, darkMode = true, onPasteInText }) {
  const fileInputRef = useRef(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCardClick = (id) => {
    if (id === 'file') fileInputRef.current?.click();
    else if (id === 'drive') window.open('https://drive.google.com', '_blank');
    else if (id === 'url') setShowUrlModal(true);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    // Pass up to parent — backend handles actual processing
    setTimeout(() => {
      setUploading(false);
      onImport({ importType: 'file', file });
    }, 800);
  };

  // Theme tokens
  const bgTitle    = darkMode ? 'text-white'   : 'text-gray-900';
  const bgSubtitle = darkMode ? 'text-gray-400' : 'text-gray-500';
  const footerTxt  = darkMode ? 'text-gray-500' : 'text-gray-500';
  const footerLink = darkMode ? 'text-violet-400 underline hover:text-violet-300' : 'text-blue-600 underline hover:text-blue-800';
  const backColor  = darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const cardBase   = darkMode
    ? 'bg-white/5 border-white/10 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const featureColor = darkMode ? 'text-gray-300' : 'text-gray-700';
  const checkColor   = darkMode ? 'text-emerald-400' : 'text-emerald-600';

  return (
    <>
      <AnimatePresence>
        {showUrlModal && (
          <UrlModal
            darkMode={darkMode}
            onClose={() => setShowUrlModal(false)}
            onImport={(data) => { setShowUrlModal(false); onImport(data); }}
          />
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.pptx,.txt"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      <div
        className="w-full min-h-full flex flex-col pb-20"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        {/* Back button */}
        <div className="px-8 pt-5">
          <button onClick={onBack} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${backColor}`}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        {/* Title section */}
        <motion.div
          className="flex flex-col items-center pt-10 pb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Sparkle icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/>
            </svg>
          </div>
          <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${bgTitle}`}>Import with AI</h1>
          <p className={`text-base ${bgSubtitle}`}>Select the file you'd like to transform</p>
        </motion.div>

        {/* Drag overlay */}
        {dragging && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-600/20 border-4 border-dashed border-violet-400 pointer-events-none">
            <p className="text-2xl font-bold text-violet-300">Drop your file here</p>
          </div>
        )}

        {/* Three import cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto w-full px-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, staggerChildren: 0.08 }}
        >
          {IMPORT_CARDS.map((card, i) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCardClick(card.id)}
              disabled={uploading}
              className={`flex flex-col text-left rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${cardBase} ${card.hoverBorder} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {/* Coloured icon area */}
              <div
                className="flex items-center justify-center pt-8 pb-6"
                style={{ backgroundColor: darkMode ? undefined : card.lightBg }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: darkMode ? undefined : card.lightIconBg }}
                >
                  {card.id === 'file'  && <FolderOpen className="w-10 h-10" style={{ color: darkMode ? '#c084fc' : '#7c3aed' }} />}
                  {card.id === 'drive' && <DriveIcon className="w-10 h-10" />}
                  {card.id === 'url'   && <Globe className="w-10 h-10" style={{ color: darkMode ? '#34d399' : '#065f46' }} />}
                </div>
              </div>

              {/* Card body */}
              <div className={`p-5 flex flex-col flex-1 ${darkMode ? 'bg-white/5' : 'bg-white'}`}>
                <h3 className={`font-bold text-base mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
                <ul className="flex-1 space-y-1">
                  {card.features.map(f => (
                    <li key={f} className={`flex items-center gap-1.5 text-sm ${featureColor}`}>
                      <Check className={`w-3.5 h-3.5 flex-shrink-0 ${checkColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex justify-end">
                  {uploading && card.id === 'file' ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : card.bottomIcon}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          className={`text-sm text-center mt-8 ${footerTxt}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          If your file isn't supported, you can also{' '}
          <button
            onClick={onPasteInText}
            className={`font-semibold ${footerLink}`}
          >
            paste in text
          </button>
        </motion.p>
      </div>
    </>
  );
}
