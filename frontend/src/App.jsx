import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import CreateNewPage from './components/CreateNewPage';
import CreationLauncher from './components/CreationLauncher';
import PasteTextLauncher from './components/PasteTextLauncher';
import WizardForm from './components/WizardForm';
import TemplatePicker from './components/TemplatePicker';
import ImportLauncher from './components/ImportLauncher';
import Workspace from './components/Workspace';
import HistoryPanel from './components/HistoryPanel';
import SettingsPanel from './components/SettingsPanel';
import axios from 'axios';
import { Presentation, Loader2, History, Settings, Sun, Moon } from 'lucide-react';

function App() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('llmSettings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      layoutConfig: {
        baseUrl: 'http://127.0.0.1:1234/v1',
        apiKey: '',
        model: 'qwen_layout_mlx',
      },
      contentConfig: {
        baseUrl: 'http://127.0.0.1:1234/v1',
        apiKey: '',
        model: 'google/gemma-4-e4b',
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('llmSettings', JSON.stringify(settings));
  }, [settings]);


  
  // Navigation: 'home' | 'create-new' | 'create' | 'paste' | 'wizard' | 'template-pick' | 'import' | 'workspace'
  const [view, setView] = useState('home');

  // Universal dark/light mode (persisted in localStorage)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const toggleDarkMode = () => setDarkMode(prev => {
    localStorage.setItem('darkMode', JSON.stringify(!prev));
    return !prev;
  });

  const [slidesJson, setSlidesJson] = useState(null);
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('Modern Minimalist');
  const [templateType, setTemplateType] = useState('default');
  const [masterTemplate, setMasterTemplate] = useState(null);
  const [cloudTemplateUrl, setCloudTemplateUrl] = useState(null);
  const [slideSize, setSlideSize] = useState('LAYOUT_16x9');
  
  const [customThemeSettings, setCustomThemeSettings] = useState({
    bkgd: '131B2A',
    textColor: 'D1D5DB',
    accent: '8B5CF6',
    fontFace: 'Helvetica Neue'
  });
  
  const [customBackground, setCustomBackground] = useState({
    type: 'solid',
    value: '',
    overlayColor: '#000000',
    overlayOpacity: 0.5
  });
  
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dbId, setDbId] = useState(null);

  const handleSelectMode = (modeId) => {
    if (modeId === 'template') {
      setView('template-pick');
    } else if (modeId === 'paste') {
      setView('paste');
    } else if (modeId === 'import') {
      setView('import');
    } else {
      // 'generate' → creation launcher
      setView('create');
    }
  };

  const handleGenerateJson = async (formData) => {
    setIsGenerating(true);
    setError(null);
    setGenerationStatus("Initializing...");
    setGenerationStep(0);
    setTheme(formData.theme);
    setTemplateType(formData.templateType || 'default');
    setMasterTemplate(formData.masterTemplate || null);
    setCloudTemplateUrl(formData.cloudTemplateUrl || null);
    setSlideSize(formData.slideSize || 'LAYOUT_16x9');
    
    try {
<<<<<<< HEAD
      const response = await fetch('http://localhost:3000/api/generate-json-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          baseUrl: settings.baseUrl,
          model: formData.model || settings.model
        })
=======
      const response = await axios.post('http://localhost:3000/api/generate-json', {
        ...formData,
        layoutConfig: settings.layoutConfig,
        contentConfig: settings.contentConfig
>>>>>>> origin/main
      });

      if (!response.ok) throw new Error("Failed to connect to stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        let currentEvent = null;
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('event: ')) {
            currentEvent = line.replace('event: ', '').trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr) {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'status') {
                setGenerationStatus(data.message);
                if (data.step) setGenerationStep(data.step);
              } else if (currentEvent === 'complete') {
                setSlidesJson(data.slides || []);
                setTitle(data.title);
                setTheme(data.theme || formData.theme);
                setDbId(data.id);
                setView('workspace');
              } else if (currentEvent === 'error') {
                throw new Error(data.error);
              }
            }
          }
        }
        buffer = lines[lines.length - 1];
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
      setGenerationStep(0);
    }
  };

  const handleSelectHistory = (historyItem) => {
    setSlidesJson(historyItem.slides_json.slides || historyItem.slides_json);
    setTitle(historyItem.title);
    setTheme(historyItem.slides_json?.theme || historyItem.theme);
    setDbId(historyItem.id);
    setTemplateType('default');
    setShowHistory(false);
    setView('workspace');
  };

  const handleExport = (target) => {
    handleGeneratePptx(target);
  };

  const handleGeneratePptx = async (target = 'local') => {
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('slides', JSON.stringify(slidesJson));
      formData.append('title', title);
      formData.append('theme', theme);
      if (theme === 'Custom') {
        formData.append('customTheme', JSON.stringify(customThemeSettings));
      }
      formData.append('customBackground', JSON.stringify(customBackground));
      formData.append('templateType', templateType);
      formData.append('slideSize', slideSize);

      if (templateType === 'custom' && masterTemplate) {
        formData.append('template', masterTemplate);
      } else if (templateType === 'online' && cloudTemplateUrl) {
        formData.append('cloudTemplateUrl', cloudTemplateUrl);
      }
      
      let urlEndpoint = 'http://localhost:3000/api/generate-pptx';
      if (target === 'drive') {
          urlEndpoint = 'http://localhost:3000/api/export/drive';
      }

      const response = await axios.post(urlEndpoint, formData, { 
        responseType: target === 'local' ? 'blob' : 'json',
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (target === 'local') {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${title || 'presentation'}.pptx`);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } else {
          alert('Successfully uploaded to Google Drive! Check your Google Drive root folder.');
      }
    } catch (err) {
      setError(target === 'drive' ? 'Google Drive export failed. Ensure your OAuth tokens are configured.' : err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen selection:bg-violet-500/30 transition-colors duration-300 ${
      darkMode
        ? 'bg-[#0B0F17] text-gray-100'
        : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-gray-900'
    }`}>
      {showHistory && (
        <HistoryPanel
          darkMode={darkMode}
          onSelectHistory={handleSelectHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
      
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl w-full max-w-md border shadow-2xl relative overflow-hidden ${
            darkMode ? 'bg-[#131B2A] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className={`flex justify-between items-center p-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-violet-400" /> Settings</h3>
              <button onClick={() => setShowSettings(false)} className={darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>✕</button>
            </div>
            <div className="p-4">
              <SettingsPanel settings={settings} onSettingsChange={setSettings} darkMode={darkMode} />
            </div>
            <div className={`p-4 border-t flex justify-end ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition-colors">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <header className={`w-full flex items-center justify-between p-4 px-8 border-b sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 ${
        darkMode
          ? 'border-white/5 bg-[#0B0F17]/80'
          : 'border-black/5 bg-white/80'
      }`}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSlidesJson(null); setDbId(null); setView('home'); }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
               <Presentation className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Gamma<span className="text-violet-500">Clone</span></h1>
        </div>
        <div className="flex items-center gap-3">
            {view !== 'home' && (
                <button onClick={() => { setSlidesJson(null); setDbId(null); setView('home'); }} className={`text-sm font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                    Home
                </button>
            )}
            <button onClick={() => setShowHistory(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300' : 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-700'
            }`}>
                <History className="w-4 h-4" /> History
            </button>
            <button onClick={() => setShowSettings(true)} className={`flex items-center justify-center p-2 rounded-lg transition-colors border ${
              darkMode ? 'bg-white/5 hover:bg-white/10 border-white/5' : 'bg-black/5 hover:bg-black/10 border-black/10'
            }`} title="Settings">
                <Settings className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 border ${
                darkMode
                  ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400 hover:text-yellow-300'
                  : 'bg-gray-900/10 hover:bg-gray-900/20 border-gray-900/20 text-gray-700 hover:text-gray-900'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
        </div>
      </header>

      <main className="w-full h-[calc(100vh-73px)] relative flex flex-col overflow-hidden">
        
        {/* Error Toast */}
        {error && (
            <div className="absolute top-4 right-4 z-50 bg-red-500/10 text-red-400 px-4 py-3 rounded-xl border border-red-500/20 shadow-2xl max-w-md">
               <p className="text-sm font-medium">{error}</p>
            </div>
        )}

        {/* Live Progress Overlay */}
        {isGenerating && generationStatus && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className={`flex flex-col items-center p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-[#131b2e] border border-white/10' : 'bg-white border border-gray-200'}`}>
                    <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {generationStatus}
                    </h3>
                    {generationStep > 0 && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Step {generationStep} of 5
                        </p>
                    )}
                </div>
            </div>
        )}

        {view === 'home' && (
            <HomePage
              darkMode={darkMode}
              onCreateNew={() => setView('create-new')}
              onSelectMode={handleSelectMode}
              onShowHistory={() => setShowHistory(true)}
              onOpenDocument={(doc) => handleSelectHistory(doc)}
            />
        )}

        {view === 'create-new' && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center">
              <CreateNewPage
                darkMode={darkMode}
                onSelectMode={handleSelectMode}
                onShowHistory={() => setShowHistory(true)}
                onBack={() => setView('home')}
              />
            </div>
        )}

        {['create','paste','template-pick','import','wizard'].includes(view) && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center">
              {view === 'create' && (
                  <CreationLauncher
                    darkMode={darkMode}
                    onGenerate={handleGenerateJson}
                    isGenerating={isGenerating}
                    layoutConfig={settings.layoutConfig}
                    contentConfig={settings.contentConfig}
                    onBack={() => setView('create-new')}
                  />
              )}
              {view === 'paste' && (
                  <PasteTextLauncher
                    darkMode={darkMode}
                    onGenerate={handleGenerateJson}
                    isGenerating={isGenerating}
                    onBack={() => setView('create-new')}
                  />
              )}
              {view === 'template-pick' && (
                  <TemplatePicker
                    onBack={() => setView('create-new')}
                    darkMode={darkMode}
                    onSelectTemplate={(template) => {
                      handleGenerateJson({
                        prompt: `Create a ${template.name} presentation`,
                        contentType: 'presentation',
                        slideCount: 10,
                        tone: 'Professional/Corporate',
                        theme: 'Modern Minimalist',
                        templateType: 'default',
                        density: 'Detailed',
                        includeImages: true,
                        templateId: template.id,
                        templateName: template.name,
                      });
                    }}
                  />
              )}
              {view === 'import' && (
                  <ImportLauncher
                    darkMode={darkMode}
                    onBack={() => setView('create-new')}
                    onPasteInText={() => setView('paste')}
                    onImport={(importData) => {
                      handleGenerateJson({
                        prompt: importData.url
                          ? `Transform the content at ${importData.url} into a presentation`
                          : 'Transform the uploaded file into a presentation',
                        contentType: 'presentation',
                        importType: importData.importType,
                        importUrl: importData.url || null,
                        importFile: importData.file || null,
                        slideCount: 10,
                        tone: 'Professional/Corporate',
                        theme: 'Modern Minimalist',
                        templateType: 'default',
                        density: 'Detailed',
                        includeImages: true,
                      });
                    }}
                  />
              )}
              {view === 'wizard' && (
                  <WizardForm
                    darkMode={darkMode}
                    onGenerate={handleGenerateJson}
                    isGenerating={isGenerating}
                    layoutConfig={settings.layoutConfig}
                    contentConfig={settings.contentConfig}
                  />
              )}
            </div>
        )}

        {view === 'workspace' && slidesJson && (
            <Workspace
              darkMode={darkMode}
              slides={slidesJson}
              setSlides={setSlidesJson}
              title={title}
              theme={theme}
              setTheme={setTheme}
              onExport={handleExport}
              isExporting={isGenerating}
              slideSize={slideSize}
              setSlideSize={setSlideSize}
              customThemeSettings={customThemeSettings}
              setCustomThemeSettings={setCustomThemeSettings}
              customBackground={customBackground}
              setCustomBackground={setCustomBackground}
              contentConfig={settings.contentConfig}
            />
        )}
      </main>
    </div>
  );
}

export default App;
