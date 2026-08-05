import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Server, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';

export default function SettingsPanel({ settings, onSettingsChange, darkMode = true }) {
  const [status, setStatus] = useState('idle'); // idle, testing, connected, error, discovering
  const [errorMsg, setErrorMsg] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  useEffect(() => {
    discoverServer();
  }, []);

  const discoverServer = async () => {
    setStatus('discovering');
    try {
      const response = await axios.get('http://localhost:3000/api/discover');
      if (response.data.status === 'found') {
        const { baseUrl, models } = response.data;
        setAvailableModels(models);
        
        const getId = (m) => m.id || m.name || (typeof m === 'string' ? m : '');
        let newModel = settings.model;
        if (!models.find(m => getId(m) === settings.model)) {
          newModel = getId(models[0]);
        }
        
        onSettingsChange({ baseUrl, model: newModel });
        setStatus('connected');
      } else {
        setStatus('idle');
      }
    } catch (err) {
      setStatus('idle');
    }
  };

  const testConnection = async () => {
    setStatus('testing');
    try {
      const response = await axios.post('http://localhost:3000/api/models', {
        baseUrl: settings.baseUrl
      });
      setStatus('connected');
      if (response.data.models && response.data.models.length > 0) {
        setAvailableModels(response.data.models);
        
        // Helper to extract string ID from model object
        const getId = (m) => m.id || m.name || (typeof m === 'string' ? m : '');
        
        // Automatically select the first model if the current one isn't in the list
        if (!response.data.models.find(m => getId(m) === settings.model)) {
          onSettingsChange({ ...settings, model: getId(response.data.models[0]) });
        }
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || err.message);
      setAvailableModels([]);
    }
  };

  const labelColor = darkMode ? 'text-gray-300' : 'text-gray-700';
  const headerColor = darkMode ? 'text-white' : 'text-gray-900';
  const inputStyle = darkMode
    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 rounded-xl focus:border-violet-500/50'
    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl focus:border-violet-500';
  const btnStyle = darkMode
    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200';

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-violet-400" />
          <h2 className={`text-lg font-bold ${headerColor}`}>Connection Settings</h2>
        </div>
        <button 
          onClick={discoverServer}
          title="Auto-discover local servers"
          className="p-2 text-violet-500 hover:bg-violet-500/10 rounded-full transition-colors"
        >
          <Search className={`w-4 h-4 ${status === 'discovering' ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${labelColor}`}>
            Local API Base URL
          </label>
          <input 
            type="text" 
            className={`w-full px-4 py-2 text-sm outline-none transition-all ${inputStyle}`}
            value={settings.baseUrl}
            onChange={(e) => onSettingsChange({ ...settings, baseUrl: e.target.value })}
            placeholder="http://127.0.0.1:1234/v1"
          />
          <p className="text-xs text-gray-400 mt-1">LM Studio: port 1234</p>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${labelColor}`}>
            Model Name
          </label>
          {availableModels.length > 0 ? (
            <select 
              className={`w-full px-4 py-2 text-sm outline-none appearance-none cursor-pointer transition-all ${inputStyle}`}
              value={settings.model}
              onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
            >
              {availableModels.map((model, idx) => {
                const modelId = model.id || model.name || (typeof model === 'string' ? model : `model-${idx}`);
                return <option key={modelId} value={modelId} className={darkMode ? 'bg-[#131B2A] text-white' : 'bg-white text-gray-900'}>{modelId}</option>;
              })}
            </select>
          ) : (
            <input 
              type="text" 
              className={`w-full px-4 py-2 text-sm outline-none transition-all ${inputStyle}`}
              value={settings.model}
              onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
              placeholder="deepseek-coder-v2-lite-instruct-mlx"
            />
          )}
        </div>

        <button 
          onClick={testConnection}
          className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${btnStyle}`}
        >
          <Server className="w-4 h-4" />
          Test Connection
        </button>

        {status === 'discovering' && (
          <div className="flex items-center gap-2 text-blue-400 text-sm p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching for local AI...
          </div>
        )}

        {status === 'testing' && (
          <div className="flex items-center gap-2 text-blue-400 text-sm p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Loader2 className="w-4 h-4 animate-spin" /> Testing connection...
          </div>
        )}
        
        {status === 'connected' && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Connected to Local LLM
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-xl border border-red-500/20 break-all">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
