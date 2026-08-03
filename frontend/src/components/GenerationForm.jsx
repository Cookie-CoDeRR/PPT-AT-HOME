import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PenTool, Palette, MessageSquare, Layers, FileText, Upload, X, Loader2, CheckCircle, Presentation } from 'lucide-react';
import axios from 'axios';

export default function GenerationForm({ onGenerate, isGenerating, baseUrl }) {
  const [prompt, setPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [tone, setTone] = useState('Professional/Corporate');
  const [theme, setTheme] = useState('Modern Minimalist');
  const [useRag, setUseRag] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [templateType, setTemplateType] = useState('default');
  const [masterTemplate, setMasterTemplate] = useState(null);

  const onRAGDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file.name);
    setUploadStatus('uploading');
    setUploadMessage('Processing document...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('baseUrl', baseUrl);

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
  }, [baseUrl]);

  const onTemplateDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) setMasterTemplate(file);
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
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({ prompt, slideCount, tone, theme, useRag, templateType, masterTemplate });
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-6">
        <PenTool className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-bold text-gray-800">Presentation Content</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* RAG Context Upload */}
        <div className="bg-white/30 p-4 rounded-xl border border-gray-200/50">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Optional Reference Material
          </label>
          <p className="text-xs text-gray-500 mb-3">Upload a PDF, PPTX, or TXT to automatically inject facts and context into the presentation.</p>
          
          <div 
            {...getRAGProps()} 
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
              ${isRAGActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-white/40'}`}
          >
            <input {...getRAGInput()} />
            {uploadStatus === 'idle' && (
              <div className="text-gray-500 flex flex-col items-center">
                <Upload className="w-6 h-6 mb-2 opacity-50" />
                <span className="text-sm">Drag & drop or click to upload</span>
                <span className="text-xs opacity-60 mt-1">Supports PDF, TXT, MD</span>
              </div>
            )}
            
            {uploadStatus === 'uploading' && (
              <div className="text-blue-600 flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-sm font-medium">{uploadMessage}</span>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="text-green-600 flex flex-col items-center">
                <CheckCircle className="w-6 h-6 mb-2" />
                <span className="text-sm font-bold">{uploadedFile}</span>
                <span className="text-xs mt-1">{uploadMessage}</span>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="text-red-500 flex flex-col items-center">
                <X className="w-6 h-6 mb-2" />
                <span className="text-sm font-bold">Upload Failed</span>
                <span className="text-xs mt-1">{uploadMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Topic / Instructions
          </label>
          <textarea 
            required
            className="w-full px-4 py-3 glass-input min-h-[100px] resize-y"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the presentation topic, key points to cover, and target audience..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4" /> Slide Count
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="3" max="15" 
              className="flex-1 accent-blue-600 h-2 bg-gray-200/50 rounded-lg appearance-none cursor-pointer backdrop-blur"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
            />
            <span className="text-sm font-bold text-blue-700 bg-blue-100/50 backdrop-blur px-3 py-1 rounded-lg w-12 text-center shadow-sm">
              {slideCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Tone
            </label>
            <select 
              className="w-full px-3 py-2 glass-input appearance-none bg-white/40 text-sm"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option>Professional/Corporate</option>
              <option>Academic/Research</option>
              <option>Casual/Pitch Deck</option>
              <option>Technical/Developer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Base Theme
            </label>
            <select 
              className="w-full px-3 py-2 glass-input appearance-none bg-white/40 text-sm"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option>Modern Minimalist</option>
              <option>Corporate Blue</option>
              <option>Dark Mode Tech</option>
              <option>Warm Editorial</option>
            </select>
          </div>
        </div>
        
        {/* Dynamic Master Template Selector */}
        <div className="bg-white/30 p-4 rounded-xl border border-gray-200/50">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Presentation className="w-4 h-4" /> Master Template Integration
          </label>
          <select 
            className="w-full px-4 py-2 mb-3 glass-input appearance-none bg-blue-50/50 text-blue-800 font-medium"
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value)}
          >
            <option value="default">Default Engine (Generates slides from scratch)</option>
            <option value="custom">Inject into Custom Master (.pptx)</option>
          </select>

          {templateType === 'custom' && (
            <div 
              {...getTemplateProps()} 
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors
                ${isTemplateActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-white/40'}`}
            >
              <input {...getTemplateInput()} />
              {masterTemplate ? (
                <div className="text-green-600 flex flex-col items-center">
                  <CheckCircle className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">{masterTemplate.name}</span>
                  <span className="text-xs mt-1">Ready for injection</span>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <Upload className="w-6 h-6 mb-2 opacity-50" />
                  <span className="text-sm">Upload base .pptx template</span>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isGenerating || !prompt.trim()}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-sm backdrop-blur
            ${isGenerating || !prompt.trim() 
              ? 'bg-blue-400/50 cursor-not-allowed' 
              : 'bg-blue-600/90 hover:bg-blue-700 hover:shadow-md'}`}
        >
          {isGenerating ? 'Generating...' : 'Generate Presentation Outline'}
        </button>
      </form>
    </div>
  );
}
