import React, { useState } from 'react';
import { Settings, Server, CheckCircle2, XCircle, Search, Key } from 'lucide-react';
import axios from 'axios';

export default function SettingsPanel({ settings, onSettingsChange, darkMode = true }) {
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'layout'

  const handleConfigChange = (type, key, value) => {
    onSettingsChange({
      ...settings,
      [type]: {
        ...settings[type],
        [key]: value
      }
    });
  };

  const labelColor = darkMode ? 'text-gray-300' : 'text-gray-700';
  const headerColor = darkMode ? 'text-white' : 'text-gray-900';
  const inputStyle = darkMode
    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:border-violet-500/50'
    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:border-violet-500';
  const tabActive = darkMode ? 'text-violet-400 border-b-2 border-violet-400 bg-white/5' : 'text-violet-600 border-b-2 border-violet-600 bg-violet-50';
  const tabInactive = darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900';

  const renderConfig = (configType, config) => (
    <div className="space-y-4 pt-4">
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Base URL</label>
        <input 
          type="text" 
          className={`w-full px-4 py-2 text-sm outline-none transition-all ${inputStyle}`}
          value={config.baseUrl || ''}
          onChange={(e) => handleConfigChange(configType, 'baseUrl', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelColor}`}>API Key (Optional for Local)</label>
        <div className="relative">
          <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="password" 
            className={`w-full pl-9 pr-4 py-2 text-sm outline-none transition-all ${inputStyle}`}
            value={config.apiKey || ''}
            onChange={(e) => handleConfigChange(configType, 'apiKey', e.target.value)}
            placeholder="sk-..."
          />
        </div>
      </div>
      <div>
        <label className={`block text-sm font-medium mb-1 ${labelColor}`}>Model Name</label>
        <input 
          type="text" 
          className={`w-full px-4 py-2 text-sm outline-none transition-all ${inputStyle}`}
          value={config.model || ''}
          onChange={(e) => handleConfigChange(configType, 'model', e.target.value)}
          placeholder={configType === 'layoutConfig' ? 'qwen_layout_mlx' : 'gpt-4o'}
        />
      </div>
    </div>
  );

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-violet-400" />
        <h2 className={`text-lg font-bold ${headerColor}`}>LLM Settings</h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button onClick={() => setActiveTab('content')} className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'content' ? tabActive : tabInactive}`}>
          Main LLM
        </button>
        <button onClick={() => setActiveTab('layout')} className={`flex-1 py-2 text-sm font-bold transition-colors ${activeTab === 'layout' ? tabActive : tabInactive}`}>
          Layout LLM
        </button>
      </div>

      {activeTab === 'content' && renderConfig('contentConfig', settings.contentConfig || {})}
      {activeTab === 'layout' && renderConfig('layoutConfig', settings.layoutConfig || {})}

    </div>
  );
}
