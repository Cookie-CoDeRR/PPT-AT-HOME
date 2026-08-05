import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  FileText,
  LayoutTemplate,
  Upload,
  History,
  Presentation,
  ArrowRight,
  Zap,
} from 'lucide-react';

const CREATION_MODES = [
  {
    id: 'generate',
    icon: Sparkles,
    iconColor: 'text-violet-400',
    iconBg: 'from-violet-600/20 to-fuchsia-600/20',
    borderHover: 'hover:border-violet-500/50',
    title: 'Generate',
    description: 'Create from a one-line prompt in a few seconds',
    badge: null,
  },
  {
    id: 'paste',
    icon: FileText,
    iconColor: 'text-blue-400',
    iconBg: 'from-blue-600/20 to-cyan-600/20',
    borderHover: 'hover:border-blue-500/50',
    title: 'Paste in text',
    description: 'Create from notes, an outline, or existing content',
    badge: 'LAST USED',
  },
  {
    id: 'template',
    icon: LayoutTemplate,
    iconColor: 'text-emerald-400',
    iconBg: 'from-emerald-600/20 to-teal-600/20',
    borderHover: 'hover:border-emerald-500/50',
    title: 'Create from template',
    description: 'Create using the structure or layouts from a template',
    badge: null,
  },
  {
    id: 'import',
    icon: Upload,
    iconColor: 'text-orange-400',
    iconBg: 'from-orange-600/20 to-amber-600/20',
    borderHover: 'hover:border-orange-500/50',
    title: 'Import file or URL',
    description: 'Enhance existing docs, presentations, or webpages',
    badge: null,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function CreateNewPage({ onSelectMode, onShowHistory, darkMode = true }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // Theme tokens
  const titleGradient = darkMode
    ? 'from-white via-gray-100 to-gray-400'
    : 'from-gray-900 via-gray-800 to-gray-600';
  const subtitleColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode
    ? 'bg-white/5 border-white/10 text-white'
    : 'bg-white border-gray-200/80 shadow-md text-gray-900 hover:border-violet-300 hover:shadow-lg';
  const cardTitleColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardDescColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const dividerColor = darkMode ? 'bg-white/5' : 'bg-gray-300';
  const recentBg = darkMode
    ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/8 hover:text-white'
    : 'bg-white border-gray-200 shadow-md text-gray-800 hover:border-violet-300 hover:bg-gray-50';
  const recentPromptTitle = darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900';
  const recentPromptDesc = darkMode ? 'text-gray-500' : 'text-gray-500';

  return (
    <div className="flex flex-col items-center justify-start min-h-full w-full max-w-5xl mx-auto px-6 pt-16 pb-12">
      {/* Hero heading */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-5 ${
          darkMode ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400' : 'bg-violet-600/10 border border-violet-600/20 text-violet-700'
        }`}>
          <Zap className="w-3 h-3" />
          Local AI • No Cloud Required
        </div>
        <h1 className={`text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br ${titleGradient} bg-clip-text text-transparent leading-tight mb-4`}>
          Create with AI
        </h1>
        <p className={`text-lg max-w-xl mx-auto ${subtitleColor}`}>
          Turn your ideas into stunning presentations powered entirely by your local LLM — fully private, zero internet required.
        </p>
      </motion.div>

      {/* Creation mode cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-10"
      >
        {CREATION_MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.button
              key={mode.id}
              variants={itemVariants}
              onHoverStart={() => setHoveredCard(mode.id)}
              onHoverEnd={() => setHoveredCard(null)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectMode(mode.id)}
              className={`relative flex flex-col items-start gap-3 p-5 rounded-2xl border ${cardBg} ${mode.borderHover} transition-all duration-200 text-left group cursor-pointer overflow-hidden`}
            >
              {/* Glow overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.iconBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
              />

              {/* Icon */}
              <div className={`relative z-10 w-12 h-12 rounded-xl bg-gradient-to-br ${mode.iconBg} border ${darkMode ? 'border-white/10' : 'border-black/5'} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${mode.iconColor}`} />
              </div>

              {/* Text */}
              <div className="relative z-10 flex-1">
                <h3 className={`font-bold text-sm leading-snug mb-1 ${cardTitleColor}`}>{mode.title}</h3>
                <p className={`text-xs leading-relaxed ${cardDescColor}`}>{mode.description}</p>
              </div>

              {/* Badge */}
              {mode.badge && (
                <div className="relative z-10 flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <History className="w-3 h-3" />
                  {mode.badge}
                </div>
              )}

              {/* Arrow on hover */}
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={hoveredCard === mode.id ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
                className={`absolute top-4 right-4 z-10 ${mode.iconColor}`}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-4 w-full mb-10"
      >
        <div className={`flex-1 h-px ${dividerColor}`} />
        <span className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Or try something new</span>
        <div className={`flex-1 h-px ${dividerColor}`} />
      </motion.div>

      {/* Recent presentations prompt */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recent</h2>
          <button
            onClick={onShowHistory}
            className="flex items-center gap-1.5 text-xs text-violet-500 hover:text-violet-400 transition-colors font-medium"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowHistory}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group ${recentBg}`}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Presentation className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold transition-colors ${recentPromptTitle}`}>
              Open your presentation history
            </p>
            <p className={`text-xs mt-0.5 ${recentPromptDesc}`}>
              All your previously generated decks are saved locally and ready to reload or export.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-violet-500 transition-colors flex-shrink-0" />
        </motion.button>
      </motion.div>
    </div>
  );
}
