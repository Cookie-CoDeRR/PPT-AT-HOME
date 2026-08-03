import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Sparkles, Paperclip, Camera, Loader2, FileText, CheckCircle, ChevronDown, Monitor, Settings2, Image as ImageIcon, SlidersHorizontal, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function CreationLauncher({ onGenerate, isGenerating, baseUrl }) {
  const [prompt, setPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [modelDropdown, setModelDropdown] = useState(false);
  const [countDropdown, setCountDropdown] = useState(false);
  
  const [activeModel, setActiveModel] = useState('deepseek-coder-v2-lite-instruct-mlx'); 
  const [availableModels, setAvailableModels] = useState(['deepseek-coder-v2-lite-instruct-mlx']);

  // Advanced Settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);
  const [detailLevel, setDetailLevel] = useState('Detailed');
  const [tone, setTone] = useState('Professional/Corporate');
  const [temperature, setTemperature] = useState(0.6);

  React.useEffect(() => {
    const fetchModels = async () => {
        try {
            const response = await axios.post('http://localhost:3000/api/models', { baseUrl });
            if (response.data.models && response.data.models.length > 0) {
                const fetchedModels = response.data.models.map(m => m.name || m.id);
                setAvailableModels(fetchedModels);
                if (!fetchedModels.includes(activeModel)) {
                    setActiveModel(fetchedModels[0]);
                }
            } else if (response.data.models && response.data.models.length === 0) {
                // Connection succeeded but no models loaded (common with LM Studio)
                setAvailableModels(['⚠️ No Models Loaded']);
                setActiveModel('⚠️ No Models Loaded');
            }
        } catch (err) {
            console.error("Failed to fetch models");
        }
    };
    fetchModels();
  }, [baseUrl]); 

  // RAG Upload
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [useRag, setUseRag] = useState(false);

  // Vision
  const [referenceImage, setReferenceImage] = useState(null);

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
    } catch (err) {
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

  const { getRootProps: getRAGProps, getInputProps: getRAGInput } = useDropzone({
    onDrop: onRAGDrop, maxFiles: 1, noDrag: true
  });

  const { getRootProps: getImageProps, getInputProps: getImageInput } = useDropzone({
    onDrop: onImageDrop, accept: {'image/*': []}, maxFiles: 1, noDrag: true
  });

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating || activeModel === '⚠️ No Models Loaded') return;
    onGenerate({
      prompt,
      slideCount,
      tone: tone,
      theme: 'Modern Dark Tech', // Default for Gamma look
      useRag,
      templateType: 'default',
      density: detailLevel,
      includeImages: includeImages,
      slideSize: 'LAYOUT_16x9',
      referenceImage: referenceImage?.data,
      model: activeModel,
      temperature: temperature
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-4xl mx-auto px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          What would you like to present?
        </h1>

        <div className="glass-panel p-2 relative overflow-visible transition-all duration-300 focus-within:ring-2 focus-within:ring-violet-500/50">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe your topic, paste an outline, or attach a document..."
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-lg p-6 min-h-[160px] resize-none outline-none border-none focus:ring-0"
          />

          {/* Attachments Display */}
          <div className="flex flex-wrap gap-2 px-6 pb-2">
            {uploadedFile && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm border border-blue-500/20">
                <FileText className="w-4 h-4" />
                {uploadedFile}
                {uploadStatus === 'uploading' && <Loader2 className="w-3 h-3 animate-spin ml-2" />}
                {uploadStatus === 'success' && <CheckCircle className="w-3 h-3 text-green-400 ml-2" />}
              </div>
            )}
            {referenceImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm border border-purple-500/20">
                <Camera className="w-4 h-4" />
                {referenceImage.name}
              </div>
            )}
          </div>

          {/* Action Badge Bar */}
          <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10 rounded-xl mt-2">
            <div className="flex items-center gap-2">
              
              {/* Model Pill */}
              <div className="relative">
                <button 
                  onClick={() => setModelDropdown(!modelDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                >
                  <Monitor className="w-4 h-4 text-violet-400" />
                  {activeModel}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                <AnimatePresence>
                  {modelDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-2 left-0 w-48 glass-panel z-50 py-2 shadow-2xl"
                    >
                      {availableModels.map(m => (
                        <button key={m} onClick={() => { setActiveModel(m); setModelDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-200 truncate">
                          {m}
                        </button>
                      ))}
                      <div className="px-4 py-2 text-xs text-gray-500 border-t border-white/10 mt-1 pt-2">
                        Models loaded from Local API
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Slide Count Pill */}
              <div className="relative">
                <button 
                  onClick={() => setCountDropdown(!countDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                >
                  {slideCount} Slides
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                <AnimatePresence>
                  {countDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-2 left-0 w-32 glass-panel z-50 py-2 shadow-2xl"
                    >
                      {[5, 8, 10, 15].map(num => (
                        <button key={num} onClick={() => { setSlideCount(num); setCountDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm text-gray-200">
                          {num} Slides
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Attachments */}
              <div className="h-4 w-px bg-white/10 mx-1"></div>
              
              <div {...getRAGProps()}>
                <input {...getRAGInput()} />
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition-colors tooltip" title="Attach Document (RAG)">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <div {...getImageProps()}>
                <input {...getImageInput()} />
                <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-purple-400 transition-colors tooltip" title="Attach Image (Vision)">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

            </div>

            <div className="flex items-center gap-4">
              <button onClick={() => setShowAdvanced(!showAdvanced)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${showAdvanced ? 'text-violet-400' : 'text-gray-400 hover:text-gray-300'}`}>
                <Settings2 className="w-4 h-4" /> Options
              </button>
              
              {/* Generate Button */}
              <button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isGenerating}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg font-bold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/10 bg-black/20 rounded-b-xl"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Include Images Toggle */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <ImageIcon className="w-4 h-4"/> AI Images
                    </label>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIncludeImages(!includeImages)}>
                      <span className="text-sm text-gray-200 font-medium">Generate Visuals</span>
                      <div className={`w-10 h-6 rounded-full p-1 transition-colors ${includeImages ? 'bg-violet-500' : 'bg-gray-600'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${includeImages ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Detail Level */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4"/> Detail Level
                    </label>
                    <div className="relative p-3 bg-white/5 rounded-xl border border-white/5">
                      <select value={detailLevel} onChange={e => setDetailLevel(e.target.value)} className="w-full bg-transparent text-sm text-gray-200 outline-none appearance-none cursor-pointer">
                        <option value="Bullet Points Only" className="bg-gray-900">Brief (Bullet Points)</option>
                        <option value="Detailed" className="bg-gray-900">Detailed</option>
                        <option value="Comprehensive" className="bg-gray-900">Comprehensive (Paragraphs)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Tone/Style */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Mic className="w-4 h-4"/> Tone
                    </label>
                    <div className="relative p-3 bg-white/5 rounded-xl border border-white/5">
                      <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-transparent text-sm text-gray-200 outline-none appearance-none cursor-pointer">
                        <option value="Professional/Corporate" className="bg-gray-900">Professional</option>
                        <option value="Academic" className="bg-gray-900">Academic</option>
                        <option value="Creative" className="bg-gray-900">Creative / Playful</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                </div>
                <div className="px-6 pb-6 pt-4 border-t border-white/5">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4"/> Creativity (Temperature)
                      </label>
                      <span className="text-sm font-bold text-violet-400">{temperature.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.0" 
                      step="0.1" 
                      value={temperature} 
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-violet-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      {temperature <= 0.3 ? "Strictly follows standard corporate templates." : temperature <= 0.7 ? "Balanced variety and structure." : "Highly creative, experimental layouts."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
