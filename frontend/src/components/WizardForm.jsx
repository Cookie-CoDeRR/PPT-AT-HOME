import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PenTool, Palette, MessageSquare, Layers, FileText, Upload, X, Loader2, CheckCircle, Presentation, Image as ImageIcon, LayoutTemplate, ArrowRight, ArrowLeft, Cloud } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function WizardForm({ onGenerate, isGenerating, contentConfig }) {
  const [step, setStep] = useState(1);

  // Form State
  const [prompt, setPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [tone, setTone] = useState('Professional/Corporate');
  const [theme, setTheme] = useState('Modern Minimalist');
  const [slideSize, setSlideSize] = useState('LAYOUT_16x9');
  const [density, setDensity] = useState('Detailed');
  const [includeImages, setIncludeImages] = useState(true);
  const [useRag, setUseRag] = useState(false);
  
  // RAG Upload State
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);

  // Vision Image Upload State
  const [referenceImage, setReferenceImage] = useState(null);
  
  // Templates
  const [templateType, setTemplateType] = useState('default'); // default, custom, online
  const [masterTemplate, setMasterTemplate] = useState(null);
  
  // Cloud Templates State
  const [manifestUrl, setManifestUrl] = useState('http://localhost:3000/api/mock-manifest.json');
  const [onlineTemplates, setOnlineTemplates] = useState([]);
  const [selectedOnlineTemplate, setSelectedOnlineTemplate] = useState(null);
  const [manifestStatus, setManifestStatus] = useState('idle'); // idle, loading, success, error

  const fetchManifest = async () => {
    setManifestStatus('loading');
    try {
      const res = await axios.get(manifestUrl);
      setOnlineTemplates(res.data);
      setManifestStatus('success');
      if (res.data.length > 0) setSelectedOnlineTemplate(res.data[0].download_url);
    } catch (err) {
      console.error(err);
      setManifestStatus('error');
    }
  };

  useEffect(() => {
    if (templateType === 'online' && onlineTemplates.length === 0 && manifestStatus === 'idle') {
      fetchManifest();
    }
  }, [templateType]);

  const onRAGDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file.name);
    setUploadStatus('uploading');
    setUploadMessage('Processing document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentConfig', JSON.stringify(contentConfig));

    try {
      const response = await axios.post('http://localhost:3000/api/upload-context', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('success');
      setUploadMessage(`Extracted ${response.data.chunksProcessed} context chunks.`);
      setUseRag(true);
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err.response?.data?.error || err.message);
      setUseRag(false);
    }
  }, [contentConfig]);

  const onTemplateDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) setMasterTemplate(file);
  }, []);

  const onImageDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImage({ name: file.name, data: e.target.result });
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getRAGProps, getInputProps: getRAGInput, isDragActive: isRAGActive } = useDropzone({
    onDrop: onRAGDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1
  });

  const { getRootProps: getTemplateProps, getInputProps: getTemplateInput, isDragActive: isTemplateActive } = useDropzone({
    onDrop: onTemplateDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] },
    maxFiles: 1
  });

  const { getRootProps: getImageProps, getInputProps: getImageInput, isDragActive: isImageActive } = useDropzone({
    onDrop: onImageDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1
  });

  const handleSubmit = () => {
    onGenerate({ 
        prompt, slideCount, tone, theme, useRag, 
        templateType, masterTemplate, density, includeImages, slideSize,
        referenceImage: referenceImage?.data,
        cloudTemplateUrl: templateType === 'online' ? selectedOnlineTemplate : null
    });
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  const [direction, setDirection] = useState(1);
  const nextStep = () => { setDirection(1); setStep(s => s + 1); };
  const prevStep = () => { setDirection(-1); setStep(s => s - 1); };

  return (
    <div className="glass-panel p-6 overflow-hidden relative min-h-[500px] flex flex-col">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="flex-1 relative">
        <AnimatePresence custom={direction} mode="wait">
          
          {/* STEP 1: TOPIC & CONTEXT */}
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">What are we presenting?</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic / Instructions</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 glass-input min-h-[120px] resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g. A 5-slide pitch deck on why our company should adopt AI, targeted at executives..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Grounding Context (RAG)
                  </label>
                  <p className="text-xs text-gray-500 mb-4">Optional: Upload a document to enforce facts.</p>
                  
                  <div {...getRAGProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all h-[120px] flex flex-col items-center justify-center
                    ${isRAGActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-white/60'}`}>
                    <input {...getRAGInput()} />
                    {uploadStatus === 'idle' && (
                      <div className="text-gray-500">
                        <Upload className="w-6 h-6 mb-2 mx-auto opacity-50 text-blue-600" />
                        <span className="text-xs font-medium">Drop document</span>
                      </div>
                    )}
                    {uploadStatus === 'uploading' && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
                    {uploadStatus === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  </div>
                </div>

                <div className="bg-white/40 p-5 rounded-2xl border border-gray-200/50 shadow-sm">
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-600" /> Vision Reference
                  </label>
                  <p className="text-xs text-gray-500 mb-4">Optional: Upload an image for the AI to analyze.</p>
                  
                  <div {...getImageProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all h-[120px] flex flex-col items-center justify-center relative overflow-hidden
                    ${isImageActive ? 'border-purple-500 bg-purple-50/50' : 'border-gray-300 hover:border-purple-400 hover:bg-white/60'}`}>
                    <input {...getImageInput()} />
                    {referenceImage ? (
                      <div className="w-full h-full relative">
                        <img src={referenceImage.data} alt="Ref" className="w-full h-full object-cover rounded-lg opacity-60" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <Upload className="w-6 h-6 mb-2 mx-auto opacity-50 text-purple-600" />
                        <span className="text-xs font-medium">Drop image</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SETTINGS & CONTENT OPTIONS */}
          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">Content Preferences</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Slide Count: <span className="text-blue-600 font-bold">{slideCount}</span></label>
                  <input type="range" min="3" max="15" className="w-full accent-blue-600 h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer" value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value))} />
                </div>
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Density</label>
                  <select className="w-full px-3 py-2 glass-input appearance-none bg-white/60 text-sm" value={density} onChange={(e) => setDensity(e.target.value)}>
                    <option>Brief (High-level)</option>
                    <option>Detailed (Balanced)</option>
                    <option>Comprehensive (Text-heavy)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select className="w-full px-3 py-2 glass-input appearance-none bg-white/60 text-sm" value={tone} onChange={(e) => setTone(e.target.value)}>
                    <option>Professional/Corporate</option>
                    <option>Academic/Research</option>
                    <option>Casual/Pitch Deck</option>
                  </select>
                </div>
                <div className="bg-white/40 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Auto-Images</label>
                    <p className="text-xs text-gray-500 mt-1">Fetch free stock photos</p>
                  </div>
                  <button onClick={() => setIncludeImages(!includeImages)} className={`w-12 h-6 rounded-full transition-colors relative ${includeImages ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${includeImages ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TEMPLATES */}
          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-5 h-5 text-amber-600" />
                <h2 className="text-xl font-bold text-gray-800">Design & Theme</h2>
              </div>

              <select 
                className="w-full px-4 py-3 glass-input appearance-none bg-white/60 text-lg font-medium text-gray-800 mb-4 shadow-sm"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
              >
                <option value="default">Basic Themes (Built-in)</option>
                <option value="custom">Custom Template (Upload .pptx)</option>
                <option value="online">Cloud Templates (GitHub CMS)</option>
              </select>

              {templateType === 'default' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Modern Minimalist', 'Corporate Blue', 'Dark Mode Tech', 'Warm Editorial', 'Vibrant Startup', 'Eco Green'].map(t => (
                      <button key={t} onClick={() => setTheme(t)} className={`p-4 rounded-xl border text-left transition-all ${theme === t ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white/40 hover:bg-white/60'}`}>
                        <div className="font-bold text-gray-800 text-sm">{t}</div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slide Size (Aspect Ratio)</label>
                    <div className="flex gap-4">
                      <button onClick={() => setSlideSize('LAYOUT_16x9')} className={`flex-1 py-3 border rounded-xl font-bold transition-all ${slideSize === 'LAYOUT_16x9' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-200 bg-white/40 text-gray-600 hover:bg-white/60'}`}>
                        16:9 Widescreen
                      </button>
                      <button onClick={() => setSlideSize('LAYOUT_4x3')} className={`flex-1 py-3 border rounded-xl font-bold transition-all ${slideSize === 'LAYOUT_4x3' ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' : 'border-gray-200 bg-white/40 text-gray-600 hover:bg-white/60'}`}>
                        4:3 Standard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {templateType === 'custom' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                    <strong>Want pro templates?</strong> Download free .pptx themes from sites like <a href="https://slidesgo.com" target="_blank" rel="noreferrer" className="underline font-bold">Slidesgo</a> or <a href="https://www.slidescarnival.com" target="_blank" rel="noreferrer" className="underline font-bold">SlidesCarnival</a>, and drop them below!
                  </div>
                  <div {...getTemplateProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isTemplateActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-white/40 hover:border-blue-400'}`}>
                    <input {...getTemplateInput()} />
                    {masterTemplate ? (
                      <div className="text-green-600 flex flex-col items-center">
                        <CheckCircle className="w-8 h-8 mb-2" />
                        <span className="text-md font-bold">{masterTemplate.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 flex flex-col items-center">
                        <LayoutTemplate className="w-8 h-8 mb-3 opacity-50 text-amber-600" />
                        <span className="text-md font-medium text-gray-700">Upload your master .pptx</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {templateType === 'online' && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 px-4 py-2 glass-input text-sm"
                      placeholder="Manifest URL (e.g. raw.githubusercontent.com/.../manifest.json)"
                      value={manifestUrl}
                      onChange={e => setManifestUrl(e.target.value)}
                    />
                    <button onClick={fetchManifest} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                      <Cloud className="w-4 h-4" /> Load
                    </button>
                  </div>
                  
                  {manifestStatus === 'loading' && <div className="text-center py-8 text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/>Loading templates...</div>}
                  {manifestStatus === 'error' && <div className="text-center py-4 text-red-500 font-bold bg-red-50 rounded-xl">Failed to load manifest JSON. Check URL.</div>}
                  {manifestStatus === 'success' && onlineTemplates.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-4 max-h-[300px] overflow-y-auto pr-2 pb-2">
                      {onlineTemplates.map(tpl => (
                        <div 
                          key={tpl.download_url}
                          onClick={() => setSelectedOnlineTemplate(tpl.download_url)}
                          className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedOnlineTemplate === tpl.download_url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent hover:border-gray-300'}`}
                        >
                          <img src={tpl.thumbnail_url} alt={tpl.name} className="w-full h-32 object-cover bg-gray-100" />
                          <div className={`p-2 text-center text-sm font-bold ${selectedOnlineTemplate === tpl.download_url ? 'bg-blue-600 text-white' : 'bg-white/80 text-gray-700'}`}>
                            {tpl.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center z-10 bg-white/50 backdrop-blur -mx-6 -mb-6 p-4 rounded-b-3xl">
        <button 
          onClick={prevStep} 
          disabled={step === 1 || isGenerating}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${step === 1 ? 'opacity-0 cursor-default' : 'text-gray-600 hover:text-gray-900'}`}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        {step < 3 ? (
          <button 
            onClick={nextStep} 
            disabled={!prompt.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isGenerating || (templateType === 'custom' && !masterTemplate) || (templateType === 'online' && !selectedOnlineTemplate)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : 'Generate Magic'}
          </button>
        )}
      </div>
    </div>
  );
}
