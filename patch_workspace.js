const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Workspace.jsx', 'utf8');

// 1. Props
code = code.replace(
  'setCustomThemeSettings, baseUrl, model }) {',
  'setCustomThemeSettings, customBackground, setCustomBackground, baseUrl, model }) {'
);

// 2. Tabs
const tabsRegex = /<button onClick=\{\(\) => setActiveTab\('layout'\)\}[\s\S]*?<\/button>/;
const bgTabStr = `            <button onClick={() => setActiveTab('background')} className={\`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors \${activeTab === 'background' ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-gray-500 hover:text-gray-300'}\`}>
              <span className="flex flex-col items-center justify-center gap-1"><ImageIcon className="w-4 h-4"/> Bkgd</span>
            </button>
`;
code = code.replace(tabsRegex, bgTabStr + code.match(tabsRegex)[0]);

// 3. Tab Content
const bgContent = `
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button onClick={() => setCustomBackground({...customBackground, type: 'solid'})} className={\`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors \${customBackground.type === 'solid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}\`}>Solid</button>
                  <button onClick={() => setCustomBackground({...customBackground, type: 'gradient'})} className={\`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors \${customBackground.type === 'gradient' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}\`}>Gradient</button>
                  <button onClick={() => setCustomBackground({...customBackground, type: 'image'})} className={\`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors \${customBackground.type === 'image' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'}\`}>Image</button>
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
                        <div key={i} onClick={() => setCustomBackground({...customBackground, value: grad})} className={\`h-16 rounded-lg cursor-pointer border-2 transition-all \${customBackground.value === grad ? 'border-violet-500 scale-105' : 'border-transparent hover:border-white/20'}\`} style={{ background: grad }}></div>
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
`;

const exportTabRegex = /\{activeTab === 'layout' && \([\s\S]*?\}\)/;
code = code.replace(exportTabRegex, code.match(exportTabRegex)[0] + bgContent);

fs.writeFileSync('frontend/src/components/Workspace.jsx', code);
console.log("Patched Workspace");
