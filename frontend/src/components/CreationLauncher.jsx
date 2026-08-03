import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Sparkles, Loader2, FileText, CheckCircle, ChevronDown,
  Monitor, Shuffle, Plus, Paperclip, Camera, Globe, LayoutTemplate,
  Share2, Image as ImageIcon, BarChart2, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { id: 'presentation', label: 'Presentation', icon: LayoutTemplate },
  { id: 'webpage',      label: 'Webpage',       icon: Globe,          soon: true },
  { id: 'document',     label: 'Document',       icon: FileText,       soon: true },
  { id: 'social',       label: 'Social',         icon: Share2,         soon: true },
  { id: 'graphic',      label: 'Graphic',        icon: ImageIcon,      badge: 'NEW', soon: true },
];

const SLIDE_COUNTS = [5, 8, 10, 12, 15];
const THEMES = ['Modern Dark Tech', 'Classic', 'Editorial Serif', 'Vibrant Startup', 'Corporate Pro', 'Elegant Dark'];
const ORIENTATIONS = [
  { label: 'Landscape (16:9)', value: 'LAYOUT_16x9' },
  { label: 'Portrait (9:16)',  value: 'LAYOUT_9x16' },
  { label: 'Square (1:1)',     value: 'LAYOUT_4x3'  },
];
const TONES = ['Professional/Corporate', 'Academic', 'Creative', 'Casual'];

const ALL_PROMPTS = [
  { icon: '📈', text: 'Marketing psychology hacks that feel illegal (but aren\'t)' },
  { icon: '🏋️', text: 'Gym personalities that make everyone uncomfortable' },
  { icon: '📚', text: '4 study habits that got me straight A\'s (and 2 that almost failed me)' },
  { icon: '📢', text: 'From consultant to thought leader (my 6-month roadmap)' },
  { icon: '🔍', text: 'SEO myths that are killing your rankings (stop these immediately)' },
  { icon: '👥', text: 'Gen Z marketing fails that make you look ancient' },
  { icon: '🚀', text: 'How I built a $1M SaaS with zero funding' },
  { icon: '🎯', text: '7 cognitive biases every product designer must know' },
  { icon: '💡', text: 'Why most startup pitches fail in the first 30 seconds' },
  { icon: '🌐', text: 'The future of remote work: data from 10,000 companies' },
  { icon: '🔬', text: 'AI tools replacing entire job roles by 2026' },
  { icon: '📊', text: 'The science of viral content: what the data actually says' },
];

