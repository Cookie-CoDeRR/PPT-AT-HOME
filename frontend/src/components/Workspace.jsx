import React, { useState } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Plus, Edit3, Image as ImageIcon, Copy, Trash2, Palette, Settings, LayoutTemplate, Type, Loader2 } from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import { THEME_PRESETS } from '../config/themes';
import IncrementalChat from './IncrementalChat';

export default function Workspace({ slides, setSlides, title, theme, setTheme, onExport, isExporting, slideSize, setSlideSize, customThemeSettings, setCustomThemeSettings, customBackground, setCustomBackground, baseUrl, model }) {
  const [activeTab, setActiveTab] = useState('theme'); // 'theme' or 'settings'

  const themes = THEME_PRESETS.reduce((acc, preset) => {
    acc[preset.name] = {
      bkgd: preset.bgColor,
      titleColor: preset.titleColor,
      textColor: preset.textColor,
      accent: preset.accentColor,
      shapeFill: preset.cardBg,
      fontFace: preset.headerFont.split(',')[0].trim(),
      bodyFontFace: preset.bodyFont.split(',')[0].trim(),
      cssHeaderFont: preset.headerFont,
      cssBodyFont: preset.bodyFont
    };
    return acc;
  }, {});

  const activeThemeObj = theme === 'Custom' 
    ? { bkgd: '#' + customThemeSettings.bkgd, textColor: '#' + customThemeSettings.textColor, accent: '#' + customThemeSettings.accent, titleColor: '#' + customThemeSettings.textColor, fontFace: customThemeSettings.fontFace, cssHeaderFont: customThemeSettings.fontFace, cssBodyFont: customThemeSettings.fontFace }
    : (themes[theme] || themes['Modern Clean']);


  const handleReorder = (newOrder) => {
    setSlides(newOrder);
  };

  const handleJumpToSlide = (index) => {
    const el = document.getElementById(`slide-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDuplicate = (slide, index) => {
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, { ...slide, slide_number: slides.length + 1 });
    setSlides(newSlides);
  };

  const handleDelete = (index) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
  };

  const handleAddSlide = () => {
    setSlides([...slides, {
      slide_number: slides.length + 1,
      layout_type: "Title and Content",
      title: "New Slide",
      bullets: ["Click to edit"]
    }]);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] w-full max-w-[1600px] mx-auto gap-6 overflow-hidden">
      
      {/* LEFT SIDEBAR: Navigation Outline */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="glass-panel p-4 flex-1 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Outline</h3>
          
          <Reorder.Group axis="y" values={slides} onReorder={handleReorder} className="flex flex-col gap-2 flex-1">
            {slides.map((slide, index) => (
              <Reorder.Item 
                key={slide.slide_number + slide.title + index} 
                value={slide}
                onClick={() => handleJumpToSlide(index)}
                className="group relative flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-grab active:cursor-grabbing transition-colors"
              >
                <GripVertical className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity absolute left-1" />
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400 ml-4 flex-shrink-0">
                  {index + 1}
                </div>
                <div className="truncate text-sm text-gray-200 font-medium">{slide.title || 'Untitled Slide'}</div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <button onClick={handleAddSlide} className="mt-4 flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-dashed border-white/20 text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors text-sm font-bold">
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        </div>
      </div>

      {/* CENTER CANVAS: Gamma Card Stack */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-32">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="text-center mb-16 pt-8">
             <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 tracking-tight leading-tight">
               {title}
             </h1>
          </div>

          {slides.map((slide, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              {/* Inline Action Toolbar (Visible on Hover) */}
              <div className="absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button className="p-2 rounded-lg bg-white/10 hover:bg-violet-500/20 text-gray-400 hover:text-violet-400 transition-colors tooltip" title="AI Rewrite (Coming Soon)">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-white/10 hover:bg-fuchsia-500/20 text-gray-400 hover:text-fuchsia-400 transition-colors tooltip" title="Regenerate Image (Coming Soon)">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button onClick={() => handleDuplicate(slide, index)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors tooltip" title="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(index)} className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors tooltip" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Slide Card Content */}
              <div 
                id={`slide-${index}`} 
                className="relative overflow-hidden flex items-center justify-center p-0 rounded-2xl shadow-2xl border transition-colors group-hover:shadow-violet-500/20"
                style={{ 
                  ...(customBackground?.type === 'solid' && customBackground.value ? { backgroundColor: customBackground.value } : {}),
                  ...(customBackground?.type === 'gradient' && customBackground.value ? { backgroundImage: customBackground.value, backgroundColor: 'transparent' } : {}),
                  ...(customBackground?.type === 'image' && customBackground.value ? { backgroundImage: `url(${customBackground.value})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'transparent' } : {}),
                  color: activeThemeObj.textColor, 
                  borderColor: activeThemeObj.shapeFill,
                  fontFamily: activeThemeObj.cssBodyFont,
                  '--header-font': activeThemeObj.cssHeaderFont,
                  '--theme-bg': activeThemeObj.bkgd,
                  '--theme-text': activeThemeObj.textColor,
                  '--theme-accent': activeThemeObj.accent,
                  '--theme-shape': activeThemeObj.shapeFill
                }}
              >
                {(customBackground?.type === 'image' || customBackground?.type === 'gradient') && (
                  <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: customBackground.overlayColor || '#000000', opacity: customBackground.overlayOpacity ?? 0.5 }}></div>
                )}
                <div className="absolute top-0 left-0 w-full h-1 z-10" style={{ backgroundColor: activeThemeObj.accent }}></div>
                <div className="relative z-10 w-full h-full">
                  <SlideRenderer slide={slide} slideSize={slideSize} customBackground={customBackground} />
                </div>
              </div>
            </motion.div>
          ))}
          
          <button 
            onClick={handleAddSlide}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 text-gray-400 hover:text-violet-300 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-125 transition-transform" />
            Add Slide
          </button>

          <IncrementalChat 
            slides={slides} 
            onAddSlide={(newSlide) => setSlides([...slides, newSlide])} 
            baseUrl={baseUrl} 
            model={model} 
          />
        </div>
      </div>

      {/* RIGHT DRAWER: Controls */}
      <div className="w-80 flex-shrink-0">
        <div className="glass-panel h-full flex flex-col overflow-hidden">
          
          <div className="flex border-b border-white/10">
            <button onClick={() => setActiveTab('theme')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'theme' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="flex flex-col items-center justify-center gap-1"><Palette className="w-4 h-4"/> Theme</span>
            </button>
            <button onClick={() => setActiveTab('layout')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'layout' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="flex flex-col items-center justify-center gap-1"><LayoutTemplate className="w-4 h-4"/> Layout</span>
            </button>
            <button onClick={() => setActiveTab('background')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'background' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="flex flex-col items-center justify-center gap-1"><ImageIcon className="w-4 h-4"/> Bkgd</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'settings' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}>
              <span className="flex flex-col items-center justify-center gap-1"><Settings className="w-4 h-4"/> Export</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'theme' && (
              <div className="space-y-4">
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Presets</h4>
                 <div className="space-y-2">
                   {THEME_PRESETS.map(preset => (
                      <button 
                        key={preset.id} 
                        onClick={() => setTheme(preset.name)}
                        className={`w-full p-3 rounded-xl text-left border transition-all ${theme === preset.name ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:bg-white/5 hover:border-white/20'}`}
                      >
                        <div className="text-sm font-bold text-gray-200">{preset.name}</div>
                        <div className="text-xs text-gray-400 mt-1" style={{ fontFamily: preset.headerFont }}>Heading</div>
                        <div className="text-xs text-gray-400" style={{ fontFamily: preset.bodyFont }}>Body Text</div>
                      </button>
                   ))}
                   <button 
                     onClick={() => setTheme('Custom')}
                     className={`w-full p-3 rounded-xl text-left border transition-all ${theme === 'Custom' ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:bg-white/5 hover:border-white/20'}`}
                   >
                     <div className="text-sm font-bold text-gray-200">Custom...</div>
                   </button>
                 </div>

                 <AnimatePresence>
                   {theme === 'Custom' && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 overflow-hidden pt-4 border-t border-white/10">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-400">Background Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={'#' + customThemeSettings.bkgd} onChange={e => setCustomThemeSettings({...customThemeSettings, bkgd: e.target.value.replace('#', '')})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                            <input type="text" value={customThemeSettings.bkgd} onChange={e => setCustomThemeSettings({...customThemeSettings, bkgd: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-400">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={'#' + customThemeSettings.textColor} onChange={e => setCustomThemeSettings({...customThemeSettings, textColor: e.target.value.replace('#', '')})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                            <input type="text" value={customThemeSettings.textColor} onChange={e => setCustomThemeSettings({...customThemeSettings, textColor: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-400">Accent Color</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={'#' + customThemeSettings.accent} onChange={e => setCustomThemeSettings({...customThemeSettings, accent: e.target.value.replace('#', '')})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                            <input type="text" value={customThemeSettings.accent} onChange={e => setCustomThemeSettings({...customThemeSettings, accent: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-gray-400">Typography / Font</label>
                          <select value={customThemeSettings.fontFace} onChange={e => setCustomThemeSettings({...customThemeSettings, fontFace: e.target.value})} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none w-full appearance-none">
                            <option value="Helvetica Neue">Helvetica Neue (Modern)</option>
                            <option value="Arial">Arial (Clean)</option>
                            <option value="Consolas">Consolas (Code)</option>
                            <option value="Georgia">Georgia (Editorial)</option>
                            <option value="Times New Roman">Times New Roman (Academic)</option>
                          </select>
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                    <Type className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300 leading-relaxed">Theme colors and fonts will be natively applied when you download the final PPTX file.</p>
                 </div>
              </div>
            )}
            
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button onClick={() => setCustomBackground({...customBackground, type: 'solid'})} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${customBackground.type === 'solid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Solid</button>
                  <button onClick={() => setCustomBackground({...customBackground, type: 'gradient'})} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${customBackground.type === 'gradient' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Gradient</button>
                  <button onClick={() => setCustomBackground({...customBackground, type: 'image'})} className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${customBackground.type === 'image' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>Image</button>
                </div>
                
                {customBackground.type === 'solid' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Hex Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={customBackground.value.startsWith('#') ? customBackground.value : '#000000'} onChange={e => setCustomBackground({...customBackground, value: e.target.value})} className="w-10 h-10 rounded border-none bg-transparent cursor-pointer" />
                      <input type="text" value={customBackground.value} onChange={e => setCustomBackground({...customBackground, value: e.target.value})} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none placeholder-gray-600" placeholder="#0B0F17" />
                    </div>
                  </div>
                )}
                
                {customBackground.type === 'gradient' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                        'linear-gradient(45deg, #4c1d95 0%, #000000 100%)',
                        'linear-gradient(180deg, #083344 0%, #020617 100%)',
                        'radial-gradient(circle at top right, #312e81, #000000)',
                        'linear-gradient(to right, #1a2980, #26d0ce)',
                        'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)'
                      ].map((grad, i) => (
                        <div key={i} onClick={() => setCustomBackground({...customBackground, value: grad})} className={`h-16 rounded-lg cursor-pointer border-2 transition-all ${customBackground.value === grad ? 'border-violet-500 scale-105' : 'border-transparent hover:border-white/20'}`} style={{ background: grad }}></div>
                      ))}
                    </div>
                  </div>
                )}
                
                {customBackground.type === 'image' && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upload Local Image</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 transition-colors relative cursor-pointer">
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCustomBackground({...customBackground, value: reader.result});
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                      <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-400 font-medium">Click or Drop Image</span>
                    </div>
                    {customBackground.value && customBackground.value.startsWith('data:image') && (
                      <div className="mt-2 text-xs text-green-400 font-bold flex items-center gap-1">✓ Image Loaded</div>
                    )}
                    
                    <div className="pt-4 border-t border-white/10">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">AI Generator</label>
                      <button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-lg text-sm">
                        Generate via Local AI
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overlay Controls</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={customBackground.overlayColor} onChange={e => setCustomBackground({...customBackground, overlayColor: e.target.value})} className="w-8 h-8 rounded border-none bg-transparent cursor-pointer" />
                    <span className="text-xs text-gray-400 font-medium">Overlay Color</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Opacity</span>
                      <span>{Math.round(customBackground.overlayOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={customBackground.overlayOpacity} onChange={e => setCustomBackground({...customBackground, overlayOpacity: parseFloat(e.target.value)})} className="w-full accent-violet-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'layout' && (
              <div className="space-y-4">
                 <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide Dimensions</label>
                    <div className="space-y-2">
                      {[
                        { id: 'LAYOUT_16x9', name: '16:9 (Standard Modern)', desc: 'Best for modern screens and projectors.' },
                        { id: 'LAYOUT_4x3', name: '4:3 (Legacy Tall)', desc: 'Best for older projectors or iPads.' },
                        { id: 'LAYOUT_16x10', name: '16:10 (Widescreen)', desc: 'Best for Macbooks and wide monitors.' }
                      ].map(layout => (
                        <button 
                          key={layout.id} 
                          onClick={() => setSlideSize(layout.id)}
                          className={`w-full p-3 rounded-xl text-left border transition-all ${slideSize === layout.id ? 'border-violet-500 bg-violet-500/10' : 'border-white/10 hover:bg-white/5'}`}
                        >
                          <div className="text-sm font-bold text-gray-200">{layout.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{layout.desc}</div>
                        </button>
                      ))}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                 <button onClick={() => onExport('local')} disabled={isExporting} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                   {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : null} Download PPTX
                 </button>
                 <button onClick={() => onExport('drive')} disabled={isExporting} className="w-full py-3 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/20 rounded-xl font-bold transition-all disabled:opacity-50">
                   Export to Drive
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
