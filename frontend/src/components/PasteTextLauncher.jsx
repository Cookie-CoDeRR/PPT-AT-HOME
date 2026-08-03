import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Globe, LayoutTemplate, Share2, Image as ImageIcon,
  ArrowRight, Lock, AlignLeft, ListTree, ArrowLeft, Wand2,
} from 'lucide-react';

// ─── Content Type Tabs ────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: 'presentation', label: 'Presentation', icon: LayoutTemplate },
  { id: 'webpage',      label: 'Webpage',       icon: Globe },
  { id: 'document',     label: 'Document',       icon: FileText },
  { id: 'social',       label: 'Social',         icon: Share2 },
  { id: 'graphic',      label: 'Graphic',        icon: ImageIcon, badge: 'NEW' },
];

// ─── Generation Modes ─────────────────────────────────────────────────────────
const GENERATION_MODES = [
  {
    id: 'generate_outline',
    icon: ListTree,
    title: 'Generate from notes or an outline',
    description: 'Turn rough ideas, bullet points, or outlines into beautiful content',
  },
  {
    id: 'summarize',
    icon: AlignLeft,
    title: 'Summarize long text or document',
    description: 'Great for condensing detailed content into something more presentable',
  },
  {
    id: 'preserve',
    icon: Lock,
    title: 'Preserve this exact text',
    description: "Create using your text, exactly as you've written it",
  },
];

const SECTION_EXAMPLE = `Intro to our new strategy
• Key point 1
• Key point 2
• Key point 3

———

Key metrics from Q1
• Key point 1
• Key point 2
• Key point 3

———

Next steps + ownership
• Key point 1
• ...`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function PasteTextLauncher({ onGenerate, isGenerating, onBack }) {
  const [contentType, setContentType] = useState('presentation');
  const [text, setText] = useState('');
  const [mode, setMode] = useState('generate_outline');

  const canContinue = text.trim().length > 10;

  const handleContinue = () => {
    if (!canContinue || isGenerating) return;
    onGenerate({
      prompt: text,
      pasteMode: mode,
      contentType,
      slideCount: 10,
      tone: 'Professional/Corporate',
      theme: 'Modern Dark Tech',
      templateType: 'default',
      density: 'Detailed',
      includeImages: true,
    });
  };

  return (
    <div className="w-full min-h-full flex flex-col items-center px-4 pt-10 pb-20">

      {/* Back Button */}
      {onBack && (
        <div className="w-full max-w-5xl mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Paste in text</h1>
        </div>
        <p className="text-gray-400 text-base">What would you like to create?</p>
      </motion.div>

      {/* Content Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="flex items-center gap-1.5 flex-wrap justify-center mb-8"
      >
        {CONTENT_TYPES.map(ct => {
          const Icon = ct.icon;
          const isActive = contentType === ct.id;
          return (
            <button
              key={ct.id}
              onClick={() => setContentType(ct.id)}
              className={`relative flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-white/4 border-white/10 text-gray-400 hover:bg-white/8 hover:text-white hover:border-white/20'
              }`}
            >
              {ct.badge && (
                <span className="absolute -top-2 -right-1 px-1 py-0.5 bg-blue-500 text-[9px] font-bold text-white rounded-full leading-none">
                  {ct.badge}
                </span>
              )}
              <Icon className="w-4 h-4" />
              {ct.label}
              {isActive && (
                <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-blue-500 border border-blue-300" />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Main two-column area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-5xl flex flex-col lg:flex-row gap-4 mb-6"
      >
        {/* Left: Textarea */}
        <div className="flex-1 flex flex-col">
          <p className="text-sm text-gray-400 mb-3 text-center lg:text-left">
            Paste in the notes, outline or text content you'd like to use
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type or paste in content here"
            className="flex-1 min-h-[260px] w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-gray-100 placeholder-gray-500 resize-none outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
          />
        </div>

        {/* Right: Optional tip panel */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="bg-white/4 border border-white/10 rounded-2xl p-4 h-full">
            <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-yellow-400" />
              Optional: section-by-section control
            </p>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Know what you want in each section? Add three dashes — — — between each section.
            </p>
            <p className="text-xs text-gray-500 mb-2">Example:</p>
            <pre className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap bg-white/5 rounded-xl p-3 border border-white/8 font-sans">
{SECTION_EXAMPLE}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* Generation mode selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="w-full max-w-5xl mb-8"
      >
        <p className="text-sm text-gray-400 mb-3 text-center">What do you want to do with this content?</p>
        <div className="flex flex-col gap-2">
          {GENERATION_MODES.map(m => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-white/8 bg-white/4 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-blue-500' : 'border-gray-500'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-blue-500/20' : 'bg-white/5'
                }`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{m.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="w-full max-w-5xl flex flex-col items-center gap-4"
      >
        <button
          onClick={handleContinue}
          disabled={!canContinue || isGenerating}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]"
        >
          Continue to prompt editor <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-xs text-gray-500">
          You can also{' '}
          <button className="underline hover:text-gray-300 transition-colors">import files</button>
        </p>
      </motion.div>
    </div>
  );
}
