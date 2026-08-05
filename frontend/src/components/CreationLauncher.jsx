import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Sparkles, Loader2, FileText, CheckCircle, ChevronDown, ChevronUp, ArrowRight,
  Monitor, Shuffle, Plus, Paperclip, Camera, Globe, LayoutTemplate,
  Share2, Image as ImageIcon, BarChart2, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTENT_TYPES = [
  { id: 'presentation', label: 'Presentation', icon: LayoutTemplate },
  { id: 'webpage',      label: 'Webpage',       icon: Globe },
  { id: 'document',     label: 'Document',       icon: FileText },
  { id: 'social',       label: 'Social',         icon: Share2 },
  { id: 'graphic',      label: 'Graphic',        icon: ImageIcon,      badge: 'NEW' },
];

const SLIDE_COUNTS = [5, 8, 10, 12, 15];
const SECTION_COUNTS = [3, 5, 8, 10, 12];
const LANGUAGES = ['English (UK)', 'English (US)', 'Spanish', 'French', 'German'];
const DOCUMENT_SIZES = ['Default', 'A4', 'US Letter'];

const THEMES = ['Modern Dark Tech', 'Classic', 'Editorial Serif', 'Vibrant Startup', 'Corporate Pro', 'Elegant Dark'];
const ORIENTATIONS = [
  { label: 'Landscape (16:9)', value: 'LAYOUT_16x9' },
  { label: 'Portrait (9:16)',  value: 'LAYOUT_9x16' },
  { label: 'Square (1:1)',     value: 'LAYOUT_4x3'  },
];
const TONES = ['Professional/Corporate', 'Academic', 'Creative', 'Casual'];