function getRandomSix(pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

// ─── Pill Dropdown ────────────────────────────────────────────────────────────

function PillDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 hover:bg-white/12 text-sm text-gray-300 font-medium transition-all whitespace-nowrap"
      >
        {label && <span className="text-gray-500 text-xs">{label}:</span>}
        <span>{value}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 z-50 min-w-[160px] glass-panel py-1.5 shadow-2xl"
            onClick={() => setOpen(false)}
          >
            {options.map(opt => {
              const optVal = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <button
                  key={optVal}
                  onClick={() => { onChange(optVal); setOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${optVal === (typeof options[0] === 'object' ? value : value) ? 'text-violet-400 bg-violet-500/10' : 'text-gray-200 hover:bg-white/10'}`}
                >
                  {optLabel}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CreationLauncher({ onGenerate, isGenerating, baseUrl, onBack }) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('presentation');
  const [slideCount, setSlideCount] = useState(10);
  const [theme, setTheme] = useState('Classic');
  const [orientation, setOrientation] = useState('LAYOUT_16x9');
  const [tone, setTone] = useState('Professional/Corporate');
  const [examplePrompts, setExamplePrompts] = useState(() => getRandomSix(ALL_PROMPTS));

  const [activeModel, setActiveModel] = useState('deepseek-coder-v2-lite-instruct-mlx');
  const [availableModels, setAvailableModels] = useState(['deepseek-coder-v2-lite-instruct-mlx']);
  const [modelDropdown, setModelDropdown] = useState(false);

  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [useRag, setUseRag] = useState(false);
  const [referenceImage, setReferenceImage] = useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/models', { baseUrl });
        if (response.data.models?.length > 0) {
          const fetched = response.data.models.map(m => m.name || m.id);
          setAvailableModels(fetched);
          if (!fetched.includes(activeModel)) setActiveModel(fetched[0]);
        } else if (response.data.models?.length === 0) {
          setAvailableModels(['⚠️ No Models Loaded']);
          setActiveModel('⚠️ No Models Loaded');
        }
      } catch { /* silently fail */ }
    };
    fetchModels();
  }, [baseUrl]);

  const onRAGDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploadedFile(file.name);
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('baseUrl', baseUrl);
    try {
      await axios.post('http://localhost:3000/api/upload-context', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('success');
      setUseRag(true);
    } catch {
      setUploadStatus('error');
      setUseRag(false);
    }
  }, [baseUrl]);

  const onImageDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setReferenceImage({ name: file.name, data: e.target.result });
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getRAGProps, getInputProps: getRAGInput } = useDropzone({ onDrop: onRAGDrop, maxFiles: 1, noDrag: true });
  const { getRootProps: getImageProps, getInputProps: getImageInput } = useDropzone({ onDrop: onImageDrop, accept: { 'image/*': [] }, maxFiles: 1, noDrag: true });

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating || activeModel === '⚠️ No Models Loaded') return;
    onGenerate({
      prompt,
      slideCount,
      tone,
      theme: theme === 'Classic' ? 'Modern Dark Tech' : theme,
      useRag,
      templateType: 'default',
      density: 'Detailed',
      includeImages: true,
      slideSize: orientation,
      referenceImage: referenceImage?.data,
      model: activeModel,
      temperature: 0.6,
    });
  };

  const orientationLabel = ORIENTATIONS.find(o => o.value === orientation)?.label?.split(' ')[0] || 'Landscape';

  return (
    <div className="flex flex-col items-center w-full min-h-full px-4 pt-10 pb-16">

      {/* Back button */}
      {onBack && (
        <div className="w-full max-w-3xl mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Generate</h1>
        <p className="text-gray-400 text-base">What would you like to create today?</p>
      </motion.div>

      {/* Content type tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="flex items-center gap-2 mb-6 flex-wrap justify-center"
      >
        {CONTENT_TYPES.map(ct => {
          const Icon = ct.icon;
          const active = contentType === ct.id;
          return (
            <button
              key={ct.id}
              onClick={() => !ct.soon && setContentType(ct.id)}
              className={`relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border text-xs font-semibold transition-all min-w-[90px] ${
                active
                  ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                  : ct.soon
                    ? 'bg-white/3 border-white/5 text-gray-600 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 cursor-pointer'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : ct.soon ? 'text-gray-700' : 'text-gray-500'}`} />
              {ct.label}
              {ct.badge && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                  {ct.badge}
                </span>
              )}
              {ct.soon && (
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded-full leading-none">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Config pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="flex items-center gap-2 mb-5 flex-wrap justify-center"
      >
        <PillDropdown
          label="Slides"
          value={slideCount}
          options={SLIDE_COUNTS}
          onChange={v => setSlideCount(Number(v))}
        />
        <PillDropdown
          value={theme}
          options={THEMES}
          onChange={setTheme}
        />
        <PillDropdown
          value={orientationLabel}
          options={ORIENTATIONS}
          onChange={setOrientation}
        />
        <PillDropdown
          value={tone.split('/')[0]}
          options={TONES}
          onChange={setTone}
        />

        {/* Model pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdown(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 hover:bg-white/12 text-sm text-gray-300 font-medium transition-all"
          >
            <Monitor className="w-3 h-3 text-violet-400" />
            <span className="max-w-[120px] truncate text-xs">{activeModel}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <AnimatePresence>
            {modelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 z-50 w-56 glass-panel py-1.5 shadow-2xl"
              >
                {availableModels.map(m => (
                  <button key={m} onClick={() => { setActiveModel(m); setModelDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 truncate">
                    {m}
                  </button>
                ))}
                <div className="px-4 pt-2 pb-1 text-xs text-gray-500 border-t border-white/10">From local LLM server</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Prompt input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="w-full max-w-3xl mb-3"
      >
        <div className="relative glass-panel overflow-hidden transition-all focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:border-violet-500/40">
          {/* Attachment chips */}
          {(uploadedFile || referenceImage) && (
            <div className="flex flex-wrap gap-2 px-5 pt-4 pb-0">
              {uploadedFile && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs border border-blue-500/20">
                  <FileText className="w-3 h-3" />
                  {uploadedFile}
                  {uploadStatus === 'uploading' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {uploadStatus === 'success' && <CheckCircle className="w-2.5 h-2.5 text-green-400" />}
                </div>
              )}
              {referenceImage && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs border border-purple-500/20">
                  <Camera className="w-3 h-3" />
                  {referenceImage.name}
                </div>
              )}
            </div>
          )}

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Describe what you'd like to make..."
            rows={3}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-base px-5 pt-5 pb-3 resize-none outline-none border-none focus:ring-0"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-4 pb-3 gap-3">
            <div className="flex items-center gap-1">
              <div {...getRAGProps()}>
                <input {...getRAGInput()} />
                <button className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-white/8 transition-colors" title="Attach document (RAG)">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <div {...getImageProps()}>
                <input {...getImageInput()} />
                <button className="p-2 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-white/8 transition-colors" title="Attach reference image">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating || activeModel === '⚠️ No Models Loaded'}
              id="generate-submit-btn"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm rounded-lg font-bold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Example prompts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="w-full max-w-3xl"
      >
        <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-widest">Example prompts</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {examplePrompts.map((ep, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPrompt(ep.text)}
              className="group relative flex items-start gap-3 p-4 rounded-xl bg-white/4 border border-white/8 hover:border-violet-500/30 hover:bg-white/8 text-left transition-all"
            >
              <span className="text-xl leading-none flex-shrink-0 mt-0.5">{ep.icon}</span>
              <p className="text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed flex-1">{ep.text}</p>
              <Plus className="w-3.5 h-3.5 text-gray-600 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>

        {/* Shuffle */}
        <div className="flex justify-center">
          <button
            onClick={() => setExamplePrompts(getRandomSix(ALL_PROMPTS))}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all font-medium"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      </motion.div>
    </div>
  );
}