const GRAPHIC_STYLES = [
  { id: 'none', label: 'None', preview: '' },
  { id: 'scene', label: 'Scene', preview: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=200&h=200&fit=crop' },
  { id: 'illustration', label: 'Illustration', preview: 'https://images.unsplash.com/photo-1505909182942-e2f09aee3e89?w=200&h=200&fit=crop' },
  { id: 'flat_line_art', label: 'Flat Line Art', preview: 'https://images.unsplash.com/photo-1549492423-400259a2e574?w=200&h=200&fit=crop' },
  { id: 'technical_line', label: 'Technical Line', preview: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&h=200&fit=crop' },
  { id: 'modern_art', label: 'Modern Art', preview: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=200&h=200&fit=crop' },
];
const GRAPHIC_ASPECTS = ['1:1', '16:9', '9:16', '4:3'];
const GRAPHIC_COUNTS = [1, 2, 3, 4];
const GRAPHIC_QUALITIES = ['Standard', 'HD'];

const GRAPHIC_TEMPLATES = [
  { label: 'Infographic', desc: 'Data visuals and charts', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=200&fit=crop' },
  { label: 'Poster', desc: 'Promotional and event posters', img: 'https://images.unsplash.com/photo-1542315183-d343468087bd?w=200&h=200&fit=crop' },
  { label: 'Team Structure', desc: 'Org charts and team pages', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&h=200&fit=crop' },
  { label: 'Invite', desc: 'Invitations and save-the-dates', img: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=200&h=200&fit=crop' },
  { label: 'Calendar & Schedule', desc: 'Calendars and timelines', img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop' },
  { label: 'Diagram', desc: 'Flowcharts and process diagrams', img: 'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?w=200&h=200&fit=crop' },
  { label: 'Logo', desc: 'Brand marks and symbols', img: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=200&h=200&fit=crop' },
  { label: 'Social Media Post', desc: 'Content for social platforms', img: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop' },
  { label: 'Something else', desc: 'Describe anything you want', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop' }
];

const PPT_PROMPTS = [
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

const WEBPAGE_PROMPTS = [
  { icon: '👨‍💼', text: 'Landing page for a healthcare consultant offering process improvement solutions for hospitals and clinics' },
  { icon: '✍️', text: 'Portfolio website for a freelance writer' },
  { icon: '📦', text: 'Landing page for [product]' },
  { icon: '☕', text: 'One-page website promoting a dog cafe' },
  { icon: '🎨', text: 'Personal site for a product designer' },
  { icon: '📱', text: 'Landing page for a mobile app that helps users learn a new language' },
  { icon: '🏢', text: 'Corporate homepage for a B2B SaaS startup' },
  { icon: '🍕', text: 'Website for a local artisan pizzeria' },
];

const DOCUMENT_PROMPTS = [
  { icon: '◮', text: 'Exploring different types of rocks' },
  { icon: '🪙', text: 'Investment prospectus for a new cryptocurrency ICO, gamma coin' },
  { icon: '🔨', text: 'Statement of work for a building contractor working on Willie Wonka\'s factory' },
  { icon: '🏀', text: 'Historic basketball games' },
  { icon: '🏙️', text: 'Potrero Hill, San Francisco' },
  { icon: '🐈', text: 'Buzzfeed-style article: \'10 Weird Facts About Cats\'' },
  { icon: '📝', text: 'Employee onboarding handbook for a remote-first startup' },
  { icon: '📊', text: 'Q3 Financial performance report and Q4 forecast' },
];

const SOCIAL_PROMPTS = [
  { icon: '🤝', text: '5 unconventional ways to land clients (tested on 100+ freelancers)' },
  { icon: '🧠', text: 'Marketing psychology hacks that feel illegal (but aren\'t)' },
  { icon: '🔋', text: '3 signs you\'re suffering from burnout (and what to do about it)' },
  { icon: '🖼️', text: 'Thumbnail secrets that doubled my click-through rate' },
  { icon: '👥', text: '3 tips for creators losing motivation' },
  { icon: '✍️', text: 'Copywriting 101: The Good, The Bad, and The Cringe-worthy' },
  { icon: '📱', text: 'How the Instagram algorithm actually works in 2026' },
  { icon: '🧵', text: 'A viral Twitter thread formula that works every time' },
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

export default function CreationLauncher({ onGenerate, isGenerating, baseUrl, onBack, darkMode = true }) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('presentation');
  const [slideCount, setSlideCount] = useState(10);
  const [theme, setTheme] = useState('Classic');
  const [orientation, setOrientation] = useState('LAYOUT_16x9');
  const [tone, setTone] = useState('Professional/Corporate');
  const [language, setLanguage] = useState('English (UK)');
  const [docSize, setDocSize] = useState('Default');
  
  // Graphic state
  const [graphicStyle, setGraphicStyle] = useState('none');
  const [graphicAspect, setGraphicAspect] = useState('1:1');
  const [graphicCount, setGraphicCount] = useState(3);
  const [graphicQuality, setGraphicQuality] = useState('Standard');
  
  const getPromptsPool = (type) => {
    if (type === 'webpage') return WEBPAGE_PROMPTS;
    if (type === 'document') return DOCUMENT_PROMPTS;
    if (type === 'social') return SOCIAL_PROMPTS;
    return PPT_PROMPTS;
  };
  
  const currentPromptsPool = getPromptsPool(contentType);
  const [examplePrompts, setExamplePrompts] = useState(() => getRandomSix(currentPromptsPool));

  // Update prompts and orientation when content type changes
  useEffect(() => {
    setExamplePrompts(getRandomSix(getPromptsPool(contentType)));
    if (contentType === 'social') {
      setOrientation('LAYOUT_9x16'); // Social defaults to Portrait
    } else if (contentType === 'presentation') {
      setOrientation('LAYOUT_16x9'); // Presentation defaults to Landscape
    }
  }, [contentType]);

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
      contentType,
      slideCount,
      tone,
      theme: theme === 'Classic' ? 'Modern Dark Tech' : theme,
      useRag,
      templateType: 'default',
      density: 'Detailed',
      includeImages: true,
      slideSize: contentType === 'graphic' ? graphicAspect : ((contentType === 'presentation' || contentType === 'social') ? orientation : (contentType === 'document' ? docSize : undefined)),
      language: (contentType === 'webpage' || contentType === 'document' || contentType === 'social') ? language : undefined,
      referenceImage: referenceImage?.data,
      model: activeModel,
      temperature: 0.6,
      graphicStyle: contentType === 'graphic' ? graphicStyle : undefined,
      graphicCount: contentType === 'graphic' ? graphicCount : undefined,
      graphicQuality: contentType === 'graphic' ? graphicQuality : undefined,
    });
  };

  const orientationLabel = ORIENTATIONS.find(o => o.value === orientation)?.label?.split(' ')[0] || 'Landscape';

  // Dynamic theme classes
  const titleColor = darkMode ? 'text-white' : 'text-gray-900';
  const subtitleColor = darkMode ? 'text-gray-400' : 'text-gray-600';
  const backColor = darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900';
  const promptBoxBg = darkMode ? 'bg-[#131b2e] border-white/10' : 'bg-white border-gray-200 shadow-xl';
  const promptInputTxt = darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400';
  const exampleCardBg = darkMode
    ? 'bg-white/4 border-white/8 hover:border-violet-500/30 hover:bg-white/8 text-gray-300 group-hover:text-white'
    : 'bg-white border-gray-200 shadow-sm hover:border-violet-400 hover:bg-violet-50/50 text-gray-800 group-hover:text-gray-900';
  const shuffleBtn = darkMode
    ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
    : 'bg-white border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm';

  return (
    <div className="flex flex-col items-center w-full min-h-full px-4 pt-10 pb-16">

      {/* Back button */}
      {onBack && (
        <div className="w-full max-w-3xl mb-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${backColor}`}
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
        <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${titleColor}`}>Generate</h1>
        <p className={`text-base ${subtitleColor}`}>What would you like to create today?</p>
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
                  ? (darkMode ? 'bg-violet-500/15 border-violet-500/50 text-violet-300' : 'bg-violet-600 border-violet-600 text-white shadow-sm')
                  : ct.soon
                    ? (darkMode ? 'bg-white/3 border-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed')
                    : (darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200 cursor-pointer' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer shadow-sm')
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? (darkMode ? 'text-violet-400' : 'text-white') : ct.soon ? 'text-gray-400' : (darkMode ? 'text-gray-400' : 'text-gray-600')}`} />
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
        {contentType === 'presentation' ? (
          <>
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
          </>
        ) : contentType === 'social' ? (
          <>
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
              value={language}
              options={LANGUAGES}
              onChange={setLanguage}
            />
          </>
        ) : contentType === 'webpage' ? (
          <>
            <PillDropdown
              label="Sections"
              value={slideCount}
              options={SECTION_COUNTS}
              onChange={v => setSlideCount(Number(v))}
            />
            <PillDropdown
              value={language}
              options={LANGUAGES}
              onChange={setLanguage}
            />
          </>
        ) : contentType === 'graphic' ? (
          <>
            <PillDropdown
              value={GRAPHIC_STYLES.find(s => s.id === graphicStyle)?.label || 'None'}
              options={GRAPHIC_STYLES.map(s => ({ label: s.label, value: s.id }))}
              onChange={setGraphicStyle}
            />
            <PillDropdown
              value={graphicAspect}
              options={GRAPHIC_ASPECTS}
              onChange={setGraphicAspect}
            />
            <PillDropdown
              value={graphicCount}
              options={GRAPHIC_COUNTS}
              onChange={v => setGraphicCount(Number(v))}
            />
            <PillDropdown
              value={graphicQuality}
              options={GRAPHIC_QUALITIES}
              onChange={setGraphicQuality}
            />
          </>
        ) : (
          // Document
          <>
            <PillDropdown
              label="Sections"
              value={slideCount}
              options={SECTION_COUNTS}
              onChange={v => setSlideCount(Number(v))}
            />
            <PillDropdown
              value={docSize}
              options={DOCUMENT_SIZES}
              onChange={setDocSize}
            />
            <PillDropdown
              value={language}
              options={LANGUAGES}
              onChange={setLanguage}
            />
          </>
        )}

        {/* Model pill */}
        <div className="relative">
          <button
            onClick={() => setModelDropdown(o => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
              darkMode ? 'bg-white/8 border-white/10 hover:bg-white/12 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm'
            }`}
          >
            <Monitor className="w-3 h-3 text-violet-500" />
            <span className="max-w-[120px] truncate text-xs">{activeModel}</span>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <AnimatePresence>
            {modelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full mt-2 left-0 z-50 w-56 rounded-xl border py-1.5 shadow-2xl ${
                  darkMode ? 'bg-[#131b2e] border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                {availableModels.map(m => (
                  <button key={m} onClick={() => { setActiveModel(m); setModelDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm truncate ${darkMode ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                    {m}
                  </button>
                ))}
                <div className={`px-4 pt-2 pb-1 text-xs border-t ${darkMode ? 'text-gray-500 border-white/10' : 'text-gray-400 border-gray-100'}`}>From local LLM server</div>
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
        <div className={`relative rounded-2xl border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-violet-500/40 focus-within:border-violet-500/40 ${promptBoxBg}`}>
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
            className={`w-full bg-transparent text-base px-5 pt-5 pb-3 resize-none outline-none border-none focus:ring-0 ${promptInputTxt}`}
          />

          {/* Bottom toolbar inside the input for graphic, or bottom row for others */}
          {contentType === 'graphic' ? (
            <div className="px-5 pb-4">
              <div {...getImageProps()} className="inline-block">
                <input {...getImageInput()} />
                <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  darkMode ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700'
                }`}>
                  <Camera className="w-3.5 h-3.5 text-blue-500" />
                  Add reference
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 pb-3 gap-3">
              <div className="flex items-center gap-1">
                <div {...getRAGProps()}>
                  <input {...getRAGInput()} />
                  <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-blue-400 hover:bg-white/8' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100'}`} title="Attach document (RAG)">
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
                <div {...getImageProps()}>
                  <input {...getImageInput()} />
                  <button className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:text-purple-400 hover:bg-white/8' : 'text-gray-400 hover:text-purple-600 hover:bg-gray-100'}`} title="Attach reference image">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating || activeModel === '⚠️ No Models Loaded'}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm rounded-lg font-bold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Generating…' : 'Generate'}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {contentType === 'graphic' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="w-full max-w-3xl"
        >
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Image style</p>
            <button className="text-xs text-blue-500 hover:text-blue-400">See more</button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
            {GRAPHIC_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setGraphicStyle(style.id)}
                className={`flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden relative border-2 transition-all ${graphicStyle === style.id ? 'border-blue-500' : (darkMode ? 'border-transparent hover:border-white/20' : 'border-gray-200 hover:border-gray-400')}`}
              >
                {style.id === 'none' ? (
                  <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center">
                      <div className="w-6 h-[1px] bg-gray-400 rotate-45" />
                    </div>
                  </div>
                ) : (
                  <img src={style.preview} alt={style.label} className="w-full h-full object-cover" />
                )}
                {graphicStyle === style.id && (
                  <div className="absolute bottom-0 left-0 w-full bg-blue-500/90 py-0.5 text-center">
                    <span className="text-[10px] font-bold text-white uppercase">✓ {style.id === 'none' ? 'None' : ''}</span>
                  </div>
                )}
                {graphicStyle !== style.id && (
                  <div className="absolute bottom-1 left-2">
                    <span className="text-[10px] text-white/90 drop-shadow-md">{style.label}</span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="w-full mt-2 mb-8 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-500 text-sm">
              <span className="w-4 h-4 rounded-full border border-orange-500 flex items-center justify-center text-[10px] font-bold">!</span>
              <span className="font-semibold">You're out of credits.</span>
              <span className={darkMode ? 'text-orange-200' : 'text-orange-700'}>Upgrade to continue.</span>
            </div>
            <button className="px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full hover:bg-violet-500 transition-colors shadow-md">
              Upgrade
            </button>
          </div>

          <div className="w-full flex items-center gap-4 mb-6 opacity-60 mt-10">
            <div className={`h-[1px] flex-1 ${darkMode ? 'bg-gradient-to-r from-transparent to-white/20' : 'bg-gradient-to-r from-transparent to-black/20'}`} />
            <span className={`text-xs ${subtitleColor}`}>Or, start with a template</span>
            <div className={`h-[1px] flex-1 ${darkMode ? 'bg-gradient-to-l from-transparent to-white/20' : 'bg-gradient-to-l from-transparent to-black/20'}`} />
          </div>

          {/* Step 1: Open */}
          <div className={`w-full rounded-xl border overflow-hidden mb-3 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white shadow-sm'}`}>
            <div className="p-4 pb-2 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">1</div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>What do you want to design?</span>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="p-4 pt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {GRAPHIC_TEMPLATES.map((tpl, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className={`w-full aspect-square rounded-lg overflow-hidden border mb-2 transition-colors ${darkMode ? 'border-white/10 group-hover:border-blue-500/50' : 'border-gray-200 group-hover:border-blue-500'}`}>
                    <img src={tpl.img} alt={tpl.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h4 className={`text-[13px] font-medium transition-colors ${darkMode ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'}`}>{tpl.label}</h4>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{tpl.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Closed */}
          <div className={`w-full rounded-xl border overflow-hidden mb-3 opacity-60 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>2</div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pick a layout</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Step 3: Closed */}
          <div className={`w-full rounded-xl border overflow-hidden mb-8 opacity-60 ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${darkMode ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>3</div>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Theme & prompt</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Start Blank */}
          <div className="flex justify-center mb-8">
            <button className="flex items-center gap-1.5 text-sm text-blue-500 font-medium hover:text-blue-400 transition-colors">
              Start a new blank design <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </motion.div>
      ) : (
        /* Example prompts */
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="w-full max-w-3xl"
        >
          <p className="text-xs text-gray-500 text-center mb-4 uppercase tracking-widest">Example prompts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
            {examplePrompts.map((ep, i) => (
              <motion.button
                key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.04 }}
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setPrompt(ep.text)}
                className={`group relative flex items-start gap-3 p-4 rounded-xl text-left transition-all ${exampleCardBg}`}
              >
                <span className="text-xl leading-none flex-shrink-0 mt-0.5">{ep.icon}</span>
                <p className={`text-xs leading-relaxed flex-1 ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>{ep.text}</p>
                <Plus className="w-3.5 h-3.5 text-gray-400 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100" />
              </motion.button>
            ))}
          </div>
          <div className="flex justify-center">
            <button onClick={() => setExamplePrompts(getRandomSix(currentPromptsPool))}
              className={`flex items-center gap-2 px-5 py-2 rounded-full border text-sm transition-all font-medium ${shuffleBtn}`}>
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
